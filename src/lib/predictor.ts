/*
  Branch predictors from the slides: the 1-bit predictor (remember the last
  outcome) and the 2-bit saturating predictor (change the prediction only
  after two mispredictions in a row). runPredictor traces a predictor over a
  sequence of outcomes and counts correct predictions.
*/

export type Outcome = "T" | "N"

export type Predictor = {
  name: string
  start: string
  predict: (state: string) => Outcome
  next: (state: string, actual: Outcome) => string
}

export const oneBit = (start: Outcome = "N"): Predictor => ({
  name: "1-bit",
  start,
  predict: (s) => s as Outcome,
  next: (_s, a) => a,
})

/** States ST, WT (predict taken), WN, SN (predict not taken). */
export const twoBitPredictor = (start = "SN"): Predictor => ({
  name: "2-bit",
  start,
  predict: (s) => (s === "ST" || s === "WT" ? "T" : "N"),
  next: (s, a) => {
    const order = ["SN", "WN", "WT", "ST"]
    const i = order.indexOf(s)
    return order[a === "T" ? Math.min(3, i + 1) : Math.max(0, i - 1)]
  },
})

export type Step = { state: string; prediction: Outcome; actual: Outcome; correct: boolean }

export function runPredictor(p: Predictor, outcomes: Outcome[]) {
  let s = p.start
  const steps: Step[] = []
  for (const actual of outcomes) {
    const prediction = p.predict(s)
    steps.push({ state: s, prediction, actual, correct: prediction === actual })
    s = p.next(s, actual)
  }
  return { steps, correct: steps.filter((x) => x.correct).length, final: s }
}

/** Markdown table of a trace. */
export function predictorTable(steps: Step[]) {
  return [
    "| # | State before | Prediction | Actual | Correct? |",
    "|---|---|---|---|---|",
    ...steps.map((s, i) => `| ${i + 1} | ${s.state} | ${s.prediction === "T" ? "taken" : "not taken"} | ${s.actual === "T" ? "taken" : "not taken"} | ${s.correct ? "yes" : "**no**"} |`),
  ].join("\n")
}
