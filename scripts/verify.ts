/*
  Re-derives every computed answer on the site. Each check (src/content/checks)
  recomputes a claim with the library code in src/lib (number conversion, IEEE
  754, performance arithmetic, cache and pipeline simulators, a MIPS simulator)
  and reports any mismatch. The harness first proves it can catch deliberate
  mistakes, then runs every check. Exits non-zero on any failure.

    npm run verify            all checks
    npm run verify -- b22     only checks whose id contains "b22"
*/
import { facts } from "../src/content/checks"
import { selfTests } from "../src/lib/selftest"

const filter = process.argv[2]

const ids = new Set<string>()
for (const f of facts) {
  if (ids.has(f.id)) console.log(`DUPLICATE check id: ${f.id}`)
  ids.add(f.id)
}

// The harness must catch known-wrong claims before its passes mean anything.
for (const t of selfTests) {
  if (!t.problem()) {
    console.log(`HARNESS BROKEN: ${t.id} should fail but passed`)
    process.exit(2)
  }
}
console.log(`harness self-test: all ${selfTests.length} deliberate errors caught\n`)

const selected = filter ? facts.filter((f) => f.id.includes(filter)) : facts
let failed = 0
for (const f of selected) {
  let problem: string | null
  try {
    problem = f.problem()
  } catch (e) {
    problem = `threw: ${(e as Error).message}`
  }
  if (problem) {
    failed++
    console.log(`FAIL ${f.id}  (${f.claim})\n      ${problem}`)
  } else console.log(`ok   ${f.id}  (${f.claim})`)
}
console.log(`\n${selected.length - failed} of ${selected.length} checks hold.`)
if (failed) process.exit(1)
