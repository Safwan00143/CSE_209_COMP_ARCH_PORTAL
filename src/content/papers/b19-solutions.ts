import { md } from "../md"
import { before } from "./compose"
import { b22Solutions } from "./b22-solutions"
import { b21Solutions } from "./b21-solutions"
import { accessTable, simulateCache, type CacheConfig } from "@/lib/cache"

export const Q4A_SEQ = [1, 3, 2, 4, 5, 1, 3, 1, 3, 5, 3, 2]
const fa: CacheConfig = { sets: 1, ways: 4 }
const sa: CacheConfig = { sets: 2, ways: 2 }
const dm: CacheConfig = { sets: 4, ways: 1 }
const rFa = simulateCache(fa, Q4A_SEQ)
const rSa = simulateCache(sa, Q4A_SEQ)
const rDm = simulateCache(dm, Q4A_SEQ)

export const b19Solutions: Record<string, string> = {
  "1a": md`The given datapath only has PC → PC + 4. Add the branch and jump paths:

**For beq:**
1. **Shift left 2** on the sign-extended immediate (bits 15–0 → 32 bits → × 4).
2. A second **adder** computing the branch target (PC + 4) + offset × 4.
3. An **AND gate**: PCSrc = Branch · Zero (Zero from the ALU, which subtracts: ALUOp = 01).
4. A **mux** (select PCSrc) choosing PC + 4 or the branch target.

**For j:**
5. **Shift left 2** on instruction bits 25–0 (26 → 28 bits).
6. **Concatenate** (PC + 4)[31–28] with those 28 bits: the 32-bit jump address.
7. A second **mux** (select **Jump**, a new control signal from the opcode) choosing the output of the branch mux or the jump address, feeding the PC.

\`\`\`fig
dp-full
\`\`\`

**Control:** beq: Branch = 1, ALUSrc = 0, ALUOp = 01, RegWrite = MemWrite = 0, Jump = 0. j: Jump = 1, RegWrite = MemWrite = 0, Branch = 0 (the rest don't care).

The two completed paths, highlighted:

\`\`\`fig
dp-beq
dp-j
\`\`\``,

  "1b": md`This is the slides' scheduling example (C code A = B + E; C = B + F). Assume the 5-stage pipeline **with forwarding**.

**Step 1: hazards.**
- \`add $t3, $t1, $t2\` uses \`$t2\`, loaded by the instruction just before it: load-use, **1 stall**.
- \`add $t5, $t1, $t4\` uses \`$t4\`, loaded just before: **1 stall**.
- Every other dependence is covered by forwarding.

\`\`\`fig
b19-1b-before
\`\`\`

$$
\text{cycles} = 7 + 4 + 2 = 13
$$

**Step 2: reschedule.** Yes: move \`lw $t4, 8($t0)\` up to third place, so no load is immediately followed by a use of its result.

\`\`\`
lw  $t1, 0($t0)
lw  $t2, 4($t0)
lw  $t4, 8($t0)      # moved up
add $t3, $t1, $t2
sw  $t3, 12($t0)
add $t5, $t1, $t4
sw  $t5, 16($t0)
\`\`\`

\`\`\`fig
b19-1b-after
\`\`\`

$$
\text{cycles} = 7 + 4 + 0 = 11
$$
(The move is legal: the load of \`$t4\` depends on nothing above it, and nothing above it uses \`$t4\`.)`,

  "1c": md`**Data hazard for branches.** When the branch is decided early, in the **ID** stage (to cut the branch penalty to 1 cycle), it compares its registers in ID, two stages earlier than an ALU instruction uses its operands (EX). If a comparison register is written by a recent instruction, its value may not be ready yet, even with forwarding, so the branch must stall in ID.

An ALU result is ready at the end of the producer's EX; a loaded value at the end of its MEM. The branch's ID must come after that.

**(i) No stall: the register is written by the 2nd or 3rd preceding ALU instruction.**

\`\`\`
add $4, $5, $6       # 3rd before the branch
add $1, $2, $3       # 2nd before the branch
add $7, $8, $9
beq $1, $4, target   # $1 and $4 forwarded into ID: no stall
\`\`\`

\`\`\`fig
bh-alu-2nd
\`\`\`

**(ii) One stall: the register is written by the immediately preceding ALU instruction, or by the 2nd preceding load.**

\`\`\`
add $1, $2, $3
beq $1, $4, target   # $1 is computed in add's EX, the same cycle beq is in ID: 1 stall
\`\`\`

\`\`\`fig
bh-alu-1st
\`\`\`

\`\`\`
lw  $1, 0($2)
add $4, $5, $6
beq $1, $4, target   # $1 is ready at the end of lw's MEM: 1 stall
\`\`\`

\`\`\`fig
bh-load-2nd
\`\`\`

**(iii) Two stalls: the register is written by the immediately preceding load.**

\`\`\`
lw  $1, 0($2)
beq $1, $0, target   # $1 exists only after lw's MEM: beq waits 2 cycles in ID
\`\`\`

\`\`\`fig
bh-load-1st
\`\`\``,

  "1d": before(b22Solutions["1c"], "**Part 2:"),

  "2a": md`**Forwarding (bypassing):** using a result as soon as it is **computed** (at the end of EX for an ALU instruction, MEM for a load), taking it from a pipeline register (EX/MEM or MEM/WB) straight into the ALU input of a later instruction, instead of waiting for it to be written to the register file. It needs extra datapath connections (multiplexers at the ALU inputs) and a forwarding unit to control them.

${before(b22Solutions["1a"], "The figure for Q1(a)")}`,

  "2b": md`\`\`\`fig
b19-2b
\`\`\`

The parts and what they do:
1. **Instruction fetch and decode unit:** fetches instructions, decodes them, and **issues** them **in program order** to the reservation stations.
2. **Reservation stations:** one group in front of each functional unit. They **hold the operands** of waiting instructions; an instruction waits there until all its operands are available. They preserve the dependences.
3. **Functional units** (integer, floating point, load/store): execute an instruction as soon as its operands are ready, **out of order**. Each result is sent to the commit unit and **also to any reservation station waiting for it**.
4. **Commit unit** with a **reorder buffer:** holds results until they can be written to the registers or memory **in program order**. It can also supply operands to newly issued instructions.

So it is in-order issue, out-of-order execution and in-order commit: stalls are avoided, but the program still appears to run in order (which keeps exceptions and speculation recoverable).`,

  "2c": md`${b22Solutions["4b"]}`,

  "3a": md`**Step 1: clock period and memory penalty.** $T_c = 1/4\ \text{GHz} = 0.25$ ns.
$$
\text{memory penalty} = 200/0.25 = 800\ \text{cycles}
$$

**Step 2: primary cache only.**
$$
\text{CPI}_1 = 1.0 + 0.04\times800 = 1 + 32 = 33
$$

**Step 3: add L2** (10 ns = 40 cycles; 1% still go to memory).
$$
\text{CPI}_2 = 1.0 + 0.04\times40 + 0.01\times800 = 1 + 1.6 + 8 = 10.6
$$
$$
\frac{33}{10.6} \approx 3.11
$$
With L2 the processor is about **3.11 times faster**.

**Step 4: add L3** (40 ns = 160 cycles; 0.5% go to memory). The 1% that miss L2 now pay 160 cycles for L3, and 0.5% pay 800 more.
$$
\text{CPI}_3 = 1.0 + 0.04\times40 + 0.01\times160 + 0.005\times800 = 1 + 1.6 + 1.6 + 4 = 8.2
$$
$$
\frac{10.6}{8.2} \approx 1.29,\qquad \frac{33}{8.2} \approx 4.02
$$
Adding L3 makes it about **1.29 times faster** than with L2 (4.02 times faster than with the primary cache alone).`,

  "3b": md`\`\`\`fig
vm-page-table
\`\`\`

1. The **virtual address** is split into a **virtual page number (VPN)** and a **page offset** (e.g. 32-bit address, 4 KiB pages: 20-bit VPN, 12-bit offset).
2. The **page table register** in the CPU holds the starting physical address of the running process's page table in **main memory**.
3. The VPN **indexes** the page table to find the page table entry (PTE).
4. If the PTE's **valid bit is 1**, the page is in **main memory**: the PTE gives the **physical page number (PPN)**. The **physical address** is the PPN joined with the unchanged page offset.
5. If the valid bit is **0**, the page is on **disk** (in the swap space; the PTE or OS data records where): a **page fault**. The OS reads the page from disk into a free physical page (replacing one, written back first if dirty), updates the PTE, and restarts the instruction.
6. The PTE also holds status bits: a reference (use) bit for LRU-like replacement and a dirty bit, since pages are written back, never written through.

\`\`\`fig
vm-split
\`\`\``,

  "3c": md`The key facts:
- The TLB holds translations only for pages that are **in memory**.
- Data can be in the cache only if its page is **in memory**.
- On a TLB hit the page table is not consulted, but its entry would be a hit.

| No. | TLB | Page table | Cache | Possible? | Reason |
|---|---|---|---|---|---|
| 1 | Hit | Hit | Hit | **Possible** | the translation is in the TLB (so the page is in memory and its PTE is valid; the page table is not even checked) and the data is in the cache |
| 2 | Hit | Miss | Hit | **Impossible** | a TLB entry exists only for a page that is in memory; a TLB hit with the page not in memory cannot happen |
| 3 | Miss | Miss | Hit | **Impossible** | a page-table miss means the page is on disk; data cannot be in the cache if its page is not in memory |
| 4 | Miss | Miss | Miss | **Possible** | the page is on disk: TLB miss, then a page fault; after the page is brought in and the access retried, the data must miss in the cache |
| 5 | Miss | Hit | Hit | **Possible** | the translation is not in the TLB but the PTE is valid: the TLB is refilled from the page table, and on retry the data is found in the cache |`,

  "3d": md`${b22Solutions["3c"]}`,

  "4a": md`Each cache has 4 one-word blocks; LRU replacement.
- **Fully associative:** 1 set of 4.
- **2-way:** 2 sets of 2; set = block mod 2.
- **Direct mapped:** 4 sets; index = block mod 4.

**Fully associative:**

${accessTable(rFa, fa)}

Misses: **${rFa.misses}**. The first five blocks are 5 distinct addresses in a 4-block cache, so the LRU victims keep being the blocks needed next (1, then 3, then 2).

**Two-way set associative** (odd blocks 1, 3, 5 → set 1; even 2, 4 → set 0):

${accessTable(rSa, sa)}

Misses: **${rSa.misses}**. Three odd blocks compete for the two places in set 1.

**Direct mapped** (1, 5 → index 1; 2 → 2; 3 → 3; 4 → 0):

${accessTable(rDm, dm)}

Misses: **${rDm.misses}**. Only 1 and 5 collide (index 1); everything else stays.

**Summary:** fully associative ${rFa.misses}, two-way ${rSa.misses}, direct mapped ${rDm.misses} misses. Higher associativity does not always win: here LRU in the fully associative and 2-way caches evicts exactly the blocks reused next.`,

  "4b": md`${b22Solutions["4a"]}`,
  "4c": md`${b22Solutions["4c"]}`,

  "5a": md`| Design feature | Principle | Why |
|---|---|---|
| (i) Conditional branch offset in 16 bits | **Good design demands good compromise** | the offset must fit in the I-format so that every instruction stays 32 bits; the limited range is accepted because most branches are near (making the common case fast), and far branches are rewritten by the assembler |
| (ii) 32 registers, not many more | **Smaller is faster** | a small register file is faster to access; more registers would also need wider register fields |
| (iii) Always three registers for R-type | **Simplicity favours regularity** | every arithmetic instruction has the same form, so decoding and the datapath are simple |
| (iv) Multiple instruction formats | **Good design demands good compromise** | different formats complicate decoding but allow all instructions to be 32 bits, with the formats kept as similar as possible |
| (v) Reduced instruction set; bgt, bge, move as pseudoinstructions | **Make the common case fast** | only the common, simple operations (beq, bne, slt) get hardware, so they run with a fast clock; rarer complex ones are built from them. (The slides also call omitting blt/bge "a good design compromise".) |`,

  "5b": md`**(i) Speed-up on 24 cores** (Amdahl's law). The serial fraction is 2%; the parallel 98% is split over 24 cores at the same speed.
$$
\text{Speed-up} = \frac{1}{0.02 + \dfrac{0.98}{24}} = \frac{1}{0.02 + 0.04083} = \frac{1}{0.06083} \approx 16.44
$$
24 cores give only about **16.4 times**, not 24.

**(ii) Can it be 60 times faster? No**, not by parallelism alone, for two reasons.
- **With these 24 cores:** even a perfectly parallel program ($s = 0$) would speed up at most 24 times. Here it is 16.4 times.
- **With any number of cores:** the parallel part's time shrinks towards 0, but the 2% serial part remains:
  $$
  \text{Speed-up}_{\max} = \frac{1}{0.02} = 50 < 60
  $$

So the program cannot be made 60 times faster by running it on more cores. It could only happen by also making the **serial part** faster: shrinking the non-parallelisable 2%, or speeding up each core (a faster clock or a lower CPI) in addition to using more cores.`,

  "6a": md`**Register use:** n in \`$a0\`, result in \`$v0\`. Two recursive calls: n must survive the first call, and fib(n − 1) must survive the second. Both are saved on the stack with \`$ra\`.

\`\`\`
fib:    addi $sp, $sp, -12
        sw   $ra, 8($sp)          # save return address
        sw   $a0, 4($sp)          # save n
        bne  $a0, $zero, Not0     # n == 0 ?
        add  $v0, $zero, $zero    # return 0
        j    Done
Not0:   addi $t0, $zero, 1
        bne  $a0, $t0, Rec        # n == 1 ?
        addi $v0, $zero, 1        # return 1
        j    Done
Rec:    addi $a0, $a0, -1
        jal  fib                  # $v0 = fib(n - 1)
        sw   $v0, 0($sp)          # save fib(n - 1)
        lw   $a0, 4($sp)          # restore n
        addi $a0, $a0, -2
        jal  fib                  # $v0 = fib(n - 2)
        lw   $t0, 0($sp)          # fib(n - 1)
        add  $v0, $t0, $v0        # fib(n - 1) + fib(n - 2)
Done:   lw   $ra, 8($sp)          # restore return address
        addi $sp, $sp, 12
        jr   $ra
\`\`\`

**Stack frame (12 bytes):** \`8($sp)\` = \`$ra\`, \`4($sp)\` = n, \`0($sp)\` = fib(n − 1).

**Trace: fib(4).**
- fib(4) = fib(3) + fib(2)
- fib(3) = fib(2) + fib(1) = 1 + 1 = 2
- fib(2) = fib(1) + fib(0) = 1 + 0 = 1
- so fib(4) = 2 + 1 = **3**.`,

  "6b": md`**(i) j to 0x4000 0000? No.**
A jump's target is (PC + 4)[31–28] : address[25–0] : 00, so it stays in the 256 MB region given by the top 4 bits of PC + 4.
- PC + 4 = 0x2000 0004, whose top 4 bits are 0010.
- The target 0x4000 0000 has top 4 bits 0100.

They differ, so no \`j\` encoding reaches it. (Use \`lui\`/\`ori\` to put the address in a register and \`jr\`.)

**(ii) A single beq/bneq? No.**
A branch target is (PC + 4) + offset × 4 with a 16-bit signed offset, so it reaches at most about ±128 KB:
$$
\text{needed offset} = \frac{\texttt{0x4000\,0000} - \texttt{0x2000\,0004}}{4} = \frac{\texttt{0x1FFF\,FFFC}}{4} = \texttt{0x7FF\,FFFF} \approx 1.34\times10^{8}
$$
far beyond the maximum of 32767.`,

  "8a": md`**Instruction counts:** A = 25% of 200,000 = 50,000; B = 60% = 120,000; C = 15% = 30,000.

**(i) Clock cycles.**
$$
\text{P1: } 50{,}000\times3 + 120{,}000\times3 + 30{,}000\times2 = 150{,}000 + 360{,}000 + 60{,}000 = 570{,}000
$$
$$
\text{P2: } 50{,}000\times2 + 120{,}000\times4 + 30{,}000\times1 = 100{,}000 + 480{,}000 + 30{,}000 = 610{,}000
$$

**(ii) Execution times.**
$$
\text{P1: } \frac{570{,}000}{2.7\times10^{9}} = 211.1\ \mu\text{s}
$$
$$
\text{P2: } \frac{610{,}000}{3.5\times10^{9}} = 174.3\ \mu\text{s}
$$
**P2 is faster**, by $211.1/174.3 \approx 1.21$ times.

**(iii) Run 2× faster on P2 by improving class C only.** The target time is $174.3/2 = 87.14\ \mu$s, i.e.
$$
\frac{610{,}000}{2} = 305{,}000\ \text{cycles}
$$
Classes A and B alone already need $100{,}000 + 480{,}000 = 580{,}000$ cycles, more than 305,000. Even with class C taking **zero** cycles, the program needs 580,000 cycles. So **no** improvement of class C's CPI can make the program twice as fast: it is impossible.`,

  "8b": md`**Step 1: what single precision can hold exactly.** A normalised number is $1.f\times2^{E}$ with 23 fraction bits: a **24-bit significand** (counting the hidden 1). An integer is exactly representable if it fits in 24 significant bits (times a power of 2).

**Step 2: up to $2^{24}$ everything fits.** Every integer $k \le 2^{24}$ has at most 24 significant bits:
- $k < 2^{24}$ has at most 24 bits;
- $2^{24}$ itself is $1.0\times2^{24}$.

So 1, 2, …, $2^{24}$ are all exact.

**Step 3: the first gap.** $2^{24} + 1$ in binary is 1 followed by 23 zeros and a 1: **25 significant bits**. With only 24, it cannot be stored exactly: it falls halfway between $2^{24}$ and $2^{24} + 2$ and rounds (to even) to $2^{24}$.

**Answer:**
$$
n = 2^{24} = 16{,}777{,}216
$$
Every integer from 1 to 16,777,216 is representable; 16,777,217 is the first that is not.`,

  "8c": md`${b21Solutions["11c"]}`,
}
