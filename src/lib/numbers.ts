/*
  Integer representations used across the site: unsigned and two's-complement
  binary, hex, sign extension, and n-bit addition with every carry recorded so
  overflow can be shown and checked. Values are BigInt internally so 32- and
  64-bit patterns are exact.
*/

export const pow2 = (n: number) => 1n << BigInt(n)

/** Bits of an unsigned or two's-complement value, MSB first. Throws if it does not fit. */
export function toBits(value: number | bigint, bits: number, signed = false): string {
  const v = BigInt(value)
  const lo = signed ? -pow2(bits - 1) : 0n
  const hi = signed ? pow2(bits - 1) - 1n : pow2(bits) - 1n
  if (v < lo || v > hi) throw new Error(`${v} does not fit in ${bits} ${signed ? "signed" : "unsigned"} bits`)
  const u = v < 0n ? v + pow2(bits) : v
  return u.toString(2).padStart(bits, "0")
}

/** Value of a bit string (spaces and underscores ignored). */
export function fromBits(bits: string, signed = false): bigint {
  const b = bits.replace(/[\s_]/g, "")
  if (!/^[01]+$/.test(b)) throw new Error(`not a bit string: ${bits}`)
  const u = BigInt("0b" + b)
  return signed && b[0] === "1" ? u - pow2(b.length) : u
}

export const toHex = (bits: string) => {
  const b = bits.replace(/[\s_]/g, "")
  if (b.length % 4) throw new Error("hex needs a multiple of 4 bits")
  return BigInt("0b" + b).toString(16).toUpperCase().padStart(b.length / 4, "0")
}

export const hexToBits = (hex: string, bits?: number) => {
  const h = hex.replace(/^0x/i, "").replace(/[\s_]/g, "")
  return BigInt("0x" + h).toString(2).padStart(bits ?? h.length * 4, "0")
}

/** Groups a bit string in fours for display: "0010 0000 0000 0001". */
export const group4 = (bits: string) => bits.replace(/[\s_]/g, "").replace(/(.{4})(?=.)/g, "$1 ")

export function signExtend(bits: string, to: number) {
  const b = bits.replace(/[\s_]/g, "")
  return b[0].repeat(to - b.length) + b
}

/** Two's-complement negation of a bit pattern (invert, add 1), same width. */
export function negateBits(bits: string) {
  const b = bits.replace(/[\s_]/g, "")
  const inv = [...b].map((c) => (c === "0" ? "1" : "0")).join("")
  return addBits(inv, "0".repeat(b.length - 1) + "1").sum
}

export type AddResult = {
  sum: string
  /** carries[i] is the carry INTO bit i counted from the right (carries[0] = carry-in); carries[n] = carry-out. */
  carries: number[]
  carryOut: number
  /** Signed overflow: carry into the sign bit differs from carry out of it. */
  overflow: boolean
}

/** n-bit binary addition a + b + cin, recording every carry. */
export function addBits(a: string, b: string, cin = 0): AddResult {
  const x = a.replace(/[\s_]/g, "")
  const y = b.replace(/[\s_]/g, "")
  if (x.length !== y.length) throw new Error("operands must have equal width")
  const n = x.length
  const carries = [cin]
  let sum = ""
  for (let i = 0; i < n; i++) {
    const p = +x[n - 1 - i]
    const q = +y[n - 1 - i]
    const c = carries[i]
    sum = String(p ^ q ^ c) + sum
    carries.push((p & q) | (p & c) | (q & c))
  }
  return { sum, carries, carryOut: carries[n], overflow: carries[n] !== carries[n - 1] }
}

/** a − b on n bits as a + (¬b) + 1, the way the hardware does it. */
export function subBits(a: string, b: string): AddResult {
  const inv = [...b.replace(/[\s_]/g, "")].map((c) => (c === "0" ? "1" : "0")).join("")
  return addBits(a, inv, 1)
}

/** Decimal fraction to binary, exactly when the denominator is a power of 2. Returns "-0.11" style text. */
export function fracToBinary(num: number, maxBits = 64): string {
  const neg = num < 0
  let v = Math.abs(num)
  const int = Math.floor(v)
  v -= int
  let s = int.toString(2) + "."
  let k = 0
  while (v > 0 && k < maxBits) {
    v *= 2
    if (v >= 1) {
      s += "1"
      v -= 1
    } else s += "0"
    k++
  }
  if (v > 0) throw new Error(`${num} has no exact binary expansion within ${maxBits} bits`)
  if (s.endsWith(".")) s += "0"
  return (neg ? "-" : "") + s
}
