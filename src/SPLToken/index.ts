import { TransactionInstruction, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';

import {
  MintLayout,
  AccountLayout,
  MintInfo,
  AccountInfo,
} from "@solana/spl-token"

import BaseProgram from '../BaseProgram';
import { Wallet, System, Account, PublicKey } from '..';

import BufferLayout from 'buffer-layout';

import {
  InitMintParams, InitMintInstructionParams, 
  InitAccountParams, InitAccountInstructionParams,
  MintToParams, ApproveParams, RevokeParams,
  BurnParams, MintToInstructionParams, ApproveInstructionParams,
  RevokeInstructionParams, BurnInstructionParams, TransferParams,
  TransferInstructionParams, InitWrappedNativeAccountParams,
} from './types';

import { uint64, u64LEBuffer, u64FromBuffer, publicKey } from '../util/encoding';

/**
 * Implemented 
 * 
 * `mintInfo`, `accountInfo`, `initializeMint(createMint)`, 
 * `initializeAccount(createAccount)`, `initializeWrappedNativeAccount`, `mintTo`,
 * `approve`, `revoke`, `burn`, `transfer`
 * 
 * TODO
 * 
 * `getMultisigInfo`, `setAuthority`, `closeAccount`, `freezeAccount`, `thawAccount`
 * `transfer2`, `approve2`, `revoke2`, `burn2`, `mintTo2`
 */

 // The address of the special mint for wrapped native token.
export const NATIVE_MINT: PublicKey = new PublicKey(
  'So11111111111111111111111111111111111111112',
);

export default class SPLToken extends BaseProgram {
  static programID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")

  private sys: System
  constructor(wallet: Wallet, programID = SPLToken.programID) {
    super(wallet, programID)
    this.sys = new System(this.wallet)
  }

  /**
   * Retrieve mint information
   * 
   * @param token Public key of the token
   */
  public async mintInfo(token: PublicKey): Promise<MintInfo> {
    const info = await this.wallet.conn.getAccountInfo(token);
    if (info === null) {
      throw new Error('Failed to find mint account');
    }
    if (!info.owner.equals(this.programID)) {
      throw new Error(`Invalid mint owner: ${JSON.stringify(info.owner)}`);
    }
    if (info.data.length != MintLayout.span) {
      throw new Error(`Invalid mint size`);
    }

    const data = Buffer.from(info.data);
    const mintInfo = MintLayout.decode(data);

    if (mintInfo.mintAuthorityOption === 0) {
      mintInfo.mintAuthority = null;
    } else {
      mintInfo.mintAuthority = new PublicKey(mintInfo.mintAuthority);
    }

    mintInfo.supply = mintInfo.supply.readBigUInt64LE();
    mintInfo.isInitialized = mintInfo.isInitialized != 0;

    if (mintInfo.freezeAuthorityOption === 0) {
      mintInfo.freezeAuthority = null;
    } else {
      mintInfo.freezeAuthority = new PublicKey(mintInfo.freezeAuthority);
    }
    return mintInfo;
  }

  /**
   * Retrieve account information
   *
   * @param account Public key of the account
   */
  public async accountInfo(account: PublicKey): Promise<AccountInfo> {
    const info = await this.conn.getAccountInfo(account);
    if (info === null) {
      throw new Error('Failed to find account');
    }
    if (!info.owner.equals(this.programID)) {
      throw new Error(`Invalid account owner`);
    }
    if (info.data.length != AccountLayout.span) {
      throw new Error(`Invalid account size`);
    }

    const data = Buffer.from(info.data);
    const accountInfo = AccountLayout.decode(data);
    accountInfo.mint = new PublicKey(accountInfo.mint);
    accountInfo.owner = new PublicKey(accountInfo.owner);
    accountInfo.amount = u64FromBuffer(accountInfo.amount);

    if (accountInfo.delegateOption === 0) {
      accountInfo.delegate = null;
      accountInfo.delegatedAmount = BigInt(0);
    } else {
      accountInfo.delegate = new PublicKey(accountInfo.delegate);
      accountInfo.delegatedAmount = u64FromBuffer(accountInfo.delegatedAmount);
    }

    accountInfo.isInitialized = accountInfo.state !== 0;
    accountInfo.isFrozen = accountInfo.state === 2;

    if (accountInfo.isNativeOption === 1) {
      accountInfo.rentExemptReserve = u64FromBuffer(accountInfo.isNative);
      accountInfo.isNative = true;
    } else {
      accountInfo.rentExemptReserve = null;
      accountInfo.isNative = false;
    }

    if (accountInfo.closeAuthorityOption === 0) {
      accountInfo.closeAuthority = null;
    } else {
      accountInfo.closeAuthority = new PublicKey(accountInfo.closeAuthority);
    }

    return accountInfo;
  }

  /**
   * Creates a new token with zero supply
   *
   * @param mintAuthority Account or multisig that will control minting
   * @param freezeAuthority Optional account or multisig that can freeze token accounts
   * @param decimals Location of the decimal place
   * @return Token object for the newly minted token
   */
  public async initializeMint(params: InitMintParams): Promise<Account> {
    const account = params.account || new Account()

    await this.sendTx([
      await this.sys.createRentFreeAccountInstruction({
        newPubicKey: account.publicKey,
        programID: this.programID,
        space: MintLayout.span
      }),
      this.initMintInstruction({
        token: account.publicKey,
        ...params,
      })
    ], [this.account, account])

    return account
  }

  private initMintInstruction(params: InitMintInstructionParams): TransactionInstruction {
    const layout = BufferLayout.struct([
      BufferLayout.u8('instruction'),
      BufferLayout.u8('decimals'),
      publicKey('mintAuthority'),
      BufferLayout.u8('option'),
      publicKey('freezeAuthority'),
    ]);

    const { token, decimals, mintAuthority, freezeAuthority } = params;

    return this.instructionEncode(layout, {
      instruction: 0, // InitializeMint instruction
      decimals,
      mintAuthority: mintAuthority.toBuffer(),
      option: !freezeAuthority ? 0 : 1,
      freezeAuthority: (freezeAuthority || new PublicKey(0)).toBuffer(),
    }, [
      { write: token },
      SYSVAR_RENT_PUBKEY,
    ]);
  }

  /**
   * Creates an account to hold token balance
   *
   * This account may then be used as a `transfer()` or `approve()` destination
   *
   * @param owner User account that will own the new account
   * @return Public key of the new empty account
   */
 
  public async initializeAccount(params: InitAccountParams): Promise<Account> {
    const account = params.account || new Account();

    await this.sendTx([
      await this.sys.createRentFreeAccountInstruction({
        newPubicKey: account.publicKey,
        programID: this.programID,
        space: AccountLayout.span
      }),
      this.initAccountInstruction({
        account: account.publicKey,
        token: params.token,
        owner: params.owner,
      })
    ], [this.account, account]);

    return account;
  }

  private initAccountInstruction(params: InitAccountInstructionParams): TransactionInstruction {
    const layout = BufferLayout.struct([BufferLayout.u8('instruction')]);

    return this.instructionEncode(layout, { instruction: 1 }, [
      { write: params.account },
      params.token,
      params.owner,
      SYSVAR_RENT_PUBKEY,
    ]);
  }

  /**
   * Create and initialize a new account on the special native token mint.
   *
   * In order to be wrapped, the account must have a balance of native tokens
   * when it is initialized with the token program.
   *
   * This function sends lamports to the new account before initializing it.
   *
   * @param onwer The owner of the new token account
   * @param amount The amount of lamports to wrap
   * @return {Promise<PublicKey>} The new token account
   */
  public async initializeWrappedNativeAccount(params: InitWrappedNativeAccountParams): Promise<Account> {
    const account = params.account || new Account();

    await this.sendTx([
      await this.sys.createRentFreeAccountInstruction({
        newPubicKey: account.publicKey,
        programID: this.programID,
        space: AccountLayout.span
      }),
      this.sys.createTransferInstruction({
        to: account.publicKey,
        amount: params.amount,
      }),
      this.initAccountInstruction({
        account: account.publicKey,
        token: NATIVE_MINT,
        owner: params.owner,
      })
    ], [this.account, account]);
    
    return account;
  }

  /**
   * Mint new tokens
   *
   * @param amount Amount to mint
   * @param token To mint token
   * @param to Public key of the account to mint to
   * @param authority Minting authority
   * @param multiSigners Signing accounts if `authority` is a multiSig
   */
  public async mintTo(params: MintToParams): Promise<void> {
    const { authority, multiSigners } = params;
    
    const signers = authority.constructor == Account ? [authority] : multiSigners

    await this.sendTx([this.mintToInstruction(params)], [this.account, ...signers])
  }

  private mintToInstruction(params: MintToInstructionParams): TransactionInstruction {
    const {
      amount,
      token,
      to,
      authority,
      multiSigners,
    } = params

    const layout = BufferLayout.struct([
      BufferLayout.u8('instruction'),
      uint64('amount'),
    ])

    return this.instructionEncode(layout, {
      instruction: 7, // MintTo instruction
      amount: u64LEBuffer(amount),
    }, [
      { write: token },
      { write: to },
      authority,
      multiSigners
    ]);

  }

  /**
   * Construct an Approve instruction
   *
   * @param amount Maximum number of tokens the delegate may transfer
   * @param account Public key of the account
   * @param delegate Account authorized to perform a transfer of tokens from the source account
   * @param authority Owner of the source account
   * @param multiSigners Signing accounts if `owner` is a multiSig
   */
  public async approve(params: ApproveParams): Promise<void> {
    const { authority, multiSigners } = params;
    
    const signers = authority.constructor == Account ? [authority] : multiSigners

    await this.sendTx([this.approveInstruction(params)], [this.account, ...signers]);
  }

  private approveInstruction(params: ApproveInstructionParams): TransactionInstruction {
    const {
      amount,
      account,
      delegate,
      authority,
      multiSigners,
    } = params;

    const layout = BufferLayout.struct([
      BufferLayout.u8('instruction'),
      uint64('amount'),
    ]);
    
    return this.instructionEncode(layout, {
      instruction: 4, // Approve instruction
      amount: u64LEBuffer(amount),
    }, [
      { write: account },
      delegate,
      authority,
      multiSigners
    ]);

  }

  /**
   * Remove approval for the transfer of any remaining tokens
   *
   * @param account Public key of the account
   * @param authority Owner of the source account
   * @param multiSigners Signing accounts if `owner` is a multiSig
   */
  public async revoke(params: RevokeParams): Promise<void> {
    const { authority, multiSigners } = params;

    const signers = authority.constructor == Account ? [authority] : multiSigners

    await this.sendTx([this.revokeInstruction(params)], [this.account, ...signers]);
  }

  private revokeInstruction(params: RevokeInstructionParams): TransactionInstruction {
    const { account, authority, multiSigners } = params;

    const layout = BufferLayout.struct([BufferLayout.u8('instruction')]);

    return this.instructionEncode(layout, { instruction: 5 }, [
      { write: account },
      authority,
      multiSigners
    ]);
  }

  /**
   * Burn tokens
   *
   * @param token The token pubkey
   * @param from  Burn from account
   * @param amount Amount to burn
   * @param authority Account owner
   * @param multiSigners Signing accounts if `owner` is a multiSig
   */
  public async burn(params: BurnParams): Promise<void> {
    const { autority, multiSigners } = params;

    const signers = autority.constructor == Account ? [autority] : multiSigners

    await this.sendTx([this.burnInstruction(params)], [this.account, ...signers]);
  }

  private burnInstruction(params: BurnInstructionParams): TransactionInstruction {
    const {
      token,
      from,
      amount,
      autority,
      multiSigners,
    } = params;

    const layout = BufferLayout.struct([
      BufferLayout.u8('instruction'),
      uint64('amount'),
    ]);
    
    return this.instructionEncode(layout, {
      instruction: 8, // Burn instruction
      amount: u64LEBuffer(amount),
    }, [
      { write: from },
      { write: token },
      autority,
      multiSigners
    ]);

  }

  /**
   * Transfer tokens to another account
   *
   * @param from Source account
   * @param to Destination account
   * @param amount Number of tokens to transfer
   * @param autority Owner of the source account
   * @param multiSigners Signing accounts if `owner` is a multiSig
   */
  public async transfer(params: TransferParams): Promise<void> {
    const { autority, multiSigners } = params;

    const signers = autority.constructor == Account ? [autority] : multiSigners

    await this.sendTx([this.transferInstruction(params)], [this.account, ...signers]);
  }

  private transferInstruction(params: TransferInstructionParams): TransactionInstruction{
    const {
      from,
      to,
      amount,
      autority,
      multiSigners,
    } = params;
    
    const layout = BufferLayout.struct([
      BufferLayout.u8('instruction'),
      uint64('amount'),
    ]);

    return this.instructionEncode(layout, {
      instruction: 3, // Transfer instruction
      amount: u64LEBuffer(amount),
    }, [
      { write: from },
      { write: to },
      autority,
      multiSigners
    ]);

  }

}
