
import {
  solana,
  Wallet,
} from ".."

async function main() {
  // Connect to https://devnet.solana.com
  const conn = solana.connect("dev")

  const mnemonic = "spin canyon tuition upset pioneer celery liquid conduct boy bargain dust seed"
  const wallet = await Wallet.fromMnemonic(mnemonic, conn)

  for (let i = 0; i < 10; i++) {
    // generate a subwallet on a hardened path
    const subwallet = wallet.derive(`${i}'`)
    console.log(i, subwallet.address)
  }
}

main().catch(err => console.log(err))