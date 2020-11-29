import { Account, Wallet } from "./index"

import { promises as fs } from "fs"
const { readFile, writeFile } = fs

interface AccountRecords {
  [key: string]: {
    secret: string,
    pubkey: string,
  }
}

export class Deployer {
  static async open(filePath: string): Promise<Deployer> {
    let records: AccountRecords = {}

    try {
      // FIXME: probably should do some data verification here...
      const jsonData = await readFile(filePath, "utf8")
      records = JSON.parse(jsonData)
    } finally {
      return new Deployer(records, filePath)
    }
  }

  constructor(private records: AccountRecords, public filePath: string) { }

  public async ensure(key: string, action: () => Promise<Account>): Promise<Account> {
    let account = this.account(key)
    if (account) {
      return account
    }

    account = await action()

    if (account == null) {
      throw new Error("deployer action must return an account")
    }

    this.records[key] = {
      pubkey: account.publicKey.toBase58(),
      secret: Buffer.from(account.secretKey).toString("hex"),
    }

    await this.save()

    return account
  }

  public account(key: string): Account | null {
    const keypair = this.records[key]

    if (!keypair) {
      return null
    }

    return new Account(Buffer.from(keypair.secret, "hex"))
  }

  private async save() {
    const jsonData = JSON.stringify(this.records, null, 2)
    await writeFile(this.filePath, jsonData, "utf8")
  }
}