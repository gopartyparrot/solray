import { Connection } from "@solana/web3.js";

export { Account, PublicKey } from "@solana/web3.js";
export { Wallet } from "./Wallet";
export { SPLToken } from "./SPLToken";
export { ProgramAccount } from "./ProgramAccount";
export { BaseProgram } from "./BaseProgram";
export { BPFLoader } from "./BPFLoader";
export { System } from "./System";
export { Deployer } from "./Deployer";

export interface IConnectOptions {
  commitment?: string;
  rpcHost?: string;
}

const defaultRPCHosts = {
  local: "http://localhost:8899",

  dev: "https://devnet.solana.com",
  devnet: "https://devnet.solana.com",

  main: "https://api.mainnet-beta.solana.com",
  mainnet: "https://api.mainnet-beta.solana.com",
};

export namespace solana {
  export function connect(
    networkName: string,
    opts: IConnectOptions = {},
  ): Connection {
    const commitment = opts.commitment || "singleGossip";

    const rpcHost = opts.rpcHost || defaultRPCHosts[networkName];

    if (!rpcHost) {
      throw new Error(`Cannot find RPC Host to connect to: ${networkName}`);
    }

    return new Connection(rpcHost, commitment as any);
  }
}
