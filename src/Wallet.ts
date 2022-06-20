import nacl from "tweetnacl";

import * as bip39 from "bip39";
import * as bip32 from "bip32";

import { Account, Connection, PublicKey } from "@solana/web3.js";

import { System } from "./System";
import { BPFLoader } from "./BPFLoader";

function pathToAccount(path: bip32.BIP32Interface): Account {
  return new Account(
    nacl.sign.keyPair.fromSeed(path.privateKey as any).secretKey,
  );
}

export class Wallet {
  static generateMnemonic(bits = 128): string {
    return bip39.generateMnemonic(bits);
  }

  static async fromMnemonic(
    mnemonic: string,
    conn: Connection,
  ): Promise<Wallet> {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error("Invalid seed words");
    }

    const seed = await bip39.mnemonicToSeed(mnemonic);
    return Wallet.fromSeed(seed, conn);
  }

  static fromAccount(account: Account, conn: Connection): Wallet {
    const base = bip32
      .fromSeed(Buffer.from(account.secretKey))
      .derivePath(`m/501'/0'/0`);
    return new Wallet(account, base, conn);
  }

  static fromSeed(seed: Buffer, conn: Connection): Wallet {
    // The ticks ' are hardened keys. Keys in different harden paths
    // cannot correlated. Leaked unhardend key in a child path could leak
    // the secret key of its parent.
    //
    // TLDR: treat hardened paths as "accounts" that are firewalled.
    const base = bip32.fromSeed(seed).derivePath(`m/501'/0'/0`);

    return new Wallet(pathToAccount(base), base, conn);
  }

  private sys: System;

  constructor(
    public account: Account,
    public base: bip32.BIP32Interface,
    public conn: Connection,
  ) {
    this.sys = new System(this);
  }

  public get address(): string {
    return this.pubkey.toBase58();
  }

  public get pubkey(): PublicKey {
    return this.account.publicKey;
  }

  public deriveIndex(index: number): Wallet {
    const child = this.base.derive(index);
    return new Wallet(pathToAccount(child), child, this.conn);
  }

  public derive(subpath: string): Wallet {
    const child = this.base.derivePath(subpath);
    return new Wallet(pathToAccount(child), child, this.conn);
  }

  public deriveAccount(subpath: string): Account {
    return this.derive(subpath).account;
  }

  public async info(subpath?: string) {
    return this.sys.accountInfo(this.account.publicKey);
  }

  public async loadProgram(binPath: string): Promise<Account> {
    const bpfLoader = new BPFLoader(this);
    return bpfLoader.loadFile(binPath);
  }
}
