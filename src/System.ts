import { Wallet } from './Wallet';

import {
  PublicKey,
  SystemProgram,
} from "@solana/web3.js"

export interface RentFreeAccountInstruction {
  newPubicKey: PublicKey
  programID: PublicKey
  space: number
}

export interface TransferInstructionParams {
  to: PublicKey
  amount: number
}

export class System {
  constructor(private wallet: Wallet) {}

  public accountInfo(pubkey: PublicKey) {
    return this.wallet.conn.getAccountInfo(pubkey)
  }

  public async createRentFreeAccountInstruction(params: RentFreeAccountInstruction) {
    const balance = await this.wallet.conn.getMinimumBalanceForRentExemption(params.space);

    return SystemProgram.createAccount({
      fromPubkey: this.wallet.account.publicKey,
      newAccountPubkey: params.newPubicKey,
      lamports: balance,
      space: params.space,
      programId: params.programID,
    });
  }

  public createTransferInstruction(params: TransferInstructionParams) {
    const { to, amount } = params;
    return SystemProgram.transfer({
      fromPubkey: this.wallet.account.publicKey, 
      toPubkey: to, 
      lamports: amount,
    });
  }
}