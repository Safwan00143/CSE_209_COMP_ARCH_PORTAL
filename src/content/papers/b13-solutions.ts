import { md } from "../md"
import { after } from "./compose"
import { b14Solutions } from "./b14-solutions"
import { b15Solutions } from "./b15-solutions"
import { b16Solutions } from "./b16-solutions"
import { b19Solutions } from "./b19-solutions"
import { b21Solutions } from "./b21-solutions"
import { b22Solutions } from "./b22-solutions"
import { accessTable, simulateCache, type CacheConfig } from "@/lib/cache"

const fx = (x: number, k = 4) => String(Number(x.toFixed(k)))
const sci = (x: number, k = 4) => {
  const [m, e] = x.toExponential(k).split("e")
  return `${Number(m)}\\times10^{${Number(e)}}`
}

/* ───── Q1(a) ───── */
export const Q1A = [
  { name: "P1", ghz: 3, cpi: 1.5 },
  { name: "P2", ghz: 2.5, cpi: 1.0 },
  { name: "P3", ghz: 4, cpi: 2.2 },
]
const ips = (p: (typeof Q1A)[number]) => (p.ghz * 1e9) / p.cpi

/* ───── Q1(b) ───── */
export const Q1B = { counts: [500, 50, 100, 50], cpi: [1, 5, 5, 2] }
const cyc1b = (c: number[]) => c.reduce((t, n, i) => t + n * Q1B.cpi[i], 0)
const ic = (c: number[]) => c.reduce((a, b) => a + b, 0)
const half = [500, 50, 50, 50]

/* ───── Q1(c) ───── */
export function q1c(p: number, cpiArith = 1, cpiLS = 12) {
  const f = p === 1 ? 1 : 0.7 * p
  const cycles = (2.56e9 / f) * cpiArith + (1.28e9 / f) * cpiLS + 0.256e9 * 5
  return { cycles, time: cycles / 2e9 }
}
const ps = [1, 2, 4]

/* ───── Q4(c) ───── */
export const Q4C_SEQS = [
  [0, 2, 4, 8, 10, 12, 14, 16, 0],
  [1, 3, 5, 1, 3, 1, 3, 5, 3],
]
export const Q4C_CFG: Record<"fa" | "two" | "dm", CacheConfig> = { fa: { sets: 1, ways: 4 }, two: { sets: 2, ways: 2 }, dm: { sets: 4, ways: 1 } }
const r4 = Q4C_SEQS.map((s) => ({ fa: simulateCache(Q4C_CFG.fa, s), two: simulateCache(Q4C_CFG.two, s), dm: simulateCache(Q4C_CFG.dm, s) }))

export const b13Solutions: Record<string, string> = {
  "1a": md`**(i) Instructions per second** = clock rate / CPI:

| Processor | Clock rate | CPI | Instructions per second |
|---|---|---|---|
${Q1A.map((p) => `| ${p.name} | ${p.ghz} GHz | ${p.cpi} | $${p.ghz}\\times10^{9}/${p.cpi} = ${sci(ips(p), 3)}$ |`).join("\n")}

**P2** has the highest performance: $2.5\times10^{9}$ instructions per second.

**(ii) A 10-second run.** Cycles = clock rate × time; instructions = cycles / CPI.

| Processor | Cycles | Instructions |
|---|---|---|
${Q1A.map((p) => `| ${p.name} | $${p.ghz}\\times10^{9}\\times10 = ${sci(p.ghz * 1e10, 2)}$ | $${sci(p.ghz * 1e10, 2)}/${p.cpi} = ${sci((p.ghz * 1e10) / p.cpi, 3)}$ |`).join("\n")}

**(iii) 30% less time with 20% more CPI.** For the same instruction count:
$$
T = \frac{IC\times\text{CPI}}{f}\quad\Longrightarrow\quad 0.7\,T = \frac{IC\times1.2\,\text{CPI}}{f_{\text{new}}}\quad\Longrightarrow\quad f_{\text{new}} = \frac{1.2}{0.7}\,f \approx ${fx(1.2 / 0.7, 3)}\,f
$$

| Processor | Old clock | New clock |
|---|---|---|
${Q1A.map((p) => `| ${p.name} | ${p.ghz} GHz | $${p.ghz}\\times1.2/0.7 \\approx ${fx((p.ghz * 1.2) / 0.7, 2)}$ GHz |`).join("\n")}

The clock rate must rise by about 71%.`,

  "1b": md`**(i) Execution time.**
$$
\text{cycles} = 500\times1 + 50\times5 + 100\times5 + 50\times2 = 500 + 250 + 500 + 100 = ${cyc1b(Q1B.counts)}
$$
$$
T = \frac{${cyc1b(Q1B.counts)}}{4\times10^{9}\ \text{Hz}} = ${fx(cyc1b(Q1B.counts) / 4, 2)}\ \text{ns}
$$

**(ii) CPI.**
$$
\text{CPI} = \frac{${cyc1b(Q1B.counts)}\ \text{cycles}}{${ic(Q1B.counts)}\ \text{instructions}} \approx ${fx(cyc1b(Q1B.counts) / ic(Q1B.counts), 3)}
$$

**(iii) Half the loads** (50 instead of 100):
$$
\text{cycles} = 500 + 250 + 250 + 100 = ${cyc1b(half)},\qquad \text{instructions} = ${ic(half)}
$$
$$
\text{Speed-up} = \frac{${cyc1b(Q1B.counts)}}{${cyc1b(half)}} \approx ${fx(cyc1b(Q1B.counts) / cyc1b(half), 3)},\qquad \text{CPI} = \frac{${cyc1b(half)}}{${ic(half)}} \approx ${fx(cyc1b(half) / ic(half), 3)}
$$
The CPI drops because the removed instructions are the expensive 5-cycle loads.`,

  "1c": md`**Per-processor instruction counts.** On $p > 1$ processors, arithmetic and load/store counts are divided by $0.7p$; branches stay 256 million. (On 1 processor the counts are as given.) Clock: 2 GHz.

**(i) Execution time and speed-up.**

| p | Arithmetic (×10⁹) | Load/store (×10⁹) | Cycles (×10⁹) | Time | Speed-up |
|---|---|---|---|---|---|
${ps.map((p) => { const f = p === 1 ? 1 : 0.7 * p; const r = q1c(p); return `| ${p} | ${fx(2.56 / f)} | ${fx(1.28 / f)} | ${fx(r.cycles / 1e9)} | ${fx(r.time, 3)} s | ${fx(q1c(1).time / r.time, 3)} |` }).join("\n")}

For example, $p = 1$: cycles $= 2.56\times1 + 1.28\times12 + 0.256\times5 = 2.56 + 15.36 + 1.28 = 19.2$ billion, so $T = 19.2\times10^{9}/(2\times10^{9}) = 9.6$ s.

**(ii) Arithmetic CPI doubled** (1 → 2):

| p | Time before | Time after | Increase |
|---|---|---|---|
${ps.map((p) => `| ${p} | ${fx(q1c(p).time, 3)} s | ${fx(q1c(p, 2).time, 3)} s | ${fx((q1c(p, 2).time / q1c(p).time - 1) * 100, 1)}% |`).join("\n")}

The time grows by the same absolute amount per arithmetic instruction; arithmetic instructions are cheap, so the impact is moderate (about 12–13%).

**(iii) Single processor matching 4 processors.** The target is the 4-processor time, ${fx(q1c(4).time, 3)} s $= ${fx(q1c(4).cycles / 1e9, 3)}\times10^{9}$ cycles:
$$
2.56\times10^{9}\times1 + 1.28\times10^{9}\times\text{CPI}_{LS} + 0.256\times10^{9}\times5 = ${fx(q1c(4).cycles / 1e9, 3)}\times10^{9}
$$
$$
\text{CPI}_{LS} = \frac{${fx(q1c(4).cycles / 1e9, 3)} - 2.56 - 1.28}{1.28} = ${fx((q1c(4).cycles / 1e9 - 3.84) / 1.28, 3)}
$$
The load/store CPI must drop from 12 to ${fx((q1c(4).cycles / 1e9 - 3.84) / 1.28, 3)}: a reduction of ${fx((1 - (q1c(4).cycles / 1e9 - 3.84) / 1.28 / 12) * 100, 1)}% (4 times smaller).`,

  "2a": md`**MIPS rating** (millions of instructions per second):
$$
\text{MIPS} = \frac{\text{clock rate}}{\text{CPI}\times10^{6}}
$$
$$
\text{MIPS}_A = \frac{4\times10^{9}}{1\times10^{6}} = 4000,\qquad \text{MIPS}_B = \frac{4\times10^{9}}{1.1\times10^{6}} \approx 3636
$$
**(i)** Computer **A** has the higher MIPS rating.

**(ii) Execution time** = instructions × CPI / clock rate:
$$
T_A = \frac{10\times10^{9}\times1}{4\times10^{9}} = 2.5\ \text{s},\qquad T_B = \frac{8\times10^{9}\times1.1}{4\times10^{9}} = 2.2\ \text{s}
$$
Computer **B** is faster, by $2.5/2.2 \approx 1.14$ times.

MIPS ignores the instruction count: A executes more, simpler instructions. This is why MIPS is a misleading performance measure.`,

  "2b": md`**Single-cycle:** the clock period must fit the whole \`lw\`:
$$
200 + 100 + 200 + 200 + 100 = 800\ \text{ps}
$$
**Pipelined:** the clock period is the slowest stage, **200 ps**; $n$ instructions take $(n + 4)$ cycles.

\`\`\`fig
pipe-three-lw
\`\`\`

**3 instructions:**
$$
\text{Speed-up} = \frac{3\times800}{(3 + 4)\times200} = \frac{2400}{1400} \approx 1.71
$$

**With 2,000,000 more lw** ($n = 2{,}000{,}003$):
$$
\text{Speed-up} = \frac{2{,}000{,}003\times800}{2{,}000{,}007\times200} = \frac{1{,}600{,}002{,}400}{400{,}001{,}400} \approx 4.00
$$
With many instructions the pipeline-fill time no longer matters, and the speed-up approaches the ratio of clock periods, $800/200 = 4$ (not 5, because the stages are not balanced).`,

  "2c": md`The pipelined datapath divides the single-cycle datapath into five stages separated by four **pipeline registers** (IF/ID, ID/EX, EX/MEM, MEM/WB). Each register holds everything the instruction needs in the later stages.

\`\`\`fig
dh-hazard-unit
\`\`\`

**lw, stage by stage** (\`lw $t0, offset($t1)\`):
1. **IF:** read the instruction from instruction memory at PC; compute PC + 4; write the instruction and PC + 4 into **IF/ID**; PC ← PC + 4.
2. **ID:** read register rs (base) from the register file; sign-extend the 16-bit offset; pass the rt number (destination). Write read data 1, the extended offset, rt and PC + 4 into **ID/EX**. The control unit decodes the opcode here and its signals are stored in ID/EX.
3. **EX:** ALUSrc = 1, so the ALU adds the base and the offset: the memory address. Write it into **EX/MEM**, with the destination register number.
4. **MEM:** MemRead = 1: read data memory at the address. Write the loaded data into **MEM/WB**, with the destination register number.
5. **WB:** MemtoReg = 1 selects the loaded data; RegWrite = 1 writes it into register rt. The **write register number comes from MEM/WB** (it was carried through all the pipeline registers), not from the instruction now in ID.

**Pipelined control for lw.** The control signals are generated in ID and travel with the instruction, each group consumed by its stage:

| Stage | Signals | lw values |
|---|---|---|
| EX | RegDst, ALUOp, ALUSrc | 0, 00, 1 |
| MEM | Branch, MemRead, MemWrite | 0, 1, 0 |
| WB | MemtoReg, RegWrite | 1, 1 |`,

  "2d": b21Solutions["1c"],

  "2e": b15Solutions["1d"],

  "3a": md`${b15Solutions["2a"]}

**Forwarding equations with the double-data-hazard priority:**

\`\`\`
EX hazard:
if (EX/MEM.RegWrite and (EX/MEM.RegisterRd ≠ 0)
    and (EX/MEM.RegisterRd = ID/EX.RegisterRs))  ForwardA = 10
if (EX/MEM.RegWrite and (EX/MEM.RegisterRd ≠ 0)
    and (EX/MEM.RegisterRd = ID/EX.RegisterRt))  ForwardB = 10

MEM hazard:
if (MEM/WB.RegWrite and (MEM/WB.RegisterRd ≠ 0)
    and not (EX/MEM.RegWrite and (EX/MEM.RegisterRd ≠ 0)
             and (EX/MEM.RegisterRd = ID/EX.RegisterRs))
    and (MEM/WB.RegisterRd = ID/EX.RegisterRs))  ForwardA = 01
if (MEM/WB.RegWrite and (MEM/WB.RegisterRd ≠ 0)
    and not (EX/MEM.RegWrite and (EX/MEM.RegisterRd ≠ 0)
             and (EX/MEM.RegisterRd = ID/EX.RegisterRt))
    and (MEM/WB.RegisterRd = ID/EX.RegisterRt))  ForwardB = 01
\`\`\`

The "not EX/MEM" clause is what handles the double data hazard: the newer value in EX/MEM wins over the older one in MEM/WB.`,

  "3b": after(b15Solutions["3b"], "**Write-through.**"),

  "3c": b19Solutions["3b"],

  "3d": b22Solutions["3a"],

  "4a": md`**Step 1: miss cycles per instruction.**
$$
\text{I-cache: } 0.03\times100 = 3.0
$$
$$
\text{D-cache: } 0.40\times0.05\times100 = 2.0
$$
$$
\text{memory stall cycles per instruction} = 3.0 + 2.0 = 5.0
$$

**Step 2: CPI with stalls:** $2 + 5 = 7$.

**Step 3: perfect cache.**
$$
\frac{\text{CPU time}_{\text{stalls}}}{\text{CPU time}_{\text{perfect}}} = \frac{7}{2} = 3.5
$$
A perfect cache makes the processor **3.5 times faster**.

**Step 4: time on memory stalls.**
$$
\frac{5}{7} \approx 71.4\%
$$`,

  "4b": b22Solutions["2b"],

  "4c": md`Each cache has four one-word blocks; LRU replacement.

**Sequence 1: 0, 2, 4, 8, 10, 12, 14, 16, 0.** Every address is distinct until the final 0, so the first 8 accesses are compulsory misses in every cache. The final 0 hits only if block 0 is still in the cache.

*Fully associative:*

${accessTable(r4[0].fa, Q4C_CFG.fa)}

*Two-way set associative* (all even, so all in set 0):

${accessTable(r4[0].two, Q4C_CFG.two)}

*Direct mapped* (index = address mod 4: 0, 4, 8, 12, 16 → 0; 2, 10, 14 → 2):

${accessTable(r4[0].dm, Q4C_CFG.dm)}

**Sequence 2: 1, 3, 5, 1, 3, 1, 3, 5, 3.**

*Fully associative:*

${accessTable(r4[1].fa, Q4C_CFG.fa)}

*Two-way set associative* (all odd, so all in set 1):

${accessTable(r4[1].two, Q4C_CFG.two)}

*Direct mapped* (1, 5 → index 1; 3 → index 3):

${accessTable(r4[1].dm, Q4C_CFG.dm)}

**Summary (misses):**

| Sequence | Fully associative | Two-way | Direct mapped |
|---|---|---|---|
| 0, 2, 4, 8, 10, 12, 14, 16, 0 | ${r4[0].fa.misses} | ${r4[0].two.misses} | ${r4[0].dm.misses} |
| 1, 3, 5, 1, 3, 1, 3, 5, 3 | ${r4[1].fa.misses} | ${r4[1].two.misses} | ${r4[1].dm.misses} |

In sequence 1, eight distinct blocks overflow every 4-block cache, so block 0 is evicted before it is reused. In sequence 2, only three blocks are used, so the fully associative cache keeps them all; the two-way cache puts all three in one 2-block set and suffers; the direct-mapped cache keeps 3 at index 3 while 1 and 5 fight over index 1.`,

  "4d": md`**Step 1: penalties in cycles.** Clock period $= 1/4\ \text{GHz} = 0.25$ ns.
$$
\text{main memory: } \frac{100\ \text{ns}}{0.25\ \text{ns}} = 400\ \text{cycles},\qquad \text{L2: } \frac{5\ \text{ns}}{0.25\ \text{ns}} = 20\ \text{cycles}
$$

**Step 2: CPI with only the primary cache.**
$$
\text{CPI} = 1 + 0.03\times400 = 13
$$

**Step 3: CPI with the secondary cache.** All primary misses (3%) pay the L2 access; those that also miss in L2 (1% of instructions) pay main memory too:
$$
\text{CPI} = 1 + 0.03\times20 + 0.01\times400 = 1 + 0.6 + 4.0 = 5.6
$$

**Step 4: speed-up.**
$$
\frac{13}{5.6} \approx ${fx(13 / 5.6, 3)}
$$
The processor with the secondary cache is about **2.3 times faster**.`,

  "5a": md`**The function is tail-recursive:** the recursive call is the last thing it does, and nothing is done with its result. So the call can be made with a plain jump back to the start: no stack frame, no saving \`$ra\`, and the original return address is used by the final \`jr\`. This gives the minimal code.

\`\`\`
rstrcopy:
        lbu  $t0, 0($a1)          # $t0 = *source
        beq  $t0, $zero, Else     # end of string: *source == 0 ?
        sb   $t0, 0($a0)          # *dest = *source
        addi $a0, $a0, 1          # dest++
        addi $a1, $a1, 1          # source++
        j    rstrcopy             # rstrcopy(dest, source): tail call
Else:   sb   $zero, 0($a0)        # *dest = 0 (the terminator)
        jr   $ra
\`\`\`

**8 instructions**, 6 per character copied.

**As a true recursive call** (if the compiler does not turn the tail call into a jump), the recursive call becomes \`jal rstrcopy\` and must be wrapped by saving and restoring \`$ra\`:

\`\`\`
        addi $sp, $sp, -4
        sw   $ra, 0($sp)
        jal  rstrcopy
        lw   $ra, 0($sp)
        addi $sp, $sp, 4
        jr   $ra
\`\`\`

This is 5 more instructions and uses one stack word per character, which is why the tail-call version is preferred.

**Trace:** with source = "abc", the code copies a, b, c, then sees the terminating 0 byte at source + 3 and writes 0 at dest + 3: dest = "abc".`,

  "5b": md`**Split the constant into halves:**
$$
\underbrace{0001\ 0000\ 0011\ 1101}_{\text{upper 16 bits}}\ \underbrace{0000\ 1001\ 0000\ 0000}_{\text{lower 16 bits}}
$$
- Upper half: $\texttt{0x103D} = 4157$.
- Lower half: $\texttt{0x0900} = 2304$.

An I-format instruction holds only 16 bits, so two instructions are needed:

\`\`\`
lui $s0, 4157          # $s0 = 0001 0000 0011 1101 0000 0000 0000 0000
ori $s0, $s0, 2304     # $s0 = 0001 0000 0011 1101 0000 1001 0000 0000
\`\`\`

- \`lui\` (load upper immediate) puts 4157 in the upper 16 bits and clears the lower 16.
- \`ori\` ORs in the lower 16 bits (zero-extended, so the upper half is unchanged).

\`\`\`fig
isa-lui-ori
\`\`\``,

  "5c": md`**Pseudoinstructions** are instructions that the **assembler** accepts but the hardware does not implement. The assembler translates each into one or more real machine instructions (using register \`$at\` for temporaries when needed). They make assembly programs easier to write, at no hardware cost.

**Two examples:**

| Pseudoinstruction | Translated to |
|---|---|
| \`move $t0, $t1\` | \`add $t0, $zero, $t1\` |
| \`blt $t0, $t1, L\` | \`slt $at, $t0, $t1\` then \`bne $at, $zero, L\` |

(Others: \`li\` (load immediate), \`bgt\`, \`bge\`, \`ble\`.)`,

  "6a": b16Solutions["8b"],

  "6b": b16Solutions["6a"],

  "6c": md`**Data race.** Two memory accesses form a data race if they are from **different threads** to the **same location**, at least one is a **write**, and they occur one after another without synchronisation ordering them. The result then depends on the timing of the threads, so the program can give different answers on different runs.

Example: two threads each do \`count = count + 1\` (load, add, store). If both load the old value before either stores, one increment is lost.

${after(b14Solutions["6b"], "**MIPS support:")}`,

  "7c": b16Solutions["7c"],

  "8a": md`**The coherence problem.** Each processor's cache may hold a copy of the same memory block. When one processor writes its copy, the other copies (and memory) become stale. A coherence protocol makes every processor see the latest written value.

**Methods:**

**1. Snooping (bus-based) protocols.** Every cache controller monitors ("snoops") the shared bus, and sees every miss and write of the other caches. Each cache keeps the sharing status of its blocks. Suited to small systems with a shared bus.
- **Write invalidate** (most common): before writing a block, a processor broadcasts an **invalidate** on the bus; all other copies are marked invalid. A later read by another processor misses and gets the new value (from the writing cache or memory). Repeated writes by the same processor need no further bus traffic.
- **Write update (write broadcast):** every write is broadcast, and all caches holding the block **update** their copies. Readers always have the current value, but every write uses bus bandwidth.

**2. Directory-based protocols.** A **directory** (kept with memory) records, for each block, which caches hold copies and whether it is shared or exclusive. On a miss or write, the requester consults the directory, which sends invalidations (or forwards the request) only to the caches that hold the block. No broadcast is needed, so this scales to many processors, at the cost of the directory storage and indirection.

**Supporting ideas used by both:** caches may **migrate** data (move a block into the local cache that uses it) and **replicate** shared read-only data, reducing access latency and contention for the shared memory.`,
}
