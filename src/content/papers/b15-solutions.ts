import { md } from "../md"
import { after } from "./compose"
import { b16Solutions } from "./b16-solutions"
import { b19Solutions } from "./b19-solutions"
import { b21Solutions } from "./b21-solutions"
import { b22Solutions } from "./b22-solutions"
import { accessTable, simulateCache, type CacheConfig } from "@/lib/cache"
import { encode, fpAddSteps } from "@/lib/ieee"

/* ───── Q1(c) ───── */
export const Q1C = { stages: [200, 100, 100, 200, 100] }
const single = Q1C.stages.reduce((a, b) => a + b, 0)
const stage = Math.max(...Q1C.stages)
export const speedup = (n: number) => (n * single) / ((n + 4) * stage)
const fmt = (x: number, k = 4) => String(Number(x.toFixed(k)))

/* ───── Q3(a) ───── */
export const DISK = { seekMs: 5, rpm: 10000, mb: 1, mbPerS: 100, ctrlMs: 0.5 }
const rot = (0.5 / (DISK.rpm / 60)) * 1000
const xfer = (DISK.mb / DISK.mbPerS) * 1000
export const readMs = (seek: number) => seek + rot + xfer + DISK.ctrlMs

/* ───── Q4(b) ───── */
export const Q4B_SEQ = [1, 3, 5, 1, 3, 1, 3, 5, 3, 1, 5, 3]
export const Q4B_CFG: Record<"fa" | "two" | "dm", CacheConfig> = { fa: { sets: 1, ways: 4 }, two: { sets: 2, ways: 2 }, dm: { sets: 4, ways: 1 } }
const r4 = { fa: simulateCache(Q4B_CFG.fa, Q4B_SEQ), two: simulateCache(Q4B_CFG.two, Q4B_SEQ), dm: simulateCache(Q4B_CFG.dm, Q4B_SEQ) }

/* ───── Q5(b), Q5(c) ───── */
export const HALF = { expBits: 4, fracBits: 11 }
const e075 = encode(0.75, HALF)
const e125 = encode(1.25, HALF)
const add5 = fpAddSteps(0.75, 1.25, HALF)
const hex = (bits: string) => parseInt(bits, 2).toString(16).toUpperCase().padStart(bits.length / 4, "0")


export const b15Solutions: Record<string, string> = {
  "1a": b21Solutions["1c"],

  "1b": md`The datapath combines the R-format, load and branch paths with multiplexers, and a control unit decodes the opcode.

\`\`\`fig
dp-full
\`\`\`

(The jump path at the top of the figure is not needed for these three instructions.)

**Components:**
1. **PC**, **instruction memory**, and an **adder** for PC + 4.
2. **Register file** with two read ports (rs = bits 25–21, rt = bits 20–16) and one write port.
3. **RegDst mux:** the write register is rd (bits 15–11) for \`add\`, rt (bits 20–16) for \`lw\`.
4. **Sign-extend** unit for the 16-bit offset (bits 15–0).
5. **ALUSrc mux:** the ALU's second operand is register rt (\`add\`, \`beq\`) or the sign-extended offset (\`lw\`).
6. **ALU** with **ALU control** (from ALUOp and funct): add for \`add\` and \`lw\`, subtract for \`beq\` (its Zero output tests equality).
7. **Data memory** (read for \`lw\`).
8. **MemtoReg mux:** the register write data is the ALU result (\`add\`) or the memory data (\`lw\`).
9. **Branch target:** shift-left-2 of the sign-extended offset, and an adder with PC + 4.
10. **PCSrc mux:** next PC = branch target if Branch AND Zero, else PC + 4.

**Control signals:**

| Instruction | RegDst | ALUSrc | MemtoReg | RegWrite | MemRead | MemWrite | Branch | ALUOp |
|---|---|---|---|---|---|---|---|---|
| add (R-format) | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 10 |
| lw | 0 | 1 | 1 | 1 | 1 | 0 | 0 | 00 |
| beq | X | 0 | X | 0 | 0 | 0 | 1 | 01 |`,

  "1c": md`**Single-cycle:** the clock period must fit the whole \`lw\`:
$$
200 + 100 + 100 + 200 + 100 = ${single}\ \text{ps}
$$

**Pipelined:** the clock period is the slowest stage: **${stage} ps**. With $n$ instructions, the first takes 5 cycles and each other one adds 1 cycle: $(n + 4)$ cycles.

**3 instructions:**
$$
T_{\text{single}} = 3\times${single} = ${3 * single}\ \text{ps},\qquad T_{\text{pipe}} = (3 + 4)\times${stage} = ${7 * stage}\ \text{ps}
$$
$$
\text{Speed-up} = \frac{${3 * single}}{${7 * stage}} \approx ${fmt(speedup(3), 3)}
$$

**With 3,000,000 more lw** ($n = 3{,}000{,}003$):
$$
T_{\text{single}} = 3{,}000{,}003\times${single} = ${(3000003 * single).toLocaleString("en-US")}\ \text{ps}
$$
$$
T_{\text{pipe}} = 3{,}000{,}007\times${stage} = ${(3000007 * stage).toLocaleString("en-US")}\ \text{ps}
$$
$$
\text{Speed-up} = \frac{${(3000003 * single).toLocaleString("en-US")}}{${(3000007 * stage).toLocaleString("en-US")}} \approx ${fmt(speedup(3000003), 5)}
$$

With few instructions, the time to fill the pipeline dominates. With many, the speed-up approaches the ratio of the clock periods, $${single}/${stage} = ${single / stage}$ (not 5, because the stages are unbalanced: the 100 ps stages still take a 200 ps cycle).`,

  "1d": after(b22Solutions["1c"], "**Part 2:").replace(/^\*\*Part 2:[^\n]*\n\n/, ""),

  "2a": md`**Double data hazard.** An instruction's source register is written by **both** of the two instructions ahead of it. Example:

\`\`\`
add $1, $1, $2
add $1, $1, $3
add $1, $1, $4
\`\`\`

When the third \`add\` is in EX, \`$1\` is both in EX/MEM (from the second \`add\`) and in MEM/WB (from the first). The **most recent** value, in EX/MEM, is the correct one. So the MEM-hazard forwarding condition must also check that there is **no** EX hazard on the same register; only then is MEM/WB forwarded.

**Detecting the load-use hazard.** Forwarding cannot help when an instruction uses a register loaded by the instruction just before it: the data comes out of memory at the end of MEM, too late for the EX stage that starts in the same cycle. The **hazard detection unit** in the ID stage checks, for the instruction being decoded:

\`\`\`
if (ID/EX.MemRead and
    ((ID/EX.RegisterRt = IF/ID.RegisterRs) or
     (ID/EX.RegisterRt = IF/ID.RegisterRt)))
  stall the pipeline
\`\`\`

(ID/EX.MemRead = 1 means the instruction in EX is a load; RegisterRt is its destination.)

**How the stall is done (one bubble):**
1. **Force the control values in ID/EX to 0** (EX, MEM and WB signals): the instruction going into EX becomes a **nop** (bubble) that writes nothing.
2. **Prevent the PC and the IF/ID register from changing** (PCWrite = 0, IF/IDWrite = 0): the instruction in ID is decoded again in the next cycle, and the instruction in IF is fetched again.
3. One cycle later the load is in WB, and its value is forwarded from MEM/WB to the EX stage of the dependent instruction.

\`\`\`fig
dh-hazard-unit
\`\`\``,

  "2b": b22Solutions["1a"],

  "2c": b19Solutions["1c"],

  "2d": b19Solutions["1d"],

  "3a": md`**The three sources of cache misses (the three Cs):**
1. **Compulsory (cold-start) misses:** the first access to a block; the block has never been in the cache.
2. **Capacity misses:** the cache cannot hold all the blocks the program needs, so blocks are replaced and later missed again (would happen even in a fully associative cache of the same size).
3. **Conflict (collision) misses:** in a direct-mapped or set-associative cache, several blocks compete for the same set and evict each other, although the cache as a whole has room.

**Average read time of the disk.** Average read time = seek + rotational latency + transfer + controller overhead.
- Seek: **${DISK.seekMs} ms**.
- Rotational latency: on average half a rotation.
$$
\frac{0.5}{10000/60\ \text{rev/s}} = ${fmt(rot, 3)}\ \text{ms}
$$
- Transfer of one 1 MB sector at 100 MB/s:
$$
\frac{1\ \text{MB}}{100\ \text{MB/s}} = ${xfer}\ \text{ms}
$$
- Controller overhead: **${DISK.ctrlMs} ms**.

$$
T = ${DISK.seekMs} + ${fmt(rot, 3)} + ${xfer} + ${DISK.ctrlMs} = ${fmt(readMs(5), 3)}\ \text{ms}
$$

**With a 2 ms average seek:**
$$
T' = 2 + ${fmt(rot, 3)} + ${xfer} + ${DISK.ctrlMs} = ${fmt(readMs(2), 3)}\ \text{ms}
$$
$$
\frac{T}{T'} = \frac{${fmt(readMs(5), 3)}}{${fmt(readMs(2), 3)}} \approx ${fmt(readMs(5) / readMs(2), 3)}
$$
The read becomes about **${fmt((readMs(5) / readMs(2) - 1) * 100, 1)}% faster** (the time drops by 3 ms, ${fmt((3 / readMs(5)) * 100, 1)}%). The gain is small because, with a 1 MB sector, the transfer time dominates.`,

  "3b": md`**Locality** (the reason caches work):
- **Temporal locality:** an item accessed recently is likely to be accessed again soon. Examples: instructions in a loop, loop counters and sums. Caches exploit it by keeping recently used items.
- **Spatial locality:** items near a recently accessed item are likely to be accessed soon. Examples: sequential instructions, array elements in order. Caches exploit it by fetching whole **blocks** of adjacent words.

**Write-through.** Every write updates **both** the cache and the next level (memory).
- Memory always holds the current value; replacing a block needs no write-back.
- But every write goes to slow memory: a **write buffer** holds writes waiting to go to memory, so the CPU continues at once and stalls only if the buffer is full.

**Write-back.** A write updates **only the cache** and sets the block's **dirty bit**.
- The block is written to memory only when it is **replaced**, and only if it is dirty.
- Fewer memory writes (repeated writes to a block cost one write-back), but more complex, and memory can hold stale data.

**Handling a write miss:**
- **Write-through:** usually **no write allocate** (write around): the word is written to memory only and the block is not brought into the cache, since a write-through cache would just write it to memory anyway. (Write allocate is the other choice: fetch the block, then write.)
- **Write-back:** usually **write allocate**: fetch the block into the cache (writing back the replaced block first if it is dirty), then write the word into the cache and set the dirty bit.`,

  "3c": b19Solutions["3b"],

  "3d": md`**Step 1: miss cycles per instruction.** Every instruction is fetched (I-cache); 40% also access data (D-cache).
$$
\text{I-cache: } 0.03\times200 = 6.0
$$
$$
\text{D-cache: } 0.40\times0.05\times200 = 4.0
$$
$$
\text{memory stall cycles per instruction} = 6.0 + 4.0 = 10.0
$$

**Step 2: CPI with stalls.**
$$
\text{CPI} = 2 + 10 = 12
$$

**Step 3: speed-up with a perfect cache** (same instruction count and clock):
$$
\frac{\text{CPU time}_{\text{stalls}}}{\text{CPU time}_{\text{perfect}}} = \frac{12}{2} = 6
$$
The processor with a perfect cache is **6 times faster**.

**Step 4: time spent on memory stalls.**
$$
\frac{10}{12} \approx 83.3\%
$$
Only $2/12 \approx 16.7\%$ of the time is spent executing instructions.`,

  "4a": b19Solutions["3a"],

  "4b": md`Each cache has four one-word blocks; LRU replacement.

**Fully associative** (one set of 4): 1, 3 and 5 all fit, so only the first access to each misses.

${accessTable(r4.fa, Q4B_CFG.fa)}

Misses: **${r4.fa.misses}** (only compulsory misses).

**Two-way set associative** (2 sets): every address is odd, so **all go to set 1**, which has room for two. Three blocks compete for two places.

${accessTable(r4.two, Q4B_CFG.two)}

Misses: **${r4.two.misses}**.

**Direct mapped** (4 blocks, index = address mod 4): 1 and 5 → index 1; 3 → index 3.

${accessTable(r4.dm, Q4B_CFG.dm)}

Misses: **${r4.dm.misses}**. Blocks 1 and 5 keep evicting each other at index 1; block 3 stays at index 3.

| Organisation | Misses | Hits |
|---|---|---|
| Fully associative | ${r4.fa.misses} | ${r4.fa.hits} |
| Two-way set associative | ${r4.two.misses} | ${r4.two.hits} |
| Direct mapped | ${r4.dm.misses} | ${r4.dm.hits} |

Here the direct-mapped cache does better than the two-way one: its index 3 holds block 3 permanently, while in the two-way cache all three blocks fight over one set and LRU keeps evicting the block needed next.`,

  "4c": md`**What a TLB is.** The **translation-lookaside buffer** is a small, fast cache of recently used **page-table entries**, inside the processor. Each entry holds a tag (the virtual page number), the physical page number, and status bits (valid, dirty, reference). It is usually fully associative or highly set associative, with tens to a few hundred entries.

**Why it is necessary.** The page table is in **main memory**. Without a TLB, every memory access would need **two** memory accesses: one to read the page-table entry (to translate the address) and one for the data itself. That would double the time of every load, store and instruction fetch.

Because of locality, the translations of the pages in use are almost always in the TLB (hit rates above 99%). A TLB hit translates the address in a fraction of a cycle, so virtual memory costs almost nothing on most accesses; only on a TLB miss is the page table read.`,

  "4d": md`For a **write**, the TLB both translates the address and checks permission; then the data cache is written.

\`\`\`fig
vm-tlb-flow
\`\`\`

**The write path, step by step:**
1. **TLB access** with the virtual page number.
2. **TLB miss:** raise a TLB-miss exception; the handler loads the page-table entry into the TLB (or the OS handles a page fault), then the access is retried.
3. **TLB hit:** check the entry's **write-access bit**.
   - If writing is **not allowed**: raise a **write-protection exception**.
   - If allowed: form the physical address (physical page number + page offset) and set the TLB entry's **dirty bit** (the page now differs from its copy on disk).
4. **Data cache access** with the physical address:
   - **Cache hit:** write the data into the cache block (and, for a write-through cache, into the write buffer to memory; for write-back, set the block's dirty bit).
   - **Cache miss:** read the block from memory into the cache, then write it as for a hit.`,

  "5a": md`**Clock cycles of each program** (cycles = Σ count × CPI; same clock for both):
$$
\text{P1: } 40\times1.2 + 10\times2 + 16\times2.5 = 48 + 20 + 40 = 108
$$
$$
\text{P2: } 12\times1.2 + 13\times2 + 40\times2.5 = 14.4 + 26 + 100 = 140.4
$$

**(i)** **P1** executes faster:
$$
\frac{140.4}{108} = 1.3
$$
P1 is **1.3 times faster** than P2 (it takes about 23% less time).

**(ii) P1 twice as fast by improving class B only.** P1 would have to take $108/2 = 54$ cycles. Classes A and C alone take
$$
48 + 40 = 88\ \text{cycles} > 54
$$
Even with $\text{CPI}_B = 0$, P1 would take 88 cycles: a speed-up of at most $108/88 \approx 1.23$. **It is impossible.** Class B accounts for only $20/108 \approx 18.5\%$ of P1's cycles (Amdahl's Law: the improvement is limited by the part that is not improved).`,

  "5b": md`**Format:** 1 sign bit, 4 exponent bits, 11 fraction bits; bias $= 2^{3} - 1 = 7$.

**Step 0: convert both numbers.**

| Number | Normalised | Sign | Exponent field | Fraction field | Hex |
|---|---|---|---|---|---|
| 0.75 | $1.1_{two}\times2^{-1}$ | 0 | $-1 + 7 = 6$ = ${e075.exponent} | ${e075.fraction} | \`0x${hex(e075.bits)}\` |
| 1.25 | $1.01_{two}\times2^{0}$ | 0 | $0 + 7 = 7$ = ${e125.exponent} | ${e125.fraction} | \`0x${hex(e125.bits)}\` |

**Step 1: align the binary points.** The smaller exponent (−1, from 0.75) is raised to 0: shift its significand right 1 place.
$$
1.1_{two}\times2^{-1} = 0.11_{two}\times2^{0}
$$
Exponent field now 0111 for both.

**Step 2: add the significands.**
$$
1.01_{two} + 0.11_{two} = 10.00_{two},\qquad \text{sum} = 10.00_{two}\times2^{0}
$$

**Step 3: normalise and check.** Shift right 1 place, increase the exponent by 1:
$$
10.00_{two}\times2^{0} = 1.000_{two}\times2^{1}
$$
Exponent field $= 1 + 7 = 8 = 1000$, within 1…14: no overflow or underflow.

**Step 4: round.** The fraction 000…0 fits in 11 bits: no rounding needed.

| Step | Exponent field | Significand |
|---|---|---|
${add5.steps.map((s) => `| ${s.step} | ${(s.e + 7).toString(2).padStart(4, "0")} (e = ${s.e}) | ${s.significand} |`).join("\n")}

**Result:**

| Sign | Exponent | Fraction |
|---|---|---|
| ${add5.encoded.sign} | ${add5.encoded.exponent} | ${add5.encoded.fraction} |

$$
\texttt{0x${hex(add5.encoded.bits)}} = 1.0\times2^{1} = ${add5.result} = 0.75 + 1.25
$$`,

  "5c": md`**Binary:**
$$
\texttt{7F800005} = 0111\ 1111\ 1000\ 0000\ 0000\ 0000\ 0000\ 0101
$$

| Sign | Exponent | Fraction |
|---|---|---|
| 0 | 11111111 | 00000000000000000000101 |

- Exponent field = 255 (**all 1s**).
- Fraction = 101 (binary) = 5, **not zero**.

In IEEE 754, an all-1s exponent with a non-zero fraction is **NaN (Not a Number)**. It has **no decimal value**: it is the result of an invalid operation such as $0/0$ or $\infty - \infty$. (With a zero fraction, the same exponent would be $+\infty$.)`,

  "6a": md`Each stage is a full adder with inputs $X_i$, $Y_i$, $Z_i$; $F_i = X_i\oplus Y_i\oplus Z_i$. For the logic operations ($S_2 = 1$) the carries are cut ($Z_i = 0$), so $F_i = X_i\oplus Y_i$.

**Step 1: arithmetic** ($S_2 = 0$), with $X_i = A_i$ and $F = A + Y + C_{in}$:

| $S_2S_1S_0$ | Operation | $Y$ | $C_{in}$ | Why |
|---|---|---|---|---|
| 000 | $A + B$ | $B$ | 0 | |
| 001 | Transfer A | 0 | 0 | $A + 0$ |
| 010 | Decrement A | all 1s | 0 | all 1s $= -1$ |
| 011 | $A + B'$ | $B'$ | 0 | add the 1's complement of B |

$C_{in} = 0$ for all four, so **no carry-in logic is needed**. $Y$ depends on $S_1S_0$ only (00 → $B$, 01 → 0, 10 → 1, 11 → $B'$):
$$
Y_i = S_1'S_0'B_i + S_1S_0' + S_1B_i'
$$

**Step 2: logic** ($S_2 = 1$), keeping the same $Y_i$:

| $S_1S_0$ | Operation | $Y_i$ | $X_i$ needed | Check |
|---|---|---|---|---|
| 00 | XOR | $B_i$ | $A_i$ | $A_i\oplus B_i$ |
| 01 | AND | 0 | $A_iB_i$ | |
| 10 | NOT | 1 | $A_i$ | $A_i\oplus1 = A_i'$ |
| 11 | OR | $B_i'$ | $A_i' + B_i$ | $B_i = 1$: $1\oplus0 = 1$; $B_i = 0$: $A_i'\oplus1 = A_i$ |

**Step 3: $X_i$.** It is $A_i$ except for AND ($S_2S_1S_0 = 101$) and OR ($111$), the two codes with $S_2S_0 = 11$:
$$
X_i = A_i(S_2S_0)' + S_2S_1'S_0A_iB_i + S_2S_1S_0(A_i' + B_i)
$$

**Result:**
$$
X_i = A_i(S_2S_0)' + S_2S_1'S_0A_iB_i + S_2S_1S_0(A_i' + B_i)
$$
$$
Y_i = S_1'S_0'B_i + S_1S_0' + S_1B_i'
$$
$$
Z_i = S_2'C_i,\qquad C_{in} = Z_0 = 0
$$
Checked on all $16\times16$ input pairs for each of the 8 operations.

**One typical stage:**
- **$X_i$:** a NAND for $(S_2S_0)'$ (shared by all stages) ANDed with $A_i$; a 4-input AND $S_2S_1'S_0A_iB_i$; an OR $A_i' + B_i$ ANDed with $S_2S_1S_0$; a 3-input OR of the three terms.
- **$Y_i$:** ANDs $S_1'S_0'B_i$ and $S_1B_i'$, the shared term $S_1S_0'$, and a 3-input OR.
- **$Z_i$:** a 2-input AND of $S_2'$ with the previous stage's carry $C_i$.
- **Full adder** on $X_i$, $Y_i$, $Z_i$, giving $F_i$ and the carry $C_{i+1}$.

\`\`\`fig
alu-stage
\`\`\``,

  "6b": md`With the design of 6(a), the output carry $C_4$ is the carry out of the 4-bit addition $X + Y + C_{in}$ (with $X = A$, $C_{in} = 0$). It is 1 exactly when that sum is at least $2^{4} = 16$.

| Operation | Sum computed | $C_{out} = 1$ when |
|---|---|---|
| **Addition** | $A + B$ | $A + B \ge 16$: the unsigned sum does not fit in 4 bits (unsigned overflow) |
| **Transfer A** | $A + 0 + 0$ | **never** ($A \le 15$) |
| **Decrement A** | $A + 1111$ | $A + 15 \ge 16$, i.e. **$A \ne 0$**. For $A = 0$ the result is $1111$ (−1) with no carry: a "borrow" |
| **$A + B'$** | $A + (15 - B)$ | $A + 15 - B \ge 16$, i.e. **$A > B$** |

For the last one: $A + B' = A - B - 1$ in two's complement, so $C_{out} = 1$ means no borrow from $A - B - 1$, which needs $A \ge B + 1$.

These conditions were checked on all 256 input pairs. (If Transfer A were built as $A + 1111 + 1$ instead, its carry would be 1 for every A.)`,

  "7a": md`**Register use:**
- \`swap\`: v in \`$a0\`, k in \`$a1\`; temp in \`$t0\`. It is a leaf procedure, so nothing is saved.
- \`sort\`: v in \`$a0\`, n in \`$a1\`; i in \`$s0\`, j in \`$s1\`. v and n are copied to \`$s2\`, \`$s3\`, because \`$a0\`, \`$a1\` are needed to pass arguments to \`swap\`. \`$ra\` and \`$s0\`–\`$s3\` are saved on the stack.

\`\`\`
swap:   sll  $t1, $a1, 2          # $t1 = k * 4
        add  $t1, $a0, $t1        # $t1 = address of v[k]
        lw   $t0, 0($t1)          # temp = v[k]
        lw   $t2, 4($t1)          # $t2 = v[k+1]
        sw   $t2, 0($t1)          # v[k] = v[k+1]
        sw   $t0, 4($t1)          # v[k+1] = temp
        jr   $ra

sort:   addi $sp, $sp, -20        # save $ra, $s3, $s2, $s1, $s0
        sw   $ra, 16($sp)
        sw   $s3, 12($sp)
        sw   $s2, 8($sp)
        sw   $s1, 4($sp)
        sw   $s0, 0($sp)
        add  $s2, $a0, $zero      # $s2 = v
        add  $s3, $a1, $zero      # $s3 = n
        add  $s0, $zero, $zero    # i = 0
for1tst: slt $t0, $s0, $s3        # i < n ?
        beq  $t0, $zero, exit1    # exit outer loop if i >= n
        addi $s1, $s0, -1         # j = i - 1
for2tst: slti $t0, $s1, 0         # j < 0 ?
        bne  $t0, $zero, exit2    # exit inner loop if j < 0
        sll  $t1, $s1, 2          # $t1 = j * 4
        add  $t2, $s2, $t1        # $t2 = address of v[j]
        lw   $t3, 0($t2)          # $t3 = v[j]
        lw   $t4, 4($t2)          # $t4 = v[j+1]
        slt  $t0, $t4, $t3        # v[j+1] < v[j] ?
        beq  $t0, $zero, exit2    # exit inner loop if v[j] <= v[j+1]
        add  $a0, $s2, $zero      # argument 1: v
        add  $a1, $s1, $zero      # argument 2: j
        jal  swap
        addi $s1, $s1, -1         # j -= 1
        j    for2tst
exit2:  addi $s0, $s0, 1          # i += 1
        j    for1tst
exit1:  lw   $s0, 0($sp)          # restore registers
        lw   $s1, 4($sp)
        lw   $s2, 8($sp)
        lw   $s3, 12($sp)
        lw   $ra, 16($sp)
        addi $sp, $sp, 20
        jr   $ra
\`\`\`

**Notes:**
- The C condition \`j >= 0 && v[j] > v[j+1]\` becomes two exits, tested in order, so \`v[j]\` is never read when j < 0 (C's short-circuit \`&&\`).
- \`v[j] > v[j+1]\` is written as \`v[j+1] < v[j]\` with \`slt\`.

**Trace:** sorting {5, 2, 9, 1, 7} gives {1, 2, 5, 7, 9}.`,

  "7b": md`**The target is not a valid instruction address.** MIPS instructions are 32-bit words at **word-aligned** addresses (multiples of 4). $\texttt{0x40000001}$ is not a multiple of 4 (its low two bits are 01), so no instruction starts there:
- \`j\` cannot even express it: the target is formed as (PC + 4)[31–28] : 26-bit field : **00**, so its low two bits are always 0.
- \`jr\` with a register holding $\texttt{0x40000001}$ would cause an **address error exception** on the instruction fetch.

**Jumping to the instruction that holds this byte**, at $\texttt{0x40000000}$:

\`\`\`
        lui  $t0, 0x4000          # $t0 = 0x4000 0000
        jr   $t0                  # jump to it, from anywhere
\`\`\`

\`lui\` + \`jr\` works from **any** PC, because \`jr\` uses the full 32-bit register value.

A single \`j 0x40000000\` (address field $\texttt{0x40000000}/4 = \texttt{0x1000000}$) works **only** if the jump itself is in the same 256 MB region, i.e. PC + 4 starts with hex digit 4 ($\texttt{0x4000 0000}$–$\texttt{0x4FFF FFFF}$), because \`j\` keeps the top 4 bits of PC + 4.`,

  "8c": b16Solutions["6c"],
}
