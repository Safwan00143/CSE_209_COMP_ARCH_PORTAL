import type { FigureMap } from "../figure"
import { BitFields, Blocks, Pipeline } from "../kit"
import type { Block, Wire } from "../builders"
import { pipeSpec } from "../pipe"

export const B20_Q1 = "sub $2, $1, $3\nand $2, $2, $5\nor $6, $2, $7"

/* Q7(d): lazy linkage through an indirection table (slide 64). */
const lzBlocks: Block[] = [
  { id: "text", x: 0, y: 0, w: 150, h: 60, label: ["Program text:", "jal → table entry"], size: 11.5 },
  { id: "table", x: 200, y: 0, w: 160, h: 60, label: ["Indirection table", "(data segment)"], size: 11.5 },
  { id: "stub", x: 200, y: 110, w: 160, h: 60, label: ["Stub: load routine ID,", "jump to linker/loader"], size: 11 },
  { id: "dl", x: 410, y: 110, w: 170, h: 60, label: ["Dynamic linker/loader:", "find, map, patch table"], size: 11 },
  { id: "dll", x: 410, y: 0, w: 170, h: 60, label: ["DLL routine", "(dynamically mapped code)"], size: 11 },
]
const lzWires: Wire[] = [
  { id: "a", pts: [[150, 30], [200, 30]] },
  { id: "b", pts: [[260, 60], [260, 110]], label: { at: [266, 85], text: "1st call", anchor: "start", size: 10.5 } },
  { id: "c", pts: [[360, 140], [410, 140]] },
  { id: "d", pts: [[495, 110], [495, 60]], label: { at: [501, 85], text: "then jump", anchor: "start", size: 10.5 } },
  { id: "e", pts: [[280, 0], [280, -24], [495, -24], [495, 0]], tone: "accent", label: { at: [388, -34], text: "later calls", size: 10.5 } },
]

export const paperB20Figures: FigureMap = {
  "b20-1a": { wide: true, caption: "Q1(a): no forwarding. Each instruction waits in ID until the value it needs is written back (write in the first half, read in the second half of the cycle). 4 stalls, 11 cycles.", node: <Pipeline {...pipeSpec(B20_Q1, { forwarding: false }).spec} /> },
  "b20-1b": { wide: true, caption: "Q1(b): with forwarding, both values come from EX/MEM (green arrows). No stalls, 7 cycles.", node: <Pipeline {...pipeSpec(B20_Q1, { forwarding: true }).spec} /> },
  "b20-4a-format": {
    wide: true,
    caption: "The branch format of Q4(a): opcode 4 (beq), rs, rt and a 16-bit address field.",
    node: <BitFields fields={[{ label: "4", bits: 6 }, { label: "rs", bits: 5 }, { label: "rt", bits: 5 }, { label: "address", bits: 16 }]} />,
  },
  "b20-lazy": { wide: true, caption: "Lazy linkage: the first call goes through a stub to the dynamic linker, which maps the routine and patches the table; later calls go straight through the table.", node: <Blocks blocks={lzBlocks} wires={lzWires} /> },
}
