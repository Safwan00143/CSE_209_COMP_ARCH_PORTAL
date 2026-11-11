import { all, expectEq, type Fact } from "./types"
import { codeBlock } from "./extract"
import { simulate } from "@/lib/pipeline"
import { aluCheck, NOT } from "@/lib/alu"
import { simulateCache, totalBits } from "@/lib/cache"
import { decode, encode, fpAddSteps, SINGLE } from "@/lib/ieee"
import { assemble, call, loadWord, newMachine, parse, run, storeWord } from "@/lib/mips"
import { multiplyFirst, multiplyRefined } from "@/lib/multiply"
import { CONTROL, checkRow } from "@/lib/datapath"
import { path } from "@/lib/multicycle"
import { oneBit, runPredictor, twoBitPredictor } from "@/lib/predictor"
import { traceVM } from "@/lib/vm"
import { BK } from "../book/part-a"
import { BKB } from "../book/part-b"
import { bookProblems } from "../book"

const near = (a: number, b: number, t = 1e-3) => (Math.abs(a - b) <= t * Math.max(1, Math.abs(b)) ? null : `${a} ≠ ${b}`)
const n = (x: number) => 1 - x
const sol = (id: string) => bookProblems.find((p) => p.id === id)!.solution

export const bookChecks: Fact[] = [
  {
    id: "book-shape",
    claim: "60 problems, ids unique and prefixed bk-, three per topic",
    problem: () => {
      const ids = bookProblems.map((p) => p.id)
      const per = new Map<string, number>()
      bookProblems.forEach((p) => per.set(p.topic, (per.get(p.topic) ?? 0) + 1))
      return all(
        expectEq("count", bookProblems.length, 60),
        new Set(ids).size === ids.length ? null : "duplicate id",
        ids.every((i) => i.startsWith("bk-")) ? null : "bad prefix",
        [...per.values()].every((c) => c === 3) ? null : `per topic: ${JSON.stringify([...per])}`,
      )
    },
  },
  { id: "book-perf-clock", claim: "30e9 × 1.4 / 8 s = 5.25 GHz", problem: () => near((2.5e9 * 12 * 1.4) / 8, 5.25e9) },
  { id: "book-perf-cpi", claim: "13 vs 11 cycles; CPI 2.17 / 1.57", problem: () => all(expectEq("c1", 3 + 2 + 8, 13), expectEq("c2", 5 + 2 + 4, 11), near(13 / 6, 2.1667), near(11 / 7, 1.5714)) },
  { id: "book-perf-amdahl", claim: "72 s, 1.67×; limit 2.5×", problem: () => all(expectEq("t", 72 / 3 + 48, 72), near(120 / 72, 1.6667), expectEq("limit", 120 / 48, 2.5)) },
  {
    id: "book-isa",
    claim: "f = (g+h) − (i−j); sub/sw encodings; −45 = 0xFFD3",
    problem: () => {
      const m = newMachine({ s1: 10, s2: 20, s3: 7, s4: 3 })
      run(parse(BK.isa1Src), m)
      const e = assemble(parse(BK.isa2Src), 0).map((x) => x.enc.fields.map((f) => f[1]))
      return all(expectEq("f", m.regs[16], 26), expectEq("enc", e, [[0, 19, 9, 10, 0, 34], [43, 8, 17, 48]]), expectEq("-45", (-45 & 0xffff).toString(16), "ffd3"))
    },
  },
  {
    id: "book-mips",
    claim: "count > k gives 3; max3 correct; sumsq(3) = 14 and general",
    problem: () => {
      const m = newMachine({ s1: 0x1000, s2: 5, s3: 6 })
      ;[5, 12, 7, 20, 3].forEach((v, i) => storeWord(m.mem, 0x1000 + 4 * i, v))
      run(parse(BK.mips1Src.replace(/^Done:$/m, "Done:   nop")), m)
      for (const [a, b, c] of [[4, -7, 9], [9, 4, -7], [-7, 9, 4], [-1, -2, -3], [5, 5, 5]]) if (call(BK.mips2Src, "max3", [a, b, c]).v0 !== Math.max(a, b, c)) return `max3(${a},${b},${c})`
      for (const k of [-1, 0, 1, 3, 10]) {
        const want = k < 1 ? 0 : (k * (k + 1) * (2 * k + 1)) / 6
        if (call(BK.mips3Src, "sumsq", [k]).v0 !== want) return `sumsq(${k})`
      }
      return expectEq("count", m.regs[2], 3)
    },
  },
  {
    id: "book-addressing",
    claim: "backward offset −17; j at 0x0FFFFFFC reaches 0x10000040; lui/ori 0xABCD1234",
    problem: () => {
      const off = assemble(parse("bne $t0, $t1, 0x004000C0"), 0x00400100)[0].enc.fields[3][1]
      const j = assemble(parse("j 0x10000040"), 0x0ffffffc)[0].enc.fields[1][1]
      const m = newMachine()
      run(parse(codeBlock(sol("bk-addr-const"), "lui $t5, 0xABCD")), m)
      return all(expectEq("off", off, -17), expectEq("j", j, 0x10), expectEq("t5", m.regs[13] >>> 0, 0xabcd1234), expectEq("target a", 0x10000000 + 0x0100020 * 4, 0x10400080))
    },
  },
  {
    id: "book-sync",
    claim: "ll/sc increment adds 1; linker addresses; li 70000 = lui 1 + ori 4464",
    problem: () => {
      const m = newMachine({ a0: 0x2000 })
      storeWord(m.mem, 0x2000, 41)
      run(parse(BK.syncSrc), m)
      const l = newMachine()
      run(parse(codeBlock(sol("bk-sync-pseudo"), "lui $t0, 1")), l)
      return all(expectEq("counter", loadWord(m.mem, 0x2000), 42), expectEq("jal", 0x00400140 / 4, 0x100050), expectEq("li", l.regs[8], 70000))
    },
  },
  {
    id: "book-int",
    claim: "8-bit overflow cases; 0101 × 0011 = 15; 0011 × 0110 = 18",
    problem: () => {
      const wrap = (x: number) => ((x + 128) & 255) - 128
      return all(
        expectEq("wraps", [wrap(150), wrap(-150), wrap(150), wrap(-50)], [-106, 106, -106, -50]),
        expectEq("refined", parseInt(multiplyRefined("0101", "0011").product, 2), 15),
        expectEq("first", parseInt(multiplyFirst("0011", "0110").product, 2), 18),
      )
    },
  },
  {
    id: "book-fp",
    claim: "−12.375 = 0xC1460000; 0x3F600000 = 0.875; 0xC1880000 = −17; 3.5 + (−1.25) = 2.25",
    problem: () => {
      const r = fpAddSteps(BK.fp3.a, BK.fp3.b, BK.fp3.fmt)
      return all(
        expectEq("enc", parseInt(encode(-12.375, SINGLE).bits, 2).toString(16), "c1460000"),
        expectEq("d1", decode("0x3F600000", SINGLE).value, 0.875),
        expectEq("d2", decode("0xC1880000", SINGLE).value, -17),
        expectEq("sum", r.result, 2.25),
      )
    },
  },
  {
    id: "book-alu",
    claim: "arithmetic unit Y/Cin equations; logic unit X/Y equations",
    problem: () => {
      const arith = aluCheck(
        { bits: 4, selBits: 2, X: (_s, a) => a, Y: ([s1, s0], _a, b) => (n(s1) & (s0 ^ b)) | (s1 & s0), cin: ([s1, s0]) => s1 ^ s0 },
        { "00": (A, B) => A + B, "01": (A, B) => A - B, "10": (A) => A + 1, "11": (A) => A - 1 },
      )
      const logic = aluCheck(
        { bits: 4, selBits: 2, X: ([s1, s0], a, b) => a | (n(s1) & n(s0) & b) | (s1 & n(s0) & n(b)), Y: ([s1, s0], _a, b) => (s0 & b) | (s1 & n(b)), cin: () => 0, Z: () => 0 },
        { "00": (A, B) => A | B, "01": (A, B) => A ^ B, "10": (A, B) => A & B, "11": (A, _B, k) => NOT(A, k) },
      )
      const sum = 0b0111 + 0b0011
      return all(arith[0] ?? null, logic[0] ?? null, expectEq("status", [sum & 15, sum >> 4], [0b1010, 0]))
    },
  },
  {
    id: "book-single-cycle",
    claim: "addi runs on the lw/R-type datapath with the given row; lw path 920 ps",
    problem: () => {
      const row = { ...CONTROL.lw, MemtoReg: 0 as const, MemRead: 0 as const }
      const s = BKB.sc2
      return all(checkRow("addi $t0, $t1, -5", row, { t1: 12 }), expectEq("lw", s.imem + s.regRead + s.mux + s.alu + s.dmem + s.mux + s.regSetup, 920))
    },
  },
  {
    id: "book-multicycle",
    claim: "cycles lw 5, sw 4, R 4, beq 3, j 3; CPI 4.05",
    problem: () => {
      const cpi = (Object.keys(BKB.mc1) as (keyof typeof BKB.mc1)[]).reduce((t, k) => t + BKB.mc1[k] * path(k).length, 0)
      return all(expectEq("lens", ["lw", "sw", "R-type", "beq", "j"].map((k) => path(k as "lw").length), [5, 4, 4, 3, 3]), near(cpi, 4.05))
    },
  },
  { id: "book-pipelining", claim: "1650 vs 500 ps; 1000 instr ≈ 3.287×; split gives 400 ps", problem: () => all(expectEq("sum", 1650, BKB.pipe1.reduce((a, b) => a + b, 0)), near((1000 * 1650) / (1004 * 500), 3.2869)) },
  {
    id: "book-data-hazards",
    claim: "forwarding 1 stall, 9 cycles; no forwarding 6 stalls, 14 cycles; double hazard both from EX/MEM",
    problem: () => {
      const f = simulate(BKB.dh1, { forwarding: true })
      const nf = simulate(BKB.dh1, { forwarding: false })
      const d = simulate(BKB.dh3, { forwarding: true })
      const nops = simulate(codeBlock(sol("bk-dh-nops"), "nop"), { forwarding: false })
      return all(
        expectEq("fwd", [f.dataStalls, f.cycles], [1, 9]),
        expectEq("nofwd", [nf.dataStalls, nf.cycles], [6, 14]),
        expectEq("nops fix it", nops.dataStalls, 0),
        // Both sources are $1, so one forwarding record covers ForwardA and ForwardB.
        expectEq("double", d.forwards.filter((x) => x.to === 2).map((x) => x.path), ["EX/MEM→EX"]),
      )
    },
  },
  {
    id: "book-branch-hazards",
    claim: "CPI 1.12 / 1.36; 2-bit 5/8, 1-bit 4/8 on T,T,T,N ×2; ID branch stalls 1 and 2",
    problem: () =>
      all(
        near(1 + 0.2 * 0.6, 1.12),
        near(1 + 0.2 * 0.6 * 3, 1.36),
        expectEq("2-bit", runPredictor(twoBitPredictor("WN"), BKB.bh2).correct, 5),
        expectEq("1-bit", runPredictor(oneBit("N"), BKB.bh2).correct, 4),
        expectEq("stalls", [simulate(BKB.bh3a, { forwarding: true, branchIn: "ID" }).dataStalls, simulate(BKB.bh3b, { forwarding: true, branchIn: "ID" }).dataStalls], [1, 2]),
      ),
  },
  {
    id: "book-memory",
    claim: "disk ≈ 10.29 ms; AMAT 4 ns; wear leveling 2^24 blocks",
    problem: () => all(near(6 + (0.5 / 120) * 1000 + (4096 / 150e6) * 1000 + 0.1, 10.294), near(1 + 0.05 * 60, 4), expectEq("blocks", (64 * 2 ** 30) / 4096, 2 ** 24)),
  },
  {
    id: "book-caches",
    claim: "DM trace 0 hits; 64 KiB 4-way: tag 18, index 9, offset 5; 1,9,17,1,9,25,17 misses FA 4, 2-way 7, DM 7",
    problem: () => {
      const t = totalBits({ addressBits: 32, dataBytes: 64 * 1024, blockBytes: 32, ways: 4 })
      const m = (sets: number, ways: number) => simulateCache({ sets, ways }, BKB.cache3.seq).misses
      return all(
        expectEq("dm hits", simulateCache(BKB.cache1.cfg, BKB.cache1.seq).hits, 0),
        expectEq("fields", [t.split.tag, t.split.index, t.split.offset], [18, 9, 5]),
        expectEq("assoc", [m(1, 4), m(2, 2), m(4, 1)], [4, 7, 7]),
      )
    },
  },
  {
    id: "book-cache-performance",
    claim: "AMAT 4.2 → 2.6 cycles; CPI 5.1, 3.4×; L2: 9.1 → 3.61",
    problem: () => all(near(1 + 0.04 * 80, 4.2), near(1.5 + 0.015 * 120 + 0.3 * 0.05 * 120, 5.1), near(1 + 0.03 * 270, 9.1), near(1 + 0.03 * 15 + 0.008 * 270, 3.61)),
  },
  {
    id: "book-virtual-memory",
    claim: "2^18 × 4 B = 1 MB; TLB trace results; EAT 51.5 ns",
    problem: () => {
      const r = traceVM(BKB.vm2)
      return all(
        expectEq("size", 2 ** 18 * 4, 2 ** 20),
        // VPN 0 is evicted from the TLB by the page fault (it was the LRU entry), so 0x0C00 is a page-table hit.
        expectEq("results", r.steps.map((s) => s.result), ["TLB hit", "page table hit", "TLB hit", "page fault", "page table hit", "TLB hit"]),
        near(1 + 0.01 * 50 + 50, 51.5),
      )
    },
  },
  { id: "book-gpu", claim: "3907 blocks; divergence 50%", problem: () => all(expectEq("blocks", Math.ceil(1e6 / 256), 3907), expectEq("eff", (8 * 10 + 24 * 10) / (32 * 20), 0.5)) },
]
