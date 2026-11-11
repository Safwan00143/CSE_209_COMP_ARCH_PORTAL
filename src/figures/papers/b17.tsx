import type { FigureMap } from "../figure"
import { Pipeline } from "../kit"
import { pipeSpec } from "../pipe"

export const B17_Q5_BEFORE = "lw $t1, 0($t0)\nlw $t2, 4($t0)\nadd $t3, $t1, $t2\nsw $t3, 12($t0)\nlw $t4, 8($t0)\nadd $t4, $t3, $t4\nsw $t4, 8($t0)"
export const B17_Q5_AFTER = "lw $t1, 0($t0)\nlw $t2, 4($t0)\nlw $t4, 8($t0)\nadd $t3, $t1, $t2\nsw $t3, 12($t0)\nadd $t4, $t3, $t4\nsw $t4, 8($t0)"
export const B17_Q8C = "sub $2, $1, $3\nand $12, $2, $5\nor $13, $6, $2"

export const paperB17Figures: FigureMap = {
  "b17-5-before": {
    wide: true,
    caption: "As written, with forwarding: two load-use stalls, 13 cycles.",
    node: <Pipeline {...pipeSpec(B17_Q5_BEFORE, { forwarding: true }, { forwards: true }).spec} />,
  },
  "b17-5-after": {
    wide: true,
    caption: "With `lw $t4` moved up: no stalls, 11 cycles.",
    node: <Pipeline {...pipeSpec(B17_Q5_AFTER, { forwarding: true }, { forwards: true }).spec} />,
  },
  "b17-8c": {
    wide: true,
    caption: "sub → and: EX/MEM → EX (the green path); sub → or: MEM/WB → EX (the yellow path).",
    node: <Pipeline {...pipeSpec(B17_Q8C, { forwarding: true }, { forwards: true }).spec} />,
  },
}
