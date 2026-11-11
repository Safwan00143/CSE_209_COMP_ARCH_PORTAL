import type { BookProblem } from "../types"
import { md } from "../md"
import { simulate } from "@/lib/pipeline"
import { accessTable, simulateCache, totalBits, type CacheConfig } from "@/lib/cache"
import { path, STATES, type Op } from "@/lib/multicycle"
import { predictorTable, runPredictor, oneBit, twoBitPredictor, type Outcome } from "@/lib/predictor"
import { traceVM, type PteEntry } from "@/lib/vm"
import { REG_NAMES } from "@/lib/mips"

const fx = (x: number, k = 4) => String(Number(x.toFixed(k)))

/* Shared data, also used by the checks. */
export const BKB = {
  sc2: { imem: 250, regRead: 150, mux: 25, alu: 200, adder: 150, dmem: 250, regSetup: 20, signExt: 50, control: 50 },
  mc1: { lw: 0.25, sw: 0.1, "R-type": 0.45, beq: 0.15, j: 0.05 } as Record<Op, number>,
  pipe1: [300, 400, 350, 500, 100],
  dh1: "lw $t0, 0($s0)\nadd $t1, $t0, $t2\nsub $t3, $t1, $t0\nsw $t3, 4($s0)",
  dh3: "add $1, $2, $3\nadd $1, $1, $4\nadd $5, $1, $1",
  bh2: ["T", "T", "T", "N", "T", "T", "T", "N"] as Outcome[],
  bh3a: "add $t1, $t2, $t3\nbeq $t1, $t4, L\nL: nop",
  bh3b: "lw $t1, 0($t2)\nbeq $t1, $t4, L\nL: nop",
  cache1: { cfg: { sets: 8, ways: 1 } as CacheConfig, seq: [5, 21, 13, 5, 37, 21, 8, 13] },
  cache3: { seq: [1, 9, 17, 1, 9, 25, 17] },
  vm2: {
    pageBytes: 4096,
    tlb: [
      { valid: true, tag: 3, ppn: 7 },
      { valid: true, tag: 9, ppn: 2 },
      { valid: true, tag: 0, ppn: 5 },
      { valid: false, tag: 0, ppn: 0 },
    ],
    pageTable: [
      { valid: true, ppn: 5 }, { valid: false, ppn: null }, { valid: true, ppn: 11 }, { valid: true, ppn: 7 },
      { valid: true, ppn: 4 }, { valid: false, ppn: null }, { valid: false, ppn: null }, { valid: true, ppn: 9 },
      { valid: false, ppn: null }, { valid: true, ppn: 2 },
    ] as PteEntry[],
    nextPpn: 12,
    addresses: [0x3a10, 0x2008, 0x9ffc, 0x5004, 0x0c00, 0x2ff0],
  },
}

const s = BKB.sc2
const lwPath = s.imem + s.regRead + s.mux + s.alu + s.dmem + s.mux + s.regSetup
const rPath = s.imem + s.regRead + s.mux + s.alu + s.mux + s.regSetup
const beqPath = s.imem + s.regRead + s.mux + s.alu + s.mux
const cpiMC = (Object.keys(BKB.mc1) as Op[]).reduce((t, k) => t + BKB.mc1[k] * path(k).length, 0)
const pipeClock = Math.max(...BKB.pipe1)
const singleClock = BKB.pipe1.reduce((a, b) => a + b, 0)
const dh1f = simulate(BKB.dh1, { forwarding: true })
const dh1n = simulate(BKB.dh1, { forwarding: false })
const dh3 = simulate(BKB.dh3, { forwarding: true })
const bh2two = runPredictor(twoBitPredictor("WN"), BKB.bh2)
const bh2one = runPredictor(oneBit("N"), BKB.bh2)
const bh3a = simulate(BKB.bh3a, { forwarding: true, branchIn: "ID" })
const bh3b = simulate(BKB.bh3b, { forwarding: true, branchIn: "ID" })
const c1 = simulateCache(BKB.cache1.cfg, BKB.cache1.seq)
const c3cfg: Record<"fa" | "two" | "dm", CacheConfig> = { fa: { sets: 1, ways: 4 }, two: { sets: 2, ways: 2 }, dm: { sets: 4, ways: 1 } }
const c3 = { fa: simulateCache(c3cfg.fa, BKB.cache3.seq), two: simulateCache(c3cfg.two, BKB.cache3.seq), dm: simulateCache(c3cfg.dm, BKB.cache3.seq) }
const c2 = totalBits({ addressBits: 32, dataBytes: 64 * 1024, blockBytes: 32, ways: 4 })
const vm2 = traceVM(BKB.vm2)
const h = (n: number) => `0x${n.toString(16).toUpperCase()}`

export const partB: BookProblem[] = [
  /* ───────── single-cycle ───────── */
  {
    id: "bk-sc-addi",
    topic: "single-cycle",
    ref: "Adding addi to the single-cycle datapath",
    prompt: md`Can the single-cycle datapath of the slides (built for R-format, lw, sw, beq, j) execute \`addi\` without new hardware? If so, give its control signals.`,
    solution: md`**Yes.** \`addi rt, rs, imm\` computes rs + sign-extended immediate and writes it to rt. Every piece already exists for \`lw\`:
- the sign-extended immediate goes to the ALU through the ALUSrc mux (as for lw);
- the ALU adds (ALUOp = 00, as for lw and sw);
- the write register is rt (RegDst = 0, as for lw);
- but the written value is the **ALU result**, not memory data (MemtoReg = 0, as for R-format).

| RegDst | ALUSrc | MemtoReg | RegWrite | MemRead | MemWrite | Branch | Jump | ALUOp |
|---|---|---|---|---|---|---|---|---|
| 0 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 00 |

Only the **main control** must recognise the new opcode (8) and produce this row: no datapath change.`,
  },
  {
    id: "bk-sc-latency",
    topic: "single-cycle",
    ref: "Critical path and clock period",
    prompt: md`The single-cycle datapath's components have these latencies: instruction memory ${s.imem} ps, register read ${s.regRead} ps, mux ${s.mux} ps, ALU ${s.alu} ps, adder ${s.adder} ps, data memory ${s.dmem} ps, register setup ${s.regSetup} ps, sign-extend ${s.signExt} ps, control ${s.control} ps. Find the latency of \`lw\`, an R-format instruction and \`beq\`, and the clock period.`,
    solution: md`Sign-extend (${s.signExt} ps) and control (${s.control} ps) work in parallel with the register read (${s.regRead} ps), so they are not on the critical path. The PC + 4 adder works in parallel with everything.

**lw:** instruction memory → register read → ALUSrc mux → ALU → data memory → MemtoReg mux → register setup:
$$
${s.imem} + ${s.regRead} + ${s.mux} + ${s.alu} + ${s.dmem} + ${s.mux} + ${s.regSetup} = ${lwPath}\ \text{ps}
$$

**R-format:** the same without the data memory:
$$
${s.imem} + ${s.regRead} + ${s.mux} + ${s.alu} + ${s.mux} + ${s.regSetup} = ${rPath}\ \text{ps}
$$

**beq:** instruction memory → register read → ALUSrc mux → ALU (Zero) → PCSrc mux (the branch adder, ${s.imem} + ${s.adder} ps after the start, is ready long before):
$$
${s.imem} + ${s.regRead} + ${s.mux} + ${s.alu} + ${s.mux} = ${beqPath}\ \text{ps}
$$

**Clock period:** the slowest instruction, **lw: ${lwPath} ps**. Every instruction takes ${lwPath} ps, although an R-format instruction needs only ${rPath} ps: the single-cycle design's main weakness.`,
  },
  {
    id: "bk-sc-stuck",
    topic: "single-cycle",
    ref: "A control signal stuck at 0",
    prompt: md`Because of a manufacturing defect, the **RegDst** signal of a single-cycle processor is stuck at 0. Which instructions (R-format, lw, sw, beq, j) still work? What happens to the others?`,
    solution: md`RegDst chooses the destination register number: 0 = rt (bits 20–16), 1 = rd (bits 15–11).

- **lw** uses RegDst = 0 anyway: **works**.
- **sw, beq, j** do not write a register (RegWrite = 0), so RegDst does not matter: **work**.
- **R-format** needs RegDst = 1: the result is written to **rt instead of rd**. \`add $t0, $t1, $t2\` would write \`$t1 + $t2\` into \`$t2\`, leaving \`$t0\` unchanged and destroying \`$t2\`: **fails** (except in the rare case rt = rd).

So every R-format instruction is broken; the processor cannot run normal programs.`,
  },

  /* ───────── multicycle-control ───────── */
  {
    id: "bk-mc-cpi",
    topic: "multicycle-control",
    ref: "CPI of the multicycle implementation",
    prompt: md`In the multicycle implementation of the slides, how many cycles does each instruction class take? What is the CPI for a mix of ${(Object.keys(BKB.mc1) as Op[]).map((k) => `${Math.round(BKB.mc1[k] * 100)}% ${k}`).join(", ")}?`,
    solution: md`**Cycles per class** (states visited, from the control FSM):

| Class | States | Cycles |
|---|---|---|
${(Object.keys(BKB.mc1) as Op[]).map((k) => `| ${k} | ${path(k).join(" → ")} | ${path(k).length} |`).join("\n")}

**CPI:**
$$
${(Object.keys(BKB.mc1) as Op[]).map((k) => `${BKB.mc1[k]}\\times${path(k).length}`).join(" + ")} = ${fx(cpiMC)}
$$
The multicycle CPI is about ${fx(cpiMC, 2)}, but the clock period is set by the slowest **step** (roughly one memory access or ALU operation), not the slowest instruction.`,
  },
  {
    id: "bk-mc-sw",
    topic: "multicycle-control",
    ref: "Tracing sw through the control FSM",
    prompt: md`Trace \`sw\` through the multicycle control FSM: for each state, give what the datapath does and which control signals are asserted.`,
    solution: md`\`sw\` visits states ${path("sw").join(", ")}:

| State | Action | Signals asserted |
|---|---|---|
${path("sw").map((n) => `| ${n}: ${STATES[n].name} | ${STATES[n].rtl} | ${STATES[n].signals.join(", ")} |`).join("\n")}

In state 1 the FSM dispatches on the opcode (lw/sw → state 2); in state 2 it dispatches again (sw → state 5). After state 5 it returns to state 0: **4 cycles**.

\`\`\`fig
ctl-fsm
\`\`\``,
  },
  {
    id: "bk-mc-addi",
    topic: "multicycle-control",
    ref: "Adding addi to the multicycle control",
    prompt: md`How would you add \`addi\` to the multicycle FSM? Give the new states with their signals, and the changes to the dispatch ROMs of the microprogrammed (sequencer) version.`,
    solution: md`\`addi\` needs the address computation of lw/sw (A + sign-extended immediate) and an R-format-like write-back, but to **rt** from **ALUOut**.

**New states** (after the shared states 0 and 1):

| State | Action | Signals |
|---|---|---|
| 10 | ALUOut ← A + sign-extend(IR[15:0]) | ALUSrcA = 1, ALUSrcB = 10, ALUOp = 00 |
| 11 | Reg[IR[20:16]] ← ALUOut | RegDst = 0, RegWrite, MemtoReg = 0 |

State 10 does exactly what state 2 does, so state 2 could be reused if its dispatch (Dispatch ROM 2) had an entry for addi → 11.

**Dispatch ROM changes:**
- **Option 1:** Dispatch ROM 1[addi = 001000] = 10; state 10 goes to 11 (sequential); state 11 goes to 0.
- **Option 2 (fewer states):** Dispatch ROM 1[addi] = 2 and Dispatch ROM 2[addi] = 11.

\`addi\` then takes 4 cycles (0, 1, 2 or 10, 11), like an R-format instruction.`,
  },

  /* ───────── pipelining ───────── */
  {
    id: "bk-pipe-speedup",
    topic: "pipelining",
    ref: "Pipeline clock, latency and speed-up",
    prompt: md`The five stages of a processor take ${BKB.pipe1.join(", ")} ps (IF, ID, EX, MEM, WB). (a) What is the clock period of the single-cycle and the pipelined versions? (b) What is the latency of one instruction in each? (c) What is the speed-up for 1000 instructions, ignoring hazards?`,
    solution: md`**(a)** Single-cycle: the sum of the stages, **${singleClock} ps**. Pipelined: the slowest stage, **${pipeClock} ps**.

**(b)** Latency: single-cycle ${singleClock} ps; pipelined $5\times${pipeClock} = ${5 * pipeClock}$ ps. Pipelining makes each instruction **slower**: every stage takes a full ${pipeClock} ps cycle.

**(c)** 1000 instructions:
$$
T_{\text{single}} = 1000\times${singleClock} = ${(1000 * singleClock).toLocaleString("en-US")}\ \text{ps},\qquad T_{\text{pipe}} = (1000 + 4)\times${pipeClock} = ${(1004 * pipeClock).toLocaleString("en-US")}\ \text{ps}
$$
$$
\text{Speed-up} = \frac{${1000 * singleClock}}{${1004 * pipeClock}} \approx ${fx((1000 * singleClock) / (1004 * pipeClock), 3)}
$$
Pipelining improves **throughput**, not latency. The speed-up is well below 5 because the stages are unbalanced: the limit is $${singleClock}/${pipeClock} = ${singleClock / pipeClock}$.`,
  },
  {
    id: "bk-pipe-split",
    topic: "pipelining",
    ref: "Splitting the slowest stage",
    prompt: md`For the stage times ${BKB.pipe1.join(", ")} ps, the ${pipeClock} ps MEM stage is split into two stages of ${pipeClock / 2} ps each. What is the new clock period, and how much faster is a long program? What new cost does the deeper pipeline bring?`,
    solution: md`New stage times: ${[...BKB.pipe1.slice(0, 3), pipeClock / 2, pipeClock / 2, BKB.pipe1[4]].join(", ")} ps. The slowest stage is now **${Math.max(...BKB.pipe1.slice(0, 3), pipeClock / 2)} ps** (ID).

For a long program (one instruction per cycle):
$$
\text{speed-up} \approx \frac{${pipeClock}}{${Math.max(...BKB.pipe1.slice(0, 3), pipeClock / 2)}} = ${fx(pipeClock / Math.max(...BKB.pipe1.slice(0, 3), pipeClock / 2), 3)}
$$

**Costs:** six stages mean more pipeline registers (and their delay), a longer latency per instruction ($6\times400 = 2400$ ps), and larger hazard penalties: a loaded value is available one stage later, so load-use stalls grow, and a branch resolved later wastes more fetched instructions.`,
  },
  {
    id: "bk-pipe-cycle5",
    topic: "pipelining",
    ref: "Which instruction is in which stage?",
    prompt: md`Six independent instructions I1 … I6 enter a 5-stage pipeline one per cycle, starting in cycle 1. In cycle 5, which instruction is in each stage? In which cycle does I6 finish?`,
    solution: md`Instruction $k$ is in IF in cycle $k$, ID in $k + 1$, EX in $k + 2$, MEM in $k + 3$, WB in $k + 4$.

**Cycle 5:**

| IF | ID | EX | MEM | WB |
|---|---|---|---|---|
| I5 | I4 | I3 | I2 | I1 |

All five stages are busy: the pipeline is full. **I6 finishes (WB) in cycle 6 + 4 = 10.** In general, $n$ instructions take $n + 4$ cycles.`,
  },

  /* ───────── data-hazards ───────── */
  {
    id: "bk-dh-forward",
    topic: "data-hazards",
    ref: "Stalls and forwarding paths",
    prompt: md`For the code below on the 5-stage pipeline **with forwarding**, find every data hazard, the forwarding path that resolves it, the number of stalls and the total cycles.

\`\`\`
${BKB.dh1}
\`\`\``,
    solution: md`\`\`\`fig
bk-dh-forward
\`\`\`

| Producer → consumer | Register | Resolved by |
|---|---|---|
${dh1f.forwards.map((f) => `| \`${dh1f.seq[f.from].instr.text}\` → \`${dh1f.seq[f.to].instr.text}\` | \`$${REG_NAMES[f.reg]}\` | ${f.path} |`).join("\n")}

- The \`lw\` → \`add\` dependence is a **load-use hazard**: one stall, then MEM/WB → EX.
- **Stalls: ${dh1f.dataStalls}; cycles: $5 + 3 + ${dh1f.dataStalls} = ${dh1f.cycles}$.**`,
  },
  {
    id: "bk-dh-nops",
    topic: "data-hazards",
    ref: "The same code without forwarding",
    prompt: md`Repeat the previous problem for a pipeline **without forwarding** (registers are written in the first half of a cycle and read in the second half). Insert nops to make the code correct.`,
    solution: md`Without forwarding, a consumer must be in ID no earlier than its producer's WB.

- \`add\` needs \`$t0\` from \`lw\` (WB in cycle 5): \`add\` would be in ID in cycle 3 → **2 nops**.
- \`sub\` needs \`$t1\` from \`add\` → **2 nops** after \`add\`.
- \`sw\` needs \`$t3\` from \`sub\` → **2 nops** after \`sub\`.

\`\`\`
lw  $t0, 0($s0)
nop
nop
add $t1, $t0, $t2
nop
nop
sub $t3, $t1, $t0
nop
nop
sw  $t3, 4($s0)
\`\`\`

**${dh1n.dataStalls} stall cycles, ${dh1n.cycles} cycles in all**, against ${dh1f.cycles} with forwarding.`,
  },
  {
    id: "bk-dh-double",
    topic: "data-hazards",
    ref: "Forwarding mux values in a double data hazard",
    prompt: md`For the code below, give the ForwardA and ForwardB values when the third instruction is in EX.

\`\`\`
${BKB.dh3}
\`\`\``,
    solution: md`When \`add $5, $1, $1\` is in EX:
- the second \`add\` (writes \`$1\`) is in MEM: its result is in **EX/MEM**;
- the first \`add\` (also writes \`$1\`) is in WB: its older result is in **MEM/WB**.

Both sources of the third instruction are \`$1\`, and both pipeline registers hold a \`$1\`: a **double data hazard**. The most recent value (EX/MEM) is correct, so:

$$
\text{ForwardA} = 10,\qquad \text{ForwardB} = 10
$$

The MEM-hazard condition is suppressed by its "not (EX hazard)" clause. Forwarding paths found by simulation: ${dh3.forwards.filter((f) => f.to === 2).map((f) => f.path).join(", ")} for the third instruction; no stalls (${dh3.cycles} cycles).`,
  },

  /* ───────── branch-hazards ───────── */
  {
    id: "bk-bh-cpi",
    topic: "branch-hazards",
    ref: "CPI cost of branches",
    prompt: md`20% of a program's instructions are branches, and 60% of the branches are taken. The pipeline predicts not taken. What is the CPI (ideal CPI 1, no other stalls) if (a) branches are resolved in ID (1-cycle penalty when taken), (b) branches are resolved in MEM (3-cycle penalty)?`,
    solution: md`Only taken branches (mispredicted under predict-not-taken) pay the penalty.

**(a)**
$$
\text{CPI} = 1 + 0.20\times0.60\times1 = 1.12
$$

**(b)**
$$
\text{CPI} = 1 + 0.20\times0.60\times3 = 1.36
$$

Moving the branch decision from MEM to ID makes the processor $1.36/1.12 \approx ${fx(1.36 / 1.12, 3)}$ times faster. A predictor that is right 90% of the time (with a branch target buffer, penalty 1 on a misprediction) would give $1 + 0.20\times0.10\times1 = 1.02$.`,
  },
  {
    id: "bk-bh-2bit",
    topic: "branch-hazards",
    ref: "Tracing 1-bit and 2-bit predictors",
    prompt: md`A branch has the outcome sequence ${BKB.bh2.map((x) => (x === "T" ? "T" : "NT")).join(", ")}. Trace a 2-bit predictor starting in the weakly-not-taken state, and a 1-bit predictor starting at "not taken". How many predictions does each get right?`,
    solution: md`**2-bit predictor** (from WN):

${predictorTable(bh2two.steps)}

**${bh2two.correct}/8 correct.**

**1-bit predictor** (from not taken):

${predictorTable(bh2one.steps)}

**${bh2one.correct}/8 correct.**

The 1-bit predictor mispredicts twice around each NT (at the NT, and at the following T); the 2-bit predictor, once it reaches the strong state, mispredicts only the NT itself.

\`\`\`fig
bh-2bit
\`\`\``,
  },
  {
    id: "bk-bh-data",
    topic: "branch-hazards",
    ref: "Stalls for a branch decided in ID",
    prompt: md`With branches decided in ID and full forwarding, how many stall cycles does the \`beq\` need in each case?

(a)
\`\`\`
add $t1, $t2, $t3
beq $t1, $t4, L
\`\`\`

(b)
\`\`\`
lw  $t1, 0($t2)
beq $t1, $t4, L
\`\`\``,
    solution: md`The branch compares its registers **in ID**, one stage earlier than an ALU instruction uses its operands.

**(a)** \`add\` produces \`$t1\` at the end of its EX. \`beq\` is in ID during that same cycle, too early. **${bh3a.dataStalls} stall**, then forward from EX/MEM to the ID comparator.

**(b)** \`lw\` produces \`$t1\` only at the end of its MEM. **${bh3b.dataStalls} stalls**, then forward from MEM/WB to the ID comparator.

(If one independent instruction separated the producer and the branch, (a) would need 0 stalls and (b) 1.)`,
  },

  /* ───────── multiple-issue ───────── */
  {
    id: "bk-mi-ipc",
    topic: "multiple-issue",
    ref: "Peak rate of a multiple-issue processor",
    prompt: md`A 4-issue processor runs at 3 GHz. What are its peak instruction rate and its best possible CPI and IPC? Why is the real rate lower?`,
    solution: md`**Peak:** $4\times3\times10^{9} = 12\times10^{9}$ instructions per second (12 billion). **Best CPI** $= 1/4 = 0.25$; **best IPC** $= 4$.

**Why real programs fall short:**
- **Dependences:** instructions that need each other's results cannot issue together.
- **Hazards and stalls:** load-use delays, branch mispredictions and cache misses leave issue slots empty.
- **Limited parallelism** in the code: often fewer than 4 independent instructions are available each cycle.
- In static (VLIW) machines, the compiler fills empty slots with nops; dynamic machines need large hardware to find parallel work.`,
  },
  {
    id: "bk-mi-rename",
    topic: "multiple-issue",
    ref: "Name dependences and renaming",
    prompt: md`Find the true, anti- and output dependences in the code below, and remove the ones that are not true dependences by register renaming.

\`\`\`
lw  $t0, 0($s0)
add $t1, $t0, $s1
sw  $t1, 0($s0)
lw  $t0, 4($s0)
add $t1, $t0, $s1
sw  $t1, 4($s0)
\`\`\``,
    solution: md`**True (data) dependences** (a value flows): lw → add → sw in each half: \`$t0\` (1 → 2, 4 → 5) and \`$t1\` (2 → 3, 5 → 6).

**Name dependences** (only the register **name** is shared):
- **Antidependence (WAR):** instruction 4 writes \`$t0\`, which instruction 2 reads; instruction 5 writes \`$t1\`, which instruction 3 reads.
- **Output dependence (WAW):** instructions 1 and 4 both write \`$t0\`; 2 and 5 both write \`$t1\`.

**Renaming** the second half to fresh registers removes all name dependences:

\`\`\`
lw  $t0, 0($s0)
add $t1, $t0, $s1
sw  $t1, 0($s0)
lw  $t2, 4($s0)      # was $t0
add $t3, $t2, $s1    # was $t1
sw  $t3, 4($s0)
\`\`\`

Now the two halves are independent and can be scheduled together (e.g. both loads first). Compilers rename when unrolling loops; dynamically scheduled processors rename in hardware (reservation stations, reorder buffer).`,
  },
  {
    id: "bk-mi-static",
    topic: "multiple-issue",
    ref: "Static versus dynamic multiple issue",
    prompt: md`Compare static multiple issue (VLIW) and dynamic multiple issue (superscalar): who finds the parallel instructions, how hazards are handled, and the main advantage of each.`,
    solution: md`| | Static (VLIW) | Dynamic (superscalar) |
|---|---|---|
| Who decides what issues together | the **compiler** packs operations into an issue packet | the **hardware** chooses at run time |
| Hazards | compiler removes them; empty slots are nops | hardware checks dependences, may execute out of order |
| Code | tied to the issue width of the machine | ordinary instructions; old code runs and benefits |
| Hardware | simple | complex: reservation stations, renaming, reorder buffer |
| Advantage | simpler, lower-power hardware | handles unpredictable delays (cache misses, branches) that a compiler cannot foresee |

The slides' static dual-issue MIPS issues one ALU/branch instruction and one load/store per packet; the compiler must schedule around the one-cycle load-use latency, and loop unrolling with renaming helps fill the packets.`,
  },

  /* ───────── memory-tech ───────── */
  {
    id: "bk-mem-disk",
    topic: "memory-tech",
    ref: "Disk access time",
    prompt: md`A disk spins at 7200 RPM, has a 6 ms average seek time, a 150 MB/s transfer rate and 0.1 ms controller overhead. What is the average time to read a 4 KB sector from an idle disk? Which component dominates?`,
    solution: md`- Seek: 6 ms.
- Rotational latency: half a rotation:
$$
\frac{0.5}{7200/60}\ \text{s} = \frac{0.5}{120}\ \text{s} \approx 4.167\ \text{ms}
$$
- Transfer:
$$
\frac{4096\ \text{B}}{150\times10^{6}\ \text{B/s}} \approx 0.027\ \text{ms}
$$
- Controller: 0.1 ms.

$$
T \approx 6 + 4.167 + 0.027 + 0.1 \approx ${fx(6 + 0.5 / 120 * 1000 + (4096 / 150e6) * 1000 + 0.1, 3)}\ \text{ms}
$$

**Seek and rotational latency dominate** (over 98%): mechanical movement, not the data transfer. That is why large, sequential transfers are far more efficient on a disk than many small random ones.`,
  },
  {
    id: "bk-mem-hierarchy",
    topic: "memory-tech",
    ref: "Why a memory hierarchy works",
    prompt: md`A system has a cache with 1 ns access time and DRAM with 60 ns access time. 95% of accesses hit in the cache. (a) What is the average access time? (b) Explain, using locality, why such a high hit rate is typical.`,
    solution: md`**(a)** Every access looks in the cache; the 5% that miss also go to DRAM:
$$
\text{AMAT} = 1 + 0.05\times60 = 4\ \text{ns}
$$
The memory looks almost as fast as the cache (4 ns rather than 60 ns), but as large as the DRAM.

**(b)** Programs show **locality**:
- **temporal:** recently used items (loop instructions, counters) are used again soon, so keeping them in the cache pays off;
- **spatial:** nearby items (sequential instructions, array elements) are used soon, so bringing whole **blocks** into the cache serves the following accesses.

So a small cache holding the recently used blocks catches most accesses.`,
  },
  {
    id: "bk-mem-flash",
    topic: "memory-tech",
    ref: "Flash memory and wear leveling",
    prompt: md`A NAND flash block can be written 10,000 times before it wears out. A program rewrites one 4 KB file 100 times a day. (a) Without wear leveling, how long until that block wears out? (b) With wear leveling over a 64 GB drive of 4 KB blocks, roughly how long?`,
    solution: md`**(a)** All writes hit the same block:
$$
\frac{10{,}000\ \text{writes}}{100\ \text{writes/day}} = 100\ \text{days}
$$

**(b)** Wear leveling **remaps** each write to a less-used block, spreading the writes over all blocks:
$$
\text{blocks} = \frac{64\times2^{30}}{4\times2^{10}} = 2^{24} \approx 16.8\ \text{million}
$$
$$
\frac{10{,}000\times2^{24}\ \text{writes}}{100\ \text{writes/day}} \approx 1.68\times10^{9}\ \text{days}
$$
Effectively unlimited for this workload. This is why flash controllers always use wear leveling: flash bits wear out after thousands of writes, so flash cannot replace DRAM directly.`,
  },

  /* ───────── caches ───────── */
  {
    id: "bk-cache-dm",
    topic: "caches",
    ref: "A direct-mapped cache trace",
    prompt: md`A direct-mapped cache has 8 one-word blocks and starts empty. For the word-address sequence ${BKB.cache1.seq.join(", ")}, give the index of each access, whether it hits, and the cache contents.`,
    solution: md`Index = address mod 8.

${accessTable(c1, BKB.cache1.cfg)}

**${c1.hits} hits, ${c1.misses} misses.** 5, 21, 13 and 37 all leave remainder 5 when divided by 8, so they all compete for index 5 and keep evicting each other; only 8 (index 0) uses a different block. Seven of the eight blocks stay empty: these are conflict misses, which a set-associative cache would avoid.`,
  },
  {
    id: "bk-cache-fields",
    topic: "caches",
    ref: "Address fields and total bits of a set-associative cache",
    prompt: md`A 64 KiB, 4-way set-associative cache has 32-byte blocks and 32-bit byte addresses. Give the tag, index and offset widths, and the total number of bits (data, tags and valid bits).`,
    solution: md`- **Offset:** 32-byte blocks $= 2^{5}$: **5 bits**.
- **Blocks:** $64\ \text{KiB}/32\ \text{B} = 2048$; **sets** $= 2048/4 = 512 = 2^{9}$: **index 9 bits**.
- **Tag:** $32 - 9 - 5 =$ **${c2.split.tag} bits**.

**Bits per block:** $256$ data $+ ${c2.split.tag}$ tag $+ 1$ valid $= ${c2.perBlock}$.
$$
\text{total} = 2048\times${c2.perBlock} = ${c2.total.toLocaleString("en-US")}\ \text{bits} \approx ${fx(c2.total / 8 / 1024, 2)}\ \text{KiB}
$$
(A write-back cache adds a dirty bit per block, and LRU replacement a few bits per set.)`,
  },
  {
    id: "bk-cache-assoc",
    topic: "caches",
    ref: "Associativity and misses",
    prompt: md`Three caches each have four one-word blocks and use LRU: fully associative, two-way set associative and direct mapped. Count the misses for the block-address sequence ${BKB.cache3.seq.join(", ")}.`,
    solution: md`All four distinct addresses (1, 9, 17, 25) leave remainder 1 when divided by 4 (and by 2), so they collide in the smaller sets.

**Fully associative:**

${accessTable(c3.fa, c3cfg.fa)}

**Two-way** (set = address mod 2: all in set 1):

${accessTable(c3.two, c3cfg.two)}

**Direct mapped** (index = address mod 4: all at index 1):

${accessTable(c3.dm, c3cfg.dm)}

| Organisation | Misses |
|---|---|
| Fully associative | ${c3.fa.misses} |
| Two-way | ${c3.two.misses} |
| Direct mapped | ${c3.dm.misses} |

More associativity removes conflict misses: here every block maps to the same place in the direct-mapped cache, so it misses every time.`,
  },

  /* ───────── cache-performance ───────── */
  {
    id: "bk-cp-amat",
    topic: "cache-performance",
    ref: "Average memory access time",
    prompt: md`A processor has a 2 GHz clock, a 1-cycle cache hit time, a 4% miss rate and an 80-cycle miss penalty. Find the AMAT in cycles and in ns. How much does it improve if the miss rate drops to 2%?`,
    solution: md`$$
\text{AMAT} = \text{hit time} + \text{miss rate}\times\text{miss penalty} = 1 + 0.04\times80 = 4.2\ \text{cycles}
$$
At 2 GHz (0.5 ns per cycle): $4.2\times0.5 = 2.1$ ns.

With a 2% miss rate: $1 + 0.02\times80 = 2.6$ cycles $= 1.3$ ns, which is $4.2/2.6 \approx ${fx(4.2 / 2.6, 3)}$ times faster for memory accesses. Halving the miss rate matters because the miss penalty is so large.`,
  },
  {
    id: "bk-cp-cpi",
    topic: "cache-performance",
    ref: "CPI with instruction and data misses",
    prompt: md`A processor has a base CPI of 1.5. The instruction cache miss rate is 1.5%, the data cache miss rate 5%, loads and stores are 30% of instructions, and the miss penalty is 120 cycles. Find the CPI and the speed-up a perfect cache would give.`,
    solution: md`$$
\text{I-miss cycles} = 0.015\times120 = 1.8
$$
$$
\text{D-miss cycles} = 0.30\times0.05\times120 = 1.8
$$
$$
\text{CPI} = 1.5 + 1.8 + 1.8 = 5.1
$$
$$
\text{speed-up with a perfect cache} = \frac{5.1}{1.5} = 3.4
$$
Memory stalls take $3.6/5.1 \approx 70.6\%$ of the time. Improving the processor core alone (e.g. halving the base CPI) would give only $5.1/4.35 \approx 1.17$: the memory system dominates.`,
  },
  {
    id: "bk-cp-l2",
    topic: "cache-performance",
    ref: "Adding a second-level cache",
    prompt: md`A 3 GHz processor has a base CPI of 1.0 and a 3% L1 miss rate per instruction; main memory takes 90 ns. An L2 cache with a 5 ns access time reduces the miss rate to main memory to 0.8%. How much faster is the processor with the L2?`,
    solution: md`**Penalties in cycles** (0.333 ns per cycle): main memory $90\times3 = 270$ cycles; L2 $5\times3 = 15$ cycles.

**Without L2:**
$$
\text{CPI} = 1 + 0.03\times270 = 9.1
$$

**With L2:**
$$
\text{CPI} = 1 + 0.03\times15 + 0.008\times270 = 1 + 0.45 + 2.16 = 3.61
$$

$$
\text{speed-up} = \frac{9.1}{3.61} \approx ${fx(9.1 / 3.61, 3)}
$$`,
  },

  /* ───────── virtual-memory ───────── */
  {
    id: "bk-vm-size",
    topic: "virtual-memory",
    ref: "Page table size",
    prompt: md`A system has 32-bit virtual addresses, 16 KB pages and 4-byte page table entries. (a) How many entries does a page table have, and how large is it? (b) With 100 processes running, how much memory do their page tables take? (c) How large would it be with 4 KB pages?`,
    solution: md`**(a)** Offset = 14 bits (16 KB $= 2^{14}$), so the virtual page number has $32 - 14 = 18$ bits:
$$
2^{18} = 262{,}144\ \text{entries},\qquad 2^{18}\times4\ \text{B} = 2^{20}\ \text{B} = 1\ \text{MB}
$$

**(b)** One page table per process: $100\times1\ \text{MB} = 100$ MB.

**(c)** With 4 KB pages: $2^{20}$ entries $\times4$ B $= 4$ MB per process. Larger pages give smaller page tables (and a larger TLB reach), at the cost of more wasted memory inside partly used pages.`,
  },
  {
    id: "bk-vm-trace",
    topic: "virtual-memory",
    ref: "Tracing a TLB and page table",
    prompt: md`Pages are 4 KB. A 4-entry fully associative TLB (LRU; the first valid entry listed is least recently used) holds:

| Valid | Tag (VPN) | PPN |
|---|---|---|
${BKB.vm2.tlb.map((e) => `| ${e.valid ? 1 : 0} | ${e.valid ? e.tag : "–"} | ${e.valid ? e.ppn : "–"} |`).join("\n")}

The page table (VPN: PPN, or "disk") is: ${BKB.vm2.pageTable.map((p, i) => `${i}: ${p.valid ? p.ppn : "disk"}`).join("; ")}. On a page fault, the page is loaded into physical page ${BKB.vm2.nextPpn}, then the next free one. For the virtual addresses ${BKB.vm2.addresses.map(h).join(", ")}, say whether each is a TLB hit, a page-table hit or a page fault, and give the physical address.`,
    solution: md`VPN = address / 4096 (the top hex digits above the last three); offset = the last three hex digits.

| Virtual address | VPN | Offset | Result | PPN | Physical address |
|---|---|---|---|---|---|
${vm2.steps.map((st) => `| ${h(st.va)} | ${st.vpn} | ${h(st.offset)} | ${st.result}${st.evictedTag !== undefined ? ` (TLB evicts VPN ${st.evictedTag})` : ""} | ${st.ppn} | ${h(st.pa)} |`).join("\n")}

**How each case works:**
- **TLB hit:** the TLB supplies the PPN directly.
- **Page-table hit (TLB miss):** the page is in memory; its entry is copied into the TLB (into the invalid entry first, then replacing the LRU entry).
- **Page fault:** the page is on disk; the OS loads it into a free physical page, updates the page table, and the translation goes into the TLB.`,
  },
  {
    id: "bk-vm-tlb",
    topic: "virtual-memory",
    ref: "The value of a TLB",
    prompt: md`A memory access takes 50 ns and a TLB lookup 1 ns. The TLB hit rate is 99%. Ignoring caches and page faults, what is the effective time of a memory reference with the TLB, and without one?`,
    solution: md`**With the TLB:** every reference looks in the TLB (1 ns); 1% also read the page table in memory (50 ns); then the data access (50 ns):
$$
1 + 0.01\times50 + 50 = 51.5\ \text{ns}
$$

**Without a TLB:** every reference reads the page table, then the data:
$$
50 + 50 = 100\ \text{ns}
$$

The TLB makes virtual memory almost free ($51.5$ against the ideal 50 ns), where without it every access would take about twice as long.`,
  },

  /* ───────── coherence ───────── */
  {
    id: "bk-coh-snoop",
    topic: "coherence",
    ref: "Write-invalidate snooping, step by step",
    prompt: md`Three processors with write-back caches share memory location X (initially 5). Using a write-invalidate snooping protocol, show the bus activity and each cache's copy of X after each step: P1 reads X; P2 reads X; P1 writes 7 to X; P3 reads X; P2 writes 9 to X.`,
    solution: md`| Step | Bus activity | P1 | P2 | P3 | Memory |
|---|---|---|---|---|---|
| P1 reads X | cache miss for X | 5 | | | 5 |
| P2 reads X | cache miss for X | 5 | 5 | | 5 |
| P1 writes 7 | invalidate X | 7 (modified) | invalid | | 5 |
| P3 reads X | cache miss; P1 supplies its copy, memory updated | 7 | invalid | 7 | 7 |
| P2 writes 9 | invalidate X (P2 first gets the block) | invalid | 9 (modified) | invalid | 7 |

**Key points:**
- A write needs **exclusive access**: the invalidate removes every other copy, so no processor can read a stale value.
- A read miss for a block that another cache holds **modified** is served by that cache (memory is stale under write-back).
- Only the first write by a processor to a block causes bus traffic; its later writes to the same block (while it holds it exclusively) are local.`,
  },
  {
    id: "bk-coh-conditions",
    topic: "coherence",
    ref: "Which coherence condition is violated?",
    prompt: md`X starts at 0. P1 writes 1 to X and then writes 2 to X. Long afterwards, P2 reads X twice and gets 2 the first time and 1 the second time. Which coherence requirement is violated? What if P2 had read 0 long after both writes?`,
    solution: md`**Reading 2 then 1** violates **write serialisation**: all processors must see writes to the same location in the **same order**. P1 wrote 1 then 2; seeing 2 and then 1 means P2 observed them in a different order.

**Reading 0 long after both writes** violates the **coherent-view** requirement: a read that follows a write by another processor, sufficiently later and with no other writes in between, must return the written value (here 2). The write never became visible to P2.

(The third requirement, program order, concerns a processor reading its own writes: P1 reading X right after writing 2 must get 2.)`,
  },
  {
    id: "bk-coh-traffic",
    topic: "coherence",
    ref: "Write invalidate versus write update",
    prompt: md`P1 and P2 both hold X in their caches. P1 then writes X four times in a row, and afterwards P2 reads X once. Count the bus transactions under (a) a write-invalidate protocol and (b) a write-update (write-broadcast) protocol.`,
    solution: md`**(a) Write invalidate:**
- 1st write: one **invalidate** (P2's copy becomes invalid); P1 now holds X exclusively.
- 2nd–4th writes: local, **no bus traffic**.
- P2's read: a **miss**, served by P1 (one transaction).

**2 bus transactions.**

**(b) Write update:**
- every write is **broadcast** so P2's copy is updated: **4 transactions**.
- P2's read: a hit, no traffic.

**4 bus transactions.**

Repeated writes by one processor favour invalidation (the reason it is used in almost all processors). Update is better only when the other processor reads after every write, since then each update replaces a later miss.`,
  },

  /* ───────── gpu ───────── */
  {
    id: "bk-gpu-grid",
    topic: "gpu",
    ref: "Sizing a CUDA grid",
    prompt: md`A CUDA kernel computes $y[i] = a\times x[i] + y[i]$ (DAXPY) for $n = 1{,}000{,}000$ elements, one element per thread, with 256 threads per block. How many thread blocks are launched? How does each thread find its element, and why must it check \`i < n\`?`,
    solution: md`**Blocks:**
$$
\left\lceil\frac{1{,}000{,}000}{256}\right\rceil = \lceil 3906.25\rceil = 3907
$$
launched as \`daxpy<<<3907, 256>>>(n, a, x, y)\`.

**Each thread's index:**

\`\`\`
int i = blockIdx.x * blockDim.x + threadIdx.x;
if (i < n) y[i] = a * x[i] + y[i];
\`\`\`

The block number times the block size, plus the thread's position in its block, gives a unique global index.

**Why \`i < n\`:** $3907\times256 = 1{,}000{,}192$ threads are launched, 192 more than there are elements. Without the check, those threads would read and write past the ends of the arrays.`,
  },
  {
    id: "bk-gpu-divergence",
    topic: "gpu",
    ref: "Branch divergence in a warp",
    prompt: md`A warp of 32 threads executes \`if (x[i] > 0) A(); else B();\`, where A and B each take 10 cycles. 8 threads take the \`if\` path. How many cycles does the warp spend, and what fraction of the thread slots does useful work? What if all 32 threads took the same path?`,
    solution: md`All threads of a warp execute the **same instruction** at a time (SIMT). When they diverge, the warp runs **both paths one after the other**, with the threads not on the current path masked off.

$$
\text{cycles} = 10\ (\text{A, 8 threads active}) + 10\ (\text{B, 24 active}) = 20
$$

**Useful work:**
$$
\frac{8\times10 + 24\times10}{32\times20} = \frac{320}{640} = 50\%
$$

If all 32 threads took the same path: **10 cycles at 100%** efficiency. Divergence within a warp halves performance here; arranging data so that threads in a warp take the same branch avoids it.`,
  },
  {
    id: "bk-gpu-vs-cpu",
    topic: "gpu",
    ref: "GPU versus CPU design",
    prompt: md`Give four ways in which a GPU's design differs from a CPU's, and explain why each suits graphics and data-parallel work.`,
    solution: md`| Aspect | CPU | GPU | Why it suits the GPU's work |
|---|---|---|---|
| Cores | a few complex cores | many simple cores (hundreds to thousands of SIMD lanes) | data-parallel work has thousands of independent operations |
| Hiding memory latency | large caches | **massive multithreading**: switch to another ready warp while one waits | enough threads keep the cores busy without big caches |
| Memory | latency-optimised, deep cache hierarchy | **bandwidth**-optimised graphics DRAM with wide buses | streaming over large arrays needs bandwidth more than low latency |
| Control | branch prediction, out-of-order execution per thread | SIMT: one instruction stream drives many threads; little per-thread control logic | the same operation applies to every pixel or element |

The GPU spends its transistors on arithmetic units rather than on control and caches, so it achieves far higher throughput on parallel work, but runs a single serial thread much more slowly than a CPU.`,
  },
]
