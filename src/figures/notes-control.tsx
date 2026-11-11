import type { FigureMap } from "./figure"
import { Blocks } from "./kit"
import type { Block, Wire } from "./builders"

const H = 40
const st = (id: string, x: number, y: number, w: number, text: string): Block => ({ id, kind: "round", x, y, w, h: H, label: [text], size: 12 })

const blocks: Block[] = [
  st("s0", 230, 0, 180, "0 · Instruction fetch"),
  st("s1", 210, 80, 220, "1 · Decode / register fetch"),
  st("s2", 60, 180, 150, "2 · Memory address"),
  st("s6", 300, 180, 130, "6 · Execution"),
  st("s8", 450, 180, 160, "8 · Branch completion"),
  st("s9", 630, 180, 150, "9 · Jump completion"),
  st("s3", 0, 280, 130, "3 · Memory read"),
  st("s5", 150, 280, 140, "5 · Memory write"),
  st("s7", 310, 280, 170, "7 · R-type completion"),
  st("s4", 0, 380, 130, "4 · Write-back"),
]

const lab = (at: [number, number], text: string) => ({ at, text, anchor: "start" as const, size: 11 })

const wires: Wire[] = [
  { id: "0-1", pts: [[320, 40], [320, 80]] },
  { id: "1-bus", pts: [[320, 120], [320, 150]], arrow: "none" },
  { id: "bus1", pts: [[135, 150], [705, 150]], arrow: "none" },
  { id: "1-2", pts: [[135, 150], [135, 180]], label: lab([141, 165], "lw or sw") },
  { id: "1-6", pts: [[365, 150], [365, 180]], label: lab([371, 165], "R-type") },
  { id: "1-8", pts: [[530, 150], [530, 180]], label: lab([536, 165], "beq") },
  { id: "1-9", pts: [[705, 150], [705, 180]], label: lab([711, 165], "j") },
  { id: "2-bus", pts: [[135, 220], [135, 250]], arrow: "none" },
  { id: "bus2", pts: [[65, 250], [220, 250]], arrow: "none" },
  { id: "2-3", pts: [[65, 250], [65, 280]], label: lab([71, 265], "lw") },
  { id: "2-5", pts: [[220, 250], [220, 280]], label: lab([226, 265], "sw") },
  { id: "3-4", pts: [[65, 320], [65, 380]] },
  { id: "6-7", pts: [[365, 220], [365, 280]] },
  // Back to state 0.
  { id: "4-back", pts: [[0, 400], [-30, 400], [-30, 20], [230, 20]] },
  { id: "5-back", pts: [[220, 320], [220, 345], [-30, 345]], arrow: "none" },
  { id: "7-back", pts: [[395, 320], [395, 345], [220, 345]], arrow: "none" },
  { id: "8-back", pts: [[530, 220], [530, 240], [810, 240], [810, 20], [410, 20]] },
  { id: "9-back", pts: [[705, 220], [705, 240]], arrow: "none" },
]

export const controlNoteFigures: FigureMap = {
  "ctl-fsm": {
    wide: true,
    caption: "The multicycle control FSM (Appendix D, Figure D.3.1). Every instruction starts with states 0 and 1; state 1 dispatches on the opcode. lw takes 5 states, sw and R-type 4, beq and j 3. The last state of each returns to state 0.",
    node: <Blocks blocks={blocks} wires={wires} />,
  },
}
