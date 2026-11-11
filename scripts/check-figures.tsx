/*
  Checks every figure on the site without a browser:
    1. every ```fig id used in notes, papers and book problems exists in the registry;
    2. every state diagram has no label on a line or state, no overlapping labels,
       and no edge cutting through a state (see diagramIssues);
    3. every scene (pipeline diagrams, bit fields, block diagrams, flowcharts,
       pyramids) has no overlapping labels, no label crossed by a line it does
       not belong to, no label spilling out of its box, nothing outside the view.
  Exits non-zero on any problem.

    npm run check:figures
*/
import { isValidElement, type ReactElement, type ReactNode } from "react"
import { figures } from "../src/figures"
import { BitFields, BitStrips, Blocks, Pipeline, Pyramid, SceneSvg, StateDiagram } from "../src/figures/kit"
import { bitFieldScene, bitStripScene, blockScene, pipelineScene, pyramidScene } from "../src/figures/builders"
import { sceneIssues, type Scene } from "../src/figures/scene"
import { diagramGeometry, diagramIssues } from "../src/figures/diagram-geometry"
import { notes } from "../src/content/notes"
import { papers } from "../src/content/papers"
import { bookProblems } from "../src/content/book"

let problems = 0

/* 1. Figure ids referenced from content */
const sources: [string, string][] = [
  ...Object.entries(notes).map(([k, v]) => [`note ${k}`, v ?? ""] as [string, string]),
  ...papers.flatMap((p) =>
    p.sections.flatMap((s) =>
      s.questions.flatMap((q) => [
        [`${p.slug} Q${q.no} stem`, q.stem ?? ""] as [string, string],
        ...q.parts.flatMap((part) => [
          [`${p.slug} ${q.no}${part.part} prompt`, part.prompt] as [string, string],
          [`${p.slug} ${q.no}${part.part} solution`, part.solution ?? ""] as [string, string],
        ]),
      ]),
    ),
  ),
  ...bookProblems.flatMap((b) => [[`${b.id} prompt`, b.prompt] as [string, string], [`${b.id} solution`, b.solution] as [string, string]]),
]
const used = new Set<string>()
for (const [where, text] of sources) {
  for (const block of text.matchAll(/```fig\n([\s\S]*?)```/g)) {
    for (const id of block[1].split("\n").map((s) => s.trim()).filter(Boolean)) {
      used.add(id)
      if (!figures[id]) {
        problems++
        console.log(`MISSING figure "${id}" referenced in ${where}`)
      }
    }
  }
}

/* 2–3. Geometry of every diagram */
type AnyEl = ReactElement<Record<string, unknown>>
function elements(node: ReactNode, out: AnyEl[] = []) {
  if (Array.isArray(node)) node.forEach((n) => elements(n, out))
  else if (isValidElement(node)) {
    out.push(node as AnyEl)
    elements((node.props as { children?: ReactNode }).children, out)
  }
  return out
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const sceneOf = new Map<unknown, (p: any) => Scene>([
  [SceneSvg, (p) => p.scene],
  [Pipeline, pipelineScene],
  [BitFields, bitFieldScene],
  [BitStrips, (p) => bitStripScene(p.rows)],
  [Blocks, blockScene],
  [Pyramid, (p) => pyramidScene(p.levels)],
])
/* eslint-enable @typescript-eslint/no-explicit-any */

let diagramsChecked = 0
let scenesChecked = 0
for (const [id, entry] of Object.entries(figures)) {
  elements(entry.node).forEach((el, k) => {
    if (el.type === StateDiagram) {
      diagramsChecked++
      const p = el.props as Parameters<typeof StateDiagram>[0]
      const issues = diagramIssues(diagramGeometry(p.machine, p.layout, p.labels))
      if (issues.length) {
        problems++
        console.log(`LAYOUT ${id}\n    ${issues.join("\n    ")}`)
      }
    }
    const build = sceneOf.get(el.type)
    if (build) {
      scenesChecked++
      const issues = sceneIssues(build(el.props), `${id}#${k}`)
      if (issues.length) {
        problems++
        console.log(`LAYOUT ${id}\n    ${issues.join("\n    ")}`)
      }
    }
  })
}

const unused = Object.keys(figures).filter((id) => !used.has(id) && !id.startsWith("kit-"))
console.log(`\n${diagramsChecked} state diagrams and ${scenesChecked} scenes checked; ${used.size} figure ids referenced; ${unused.length} registry figures not referenced yet.`)
if (unused.length) console.log(`  not referenced: ${unused.join(", ")}`)
if (problems) {
  console.log(`${problems} problem(s).`)
  process.exit(1)
}
console.log("No problems.")
