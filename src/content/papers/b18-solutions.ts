import { md } from "../md"
import { assemble, parse } from "@/lib/mips"

/* ───── Q8: approximate LRU with reference bits ───── */
export const Q8_REFS = [0, 0, 2, 7, 0, 6, 1, 2, 6, 7, 1, 1, 7, 1, 4, 1]
export type Frame = { page: number; ref: 0 | 1 } | null
export function approxLRU(refs: number[], frames = 4, clearEvery = 4) {
  const table: Frame[] = Array(frames).fill(null)
  const steps: { t: number; page: number; hit: boolean; victim?: number; table: Frame[]; cleared: boolean }[] = []
  refs.forEach((page, i) => {
    const t = i + 1
    const at = table.findIndex((e) => e?.page === page)
    let victim: number | undefined
    if (at >= 0) table[at] = { page, ref: 1 }
    else {
      let slot = table.findIndex((e) => e === null)
      if (slot < 0) {
        // Replace the lowest-numbered entry whose reference bit is 0; if every bit is 1, entry 0.
        slot = table.findIndex((e) => e!.ref === 0)
        if (slot < 0) slot = 0
        victim = table[slot]!.page
      }
      table[slot] = { page, ref: 1 }
    }
    const snapshot = table.map((e) => (e ? { ...e } : null))
    const cleared = t % clearEvery === 0
    steps.push({ t, page, hit: at >= 0, victim, table: snapshot, cleared })
    if (cleared) table.forEach((e, k) => e && (table[k] = { page: e.page, ref: 0 }))
  })
  return steps
}
const q8 = approxLRU(Q8_REFS)
const cell = (e: Frame) => (e ? `${e.page} (${e.ref})` : "–")
const q8Table = [
  "| Step | Page | Hit/miss | Entry 0 | Entry 1 | Entry 2 | Entry 3 | Note |",
  "|---|---|---|---|---|---|---|---|",
  ...q8.map((s) => `| ${s.t} | ${s.page} | ${s.hit ? "**hit**" : "miss"} | ${s.table.map(cell).join(" | ")} | ${[s.victim !== undefined ? `replaces page ${s.victim}` : "", s.cleared ? "then all reference bits cleared" : ""].filter(Boolean).join("; ")} |`),
].join("\n")
const q8Hits = q8.filter((s) => s.hit).length

/* ───── Q5: wide-issue schedules ───── */
export const Q5_LOOP = "Loop: lw $t0, 0($s0)\nlw $t1, 0($s1)\naddu $t0, $t0, $t1\nsw $t0, 0($s1)\naddi $s0, $s0, -4\naddi $s1, $s1, -4\nbne $s1, $zero, Loop"
export const Q5_SCHED: string[][] = [
  ["Loop: lw $t0, 0($s0)", "lw $t1, 0($s1)", "addi $s0, $s0, -4", "addi $s1, $s1, -4"],
  ["nop"],
  ["addu $t0, $t0, $t1"],
  ["sw $t0, 4($s1)", "bne $s1, $zero, Loop"],
]
export const Q5_UNROLLED: string[][] = [
  ["Loop: lw $t0, 0($s0)", "lw $t1, 0($s1)", "lw $t2, -4($s0)", "lw $t3, -4($s1)", "lw $t4, -8($s0)", "lw $t5, -8($s1)", "lw $t6, -12($s0)", "lw $t7, -12($s1)", "addi $s0, $s0, -16", "addi $s1, $s1, -16"],
  ["nop"],
  ["addu $t0, $t0, $t1", "addu $t2, $t2, $t3", "addu $t4, $t4, $t5", "addu $t6, $t6, $t7"],
  ["sw $t0, 16($s1)", "sw $t2, 12($s1)", "sw $t4, 8($s1)", "sw $t6, 4($s1)", "bne $s1, $zero, Loop"],
]
const count = (s: string[][]) => s.flat().filter((x) => x !== "nop").length
const schedTable = (s: string[][]) =>
  ["| Cycle | Instructions issued together |", "|---|---|", ...s.map((p, i) => `| ${i + 1} | ${p.map((x) => (x === "nop" ? "(none: waiting for the loads)" : `\`${x.replace(/^Loop: /, "")}\``)).join(", ")} |`)].join("\n")

/* ───── Q12(b) ───── */
const q12 = assemble(parse("L1: bne $t0, $t1, L3\nL2: j 131072\nL3: addi $t0, $t1, 1"), 1000)

export const b18Solutions: Record<string, string> = {
  "1": md`**(a) Code reordering to avoid using a load result in the next instruction → Performance via pipelining.**
The reordering exists because of the pipeline: a load's data arrives at the end of MEM, too late for the next instruction's EX even with forwarding (the load-use hazard). Moving an independent instruction between the load and its use fills that slot and removes the stall, so the pipeline keeps overlapping instructions at full rate.

**(b) Different caches for data and instructions effectively increase bandwidth → Hierarchy of memories.**
Caches are the upper levels of the memory hierarchy. Splitting the first level into an instruction cache and a data cache lets an instruction fetch and a data access be served in the same cycle (two accesses per cycle instead of one), and each cache can be tuned for its own access pattern. The improvement is in how the fast top level of the hierarchy is organised.

**(c) CPUs hit the power wall, so GPUs gained popularity → Performance via parallelism.**
Single-core performance could no longer grow by raising the clock rate, because of power limits. Performance now comes from doing many operations at once: GPUs are massively parallel, many-core, highly multithreaded processors, so programs that expose data parallelism run far faster on them.`,

  "3": md`The instruction is printed as \`ori $t1, 100($t2)\`; \`ori\` is an I-format logical instruction, so it is read as \`ori $t1, $t2, 100\`: \`$t1\` = \`$t2\` OR 100.

**Active datapath elements** (the full single-cycle datapath):

\`\`\`fig
dp-full
\`\`\`

1. **PC** → **instruction memory**: fetch; the **PC + 4 adder** computes the next PC.
2. **Register file:** read register 1 = rs = \`$t2\` (bits 25–21).
3. **Immediate extension** of bits 15–0 (100). For \`ori\` it must be **zero**-extended; the basic datapath only sign-extends, so a zero-extend (or a control on the extender) is needed. For 100 the result is the same either way.
4. **ALUSrc mux** = 1: the immediate is the ALU's second operand.
5. **ALU** performs **OR**.
6. **MemtoReg mux** = 0: the ALU result goes to the register write data.
7. **RegDst mux** = 0: the write register is rt = \`$t1\` (bits 20–16).
8. **Register file write** (RegWrite = 1).
9. **PCSrc / Jump muxes** select PC + 4.

Not used: data memory, the branch adder and shift-left-2, the jump path.

**Control bits:**

| RegDst | ALUSrc | MemtoReg | RegWrite | MemRead | MemWrite | Branch | Jump | ALU operation |
|---|---|---|---|---|---|---|---|---|
| 0 | 1 | 0 | **1** | 0 | 0 | 0 | 0 | OR |

The basic ALUOp encoding (00 add, 01 subtract, 10 funct) has no "OR for an I-type", so \`ori\` needs a new ALUOp code (e.g. 11 → OR), and the extender must zero-extend: the set bits are RegWrite and ALUSrc, with the ALU told to OR.`,

  "4": md`**Step 1: find the dependences.** Every instruction writing or reading \`$t0\` matters, plus \`$t1\`.

| Producer | Consumer | Register | Distance | Hazard |
|---|---|---|---|---|
| \`lw $t0\` (1) | \`add $t0, $t0, $t1\` (2) | \`$t0\` | 1 | **load-use**: needs a stall, then MEM/WB → EX |
| \`add\` (2) | \`add $t0, $t2, $t0\` (3) | \`$t0\` | 1 | EX/MEM → EX; **double data hazard** (MEM/WB also holds an older \`$t0\`, from lw) |
| \`add\` (3) | \`add $t0, $t0, $t3\` (4) | \`$t0\` | 1 | EX/MEM → EX; **double data hazard** again |
| \`add\` (4) | \`sw $t0, 0($t6)\` (7) | \`$t0\` | 3 | none: sw reads \`$t0\` in ID in the cycle add writes it back |

\`sub $t1\` writes \`$t1\`, but every reader of \`$t1\` (instruction 2) is before it: no hazard. \`and $t4\` has no dependences.

**Step 2: the pipeline diagram** (forwarding paths in green, the stall in amber):

\`\`\`fig
b18-4
\`\`\`

$$
\text{cycles} = 7 + 4 + 1 = 12
$$

**Step 3: forwarding conditions** (with the double-data-hazard priority):

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

- Instruction 2 (\`$t0\` is rs): after the stall, ForwardA = 01 from MEM/WB (the loaded value).
- Instruction 3 (\`$t0\` is rt): ForwardB = 10; the MEM/WB condition is suppressed by the "not EX/MEM" clause.
- Instruction 4 (\`$t0\` is rs): ForwardA = 10, again with EX/MEM taking priority.

**Step 4: can forwarding alone solve all hazards? No.** The load-use hazard (lw → add) cannot be solved by forwarding: the loaded value exists only at the end of lw's MEM stage, the same cycle the add needs it at the start of EX. A value cannot be forwarded backward in time. The hazard detection unit must **stall one cycle** (or the compiler must place an independent instruction between them, e.g. move \`sub\` or \`and\` up). All the other hazards are solved by forwarding.`,

  "5": md`**Assumptions** (the hint allows more than two issues):
- any number of instructions can issue together, provided they are independent;
- the instructions in one packet all read their registers in the same cycle (so a load placed together with an \`addi\` uses the old base register);
- an ALU result can be used in the next cycle; a loaded value two cycles later (the one-cycle load-use latency of the slides' dual-issue MIPS);
- the branch is in the last packet of the loop.

**Step 1: the critical path.** lw → (one-cycle latency) → addu → sw. The \`addi\`s and the \`bne\` are independent of it, so one iteration needs at least 4 cycles.

**Step 2: schedule without unrolling.**

${schedTable(Q5_SCHED)}

The store uses offset 4 because \`$s1\` was already decremented in cycle 1.
$$
\text{IPC} = \frac{${count(Q5_SCHED)}}{4} = ${count(Q5_SCHED) / 4}
$$

**Step 3: maximise IPC by unrolling 4 times**, with register renaming (\`$t0\`–\`$t7\`) so the four copies are independent, and one \`addi\` per array and one \`bne\` per 4 elements:

${schedTable(Q5_UNROLLED)}

$$
\text{IPC} = \frac{${count(Q5_UNROLLED)}\ \text{instructions}}{4\ \text{cycles}} = ${count(Q5_UNROLLED) / 4}
$$

Now 4 elements are processed every 4 cycles (one per cycle), against one element per 4 cycles before. Unrolling further (8, 16 copies) raises IPC further, limited by the number of registers and functional units. The effective IPC of this refactored loop is **${count(Q5_UNROLLED) / 4}** (it requires the element count to be a multiple of 4).`,

  "6": md`**Reading the address split:** tag = bits 31–20 (12 bits); index = bits 19–12 (8 bits); block offset = bits 11–2 (10 bits, a word within the block); byte offset = bits 1–0 (2 bits).

**(a) Distinct blocks in the cache.**
- Sets $= 2^{8} = 256$, each with 2 ways (2-way set associative).
- Blocks $= 256\times2 =$ **512**.
- (Each block is $2^{10}$ words = 4 KiB, so the cache holds $512\times4$ KiB = 2 MiB of data.)

**(b) Index of address 24092022.** The index is bits 19–12:
$$
\left\lfloor\frac{24{,}092{,}022}{2^{12}}\right\rfloor = \left\lfloor\frac{24{,}092{,}022}{4096}\right\rfloor = 5881
$$
$$
5881 \bmod 2^{8} = 5881 - 22\times256 = 249
$$
The address maps to **index 249** (with tag $\lfloor 24092022/2^{20}\rfloor = 22$).

**(c) Probability that an element of a valid set is replaced on the next request.**

Assumptions: "valid" means both ways of the set hold blocks; every byte address is equally likely; the two stored blocks have different tags.

- The next request maps to this index with probability $1/2^{8} = 1/256$.
- Given that, it hits only if its tag equals one of the 2 stored tags out of $2^{12} = 4096$: $P(\text{hit} \mid \text{this index}) = 2/4096$.
- On a miss in a full set, one element (the LRU one) is replaced.

$$
P(\text{replacement in this set}) = \frac{1}{256}\times\left(1 - \frac{2}{4096}\right) = \frac{4094}{1{,}048{,}576} \approx 0.0039
$$

If the question means "given that the request falls in this set", the probability is $1 - 2/4096 \approx 0.9995$. Each of the two elements is the one replaced half the time, if both are equally likely to be the LRU one.`,

  "7": md`**Setup:** each level is consulted only if the level above it misses. Local miss rates: cache 5%, RAM 15%, SSD 25%, HDD 0% (everything is on the HDD).

**(a) Probability the data comes from the SSD.** It must miss in the cache, miss in RAM and hit in the SSD:
$$
0.05\times0.15\times(1 - 0.25) = 0.05\times0.15\times0.75 = 0.005625
$$
About **0.56%** of fetches are served by the SSD.

**(b) Expected time of a fetch.** Every fetch pays the cache time; a miss also pays the RAM time; and so on down:
$$
T = 1 + 0.05\times\Big(10 + 0.15\times\big(100 + 0.25\times1000\big)\Big)
$$
$$
= 1 + 0.05\times(10 + 0.15\times350) = 1 + 0.05\times62.5 = 1 + 3.125 = 4.125\ \text{cycles}
$$

**(c) The I-cache miss rate.** Each instruction makes 1 instruction fetch, and 10% also make a data access: 1.1 accesses per instruction. The overall miss rate stays 5%, so per instruction:
$$
\text{misses} = 0.05\times1.1 = 0.055
$$
These are I-cache misses plus D-cache misses:
$$
1\times m_I + 0.1\times0.10 = 0.055 \implies m_I = 0.055 - 0.01 = 0.045
$$
The I-cache miss rate is **4.5%**.`,

  "8": md`**The scheme.** The page table has 4 entries (4 physical pages) for 8 virtual pages, fully associative (a page can go in any entry).
- On every access, the page's **reference bit** is set to 1.
- After every 4 time steps (after steps 4, 8 and 12), the OS clears all reference bits to 0.
- On a miss: use a free entry if there is one; otherwise replace a page whose reference bit is 0 (not used recently). The tie-break rule chosen here, since the question does not give one: the lowest-numbered such entry; if every bit is 1, entry 0.

**Simulation** (each entry shown as page (reference bit), after the access):

${q8Table}

**Result:** ${q8Hits} hits and ${Q8_REFS.length - q8Hits} misses out of ${Q8_REFS.length} references.

**How the replacements were chosen:**
- Steps 1–4 fill entries 0, 1, 2 with pages 0, 2, 7, and the bits are cleared.
- At step 6 (page 6), entry 3 is free.
- At step 7 (page 1) the table is full. Entry 0 (page 0) was referenced at step 5, so it has bit 1; entry 1 (page 2) has bit 0, so page 2 is replaced.
- Later misses pick, in the same way, the lowest-numbered page not referenced since the last clearing.

A different tie-break (e.g. a rotating clock hand) can change which page is evicted, but the method (only pages with reference bit 0 are candidates) is the same.`,

  "10a": md`| Idea | Meaning | Example |
|---|---|---|
| **Design for Moore's Law** | transistor counts double every 18–24 months, so design for the technology available when the product ships | integrating all cache levels on the processor chip |
| **Use abstraction to simplify design** | hide lower-level details behind simpler models, to manage complexity | the ISA as the hardware/software interface; procedures with parameters |
| **Make the common case fast** | improve the frequent case, not the rare one: it gives more overall benefit (Amdahl's law) | 16-bit immediates and PC-relative branches; beq/bne in hardware but not blt/bge |
| **Performance via parallelism** | perform operations at the same time | multicore processors; GPUs; a fast multiplier with many adders working at once |
| **Performance via pipelining** | overlap the steps of successive operations, like an assembly line | the 5-stage MIPS pipeline |
| **Performance via prediction** | guess and start work early, if it is usually right and cheap to undo | branch prediction; prefetching |
| **Hierarchy of memories** | fast, small, expensive memory at the top, slow, large, cheap at the bottom, so memory looks both fast and large | registers → caches → DRAM → disk |
| **Dependability via redundancy** | include spare components to take over on failure | redundant disks; error-correcting memory |`,

  "10b": md`Each stage computes $F_i = X_i\oplus Y_i\oplus Z_i$. For $S_3 = 1$ the carries are cut ($Z_i = 0$), so $F_i = X_i\oplus Y_i$.

**Step 1: arithmetic functions** ($S_3 = 0$), with $X = A$ and $F = A + Y + C_{in}$:

| $S_2S_1S_0$ | Function | $Y$ | $C_{in}$ | Why |
|---|---|---|---|---|
| 000 | $A$ | 0 | 0 | |
| 001 | $A - 1$ | all 1s | 0 | all 1s $= -1$ |
| 010 | $A + B + 1$ | $B$ | 1 | |
| 011 | $A + B$ | $B$ | 0 | |
| 100 | $A - B$ | $\overline{B}$ | 1 | $A + \overline{B} + 1$ |
| 101 | $A - B - 1$ | $\overline{B}$ | 0 | $A + \overline{B}$ |
| 110 | $A + 1$ | 0 | 1 | |
| 111 | $A$ | 0 | 0 | (choosing 0 and 0 here simplifies $C_{in}$) |

**Step 2: logic functions** ($S_3 = 1$; $S_0$ is don't care):

| $S_2S_1$ | Function | $X_i$ | $Y_i$ | Check |
|---|---|---|---|---|
| 00 | $A'$ | $A_i$ | 1 | $A_i\oplus1 = A_i'$ |
| 01 | $AB'$ | $A_i + B_i$ | $B_i$ | if $B_i = 1$: $1\oplus1 = 0$; if $B_i = 0$: $A_i\oplus0 = A_i$ |
| 10 | $A\odot B$ | $A_i$ | $B_i'$ | $A_i\oplus B_i' = A_i\odot B_i$ |
| 11 | $A + B$ | $A_i + B_i$ | 0 | |

**Step 3: $X_i$.** It is $A_i$ except for $S_3S_1 = 11$, where it is $A_i + B_i$:
$$
X_i = A_i + S_3S_1B_i
$$

**Step 4: $Y_i$.** Collect the cases:
- $Y_i = 1$ for $S_2S_1 = 00$ when $S_0 = 1$ (code 001) or $S_3 = 1$;
- $Y_i = B_i$ for $S_2S_1 = 01$ (codes 010, 011, and the AB′ case);
- $Y_i = B_i'$ for $S_2S_1 = 10$ (codes 100, 101, and the XNOR case);
- $Y_i = 0$ for $S_2S_1 = 11$ (codes 110, 111, and the OR case), and for code 000.

$$
Y_i = S_2'S_1'(S_0 + S_3) + S_2'S_1B_i + S_2S_1'B_i'
$$

**Step 5: carries.** $C_{in} = 1$ only for codes 010, 100, 110 (all with $S_3 = 0$, $S_0 = 0$ and $S_2 + S_1 = 1$):
$$
C_{in} = Z_1 = S_3'S_0'(S_2 + S_1),\qquad Z_i = S_3'C_i
$$

**Result:**
$$
X_i = A_i + S_3S_1B_i
$$
$$
Y_i = S_2'S_1'(S_0 + S_3) + S_2'S_1B_i + S_2S_1'B_i'
$$
$$
Z_i = S_3'C_i,\qquad C_{in} = S_3'S_0'(S_2 + S_1)
$$
These were verified on all $16\times16$ input pairs for every one of the 16 selection codes.`,

  "11c": md`**Register use:** a, b, c in \`$a0\`, \`$a1\`, \`$a2\`; i in \`$s1\`, result in \`$s2\` (as given); \`$t0\` temporary; return value in \`$v0\`. \`$s1\` and \`$s2\` are saved registers, so the procedure saves and restores them.

\`\`\`
testFunc:
        addi $sp, $sp, -8
        sw   $s1, 4($sp)          # save $s1
        sw   $s2, 0($sp)          # save $s2
        add  $s1, $zero, $zero    # i = 0
        add  $s2, $zero, $zero    # result = 0
Loop:   slt  $t0, $a1, $s1        # $t0 = (b < i), i.e. i > b
        beq  $t0, $zero, Skip
        add  $s2, $s2, $a2        # result += c
Skip:   addi $s1, $s1, 1          # i++
        slt  $t0, $s1, $a0        # i < a ?
        bne  $t0, $zero, Loop     # do ... while (i < a)
        add  $v0, $s2, $zero      # return result
        lw   $s2, 0($sp)          # restore
        lw   $s1, 4($sp)
        addi $sp, $sp, 8
        jr   $ra
\`\`\`

**Trace: testFunc(5, 2, 10).** i runs 0 … 4; the condition i > 2 holds for i = 3 and 4, so result = 10 + 10 = **20**. (A do-while runs at least once: testFunc(0, −1, 7) returns 7, because the body runs with i = 0 > −1 before the test.)`,

  "11d": md`**Example: MIPS uses three instruction formats, all 32 bits long.**

- One fixed format would be simplest (simplicity favours regularity), but an arithmetic instruction needs three 5-bit register fields, while a load, a store or an \`addi\` needs a 16-bit constant, and a jump needs a long address. No single field layout fits all of them in 32 bits.
- The **compromise:** keep every instruction **32 bits** (simple fetch and decode, and the pipeline-friendly fixed length), but allow **three formats** (R, I, J). Keep the formats as similar as possible: the opcode is always bits 31–26, and rs and rt are always in bits 25–21 and 20–16.

| Format | Fields |
|---|---|
| R | op 6, rs 5, rt 5, rd 5, shamt 5, funct 6 |
| I | op 6, rs 5, rt 5, constant/address 16 |
| J | op 6, address 26 |

A second example: constants are limited to 16 bits. That covers the common small constants, and larger ones are built with \`lui\` + \`ori\`.`,

  "12a": md`**Program A:** instructions $2 + 1 + 4 + 2 = 9$.
$$
\text{cycles} = 2\times3 + 1\times1 + 4\times2 + 2\times4 = 6 + 1 + 8 + 8 = 23
$$
$$
\text{CPI}_A = \frac{23}{9} \approx 2.56
$$

**Program B:** instructions $3 + 2 + 3 + 2 = 10$.
$$
\text{cycles} = 3\times3 + 2\times1 + 3\times2 + 2\times4 = 9 + 2 + 6 + 8 = 25
$$
$$
\text{CPI}_B = \frac{25}{10} = 2.50
$$

**Program A** has the higher average CPI (2.56 > 2.50), although B takes more cycles in total (25 > 23).`,

  "12b": md`**L1: \`bne $t0, $t1, L3\`** at 1000: **I-format** (op 5, rs = \`$t0\` = 8, rt = \`$t1\` = 9).
$$
\text{offset} = \frac{L3 - (\text{PC} + 4)}{4} = \frac{1008 - 1004}{4} = 1
$$

**L2: \`j LX\`** at 1004: **J-format** (op 2).
$$
\text{address field} = \frac{LX}{4} = \frac{131072}{4} = 32768
$$
(The top 4 bits of PC + 4 and LX are both 0, so the jump reaches it.)

**L3: \`addi $t0, $t1, 1\`** at 1008: **I-format** (op 8, rs = \`$t1\` = 9, rt = destination \`$t0\` = 8, immediate 1).

| Address | Format | 6 bits | 5 bits | 5 bits | 16 bits |
|---|---|---|---|---|---|
| 1000 | I | ${q12[0].enc.fields.map((f) => f[1]).join(" | ")} |
| 1008 | I | ${q12[2].enc.fields.map((f) => f[1]).join(" | ")} |

| Address | Format | 6 bits | 26 bits |
|---|---|---|---|
| 1004 | J | ${q12[1].enc.fields.map((f) => f[1]).join(" | ")} |

Note the register order: in the I-format, rs (the source) comes before rt (the destination for \`addi\`), so \`addi $t0, $t1, 1\` is 8, **9**, **8**, 1.`,

  "12d": md`The module subtracts the second input from the first, $A - B$, and outputs V, Z, S, C. Compare with simple gates on these bits.

**Signed (two's-complement) A and B:**
- $A = B$ exactly when $A - B = 0$: **Z = 1**.
- $A < B$ when $A - B$ is truly negative. S alone is wrong when the subtraction overflows, so the correct "negative" indicator is **$S\oplus V$**.
- $A > B$ when neither: $(S\oplus V)'\cdot Z'$.

\`\`\`
       A[3:0] ─┐
               ├─> [ status module: A − B ] ──> V, Z, S, C
       B[3:0] ─┘
  A = B : Z
  A < B : S XOR V
  A > B : NOT(S XOR V) AND NOT Z      (= NOR(S XOR V, Z))
\`\`\`

Gates: one XOR (S, V), one NOR (its output, Z) for A > B; Z directly for A = B.

**If A and B are unsigned,** use the carry instead (the module computes $A + \overline{B} + 1$, so C = 1 means no borrow, $A \ge B$):
- $A = B$: Z;
- $A < B$: C′;
- $A > B$: C · Z′.

Both versions were checked on every pair of 4-bit inputs.`,

  "13a": md`**Format:** 1 sign bit, 24 fraction bits, so $32 - 1 - 24 = 7$ exponent bits.

**(i) Why a bias?** The bias stores the exponent as an **unsigned** number (actual exponent + bias), so negative exponents need no sign. With the exponent field placed after the sign bit and before the fraction, non-negative floats then compare in the same order as their bit patterns read as unsigned integers: floats can be compared and sorted with integer hardware.

**(ii) The bias for a 7-bit exponent:**
$$
\text{Bias} = 2^{7-1} - 1 = 63
$$
Why: the fields 0000000 and 1111111 are reserved, leaving fields 1 to 126 for normal numbers. A bias of 63 maps them to actual exponents $1 - 63 = -62$ up to $126 - 63 = +63$, splitting the range almost evenly between tiny and huge numbers, the same rule as IEEE 754 (127 for 8 bits).

**(iii) Smallest and largest absolute (normalised) values.**
- Smallest: exponent field 0000001, fraction all 0s:
  $$
  1.0\times2^{-62} \approx 2.17\times10^{-19}
  $$
- Largest: exponent field 1111110, fraction all 1s:
  $$
  (2 - 2^{-24})\times2^{63} \approx 1.84\times10^{19}
  $$

Part (iv), on denormalised numbers, is not covered in the lecture slides.`,

  "13b": md`**PC-relative addressing** is used by conditional branches (\`beq\`, \`bne\`). The instruction stores a 16-bit signed **word offset** relative to the next instruction:
$$
\text{Target address} = (\text{PC} + 4) + \text{sign-extend}(\text{offset})\times4
$$

**Steps:**
1. During fetch, the PC is incremented: PC + 4 (the address of the next instruction).
2. The 16-bit offset is **sign-extended** to 32 bits (so the branch can go backwards).
3. It is **shifted left 2** (× 4), because instructions are 4-byte words.
4. An adder adds it to PC + 4. If the branch is taken, this sum becomes the new PC.

**Encoding the offset:** offset = (target − (PC + 4)) / 4. Range: −32768 to +32767 words, about ±128 KB.

**Example:** \`bne $t0, $s5, Exit\` at address 80012, with Exit at 80024: offset $= (80024 - 80016)/4 = 2$; at run time the target is $80016 + 2\times4 = 80024$.

\`\`\`fig
isa-mode-pcrel
\`\`\``,
}
