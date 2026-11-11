import { md } from "../md"
import { b21Solutions } from "./b21-solutions"
import { totalBits } from "@/lib/cache"
import { decode, encode, fpAddSteps, SINGLE } from "@/lib/ieee"
import { assemble, parse } from "@/lib/mips"

/* ───── Q3(b) ───── */
export const Q3B = { vaBits: 40, paBits: 36, pageBytes: 16 * 1024, statusBits: 4, tlbEntries: 256, tlbWays: 2 }
const off = Math.log2(Q3B.pageBytes)
const vpn = Q3B.vaBits - off
const ppn = Q3B.paBits - off
const pte = ppn + Q3B.statusBits
const ptBits = 2 ** vpn * pte

/* ───── Q4(a) ───── */
export const Q4A = [
  { name: "1", ps: 420, words: 1, i: 0.04, d: 0.06 },
  { name: "2", ps: 420, words: 4, i: 0.02, d: 0.04 },
  { name: "3", ps: 310, words: 4, i: 0.02, d: 0.03 },
]
const r = (x: number, k = 4) => Number(x.toFixed(k))
export const q4a = (() => {
  const stall = Q4A.map((p) => r((p.i + 0.5 * p.d) * (6 + p.words)))
  const base = r(2.0 - stall[0])
  return Q4A.map((p, k) => ({ ...p, penalty: 6 + p.words, stall: stall[k], cpi: r(base + stall[k]), time: r((base + stall[k]) * p.ps, 2), base }))
})()

/* ───── Q4(b) ───── */
const c4 = (ways: number) => totalBits({ addressBits: 32, dataBytes: 256 * 1024, blockBytes: 256, ways })
export const Q4B = { dm: c4(1), two: c4(2), fa: c4(1024) }
const over = (t: ReturnType<typeof c4>) => t.blocks * (t.split.tag + 1)

/* ───── Q5 ───── */
export const HALF = { expBits: 4, fracBits: 11 }
const m125 = encode(-1.25, HALF)
const p375 = encode(0.375, HALF)
const hex = (bits: string) => parseInt(bits, 2).toString(16).toUpperCase().padStart(bits.length / 4, "0")
const q5c = decode("0xDF807500", SINGLE)

/* ───── Q7(a) ───── */
export const Q7A_SRC = "Loop: sll $t1, $s2, 2\nadd $t1, $t1, $s6\nlw $t0, 0($t1)\nbeq $t0, $s5, Lp1\nj Exit\nLp1: addi $s2, $s2, 1\nj Loop\nExit: nop"
const q7 = assemble(parse(Q7A_SRC), 60000).slice(0, 7)
const R = q7.filter((x) => x.enc.format === "R")
const I = q7.filter((x) => x.enc.format === "I")
const J = q7.filter((x) => x.enc.format === "J")
const row = (x: (typeof q7)[number]) => `| ${x.pc} | \`${x.ins.text}\` | ${x.enc.fields.map((f) => f[1]).join(" | ")} |`

/* ───── Q7(b) ───── */
export const Q7B = { FP: [160, 2], INT: [110, 1], LS: [10, 5], BR: [16, 2] } as Record<string, [number, number]>
const cycles = (cpi: Record<string, number> = {}) => Object.entries(Q7B).reduce((t, [k, [ic, c]]) => t + ic * (cpi[k] ?? c), 0)
const c0 = cycles()
const fpNeed = (c0 / 2 - (c0 - 160 * 2)) / 160
const lsLeft = c0 - 10 * 5
const c4b = r(cycles({ FP: 1.6, INT: 1.15, LS: 4, BR: 2.3 }), 3)

/* ───── Q8(b) ───── */
const fa = fpAddSteps(0.5, -0.4375, { expBits: 8, fracBits: 3 })

export const b16Solutions: Record<string, string> = {
  "1a": md`Starting from the basic single-cycle datapath (R-format, lw, sw, beq), each new instruction needs the changes below.

\`\`\`fig
dp-full
\`\`\`

**1. slt (R-format): no datapath change.** The ALU already has the set-on-less-than operation (ALU control 0111, chosen from funct = 42 when ALUOp = 10). The control is the same as for \`add\`: RegDst = 1, ALUSrc = 0, MemtoReg = 0, RegWrite = 1, ALUOp = 10.

**2. bne: one new control signal, Bne.** The ALU subtracts (ALUOp = 01) as for beq, but the branch is taken when Zero = 0. Add an inverter, an AND gate and an OR gate in front of the PCSrc mux:
$$
\text{PCSrc} = \text{Branch}\cdot\text{Zero} + \text{Bne}\cdot\overline{\text{Zero}}
$$

**3. j: the jump path and a Jump mux.** The target is $\{\text{PC}+4[31{:}28],\ \text{instr}[25{:}0],\ 00\}$:
- a shift-left-2 unit on instruction bits 25–0 (26 → 28 bits);
- concatenation with the top 4 bits of PC + 4;
- a new mux after the branch mux, controlled by **Jump**, choosing this address as the next PC.

**4. jr (R-format, funct = 8): PC ← register rs.**
- Add a third input to the next-PC selection: **Read data 1** of the register file, chosen by a new signal **JumpReg**.
- Since jr has op = 0 like all R-format instructions, JumpReg is decoded from funct (in the ALU control).
- jr must not write a register, so the register write enable becomes RegWrite · JumpReg′.

**5. jal: \`$ra\` ← PC + 4, PC ← jump target.**
- Uses the jump path of j (Jump = 1).
- **RegDst mux** gets a third input, the constant **31**, so the write register can be \`$ra\`.
- **MemtoReg mux** gets a third input, **PC + 4**, so it can be written.
- RegWrite = 1.

**6. lui: rt ← immediate × 2¹⁶.**
- Add a **shift-left-16** unit on instruction bits 15–0 (the immediate followed by 16 zeros).
- Give the MemtoReg mux a fourth input from it (or, alternatively, add a "shift B left 16" operation to the ALU with ALUSrc = 1).
- RegDst = 0 (rt), RegWrite = 1.

**Control for the new instructions** (RegDst and MemtoReg are now 2-bit mux selects: RegDst 0 = rt, 1 = rd, 2 = 31; MemtoReg 0 = ALU, 1 = memory, 2 = PC + 4, 3 = immediate « 16):

| Instr. | RegDst | ALUSrc | MemtoReg | RegWrite | MemRead | MemWrite | Branch | Bne | Jump | JumpReg | ALUOp |
|---|---|---|---|---|---|---|---|---|---|---|---|
| slt | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 10 |
| bne | X | 0 | X | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 01 |
| j | X | X | X | 0 | 0 | 0 | 0 | 0 | 1 | 0 | XX |
| jr | X | X | X | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 10 |
| jal | 2 | X | 2 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | XX |
| lui | 0 | X | 3 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | XX |

(For jr, the main control sees an R-format instruction and sets RegWrite = 1; the JumpReg gating above cancels it.)`,

  "1b": md`- **The clock period is set by the slowest instruction.** Every instruction takes one cycle, so the cycle must be long enough for the longest path: \`lw\` (instruction memory → register file → ALU → data memory → register file). Faster instructions (R-format, branches, jumps) waste the rest of the cycle.
- **It violates "make the common case fast":** the common, short instructions are slowed to the speed of the rare, long ones. With variable-time operations (e.g. floating point) the cycle would be even longer.
- **Hardware is duplicated:** each unit can be used only once per instruction, so separate instruction and data memories and extra adders (PC + 4, branch target) are needed instead of reusing one ALU and one memory.
- **No overlap:** each instruction finishes before the next starts. Pipelining keeps the simple datapath but overlaps instructions, which improves throughput.`,

  "2a": b21Solutions["5"],

  "2b": md`**The issues.** With the branch decided as early as possible, the comparison of \`$1\` and \`$2\` is done in **ID** (a comparator after the register file). This creates two data hazards:

1. **lw → add (load-use):** \`add\` needs \`$1\` in EX, but \`lw\` delivers it only at the end of its MEM stage. **One stall**, then MEM/WB → EX forwarding.
2. **add → beq:** \`beq\` needs \`$1\` in **ID** (for the early comparison), but \`add\` produces it only at the end of its EX stage. **One more stall**, then forwarding from EX/MEM into the ID comparator. (Had \`beq\` followed the \`lw\` directly, it would need two stalls.)

**Handling:** the hazard detection unit holds \`add\` in ID for one cycle (bubble into EX), then holds \`beq\` in ID for one cycle; extra forwarding paths carry the values to the EX inputs and to the branch comparator in ID. If the branch is taken, the one instruction fetched after \`beq\` is flushed (IF.Flush), costing one more cycle on the path to TARGET.

\`\`\`fig
b16-2b
\`\`\`

**Cycles to complete the snippet** (until \`beq\` leaves WB):
$$
\underbrace{5}_{\text{first instruction}} + \underbrace{2}_{\text{two more instructions}} + \underbrace{2}_{\text{stalls}} = 9\ \text{cycles}
$$`,

  "2c": md`**What a TLB miss means.** The virtual page number of the access is not in the TLB. There are two cases: the page is in memory but its translation is not cached in the TLB, or the page is not in memory at all (a page fault).

**How MIPS handles a TLB miss.**
1. The miss must be recognised **before any state is changed**, i.e. before the destination register is overwritten, so that the instruction can be restarted.
2. MIPS handles TLB misses **in software**: the miss raises a special exception, and a short, optimised handler runs.
3. The handler reads the page-table entry for the missing virtual page from the page table in memory.
   - If the entry is **valid**, it copies the entry into the TLB (replacing an entry, chosen e.g. at random) and returns; the faulting instruction is **restarted** and now hits in the TLB. This takes only about a dozen cycles.
   - If the entry is **not valid**, the page is on disk: this is a **page fault**. The operating system fetches the page from disk (choosing a page to replace, writing it back if dirty), updates the page table and the TLB, and then restarts the instruction. This takes millions of cycles, so the OS usually runs another process meanwhile.
4. A TLB miss can happen on an **instruction fetch** (in IF) or on a **data access** of a load or store (in MEM).

\`\`\`fig
vm-tlb-flow
\`\`\`

The second half of the question, adding a TLB-miss exception to the pipelined datapath of Figure 2.c, uses the pipeline exception hardware, which is not covered in the lecture slides.`,

  "3a": md`The request starts with a virtual address. The TLB translates it; the physical address then accesses a physically addressed cache.

\`\`\`fig
vm-tlb-flow
\`\`\`

**Step by step:**
1. **TLB access** with the virtual page number.
2. **TLB miss:** raise a TLB-miss exception. The handler loads the page-table entry into the TLB (or, if the page is not in memory, a page fault is handled by the OS), and the access is retried.
3. **TLB hit:** form the physical address = physical page number + page offset.
4. **Write?**
   - **Read:** access the cache. On a cache hit, deliver the data to the CPU. On a cache miss, stall while the block is read from memory, then deliver.
   - **Write:** first check the TLB entry's **write-access bit**. If writes are not allowed, raise a write-protection exception. Otherwise, write the data into the cache, update the dirty bit, and put the data and the address into the write buffer (write-through), or mark the block dirty (write-back). On a cache miss, the block is first read into the cache.`,

  "3b": md`**Address fields.**
- Page offset: 16 KB $= 2^{14}$ bytes, so **14 bits**.
- Virtual page number: $40 - 14 = ${vpn}$ bits, so $2^{${vpn}}$ virtual pages.
- Physical page number: $36 - 14 = ${ppn}$ bits.

**a. Size of the page table.** All $2^{${vpn}}$ virtual pages are in use, so the table has one entry for each. Each entry holds the physical page number plus the valid, protection, dirty and use bits (disk addresses are not stored):
$$
\text{entry} = ${ppn} + 4 = ${pte}\ \text{bits}
$$
$$
\text{page table} = 2^{${vpn}}\times${pte} = ${ptBits.toLocaleString("en-US")}\ \text{bits} = ${ptBits / 8 / 2 ** 20}\ \text{MiB}
$$
(If each entry is rounded up to a 32-bit word for convenient access, the table is $2^{${vpn}}\times4$ B $= 256$ MiB.)

**b. Inverted page table:** not covered in the lecture slides.

**c. Virtual-to-physical mapping.**

**TLB:** 256 entries, 2-way set associative, so $256/2 = 128 = 2^{7}$ sets. The virtual page number is split into a **7-bit TLB index** and a **$${vpn} - 7 = 19$-bit TLB tag**.

\`\`\`fig
b16-3b-va
\`\`\`

1. The 7-bit index selects one of the 128 TLB sets.
2. The 19-bit tag is compared with the tags of both entries of the set (two comparators) and their valid bits checked.
3. On a hit, the matching entry supplies the **22-bit physical page number**; the 14-bit page offset is copied unchanged. Physical address = PPN (22 bits) followed by the offset (14 bits) = 36 bits.

**Cache:** 16 KB direct mapped with 16-word (64-byte) blocks: $16\text{ KB}/64\text{ B} = 256$ blocks, so an **8-bit index** and a **6-bit offset** (4 bits word, 2 bits byte). The cache tag is $36 - 8 - 6 = 22$ bits.

\`\`\`fig
b16-3b-pa
\`\`\`

4. The 8-bit index selects a cache block; its 22-bit tag is compared with the physical address's tag, and the valid bit checked.
5. On a hit, the 4-bit word field selects the word in the 64-byte block. On a miss, the block is fetched from memory.

Note the cache index and offset (14 bits) lie entirely inside the page offset (14 bits), so the cache index could be read while the TLB translates; only the tag compare needs the physical page number.`,

  "3c": md`**Performance: poor.** The TLB maps only
$$
16\ \text{entries}\times4\ \text{KB} = 64\ \text{KB}
$$
(its "reach"), but the programs touch at least 2 MB $= 512$ pages at a time. Most accesses fall outside the 16 pages in the TLB, so the TLB **misses very often** (it thrashes). Each miss needs a page-table access in memory (a TLB-miss handler run in MIPS), adding many cycles to a large fraction of loads, stores and instruction fetches. The caches cannot help, because every access needs a translation first.

**Improving it with no more money (no new hardware):**
- **Use larger pages**, if the OS and hardware allow it: with 128 KB pages the 16 entries reach $16\times128$ KB = 2 MB, the whole working set. Fewer, larger pages also make the page table smaller.
- **Improve locality in software:** restructure loops and data layout (e.g. blocking) so that a program works on fewer pages at a time.
- Make the TLB-miss handler as fast as possible, since TLB misses will still happen.

**With more money:**
- **A larger TLB** (at least 512 entries for 4 KB pages to cover 2 MB), set associative to keep it fast, or a **two-level TLB** (a small fast L1 TLB backed by a larger L2 TLB).
- **Hardware page-table walking** to make each remaining TLB miss cheaper.
- Support for **multiple page sizes** in the TLB.`,

  "4a": md`**Step 1: miss penalty and stall cycles per instruction.** Miss penalty = 6 + block size (words). Each instruction makes 1 instruction fetch and, for half of the instructions, a data access:
$$
\text{stall cycles per instruction} = (m_I + 0.5\,m_D)\times\text{penalty}
$$

| Processor | Penalty (cycles) | Stall cycles per instruction |
|---|---|---|
${q4a.map((p) => `| ${p.name} | 6 + ${p.words} = ${p.penalty} | $(${p.i} + 0.5\\times${p.d})\\times${p.penalty} = ${p.stall}$ |`).join("\n")}

**a.** **Processor 1** spends the most cycles on cache misses: ${q4a[0].stall} cycles per instruction (against ${q4a[1].stall} and ${q4a[2].stall}).

**b. Fastest and slowest.** The measured CPI of 2.0 on Processor 1 includes its stalls, so the base CPI (perfect cache) is
$$
\text{CPI}_{\text{base}} = 2.0 - ${q4a[0].stall} = ${q4a[0].base}
$$
The base CPI is the same for all three (same workload, same ISA). Time per instruction = CPI × cycle time:

| Processor | CPI | Cycle time | Time per instruction |
|---|---|---|---|
${q4a.map((p) => `| ${p.name} | ${q4a[0].base} + ${p.stall} = ${p.cpi} | ${p.ps} ps | ${p.time} ps |`).join("\n")}

**Processor 3 is the fastest** (${q4a[2].time} ps per instruction), mainly because of its shorter cycle time; **Processor 1 is the slowest** (${q4a[0].time} ps).

**c. Processor 3's cache.** The cache size is not given; **assume 16 KiB of data** for the illustration. Then:
- block = 4 words = 16 bytes: **4 offset bits** (2 for the word, 2 for the byte);
- blocks = 16 KiB / 16 B = 1024; sets = 1024 / 2 = 512: **9 index bits**;
- tag = 32 − 9 − 4 = **19 bits**.

\`\`\`fig
b16-4a
\`\`\`

**Organisation:** two banks (ways) of 512 entries. Each entry holds a valid bit, a 19-bit tag and a 4-word data block.

**Access:**
1. The 9-bit index selects one set, reading **both** ways at the same time.
2. Two comparators compare the address tag with the two stored tags; each result is ANDed with that way's valid bit.
3. **Hit** = OR of the two comparisons. The comparison results drive a 2-to-1 multiplexer that selects the data block from the matching way.
4. The 2-bit word offset selects one of the four words in the block (a 4-to-1 mux).
5. On a **miss**, the block is fetched from memory (10 cycles) and placed in the least recently used way of the set (one LRU bit per set).`,

  "4b": md`**Address fields** (32-bit byte address): a block is 64 words = 256 bytes $= 2^{8}$, so the **offset is 8 bits** (6 for the word, 2 for the byte). The cache holds $256\ \text{KB}/256\ \text{B} = 1024$ blocks.

**a. Size of the cache.** It stores **256 KB of data** ($2^{21}$ bits), as **1024 blocks** of 256 bytes. Its total size is the data plus the overhead found in b (e.g. ${(Q4B.dm.total).toLocaleString("en-US")} bits ≈ ${r(Q4B.dm.total / 8 / 1024, 2)} KiB in all if direct mapped).

**b. Overhead** (bits other than data). Per block: the tag and a **valid bit**. Write-through needs **no dirty bit**, and random replacement needs **no LRU bits**.

| Organisation | Sets | Index bits | Tag bits | Overhead per block | Total overhead |
|---|---|---|---|---|---|
| i. Direct mapped | ${Q4B.dm.sets} | ${Q4B.dm.split.index} | ${Q4B.dm.split.tag} | ${Q4B.dm.split.tag + 1} | $1024\\times${Q4B.dm.split.tag + 1} = ${over(Q4B.dm).toLocaleString("en-US")}$ bits = ${over(Q4B.dm) / 8} B |
| ii. 2-way | ${Q4B.two.sets} | ${Q4B.two.split.index} | ${Q4B.two.split.tag} | ${Q4B.two.split.tag + 1} | $1024\\times${Q4B.two.split.tag + 1} = ${over(Q4B.two).toLocaleString("en-US")}$ bits = ${over(Q4B.two) / 8} B |
| iii. Fully associative | 1 | 0 | ${Q4B.fa.split.tag} | ${Q4B.fa.split.tag + 1} | $1024\\times${Q4B.fa.split.tag + 1} = ${over(Q4B.fa).toLocaleString("en-US")}$ bits = ${over(Q4B.fa) / 8} B |

As a fraction of the data ($2^{21}$ bits): ${r((over(Q4B.dm) / 2 ** 21) * 100, 2)}%, ${r((over(Q4B.two) / 2 ** 21) * 100, 2)}% and ${r((over(Q4B.fa) / 2 ** 21) * 100, 2)}%. Higher associativity means fewer index bits, so longer tags.

**c. Cache address for \`lw $1, 18($2)\`** with \`$2\` = 1000:
$$
\text{address} = 1000 + 18 = 1018
$$
- Block address $= \lfloor 1018/256 \rfloor = 3$; offset $= 1018 - 3\times256 = 250$.
- Index $= 3 \bmod 1024 = 3$; tag $= \lfloor 3/1024 \rfloor = 0$.
- Within the block: word $\lfloor 250/4 \rfloor = 62$, byte 2.

| Tag (14 bits) | Index (10 bits) | Offset (8 bits) |
|---|---|---|
| 0 | 3 | 250 (word 62, byte 2) |

Note: 1018 is not a multiple of 4, so it is not word-aligned. MIPS requires \`lw\` addresses to be word-aligned, so this access would actually cause an alignment error; the fields above are where the byte at 1018 lives in the cache.`,

  "5a": md`**Sequential (first) version: hardware.**

\`\`\`fig
arith-mult-v1
\`\`\`

- 64-bit Multiplicand register (the 32-bit multiplicand starts in the right half and shifts **left** each step).
- 32-bit Multiplier register, shifting **right** each step.
- 64-bit ALU and 64-bit Product register (initialised to 0).
- A control test on the multiplier's rightmost bit.

**Its flowchart:**

\`\`\`fig
arith-mult-v1-flow
\`\`\`

1. Test Multiplier0. If it is 1, add the Multiplicand to the Product and put the result in the Product register.
2. Shift the Multiplicand register left 1 bit.
3. Shift the Multiplier register right 1 bit.
4. Repeat 32 times.

**Refined version: hardware and flowchart.** The multiplicand stays fixed (32 bits), the ALU is 32 bits, and the multiplier starts in the right half of the 64-bit Product register, which shifts right.

\`\`\`fig
arith-mult-v2
\`\`\`

\`\`\`fig
arith-mult-v2-flow
\`\`\`

1. Test Product0 (the multiplier's current bit). If it is 1, add the Multiplicand to the **left half** of the Product.
2. Shift the Product register right 1 bit.
3. Repeat 32 times. The add and the shift can be done in the same cycle.`,

  "5b": md`**Format:** 1 sign bit, 4 exponent bits, $16 - 1 - 4 = 11$ fraction bits. Bias $= 2^{4-1} - 1 = 7$.

**$(-1.25)_{10}$:**
1. $1.25 = 1.01_{two}\times2^{0}$.
2. Sign = 1; exponent field $= 0 + 7 = 7 = ${m125.exponent}_{two}$; fraction $= ${m125.fraction}$.

| Sign | Exponent | Fraction |
|---|---|---|
| ${m125.sign} | ${m125.exponent} | ${m125.fraction} |

$$
${m125.bits.match(/.{4}/g)!.join("\\ ")} = \texttt{0x${hex(m125.bits)}}
$$

**$(0.375)_{10}$:**
1. $0.375 = 0.011_{two} = 1.1_{two}\times2^{-2}$.
2. Sign = 0; exponent field $= -2 + 7 = 5 = ${p375.exponent}_{two}$; fraction $= ${p375.fraction}$.

| Sign | Exponent | Fraction |
|---|---|---|
| ${p375.sign} | ${p375.exponent} | ${p375.fraction} |

$$
${p375.bits.match(/.{4}/g)!.join("\\ ")} = \texttt{0x${hex(p375.bits)}}
$$

Both values are exact (no rounding).`,

  "5c": md`**Step 1: binary.**
$$
\texttt{DF807500} = 1101\ 1111\ 1000\ 0000\ 0111\ 0101\ 0000\ 0000
$$

**Step 2: fields** (1 + 8 + 23):

| Sign | Exponent | Fraction |
|---|---|---|
| 1 | 10111111 | 00000000111010100000000 |

**Step 3: decode.**
- Sign = 1: negative.
- Exponent field $= 10111111_{two} = 191$; actual exponent $= 191 - 127 = 64$.
- Significand $= 1.00000000111010100000000_{two} = 1 + \dfrac{\texttt{0x7500}}{2^{23}} = 1 + \dfrac{29952}{8388608} = 1.003570556640625$.

$$
x = -1.003570556640625\times2^{64} \approx ${(q5c.kind === "normal" ? q5c.value : 0).toExponential(4).replace("e+", "\\times10^{") + "}"}
$$`,

  "5d": md`Each stage is a full adder with inputs $X_i$, $Y_i$, $Z_i$; $F_i = X_i\oplus Y_i\oplus Z_i$. For the logic operations ($S_2 = 1$) the carries are cut ($Z_i = 0$), so $F_i = X_i\oplus Y_i$.

**Step 1: arithmetic** ($S_2 = 0$), with $X_i = A_i$ and $F = A + Y + C_{in}$. "Transfer A" can be made as $A + (\text{all 1s}) + 1 = A - 1 + 1$, which makes $C_{in}$ simply $S_0$:

| $S_2S_1S_0$ | Operation | $Y$ | $C_{in}$ |
|---|---|---|---|
| 000 | $A + B$ | $B$ | 0 |
| 001 | Transfer A | all 1s | 1 |
| 010 | $A + B'$ | $B'$ | 0 |
| 011 | $A + 1$ | 0 | 1 |

So $C_{in} = S_2'S_0$, and $Y$ depends on $S_1S_0$ only (00 → $B$, 01 → 1, 10 → $B'$, 11 → 0):
$$
Y_i = S_1'B_i + S_1'S_0 + S_1S_0'B_i'
$$

**Step 2: logic** ($S_2 = 1$), keeping the same $Y_i$:

| $S_1S_0$ | Operation | $Y_i$ | $X_i$ needed | Check |
|---|---|---|---|---|
| 00 | XOR | $B_i$ | $A_i$ | $A_i\oplus B_i$ |
| 01 | NOT | 1 | $A_i$ | $A_i\oplus1 = A_i'$ |
| 10 | AND | $B_i'$ | $A_i + B_i'$ | $(A_i + B_i')\oplus B_i' = A_iB_i$ |
| 11 | OR | 0 | $A_i + B_i$ | $A_i + B_i$ |

**Step 3: equations.**
$$
X_i = A_i + S_2S_1S_0'B_i' + S_2S_1S_0B_i
$$
$$
Y_i = S_1'B_i + S_1'S_0 + S_1S_0'B_i'
$$
$$
Z_i = S_2'C_i,\qquad C_{in} = Z_0 = S_2'S_0
$$
They were checked on all $16\times16$ input pairs for each of the 8 operations.

**One typical stage** (stage $i$):
- **$X_i$:** two 4-input ANDs ($S_2S_1S_0'B_i'$ and $S_2S_1S_0B_i$) and a 3-input OR with $A_i$.
- **$Y_i$:** three ANDs ($S_1'B_i$, $S_1'S_0$, $S_1S_0'B_i'$) into a 3-input OR. ($S_1'S_0$ is shared by all stages.)
- **$Z_i$:** one 2-input AND of $S_2'$ and the carry $C_i$ from stage $i - 1$ (stage 0 gets $C_{in}$).
- **Full adder** with inputs $X_i$, $Y_i$, $Z_i$: outputs $F_i$ and the carry $C_{i+1}$ to the next stage.

\`\`\`fig
alu-stage
\`\`\``,

  "6a": md`MIPS has five addressing modes.

**1. Immediate addressing:** the operand is a constant inside the instruction (16 bits, sign- or zero-extended). Example: \`addi $t0, $t1, 4\`.

\`\`\`fig
isa-mode-immediate
\`\`\`

**2. Register addressing:** the operand is in a register named in the instruction. Example: \`add $t0, $t1, $t2\`.

\`\`\`fig
isa-mode-register
\`\`\`

**3. Base (displacement) addressing:** the operand is in memory at address = register + sign-extended 16-bit offset. Example: \`lw $t0, 32($s3)\` accesses Memory[\`$s3\` + 32].

\`\`\`fig
isa-mode-base
\`\`\`

**4. PC-relative addressing:** branch target = (PC + 4) + sign-extended offset × 4. Example: \`beq $t0, $t1, L\`. Reach: about ±128 KB around the branch.

\`\`\`fig
isa-mode-pcrel
\`\`\`

**5. Pseudodirect addressing:** jump target = top 4 bits of PC + 4, followed by the 26-bit address field, followed by 00. Example: \`j L\`. Reach: anywhere in the current 256 MB region.

\`\`\`fig
isa-mode-pseudo
\`\`\``,

  "6c": md`MIPS has **three** instruction formats, all 32 bits long.

| Format | Fields (bits) | Used by |
|---|---|---|
| **R** (register) | op 6, rs 5, rt 5, rd 5, shamt 5, funct 6 | arithmetic/logic on registers, shifts, \`jr\` |
| **I** (immediate) | op 6, rs 5, rt 5, constant or address 16 | immediates, loads and stores, branches |
| **J** (jump) | op 6, address 26 | \`j\`, \`jal\` |

- **op:** basic operation (opcode). **rs, rt:** source registers (rt is the destination for I-format arithmetic and loads). **rd:** destination register. **shamt:** shift amount. **funct:** selects the variant of the R-format operation.`,

  "7a": md`**Addresses:** each instruction is 4 bytes, starting at 60000.

| Address | Instruction |
|---|---|
${q7.map((x) => `| ${x.pc} | \`${x.ins.text}\` |`).join("\n")}
| 60028 | \`Exit:\` |

**Branch offset:** beq at 60012 goes to Lp1 = 60020:
$$
\text{offset} = \frac{60020 - (60012 + 4)}{4} = 1
$$

**Jump fields:** address field = target / 4: Exit = 60028 → 15007; Loop = 60000 → 15000.

**R-format** (op, rs, rt, rd, shamt, funct):

| Address | Instruction | op | rs | rt | rd | shamt | funct |
|---|---|---|---|---|---|---|---|
${R.map(row).join("\n")}

**I-format** (op, rs, rt, immediate):

| Address | Instruction | op | rs | rt | immediate |
|---|---|---|---|---|---|
${I.map(row).join("\n")}

**J-format** (op, address):

| Address | Instruction | op | address |
|---|---|---|---|
${J.map(row).join("\n")}

Register numbers: \`$t0\` = 8, \`$t1\` = 9, \`$s2\` = 18, \`$s5\` = 21, \`$s6\` = 22. Opcodes: R-format 0 (sll funct 0, add funct 32), lw 35, beq 4, j 2, addi 8.`,

  "7b": md`**(i) Execution time.**
$$
\text{cycles} = 160\times2 + 110\times1 + 10\times5 + 16\times2 = 320 + 110 + 50 + 32 = ${c0}\ \text{million}
$$
$$
T = \frac{${c0}\times10^{6}}{4\times10^{9}\ \text{Hz}} = ${c0 / 4000}\ \text{s} = ${c0 / 4}\ \text{ms}
$$

**(ii) Twice as fast by improving FP only.** The target is ${c0 / 2} million cycles. The other instructions take $${c0} - 320 = ${c0 - 320}$ million cycles, so FP may take only $${c0 / 2} - ${c0 - 320} = ${c0 / 2 - (c0 - 320)}$ million:
$$
\text{CPI}_{FP} = \frac{${c0 / 2 - (c0 - 320)}}{160} = ${fpNeed}
$$
The FP CPI must drop from 2 to **${fpNeed}**, i.e. become **${2 / fpNeed} times smaller**. This is a very large improvement; a CPI below 1 needs more than one FP instruction completing per cycle (e.g. multiple issue).

**(iii) Twice as fast by improving L/S only.** The non-L/S instructions alone take
$$
${c0} - 50 = ${lsLeft}\ \text{million cycles} > ${c0 / 2}\ \text{million}
$$
Even with an L/S CPI of 0, the program would take ${lsLeft} million cycles: a speed-up of at most $${c0}/${lsLeft} \approx ${r(c0 / lsLeft, 3)}$. **It is impossible.** L/S instructions take only ${r((50 / c0) * 100, 1)}% of the time (Amdahl's Law).

**(iv) New CPIs:** INT $1\times1.15 = 1.15$, BRANCH $2\times1.15 = 2.3$, FP $2\times0.8 = 1.6$, L/S $5\times0.8 = 4$.
$$
\text{cycles} = 160\times1.6 + 110\times1.15 + 10\times4 + 16\times2.3 = 256 + 126.5 + 40 + 36.8 = ${c4b}\ \text{million}
$$
$$
T_{\text{new}} = \frac{${c4b}\times10^{6}}{4\times10^{9}} = ${r(c4b / 4000, 6)}\ \text{s}
$$
The execution time **decreases** by $${c0 / 4000} - ${r(c4b / 4000, 6)} = ${r((c0 - c4b) / 4000, 6)}$ s, which is **${r(((c0 - c4b) / c0) * 100, 2)}%** less (a speed-up of $${c0}/${c4b} \approx ${r(c0 / c4b, 3)}$). The FP instructions dominate the time, so their 20% gain outweighs the 15% loss on INT and BRANCH.`,

  "7c": md`**Use of the bias.** The exponent is stored as an **unsigned** number: stored exponent = actual exponent + bias (127 for single, 1023 for double precision). So:
- negative exponents need no sign bit or two's complement;
- with the exponent placed before the fraction, non-negative floating-point numbers **compare and sort like unsigned integers**, using integer comparison hardware;
- the most negative exponent is stored as all 0s and the most positive as all 1s, which leaves these two patterns free for special values (zero, denormals, infinity, NaN).

**Encoding of infinity:** exponent **all 1s**, fraction **all 0s**; the sign gives $+\infty$ or $-\infty$.

| Value | Sign | Exponent | Fraction | Hex (single precision) |
|---|---|---|---|---|
| $+\infty$ | 0 | 11111111 | 000…0 (23 zeros) | \`0x7F800000\` |
| $-\infty$ | 1 | 11111111 | 000…0 (23 zeros) | \`0xFF800000\` |

(Exponent all 1s with a non-zero fraction is NaN, "not a number".)`,

  "8a": md`**Register use:** a in \`$a0\`, b in \`$a1\`, result in \`$v0\`. b is taken as non-negative (an exponent), so b/2 is a right shift and b % 2 is the lowest bit.

**Note on the base case:** as printed, \`fun\` returns 0 when b = 0, so every call returns 0. For $a^{b}$ the base case must return **1**. The code below follows the printed C; changing the marked instruction to \`addi $v0, $zero, 1\` makes it compute $a^{b}$.

\`\`\`
fun:    bne  $a1, $zero, Rec      # b != 0: recursive case
        add  $v0, $zero, $zero    # return 0   (use addi $v0, $zero, 1 for a^b)
        jr   $ra
Rec:    addi $sp, $sp, -12        # save $ra, a and b
        sw   $ra, 8($sp)
        sw   $a0, 4($sp)
        sw   $a1, 0($sp)
        mul  $a0, $a0, $a0        # argument 1: a*a
        srl  $a1, $a1, 1          # argument 2: b/2
        jal  fun                  # $v0 = fun(a*a, b/2)
        lw   $a1, 0($sp)          # restore b, a, $ra
        lw   $a0, 4($sp)
        lw   $ra, 8($sp)
        addi $sp, $sp, 12
        andi $t0, $a1, 1          # $t0 = b % 2
        beq  $t0, $zero, Done     # b even: return fun(a*a, b/2)
        mul  $v0, $v0, $a0        # b odd: return fun(a*a, b/2) * a
Done:   jr   $ra
\`\`\`

**Why it is short:** both recursive calls in the C code are the same call, \`fun(a*a, b/2)\`, so it is made once; only the final multiply by a depends on whether b is odd.

**Trace with the base case 1:** fun(3, 5) → fun(9, 2) × 3 → fun(81, 1) × 3 → fun(6561, 0) × 81 × 3 = 1 × 81 × 3 = **243** = $3^{5}$.`,

  "8b": md`**Steps of floating-point addition** (as on the slides):
1. **Align the binary points:** shift the significand of the number with the smaller exponent right until the exponents are equal.
2. **Add the significands.**
3. **Normalise the result** (shift left or right, adjusting the exponent) and **check for overflow or underflow**.
4. **Round** the significand to the available number of bits; if rounding makes it unnormalised, normalise again (go back to step 3).

**Example:** $0.5 + (-0.4375)$ with 4 significant bits (1 + 3 fraction bits).
- $0.5 = 1.000_{two}\times2^{-1}$, $-0.4375 = -1.110_{two}\times2^{-2}$.

| Step | Action | Result |
|---|---|---|
${fa.steps.map((s) => `| ${s.step} | ${s.detail.replace(/-/g, "−")} | $${s.significand.replace(/-/g, "-")}\\times2^{${s.e}}$ |`).join("\n")}

Result: $1.000_{two}\times2^{-4} = 0.0625$, which is $0.5 - 0.4375$ exactly.

\`\`\`fig
fp-adder
\`\`\`

**Overflow and underflow** (checked in step 3, and again after rounding):
- **Overflow:** the normalised exponent is too large for the exponent field: single precision $e > 127$ (biased field ≥ 255); double precision $e > 1023$.
- **Underflow:** the normalised exponent is too small: single precision $e < -126$ (biased field ≤ 0); double precision $e < -1022$.`,

  "8c": md`**The problem.** \`beq\` is I-format: it stores a 16-bit signed **word offset** relative to PC + 4, so it can only reach about ±32K words (±128 KB) from the branch.

Reading the addresses as hexadecimal (the leading zeros of 005000 suggest a hex address):
$$
\text{offset} = \frac{\texttt{0x30500} - (\texttt{0x5000} + 4)}{4} = \frac{\texttt{0x2B4FC}}{4} = \texttt{0xAD3F} = 44351
$$
44351 is larger than the largest 16-bit signed offset, 32767, so the branch **cannot be encoded**: the target is too far away.

**The solution:** invert the condition and branch over an unconditional jump, which has a 26-bit field (pseudodirect addressing, reach within the 256 MB region). The assembler does this automatically:

\`\`\`
0x5000:  bne $s0, $s1, L2     # condition false: skip the jump
0x5004:  j   0x30500          # condition true: jump to the far target
L2:      ...
\`\`\`

The jump works because \`0x30500\` and \`0x5004\` have the same top 4 bits (both in the first 256 MB).

(If the addresses are read as decimal, the offset is $(30500 - 5004)/4 = 6374$, which fits in 16 bits, and the branch has no problem.)`,
}
