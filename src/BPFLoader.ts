import {
  Account,
  BpfLoader,
  BPF_LOADER_PROGRAM_ID,
} from "@solana/web3.js"

import { Wallet } from './Wallet'

export class BPFLoader {

  constructor(private wallet: Wallet) { }

  public async load(programBinary: Buffer, programAccount = new Account()): Promise<Account> {
    await BpfLoader.load(
      this.wallet.conn,
      this.wallet.account,
      programAccount,
      programBinary,
      BPF_LOADER_PROGRAM_ID,
    );

    return programAccount;
  }
}