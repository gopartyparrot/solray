import {
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  TransactionInstruction,
  Account,
  Connection,
} from "@solana/web3.js"

import { Wallet } from '.';

import BufferLayout from 'buffer-layout';

// BaseProgram offers some sugar around interacting with a program. Extend this abstract
// class with program specific instructions.
export abstract class BaseProgram {
  constructor(protected wallet: Wallet, public programID: PublicKey) { }

  protected get conn(): Connection {
    return this.wallet.conn
  }

  protected get account(): Account {
    return this.wallet.account
  }

  protected get pubkey(): PublicKey {
    return this.wallet.pubkey
  }


  // sendTx sends and confirm instructions in a transaction. It automatically adds
  // the wallet's account as a signer to pay for the transaction.
  protected async sendTx(insts: TransactionInstruction[], signers: Account[] = []): Promise<string> {
    const tx = new Transaction()

    for (let inst of insts) {
      tx.add(inst)
    }
   
    return await sendAndConfirmTransaction(this.conn, tx, signers, {
      commitment: this.conn.commitment,
      preflightCommitment: this.conn.commitment
    })
  }

  protected instructionEncode(
    layout: BufferLayout,
    data: any,
    authorities: InstructionAuthority[] = []): TransactionInstruction {
    const buffer = Buffer.alloc(layout.span);
    layout.encode(data, buffer)

    return this.instruction(buffer, authorities)
  }

  protected instruction(
    data: Buffer,
    authorities: InstructionAuthority[] = []): TransactionInstruction {
    return new TransactionInstruction({
      keys: authsToKeys(authorities),
      programId: this.programID,
      data,
    })
  }
}

export type InstructionAuthority = Account | Account[] | PublicKey[] | PublicKey | { write: PublicKey | Account }

function authsToKeys(auths: InstructionAuthority[]): InstructionKey[] {
  const keys: InstructionKey[] = []

  for (let auth of auths) {
    if (auth instanceof Array) {
      auth.forEach(a =>  keys.push(authToKey(a, false)));
    } else {
      keys.push(
        authToKey(auth['write'] || auth, !!auth['write'])
      );
    }
  }
  return keys
}

function authToKey(auth: Account | PublicKey, isWritable = false): InstructionKey {
  if (auth.constructor == Account) {
    return {
      pubkey: auth.publicKey,
      isSigner: true,
      isWritable,
    }
  } else if (auth.constructor == PublicKey) {
    return {
      pubkey: auth,
      isSigner: false,
      isWritable,
    }
  }

  throw new Error(`Invalid instruction authority. Expect Account | PublicKey`)
}

interface InstructionKey {
  pubkey: PublicKey;
  isSigner: boolean;
  isWritable: boolean;
}