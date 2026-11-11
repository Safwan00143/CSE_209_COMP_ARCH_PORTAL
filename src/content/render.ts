/*
  Markdown generated from the checker libraries. Notes and solutions call these
  inside their md`` templates, so every table on the page comes from the same
  object the verify script checks.
*/
import { addBits, group4 } from "@/lib/numbers"
import type { MulRow } from "@/lib/multiply"

const tt = (bits: string) => `$\\texttt{${bits}}$`

/** Multiplier step table: Iteration | Step | (Multiplier) | Multiplicand | Product. */
export function mulTable(rows: MulRow[], opts: { gapProduct?: boolean } = {}) {
  const hasQ = rows.some((r) => r.multiplier !== undefined)
  const head = hasQ ? "| Iteration | Step | Multiplier | Multiplicand | Product |\n|---|---|---|---|---|" : "| Iteration | Step | Multiplicand | Product |\n|---|---|---|---|"
  const prod = (p: string) => (opts.gapProduct ? `${p.slice(0, p.length / 2)} ${p.slice(p.length / 2)}` : p)
  const lines = rows.map((r, i) => {
    const it = i > 0 && rows[i - 1].iteration === r.iteration ? "" : String(r.iteration)
    return hasQ ? `| ${it} | ${r.step} | ${r.multiplier} | ${r.multiplicand} | ${prod(r.product)} |` : `| ${it} | ${r.step} | ${r.multiplicand} | ${prod(r.product)} |`
  })
  return [head, ...lines].join("\n")
}

/**
 * Column addition laid out as a table: carries, operand rows, sum, with the
 * carry into and out of the sign bit called out (overflow = they differ).
 */
export function additionTable(a: string, b: string, cin = 0, labels: [string, string] = ["", ""]) {
  const r = addBits(a, b, cin)
  const n = a.length
  const lines = [
    `| | ${[...Array(n).keys()].map((k) => `bit ${n - 1 - k}`).join(" | ")} |`,
    `|---|${"---|".repeat(n)}`,
    `| carry in | ${[...Array(n).keys()].map((k) => r.carries[n - 1 - k]).join(" | ")} |`,
    `| ${labels[0] || "A"} | ${[...a].join(" | ")} |`,
    `| ${labels[1] || "B"} | ${[...b].join(" | ")} |`,
    `| sum | ${[...r.sum].join(" | ")} |`,
  ]
  return { table: lines.join("\n"), sum: r.sum, carryOut: r.carryOut, overflow: r.overflow, carryIntoSign: r.carries[n - 1] }
}

export const bits4 = (b: string) => tt(group4(b))
