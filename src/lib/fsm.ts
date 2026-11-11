/*
  Finite-state machines drawn as state diagrams: branch predictors and control FSMs.
  A transition is [from, inputLabel, to]. `accept` marks states drawn with a double ring
  (unused here, kept so the shared diagram geometry works unchanged).
*/
export const EPS = "ε"

export type FA = {
  kind: "fa"
  states: string[]
  alphabet: string[]
  start: string
  accept: string[]
  delta: [string, string, string][]
}

export type Machine = FA

/** Runs a deterministic machine over a sequence of inputs; returns the state after each step. */
export function trace(m: FA, inputs: string[]) {
  const out: string[] = []
  let q = m.start
  for (const a of inputs) {
    const t = m.delta.find(([f, s]) => f === q && s === a)
    if (!t) throw new Error(`no transition from ${q} on ${a}`)
    q = t[2]
    out.push(q)
  }
  return out
}
