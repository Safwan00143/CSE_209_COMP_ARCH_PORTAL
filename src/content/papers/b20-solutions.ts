import { md } from "../md"
import { accessTable, simulateCache, totalBits, type CacheConfig } from "@/lib/cache"
import { range } from "@/lib/ieee"

export const Q2A_SEQ = [32, 36, 35, 32, 48, 32, 51, 35]
const dm: CacheConfig = { sets: 8, ways: 1 }
const sa: CacheConfig = { sets: 4, ways: 2 }
const rDm = simulateCache(dm, Q2A_SEQ)
const rSa = simulateCache(sa, Q2A_SEQ)
const t2b = totalBits({ addressBits: 32, dataBytes: 4096 * 16, blockBytes: 16, ways: 8 })
const fmt8b = { expBits: 12, fracBits: 19 }
const r8b = range(fmt8b)

export const b20Solutions: Record<string, string> = {
  "1a": md`**Step 1: the dependences.**
- ins 2 (\`and $2, $2, $5\`) reads \`$2\`, written by ins 1 (\`sub\`).
- ins 3 (\`or $6, $2, $7\`) reads \`$2\`, written by ins 2 (\`and\`), the most recent writer.

**Step 2: the rule without forwarding.** A register is written in the first half of WB and read in the second half of ID, so a consumer's ID can be no earlier than its producer's WB cycle.
- \`sub\` is in WB in cycle 5, so \`and\` must stay in ID until cycle 5: it entered ID in cycle 3, so **2 stalls**.
- \`and\` is then in WB in cycle 8, so \`or\` must stay in ID until cycle 8: **2 more stalls**.

\`\`\`fig
b20-1a
\`\`\`

**Step 3: total.**
$$
\text{cycles} = n + 4 + \text{stalls} = 3 + 4 + 4 = 11
$$`,

  "1b": md`**Step 1: forwarding paths.**
- \`and\` needs \`$2\` in its EX (cycle 4). \`sub\` computed it at the end of its EX (cycle 3), so in cycle 4 it is in the **EX/MEM** register: forward EX/MEM → ALU input A.
- \`or\` needs \`$2\` in its EX (cycle 5). Now **both** later pipeline registers hold a value for \`$2\`:
  - EX/MEM holds \`and\`'s result (the newest value of \`$2\`);
  - MEM/WB holds \`sub\`'s result (an older value of \`$2\`).
  The correct value is the newest: forward from **EX/MEM**.

\`\`\`fig
b20-1b
\`\`\`

Every instruction moves through IF/ID, ID/EX, EX/MEM and MEM/WB without waiting. No stalls:
$$
\text{cycles} = 3 + 4 + 0 = 7
$$
(down from 11).

**Step 2: the double data hazard.** In cycle 5, \`or\`'s source \`$2\` matches the destination in EX/MEM **and** the destination in MEM/WB. Both forwarding conditions are true at once. If the MEM/WB condition were obeyed, \`or\` would get \`sub\`'s stale value and compute a wrong result. The fix is to give EX/MEM priority: forward from MEM/WB only if the EX/MEM condition is false:

\`\`\`
if (MEM/WB.RegWrite and (MEM/WB.RegisterRd ≠ 0)
    and not (EX/MEM.RegWrite and (EX/MEM.RegisterRd ≠ 0)
             and (EX/MEM.RegisterRd = ID/EX.RegisterRs))
    and (MEM/WB.RegisterRd = ID/EX.RegisterRs))  ForwardA = 01
\`\`\``,

  "1c": md`In cycle 4, ins 1 (\`sub $2, $1, $3\`) is in MEM, so its destination is in the EX/MEM register; ins 2 (\`and $2, $2, $5\`) is in EX, its sources in ID/EX. \`$2\` is ins 2's **first** source (rs), so the forwarding goes to ALU input A:

\`\`\`
if (EX/MEM.RegWrite
    and (EX/MEM.RegisterRd ≠ 0)
    and (EX/MEM.RegisterRd = ID/EX.RegisterRs))
  ForwardA = 10
\`\`\`

- \`EX/MEM.RegWrite\` = 1: sub writes a register.
- \`EX/MEM.RegisterRd\` = 2 ≠ 0: the destination is not \`$zero\`.
- \`EX/MEM.RegisterRd\` = 2 = \`ID/EX.RegisterRs\`: and's rs is \`$2\`.

All three hold, so ForwardA = 10: the first ALU operand comes from EX/MEM (sub's ALU result) instead of the register file.`,

  "2a": md`8 blocks in each cache.
- **Direct mapped:** 8 sets of 1, index = block mod 8.
- **2-way set associative:** 4 sets of 2, set = block mod 4.

LRU replacement within a set.

**(i) Direct mapped**

${accessTable(rDm, dm)}

**Why:** 32, 48 and 56 all map to index 0; 35 and 51 both map to index 3. Only the second access to 32 hits: 48 evicts 32, then 32 evicts 48; 51 evicts 35, then 35 evicts 51.

**(i) Two-way set associative** (set = block mod 4: 32, 36 and 48 go to set 0; 35 and 51 to set 3; columns Set s.w show set s, way w):

${accessTable(rSa, sa)}

**Why:**
- 32 and 36 fill set 0.
- 32 hits.
- 48 arrives: set 0 holds 32 (just used) and 36 (least recently used), so **36** is replaced.
- 32 hits again.
- 35 and 51 share set 3, which has room for both, so 35 hits at the end.

**(ii) Hit ratios.**
$$
\text{Direct mapped: } \frac{${rDm.hits}}{8} = ${rDm.hitRate}\qquad \text{Two-way: } \frac{${rSa.hits}}{8} = ${rSa.hitRate}
$$
The 2-way cache hits three times as often, because the blocks that collide in the direct-mapped cache can now coexist in a set.`,

  "2b": md`**Step 1: offset.** 16-byte blocks: $\log_2 16 = 4$ bits (2 word + 2 byte).

**Step 2: sets and index.**
$$
\#\text{sets} = \frac{4\text{K blocks}}{8} = \frac{4096}{8} = ${t2b.sets}\qquad\text{index} = \log_2 ${t2b.sets} = ${t2b.split.index}\ \text{bits}
$$

**Step 3: tag.**
$$
\text{tag} = 32 - ${t2b.split.index} - 4 = ${t2b.split.tag}\ \text{bits}
$$

**Step 4: bits per block.** Data $16\times8 = 128$ bits, plus the tag and a valid bit:
$$
128 + ${t2b.split.tag} + 1 = ${t2b.perBlock}\ \text{bits}
$$

**Step 5: total.**
$$
4096\times${t2b.perBlock} = ${t2b.total.toLocaleString("en-US")}\ \text{bits} = ${t2b.total / 1024}\ \text{Kibits}
$$
Of these, the tags take $4096\times${t2b.split.tag} = ${t2b.tagBits.toLocaleString("en-US")}$ bits = ${t2b.tagBits / 1024} Kibits. (LRU bits, if counted, would add more.)`,

  "3a": md`**Step 1: memory penalty in cycles.**
$$
\frac{150\ \text{ns}}{0.5\ \text{ns}} = 300\ \text{cycles}
$$

**(i) One level of caching.**
$$
\text{CPI} = 2.0 + 0.05\times300 = 2.0 + 15 = 17.0
$$
An ideal CPU (all hits) has CPI 2.0, with the same instruction count and clock, so it is
$$
\frac{17.0}{2.0} = 8.5\ \text{times faster}
$$

**(ii) Two levels.** L2 access: $15/0.5 = 30$ cycles for every primary miss (5%); main memory (300 cycles) for the 0.5% that also miss in L2.
$$
\text{CPI} = 2.0 + 0.05\times30 + 0.005\times300 = 2.0 + 1.5 + 1.5 = 5.0
$$

**(iii) Speed-up from adding L2.**
$$
\frac{17.0}{5.0} = 3.4
$$
The processor with two levels of caching is **3.4 times faster**.`,

  "3b": md`**Virtual address:** the address a program's instructions use, in the program's own private address space, as generated by the compiler and linker (e.g. every program's code can start at 0040 0000 hex).

**Physical address:** the actual location in main memory (DRAM) where the byte is stored.

The CPU and OS **translate** each virtual address to a physical address: the virtual page number is replaced by a physical page number through the page table (cached in the TLB), and the page offset is kept.

**Purpose of virtual addressing:**
- **Sharing memory safely:** many programs run at once, each in its own virtual address space, **protected** from the others.
- **Relocation:** a program can be loaded anywhere in physical memory (its pages need not even be contiguous) without changing its addresses.
- **Memory as a cache for disk:** a program can be larger than physical memory; only the pages in use need to be in DRAM, the rest stay on disk.`,

  "3c": md`**Step 1: page offset.** 8 KB $= 2^{13}$ bytes, so the offset is 13 bits.

**Step 2: virtual page number.**
$$
64 - 13 = 51\ \text{bits}
$$

**Step 3: entries.** A page table has one entry per virtual page:
$$
2^{51} \approx 2.25\times10^{15}\ \text{entries}
$$

(The physical page number in each entry is $30 - 13 = 17$ bits, but the number of entries depends only on the virtual address.)`,

  "4a": md`**Step 1: the formula.** The 16-bit address field is a signed **word** offset from the instruction after the branch:
$$
\text{Branch target address} = (\text{PC} + 4) + \text{sign-extend}(\text{address}_{15:0})\times4
$$
equivalently $(\text{PC} + 4) + (\text{sign-extend}(\text{address}) \ll 2)$, a 32-bit result.

- PC + 4, because the PC has already been incremented when the offset is used.
- Sign extension to 32 bits, so branches can go backward.
- × 4 (shift left 2), because instructions are word-aligned: the offset counts words.

**Step 2: the datapath for beq.**

\`\`\`fig
dp-beq
\`\`\`

The units beq uses:
1. **PC → instruction memory:** fetch.
2. **PC + 4 adder:** the default next PC.
3. **Register file:** read rs (bits 25–21) and rt (bits 20–16).
4. **ALU** (ALUSrc = 0, ALUOp = 01, so it subtracts): rs − rt; **Zero** = 1 if they are equal.
5. **Sign-extend** bits 15–0 to 32 bits, **shift left 2**, and a **branch adder** computing (PC + 4) + offset × 4.
6. **AND gate:** PCSrc = Branch · Zero.
7. **PCSrc mux:** PC + 4 (not taken) or the branch target (taken), into the PC.

Control for beq: Branch = 1, ALUSrc = 0, ALUOp = 01, RegWrite = 0, MemRead = MemWrite = 0 (RegDst, MemtoReg don't care). Data memory is not needed and is left out.`,

  "4b": md`**The four components moved or added in the ID stage:**
1. **Shift left 2** on the sign-extended offset.
2. **Branch target adder**, computing (PC + 4) + offset × 4 in ID instead of EX.
3. **Register comparator (=)**, testing Reg[rs] = Reg[rt] directly at the register-file outputs, instead of subtracting in the ALU.
4. **IF.Flush** logic, which zeroes the instruction field of the IF/ID register when the branch is taken, turning the wrongly fetched instruction into a nop.

**How the decision and the target are ready by the end of ID** (the figure's example: \`40: beq $1, $3, 7\` taken, with \`44: and …\` fetched behind it):
1. In ID, the register file is read in the second half of the cycle, and the **comparator** checks \`$1\` = \`$3\` at once (an equality test is much faster than a full ALU subtraction, so it fits in ID). Forwarding paths into ID supply any operand still in a later pipeline register.
2. In parallel, the **shift left 2** and the **adder** compute the target $(40 + 4) + 7\times4 = 72$ from PC + 4 (carried in IF/ID) and the sign-extended offset.
3. If equal, the branch is taken: **PCSrc** selects 72 as the next PC, and **IF.Flush** zeroes the \`and\` already fetched into IF/ID.

So only one instruction is fetched behind the branch: the taken-branch penalty falls from 3 cycles (decided in MEM) to **1 cycle**.`,

  "5a": md`**Yes, Ross is right**: not all four are needed.

- **shu is unnecessary.** A store writes only the low 16 bits of the register to memory. There is nothing to extend, so a "signed" and an "unsigned" store would do exactly the same thing. That is why MIPS has \`sh\` but no \`shu\`.
- **lh vs lhu.** Loads must choose how to fill the upper 16 bits of the register: sign-extend (\`lh\`, for signed 16-bit integers) or zero-extend (\`lhu\`). Characters are not signed numbers: Unicode characters in UTF-16 are 16-bit unsigned codes. So for text, **\`lhu\` and \`sh\`** are what is used.

So for multi-language (Unicode) support, \`lhu\` and \`sh\` suffice. \`lh\` is still useful for signed halfword data in general, which is why MIPS includes \`lh\`, \`lhu\` and \`sh\`, but \`shu\` would add nothing.`,

  "5b": md`**The building block.** Stage i of a parallel subtractor computes $X_i - Y_i - Z_i$, where $Z_i$ is the borrow in:
$$
F_i = X_i\oplus Y_i\oplus Z_i,\qquad \text{borrow out} = X_i'Y_i + X_i'Z_i + Y_iZ_i
$$
The whole subtractor computes $F = X - Y - B_{in}$ (mod $2^4$). With all borrows 0, $F_i = X_i\oplus Y_i$, which gives the logic operations.

**Step 1: write each arithmetic operation as $X - Y - B_{in}$.** Use $\overline{A} = -A - 1$ and $\overline{B} = -B - 1$:

| $S_2S_1S_0$ | Operation | $X$ | $Y$ | $B_{in}$ | Why |
|---|---|---|---|---|---|
| 000 | $A - B$ | $A$ | $B$ | 0 | |
| 001 | $A + B$ | $A$ | $\overline{B}$ | 1 | $A - \overline{B} - 1 = A - (-B-1) - 1 = A + B$ |
| 010 | $-A - B - 2$ | $\overline{A}$ | $B$ | 1 | $\overline{A} - B - 1 = (-A-1) - B - 1$ |
| 011 | $B - A$ | $\overline{A}$ | $\overline{B}$ | 0 | $\overline{A} - \overline{B} = (-A-1) - (-B-1)$ |

**Step 2: logic operations** ($S_2 = 1$, borrows forced to 0, $F_i = X_i\oplus Y_i$):
- XOR (100): $X_i = A_i$, $Y_i = B_i$.
- AND (110): $X_i = A_i$, $Y_i = A_iB_i'$, since $A_i\oplus A_iB_i' = A_i(1\oplus B_i') = A_iB_i$.

**Step 3: $X_i$.** $A_i'$ only for 010 and 011 ($S_2 = 0$, $S_1 = 1$):
$$
X_i = A_i\oplus S_2'S_1
$$

**Step 4: $Y_i$.**
- $S_2 = 0$: $B_i$ for 000 and 010, $B_i'$ for 001 and 011, i.e. $B_i\oplus S_0$.
- 100: $B_i$.
- 110: $A_iB_i'$.
$$
Y_i = S_2'(B_i\oplus S_0) + S_2S_1'B_i + S_2S_1A_iB_i'
$$

**Step 5: borrows.** A borrow in only for 001 and 010:
$$
B_{in} = Z_1 = S_2'(S_1\oplus S_0)
$$
The borrow chain is cut for the logic operations:
$$
Z_i = S_2'\cdot(\text{borrow out of stage } i-1)
$$

**Check (001, $A = 0101$, $B = 0011$):** $X = 0101$, $Y = \overline{B} = 1100$, $B_{in} = 1$: $0101 - 1100 - 1 = 5 - 12 - 1 = -8 \equiv 8 = 1000 = 5 + 3$. All six operations were verified on every pair of 4-bit inputs (codes 101 and 111 are unused).`,

  "5c": md`**Step 1: the memory layout.** Text starts at 0040 0000 (hex); static data starts at 1000 0000 (hex); \`$gp\` = 1000 8000 (hex).

**Step 2: place the text segments.**
- Procedure A's text: 0040 0000 to 0040 014F (size 150 hex).
- Procedure B's text follows: 0040 0000 + 150 = **0040 0150** (hex), to 0040 049F (size 350 hex).

**Step 3: place the data segments.**
- A's data: 1000 0000 to 1000 003F (size 40 hex), so **X = 1000 0000**.
- B's data follows: 1000 0000 + 40 = 1000 0040, so **Y = 1000 0040** (to 1000 008F, size 50 hex).

**Step 4: patch the relocation entries.**

*\`lw $a0, X($gp)\` (A, address 0).* The offset from \`$gp\`:
$$
\texttt{1000\,0000} - \texttt{1000\,8000} = -\texttt{8000}\ (\text{hex})
$$
As a 16-bit two's-complement field: 8000 (hex).

*\`jal B\` (A, address 4).* B starts at 0040 0150. The jump field is the word address:
$$
\texttt{0040\,0150}/4 = \texttt{10\,0054}\ (\text{hex})
$$

*\`sw $a1, Y($gp)\` (B, address 0).*
$$
\texttt{1000\,0040} - \texttt{1000\,8000} = -\texttt{7FC0}\ (\text{hex})
$$
As a 16-bit field: 8040 (hex).

*\`jal A\` (B, address 4).* A starts at 0040 0000; field $= \texttt{0040\,0000}/4 = \texttt{10\,0000}$ (hex).

**Step 5: the executable.**

| | | |
|---|---|---|
| Executable file header | Text size | 4A0 (hex) (= 150 + 350) |
| | Data size | 90 (hex) (= 40 + 50) |
| Text segment | Address | Instruction |
| | 0040 0000 | \`lw $a0, 8000hex($gp)\` |
| | 0040 0004 | \`jal 40 0150hex\` |
| | … | … |
| | 0040 0150 | \`sw $a1, 8040hex($gp)\` |
| | 0040 0154 | \`jal 40 0000hex\` |
| | … | … |
| Data segment | 1000 0000 | (X) |
| | … | … |
| | 1000 0040 | (Y) |
| | … | … |`,

  "6a": md`**Disagree** in general.
$$
\text{Clock cycles} = \text{Instruction count}\times\text{CPI}
$$
The number of cycles equals the number of instructions only if **CPI = 1** for every instruction.

- Different instruction classes take different numbers of cycles (e.g. a multiply or a load may take several), so the average CPI depends on the mix (slide example: 5 instructions needing 10 cycles, CPI 2.0).
- Pipeline stalls (hazards) and cache misses add cycles that execute no new instruction.
- In a pipeline, the first instruction needs several cycles to fill the pipeline ($n$ instructions take $n + 4$ cycles in 5 stages).
- With multiple issue, CPI < 1: there can be **fewer** cycles than instructions.

Only an ideal single-cycle machine (CPI exactly 1, with no stalls) satisfies Joey's claim.`,

  "6b": md`**The need.** When processors share memory, a read-modify-write of a shared variable (e.g. a lock) must be **atomic**: no other access to that location may happen between the read and the write. Otherwise there is a **data race**, and the result depends on the order of the accesses.

**MIPS provides an atomic pair of instructions:**
- \`ll rt, offset(rs)\` (**load linked**): loads the word and remembers the location.
- \`sc rt, offset(rs)\` (**store conditional**): stores rt to that location **only if it has not changed since the ll**. It puts **1** in rt on success, **0** on failure (nothing is stored).

**Example: atomic swap** of \`$s4\` with the lock at \`0($s1)\`:

\`\`\`
try: add $t0, $zero, $s4    # copy exchange value
     ll  $t1, 0($s1)        # load linked
     sc  $t0, 0($s1)        # store conditional
     beq $t0, $zero, try    # branch if the store failed: retry
     add $s4, $zero, $t1    # put the loaded value in $s4
\`\`\`

If another processor writes \`0($s1)\` between the \`ll\` and the \`sc\`, the \`sc\` fails and the loop retries, so the swap appears atomic. Locks (test-and-set) are built from this swap.`,

  "6c": md`**Register use:** x in \`$t1\`, y in \`$t2\`; \`$t3\`, \`$t4\` temporaries.

131075 does not fit in a 16-bit immediate: 131075 = 0002 0003 (hex), so build it with \`lui\` / \`ori\`.

\`\`\`
        lui  $t3, 2              # $t3 = 0x0002 0000
        ori  $t3, $t3, 3         # $t3 = 0x0002 0003 = 131075
        add  $t3, $t2, $t3       # $t3 = y + 131075
        slt  $t4, $t3, $t1       # $t4 = 1 if (y + 131075) < x, i.e. x > y + 131075
        beq  $t4, $zero, End     # condition false: skip
        addi $t1, $zero, 8       # x = 8
End:
\`\`\`

**Trace:** x = 200000, y = 10: y + 131075 = 131085 < 200000, so x becomes 8. With x = 100, y = 10: 100 < 131085, so x stays 100.`,

  "6d": md`**Step 1: average CPI of each implementation** (weights 20%, 25%, 40%, 15%):
$$
\text{CPI}_{P1} = 0.20\times2 + 0.25\times1 + 0.40\times3 + 0.15\times2 = 0.40 + 0.25 + 1.20 + 0.30 = 2.15
$$
$$
\text{CPI}_{P2} = 0.20\times2 + 0.25\times3 + 0.40\times2 + 0.15\times3 = 0.40 + 0.75 + 0.80 + 0.45 = 2.40
$$

**(i) Clock cycles** ($1.2\times10^{6}$ instructions):
$$
\text{P1: } 1.2\times10^{6}\times2.15 = 2.58\times10^{6}\ \text{cycles}
$$
$$
\text{P2: } 1.2\times10^{6}\times2.40 = 2.88\times10^{6}\ \text{cycles}
$$

**(ii) Execution time and comparison.**
$$
\text{P1: } \frac{2.58\times10^{6}}{2.7\times10^{9}\ \text{Hz}} = 0.956\ \text{ms}
$$
$$
\text{P2: } \frac{2.88\times10^{6}}{3.2\times10^{9}\ \text{Hz}} = 0.900\ \text{ms}
$$
**P2 is faster**, by
$$
\frac{0.956}{0.900} \approx 1.06\ \text{times}
$$
despite needing more cycles, because of its faster clock.

**(iii) Maximum improvement from improving 40% of the code** (Amdahl's law). With the improved fraction $F = 0.4$ made infinitely fast:
$$
\text{Speed-up}_{\max} = \frac{1}{(1 - F) + F/\infty} = \frac{1}{0.6} \approx 1.67
$$
No matter how much Sheldon speeds up that 40%, the other 60% limits the program to at most **1.67 times** faster. (This takes "40 percent of the code" as 40% of the execution time.)`,

  "7a": md`- **Response time** (execution time): the time from the start to the completion of **one** task.
- **Throughput** (bandwidth): the total amount of work done **per unit time**, e.g. tasks or transactions per hour.

**Not synonymous.** They measure different things and can change independently:
- Replacing the processor with a faster one improves both: each task finishes sooner, so more tasks finish per hour.
- Adding more processors (for independent tasks) improves **only throughput**: more tasks run at once, but no single task finishes sooner.

Conversely, a heavily loaded system can have high throughput while each user waits a long time (poor response time).`,

  "7b": md`The compiler keeps as many variables as possible in registers and **spills** the rest to memory.

- **Register allocation:** it puts the **most frequently used** variables (e.g. loop counters, variables in inner loops) in registers.
- **Spilling:** the remaining variables live in memory (on the stack, or in static data). Each use of a spilled variable needs a \`lw\` into a register, and each change needs a \`sw\` back.
- Variables whose lifetimes do not overlap can **share** a register, so 40 variables do not necessarily need 40 registers at once.

Registers are much faster than memory, and operating on memory data needs extra loads and stores, so this register optimisation is important. The design principle "smaller is faster" is why MIPS has only 32 registers, not more.`,

  "7c": md`**Plan.** a, b, c, d arrive in \`$a0\`–\`$a3\`. func(a, b) can be called directly (a and b are already in \`$a0\`, \`$a1\`). But c + d is needed **after** that call, and func may overwrite any \`$t\` and \`$a\` register, so compute c + d first (in \`$t0\`, the lowest-numbered temporary) and save it on the stack. \`$ra\` must be saved too, since f calls another procedure.

\`\`\`
f:      addi $sp, $sp, -8
        sw   $ra, 4($sp)          # save return address
        add  $t0, $a2, $a3        # $t0 = c + d
        sw   $t0, 0($sp)          # save it across the call
        jal  func                 # $v0 = func(a, b)
        add  $a0, $v0, $zero      # first argument: func(a, b)
        lw   $a1, 0($sp)          # second argument: c + d
        jal  func                 # $v0 = func(func(a, b), c + d)
        lw   $ra, 4($sp)          # restore return address
        addi $sp, $sp, 8
        jr   $ra                  # return $v0
\`\`\`

The result of the second call is already in \`$v0\`, so f returns it directly.

**Trace** with func(x, y) = x − y and f(10, 3, 4, 5): func(10, 3) = 7, c + d = 9, func(7, 9) = −2.`,

  "7d": md`**The main difference: when library code is joined to the program.**
- **Static linking:** the linker copies every library routine the program might call into the executable **before** it runs.
- **Dynamic linking:** library routines are linked and loaded **only when called**, at run time.

| | Static | Dynamic (DLL) |
|---|---|---|
| Executable size | large: all (transitively) referenced library code | small |
| New library version | needs relinking | picked up automatically |
| Unused routines | still loaded | never loaded |
| Library code | must be fixed at link time | must be relocatable |

**How a DLL routine is called: lazy linkage.**

\`\`\`fig
b20-lazy
\`\`\`

1. The program's call jumps **indirectly** through an entry in an **indirection table** (in its data segment), not straight to the routine.
2. **First call:** the table entry points to a **stub**. The stub loads an ID for the routine and jumps to the **dynamic linker/loader**.
3. The dynamic linker/loader finds the routine, maps it into memory (the dynamically mapped code), **patches the table entry** to the routine's address, and jumps to it.
4. **Every later call** goes through the table straight to the routine. The only overhead is one indirect jump.`,

  "8b": md`**Format:** 1 sign bit, 19 fraction bits, so $32 - 1 - 19 = 12$ exponent bits. With the usual bias $2^{12-1} - 1 = 2047$ (exponent fields 0 and 4095 reserved):
- largest actual exponent $= 4094 - 2047 = ${r8b.emax}$;
- smallest actual exponent $= 1 - 2047 = ${r8b.emin}$.

**(i) Precision.** 19 fraction bits plus the hidden 1 give a 20-bit significand. The relative precision is about $2^{-19}$:
$$
19\times\log_{10}2 \approx 19\times0.301 \approx 5.7\ \text{decimal digits}
$$
(about 6 significant decimal digits, a little less than single precision's 7).

**(ii) Smallest and largest absolute (normalised) values.**
- Smallest: exponent field 0000 0000 0001, fraction 0:
  $$
  1.0\times2^{-2046} \approx 1.0\times10^{-616}
  $$
- Largest: exponent field 1111 1111 1110, fraction all 1s:
  $$
  (2 - 2^{-19})\times2^{2047} \approx 3.2\times10^{616}
  $$

The range is far larger than single precision's ($10^{\pm38}$), because 4 bits moved from the fraction to the exponent: more range, less precision.

Part (iii), on denormalised numbers, is not covered in the lecture slides.`,

  "8c": md`**Key fact.** An IEEE float is sign | biased exponent | fraction. For **non-negative** floats, a larger value has a larger exponent field, or the same exponent and a larger fraction. So the larger value has the larger bit pattern read as an unsigned integer (this is the purpose of the bias). Negative floats use **sign-magnitude**: the same magnitude bits as the positive value, plus a sign bit of 1.

**(i) Unsigned integers: no, we cannot conclude $i_1 < i_2$ in general.**

| Case | $f_1 < f_2$ means | As unsigned integers | $i_1 < i_2$? |
|---|---|---|---|
| both ≥ 0 | magnitude of $f_1$ < magnitude of $f_2$ | sign bits both 0; larger magnitude → larger pattern | **yes** |
| $f_1 < 0 \le f_2$ | | $i_1$ has its top bit 1, so $i_1 \ge 2^{31} > i_2$ | **no** |
| both < 0 | $\lvert f_1\rvert > \lvert f_2\rvert$ | both top bits 1; $f_1$'s larger magnitude gives the larger pattern | **no**, $i_1 > i_2$ |

Example: $f_1 = -1.0$ (BF80 0000 hex) $< f_2 = 1.0$ (3F80 0000 hex), but as unsigned integers BF80 0000 > 3F80 0000.

**(ii) Signed (two's-complement) integers: still no in general.**

| Case | As signed integers | $j_1 < j_2$? |
|---|---|---|
| both ≥ 0 | same as unsigned (top bits 0) | **yes** |
| $f_1 < 0 \le f_2$ | $j_1$ is negative, $j_2$ non-negative | **yes** |
| both < 0 | both negative; the pattern with the larger magnitude bits is the **less negative** two's-complement number | **no**, $j_1 > j_2$ |

Example: $f_1 = -2.0$ (C000 0000 hex) $< f_2 = -1.0$ (BF80 0000 hex). As signed integers, C000 0000 = −1,073,741,824 and BF80 0000 = −1,082,130,432, so $j_1 > j_2$.

So the signed comparison works except when both numbers are negative, where the order is reversed (sign-magnitude versus two's complement). Hardware comparing floats with integer comparators must therefore handle the sign separately.`,
}
