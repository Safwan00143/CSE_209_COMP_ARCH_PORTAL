import type { FigureMap } from "../figure"
import { Blocks, Pipeline } from "../kit"
import type { Block, Wire } from "../builders"
import { pipeSpec } from "../pipe"
import { SRC } from "../notes-pipe"

/* Q2(b): dynamically scheduled CPU (slide 100, P&H Figure 4.74). */
const rs = (i: number, label: string): Block[] => [
  { id: `rs${i}`, x: 10 + i * 130, y: 90, w: 110, h: 40, label: ["Reservation", "station"], size: 10.5 },
  { id: `fu${i}`, x: 10 + i * 130, y: 170, w: 110, h: 40, label: [label], size: 11 },
]
const dynBlocks: Block[] = [
  { id: "ifu", x: 100, y: 0, w: 340, h: 40, label: ["Instruction fetch and decode unit (in-order issue)"], size: 11.5 },
  ...rs(0, "Integer"),
  ...rs(1, "Integer"),
  ...rs(2, "Floating point"),
  ...rs(3, "Load-store"),
  { id: "commit", x: 120, y: 260, w: 300, h: 50, label: ["Commit unit with reorder buffer", "(in-order commit)"], size: 11.5 },
]
const dynWires: Wire[] = [
  { id: "bus", pts: [[65, 64], [455, 64]], arrow: "none" },
  { id: "if-bus", pts: [[270, 40], [270, 64]], arrow: "none" },
  ...[0, 1, 2, 3].flatMap((i): Wire[] => [
    { id: `d${i}`, pts: [[65 + i * 130, 64], [65 + i * 130, 90]] },
    { id: `e${i}`, pts: [[65 + i * 130, 130], [65 + i * 130, 170]] },
    { id: `c${i}`, pts: [[65 + i * 130, 210], [65 + i * 130, 236], [270, 236], [270, 260]], arrow: i === 1 || i === 2 ? "none" : "end" },
  ]),
  { id: "fwd", pts: [[540, 190], [560, 190], [560, 110], [530, 110]], tone: "accent", label: { at: [566, 150], text: "results also go to waiting reservation stations", anchor: "start", size: 10.5 } },
]

export const paperB19Figures: FigureMap = {
  "b19-1b-before": { wide: true, caption: "As written: two load-use stalls, 13 cycles.", node: <Pipeline {...pipeSpec(SRC.schedBefore, { forwarding: true }).spec} /> },
  "b19-1b-after": { wide: true, caption: "With the third load moved up: 11 cycles.", node: <Pipeline {...pipeSpec(SRC.schedAfter, { forwarding: true }).spec} /> },
  "b19-2b": {
    wide: true,
    caption: "A dynamically scheduled multiple-issue (superscalar) CPU: in-order issue, out-of-order execute, in-order commit.",
    node: <Blocks blocks={dynBlocks} wires={dynWires} />,
  },
}
