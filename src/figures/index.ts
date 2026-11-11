import type { FigureMap } from "./figure"
import { kitDemoFigures } from "./kit-demo"
import { isaNoteFigures } from "./notes-isa"
import { arithNoteFigures } from "./notes-arith"
import { fpNoteFigures } from "./notes-fp"
import { aluNoteFigures } from "./notes-alu"
import { datapathNoteFigures } from "./notes-datapath"
import { controlNoteFigures } from "./notes-control"
import { pipeNoteFigures } from "./notes-pipe"
import { hazardNoteFigures } from "./notes-hazard"
import { memNoteFigures } from "./notes-mem"
import { vmNoteFigures } from "./notes-vm"
import { gpuNoteFigures } from "./notes-gpu"
import { paperB22Figures } from "./papers/b22"
import { paperB21Figures } from "./papers/b21"
import { paperB20Figures } from "./papers/b20"
import { paperB19Figures } from "./papers/b19"
import { paperB18Figures } from "./papers/b18"
import { paperB17Figures } from "./papers/b17"
import { paperB16Figures } from "./papers/b16"
import { bookFigures } from "./book"

/** Every figure on the site, by id. A ```fig block naming an id not listed here renders "Missing figure". */
export const figures: FigureMap = {
  ...bookFigures,
  ...paperB16Figures,
  ...paperB17Figures,
  ...paperB18Figures,
  ...paperB19Figures,
  ...paperB20Figures,
  ...paperB21Figures,
  ...paperB22Figures,
  ...gpuNoteFigures,
  ...vmNoteFigures,
  ...memNoteFigures,
  ...hazardNoteFigures,
  ...pipeNoteFigures,
  ...controlNoteFigures,
  ...datapathNoteFigures,
  ...aluNoteFigures,
  ...fpNoteFigures,
  ...arithNoteFigures,
  ...kitDemoFigures,
  ...isaNoteFigures,
}
