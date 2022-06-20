/// <reference types="node" />
import { Account } from "@solana/web3.js";
import { Wallet } from '.';
export declare class BPFLoader {
    private wallet;
    programID: import("@solana/web3.js").PublicKey;
    static programID: import("@solana/web3.js").PublicKey;
    constructor(wallet: Wallet, programID?: import("@solana/web3.js").PublicKey);
    loadFile(binaryPath: string, programAccount?: Account): Promise<Account>;
    load(programBinary: Buffer, programAccount?: Account): Promise<Account>;
}
