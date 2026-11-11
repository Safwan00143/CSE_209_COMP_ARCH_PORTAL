/*
  Lints every note, prompt and solution for the markdown/LaTeX traps that break
  pages silently:
    - "##" headings with math (the "On this page" links would not match),
    - a bare "|" inside $…$ on a table row (it splits the cell; use \mid or \lvert…\rvert),
    - text after a closing $$ on the same line (the display breaks),
    - an odd number of $$ fences, and unbalanced inline $,
    - filler phrases the writing style rules out,
    - a MIPS register ($t0, $sp, …) outside a code span (remark-math would read the $ as maths),
    - hex such as 0x1F inside maths without \texttt{} (KaTeX would italicise the letters).
  Exits non-zero on any problem.
*/
import { notes } from "../src/content/notes"
import { papers } from "../src/content/papers"
import { bookProblems } from "../src/content/book"
import { figures } from "../src/figures"

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
  // Captions follow the same rules: registers in code spans, maths in $…$.
  ...Object.entries(figures).map(([id, f]) => [`figure ${id} caption`, f.caption ?? ""] as [string, string]),
]

const FILLER = [/let'?s dive in/i, /it'?s important to note/i, /in conclusion/i, /it is worth noting/i, /delve/i]

let problems = 0
const report = (where: string, line: number, msg: string, text: string) => {
  problems++
  console.log(`${where}:${line}  ${msg}\n    ${text.trim().slice(0, 110)}`)
}

for (const [where, text] of sources) {
  const lines = text.split("\n")
  let inFence = false
  let inDisplay = false
  lines.forEach((line, i) => {
    const n = i + 1
    // Fences may be indented (inside a list item).
    if (/^\s*```/.test(line)) inFence = !inFence
    if (inFence) return
    const fences = (line.match(/\$\$/g) ?? []).length
    if (fences % 2 === 1) {
      if (inDisplay && line.replace(/^.*?\$\$/, "").trim()) report(where, n, "text after closing $$", line)
      inDisplay = !inDisplay
    }
    if (inDisplay) return
    // Code spans hold MIPS text such as `lw $t0, 0($s1)`; their $ signs are not maths.
    const plain = line.replace(/`[^`]*`/g, "")
    if (/\$(zero|at|v[01]|a[0-3]|t[0-9]|s[0-7]|sp|ra|gp|fp)\b/.test(plain)) report(where, n, "MIPS register outside a code span", line)
    for (const m of plain.matchAll(/\$([^$]*)\$/g)) {
      const bare = m[1].replace(/\\(texttt|text|mathtt|mathrm)\{[^}]*\}/g, "")
      if (/\b0x[0-9a-fA-F]/.test(bare)) report(where, n, "hex inside maths without \\texttt{}", line)
    }
    if (/^## .*\$/.test(plain)) report(where, n, "math in a ## heading (breaks the outline links)", line)
    if (/^\s*\|/.test(line)) {
      for (const m of plain.matchAll(/\$([^$]*)\$/g)) if (m[1].includes("|")) report(where, n, "bare | inside math in a table row", line)
    }
    const inline = plain.replace(/\$\$[^$]*\$\$/g, "").replace(/\\\$/g, "")
    if (((inline.match(/\$/g) ?? []).length) % 2 === 1) report(where, n, "odd number of $ on the line", line)
    for (const f of FILLER) if (f.test(line)) report(where, n, `filler phrase ${f}`, line)
  })
  if (inDisplay) report(where, lines.length, "unclosed $$ block", "")
}

console.log(problems ? `\n${problems} problem(s).` : `Content lint: ${sources.length} texts, no problems.`)
if (problems) process.exit(1)
