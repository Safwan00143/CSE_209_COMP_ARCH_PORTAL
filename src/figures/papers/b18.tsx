import type { FigureMap } from "../figure"
import { Pipeline } from "../kit"
import { pipeSpec } from "../pipe"

export const B18_Q4 = "lw $t0, 0($t1)\nadd $t0, $t0, $t1\nadd $t0, $t2, $t0\nadd $t0, $t0, $t3\nsub $t1, $t2, $t3\nand $t4, $t5, $t6\nsw $t0, 0($t6)"

export const paperB18Figures: FigureMap = {
  "b18-4": {
    wide: true,
    caption: "With forwarding: one load-use stall, then EX/MEM → EX forwarding for each add; 12 cycles.",
    node: <Pipeline {...pipeSpec(B18_Q4, { forwarding: true }, { forwards: true }).spec} />,
  },
}
