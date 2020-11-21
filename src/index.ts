import { Connection } from "@solana/web3.js"

export { Connection, Account, PublicKey } from "@solana/web3.js"
export { Wallet } from "./Wallet"
export { SPLToken } from "./SPLToken"
export { ProgramAccount } from "./ProgramAccount"
export { BaseProgram } from "./BaseProgram"
export { BPFLoader } from "./BPFLoader"
export { System } from "./System"

export type NetworkName = "dev" | "main"

export namespace solana {
  export function connect(networkName: NetworkName, opts: { commitment?: string } = {}): Connection {
    const commitment = opts.commitment || "singleGossip"

    switch (networkName) {
      case "dev":
        return new Connection("https://devnet.solana.com", commitment as any)
      default:
        throw new Error(`Unknown network to connect to: ${networkName}`)
    }
  }
}
