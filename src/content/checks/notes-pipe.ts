import { all, expectEq, type Fact } from "./types"
import { codeBlock } from "./extract"
import { simulate, type PipeOptions } from "@/lib/pipeline"
import { SRC } from "@/figures/notes-pipe"
import { dataHazardsNote } from "../notes/data-hazards"

const sim = (src: string, o: PipeOptions) => simulate(src, o)
const F = { forwarding: true }
const N = { forwarding: false }

/* The slides' forwarding unit, as logic. Returns ForwardA, ForwardB as "00" | "10" | "01". */
type Stage = { RegWrite: boolean; Rd: number }
export function forwardingUnit(exmem: Stage, memwb: Stage, rs: number, rt: number) {
  const ex = (r: number) => exmem.RegWrite && exmem.Rd !== 0 && exmem.Rd === r
  const mem = (r: number) => memwb.RegWrite && memwb.Rd !== 0 && !ex(r) && memwb.Rd === r
  const pick = (r: number) => (ex(r) ? "10" : mem(r) ? "01" : "00")
  return { A: pick(rs), B: pick(rt) }
}

export const pipeNoteChecks: Fact[] = [
  {
    id: "note-pipe-speedup",
    claim: "3 lw: 1400 vs 2400 ps (1.714); +1,000,000: speed-up ≈ 4",
    problem: () => {
      const cyc = sim(SRC.threeLw, F).cycles
      const big = (1_000_000 * 800 + 2400) / (1_000_000 * 200 + 1400)
      return all(expectEq("cycles", cyc, 7), expectEq("pipelined ps", cyc * 200, 1400), Math.abs(2400 / 1400 - 1.714) < 1e-3 ? null : "1.714", Math.abs(big - 4) < 1e-4 ? null : `big ${big}`)
    },
  },
  {
    id: "note-dh-figures",
    claim: "add/sub: 2 stalls without, 0 with forwarding; load-use 1 stall; slide 53 sequence 0 stalls; slide 73 sequence 1 stall",
    problem: () =>
      all(
        expectEq("nofwd", sim(SRC.addSub, N).dataStalls, 2),
        expectEq("fwd", sim(SRC.addSub, F).dataStalls, 0),
        expectEq("load-use", sim(SRC.loadUse, F).dataStalls, 1),
        expectEq("alu seq", sim(SRC.aluSeq, F).dataStalls, 0),
        expectEq("stall seq", sim(SRC.stallSeq, F).dataStalls, 1),
      ),
  },
  {
    id: "note-dh-alu-seq-paths",
    claim: "slide 53: and ← EX/MEM, or ← MEM/WB, add ← register file",
    problem: () => {
      const r = sim(SRC.aluSeq, F)
      const path = (to: number) => r.forwards.filter((f) => f.to === to && f.reg === 2).map((f) => f.path)
      return all(expectEq("and", path(1), ["EX/MEM→EX"]), expectEq("or", path(2), ["MEM/WB→EX"]), expectEq("add", path(3), ["register file"]))
    },
  },
  {
    id: "note-dh-scheduling",
    claim: "A = B + E; C = B + F: 13 cycles, reordered 11; both code blocks in the note",
    problem: () => {
      const before = codeBlock(dataHazardsNote, "add $t3, $t1, $t2    # stall")
      const after = codeBlock(dataHazardsNote, "lw  $t4, 8($t0)      # moved up")
      return all(expectEq("before", sim(before, F).cycles, 13), expectEq("after", sim(after, F).cycles, 11), expectEq("fig before", sim(SRC.schedBefore, F).cycles, 13), expectEq("fig after", sim(SRC.schedAfter, F).cycles, 11))
    },
  },
  {
    id: "note-dh-double",
    claim: "double hazard: third add takes $1 from EX/MEM and computes 64 (40 from MEM/WB would give 44)",
    problem: () => {
      const r = sim(SRC.double, F)
      const third = r.forwards.filter((f) => f.to === 2 && f.reg === 1).map((f) => f.path)
      const fu = forwardingUnit({ RegWrite: true, Rd: 1 }, { RegWrite: true, Rd: 1 }, 1, 4)
      return all(expectEq("path", third, ["EX/MEM→EX"]), expectEq("ForwardA", fu.A, "10"), expectEq("value", 10 + 30 + 20 + 4, 64), expectEq("wrong", 40 + 4, 44))
    },
  },
  {
    id: "note-dh-forwarding-unit",
    claim: "forwarding unit equations: $zero and RegWrite guards, EX priority",
    problem: () =>
      all(
        expectEq("zero", forwardingUnit({ RegWrite: true, Rd: 0 }, { RegWrite: false, Rd: 0 }, 0, 0).A, "00"),
        expectEq("no write", forwardingUnit({ RegWrite: false, Rd: 5 }, { RegWrite: true, Rd: 5 }, 5, 0).A, "01"),
        expectEq("mem only", forwardingUnit({ RegWrite: true, Rd: 7 }, { RegWrite: true, Rd: 5 }, 1, 5).B, "01"),
        expectEq("ex", forwardingUnit({ RegWrite: true, Rd: 5 }, { RegWrite: true, Rd: 6 }, 5, 6).A, "10"),
      ),
  },
  {
    id: "note-dh-rule-table",
    claim: "the stall table: ALU 1st/2nd/3rd and load 1st/2nd/3rd, with and without forwarding",
    problem: () => {
      const fill = (k: number) => Array.from({ length: k - 1 }, (_, i) => `add $${20 + i}, $${20 + i}, $${20 + i}`).join("\n")
      const want: [string, number, number, number][] = [
        ["alu", 1, 2, 0],
        ["alu", 2, 1, 0],
        ["alu", 3, 0, 0],
        ["load", 1, 2, 1],
        ["load", 2, 1, 0],
        ["load", 3, 0, 0],
      ]
      for (const [kind, k, nofwd, fwd] of want) {
        const prod = kind === "alu" ? "add $1, $2, $3" : "lw $1, 0($2)"
        const src = [prod, fill(k), "sub $5, $1, $6"].filter(Boolean).join("\n")
        const a = sim(src, N).dataStalls
        const b = sim(src, F).dataStalls
        if (a !== nofwd || b !== fwd) return `${kind} at distance ${k}: got ${a}/${b}, table says ${nofwd}/${fwd}`
      }
      return null
    },
  },
  {
    id: "note-dh-nops",
    claim: "lw/add/sw with two nops needs no stalls without forwarding",
    problem: () => {
      const src = codeBlock(dataHazardsNote, "nop\nnop\nsw  $6, 50($1)")
      return expectEq("stalls", sim(src, N).dataStalls, 0)
    },
  },
]
