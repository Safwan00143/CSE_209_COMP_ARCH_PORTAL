/** One computed claim on the site, re-derived by code. problem() returns null when the claim holds. */
export type Fact = { id: string; claim: string; problem: () => string | null }

/** Compare helper: null when equal (numbers to a relative tolerance), else a message. */
export function expectEq(what: string, got: unknown, want: unknown, tol = 1e-9): string | null {
  if (Object.is(got, want)) return null
  if (typeof got === "number" && typeof want === "number") {
    const ok = Math.abs(got - want) <= tol * Math.max(1, Math.abs(want))
    return ok ? null : `${what}: computed ${got}, page says ${want}`
  }
  const ser = (x: unknown) => JSON.stringify(x, (_k, v) => (typeof v === "bigint" ? `${v}n` : v))
  const a = ser(got)
  const b = ser(want)
  return a === b ? null : `${what}: computed ${a}, page says ${b}`
}

/** Runs several comparisons; returns the first failure. */
export const all = (...r: (string | null)[]) => r.find((x) => x) ?? null
