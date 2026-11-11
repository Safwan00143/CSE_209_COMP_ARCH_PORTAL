import { all, expectEq, type Fact } from "./types"
import { codeBlock } from "./extract"
import { assemble, call, newMachine, parse, run } from "@/lib/mips"
import { CONTROL } from "@/lib/datapath"
import { b12Solutions as S, Q6C_SRC } from "../papers/b12-solutions"
import { b14Solutions } from "../papers/b14-solutions"
import { b16Solutions } from "../papers/b16-solutions"

export const b12Checks: Fact[] = [
  {
    id: "b12-reuse",
    claim: "repeated questions reuse the earlier worked solutions",
    problem: () =>
      all(
        S["2c"] === b14Solutions["3b"] ? null : "2c",
        S["3a"] === b14Solutions["4a"] ? null : "3a",
        S["6b"] === b14Solutions["6b"] ? null : "6b",
        S["7a"] === b16Solutions["6a"] ? null : "7a",
        S["7c"] === b16Solutions["8c"] ? null : "7c",
        S["8b"] === b16Solutions["5a"] ? null : "8b",
        S["8a"].startsWith(b14Solutions["8a"]) ? null : "8a",
        S["3c"].includes("**Step 4: forwarding unit") && !S["3c"].includes("**Step 5") ? null : "3c should keep steps 1–4 only",
      ),
  },
  {
    id: "b12-5b",
    claim: "512M cycles at 2 GHz = 0.256 s; FP CPI 0.4; L/S impossible",
    problem: () => all(expectEq("c", 160 * 2 + 110 + 50 + 32, 512), expectEq("t", 512 / 2000, 0.256), expectEq("fp", (256 - 192) / 160, 0.4), 462 > 256 ? null : "possible"),
  },
  {
    id: "b12-6a",
    claim: "completed recurseSum returns n(n+1)/2 for n ≥ 1, 0 for n < 1",
    problem: () => {
      const src = codeBlock(S["6a"], "recurseSum:")
      for (const n of [-3, 0, 1, 4, 10, 25]) {
        const v = call(src, "recurseSum", [n]).v0
        const want = n < 1 ? 0 : (n * (n + 1)) / 2
        if (v !== want) return `recurseSum(${n}) = ${v}, want ${want}`
      }
      return null
    },
  },
  {
    id: "b12-6c",
    claim: "machine code at 6000 matches the given fields (beq 1, j 1507 / 1500)",
    problem: () =>
      expectEq(
        "fields",
        assemble(parse(Q6C_SRC), 6000).slice(0, 7).map((x) => x.enc.fields.map((f) => f[1])),
        [[0, 0, 18, 9, 2, 0], [0, 9, 22, 9, 0, 32], [35, 9, 8, 0], [4, 8, 21, 1], [2, 1507], [8, 18, 18, 1], [2, 1500]],
      ),
  },
  {
    id: "b12-7b",
    claim: "slt-based blt/bge/bgt/ble branch exactly when the comparison holds",
    problem: () => {
      const forms: [string, string, (a: number, b: number) => boolean][] = [
        ["slt $at, $s0, $s1", "bne $at, $zero, T", (a, b) => a < b],
        ["slt $at, $s0, $s1", "beq $at, $zero, T", (a, b) => a >= b],
        ["slt $at, $s1, $s0", "bne $at, $zero, T", (a, b) => a > b],
        ["slt $at, $s1, $s0", "beq $at, $zero, T", (a, b) => a <= b],
      ]
      for (const [i1, i2, f] of forms)
        for (const [a, b] of [[1, 2], [2, 1], [3, 3], [-5, 4], [4, -5]]) {
          const m = newMachine({ s0: a, s1: b })
          run(parse(`${i1}\n${i2}\naddi $v0, $zero, 1\nj E\nT: addi $v0, $zero, 2\nE: nop`), m)
          if ((m.regs[2] === 2) !== f(a, b)) return `${i1}; ${i2} with ${a}, ${b}`
        }
      return null
    },
  },
  {
    id: "b12-8c",
    claim: "beq control: RegWrite 0, ALUSrc 0, MemRead 0, MemWrite 0, ALUOp 01",
    problem: () => expectEq("beq", [CONTROL.beq.RegWrite, CONTROL.beq.ALUSrc, CONTROL.beq.MemRead, CONTROL.beq.MemWrite, CONTROL.beq.ALUOp1, CONTROL.beq.ALUOp0], [0, 0, 0, 0, 0, 1]),
  },
]
