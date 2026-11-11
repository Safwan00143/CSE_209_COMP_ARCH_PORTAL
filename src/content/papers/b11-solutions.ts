import { md } from "../md"
import { after } from "./compose"
import { b13Solutions } from "./b13-solutions"
import { b16Solutions } from "./b16-solutions"
import { b17Solutions } from "./b17-solutions"
import { b19Solutions } from "./b19-solutions"
import { accessTable, simulateCache, type CacheConfig } from "@/lib/cache"
import { encode, SINGLE } from "@/lib/ieee"
import { assemble, parse } from "@/lib/mips"

const fx = (x: number, k = 4) => String(Number(x.toFixed(k)))

/* ───── Q1(b) ───── */
export const Q1B_SEQ = [0, 2, 4, 0, 2, 4, 0, 2, 4]
export const Q1B_CFG: CacheConfig = { sets: 2, ways: 2 }
const r1b = simulateCache(Q1B_CFG, Q1B_SEQ)

/* ───── Q3(b) ───── */
const m075 = encode(-0.75, SINGLE)

/* ───── Q5(b) ───── */
export const Q5B = { counts: [20, 40, 100, 40], p1: { ghz: 3, cpi: [1, 2, 3, 4] }, p2: { ghz: 2, cpi: [2, 2, 2, 2] } }
const cyc = (cpi: number[]) => Q5B.counts.reduce((t, n, i) => t + n * cpi[i], 0)
const c1 = cyc(Q5B.p1.cpi)
const c2 = cyc(Q5B.p2.cpi)

/* ───── Q6(b) ───── */
export const Q6B_SRC = "lw $t0, 4($s0)\nlw $t1, 8($s0)\nsub $t0, $t0, $t1\nsw $t0, 12($s0)"
const q6 = assemble(parse(Q6B_SRC), 0)

/* ───── Q7(d) ───── */
const sp = (n: number) => (n * 800) / ((n + 4) * 200)

export const b11Solutions: Record<string, string> = {
  "1a": md`- **Temporal locality** (locality in time): if an item is referenced, it will tend to be referenced again soon. Examples: instructions in a loop, loop counters, a running sum.
- **Spatial locality** (locality in space): if an item is referenced, items whose addresses are close by will tend to be referenced soon. Examples: sequential instruction execution, accessing the elements of an array in order.

Caches use both: they keep recently used items (temporal) and fetch whole blocks of neighbouring words (spatial).`,

  "1b": md`Four blocks, two-way set associative: **2 sets** of 2 blocks. Set = block address mod 2. All three addresses 0, 2, 4 are even, so they all map to **set 0**, which holds only two blocks.

${accessTable(r1b, Q1B_CFG)}

**Hits: ${r1b.hits}** (${r1b.misses} misses). Three blocks cycle through a set that holds two, in the same order each time, so LRU always evicts exactly the block that is needed next: each access replaces the block that will be requested two accesses later.

(A cache that could hold all three, such as a 4-block fully associative cache, would hit on the last 6 accesses.)`,

  "1c": md`A memory system is **coherent** if:

1. **Program order is preserved.** A read by processor P of location X that follows a write by P to X, with no writes to X by another processor in between, always returns the value written by P.
2. **Coherent view of memory.** A read by a processor of location X that follows a write by **another** processor to X returns the written value, if the read and the write are sufficiently separated in time and no other writes to X occur in between.
3. **Write serialisation.** Writes to the same location are serialised: two writes to the same location by any two processors are seen in the **same order** by all processors. (E.g. if 1 then 2 is written to X, no processor can read 2 and later read 1.)`,

  "1d": md`Without a TLB, every memory access needs **two** memory accesses:
1. one to read the page-table entry from the page table in **main memory**, to translate the virtual address to a physical address;
2. one to access the data (or instruction) itself.

So every load, store and instruction fetch takes about **twice as long**, even when the data is in the cache (the page-table access itself may also miss in the cache). The TLB removes this cost by caching recently used translations inside the processor: thanks to locality, almost all translations hit in the TLB.`,

  "1e": md`**Address fields** for a 32-bit byte address:
- **Byte offset:** 1 word = 4 bytes, so **2 bits**.
- **Word offset (block offset):** $2^{m}$ words per block, so **m bits**.
- **Index:** $2^{n}$ blocks, direct mapped, so **n bits**.
- **Tag:** everything else:
$$
\text{tag} = 32 - (n + m + 2)\ \text{bits}
$$

The total number of tag bits in the cache is $2^{n}\times(32 - n - m - 2)$. (Example: $n = 10$, $m = 0$: tag $= 32 - 10 - 0 - 2 = 20$ bits, the slides' 1024-block cache.)`,

  "2d": md`**Page table entries.** One entry per virtual page:
$$
\text{pages} = \frac{2^{32}\ \text{B}}{8\ \text{KB}} = \frac{2^{32}}{2^{13}} = 2^{19} = 524{,}288\ \text{entries}
$$

**Memory for the page table:**
$$
2^{19}\times4\ \text{B} = 2^{21}\ \text{B} = 2\ \text{MB}
$$

(The 4 GB of DRAM, $2^{32}$ bytes, has $2^{32}/2^{13} = 2^{19}$ physical pages, so a physical page number needs 19 bits, which fits in the 4-byte entry with room for the valid, dirty and other bits. The page table is per process.)`,

  "2e": b17Solutions["7c"],

  "3a": b16Solutions["8b"],

  "3b": md`**Step 1: binary.**
$$
0.75 = \frac{1}{2} + \frac{1}{4} = 0.11_{two}
$$

**Step 2: normalise.**
$$
-0.75 = -0.11_{two} = -1.1_{two}\times2^{-1}
$$

**Step 3: fields.**
- Sign = **1** (negative).
- Exponent field = $-1 + 127 = 126 = ${m075.exponent}_{two}$.
- Fraction = the bits after the binary point, padded to 23 bits: $1000\ldots0$.

| Sign | Exponent (8 bits) | Fraction (23 bits) |
|---|---|---|
| ${m075.sign} | ${m075.exponent} | ${m075.fraction} |

$$
${m075.bits.match(/.{4}/g)!.join("\\ ")} = \texttt{0x${parseInt(m075.bits, 2).toString(16).toUpperCase()}}
$$

**Check:** $(-1)^{1}\times(1 + 0.5)\times2^{126 - 127} = -1.5\times0.5 = -0.75$.`,

  "3c": md`With no separate multiplier register, this is the **refined** multiplier: the multiplier is placed in the right half of the Product register.

${after(b16Solutions["5a"], "**Refined version: hardware and flowchart.**")}

**Why it works:** each iteration uses one multiplier bit (Product0) and then shifts the Product right, which both moves the partial product into position and brings the next multiplier bit into Product0. After 32 iterations the multiplier bits have all been shifted out and the Product register holds the 64-bit product.`,

  "5a": md`**Moore's Law:** the number of transistors on an integrated circuit doubles about every 18–24 months (Gordon Moore, 1965). It has driven the steady growth in processor performance and memory capacity, and computer designers must design for the technology that will exist when their product ships.

**Response time (execution time):** the total time to complete **one task**, from start to finish, including disk and memory accesses, I/O and OS overhead. It matters to an individual user.

**Throughput (bandwidth):** the **total work done per unit time**, e.g. tasks or transactions per hour. It matters to a server or data-centre manager.

Replacing a processor with a faster one improves both; adding more processors to a system improves throughput but not the response time of a single task (unless the task is parallel).`,

  "5b": md`**Instruction counts** (200 instructions): A $= 10\%\times200 = 20$, B $= 40$, C $= 100$, D $= 40$.

**(i) Clock cycles.**
$$
\text{P1: } 20\times1 + 40\times2 + 100\times3 + 40\times4 = 20 + 80 + 300 + 160 = ${c1}
$$
$$
\text{P2: } 200\times2 = ${c2}
$$

**(ii) Execution time** = cycles / clock rate:
$$
T_{P1} = \frac{${c1}}{3\times10^{9}} = ${fx(c1 / 3, 2)}\ \text{ns},\qquad T_{P2} = \frac{${c2}}{2\times10^{9}} = ${fx(c2 / 2, 2)}\ \text{ns}
$$
**P1 is faster**, by $${fx(c2 / 2, 2)}/${fx(c1 / 3, 2)} \approx ${fx(c2 / 2 / (c1 / 3), 3)}$ times (it needs more cycles, but its clock is faster).

**(iii) Global CPI** = cycles / instructions:
$$
\text{CPI}_{P1} = \frac{${c1}}{200} = ${c1 / 200},\qquad \text{CPI}_{P2} = \frac{${c2}}{200} = ${c2 / 200}
$$`,

  "5c": md`**Amdahl's Law:** the performance improvement from a faster mode of execution is limited by the fraction of the time that mode is used. The part that is not improved remains, however fast the improved part becomes.
$$
T_{\text{improved}} = \frac{T_{\text{affected}}}{\text{improvement factor}} + T_{\text{unaffected}}
$$

**The program:** 100 s in total, 80 s in division, 20 s in everything else. A 4× overall improvement means 25 s:
$$
25 = \frac{80}{n} + 20 \quad\Longrightarrow\quad \frac{80}{n} = 5 \quad\Longrightarrow\quad n = 16
$$
Division must become **16 times faster**.

(For comparison, a 5× overall improvement would need $80/n + 20 = 20$, i.e. infinitely fast division: impossible.)`,

  "5d": b13Solutions["2a"],

  "6a": md`**The four design principles of the MIPS ISA:**
1. **Simplicity favours regularity:** e.g. every arithmetic instruction has exactly three register operands; all instructions are 32 bits.
2. **Smaller is faster:** e.g. only 32 registers.
3. **Make the common case fast:** e.g. immediate operands for small constants; PC-relative branches for nearby targets.
4. **Good design demands good compromises:** e.g. three instruction formats (R, I, J), all 32 bits long, with fields kept in the same places.

**Starting a Java application:**
1. The **Java compiler** (javac) compiles the Java program into **Java bytecode** (class files), a portable instruction set for the Java Virtual Machine.
2. The **Java Virtual Machine (JVM)** loads the class files, together with the Java library routines they use, and links them.
3. The JVM's **interpreter** executes the bytecode, simulating the JVM instruction set on the host computer. This is portable but slow.
4. A **Just-In-Time (JIT) compiler** finds the frequently executed ("hot") methods at run time and compiles them into native machine code of the host, which then runs at full speed. Compiled code is kept for later runs of those methods.`,

  "6b": md`**MIPS code.** A[1], A[2], A[3] are at byte offsets 4, 8 and 12 from the base in \`$s0\`.

\`\`\`
lw  $t0, 4($s0)      # $t0 = A[1]
lw  $t1, 8($s0)      # $t1 = A[2]
sub $t0, $t0, $t1    # $t0 = A[1] - A[2]
sw  $t0, 12($s0)     # A[3] = $t0
\`\`\`

**Machine code** (\`$s0\` = 16, \`$t0\` = 8, \`$t1\` = 9):

| Instruction | Format | op | rs | rt | rd | shamt | funct / offset |
|---|---|---|---|---|---|---|---|
| \`lw $t0, 4($s0)\` | I | ${q6[0].enc.fields[0][1]} | ${q6[0].enc.fields[1][1]} | ${q6[0].enc.fields[2][1]} | | | ${q6[0].enc.fields[3][1]} |
| \`lw $t1, 8($s0)\` | I | ${q6[1].enc.fields[0][1]} | ${q6[1].enc.fields[1][1]} | ${q6[1].enc.fields[2][1]} | | | ${q6[1].enc.fields[3][1]} |
| \`sub $t0, $t0, $t1\` | R | ${q6[2].enc.fields.map((f) => f[1]).join(" | ")} |
| \`sw $t0, 12($s0)\` | I | ${q6[3].enc.fields[0][1]} | ${q6[3].enc.fields[1][1]} | ${q6[3].enc.fields[2][1]} | | | ${q6[3].enc.fields[3][1]} |

**In binary:**

| Instruction | Machine word |
|---|---|
${q6.map((x) => `| \`${x.ins.text}\` | ${x.enc.fields.map(([, v, w]) => v.toString(2).padStart(w, "0")).join(" ")} |`).join("\n")}

(In the I-format, rt is the loaded or stored register and rs the base; in the R-format \`sub\`, rd = 8 is the destination and funct = 34.)`,

  "6c": md`**Register use:** n in \`$a0\`, result in \`$v0\`. n must survive the recursive call, so it is saved with \`$ra\`.

\`\`\`
sum:    slti $t0, $a0, 1          # $t0 = 1 if n < 1, i.e. n <= 0
        beq  $t0, $zero, L1       # n > 0: recursive case
        add  $v0, $zero, $zero    # return 0
        jr   $ra
L1:     addi $sp, $sp, -8         # save $ra and n
        sw   $ra, 4($sp)
        sw   $a0, 0($sp)
        addi $a0, $a0, -1         # argument n - 1
        jal  sum                  # $v0 = sum(n - 1)
        lw   $a0, 0($sp)          # restore n and $ra
        lw   $ra, 4($sp)
        addi $sp, $sp, 8
        add  $v0, $a0, $v0        # return n + sum(n - 1)
        jr   $ra
\`\`\`

\`n <= 0\` is tested as \`n < 1\` with \`slti\`, since MIPS has set-on-less-than but no set-on-less-or-equal.

**Trace:** sum(3) = 3 + sum(2) = 3 + 2 + sum(1) = 3 + 2 + 1 + sum(0) = 6.`,

  "6d": md`A conditional branch has only a 16-bit offset (±32K words from PC + 4). The assembler replaces it with the **opposite** branch over an unconditional **jump**, which has a 26-bit address field:

\`\`\`
        bne  $s0, $s1, L2     # condition false: skip the jump
        j    L1               # condition true: jump to the far target
L2:
\`\`\`

\`j\` reaches any address in the current 256 MB region.`,

  "7a": md`**The two instructions** (an atomic read-modify-write is built from a pair):
- **\`ll rt, offset(rs)\` (load linked):** loads the word at the address and remembers ("links") the address.
- **\`sc rt, offset(rs)\` (store conditional):** stores rt to the address **only if** the location has not been changed since the matching \`ll\`. It then sets rt to **1** if the store succeeded, or **0** if it failed (nothing is stored). On failure the sequence is retried.

If any other processor writes the location between the \`ll\` and the \`sc\`, the \`sc\` fails, so the read-modify-write cannot be interleaved with another write.

**A[0] = X atomically** (base of A in \`$s1\`, X in \`$s2\`):

\`\`\`
try:    ll   $t1, 0($s1)          # load linked A[0] (old value in $t1)
        add  $t0, $zero, $s2      # $t0 = X, the value to store
        sc   $t0, 0($s1)          # try to store X into A[0]
        beq  $t0, $zero, try      # sc failed (A[0] changed): retry
\`\`\`

After the loop, A[0] = X, and \`$t1\` holds the value A[0] had just before the atomic update (so this is an atomic exchange). Note that \`sc\` overwrites its register with the success flag, which is why X is first copied to \`$t0\`.`,

  "7b": b16Solutions["6a"],

  "7c": md`The datapath combines the R-format, store and branch paths with multiplexers; the control unit decodes the opcode.

\`\`\`fig
dp-full
\`\`\`

(The load path to the register file and the jump path are present in the figure but not needed for these three instructions.)

**Components:**
1. **PC**, **instruction memory**, and an **adder** for PC + 4.
2. **Register file** with two read ports (rs, rt) and one write port; the write register is **rd** (\`add\`).
3. **Sign-extend** unit for the 16-bit offset (\`sw\`, \`beq\`).
4. **ALUSrc mux:** the ALU's second operand is rt (\`add\`, \`beq\`) or the extended offset (\`sw\`).
5. **ALU** with **ALU control**: add for \`add\` and for the \`sw\` address; subtract for \`beq\` (Zero = 1 if equal).
6. **Data memory:** \`sw\` writes Read data 2 (register rt) at the ALU's address.
7. **Branch target:** shift-left-2 of the extended offset and an adder with PC + 4.
8. **PCSrc mux:** next PC = branch target if Branch AND Zero, else PC + 4.

**Control signals:**

| Instruction | RegDst | ALUSrc | MemtoReg | RegWrite | MemRead | MemWrite | Branch | ALUOp |
|---|---|---|---|---|---|---|---|---|
| add | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 10 |
| sw | X | 1 | X | 0 | 0 | 1 | 0 | 00 |
| beq | X | 0 | X | 0 | 0 | 0 | 1 | 01 |`,

  "7d": md`**The five stages of the MIPS pipeline:**
1. **IF:** instruction fetch from memory.
2. **ID:** instruction decode and register read.
3. **EX:** execute the operation or calculate an address.
4. **MEM:** access a data memory operand.
5. **WB:** write the result back to a register.

\`\`\`fig
pipe-stages
\`\`\`

**Single-cycle:** clock period $= 200 + 100 + 200 + 200 + 100 = 800$ ps. **Pipelined:** clock period = slowest stage $= 200$ ps; $n$ instructions take $(n + 4)$ cycles.

**3 lw:**
$$
\text{Speed-up} = \frac{3\times800}{7\times200} = \frac{2400}{1400} \approx ${fx(sp(3), 3)}
$$

**With 1,000,000 more lw** ($n = 1{,}000{,}003$):
$$
\text{Speed-up} = \frac{1{,}000{,}003\times800}{1{,}000{,}007\times200} \approx ${fx(sp(1000003), 5)}
$$
The speed-up approaches the ratio of the clock periods, $800/200 = 4$, as the pipeline-fill time becomes negligible.`,

  "8a": b13Solutions["2c"],

  "8b": md`**Dependences** (a later instruction reads a register written by an earlier one, close enough to be a hazard in the 5-stage pipeline):

| # | Producer | Consumer | Register | Distance | Resolved by |
|---|---|---|---|---|---|
| 1 | \`add $s0\` | \`sub $t2, $s0, $t3\` | \`$s0\` | 1 | forwarding EX/MEM → EX |
| 2 | \`lw $s1\` | \`sub $t4, $s1, $t2\` | \`$s1\` | 1 | **load-use**: 1 stall, then forwarding MEM/WB → EX |
| 3 | \`sub $t2\` | \`sub $t4, $s1, $t2\` | \`$t2\` | 2 | forwarding MEM/WB → EX; here the stall for hazard 2 delays \`sub $t4\` one more cycle, so \`$t2\` has been written back and is read from the register file |

**There are 3 data hazards.** (\`lw\` reads \`$t1\`, which nobody writes, so it has no hazard.)

**Techniques to eliminate them:**
1. **Forwarding (bypassing):** take results from the EX/MEM and MEM/WB pipeline registers straight to the ALU inputs. This removes hazards 1 and 3 completely.
2. **Stall (bubble) by the hazard detection unit:** forwarding cannot remove the load-use hazard 2 by itself: the loaded value is ready only at the end of MEM. One bubble is inserted. With forwarding, the code takes $5 + 3 + 1 = 9$ cycles.
3. **Code scheduling (reordering):** \`lw $s1, 20($t1)\` depends on nothing before it, so it can move up, after \`add\`:

\`\`\`
add $s0, $t0, $t1
lw  $s1, 20($t1)     # moved up
sub $t2, $s0, $t3
sub $t4, $s1, $t2
\`\`\`

Now \`sub $t4\` uses \`$s1\` two instructions after the load, so forwarding alone suffices: **no stalls**, 8 cycles. (\`sub $t2\` now gets \`$s0\` from MEM/WB, and \`sub $t4\` gets \`$t2\` from EX/MEM.)

Without forwarding, each hazard would have to wait for the value to be written back (write in the first half, read in the second half of the cycle): many more stalls.`,

  "8c": b19Solutions["1c"],

  "8d": b19Solutions["1d"],
}

