import { Connection } from "@solana/web3.js"

export { Account, PublicKey } from "@solana/web3.js"
export { default as Wallet } from "./Wallet"
export { default as SPLToken } from "./SPLToken"
export { default as ProgramAccount } from "./ProgramAccount"
export { default as BaseProgram } from "./BaseProgram"
export { default as BPFLoader } from "./BPFLoader"
export { default as System } from "./System"

export type NetworkName = "local" | "dev" | "main"

export namespace solana {
  export function connect(networkName: NetworkName, opts: { commitment?: string } = {}): Connection {
    const commitment = opts.commitment || "singleGossip"

    switch (networkName) {
      case "local":
        return new Connection("http://localhost:8899", commitment as any)
      case "dev":
        return new Connection("https://devnet.solana.com", commitment as any)
      default:
        throw new Error(`Unknown network to connect to: ${networkName}`)
    }
  }
}
