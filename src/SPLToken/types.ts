import { PublicKey, Account } from "@solana/web3.js"

export interface InitMintParams {
  freezeAuthority?: PublicKey
  mintAuthority: PublicKey
  decimals: number

  account?: Account
}

export interface InitMintInstructionParams extends InitMintParams {
  token: PublicKey
}

export interface InitAccountParams {
  token: PublicKey
  owner: PublicKey
  account?: Account
}

export interface InitAccountInstructionParams {
  account: PublicKey
  token: PublicKey
  owner: PublicKey
}

export interface InitWrappedNativeAccountParams {
  amount: number
  owner: PublicKey
  account?: Account
}

export interface MintToParams {
  token: PublicKey
  to: PublicKey
  amount: bigint
  authority: Account | PublicKey
  multiSigners: Account[]
}

export interface ApproveParams {
  account: PublicKey
  delegate: PublicKey
  amount: bigint
  authority: Account | PublicKey
  multiSigners: Account[]
}

export interface RevokeParams {
  account: PublicKey
  authority: Account | PublicKey
  multiSigners: Account[]
}

export interface BurnParams {
  token: PublicKey
  from: PublicKey
  amount: bigint
  autority: Account | PublicKey
  multiSigners: Account[]
}

export interface TransferParams {
  from: PublicKey
  to: PublicKey
  amount: bigint
  autority: Account | PublicKey
  multiSigners: Account[]
}

export interface MintToInstructionParams extends MintToParams {
}

export interface ApproveInstructionParams extends ApproveParams {
}

export interface RevokeInstructionParams extends RevokeParams {
}

export interface BurnInstructionParams extends BurnParams {
}

export interface TransferInstructionParams extends TransferParams {
}
