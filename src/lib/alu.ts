/*
  Checks an ALU design in Mano's style (Tushar Sir's ALU Design slides): an
  n-bit ripple of full adders whose i-th stage gets inputs Xᵢ, Yᵢ and Zᵢ, where
  Zᵢ is the carry into stage i. The design gives Xᵢ and Yᵢ as functions of the
  selection bits and Aᵢ, Bᵢ, and the carry into each stage as a function of the
  selection bits and the previous stage's carry (stage 0: the carry-in Cin,
  itself a function of the selection bits). Fᵢ = Xᵢ ⊕ Yᵢ ⊕ Zᵢ.

  aluCheck() runs every selection code on every pair of inputs and compares the
  output with the required function, mod 2ⁿ.
*/

export type Sel = number[] // selection bits, most significant first, e.g. [S2, S1, S0]

export type AluDesign = {
  bits: number
  /** Number of selection variables. */
  selBits: number
  X: (s: Sel, a: number, b: number) => number
  Y: (s: Sel, a: number, b: number) => number
  /** Carry into stage 0. */
  cin: (s: Sel) => number
  /** Carry into stage i > 0, from the previous stage's carry-out (default: passed straight through). */
  Z?: (s: Sel, carry: number) => number
  /**
   * Use full subtractors instead of full adders: stage i computes Xᵢ − Yᵢ − Zᵢ, so
   * Fᵢ = Xᵢ ⊕ Yᵢ ⊕ Zᵢ and the borrow out is Xᵢ′Yᵢ + Xᵢ′Zᵢ + YᵢZᵢ (cin and Z are borrows).
   */
  subtractor?: boolean
}

export type AluSpec = {
  /** Selection codes as strings of 0/1/x (most significant first) → required output, or null for "don't check". */
  [code: string]: ((A: number, B: number, n: number) => number) | null
}

function expand(code: string): string[] {
  const i = code.indexOf("x")
  if (i < 0) return [code]
  return [...expand(code.slice(0, i) + "0" + code.slice(i + 1)), ...expand(code.slice(0, i) + "1" + code.slice(i + 1))]
}

export function runAlu(d: AluDesign, s: Sel, A: number, B: number) {
  let carry = d.cin(s)
  let F = 0
  for (let i = 0; i < d.bits; i++) {
    const a = (A >> i) & 1
    const b = (B >> i) & 1
    const x = d.X(s, a, b) & 1
    const y = d.Y(s, a, b) & 1
    const z = i === 0 ? carry : d.Z ? d.Z(s, carry) & 1 : carry
    F |= (x ^ y ^ z) << i
    carry = d.subtractor ? ((1 - x) & y) | ((1 - x) & z) | (y & z) : (x & y) | (x & z) | (y & z)
  }
  return { F, cout: carry }
}

/** Returns a list of mismatches (empty when the design meets the spec). */
export function aluCheck(d: AluDesign, spec: AluSpec): string[] {
  const n = d.bits
  const mask = (1 << n) - 1
  const bad: string[] = []
  for (const [code, fn] of Object.entries(spec)) {
    if (!fn) continue
    for (const c of expand(code)) {
      if (c.length !== d.selBits) throw new Error(`selection code ${code} has wrong width`)
      const s = [...c].map(Number)
      for (let A = 0; A <= mask; A++)
        for (let B = 0; B <= mask; B++) {
          const want = ((fn(A, B, n) % (mask + 1)) + (mask + 1)) & mask
          const got = runAlu(d, s, A, B).F
          if (got !== want) {
            bad.push(`S=${c}, A=${A}, B=${B}: got ${got}, want ${want}`)
            if (bad.length > 5) return bad
          }
        }
    }
  }
  return bad
}

/** Bitwise helpers for writing specs. */
export const NOT = (x: number, n: number) => ~x & ((1 << n) - 1)
