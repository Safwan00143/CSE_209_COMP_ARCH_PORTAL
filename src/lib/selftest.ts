/*
  Deliberately wrong claims, one per checker. verify.ts runs these first and
  refuses to continue unless every one is caught, so a broken checker cannot
  make the real checks pass vacuously.
*/
import type { Fact } from "@/content/checks/types"
import { expectEq } from "@/content/checks/types"
import { addBits, toBits } from "./numbers"
import { decode, encode, SINGLE } from "./ieee"
import { simulateCache } from "./cache"
import { simulate } from "./pipeline"
import { call } from "./mips"
import { aluCheck } from "./alu"
import { multiplyRefined } from "./multiply"

export const selfTests: Fact[] = [
  { id: "self-overflow", claim: "0111 + 0001 does not overflow (wrong)", problem: () => expectEq("overflow", addBits("0111", "0001").overflow, false) },
  { id: "self-twos", claim: "−3 in 4 bits is 1100 (wrong)", problem: () => expectEq("bits", toBits(-3, 4, true), "1100") },
  { id: "self-ieee-enc", claim: "−0.75 is BF400001 (wrong)", problem: () => expectEq("bits", encode(-0.75, SINGLE).bits, "1" + "01111110" + "1" + "0".repeat(21) + "1") },
  { id: "self-ieee-dec", claim: "0x40400000 is 2.0 (wrong)", problem: () => expectEq("value", decode("0x40400000", SINGLE).value, 2) },
  {
    id: "self-cache",
    claim: "direct-mapped 8 blocks: 22,26,22,26,16,3,16,18 has 4 hits (wrong; the slides' example has 3)",
    problem: () => expectEq("hits", simulateCache({ sets: 8, ways: 1 }, [22, 26, 22, 26, 16, 3, 16, 18]).hits, 4),
  },
  {
    id: "self-pipeline",
    claim: "lw then dependent add takes 6 cycles with forwarding (wrong: 7)",
    problem: () => expectEq("cycles", simulate("lw $t1, 0($t0)\nadd $t2, $t1, $t3", { forwarding: true }).cycles, 6),
  },
  {
    id: "self-mips",
    claim: "leaf sum returns a+b+1 (wrong)",
    problem: () => expectEq("v0", call("f: add $v0, $a0, $a1\njr $ra", "f", [2, 3]).v0, 6),
  },
  {
    id: "self-alu",
    claim: "Xᵢ = Aᵢ, Yᵢ = 0 computes A + B (wrong)",
    problem: () => {
      const bad = aluCheck({ bits: 4, selBits: 1, X: (_s, a) => a, Y: () => 0, cin: () => 0 }, { "0": (A, B) => A + B })
      return bad.length ? bad[0] : null
    },
  },
  {
    id: "self-multiply",
    claim: "0010 × 0011 = 00000111 (wrong)",
    problem: () => expectEq("product", multiplyRefined("0010", "0011").product, "00000111"),
  },
]
