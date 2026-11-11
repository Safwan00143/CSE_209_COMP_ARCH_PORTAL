import type { Paper, PaperPart, PaperQuestion, Question } from "../types"
import { paperList } from "./list"

export { withSolutions } from "./with-solutions"

/** Newest first. Each file holds one whole paper in printed order. */
export const papers: Paper[] = [...paperList].sort((a, b) => b.year - a.year || b.slug.localeCompare(a.slug))

export function getPaper(slug: string) {
  return papers.find((p) => p.slug === slug)
}

/** Id of one part's own solution page, e.g. "1a", or "5" for an unlettered question. */
export const partKey = (q: PaperQuestion, part: PaperPart) => `${q.no}${part.part}`

/** Every part of a paper with its question, in printed order. */
export function paperParts(p: Paper) {
  return p.sections.flatMap((s) => s.questions.flatMap((q) => q.parts.map((part) => ({ q, part }))))
}

/** True when the prompt's last line closes a block (display maths, a code or figure fence, a table row). */
function endsInBlock(prompt: string) {
  const last = prompt.trimEnd().split("\n").at(-1)!.trim()
  return last.endsWith("$$") || last.startsWith("```") || last.startsWith("|")
}

function label(no: number, letters: string[]) {
  if (letters.length === 1) return letters[0] ? `Q${no}(${letters[0]})` : `Q${no}`
  const run = letters.every((l, i) => i === 0 || l.charCodeAt(0) === letters[i - 1].charCodeAt(0) + 1)
  return run && letters.length > 2 ? `Q${no}(${letters[0]})–(${letters.at(-1)})` : `Q${no}` + letters.map((l) => `(${l})`).join(",")
}

/**
 * The same parts as topic-wise practice questions. Neighbouring parts of one
 * question on the same topic become one entry, e.g. "Q4(a)–(c)". Parts outside
 * the slides are left out.
 */
function toQuestions(p: Paper): Question[] {
  const out: Question[] = []
  for (const section of p.sections) {
    for (const q of section.questions) {
      const groups: PaperPart[][] = []
      for (const part of q.parts) {
        if (part.outOfScope) {
          groups.push([]) // breaks a run, so parts on either side are not merged across it
          continue
        }
        const last = groups.at(-1)
        if (last && last.length && last[0].topic === part.topic) last.push(part)
        else groups.push([part])
      }
      for (const g of groups.filter((x) => x.length)) {
        const letters = g.map((x) => x.part)
        const single = g.length === 1
        const parts = single
          ? g[0].prompt
          : g
              // Marks may not share a line with a closing $$, a closing ``` fence or a table row: each would break the block.
              .map((x) => `**(${x.part})** ${x.prompt}${endsInBlock(x.prompt) ? "\n\n" : " "}*(${x.marks})*`)
              .join("\n\n")
        const pending = g.some((x) => !x.solution)
        const alsoAsked = [...new Set(g.flatMap((x) => x.alsoAsked ?? []))]
        const notes = g.map((x) => x.note).filter(Boolean)
        out.push({
          id: `209-${p.slug}-${q.no}${letters.join("")}`,
          topic: g[0].topic,
          course: p.course,
          session: p.session,
          batch: p.batch,
          year: p.year,
          label: label(q.no, letters),
          marks: Math.round(g.reduce((s, x) => s + x.marks, 0) * 100) / 100,
          prompt: q.stem ? `${q.stem}\n\n${parts}` : parts,
          solution: pending
            ? undefined
            : single
              ? g[0].solution
              : g.map((x) => `### (${x.part})\n\n${x.solution}`).join("\n\n"),
          alsoAsked: alsoAsked.length ? alsoAsked : undefined,
          note: notes.length ? notes.join(" ") : undefined,
        })
      }
    }
  }
  return out
}

export const paperQuestions: Question[] = papers.flatMap(toQuestions)

/** 7.5 → "7½" as printed on the papers. */
export function formatMarks(m: number) {
  const whole = Math.floor(m)
  const frac = Math.round((m - whole) * 100)
  if (frac === 50) return `${whole}½`
  return String(m)
}
