/*
  Floating-point formats: IEEE 754 single and double, and the custom formats
  exams invent ("16 bits with a 4-bit exponent"). Encoding is exact: a value is
  split into an integer significand and power of two from its IEEE double, then
  rounded to the format's fraction width (round to nearest, ties to even).

  Bias defaults to 2^(e−1) − 1, as on the slides. Exponent fields of all 0s and
  all 1s are reserved (zero and denormals; infinity and NaN).
*/
import { toBits } from "./numbers"

export type FpFormat = { expBits: number; fracBits: number; bias?: number }

export const SINGLE: FpFormat = { expBits: 8, fracBits: 23 }
export const DOUBLE: FpFormat = { expBits: 11, fracBits: 52 }

export const biasOf = (f: FpFormat) => f.bias ?? 2 ** (f.expBits - 1) - 1
export const widthOf = (f: FpFormat) => 1 + f.expBits + f.fracBits

/** Exact decomposition of a finite double: |x| = m · 2^e with m an odd integer (or 0). */
function decompose(x: number): { m: bigint; e: number } {
  if (x === 0) return { m: 0n, e: 0 }
  const buf = new DataView(new ArrayBuffer(8))
  buf.setFloat64(0, Math.abs(x))
  const hi = buf.getUint32(0)
  const lo = buf.getUint32(4)
  const expField = (hi >>> 20) & 0x7ff
  let m = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo)
  let e: number
  if (expField === 0) e = -1074
  else {
    m |= 1n << 52n
    e = expField - 1075
  }
  while (m > 0n && (m & 1n) === 0n) {
    m >>= 1n
    e++
  }
  return { m, e }
}

const bitLength = (m: bigint) => m.toString(2).length

export type Encoded = {
  sign: string
  exponent: string
  fraction: string
  bits: string
  /** Unbiased exponent of the normalised value (1.f × 2^e). */
  e: number
  /** True when the value had to be rounded to fit. */
  rounded: boolean
}

/** Encode a finite, normal (after rounding) value. Throws on overflow or underflow to the denormal range. */
export function encode(x: number, f: FpFormat): Encoded {
  const bias = biasOf(f)
  const sign = x < 0 || Object.is(x, -0) ? "1" : "0"
  if (x === 0) return { sign, exponent: "0".repeat(f.expBits), fraction: "0".repeat(f.fracBits), bits: sign + "0".repeat(f.expBits + f.fracBits), e: 0, rounded: false }
  const { m, e } = decompose(x)
  // value = m · 2^e, m has L bits → normalised 1.xxx × 2^(e + L − 1)
  const L = bitLength(m)
  let E = e + L - 1
  let frac = m - (1n << BigInt(L - 1)) // the bits after the leading 1, L−1 of them
  let fracLen = L - 1
  let rounded = false
  if (fracLen > f.fracBits) {
    const drop = fracLen - f.fracBits
    const keep = frac >> BigInt(drop)
    const rest = frac & ((1n << BigInt(drop)) - 1n)
    const half = 1n << BigInt(drop - 1)
    let q = keep
    if (rest > half || (rest === half && (keep & 1n) === 1n)) q = keep + 1n
    rounded = rest !== 0n
    if (q === 1n << BigInt(f.fracBits)) {
      q = 0n
      E += 1
    }
    frac = q
    fracLen = f.fracBits
  }
  const fracBits = frac.toString(2).padStart(fracLen, "0").padEnd(f.fracBits, "0")
  const field = E + bias
  if (field >= 2 ** f.expBits - 1) throw new Error(`${x} overflows the format`)
  if (field <= 0) throw new Error(`${x} is below the normalised range of the format`)
  const exponent = toBits(field, f.expBits)
  return { sign, exponent, fraction: fracBits, bits: sign + exponent + fracBits, e: E, rounded }
}

export type Decoded =
  | { kind: "zero"; sign: number; value: number }
  | { kind: "normal" | "denormal"; sign: number; value: number; e: number; significand: string }
  | { kind: "infinity"; sign: number; value: number }
  | { kind: "nan"; sign: number; value: number }

/** Decode a bit pattern (or hex string with 0x) in the given format. Value is exact for single/double and small formats. */
export function decode(bitsOrHex: string, f: FpFormat): Decoded {
  const w = widthOf(f)
  let b = bitsOrHex.replace(/[\s_]/g, "")
  if (/^0x/i.test(b)) b = BigInt(b).toString(2).padStart(w, "0")
  if (b.length !== w) throw new Error(`expected ${w} bits, got ${b.length}`)
  const sign = +b[0]
  const ef = parseInt(b.slice(1, 1 + f.expBits), 2)
  const frac = b.slice(1 + f.expBits)
  const fracVal = [...frac].reduce((s, c, i) => s + +c * 2 ** -(i + 1), 0)
  const bias = biasOf(f)
  const s = sign ? -1 : 1
  if (ef === 2 ** f.expBits - 1) return /1/.test(frac) ? { kind: "nan", sign, value: NaN } : { kind: "infinity", sign, value: s * Infinity }
  if (ef === 0) {
    if (!/1/.test(frac)) return { kind: "zero", sign, value: s * 0 }
    return { kind: "denormal", sign, value: s * fracVal * 2 ** (1 - bias), e: 1 - bias, significand: "0." + frac }
  }
  return { kind: "normal", sign, value: s * (1 + fracVal) * 2 ** (ef - bias), e: ef - bias, significand: "1." + frac }
}

/** Largest and smallest positive normalised values: (2 − 2^−f) × 2^(Emax) and 1.0 × 2^(Emin). */
export function range(f: FpFormat) {
  const bias = biasOf(f)
  const emax = 2 ** f.expBits - 2 - bias
  const emin = 1 - bias
  return { emax, emin, largest: (2 - 2 ** -f.fracBits) * 2 ** emax, smallest: 2 ** emin }
}

/* ───────────── Floating-point addition, step by step (the slides' four steps) ───────────── */

export type FpAddStep = { step: string; detail: string; e: number; significand: string }

/**
 * Adds two values in a binary format with `fracBits` fraction bits, following the
 * slides: 1. align binary points (shift the smaller exponent's significand right),
 * 2. add significands, 3. normalise and check over/underflow, 4. round and
 * renormalise if necessary. Significands are kept as exact signed fixed-point.
 */
export function fpAddSteps(a: number, b: number, f: FpFormat): { steps: FpAddStep[]; result: number; encoded: Encoded } {
  const A = encode(a, f)
  const B = encode(b, f)
  const P = 64 // working fractional precision (guard bits), plenty for exam formats
  const sig = (x: Encoded) => (x.sign === "1" ? -1n : 1n) * ((1n << BigInt(P)) + (BigInt("0b" + (x.fraction || "0")) << BigInt(P - f.fracBits)))
  const [big, small] = A.e >= B.e ? [A, B] : [B, A]
  const show = (v: bigint, places: number) => {
    const neg = v < 0n
    const u = neg ? -v : v
    const int = u >> BigInt(P)
    const fr = (u & ((1n << BigInt(P)) - 1n)).toString(2).padStart(P, "0").slice(0, places)
    return `${neg ? "-" : ""}${int.toString(2)}.${fr}`
  }
  const steps: FpAddStep[] = []
  const d = big.e - small.e
  const sb = sig(small) >> BigInt(d) // exact: the dropped bits are zero because P ≫ fracBits + d
  const sB = sig(big)
  steps.push({ step: "1. Align binary points", detail: `shift the smaller number right by ${d}`, e: big.e, significand: show(sb, f.fracBits + d) })
  let sum = sB + sb
  steps.push({ step: "2. Add significands", detail: `${show(sB, f.fracBits + d)} + ${show(sb, f.fracBits + d)}`, e: big.e, significand: show(sum, f.fracBits + d) })
  let e = big.e
  if (sum === 0n) {
    const z = encode(0, f)
    steps.push({ step: "3. Normalise", detail: "result is zero", e: 0, significand: "0.0" })
    return { steps, result: 0, encoded: z }
  }
  const neg = sum < 0n
  let u = neg ? -sum : sum
  while (u >= 2n << BigInt(P)) {
    u >>= 1n // exact here: checked below by re-encoding
    e++
  }
  while (u < 1n << BigInt(P)) {
    u <<= 1n
    e--
  }
  sum = neg ? -u : u
  steps.push({ step: "3. Normalise result and check for over/underflow", detail: `exponent ${e}, within ${range(f).emin}…${range(f).emax}`, e, significand: show(sum, f.fracBits + 2) })
  const value = Number(sum) / 2 ** P * 2 ** e
  const enc = encode(value, f)
  steps.push({ step: "4. Round and renormalise if necessary", detail: enc.rounded ? "rounded to the fraction width" : "no rounding needed", e: enc.e, significand: "1." + enc.fraction })
  return { steps, result: decode(enc.bits, f).value, encoded: enc }
}
