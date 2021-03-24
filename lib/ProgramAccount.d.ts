/// <reference types="node" />
import { PublicKey } from "@solana/web3.js";
export declare class ProgramAccount {
    pubkey: PublicKey;
    seeds: Buffer[];
    nonce: number;
    programID: PublicKey;
    static forSeeds(seeds: Buffer[], programID: PublicKey): Promise<ProgramAccount>;
    constructor(pubkey: PublicKey, seeds: Buffer[], nonce: number, programID: PublicKey);
    get address(): string;
}
