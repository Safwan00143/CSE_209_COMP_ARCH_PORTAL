import { all, expectEq, type Fact } from "./types"
import { codeBlock } from "./extract"
import { simulate } from "@/lib/pipeline"
import { aluCheck, NOT } from "@/lib/alu"
import { assemble, call, deps, loadWord, newMachine, parse, run, storeWord } from "@/lib/mips"
import { ipc, runPackets, type Packet } from "@/lib/dualissue"
import { B18_Q4 } from "@/figures/papers/b18"
import { approxLRU, b18Solutions as S, Q5_LOOP, Q5_SCHED, Q5_UNROLLED, Q8_REFS } from "../papers/b18-solutions"

const near = (a: number, b: number, t = 1e-3) => (Math.abs(a - b) <= t * Math.max(1, Math.abs(b)) ? null : `${a} ≠ ${b}`)

/* Independent re-implementation of Q8, written differently from the solution's simulator. */
function lruRefBits(refs: number[]) {
  const pages: (number | null)[] = [null, null, null, null]
  const bits = [0, 0, 0, 0]
  let hits = 0
  const evicted: number[] = []
  for (let t = 1; t <= refs.length; t++) {
    const p = refs[t - 1]
    let k = pages.indexOf(p)
    if (k >= 0) hits++
    else {
      k = pages.indexOf(null)
      if (k < 0) {
        k = bits.indexOf(0)
        if (k < 0) k = 0
        evicted.push(pages[k]!)
      }
      pages[k] = p
    }
    bits[k] = 1
    if (t % 4 === 0) bits.fill(0)
  }
  return { hits, evicted, pages }
}

export const b18Checks: Fact[] = [
  {
    id: "b18-4",
    claim: "forwarding: 12 cycles, 1 stall; without forwarding 17 cycles",
    problem: () => {
      const f = simulate(B18_Q4, { forwarding: true })
      const n = simulate(B18_Q4, { forwarding: false })
      return all(expectEq("cycles", f.cycles, 12), expectEq("stalls", f.dataStalls, 1), expectEq("no fwd", n.cycles, 17))
    },
  },
  {
    id: "b18-5",
    claim: "IPC 7/4 = 1.75; unrolled ×4: 19/4 = 4.75",
    problem: () => {
      const n = 8
      const setup = () => {
        const m = newMachine({ s0: 1000 + 4 * n, s1: 4 * n })
        for (let i = 1; i <= n; i++) {
          storeWord(m.mem, 1000 + 4 * i, 10 * i)
          storeWord(m.mem, 4 * i, i)
        }
        return m
      }
      const ref = setup()
      run(parse(Q5_LOOP), ref)
      const ins = (x: string) => deps(parse(x.replace(/^Loop: /, "")).instrs[0])
      const check = (sched: string[][]) => {
        const m = setup()
        runPackets(sched as unknown as Packet[], m)
        for (let i = 1; i <= n; i++) if (loadWord(m.mem, 4 * i) !== loadWord(ref.mem, 4 * i)) return `element ${i}: ${loadWord(m.mem, 4 * i)} vs ${loadWord(ref.mem, 4 * i)}`
        // One-cycle load-use latency: nothing may read a register loaded in the previous packet.
        for (let p = 0; p + 1 < sched.length; p++) {
          const loaded = sched[p].filter((x) => /^(Loop: )?lw/.test(x)).map((x) => ins(x).writes)
          for (const x of sched[p + 1]) if (x !== "nop" && ins(x).reads.some((r) => loaded.includes(r))) return `packet ${p + 2} uses a load too early`
        }
        return null
      }
      const ipcOf = (s: string[][]) => ipc(s as unknown as Packet[]).ipc
      return all(check(Q5_SCHED), check(Q5_UNROLLED), expectEq("ipc1", ipcOf(Q5_SCHED), 1.75), expectEq("ipc4", ipcOf(Q5_UNROLLED), 4.75))
    },
  },
  {
    id: "b18-6",
    claim: "512 blocks; address 24092022 → index 249, tag 22",
    problem: () => all(expectEq("blocks", 2 ** 8 * 2, 512), expectEq("index", Math.floor(24092022 / 4096) % 256, 249), expectEq("tag", Math.floor(24092022 / 2 ** 20), 22)),
  },
  {
    id: "b18-7",
    claim: "SSD 0.005625; 4.125 cycles; I-miss 4.5%",
    problem: () => all(near(0.05 * 0.15 * 0.75, 0.005625), near(1 + 0.05 * (10 + 0.15 * (100 + 0.25 * 1000)), 4.125), near((0.05 * 1.1 - 0.1 * 0.1) / 1, 0.045)),
  },
  {
    id: "b18-8",
    claim: "approximate-LRU table agrees with an independent simulation",
    problem: () => {
      const a = approxLRU(Q8_REFS)
      const b = lruRefBits(Q8_REFS)
      return all(
        expectEq("hits", a.filter((s) => s.hit).length, b.hits),
        expectEq("evicted", a.filter((s) => s.victim !== undefined).map((s) => s.victim), b.evicted),
        expectEq("final", a[a.length - 1].table.map((e) => e?.page ?? null), b.pages),
      )
    },
  },
  {
    id: "b18-10b",
    claim: "X, Y, Z equations give all 16 functions",
    problem: () => {
      // Selection bits are most significant first: [S3, S2, S1, S0].
      const errs = aluCheck(
        {
          bits: 4,
          selBits: 4,
          X: ([s3, , s1], a, b) => a | (s3 & s1 & b),
          Y: ([s3, s2, s1, s0], _a, b) => ((1 - s2) & (1 - s1) & (s0 | s3)) | ((1 - s2) & s1 & b) | (s2 & (1 - s1) & (1 - b)),
          Z: ([s3], c) => (1 - s3) & c,
          cin: ([s3, s2, s1, s0]) => (1 - s3) & (1 - s0) & (s2 | s1),
        },
        {
          "0000": (A) => A, "0001": (A) => A - 1, "0010": (A, B) => A + B + 1, "0011": (A, B) => A + B,
          "0100": (A, B) => A - B, "0101": (A, B) => A - B - 1, "0110": (A) => A + 1, "0111": (A) => A,
          "100x": (A, _B, n) => NOT(A, n), "101x": (A, B, n) => A & NOT(B, n), "110x": (A, B, n) => NOT(A ^ B, n), "111x": (A, B) => A | B,
        },
      )
      return errs.length ? errs.slice(0, 3).join("; ") : null
    },
  },
  {
    id: "b18-11c",
    claim: "testFunc(5,2,10) = 20; testFunc(0,-1,7) = 7; matches C for many inputs",
    problem: () => {
      const src = codeBlock(S["11c"], "testFunc:")
      const ref = (a: number, b: number, c: number) => {
        let i = 0
        let r = 0
        do {
          if (i > b) r += c
          i++
        } while (i < a)
        return r
      }
      for (const [a, b, c] of [[5, 2, 10], [0, -1, 7], [3, 5, 4], [6, 0, -2], [1, 0, 9]]) {
        const v = call(src, "testFunc", [a, b, c]).v0
        if (v !== ref(a, b, c)) return `testFunc(${a},${b},${c}) = ${v}, want ${ref(a, b, c)}`
      }
      return null
    },
  },
  {
    id: "b18-12a",
    claim: "CPI A = 23/9, B = 25/10",
    problem: () => all(expectEq("A", 2 * 3 + 1 + 4 * 2 + 2 * 4, 23), expectEq("B", 3 * 3 + 2 + 3 * 2 + 2 * 4, 25), near(23 / 9, 2.556)),
  },
  {
    id: "b18-12b",
    claim: "encodings 5 8 9 1 / 2 32768 / 8 9 8 1",
    problem: () => {
      const r = assemble(parse("L1: bne $t0, $t1, L3\nL2: j 131072\nL3: addi $t0, $t1, 1"), 1000)
      return expectEq("fields", r.map((x) => x.enc.fields.map((f) => f[1])), [[5, 8, 9, 1], [2, 32768], [8, 9, 8, 1]])
    },
  },
  {
    id: "b18-12d",
    claim: "signed: Z, S⊕V, (S⊕V)'Z'; unsigned: Z, C', CZ' on all 4-bit pairs",
    problem: () => {
      for (let a = 0; a < 16; a++)
        for (let b = 0; b < 16; b++) {
          const raw = a + ((~b) & 15) + 1
          const r = raw & 15
          const C = raw >> 4
          const Z = r === 0 ? 1 : 0
          const S = r >> 3
          const sa = a >= 8 ? a - 16 : a
          const sb = b >= 8 ? b - 16 : b
          const V = sa - sb > 7 || sa - sb < -8 ? 1 : 0
          if ((S ^ V) !== (sa < sb ? 1 : 0) || (Z === 1) !== (sa === sb) || ((1 - (S ^ V)) & (1 - Z)) !== (sa > sb ? 1 : 0)) return `signed ${sa},${sb}`
          if ((1 - C) !== (a < b ? 1 : 0) || (C & (1 - Z)) !== (a > b ? 1 : 0)) return `unsigned ${a},${b}`
        }
      return null
    },
  },
  {
    id: "b18-13a",
    claim: "bias 63; range 2^-62 … (2 − 2^-24)·2^63",
    problem: () => all(expectEq("bias", 2 ** 6 - 1, 63), expectEq("emin", 1 - 63, -62), expectEq("emax", 126 - 63, 63), near(2 ** -62, 2.168e-19), near((2 - 2 ** -24) * 2 ** 63, 1.8447e19)),
  },
]
