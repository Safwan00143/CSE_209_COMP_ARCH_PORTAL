import type { Paper, PaperPart } from "../types"

/**
 * Attach worked solutions, kept in a companion file keyed by part ("1a", "5",
 * "12c"), to a paper. Throws on a key that matches no part, so a typo cannot
 * silently drop a solution, and on a solution given for an out-of-scope part.
 */
export function withSolutions(p: Paper, solutions: Record<string, string>): Paper {
  const parts = new Map<string, PaperPart>(p.sections.flatMap((s) => s.questions.flatMap((q) => q.parts.map((part) => [`${q.no}${part.part}`, part] as const))))
  for (const k of Object.keys(solutions)) {
    const part = parts.get(k)
    if (!part) throw new Error(`${p.slug}: solution for unknown part ${k}`)
    if (part.outOfScope) throw new Error(`${p.slug}: part ${k} is marked out of scope but has a solution`)
  }
  return {
    ...p,
    sections: p.sections.map((s) => ({
      ...s,
      questions: s.questions.map((q) => ({
        ...q,
        parts: q.parts.map((part) => ({ ...part, solution: part.solution ?? solutions[`${q.no}${part.part}`] })),
      })),
    })),
  }
}
