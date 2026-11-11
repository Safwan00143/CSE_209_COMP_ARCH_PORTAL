import type { FigureMap } from "./figure"
import { BitFields, Blocks } from "./kit"
import type { Block, Wire } from "./builders"
import { encode, SINGLE } from "@/lib/ieee"

const m075 = encode(-0.75, SINGLE)

/* The FP adder (slide 22), drawn as its four steps with the slide's unit names. */
const W = 300
const X = 120
const adderBlocks: Block[] = [
  { id: "in", x: X, y: 0, w: W, h: 30, label: ["Two numbers: sign, exponent, fraction"], size: 12 },
  { id: "small", x: X, y: 58, w: W, h: 40, label: ["Small ALU: exponent difference"], size: 12.5 },
  { id: "shr", x: X, y: 124, w: W, h: 40, label: ["Shift right the smaller number's significand"], size: 12 },
  { id: "big", x: X, y: 202, w: W, h: 40, label: ["Big ALU: add the significands"], size: 12.5 },
  { id: "norm", x: X, y: 280, w: W, h: 48, label: ["Shift left or right (significand)", "Increment or decrement (exponent)"], size: 12 },
  { id: "round", x: X, y: 366, w: W, h: 40, label: ["Rounding hardware"], size: 12.5 },
  { id: "out", x: X, y: 444, w: W, h: 30, label: ["Result: sign, exponent, fraction"], size: 12 },
]
const step = (y0: number, y1: number, text: string, id: string): Block => ({ id, x: 0, y: y0, w: 96, h: y1 - y0, label: [text], size: 12, fill: "muted", tone: "muted" })
const stepBlocks: Block[] = [step(58, 164, "Step 1", "s1"), step(202, 242, "Step 2", "s2"), step(280, 328, "Step 3", "s3"), step(366, 406, "Step 4", "s4")]
const cx = X + W / 2
const adderWires: Wire[] = [
  { id: "a", pts: [[cx, 30], [cx, 58]] },
  { id: "b", pts: [[cx, 98], [cx, 124]] },
  { id: "c", pts: [[cx, 164], [cx, 202]] },
  { id: "d", pts: [[cx, 242], [cx, 280]] },
  { id: "e", pts: [[cx, 328], [cx, 366]] },
  { id: "f", pts: [[cx, 406], [cx, 444]] },
  { id: "again", pts: [[X + W, 386], [X + W + 30, 386], [X + W + 30, 304], [X + W, 304]], tone: "accent", label: { at: [X + W + 36, 345], text: "renormalise if rounding overflows", anchor: "start", size: 11 } },
]

export const fpNoteFigures: FigureMap = {
  "fp-single": {
    wide: true,
    caption: "IEEE 754 single precision: 1 sign bit, 8-bit biased exponent (bias 127), 23-bit fraction. Shown: −0.75 = BF40 0000 (hex).",
    node: (
      <BitFields
        fields={[
          { label: "S", bits: 1, value: m075.sign },
          { label: "exponent", bits: 8, value: m075.exponent },
          { label: "fraction", bits: 23, value: m075.fraction.slice(0, 8) + "…0", tone: "accent" },
        ]}
      />
    ),
  },
  "fp-double": {
    wide: true,
    caption: "IEEE 754 double precision: 1 sign bit, 11-bit exponent (bias 1023), 52-bit fraction.",
    node: <BitFields fields={[{ label: "S", bits: 1 }, { label: "exponent", bits: 11 }, { label: "fraction", bits: 52 }]} scale={8.5} />,
  },
  "fp-adder": {
    caption: "The FP adder's hardware, step by step. The control unit (not drawn) uses the exponent difference to pick which significand to shift and by how much.",
    node: <Blocks blocks={[...adderBlocks, ...stepBlocks]} wires={adderWires} />,
  },
}
