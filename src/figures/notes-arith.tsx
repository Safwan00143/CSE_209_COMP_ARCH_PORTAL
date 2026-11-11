import type { FigureMap } from "./figure"
import { Blocks } from "./kit"
import type { Block, Wire } from "./builders"

/* First-version multiplier (P&H Figure 3.3 as on the slide): 64-bit Multiplicand (shift left),
   64-bit ALU, 64-bit Product, 32-bit Multiplier (shift right), control test. */
const v1Blocks: Block[] = [
  { id: "mcand", x: 60, y: 0, w: 190, h: 48, label: ["Multiplicand"], ports: [{ at: [186, 39], text: "Shift left", anchor: "end" }] },
  { id: "alu", kind: "rect", x: 40, y: 96, w: 140, h: 44, label: ["64-bit ALU"] },
  { id: "prod", x: 40, y: 190, w: 190, h: 40, label: ["Product"], ports: [{ at: [186, 31], text: "Write", anchor: "end" }] },
  { id: "mplier", x: 330, y: 92, w: 110, h: 44, label: ["Multiplier"], ports: [{ at: [106, 36], text: "Shift right", anchor: "end" }] },
  { id: "ctl", kind: "ellipse", x: 300, y: 180, w: 110, h: 42, label: ["Control test"], size: 12.5 },
]
const v1Wires: Wire[] = [
  { id: "m-alu", pts: [[155, 48], [155, 96]], label: { at: [182, 72], text: "64 bits" } },
  { id: "alu-p", pts: [[110, 140], [110, 190]] },
  { id: "p-alu", pts: [[40, 210], [16, 210], [16, 118], [40, 118]] },
  { id: "p-out", pts: [[135, 230], [135, 256]], arrow: "end", label: { at: [162, 247], text: "64 bits" } },
  { id: "mp-ctl", pts: [[385, 136], [385, 180]], label: { at: [412, 160], text: "Multiplier₀" } },
  { id: "ctl-p", pts: [[300, 201], [230, 210]] },
  { id: "ctl-m", pts: [[312, 190], [290, 190], [290, 24], [250, 24]], tone: "muted" },
  { id: "ctl-mp", pts: [[410, 200], [460, 200], [460, 114], [440, 114]], tone: "muted" },
]

/* Refined multiplier (slide "Optimized Multiplier"): 32-bit Multiplicand, 32-bit ALU,
   64-bit Product that holds the multiplier in its right half and shifts right. */
const v2Blocks: Block[] = [
  { id: "mcand", x: 130, y: 0, w: 140, h: 38, label: ["Multiplicand"] },
  { id: "alu", x: 60, y: 84, w: 140, h: 44, label: ["32-bit ALU"] },
  { id: "prod", x: 40, y: 180, w: 230, h: 42, label: ["Product"], ports: [{ at: [226, 12], text: "Shift right", anchor: "end" }, { at: [226, 32], text: "Write", anchor: "end" }] },
  { id: "ctl", kind: "ellipse", x: 320, y: 176, w: 100, h: 46, label: ["Control", "test"], size: 12 },
]
const v2Wires: Wire[] = [
  { id: "m-alu", pts: [[200, 38], [200, 60], [160, 60], [160, 84]], label: { at: [232, 60], text: "32 bits" } },
  { id: "p-alu", pts: [[100, 180], [100, 154], [20, 154], [20, 70], [100, 70], [100, 84]] },
  { id: "alu-p", pts: [[130, 128], [130, 180]] },
  { id: "ctl-p", pts: [[320, 199], [270, 199]] },
  { id: "p0", pts: [[250, 222], [250, 240], [370, 240], [370, 222]], label: { at: [310, 252], text: "Product₀ (multiplier bit)" } },
]

/* Flowcharts. */
function flow(steps: { id: string; text: string[]; kind?: Block["kind"]; h?: number }[], x = 0, w = 250): Block[] {
  let y = 0
  return steps.map((s) => {
    const h = s.h ?? (s.kind === "diamond" ? 70 : s.kind === "pill" ? 30 : 22 + 16 * s.text.length)
    const b: Block = { id: s.id, kind: s.kind ?? "rect", x: s.kind === "pill" ? x + w / 2 - 50 : x, y, w: s.kind === "pill" ? 100 : w, h, label: s.text, size: 12 }
    y += h + 26
    return b
  })
}

const v1Flow = flow([
  { id: "start", text: ["Start"], kind: "pill" },
  { id: "test", text: ["1. Test", "Multiplier₀"], kind: "diamond", h: 78 },
  { id: "add", text: ["1a. Add Multiplicand to Product,", "result in Product register"] },
  { id: "shl", text: ["2. Shift Multiplicand left 1 bit"] },
  { id: "shr", text: ["3. Shift Multiplier right 1 bit"] },
  { id: "rep", text: ["32nd", "repetition?"], kind: "diamond", h: 78 },
  { id: "done", text: ["Done"], kind: "pill" },
], 60)

function flowWires(b: Block[], loopTo: string, skipFrom: string, skipTo: string, yes: string, no: string): Wire[] {
  const by = Object.fromEntries(b.map((x) => [x.id, x]))
  const mid = (x: Block) => x.x + x.w / 2
  const wires: Wire[] = []
  for (let i = 0; i + 1 < b.length; i++) {
    const a = b[i]
    const c = b[i + 1]
    if (a.id === "rep") continue
    wires.push({ id: `${a.id}-${c.id}`, pts: [[mid(a), a.y + a.h], [mid(c), c.y]], label: a.id === skipFrom ? { at: [mid(a) + 22, a.y + a.h + 12], text: yes, anchor: "start" } : undefined })
  }
  const s = by[skipFrom]
  const t = by[skipTo]
  wires.push({ id: "skip", pts: [[s.x + s.w, s.y + s.h / 2], [s.x + s.w + 30, s.y + s.h / 2], [s.x + s.w + 30, t.y - 13], [mid(t), t.y - 13], [mid(t), t.y]], label: { at: [s.x + s.w + 16, s.y + s.h / 2 - 12], text: no, anchor: "start" } })
  const r = by.rep
  const d = by.done
  const l = by[loopTo]
  wires.push({ id: "rep-done", pts: [[mid(r), r.y + r.h], [mid(d), d.y]], label: { at: [mid(r) + 12, r.y + r.h + 12], text: "Yes: 32 repetitions", anchor: "start" } })
  wires.push({ id: "rep-loop", pts: [[r.x, r.y + r.h / 2], [r.x - 40, r.y + r.h / 2], [r.x - 40, l.y + l.h / 2], [l.x, l.y + l.h / 2]], label: { at: [r.x - 6, r.y + r.h / 2 + 14], text: "No: < 32", anchor: "end" } })
  return wires
}

const v2Flow = flow([
  { id: "start", text: ["Start"], kind: "pill" },
  { id: "test", text: ["1. Test", "Product₀"], kind: "diamond", h: 78 },
  { id: "add", text: ["1a. Add Multiplicand to the left", "half of Product, result there"] },
  { id: "shr", text: ["2. Shift Product register right 1 bit"] },
  { id: "rep", text: ["32nd", "repetition?"], kind: "diamond", h: 78 },
  { id: "done", text: ["Done"], kind: "pill" },
], 60)

export const arithNoteFigures: FigureMap = {
  "arith-mult-v1": {
    caption: "First multiplier: a 64-bit Multiplicand register that shifts left, a 64-bit ALU, a 64-bit Product register (initially 0) and a 32-bit Multiplier register that shifts right. Control tests the multiplier's rightmost bit.",
    node: <Blocks blocks={v1Blocks} wires={v1Wires} />,
  },
  "arith-mult-v1-flow": {
    caption: "Its algorithm: three steps per multiplier bit, repeated 32 times.",
    node: <Blocks blocks={v1Flow} wires={flowWires(v1Flow, "test", "test", "shl", "Multiplier₀ = 1", "Multiplier₀ = 0")} />,
  },
  "arith-mult-v2": {
    caption: "Refined multiplier: the multiplicand stays put, the ALU is 32 bits, and the multiplier lives in the right half of the 64-bit Product register, which shifts right. One cycle per partial-product addition.",
    node: <Blocks blocks={v2Blocks} wires={v2Wires} />,
  },
  "arith-mult-v2-flow": {
    caption: "Refined algorithm: test the product's rightmost bit, add into the left half, shift the whole product right.",
    node: <Blocks blocks={v2Flow} wires={flowWires(v2Flow, "test", "test", "shr", "Product₀ = 1", "Product₀ = 0")} />,
  },
}
