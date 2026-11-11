import { all, type Fact } from "./types"
import { aluCheck, runAlu, type AluDesign } from "@/lib/alu"

const n = 4
const M = (1 << n) - 1
const NOT = (x: number) => ~x & M
const sub = (x: number, y: number) => (x - y) & M

/* Table 9-1 arithmetic circuit: selection [s1, s0, Cin]. */
const arith: AluDesign = { bits: 4, selBits: 3, X: (_s, a) => a, Y: ([s1, s0], _a, b) => (b & s0) | ((1 - b) & s1), cin: ([, , c]) => c }

/* Mano's efficient ALU: selection [s2, s1, s0, Cin]. */
const mano: AluDesign = {
  bits: 4,
  selBits: 4,
  X: ([s2, s1, s0], a, b) => a | (s2 & (1 - s1) & (1 - s0) & b) | (s2 & s1 & (1 - s0) & (1 - b)),
  Y: ([, s1, s0], _a, b) => (s0 & b) | (s1 & (1 - b)),
  cin: ([s2, , , c]) => (1 - s2) & c,
  Z: ([s2], carry) => (1 - s2) & carry,
}

export const aluNoteChecks: Fact[] = [
  {
    id: "note-alu-table91",
    claim: "Table 9-1: the eight arithmetic functions",
    problem: () => {
      const bad = aluCheck(arith, {
        "000": (A) => A,
        "001": (A) => A + 1,
        "010": (A, B) => A + B,
        "011": (A, B) => A + B + 1,
        "100": (A, B) => A + NOT(B),
        "101": (A, B) => A - B,
        "110": (A) => A - 1,
        "111": (A) => A,
      })
      return bad[0] ?? null
    },
  },
  {
    id: "note-alu-table92",
    claim: "Table 9-2: when Cout = 1",
    problem: () => {
      const conds: Record<string, (A: number, B: number) => boolean> = {
        "000": () => false,
        "001": (A) => A === M,
        "010": (A, B) => A + B >= 16,
        "011": (A, B) => A + B >= 15,
        "100": (A, B) => A > B,
        "101": (A, B) => A >= B,
        "110": (A) => A !== 0,
        "111": () => true,
      }
      for (const [code, want] of Object.entries(conds))
        for (let A = 0; A <= M; A++)
          for (let B = 0; B <= M; B++) {
            const c = runAlu(arith, [...code].map(Number), A, B).cout
            if (!!c !== want(A, B)) return `code ${code}, A=${A}, B=${B}: Cout=${c}`
          }
      return null
    },
  },
  {
    id: "note-alu-addsub",
    claim: "adder/subtractor: X = A, Y = B ⊕ s, Cin = s",
    problem: () => {
      const d: AluDesign = { bits: 4, selBits: 1, X: (_s, a) => a, Y: ([s], _a, b) => b ^ s, cin: ([s]) => s }
      return aluCheck(d, { "0": (A, B) => A + B, "1": (A, B) => A - B })[0] ?? null
    },
  },
  {
    id: "note-alu-mano",
    claim: "Xᵢ = Aᵢ + s₂s₁′s₀′Bᵢ + s₂s₁s₀′Bᵢ′, Yᵢ = s₀Bᵢ + s₁Bᵢ′, Zᵢ = s₂′Cᵢ gives Table 9-1 for s₂ = 0 and OR, XOR, AND, NOT for s₂ = 1",
    problem: () =>
      aluCheck(mano, {
        "0000": (A) => A,
        "0001": (A) => A + 1,
        "0010": (A, B) => A + B,
        "0011": (A, B) => A + B + 1,
        "0100": (A, B) => A + NOT(B),
        "0101": (A, B) => sub(A, B),
        "0110": (A) => A - 1,
        "0111": (A) => A,
        "100x": (A, B) => A | B,
        "101x": (A, B) => A ^ B,
        "110x": (A, B) => A & B,
        "111x": (A) => NOT(A),
      })[0] ?? null,
  },
  {
    id: "note-alu-logic-from-arith",
    claim: "Table 9-3: with carries 0 the arithmetic circuit gives transfer, XOR, equivalence, NOT",
    problem: () => {
      const d: AluDesign = { ...arith, selBits: 2, Y: ([s1, s0], _a, b) => (b & s0) | ((1 - b) & s1), cin: () => 0, Z: () => 0 }
      return aluCheck(d, { "00": (A) => A, "01": (A, B) => A ^ B, "10": (A, B) => NOT(A ^ B), "11": (A) => NOT(A) })[0] ?? null
    },
  },
  {
    id: "note-alu-compare",
    claim: "comparison conditions from V Z S C after A − B (unsigned and signed)",
    problem: () => {
      for (let A = 0; A <= M; A++)
        for (let B = 0; B <= M; B++) {
          const r = runAlu(arith, [1, 0, 1], A, B)
          const F = r.F
          const C = r.cout
          const Z = F === 0 ? 1 : 0
          const S = (F >> 3) & 1
          // V from the carries into and out of the sign bit: recompute via signed range.
          const sa = A >= 8 ? A - 16 : A
          const sb = B >= 8 ? B - 16 : B
          const V = sa - sb > 7 || sa - sb < -8 ? 1 : 0
          const u = all(
            !!Z === (A === B) ? null : "u =",
            !!C === (A >= B) ? null : "u >=",
            !!(C && !Z) === (A > B) ? null : "u >",
            !!(!C || Z) === (A <= B) ? null : "u <=",
            !!(S ^ V) === (sa < sb) ? null : "s <",
            !!(!(S ^ V) && !Z) === (sa > sb) ? null : "s >",
            !!(S ^ V || Z) === (sa <= sb) ? null : "s <=",
          )
          if (u) return `${u} wrong for A=${A}, B=${B}`
        }
      return null
    },
  },
]
