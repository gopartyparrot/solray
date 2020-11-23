import BufferLayout from "buffer-layout"

/**
 * Layout for a public key
 */
export const publicKey = (property: string): Object => {
  return BufferLayout.blob(32, property);
}

// /**
//  * Layout for a 64bit unsigned value
//  */
export const uint64 = (property: string = 'uint64'): Object => {
  return BufferLayout.blob(8, property);
}

export function u64FromBuffer(buf: Buffer): bigint {
  return buf.readBigUInt64LE()
}

export function u64LEBuffer(n: bigint): Buffer {
  const buf = Buffer.allocUnsafe(8)
  buf.writeBigUInt64LE(n)
  return buf
}