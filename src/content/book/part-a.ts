import type { BookProblem } from "../types"
import { md } from "../md"
import { mulTable } from "../render"
import { assemble, parse } from "@/lib/mips"
import { encode, decode, fpAddSteps, SINGLE } from "@/lib/ieee"
import { multiplyFirst, multiplyRefined } from "@/lib/multiply"

const fx = (x: number, k = 4) => String(Number(x.toFixed(k)))
const hex = (bits: string) => parseInt(bits, 2).toString(16).toUpperCase().padStart(bits.length / 4, "0")
const fields = (src: string, base = 0) => assemble(parse(src), base).map((x) => x.enc)

/* Shared data, also used by the checks. */
export const BK = {
  perf1: { ghzA: 2.5, tA: 12, tB: 8, cyclesFactor: 1.4 },
  perf2: { cpi: [1, 2, 4], seq1: [3, 1, 2], seq2: [5, 1, 1] },
  isa1Src: "add $t0, $s1, $s2\nsub $t1, $s3, $s4\nsub $s0, $t0, $t1",
  isa2Src: "sub $t2, $s3, $t1\nsw $s1, 48($t0)",
  mips1Src: `        add  $v0, $zero, $zero    # count = 0
        add  $t0, $zero, $zero    # i = 0
Loop:   slt  $t1, $t0, $s2        # i < n ?
        beq  $t1, $zero, Done
        sll  $t2, $t0, 2          # $t2 = 4i
        add  $t2, $s1, $t2        # $t2 = address of A[i]
        lw   $t3, 0($t2)          # $t3 = A[i]
        slt  $t1, $s3, $t3        # k < A[i] ?
        beq  $t1, $zero, Next
        addi $v0, $v0, 1          # count++
Next:   addi $t0, $t0, 1          # i++
        j    Loop
Done:`,
  mips2Src: `max3:   add  $v0, $a0, $zero      # m = a
        slt  $t0, $v0, $a1        # m < b ?
        beq  $t0, $zero, L1
        add  $v0, $a1, $zero      # m = b
L1:     slt  $t0, $v0, $a2        # m < c ?
        beq  $t0, $zero, L2
        add  $v0, $a2, $zero      # m = c
L2:     jr   $ra`,
  mips3Src: `sumsq:  slti $t0, $a0, 1         # n < 1 ?
        beq  $t0, $zero, Rec
        add  $v0, $zero, $zero    # return 0
        jr   $ra
Rec:    addi $sp, $sp, -8
        sw   $ra, 4($sp)
        sw   $a0, 0($sp)
        addi $a0, $a0, -1
        jal  sumsq                # $v0 = sumsq(n - 1)
        lw   $a0, 0($sp)
        lw   $ra, 4($sp)
        addi $sp, $sp, 8
        mul  $t0, $a0, $a0        # n * n
        add  $v0, $v0, $t0
        jr   $ra`,
  syncSrc: `try:    ll   $t0, 0($a0)          # load linked the counter
        addi $t0, $t0, 1          # add 1
        sc   $t0, 0($a0)          # try to store it back
        beq  $t0, $zero, try      # failed: someone else wrote it, retry`,
  fp3: { a: 3.5, b: -1.25, fmt: { expBits: 5, fracBits: 10 } },
}

const p1 = BK.perf1
const p1cyclesA = p1.ghzA * 1e9 * p1.tA
const p1fB = (p1cyclesA * p1.cyclesFactor) / p1.tB
const cyc2 = (s: number[]) => s.reduce((t, n, i) => t + n * BK.perf2.cpi[i], 0)
const ic2 = (s: number[]) => s.reduce((a, b) => a + b, 0)
const isa2 = fields(BK.isa2Src)
const fp1 = encode(-12.375, SINGLE)
const fp2a = decode("0x3F600000", SINGLE)
const fp2b = decode("0xC1880000", SINGLE)
const fp3 = fpAddSteps(BK.fp3.a, BK.fp3.b, BK.fp3.fmt)
const mr = multiplyRefined("0101", "0011")
const mf = multiplyFirst("0011", "0110")

export const partA: BookProblem[] = [
  /* ───────── performance ───────── */
  {
    id: "bk-perf-clock",
    topic: "performance",
    ref: "Clock rate for a faster design",
    prompt: md`A program runs in ${p1.tA} s on computer A, which has a ${p1.ghzA} GHz clock. A designer wants computer B to run it in ${p1.tB} s. A faster clock is possible, but the new design will need ${p1.cyclesFactor} times as many clock cycles as A for this program. What clock rate must B have?`,
    solution: md`**Step 1: cycles on A.**
$$
\text{cycles}_A = \text{clock rate}\times\text{time} = ${p1.ghzA}\times10^{9}\times${p1.tA} = ${p1cyclesA / 1e9}\times10^{9}
$$

**Step 2: cycles on B.**
$$
\text{cycles}_B = ${p1.cyclesFactor}\times${p1cyclesA / 1e9}\times10^{9} = ${fx((p1cyclesA * p1.cyclesFactor) / 1e9)}\times10^{9}
$$

**Step 3: clock rate of B.**
$$
\text{clock rate}_B = \frac{\text{cycles}_B}{\text{time}_B} = \frac{${fx((p1cyclesA * p1.cyclesFactor) / 1e9)}\times10^{9}}{${p1.tB}\ \text{s}} = ${fx(p1fB / 1e9)}\ \text{GHz}
$$

B needs a ${fx(p1fB / 1e9)} GHz clock: ${fx(p1fB / (p1.ghzA * 1e9), 3)} times A's, more than the 1.5× time reduction alone suggests, because each cycle does less work.`,
  },
  {
    id: "bk-perf-cpi",
    topic: "performance",
    ref: "Comparing two code sequences",
    prompt: md`A compiler writer can choose between two code sequences for the same task. The instruction classes have CPIs A = ${BK.perf2.cpi[0]}, B = ${BK.perf2.cpi[1]} and C = ${BK.perf2.cpi[2]}.

| Sequence | Class A | Class B | Class C |
|---|---|---|---|
| 1 | ${BK.perf2.seq1.join(" | ")} |
| 2 | ${BK.perf2.seq2.join(" | ")} |

Which sequence executes more instructions? Which is faster? What is the CPI of each?`,
    solution: md`**Instruction counts:** sequence 1 has $${BK.perf2.seq1.join(" + ")} = ${ic2(BK.perf2.seq1)}$; sequence 2 has $${BK.perf2.seq2.join(" + ")} = ${ic2(BK.perf2.seq2)}$. **Sequence 2 executes more instructions.**

**Clock cycles** (Σ count × CPI):
$$
\text{Sequence 1: } ${BK.perf2.seq1.map((n, i) => `${n}\\times${BK.perf2.cpi[i]}`).join(" + ")} = ${cyc2(BK.perf2.seq1)}
$$
$$
\text{Sequence 2: } ${BK.perf2.seq2.map((n, i) => `${n}\\times${BK.perf2.cpi[i]}`).join(" + ")} = ${cyc2(BK.perf2.seq2)}
$$
**Sequence 2 is faster** (fewer cycles at the same clock), although it executes more instructions.

**CPI** = cycles / instructions:
$$
\text{CPI}_1 = \frac{${cyc2(BK.perf2.seq1)}}{${ic2(BK.perf2.seq1)}} \approx ${fx(cyc2(BK.perf2.seq1) / ic2(BK.perf2.seq1), 2)},\qquad \text{CPI}_2 = \frac{${cyc2(BK.perf2.seq2)}}{${ic2(BK.perf2.seq2)}} \approx ${fx(cyc2(BK.perf2.seq2) / ic2(BK.perf2.seq2), 2)}
$$
Instruction count alone is a poor guide to performance: what matters is the total number of cycles.`,
  },
  {
    id: "bk-perf-amdahl",
    topic: "performance",
    ref: "Amdahl's law: memory operations",
    prompt: md`A program takes 120 s, of which 72 s are spent on memory operations. (a) What is the overall speed-up if memory operations are made 3 times faster? (b) Can any improvement of the memory operations alone make the program 3 times faster?`,
    solution: md`**(a)**
$$
T_{\text{new}} = \frac{72}{3} + (120 - 72) = 24 + 48 = 72\ \text{s},\qquad \text{speed-up} = \frac{120}{72} \approx 1.67
$$

**(b)** 3 times faster means 40 s. The other operations alone take 48 s > 40 s, so even infinitely fast memory operations give at most $120/48 = 2.5$. **No.** This is Amdahl's law: the unimproved part limits the overall gain.`,
  },

  /* ───────── isa-basics ───────── */
  {
    id: "bk-isa-compile",
    topic: "isa-basics",
    ref: "Compiling an expression",
    prompt: md`Compile \`f = (g + h) - (i - j);\` into MIPS, with f, g, h, i, j in \`$s0\`–\`$s4\`. Use as few instructions as possible.`,
    solution: md`\`\`\`
${BK.isa1Src.replace(/\n/g, "\n")}
\`\`\`

- \`add $t0, $s1, $s2\`: \`$t0\` = g + h.
- \`sub $t1, $s3, $s4\`: \`$t1\` = i − j.
- \`sub $s0, $t0, $t1\`: f = (g + h) − (i − j).

Three instructions: each MIPS arithmetic instruction does one operation on two registers, so three operations need three instructions, with temporaries for the intermediate results.`,
  },
  {
    id: "bk-isa-encode",
    topic: "isa-basics",
    ref: "Encoding R- and I-format instructions",
    prompt: md`Give the format, the field values (decimal) and the hexadecimal machine word of \`sub $t2, $s3, $t1\` and \`sw $s1, 48($t0)\`.`,
    solution: md`**\`sub $t2, $s3, $t1\`** is **R-format**: rd = \`$t2\` (10), rs = \`$s3\` (19), rt = \`$t1\` (9), funct 34.

| op | rs | rt | rd | shamt | funct |
|---|---|---|---|---|---|
| ${isa2[0].fields.map((f) => f[1]).join(" | ")} |

$$
\text{word} = \texttt{0x${(isa2[0].word >>> 0).toString(16).toUpperCase().padStart(8, "0")}}
$$

**\`sw $s1, 48($t0)\`** is **I-format**: op 43, rs = base \`$t0\` (8), rt = the stored register \`$s1\` (17), offset 48.

| op | rs | rt | offset |
|---|---|---|---|
| ${isa2[1].fields.map((f) => f[1]).join(" | ")} |

$$
\text{word} = \texttt{0x${(isa2[1].word >>> 0).toString(16).toUpperCase().padStart(8, "0")}}
$$

Note the order: in assembly the destination comes first, but in the R-format word rs and rt come before rd.`,
  },
  {
    id: "bk-isa-twos",
    topic: "isa-basics",
    ref: "Two's complement and sign extension",
    prompt: md`(a) Write −45 as a 16-bit two's-complement number, in binary and hexadecimal. (b) Sign-extend it to 32 bits. (c) Why must \`addi\` sign-extend its immediate, but \`ori\` zero-extend it?`,
    solution: md`**(a)** $45 = 0000\ 0000\ 0010\ 1101_{two}$. Invert and add 1:
$$
1111\ 1111\ 1101\ 0010 + 1 = 1111\ 1111\ 1101\ 0011_{two} = \texttt{0xFFD3}
$$
Check: $-2^{15} + (2^{15} - 45) = -45$.

**(b)** Copy the sign bit (1) into the upper 16 bits:
$$
1111\ 1111\ 1111\ 1111\ 1111\ 1111\ 1101\ 0011_{two} = \texttt{0xFFFFFFD3}
$$
The value is still −45.

**(c)** \`addi\` adds a **signed** constant: \`addi $t0, $t0, -45\` must subtract 45, so the 16-bit −45 must stay −45 in 32 bits. \`ori\` is a **logical** operation on a bit pattern, used (with \`lui\`) to fill the lower 16 bits of a constant; sign extension would set the upper 16 bits to 1s whenever bit 15 is 1, destroying the upper half.`,
  },

  /* ───────── mips-programming ───────── */
  {
    id: "bk-mips-count",
    topic: "mips-programming",
    ref: "Counting array elements in a loop",
    prompt: md`Write MIPS code that counts how many elements of the word array A are greater than k:

\`\`\`
count = 0;
for (i = 0; i < n; i++)
    if (A[i] > k) count++;
\`\`\`

The base of A is in \`$s1\`, n in \`$s2\`, k in \`$s3\`; leave count in \`$v0\`.`,
    solution: md`\`\`\`
${BK.mips1Src}
\`\`\`

**Notes:**
- \`A[i] > k\` is tested as \`k < A[i]\` with \`slt\`, since MIPS has set-on-less-than but no set-on-greater-than.
- The index i is multiplied by 4 (\`sll\` by 2) because A holds 4-byte words.
- **Trace:** A = {5, 12, 7, 20, 3}, k = 6: elements 12, 7, 20 are greater, so count = 3.`,
  },
  {
    id: "bk-mips-max3",
    topic: "mips-programming",
    ref: "A leaf procedure",
    prompt: md`Write a MIPS procedure \`max3\` that returns the largest of its three signed integer arguments. Follow the MIPS calling convention.`,
    solution: md`Arguments arrive in \`$a0\`, \`$a1\`, \`$a2\`; the result goes in \`$v0\`. It is a **leaf** procedure (it calls nothing) and uses only temporary registers, so it needs **no stack frame**.

\`\`\`
${BK.mips2Src}
\`\`\`

**Trace:** max3(4, −7, 9): m = 4; 4 < −7 is false; 4 < 9 is true, so m = 9. Returns 9.`,
  },
  {
    id: "bk-mips-sumsq",
    topic: "mips-programming",
    ref: "A recursive procedure",
    prompt: md`Translate this recursive C function into MIPS (n in \`$a0\`, result in \`$v0\`):

\`\`\`
int sumsq(int n) {
    if (n < 1) return 0;
    return sumsq(n - 1) + n * n;
}
\`\`\``,
    solution: md`It is a non-leaf procedure: it must save \`$ra\` (overwritten by its own \`jal\`) and n (needed after the call).

\`\`\`
${BK.mips3Src}
\`\`\`

**Trace:** sumsq(3) = sumsq(2) + 9 = (sumsq(1) + 4) + 9 = ((0 + 1) + 4) + 9 = 14.

Each active call uses an 8-byte stack frame, so sumsq(n) needs $8n$ bytes of stack at its deepest point.`,
  },

  /* ───────── addressing ───────── */
  {
    id: "bk-addr-backward",
    topic: "addressing",
    ref: "A backward branch offset",
    prompt: md`A \`bne\` instruction at address $\texttt{0x00400100}$ branches back to a loop that starts at $\texttt{0x004000C0}$. What is the value of its 16-bit offset field, in decimal and hexadecimal?`,
    solution: md`The offset counts **words** from PC + 4:
$$
\text{offset} = \frac{\texttt{0x004000C0} - (\texttt{0x00400100} + 4)}{4} = \frac{\texttt{0xC0} - \texttt{0x104}}{4} = \frac{192 - 260}{4} = -17
$$
In 16-bit two's complement: $-17 = \texttt{0xFFEF}$.

At run time: $(\text{PC} + 4) + \text{sign-extend}(\texttt{0xFFEF})\times4 = \texttt{0x00400104} - 68 = \texttt{0x004000C0}$.`,
  },
  {
    id: "bk-addr-jump",
    topic: "addressing",
    ref: "Jump targets and the 256 MB region",
    prompt: md`(a) A \`j\` instruction at address $\texttt{0x10004000}$ has the address field $\texttt{0x0100020}$. What is the target? (b) Can a \`j\` at address $\texttt{0x0FFFFFFC}$ jump to $\texttt{0x10000040}$? Explain.`,
    solution: md`**(a)** Target = top 4 bits of PC + 4, then the 26-bit field, then 00:
- PC + 4 $= \texttt{0x10004004}$, top 4 bits = 0001.
- Field × 4 = $\texttt{0x0100020}\times4 = \texttt{0x0400080}$.

$$
\text{target} = \texttt{0x10000000} + \texttt{0x0400080} = \texttt{0x10400080}
$$

**(b) Yes.** The top 4 bits come from **PC + 4**, not from PC: PC + 4 $= \texttt{0x10000000}$, whose top 4 bits are 0001, the same as the target's. The field is $(\texttt{0x10000040}\ \text{mod}\ 2^{28})/4 = \texttt{0x10}$. (A \`j\` at $\texttt{0x0FFFFFF8}$ could not: its PC + 4 is in the region starting at 0.)`,
  },
  {
    id: "bk-addr-const",
    topic: "addressing",
    ref: "Building a 32-bit constant",
    prompt: md`Load $\texttt{0xABCD1234}$ into \`$t5\`. Why would \`lui\` followed by \`addi\` (instead of \`ori\`) be wrong for some constants?`,
    solution: md`\`\`\`
lui $t5, 0xABCD          # $t5 = 0xABCD0000
ori $t5, $t5, 0x1234     # $t5 = 0xABCD1234
\`\`\`

\`ori\` **zero-extends** its immediate, so the upper half set by \`lui\` is unchanged. \`addi\` **sign-extends**: for a lower half with bit 15 = 1, e.g. $\texttt{0x8000}$, it would add $\texttt{0xFFFF8000}$, i.e. subtract $\texttt{0x8000}$, changing the upper half (\`lui 0xABCD\` then \`addi 0x8000\` gives $\texttt{0xABCC8000}$). For $\texttt{0x1234}$ (bit 15 = 0) both work, but \`ori\` is correct for every constant.`,
  },

  /* ───────── sync-linking ───────── */
  {
    id: "bk-sync-increment",
    topic: "sync-linking",
    ref: "Atomic increment with ll/sc",
    prompt: md`Several threads increment a shared counter whose address is in \`$a0\`. Write an atomic increment using \`ll\` and \`sc\`, and explain why \`lw\`, \`addi\`, \`sw\` is not enough.`,
    solution: md`\`\`\`
${BK.syncSrc}
\`\`\`

**Why it works:** \`sc\` stores only if no other write to the counter happened since the \`ll\`; then \`$t0\` = 1. If another thread wrote in between, \`sc\` stores nothing and sets \`$t0\` = 0, and the loop retries with the new value.

**Why \`lw\`/\`addi\`/\`sw\` fails:** two threads can both load the same value (say 5) before either stores; both store 6, and one increment is lost (a **data race**). \`ll\`/\`sc\` makes the read-modify-write atomic.`,
  },
  {
    id: "bk-sync-link",
    topic: "sync-linking",
    ref: "What the linker does",
    prompt: md`Object file A has 0x100 bytes of text and 0x20 bytes of data; object file B has 0x200 bytes of text and 0x30 bytes of data. The linker places text from $\texttt{0x00400000}$ and data from $\texttt{0x10000000}$, A before B. (a) Where do B's text and data start? (b) A contains \`jal B_proc\`, where \`B_proc\` is at offset 0x40 in B's text. What address field does the linker write into the \`jal\`?`,
    solution: md`**(a)** The linker concatenates the segments of the object files:
- B's text starts after A's: $\texttt{0x00400000} + \texttt{0x100} = \texttt{0x00400100}$.
- B's data starts after A's: $\texttt{0x10000000} + \texttt{0x20} = \texttt{0x10000020}$.

**(b)** \`B_proc\` $= \texttt{0x00400100} + \texttt{0x40} = \texttt{0x00400140}$. The \`jal\` field holds the word address (bits 27–2):
$$
\texttt{0x00400140}/4 = \texttt{0x100050}
$$

**The linker's three steps:** place code and data modules in memory; determine the addresses of data and instruction labels (resolving references between files using the symbol tables); patch the internal and external references (using the relocation information) to produce the executable.`,
  },
  {
    id: "bk-sync-pseudo",
    topic: "sync-linking",
    ref: "Expanding pseudoinstructions",
    prompt: md`Give the real MIPS instructions the assembler produces for: (a) \`move $t1, $t2\`; (b) \`bgt $s0, $s1, L\`; (c) \`ble $s0, $s1, L\`; (d) \`li $t0, 70000\`.`,
    solution: md`**(a)** \`add $t1, $zero, $t2\` (or \`addu\`).

**(b)** branch if $s_0 > s_1$, i.e. if $s_1 < s_0$:
\`\`\`
slt $at, $s1, $s0
bne $at, $zero, L
\`\`\`

**(c)** branch if $s_0 \le s_1$, i.e. if not ($s_1 < s_0$):
\`\`\`
slt $at, $s1, $s0
beq $at, $zero, L
\`\`\`

**(d)** 70000 does not fit in 16 bits: $70000 = \texttt{0x00011170}$, so
\`\`\`
lui $t0, 1          # upper half 0x0001
ori $t0, $t0, 4464  # lower half 0x1170
\`\`\`

The assembler uses \`$at\` (register 1, reserved for it) for the temporary.`,
  },

  /* ───────── int-arithmetic ───────── */
  {
    id: "bk-int-overflow",
    topic: "int-arithmetic",
    ref: "Detecting overflow",
    prompt: md`Using 8-bit two's complement, compute each of the following and say whether it overflows: (a) 100 + 50; (b) −100 − 50; (c) 100 − (−50); (d) −100 + 50.`,
    solution: md`8-bit two's complement holds −128 … 127.

| Operation | True result | 8-bit result | Overflow? | Why |
|---|---|---|---|---|
| 100 + 50 | 150 | −106 | **yes** | two positives give a negative |
| −100 − 50 | −150 | 106 | **yes** | −100 + (−50): two negatives give a positive |
| 100 − (−50) | 150 | −106 | **yes** | 100 + 50: positive minus negative gives a negative |
| −100 + 50 | −50 | −50 | no | operands of different signs never overflow |

**Rules:** addition overflows only when both operands have the same sign and the result's sign differs; subtraction A − B overflows only when A and B have different signs and the result's sign differs from A's. (MIPS \`add\`/\`sub\` raise an exception on overflow; \`addu\`/\`subu\` ignore it.)`,
  },
  {
    id: "bk-int-refined",
    topic: "int-arithmetic",
    ref: "Tracing the refined multiplier",
    prompt: md`Using 4-bit unsigned numbers, trace the refined multiplication hardware for 0101 × 0011, showing the Product register after every step.`,
    solution: md`The multiplicand (0101) stays fixed; the multiplier (0011) starts in the right half of the 8-bit Product register.

${mulTable(mr.rows, { gapProduct: true })}

**Result:** $${mr.product.slice(0, 4)}\ ${mr.product.slice(4)}_{two} = ${parseInt(mr.product, 2)} = 5\times3$.`,
  },
  {
    id: "bk-int-first",
    topic: "int-arithmetic",
    ref: "Tracing the first multiplier",
    prompt: md`Using 4-bit unsigned numbers, trace the first (sequential) multiplication hardware for 0011 × 0110, showing the Multiplier, Multiplicand and Product registers after every step.`,
    solution: md`The 8-bit Multiplicand register starts with 0011 in its right half and shifts left; the Multiplier shifts right; the Product starts at 0.

${mulTable(mf.rows)}

**Result:** $${mf.product.slice(0, 4)}\ ${mf.product.slice(4)}_{two} = ${parseInt(mf.product, 2)} = 3\times6$. Each iteration takes up to three steps (add, shift left, shift right), which the refined hardware combines.`,
  },

  /* ───────── floating-point ───────── */
  {
    id: "bk-fp-encode",
    topic: "floating-point",
    ref: "Encoding −12.375",
    prompt: md`Show the IEEE 754 single-precision representation of $-12.375$, in binary and hexadecimal.`,
    solution: md`**Step 1: binary.** $12 = 1100_{two}$ and $0.375 = 0.011_{two}$, so $12.375 = 1100.011_{two}$.

**Step 2: normalise.** $1100.011_{two} = 1.100011_{two}\times2^{3}$.

**Step 3: fields.**
- Sign = 1.
- Exponent = $3 + 127 = 130 = ${fp1.exponent}_{two}$.
- Fraction = $100011$ followed by zeros (23 bits).

| Sign | Exponent | Fraction |
|---|---|---|
| ${fp1.sign} | ${fp1.exponent} | ${fp1.fraction} |

$$
${fp1.bits.match(/.{4}/g)!.join("\\ ")} = \texttt{0x${hex(fp1.bits)}}
$$`,
  },
  {
    id: "bk-fp-decode",
    topic: "floating-point",
    ref: "Decoding single-precision words",
    prompt: md`What decimal values do the single-precision words $\texttt{0x3F600000}$ and $\texttt{0xC1880000}$ represent?`,
    solution: md`**$\texttt{0x3F600000}$** $= 0\ 01111110\ 11000000000000000000000$:
- sign 0; exponent $126 - 127 = -1$; significand $1.11_{two} = 1.75$.
$$
+1.75\times2^{-1} = ${fp2a.value}
$$

**$\texttt{0xC1880000}$** $= 1\ 10000011\ 00010000000000000000000$:
- sign 1; exponent $131 - 127 = 4$; significand $1.0001_{two} = 1.0625$.
$$
-1.0625\times2^{4} = ${fp2b.value}
$$`,
  },
  {
    id: "bk-fp-add16",
    topic: "floating-point",
    ref: "Floating-point addition in half precision",
    prompt: md`In a 16-bit format with 1 sign bit, 5 exponent bits (bias 15) and 10 fraction bits, add $3.5$ and $-1.25$ step by step, and give the result's bit pattern.`,
    solution: md`**Operands:** $3.5 = 1.11_{two}\times2^{1}$; $-1.25 = -1.01_{two}\times2^{0}$.

| Step | Detail | Significand | Exponent |
|---|---|---|---|
${fp3.steps.map((s) => `| ${s.step} | ${s.detail.replace(/-/g, "−")} | ${s.significand} | ${s.e} |`).join("\n")}

**Result:** $1.001_{two}\times2^{1} = ${fp3.result}$ (which is $3.5 - 1.25$).

| Sign | Exponent ($1 + 15 = 16$) | Fraction |
|---|---|---|
| ${fp3.encoded.sign} | ${fp3.encoded.exponent} | ${fp3.encoded.fraction} |

$$
\texttt{0x${hex(fp3.encoded.bits)}}
$$`,
  },

  /* ───────── alu-design ───────── */
  {
    id: "bk-alu-arith",
    topic: "alu-design",
    ref: "An arithmetic unit from full adders",
    prompt: md`Design the input logic of a 4-bit arithmetic unit built from full adders ($F = X + Y + C_{in}$) with two selection lines:

| $S_1S_0$ | Function |
|---|---|
| 00 | $A + B$ |
| 01 | $A - B$ |
| 10 | $A + 1$ |
| 11 | $A - 1$ |`,
    solution: md`**Choose** $X_i = A_i$ for every function, and pick $Y$ and $C_{in}$:

| $S_1S_0$ | Function | $Y$ | $C_{in}$ | Why |
|---|---|---|---|---|
| 00 | $A + B$ | $B$ | 0 | |
| 01 | $A - B$ | $B'$ | 1 | $A + B' + 1$ |
| 10 | $A + 1$ | 0 | 1 | |
| 11 | $A - 1$ | all 1s | 0 | all 1s $= -1$ |

**Equations:**
$$
Y_i = S_1'S_0'B_i + S_1'S_0B_i' + S_1S_0 = S_1'(S_0\oplus B_i) + S_1S_0
$$
$$
C_{in} = S_1\oplus S_0
$$
These were checked on all $16\times16$ input pairs for each function. Per stage: one XOR ($S_0\oplus B_i$), one AND with $S_1'$, one OR with the shared term $S_1S_0$, and the full adder.`,
  },
  {
    id: "bk-alu-status",
    topic: "alu-design",
    ref: "Status bits",
    prompt: md`A 4-bit ALU adds $A = 0111$ and $B = 0011$. Give the result and the status bits C (carry), S (sign), Z (zero) and V (overflow). Interpret the result as unsigned and as signed numbers.`,
    solution: md`$$
0111 + 0011 = 1010,\quad\text{carry out } C_4 = 0
$$
- **C = 0:** no carry out of bit 3.
- **S = 1:** the sign bit (bit 3) of the result.
- **Z = 0:** the result is not 0000.
- **V = 1:** $V = C_4\oplus C_3$; the carry into bit 3 is $C_3 = 1$, so $V = 0\oplus1 = 1$.

**Unsigned:** $7 + 3 = 10 = 1010_{two}$: correct (C = 0, no unsigned overflow).
**Signed:** $7 + 3 = 10$ does not fit in 4-bit two's complement (−8 … 7); $1010$ reads as −6: **overflow** (V = 1). Two positives gave a negative.`,
  },
  {
    id: "bk-alu-logic",
    topic: "alu-design",
    ref: "Logic operations with full adders",
    prompt: md`A 4-bit ALU stage computes $F_i = X_i\oplus Y_i\oplus Z_i$, and for logic operations the carries are cut ($Z_i = 0$). Choose $X_i$ and $Y_i$ so that it produces:

| $S_1S_0$ | Function |
|---|---|
| 00 | $A$ OR $B$ |
| 01 | $A$ XOR $B$ |
| 10 | $A$ AND $B$ |
| 11 | NOT $A$ |`,
    solution: md`With $Z_i = 0$, $F_i = X_i\oplus Y_i$.

| $S_1S_0$ | Function | $X_i$ | $Y_i$ | Check |
|---|---|---|---|---|
| 00 | OR | $A_i + B_i$ | 0 | |
| 01 | XOR | $A_i$ | $B_i$ | |
| 10 | AND | $A_i + B_i'$ | $B_i'$ | $B_i = 1$: $A_i\oplus0$; $B_i = 0$: $1\oplus1 = 0$ |
| 11 | NOT | $A_i$ | 1 | $A_i\oplus1 = A_i'$ |

**Equations:**
$$
Y_i = S_0B_i + S_1B_i'
$$
(00 → 0, 01 → $B_i$, 10 → $B_i'$, 11 → $B_i + B_i' = 1$)
$$
X_i = A_i + S_1'S_0'B_i + S_1S_0'B_i'
$$
These were checked on all input pairs. This is the logic part of the ALU in the slides (Mano §9.6): the same $Y_i$ also serves the arithmetic operations, and only $X_i$ needs extra gates.`,
  },
]
