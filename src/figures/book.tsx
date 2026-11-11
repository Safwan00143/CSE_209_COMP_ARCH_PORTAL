import type { FigureMap } from "./figure"
import { Pipeline } from "./kit"
import { pipeSpec } from "./pipe"
import { BKB } from "@/content/book/part-b"

export const bookFigures: FigureMap = {
  "bk-dh-forward": {
    wide: true,
    caption: "With forwarding: one load-use stall before `add`, then every value is forwarded or read in time.",
    node: <Pipeline {...pipeSpec(BKB.dh1, { forwarding: true }, { forwards: true }).spec} />,
  },
}
