/**
 * Template tag for all markdown content. Like String.raw (so LaTeX backslashes
 * survive), but \` becomes a plain backtick, so code spans such as \`lw $t0, 0($s1)\`
 * and ```fig fences can be written inside the template literal.
 */
export const md = (s: TemplateStringsArray, ...v: unknown[]) => String.raw(s, ...v).replace(/\\`/g, "`")
