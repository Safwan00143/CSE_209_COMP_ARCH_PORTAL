import { md } from "../md"
import { accessTable, simulateCache, totalBits, type CacheConfig } from "@/lib/cache"
import { encode } from "@/lib/ieee"
import { CONTROL, type Signal } from "@/lib/datapath"

/* ───── Q1(a) ───── */
export const Q1A = {
  A: { ghz: 2, ops: [["Multiplication 1", 4], ["Multiplication 2", 4], ["Division 1", 5], ["Division 2", 5], ["Addition 1", 2]] as [string, number][] },
  B: { ghz: 2.5, ops: [["Multiplication 1", 5], ["Multiplication 2", 5], ["Division 1", 6], ["Division 2", 6], ["Addition 1", 3]] as [string, number][] },
}
const cyc = (s: keyof typeof Q1A) => Q1A[s].ops.reduce((t, [, c]) => t + c, 0)
const ns = (s: keyof typeof Q1A) => cyc(s) / Q1A[s].ghz

/* ───── Q4(a) ───── */
export const Q4_FMT = { expBits: 7, fracBits: 8 }
const q4 = encode(-13.5, Q4_FMT)

/* ───── Q6(a) ───── */
export const Q6A_SEQ = [0, 12, 16, 18, 0]
export const Q6A_CFG: Record<"dm" | "two" | "four", CacheConfig> = { dm: { sets: 8, ways: 1 }, two: { sets: 4, ways: 2 }, four: { sets: 2, ways: 4 } }
const run6 = (k: keyof typeof Q6A_CFG) => simulateCache(Q6A_CFG[k], Q6A_SEQ)
const r6 = { dm: run6("dm"), two: run6("two"), four: run6("four") }

/* ───── Q6(b), Q7(a) ───── */
const t6 = totalBits({ addressBits: 32, dataBytes: 4096 * 16, blockBytes: 16, ways: 8 })
const t7 = totalBits({ addressBits: 32, dataBytes: 64 * 1024, blockBytes: 32, ways: 1 })

/* ───── Q8(a) ───── */
export const Q8A_SIGNALS = ["RegDst", "Branch", "MemRead", "MemtoReg", "MemWrite", "ALUSrc", "RegWrite"] as const
const show = (v: Signal) => (v === "X" ? "X (0)" : String(v))
const q8Rows = (["R-format", "sw", "beq"] as const).map((k) => `| ${k === "R-format" ? "add" : k} | ${Q8A_SIGNALS.map((s) => show(CONTROL[k][s])).join(" | ")} |`)

export const b17Solutions: Record<string, string> = {
  "1a": md`**Step 1: keep only Program 1's operations.** The logs also hold other programs' operations and OS I/O overhead. These are not part of Program 1's own execution, so the CPU time of Program 1 counts only its own operations.

| Operation of Program 1 | System A (cycles) | System B (cycles) |
|---|---|---|
${Q1A.A.ops.map(([name, a], i) => `| ${name} | ${a} | ${Q1A.B.ops[i][1]} |`).join("\n")}
| **Total** | **${cyc("A")}** | **${cyc("B")}** |

**Step 2: CPU time = cycles / clock rate.**
$$
T_A = \frac{${cyc("A")}}{2\times10^{9}\ \text{Hz}} = ${ns("A")}\ \text{ns}
$$
$$
T_B = \frac{${cyc("B")}}{2.5\times10^{9}\ \text{Hz}} = ${ns("B")}\ \text{ns}
$$

**Step 3: compare.**
$$
\frac{\text{Performance}_A}{\text{Performance}_B} = \frac{T_B}{T_A} = \frac{${ns("B")}}{${ns("A")}} = ${ns("B") / ns("A")}
$$

The two systems have the **same performance** on Program 1. B needs more cycles (${cyc("B")} against ${cyc("A")}), but its faster clock (2.5 GHz against 2 GHz) makes up for it exactly.`,

  "1b": md`**Importance of Moore's Law.** Moore's Law observes that the number of transistors on an integrated circuit doubles every 18–24 months. Architects must design for where the technology will be when the product ships, not where it is when the design starts ("Design for Moore's Law", one of the eight great ideas). It has driven the growth in memory capacity and processor performance, and the move to multicore once single-core clock rates hit the power wall.

**The statement: disagree.** Improving one aspect by a factor of $x$ does not improve the whole computer by $x$, unless that aspect is 100% of the execution time. This is **Amdahl's Law**:
$$
T_{\text{improved}} = \frac{T_{\text{affected}}}{x} + T_{\text{unaffected}}
$$
If a fraction $f$ of the time is affected:
$$
\text{Speed-up} = \frac{T_{\text{old}}}{T_{\text{improved}}} = \frac{1}{(1 - f) + \dfrac{f}{x}} < x \quad\text{whenever } f < 1
$$

**Example.** A program runs for 100 s, 80 s of it in multiply. Making multiply 5 times faster:
$$
T_{\text{improved}} = \frac{80}{5} + 20 = 36\ \text{s},\qquad \text{speed-up} = \frac{100}{36} \approx 2.8 \ne 5
$$
Even an infinitely fast multiplier gives at most $100/20 = 5$; to get 5× overall the multiply time would have to fall to 0.

So improving the most important aspect by $x$ gives an overall gain of less than $x$. The correct lesson is "make the common case fast": improve the part that takes most of the time, and expect the gain to be limited by everything else.`,

  "1c": md`**Advantages of dynamically linked libraries (DLLs).** With static linking, library routines are copied into the executable at link time. With DLLs, the library is linked and loaded only when the program runs (lazy linkage: a routine is linked only the first time it is called).
- **Smaller executables:** library code is not copied into every program.
- **Shared memory:** one copy of a library in memory can serve many running programs.
- **Library updates take effect without relinking:** a fixed or improved library is picked up the next time the program runs.
- **Only the routines that are actually called are loaded and linked** (lazy procedure linkage), rather than the whole library.

**Role of JIT in Java.** Java is compiled to portable **bytecode**, which the Java Virtual Machine (JVM) interprets. Interpretation is portable but slow. A **Just-In-Time (JIT) compiler** finds the frequently executed ("hot") methods while the program runs and compiles them into native machine code of the host computer. Later calls run the native code, so Java keeps its portability while recovering much of the speed of compiled code.`,

  "2a": md`Each stage is a full adder: $F_i = X_i\oplus Y_i\oplus Z_i$, with $Z_0 = C_{in}$. For the logic functions ($S_3 = 1$) the carries are cut ($Z_i = 0$), so $F_i = X_i\oplus Y_i$.

**Step 1: arithmetic functions** ($S_3 = 0$). Take $X_i = A_i'$; then $F = A' + Y + C_{in}$:

| $S_2S_1S_0$ | Function | $Y$ | $C_{in}$ | Why |
|---|---|---|---|---|
| 000 | $A'$ | 0 | 0 | |
| 001 | $A' + 1$ | 0 | 1 | |
| 010 | $A' + B$ | $B$ | 0 | |
| 011 | $A' + B + 1$ | $B$ | 1 | |
| 100 | $A' - B - 1$ | $B'$ | 0 | $A' + B' = A' - B - 1$ |
| 101 | $A' - B$ | $B'$ | 1 | $A' + B' + 1$ |
| 110 | $A' - 1$ | all 1s | 0 | all 1s $= -1$ |
| 111 | $A'$ | all 1s | 1 | $A' - 1 + 1$ |

The pattern is clean: $C_{in} = S_0$, and $Y$ depends only on $S_2S_1$ (00 → 0, 01 → $B$, 10 → $B'$, 11 → 1):
$$
Y_i = S_1B_i + S_2B_i'
$$

**Step 2: logic functions** ($S_3 = 1$), keeping the same $Y_i$ so it needs no extra gates:

| $S_2S_1$ | Function | $Y_i$ | $X_i$ needed | Check |
|---|---|---|---|---|
| 00 | NAND | 0 | $A_i' + B_i'$ | $X_i\oplus0 = (A_iB_i)'$ |
| 01 | XNOR | $B_i$ | $A_i'$ | $A_i'\oplus B_i = A_i\odot B_i$ |
| 10 | XOR | $B_i'$ | $A_i'$ | $A_i'\oplus B_i' = A_i\oplus B_i$ |
| 11 | OR | 1 | $A_i'B_i'$ | $(A_i'B_i')\oplus1 = A_i + B_i$ |

**Step 3: $X_i$.** It is $A_i'$ everywhere except NAND ($S_3S_2S_1 = 100$, where $B_i'$ is added) and OR ($S_3S_2S_1 = 111$, where it is ANDed with $B_i'$):
$$
X_i = A_i'(S_3S_2S_1)' + A_i'B_i' + S_3S_2'S_1'B_i'
$$
Check: for 111 only $A_i'B_i'$ remains; for 100 it is $A_i' + A_i'B_i' + B_i' = A_i' + B_i'$; otherwise $A_i' + A_i'B_i' = A_i'$.

**Step 4: carries.**
$$
C_{in} = Z_0 = S_3'S_0,\qquad Z_i = S_3'C_i\ (i > 0)
$$

**Result:**
$$
X_i = A_i'(S_3S_2S_1)' + A_i'B_i' + S_3S_2'S_1'B_i'
$$
$$
Y_i = S_1B_i + S_2B_i'
$$
$$
Z_i = S_3'C_i,\qquad C_{in} = S_3'S_0
$$
These equations were checked on all $16\times16$ input pairs for every selection code in Table 2a.`,

  "2b": md`**Step 1: each comparison from a status-generator module** (the module computes 1st input − 2nd input). A, B, C, D, X are taken as 4-bit **two's-complement** (signed) values.

| Condition | Module inputs | Signal |
|---|---|---|
| $A \ge B$ | M1: (A, B) | not "A < B" = $(S_1\oplus V_1)'$ |
| $C \ne D$ | M2: (C, D) | $Z_2'$ |
| $X = 0$ | M3: (X, 0) | $Z_3$ |

For signed numbers, $A < B$ exactly when $A - B$ is truly negative, which is $S\oplus V$ (S alone is wrong when the subtraction overflows).

**Step 2: combine.**
$$
F = (S_1\oplus V_1)'\cdot Z_2' + Z_3
$$

**Circuit:**

\`\`\`
   A ──┐  ┌──────┐ V1 ──┐
       ├─>│  M1  │      XNOR ──────────┐
   B ──┘  │ A−B  │ S1 ──┘              AND ──┐
          └──────┘                     │     │
   C ──┐  ┌──────┐                     │     OR ──> F
       ├─>│  M2  │ Z2 ──> NOT ─────────┘     │
   D ──┘  │ C−D  │                           │
          └──────┘                           │
   X ──┐  ┌──────┐                           │
       ├─>│  M3  │ Z3 ───────────────────────┘
   0 ──┘  │ X−0  │
          └──────┘
\`\`\`

Gates: one XNOR (for $(S_1\oplus V_1)'$), one NOT (for $Z_2'$), one 2-input AND, one 2-input OR, and three modules. (X = 0 could also be a 4-input NOR on X directly, saving the third module.)

**If the values are unsigned,** $A \ge B$ is "no borrow", which is the carry: replace $(S_1\oplus V_1)'$ by $C_1$, giving $F = C_1Z_2' + Z_3$.

Both versions were checked on every combination of 4-bit values.`,

  "3a": md`**i. While loop.** sum in \`$s0\`, x in \`$s1\`, \`$t0\` temporary. The loop runs while x ≥ −5, so it exits when x < −5.

\`\`\`
        add  $s0, $zero, $zero    # sum = 0
        addi $s1, $zero, 100      # x = 100
Loop:   slti $t0, $s1, -5         # $t0 = 1 if x < -5
        bne  $t0, $zero, Exit     # exit when x < -5
        add  $s0, $s0, $s1        # sum = sum + x
        addi $s1, $s1, -1         # x = x - 1
        j    Loop
Exit:
\`\`\`

At the end, sum $= 100 + 99 + \cdots + (-5) = 5050 - 15 = 5035$ and x = −6.

**ii. if (x > y + 131075) x = 1.** x in \`$s0\`, y in \`$s1\`. 131075 is too large for a 16-bit immediate: 131075 = 0x0002 0003, so build it with \`lui\` and \`ori\`.

\`\`\`
        lui  $t0, 2               # $t0 = 0x0002 0000
        ori  $t0, $t0, 3          # $t0 = 0x0002 0003 = 131075
        add  $t0, $s1, $t0        # $t0 = y + 131075
        slt  $t1, $t0, $s0        # $t1 = 1 if y + 131075 < x
        beq  $t1, $zero, Skip     # condition false: skip
        addi $s0, $zero, 1        # x = 1
Skip:
\`\`\`

**iii. x = A[131075] + 5.** Base of A in \`$s2\`, x in \`$s0\`. The byte offset is $131075\times4 = 524300$ = 0x0008 000C, which does not fit in the 16-bit offset of \`lw\`. Put the upper half in a register and keep the lower half (12) as the offset:

\`\`\`
        lui  $t0, 8               # $t0 = 0x0008 0000 = 524288
        add  $t0, $t0, $s2        # $t0 = address of A + 524288
        lw   $t1, 12($t0)         # $t1 = A[131075] (offset 524288 + 12)
        addi $s0, $t1, 5          # x = A[131075] + 5
\`\`\``,

  "3b": md`**How pseudoinstructions work.** A pseudoinstruction is an instruction the **assembler** accepts but the hardware does not implement. The assembler translates it into one or more real machine instructions, often using the register \`$at\` (assembler temporary, register 1) reserved for this. It makes assembly programs easier to write and read without adding hardware.

**Examples:**

| Pseudoinstruction | Real instructions |
|---|---|
| \`move $t0, $t1\` | \`add $t0, $zero, $t1\` |
| \`blt $t0, $t1, L\` | \`slt $at, $t0, $t1\` then \`bne $at, $zero, L\` |
| \`li $t0, 131075\` | \`lui $t0, 2\` then \`ori $t0, $t0, 3\` |

**Hand-written assembly for a critical section: not always a good idea.**
- Modern compilers produce code as good as, or better than, most hand-written assembly: they schedule instructions around pipeline hazards, allocate registers globally, and unroll loops, which are tedious and error-prone by hand.
- Assembly takes longer to write and debug, is harder to maintain, and is not portable to another ISA.
- The Chapter 2 slides list "use assembly code for high performance" as a fallacy: modern compilers deal with modern processors better, and more lines of code mean more errors and less productivity.

It can still pay off in a small, well-measured hot spot where a programmer knows something the compiler cannot (e.g. special instructions), but the default should be to rely on the compiler and measure first.`,

  "3c": md`**Why three operands.** Every MIPS arithmetic instruction (\`add\`, \`sub\`, and the 3-operand \`mul\`) has exactly two sources and one destination: \`add a, b, c\` means a = b + c. This follows **design principle 1: simplicity favours regularity.**
- One fixed form means one instruction format (R-format with rs, rt, rd) for all of them.
- Regular instructions make the hardware simpler: the decoder and the datapath always read two registers and write one.
- Simpler hardware can be made faster and cheaper.

A longer expression is built from several 3-operand instructions; the cost of an occasional extra instruction is smaller than the gain from a regular, simple design.

**Why 32 registers.** **Design principle 2: smaller is faster.**
- A larger register file has longer wires and more decoding, so each access takes longer, slowing the clock.
- Register numbers must fit in the instruction: 32 registers need 5-bit fields, and an R-format instruction already uses 3 × 5 = 15 bits for them. 64 registers would need 6-bit fields that no longer fit the 32-bit format as it is.
- 32 registers are enough to hold the most used variables of most programs; the rest live in memory.`,

  "4a": md`**i. Format.**
- The normalised exponents run from $-62$ to $+63$. Exponent fields 0…0 and 1…1 are reserved, so the field must hold at least $63 - (-62) + 1 = 126$ values plus 2 reserved: $128 = 2^{7}$. The exponent has **7 bits**.
- With bias $2^{7-1} - 1 = 63$: field $1 \to -62$ and field $126 \to +63$, matching the given range.
- Sign: **1 bit**. Fraction: $16 - 1 - 7 =$ **8 bits**.

| Sign | Exponent | Fraction |
|---|---|---|
| 1 bit (bit 15) | 7 bits (bits 14–8), bias 63 | 8 bits (bits 7–0) |

**ii. $-110.11_{two}\times2^{1}$.**
1. Normalise: $110.11_{two} = 1.1011_{two}\times2^{2}$, so the number is $-1.1011_{two}\times2^{3}$ (decimal $-13.5$).
2. Sign = 1.
3. Exponent field $= 3 + 63 = 66 = ${q4.exponent}_{two}$.
4. Fraction = the bits after the binary point, padded to 8: $${q4.fraction}$.

| Sign | Exponent | Fraction |
|---|---|---|
| ${q4.sign} | ${q4.exponent} | ${q4.fraction} |

$$
${q4.bits.slice(0, 4)}\ ${q4.bits.slice(4, 8)}\ ${q4.bits.slice(8, 12)}\ ${q4.bits.slice(12)} = \texttt{0x${parseInt(q4.bits, 2).toString(16).toUpperCase()}}
$$

The value fits exactly (no rounding).

Part iii, on denormalised numbers, is not covered in the lecture slides.`,

  "4b": md`**Why the first multiplier is inefficient.**
- **Wasted width:** the multiplicand register, the ALU and the product register are all 64 bits, but the multiplicand is only 32 bits. At each step only 32 bits of the 64-bit addition can change; half the adder is doing nothing useful.
- **Wasted register space:** the 64-bit multiplicand register is half zeros at every step, and the multiplier needs a separate 32-bit register.
- **Slow:** each of the 32 iterations takes about three steps (test and add, shift the multiplicand left, shift the multiplier right), so close to 100 clock cycles per multiplication.

**Changes for the refined (efficient) version.**
1. **Shift the product right instead of the multiplicand left.** The multiplicand stays fixed, so its register shrinks to **32 bits**.
2. Since only the left half of the product is added to, the **ALU shrinks to 32 bits**; its result goes into the left half of the product register.
3. **Put the multiplier in the right half of the product register.** As the product shifts right, the multiplier's used bits shift out, so the separate multiplier register disappears. The control tests the product's rightmost bit (Product0).
4. The add and the shift happen in the **same clock cycle**, so the multiplication takes about 32 cycles.

\`\`\`fig
arith-mult-v2
\`\`\``,

  "5a": md`**Step 1: dependences.**

| Producer | Consumer | Register | Hazard |
|---|---|---|---|
| \`lw $t1\` (1) | \`add $t3\` (3) | \`$t1\` | distance 2: no stall (the value reaches the register file in time) |
| \`lw $t2\` (2) | \`add $t3\` (3) | \`$t2\` | **load-use**: 1 stall, then MEM/WB → EX |
| \`add $t3\` (3) | \`sw $t3\` (4) | \`$t3\` | EX/MEM → EX (store data) |
| \`add $t3\` (3) | \`add $t4\` (6) | \`$t3\` | far enough: read from the register file |
| \`lw $t4\` (5) | \`add $t4\` (6) | \`$t4\` | **load-use**: 1 stall, then MEM/WB → EX |
| \`add $t4\` (6) | \`sw $t4\` (7) | \`$t4\` | EX/MEM → EX (store data) |

**Step 2: pipeline with stalls and forwarding paths.**

\`\`\`fig
b17-5-before
\`\`\`

A load's data is ready only at the end of its MEM stage, one cycle too late for the next instruction's EX, so each load-use pair needs one bubble even with forwarding. All the other dependences are covered by forwarding.`,

  "5b": md`- **Stalls:** **2** (one before \`add $t3\`, one before \`add $t4\`), both load-use stalls.
- **Clock cycles:**
$$
\underbrace{5}_{\text{first instruction}} + \underbrace{(7 - 1)}_{\text{one more per instruction}} + \underbrace{2}_{\text{stalls}} = 13\ \text{cycles}
$$`,

  "5c": md`**Yes.** The stalls come from using a loaded value in the very next instruction. \`lw $t4, 8($t0)\` does not depend on anything before it, so it can be moved up to sit between \`lw $t2\` and \`add $t3\`. Then neither \`add\` uses the value loaded right before it.

\`\`\`
lw  $t1, 0($t0)
lw  $t2, 4($t0)
lw  $t4, 8($t0)     # moved up
add $t3, $t1, $t2
sw  $t3, 12($t0)
add $t4, $t3, $t4
sw  $t4, 8($t0)
\`\`\`

The move is safe: \`lw $t4\` reads \`$t0\` (unchanged) and writes \`$t4\`, which no instruction between its old and new place uses.

\`\`\`fig
b17-5-after
\`\`\`

- **Stalls: 0.**
- **Clock cycles:** $5 + 6 = 11$ (2 fewer than before).`,

  "6a": md`Eight one-word blocks in each cache. The set (or block) index is (block address) mod (number of sets).

**Direct mapped** (8 sets): 0 → 0, 12 → 4, 16 → 0, 18 → 2.

${accessTable(r6.dm, Q6A_CFG.dm)}

Misses: **${r6.dm.misses}**. Blocks 0 and 16 both map to index 0 and keep replacing each other.

**Two-way set associative** (4 sets): 0, 12, 16 → set 0; 18 → set 2.

${accessTable(r6.two, Q6A_CFG.two)}

Misses: **${r6.two.misses}**. Three blocks compete for the two places in set 0: 16 replaces the LRU block 0, and the final 0 replaces the LRU block 12.

**Four-way set associative** (2 sets): all four addresses are even, so they all map to set 0, which has room for four.

${accessTable(r6.four, Q6A_CFG.four)}

Misses: **${r6.four.misses}**, with **1 hit** (the final 0). No replacement is needed.

| Cache | Misses | Hits |
|---|---|---|
| Direct mapped | ${r6.dm.misses} | ${r6.dm.hits} |
| Two-way | ${r6.two.misses} | ${r6.two.hits} |
| Four-way | ${r6.four.misses} | ${r6.four.hits} |`,

  "6b": md`**Step 1: offset.** A block is 4 words = 16 bytes = $2^{4}$ bytes, so the offset is **4 bits**.

**Step 2: index.**
$$
\text{sets} = \frac{4096\ \text{blocks}}{8\ \text{ways}} = 512 = 2^{9}
$$
so the index is **9 bits**.

**Step 3: tag per block.**
$$
32 - 9 - 4 = ${t6.split.tag}\ \text{bits}
$$

**Step 4: total tag bits.**
$$
${t6.split.tag}\times4096 = ${t6.tagBits.toLocaleString("en-US")}\ \text{bits} \approx 76\ \text{Kibit}
$$

(For comparison, a direct-mapped cache of the same size needs $16\times4096 = 65{,}536$ tag bits: each doubling of associativity removes one index bit and adds one tag bit per block.)`,

  "7a": md`**Step 1: number of blocks.**
$$
\frac{64\ \text{KiB}}{32\ \text{B}} = \frac{2^{16}}{2^{5}} = 2^{11} = ${t7.blocks}\ \text{blocks}
$$

**Step 2: address fields.**
- Offset: 32 bytes $= 2^{5}$, so **5 bits** (3 for the word in the block, 2 for the byte).
- Index: 2048 blocks, direct mapped, so **11 bits**.
- Tag: $32 - 11 - 5 =$ **${t7.split.tag} bits**.

**Step 3: bits per block.**
$$
\underbrace{8\times32}_{\text{data}} + \underbrace{${t7.split.tag}}_{\text{tag}} + \underbrace{1}_{\text{valid}} = ${t7.perBlock}\ \text{bits}
$$

**Step 4: total.**
$$
2^{11}\times${t7.perBlock} = ${t7.total.toLocaleString("en-US")}\ \text{bits} = 546\ \text{Kibit} \approx 68.25\ \text{KiB}
$$
The cache needs about 1.07 times as many bits as the 64 KiB of data it stores.`,

  "7b": md`The TLB is a small cache of recently used page-table entries. Its tag holds the **virtual page number** (all of it in a fully associative TLB, or its upper part in a set-associative one).

- On every memory access, the virtual page number of the address is compared with the tags of the TLB entries.
- A match (with the valid bit set) is a **TLB hit**: that entry's physical page number is the translation, so no page-table access in memory is needed.
- No match is a **TLB miss**.

So the tag identifies **which virtual page** each TLB entry translates. It is needed because the TLB holds only a few of all the page-table entries, and any virtual page could be in any entry.`,

  "7c": md`On a TLB miss, the translation is not in the TLB, but the page may still be in memory. There are two cases:

**1. The page is in memory (only the translation is missing).**
- The page-table entry for the virtual page is read from the page table in memory (by hardware or by a software handler).
- Its valid bit is 1, so the physical page number is loaded into the TLB, replacing an entry (the replaced entry's dirty and reference bits are written back to its page-table entry).
- The access is retried and now hits in the TLB.
This is a quick, frequent case: a few cycles to tens of cycles.

**2. The page is not in memory (the page-table entry's valid bit is 0): page fault.**
- The operating system takes control.
- It finds the page on disk, chooses a physical page to replace (approximate LRU using reference bits; writing the old page back to disk if it is dirty).
- It reads the page from disk into memory (millions of cycles; another process may run meanwhile).
- It updates the page table and the TLB, then restarts the instruction that faulted.

\`\`\`fig
vm-tlb-flow
\`\`\``,

  "8a": md`The values come from the main control table on the slides. X is "don't care": the signal has no effect for that instruction, and 0 is a safe value to write.

| Instruction | ${Q8A_SIGNALS.join(" | ")} |
|---|${Q8A_SIGNALS.map(() => "---").join("|")}|
${q8Rows.join("\n")}

**Why:**
- **add (R-format):** the destination is rd, so RegDst = 1; both ALU operands are registers (ALUSrc = 0); the ALU result is written (MemtoReg = 0, RegWrite = 1); no memory access, no branch.
- **sw:** the address is register + offset (ALUSrc = 1); it writes memory (MemWrite = 1) and no register (RegWrite = 0), so RegDst and MemtoReg do not matter.
- **beq:** the ALU subtracts two registers (ALUSrc = 0) to test for zero; Branch = 1; nothing is written, so RegDst and MemtoReg do not matter.`,

  "8b": md`A 2-bit predictor has four states. The prediction changes only after **two mispredictions in a row**, so a loop branch is mispredicted only once per loop exit (not twice, as with a 1-bit predictor).

\`\`\`fig
bh-2bit
\`\`\`

- **Strongly taken (11)** and **weakly taken (10)** predict taken; **weakly not taken (01)** and **strongly not taken (00)** predict not taken.
- A taken branch moves the state one step towards strongly taken; a not-taken branch moves it one step towards strongly not taken (saturating at the ends).
- From a strong state, one misprediction only moves to the weak state of the same prediction.`,

  "8c": md`The instructions are \`sub $2, $1, $3\`, \`and $12, $2, $5\`, \`or $13, $6, $2\`.

\`\`\`fig
b17-8c
\`\`\`

**Green path (sub → and): EX hazard.** When \`and\` is in EX, \`sub\` is in MEM; its result is in the EX/MEM pipeline register. \`$2\` is the **first** source (rs) of \`and\`:

\`\`\`
if (EX/MEM.RegWrite
    and (EX/MEM.RegisterRd ≠ 0)
    and (EX/MEM.RegisterRd = ID/EX.RegisterRs))
  ForwardA = 10
\`\`\`

**Yellow path (sub → or): MEM hazard.** When \`or\` is in EX, \`sub\` is in WB; its result is in the MEM/WB register. \`$2\` is the **second** source (rt) of \`or\`:

\`\`\`
if (MEM/WB.RegWrite
    and (MEM/WB.RegisterRd ≠ 0)
    and not (EX/MEM.RegWrite and (EX/MEM.RegisterRd ≠ 0)
             and (EX/MEM.RegisterRd = ID/EX.RegisterRt))
    and (MEM/WB.RegisterRd = ID/EX.RegisterRt))
  ForwardB = 01
\`\`\`

**Why each part is there:**
- **RegWrite:** only an instruction that writes a register can be a source of forwarding.
- **Rd ≠ 0:** \`$zero\` is never written, so a result "for" register 0 must not be forwarded.
- **The "not EX/MEM" clause:** if the instruction just before also writes the same register (a double data hazard), its newer value in EX/MEM must win. Here \`and\` writes \`$12\`, not \`$2\`, so the MEM/WB value is used.`,
}
