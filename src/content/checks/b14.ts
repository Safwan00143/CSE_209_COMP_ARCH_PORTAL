import { all, expectEq, type Fact } from "./types"
import { codeBlock } from "./extract"
import { simulate } from "@/lib/pipeline"
import { SRC } from "@/figures/notes-pipe"
import { aluControl } from "@/lib/datapath"
import { fpAddSteps } from "@/lib/ieee"
import { newMachine, parse, run, storeWord, loadWord } from "@/lib/mips"
import { multiplyRefined, productOk } from "@/lib/multiply"
import { b14Solutions as S, Q6A_GIVEN, q6Words } from "../papers/b14-solutions"
import { b16Solutions } from "../papers/b16-solutions"

const near = (a: number, b: number, t = 1e-3) => (Math.abs(a - b) <= t * Math.max(1, Math.abs(b)) ? null : `${a} ≠ ${b}`)

export const b14Checks: Fact[] = [
  { id: "b14-7a", claim: "reuses the 2018-19 addressing-modes answer", problem: () => (S["7a"] === b16Solutions["6a"] ? null : "text differs") },
  {
    id: "b14-2b",
    claim: "ALU control: lw/sw add 0010, beq sub 0110, funct add/sub/and/or/slt",
    problem: () => expectEq("ctl", [aluControl(0, 0), aluControl(1, 0), aluControl(2, 32), aluControl(2, 34), aluControl(2, 36), aluControl(2, 37), aluControl(2, 42)], [2, 6, 2, 6, 0, 1, 7]),
  },
  {
    id: "b14-3b",
    claim: "DM 20/6/6, 64 lines; FA tag 26; 4-way 9/17/6, 2^17 sets, 2^19 lines; 2^26 blocks",
    problem: () => all(expectEq("dm line", 32 - 20 - 6, 6), expectEq("fa tag", 32 - 6, 26), expectEq("sets", 2 ** (32 - 9 - 6), 131072), expectEq("lines", 4 * 2 ** 17, 524288), expectEq("blocks", 2 ** 32 / 64, 2 ** 26)),
  },
  {
    id: "b14-4a",
    claim: "as written 2 stalls, 13 cycles; rescheduled 0 stalls, 11 cycles",
    problem: () => {
      const norm = (s: string) => s.replace(/#.*$/gm, "").replace(/\s+/g, " ").trim()
      const mine = codeBlock(S["4a"], "# moved up")
      const b = simulate(SRC.schedBefore, { forwarding: true })
      const a = simulate(mine, { forwarding: true })
      return all(
        expectEq("same as slides", norm(mine), norm(SRC.schedAfter)),
        expectEq("before", [b.dataStalls, b.cycles], [2, 13]),
        expectEq("after", [a.dataStalls, a.cycles], [0, 11]),
      )
    },
  },
  {
    id: "b14-5c",
    claim: "420M cycles, 0.14 s; FP alone cannot double speed; 414M cycles, −1.43%",
    problem: () => {
      const c0 = 40 + 80 + 270 + 30
      const c3 = 40 * 1.2 + 80 * 1.2 + 90 * 2.7 + 15 * 1.8
      return all(expectEq("c0", c0, 420), near(c0 / 3000, 0.14), 380 > 210 ? null : "possible", near(c3, 414), near(((c0 - c3) / c0) * 100, 1.4286))
    },
  },
  {
    id: "b14-6a",
    claim: "the completed code assembles to the six given machine words",
    problem: () => expectEq("words", q6Words, Q6A_GIVEN.map((w) => w.replace(/ /g, ""))),
  },
  {
    id: "b14-6b",
    claim: "ll/sc swap exchanges $s4 with memory",
    problem: () => {
      const m = newMachine({ s1: 0x1000, s4: 1 })
      storeWord(m.mem, 0x1000, 0)
      run(parse(codeBlock(S["6b"], "try:")), m)
      return all(expectEq("s4", m.regs[20], 0), expectEq("mem", loadWord(m.mem, 0x1000), 1))
    },
  },
  {
    id: "b14-7b",
    claim: "−0.25 + 0.625 = 1.100 × 2^−2 = 0.375",
    problem: () => {
      const r = fpAddSteps(-0.25, 0.625, { expBits: 8, fracBits: 3 })
      return all(expectEq("result", r.result, 0.375), expectEq("e", r.encoded.e, -2), expectEq("frac", r.encoded.fraction, "100"))
    },
  },
  {
    id: "b14-8a",
    claim: "V = O'SA'SB'SR + O'SASBSR' + OSA'SBSR + OSASB'SR' on all 4-bit pairs",
    problem: () => {
      const s4 = (v: number) => (v >= 8 ? v - 16 : v)
      for (const O of [0, 1])
        for (let a = 0; a < 16; a++)
          for (let b = 0; b < 16; b++) {
            const r = (O ? a - b : a + b) & 15
            const [SA, SB, SR] = [a >> 3, b >> 3, r >> 3]
            const n = (x: number) => 1 - x
            const V = (n(O) & n(SA) & n(SB) & SR) | (n(O) & SA & SB & n(SR)) | (O & n(SA) & SB & SR) | (O & SA & n(SB) & n(SR))
            const exact = O ? s4(a) - s4(b) : s4(a) + s4(b)
            const want = exact > 7 || exact < -8 ? 1 : 0
            if (V !== want) return `O=${O}, A=${s4(a)}, B=${s4(b)}`
          }
      return null
    },
  },
  {
    id: "b14-8c",
    claim: "0110 × 0110 = 0010 0100 (36) on the refined multiplier",
    problem: () => {
      const r = multiplyRefined("0110", "0110")
      return all(expectEq("product", r.product, "00100100"), productOk("0110", "0110", r.product) ? null : "wrong product")
    },
  },
]
