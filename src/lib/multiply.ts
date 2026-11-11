/*
  The two unsigned multipliers on Tushar Sir's Chapter 3 slides (P&H §3.3).

  First version (long-multiplication hardware): 2n-bit Multiplicand register
  (shifts left), n-bit Multiplier register (shifts right), 2n-bit Product
  register, 2n-bit ALU. Each of n repetitions:
    1. if Multiplier0 = 1, Product = Product + Multiplicand
    2. shift Multiplicand left 1
    3. shift Multiplier right 1

  Refined ("optimized") version: n-bit Multiplicand, n-bit ALU, 2n-bit Product
  that starts with the multiplier in its right half. Each repetition:
    1. if Product0 = 1, add Multiplicand to the left half of Product
    2. shift Product (with the adder's carry-out) right 1
*/
import { addBits, toBits } from "./numbers"

export type MulRow = { iteration: number; step: string; multiplier?: string; multiplicand: string; product: string }

export function multiplyFirst(mcand: string, mplier: string): { rows: MulRow[]; product: string } {
  const n = mplier.length
  let M = "0".repeat(n) + mcand
  let Q = mplier
  let P = "0".repeat(2 * n)
  const rows: MulRow[] = [{ iteration: 0, step: "Initial values", multiplier: Q, multiplicand: M, product: P }]
  for (let i = 1; i <= n; i++) {
    const bit = Q[n - 1]
    if (bit === "1") {
      P = addBits(P, M).sum
      rows.push({ iteration: i, step: "1a: 1 ⇒ Prod = Prod + Mcand", multiplier: Q, multiplicand: M, product: P })
    } else rows.push({ iteration: i, step: "1: 0 ⇒ No operation", multiplier: Q, multiplicand: M, product: P })
    M = M.slice(1) + "0"
    rows.push({ iteration: i, step: "2: Shift left Multiplicand", multiplier: Q, multiplicand: M, product: P })
    Q = "0" + Q.slice(0, -1)
    rows.push({ iteration: i, step: "3: Shift right Multiplier", multiplier: Q, multiplicand: M, product: P })
  }
  return { rows, product: P }
}

export function multiplyRefined(mcand: string, mplier: string): { rows: MulRow[]; product: string } {
  const n = mplier.length
  let P = "0".repeat(n) + mplier
  const rows: MulRow[] = [{ iteration: 0, step: "Initial values", multiplicand: mcand, product: P }]
  for (let i = 1; i <= n; i++) {
    let carry = "0"
    if (P[2 * n - 1] === "1") {
      const r = addBits(P.slice(0, n), mcand)
      carry = String(r.carryOut)
      P = r.sum + P.slice(n)
      rows.push({ iteration: i, step: "1a: 1 ⇒ Prod = Prod + Mcand", multiplicand: mcand, product: P })
    } else rows.push({ iteration: i, step: "1: 0 ⇒ No operation", multiplicand: mcand, product: P })
    P = carry + P.slice(0, -1)
    rows.push({ iteration: i, step: "2: Shift right Product", multiplicand: mcand, product: P })
  }
  return { rows, product: P }
}

/** Product check: the final register equals the true product. */
export function productOk(mcand: string, mplier: string, product: string) {
  return product === toBits(BigInt("0b" + mcand) * BigInt("0b" + mplier), 2 * mplier.length)
}
