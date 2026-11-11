import type { FigureMap } from "../figure"
import { Blocks, Pipeline } from "../kit"
import type { Block, Wire } from "../builders"
import { pipeSpec } from "../pipe"

export const B21_Q1C = "lw $t1, 4($t0)\nlw $t2, 8($t0)\nadd $t3, $t1, $t2\nsw $t3, 0($t0)\nlw $t4, 16($t0)\nadd $t5, $t3, $t4\nsw $t5, 12($t0)"
export const B21_Q1C_SCHED = "lw $t1, 4($t0)\nlw $t2, 8($t0)\nlw $t4, 16($t0)\nadd $t3, $t1, $t2\nsw $t3, 0($t0)\nadd $t5, $t3, $t4\nsw $t5, 12($t0)"
export const B21_Q2 = "lw $t0, 55($t1)\naddi $t1, $t0, 1\nlw $t0, 57($t1)\nsw $t0, 32($t4)"

/* Q1(a): FP addition flowchart (P&H Figure 3.14 as on the slides' four steps). */
const W = 270
const fb = (id: string, y: number, text: string[], kind: Block["kind"] = "rect", h = 46, x = 40, w = W): Block => ({ id, kind, x, y, w, h, label: text, size: 11.5 })
const fpBlocks: Block[] = [
  fb("start", 0, ["Start"], "pill", 30, 125, 100),
  fb("s1", 56, ["1. Compare the exponents; shift the", "smaller number right until they match"], "rect", 50),
  fb("s2", 132, ["2. Add the significands"], "rect", 40),
  fb("s3", 198, ["3. Normalise: shift right and increment the", "exponent, or shift left and decrement it"], "rect", 50, 15, 320),
  fb("ovf", 276, ["Overflow or", "underflow?"], "diamond", 76, 100, 150),
  fb("exc", 290, ["Exception"], "rect", 46, 340, 110),
  fb("s4", 380, ["4. Round the significand to the", "appropriate number of bits"], "rect", 50),
  fb("norm", 456, ["Still", "normalised?"], "diamond", 76, 100, 150),
  fb("done", 560, ["Done"], "pill", 30, 125, 100),
]
const lab = (at: [number, number], text: string, anchor: "start" | "middle" | "end" = "start") => ({ at, text, anchor, size: 10.5 })
const fpWires: Wire[] = [
  { id: "a", pts: [[175, 30], [175, 56]] },
  { id: "b", pts: [[175, 106], [175, 132]] },
  { id: "c", pts: [[175, 172], [175, 198]] },
  { id: "d", pts: [[175, 248], [175, 276]] },
  { id: "yes", pts: [[250, 314], [340, 314]], label: lab([262, 304], "Yes") },
  { id: "no", pts: [[175, 352], [175, 380]], label: lab([181, 366], "No") },
  { id: "e", pts: [[175, 430], [175, 456]] },
  { id: "y2", pts: [[175, 532], [175, 560]], label: lab([181, 546], "Yes") },
  { id: "n2", pts: [[100, 494], [10, 494], [10, 223], [40, 223]], label: lab([16, 484], "No") },
]

/* Q3: next-PC logic for beq, bneq, j, jr using only 2-to-1 muxes. */
const pcBlocks: Block[] = [
  { id: "pc", x: 0, y: 150, w: 40, h: 50, label: ["PC"], size: 12 },
  { id: "add4", kind: "alu", x: 80, y: 20, w: 46, h: 70, label: ["Add"], size: 11 },
  { id: "shl", kind: "ellipse", x: 90, y: 230, w: 66, h: 36, label: ["Shift", "left 2"], size: 10 },
  { id: "addb", kind: "alu", x: 200, y: 160, w: 50, h: 76, label: ["Add"], size: 11 },
  { id: "m1", kind: "mux", x: 300, y: 60, w: 22, h: 60, size: 10 },
  { id: "jshl", kind: "ellipse", x: 200, y: 300, w: 66, h: 36, label: ["Shift", "left 2"], size: 10 },
  { id: "m2", kind: "mux", x: 380, y: 80, w: 22, h: 60, size: 10 },
  { id: "m3", kind: "mux", x: 460, y: 100, w: 22, h: 60, size: 10 },
  { id: "and1", kind: "round", x: 300, y: 380, w: 52, h: 26, label: ["AND"], size: 10 },
  { id: "and2", kind: "round", x: 300, y: 420, w: 52, h: 26, label: ["AND"], size: 10 },
  { id: "or", kind: "round", x: 380, y: 400, w: 44, h: 26, label: ["OR"], size: 10 },
]
const pcWires: Wire[] = [
  { id: "pc-add", pts: [[40, 175], [60, 175], [60, 35], [80, 35]] },
  { id: "four", pts: [[60, 75], [80, 75]], label: lab([56, 75], "4", "end") },
  { id: "pc4", pts: [[126, 55], [280, 55], [280, 75], [300, 75]], label: lab([200, 45], "PC + 4") },
  { id: "pc4-b", pts: [[170, 55], [170, 176], [200, 176]], dot: true },
  { id: "imm", pts: [[30, 248], [90, 248]], label: lab([26, 248], "sign-ext imm", "end") },
  { id: "shl-b", pts: [[156, 248], [180, 248], [180, 220], [200, 220]] },
  { id: "b-m1", pts: [[250, 198], [280, 198], [280, 105], [300, 105]], label: lab([276, 150], "branch target", "end") },
  { id: "m1-m2", pts: [[322, 90], [350, 90], [350, 95], [380, 95]] },
  { id: "jf", pts: [[150, 318], [200, 318]], label: lab([146, 318], "Instruction[25–0]", "end") },
  { id: "j-m2", pts: [[266, 318], [360, 318], [360, 125], [380, 125]], label: lab([366, 290], "PC + 4[31–28] : addr : 00") },
  { id: "m2-m3", pts: [[402, 110], [430, 110], [430, 115], [460, 115]] },
  { id: "rs", pts: [[440, 240], [440, 145], [460, 145]], label: lab([446, 246], "Read data 1 (rs)") },
  { id: "out", pts: [[482, 130], [520, 130], [520, -10], [-20, -10], [-20, 175], [0, 175]] },
  { id: "z1", pts: [[260, 386], [300, 386]], label: lab([256, 386], "Branch, Zero", "end") },
  { id: "z2", pts: [[260, 440], [300, 440]], label: lab([256, 440], "BranchNE, Zero′", "end") },
  { id: "a1o", pts: [[352, 393], [366, 393], [366, 408], [380, 408]] },
  { id: "a2o", pts: [[352, 433], [366, 433], [366, 418], [380, 418]] },
  { id: "pcsrc", pts: [[424, 413], [450, 413], [450, 360], [311, 360], [311, 120]], label: lab([456, 386], "PCSrc") },
  { id: "jsel", pts: [[391, 160], [391, 140]], arrow: "end", label: lab([396, 168], "Jump") },
  { id: "jrsel", pts: [[471, 180], [471, 160]], label: lab([476, 186], "JumpReg") },
]

/* Q10(b): TLB and data cache with the given widths. */
const tlbBlocks: Block[] = [
  { id: "va", x: 0, y: 0, w: 480, h: 30, label: ["Virtual address (64 bits): VPN 63–15 (49 bits) | page offset 14–0 (15 bits)"], size: 11 },
  { id: "tlb", x: 0, y: 70, w: 480, h: 70, label: ["TLB: 32 entries, fully associative (32 comparators)", "entry = valid 1 | dirty 1 | bookkeeping 24 | tag (VPN) 49 | PPN 21 = 96 bits"], size: 11 },
  { id: "pa", x: 0, y: 180, w: 480, h: 30, label: ["Physical address (36 bits): PPN 35–15 (21) | page offset 14–0 (15)"], size: 11 },
  { id: "split", x: 0, y: 250, w: 480, h: 30, label: ["Cache view: tag 35–16 (20) | index 15–8 (8) | offset 7–0 (8)"], size: 11 },
  { id: "cache", x: 0, y: 320, w: 480, h: 70, label: ["Data cache: 64 KiB, direct mapped, 256 blocks of 64 words", "entry = valid 1 | tag 20 | data 2048 bits"], size: 11 },
]
const tlbWires: Wire[] = [
  { id: "a", pts: [[280, 30], [280, 70]], label: lab([288, 50], "VPN compared with all 32 tags") },
  { id: "b", pts: [[280, 140], [280, 180]], label: lab([288, 160], "hit: PPN; miss: TLB-miss exception") },
  { id: "c", pts: [[280, 210], [280, 250]] },
  { id: "d", pts: [[280, 280], [280, 320]], label: lab([288, 300], "index selects 1 of 256 entries; compare tag") },
  { id: "e", pts: [[560, 355], [600, 355]], label: lab([606, 355], "Hit, data") },
]

export const paperB21Figures: FigureMap = {
  "b21-1a-flow": {
    caption: "Floating-point addition, step by step (P&H Figure 3.14). Rounding can denormalise the result, which sends it back to step 3.",
    node: <Blocks blocks={fpBlocks} wires={fpWires} />,
  },
  "b21-1c-before": { wide: true, caption: "As compiled: two load-use stalls, 13 cycles.", node: <Pipeline {...pipeSpec(B21_Q1C, { forwarding: true }).spec} /> },
  "b21-1c-after": { wide: true, caption: "The load of E moved up: no stalls, 11 cycles.", node: <Pipeline {...pipeSpec(B21_Q1C_SCHED, { forwarding: true }).spec} /> },
  "b21-2-pipe": { wide: true, caption: "With forwarding and hazard detection: the two load-use hazards each cost one stall. 10 cycles.", node: <Pipeline {...pipeSpec(B21_Q2, { forwarding: true }).spec} /> },
  "b21-3-pc": {
    wide: true,
    caption: "Next-PC logic with only 2-to-1 muxes: PCSrc picks the branch target for a taken beq or bneq, Jump picks the jump address, JumpReg picks the register value for jr.",
    node: <Blocks blocks={pcBlocks} wires={pcWires} />,
  },
  "b21-10b": { wide: true, caption: "Q10(b): the TLB translates the virtual page number; the physical address then indexes the direct-mapped, physically indexed and tagged data cache.", node: <Blocks blocks={tlbBlocks} wires={tlbWires} /> },
}
