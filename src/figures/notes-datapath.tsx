import type { FigureMap } from "./figure"
import { Blocks } from "./kit"
import { PATHS, singleCycle } from "./datapath"

export const datapathNoteFigures: FigureMap = {
  "dp-full": {
    wide: true,
    caption: "The single-cycle datapath with control and jumps (slide 32). Control signals are written at the unit they drive.",
    node: <Blocks {...singleCycle()} />,
  },
  "dp-r": {
    wide: true,
    caption: "R-type (e.g. `add $t1, $t2, $t3`): read rs and rt, the ALU operates as funct says, the result is written to rd. PC = PC + 4.",
    node: <Blocks {...singleCycle(PATHS["R-format"])} />,
  },
  "dp-lw": {
    wide: true,
    caption: "Load (`lw $t1, offset($t2)`): rs + sign-extended offset gives the address; the data read from memory is written to rt.",
    node: <Blocks {...singleCycle(PATHS.lw)} />,
  },
  "dp-sw": {
    wide: true,
    caption: "Store (`sw $t1, offset($t2)`): rs + offset gives the address; rt is written to memory. No register is written.",
    node: <Blocks {...singleCycle(PATHS.sw)} />,
  },
  "dp-beq": {
    wide: true,
    caption: "Branch on equal: the ALU subtracts rs − rt; if Zero and Branch are both 1, PCSrc selects PC + 4 + offset × 4.",
    node: <Blocks {...singleCycle(PATHS.beq)} />,
  },
  "dp-j": {
    wide: true,
    caption: "Jump: the 26-bit field shifted left 2, with the upper 4 bits of PC + 4, becomes the new PC.",
    node: <Blocks {...singleCycle(PATHS.j)} />,
  },
}
