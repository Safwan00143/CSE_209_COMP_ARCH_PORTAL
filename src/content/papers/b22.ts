import type { Paper } from "../types"
import { md } from "../md"

export const paperB22: Paper = {
  slug: "b22",
  batch: "22 batch",
  course: "CSE 209",
  session: "2023-2024",
  year: 2026,
  exam: "L-2/T-2 B. Sc. Engineering Examinations 2023-2024",
  date: "29/04/2026",
  fullMarks: 210,
  time: "3 hours",
  sections: [
    {
      name: "Section A",
      instructions: "There are FOUR questions in this section. Question No. 1 is MANDATORY. Answer any TWO from the rest.",
      questions: [
        {
          no: 1,
          parts: [
            {
              part: "a",
              marks: 10,
              topic: "data-hazards",
              prompt: md`Design a complete forwarding unit in the provided diagram in Figure for Question 1(a) with the necessary equations for the MIPS pipeline, considering double data hazard.`,
              note: "The figure for Q1(a) is not in the scanned paper; the solution uses the slides' forwarding diagram.",
              alsoAsked: ["2021-22 Q2(a)", "2017-18 Q2(b)"],
            },
            {
              part: "b",
              marks: 15,
              topic: "branch-hazards",
              prompt: md`You are given the following MIPS code:

\`\`\`
    lw  $t0, 0($s0)
    add $t1, $t0, $s1
    beq $t1, $zero, L1
    add $t2, $t1, $s2
    bne $t2, $zero, L2
    sub $t3, $t2, $t1
L1: and $t4, $t1, $t2
L2: or  $t5, $t3, $t4
\`\`\`

You can assume the following:
- 5 stage MIPS: IF – ID – EX – MEM – WB
- Code rescheduling is not available
- All stage forwarding available
- Branch resolved in ID
- Taken branch penalty = 1 cycle
- Load-use hazard = 1 stall

Now, identify all the data and control hazards and evaluate the following:
- (i) Total stall cycles
- (ii) Total cycles if both branches are not taken
- (iii) Total cycles if the first branch is taken
- (iv) Total cycles if the first branch is not taken, but the second branch is taken`,
            },
            {
              part: "c",
              marks: 10,
              topic: "branch-hazards",
              prompt: md`Consider the following code:

\`\`\`
outer:
        // some code
inner:
        // some code
        beq $t0, $zero, inner
        // some code
        beq $t1, $zero, outer
\`\`\`

Explain the problem with the above code if we use 1 bit branch predictor? How can you solve that?

"Even with a perfect branch predictor, 1-cycle penalty for a taken branch" – why does this penalty occur, and how can it be eliminated?`,
              alsoAsked: ["2021-22 Q1(d)", "2017-18 Q1(d), Q2(d)", "2015-16 Q2(e)", "2013-14 Q8(d)"],
            },
          ],
        },
        {
          no: 2,
          parts: [
            {
              part: "a",
              marks: 10,
              topic: "cache-performance",
              prompt: md`Suppose we have a processor with a base CPI of 1.0, assuming all references hit in the primary cache, and a clock rate of 4 GHz. The main memory access time is 200 ns, including all misshandling overhead. The miss rate per instruction in the primary cache is 5%.
- (i) How much faster will the processor be if we add a second-level cache with an access time of 10 ns (for both hits and misses), assuming it reduces the miss rate to main memory to 2%?
- (ii) How much faster will the processor be if we further add a third-level cache with an access time of 40 ns (for both hits and misses), assuming it reduces the miss rate to main memory to 1%?`,
              alsoAsked: ["2021-22 Q3(a)", "2017-18 Q4(a)"],
            },
            {
              part: "b",
              marks: 15,
              topic: "caches",
              prompt: md`For a direct-mapped cache design with a 32-bit address, the following bits of the address are used to access the cache.

| Tag | Index | Offset |
|---|---|---|
| 31 – 10 | 9 – 5 | 4 – 0 |

Starting from power on, the following byte-addressed cache references are recorded.

| 0 | 4 | 16 | 132 | 232 | 160 | 1024 | 30 | 140 | 3100 | 180 | 2180 |
|---|---|---|---|---|---|---|---|---|---|---|---|

- (i) What is the cache block size (in words)?
- (ii) How many entries does the cache have?
- (iii) How many blocks are replaced?
- (iv) What is the hit ratio?
- (v) List the final state of the cache, with each valid entry represented as <index, tag, data>.`,
              alsoAsked: ["2015-16 Q4(b)"],
            },
            {
              part: "c",
              marks: 10,
              topic: "caches",
              prompt: md`What are the advantages and disadvantages of larger cache blocks? What do you mean by early restart and critical-word-first? What are the uses of the write buffer in the write-through and write-back schemes?`,
            },
          ],
        },
        {
          no: 3,
          parts: [
            {
              part: "a",
              marks: 10,
              topic: "virtual-memory",
              prompt: md`Although both are the TLB and data cache are types of cache memory, explain how they differ. Illustrate, with a flow diagram, the interaction between the TLB and data cache during both read and write operations.`,
              alsoAsked: ["2015-16 Q3(d)", "2017-18 Q4(d)"],
            },
            {
              part: "b",
              marks: 15,
              topic: "virtual-memory",
              prompt: md`Virtual memory uses a page table to map virtual addresses to physical addresses. The following data constitutes a stream of virtual addresses as seen on a system. Assume 4 KB pages, a 4-entry fully associative TLB, and LRU replacement. If pages must be brought in from disk, increment the next largest page number (for example, the new pages will be assigned page numbers 13, 14, 15, and so on). The virtual page number is computed as the floor of the virtual address divided by the page size in bytes.

| 4669 | 2227 | 13916 | 34587 | 48870 | 12608 | 49225 |
|---|---|---|---|---|---|---|

**TLB**

| Valid | Tag | Physical Page Number |
|---|---|---|
| 1 | 11 | 12 |
| 1 | 7 | 4 |
| 1 | 3 | 6 |
| 0 | 4 | 9 |

**Page Table**

| Valid | Physical Page or in Disk |
|---|---|
| 1 | 5 |
| 0 | Disk |
| 0 | Disk |
| 1 | 6 |
| 1 | 9 |
| 1 | 11 |
| 0 | Disk |
| 1 | 4 |
| 0 | Disk |
| 0 | Disk |
| 1 | 3 |
| 1 | 12 |

Given the address stream shown and the initial TLB and page table states provided above,
- (i) List for each reference if it is a hit in the TLB, a hit in the page table, or a page fault.
- (ii) Show the final state of the page table and TLB`,
            },
            {
              part: "c",
              marks: 10,
              topic: "coherence",
              prompt: md`What do you mean by cache coherence problem? Explain how snooping protocol solves the cache coherence problem with an example.`,
              alsoAsked: ["2021-22 Q3(d)"],
            },
          ],
        },
        {
          no: 4,
          parts: [
            {
              part: "a",
              marks: 10,
              topic: "gpu",
              prompt: md`Show with block diagrams how contemporary PCs with intel and AMD CPUs connect a separate GPU. How do the CPU and GPU access each other's memory?`,
              alsoAsked: ["2021-22 Q4(b)"],
            },
            {
              part: "b",
              marks: 15,
              topic: "multiple-issue",
              prompt: md`Consider the following program:

\`\`\`
Loop: lw   $t0, 0($s1)
      addu $t0, $t0, $s2
      sw   $t0, 0($s1)
      addi $s1, $s1, -4
      bne  $s1, $zero, Loop
\`\`\`

Schedule the above program for a dual-issue MIPS with the following configuration: Two-issue packets, one ALU/branch instruction, one load/store instruction, ALU/branch then load/store.

What will be the IPC for this scheduling? Which technique can further increase the IPC, and How?`,
              alsoAsked: ["2021-22 Q2(c)"],
            },
            {
              part: "c",
              marks: 10,
              topic: "gpu",
              prompt: md`What do you mean by kernel, grid, and thread block of the CUDA paradigm? Briefly describe how they map to the streaming processor (SP) cores and streaming multiprocessors (SM) of the unified GPU architecture of NVIDIA.`,
              alsoAsked: ["2021-22 Q4(c)"],
            },
          ],
        },
      ],
    },
    {
      name: "Section B",
      instructions: "There are FOUR questions in this section. Question No. 5 is MANDATORY. Answer any TWO from the rest.",
      questions: [
        {
          no: 5,
          parts: [
            {
              part: "a",
              marks: 20,
              topic: "isa-basics",
              prompt: md`Consider a modified MIPS instruction set, called MIPS-v22, where each instruction is represented in 32-bits. Figure for Question 5(a) shows the format of R-type and I-type instruction of MIPS-v22.

\`\`\`fig
b22-5a-formats
\`\`\`

R-type: rs: first source register number, rt: second source register number, rd: destination register number, shamt: shift amount, funct: function code (extends opcode). I-type: rs: source register number, rt: destination or source register number.

- (i) Develop a block diagram of the partial single cycle datapath for R-type and I-type instructions of MIPS-v22 containing only an Instruction Memory, a Register file, and one or more MUXs (as required). Note that the output of the Instruction memory is a 32 bit MIPS-v22 instruction. Your task is to devise only connections from the Instruction Memory to the following 3 inputs of the Register File: Read register 1 number, Read register 2 number, Write register number. You may use as many MUXs as required. Clearly show the bit size of the connections.
- (ii) Consider the numbers of the registers \`$t0\`, \`$t1\`, and \`$t2\` are 2, 3, 4 in decimal respectively. Translate the following 3 instructions in the binary format following the given MIPS-v22 instruction format. Assume shamt = 0 and funct = 0.
  - \`add $t0, $t1, $t2\`: here \`$t0\`: destination, \`$t1\`: source 1, \`$t2\`: source 2, opcode = 0
  - \`addi $t2, $t0, 1\`: here \`$t2\`: destination, \`$t0\`: source 1, opcode = 6
  - \`lw $t1, 4($t0)\`: here \`$t1\`: destination, \`$t0\`: base address, opcode = 5`,
            },
            {
              part: "b",
              marks: 15,
              topic: "alu-design",
              prompt: md`Suppose you want to design a 4-bit ALU where the inputs to the ALU are A $(A_3A_2A_1A_0)$ and B $(B_3B_2B_1B_0)$, and the selection variables are $S_2$, $S_1$, and $S_0$. Also, consider $X_i$, $Y_i$ and $Z_i$ as the inputs to the i-th parallel adder of the ALU. The ALU must satisfy the following functional design specification given in Table for Question 5(b) that has to be realized through the parallel adders.

| $S_2$ | $S_1$ | $S_0$ | Required Functions |
|---|---|---|---|
| 0 | 0 | 0 | F = A − B − 1 |
| 0 | 0 | 1 | F = A + B + 1 |
| 0 | 1 | 0 | F = Transfer A |
| 0 | 1 | 1 | F = Decrement A |
| 1 | 0 | x | F = A OR B |
| 1 | 1 | x | F = A′ |

Devise the input equations $(X_i, Y_i, Z_i)$ for the parallel adders of the ALU.`,
            },
          ],
        },
        {
          no: 6,
          parts: [
            {
              part: "a",
              marks: 13,
              topic: "performance",
              prompt: md`Our favorite program runs in 10 seconds on computer A, which has a 4 GHz clock. We are trying to help a computer designer build a computer, B, which will run this program in 6 seconds. The designer has determined that a substantial increase in the clock rate is possible, but this increase will affect the rest of the CPU design, causing computer B to require 1.2 times as many clock cycles as computer A for this program. What clock rate should we tell the designer to target?`,
            },
            {
              part: "b",
              marks: 13,
              topic: "mips-programming",
              prompt: md`Write down the MIPS assembly code for the following program.

\`\`\`
int main() {
    int a = 5, b = 10, c = 2;   // $t0 = a, $t1 = b, $t2 = c
    int N = 30;                 // $t3 = N
    do {
        if ((a << 2) > b) {
            a += 2;
            b += a;
        }
        else {
            a += c;
            b += c;
        }
    } while (a < N);
    return 0;
}
\`\`\``,
            },
            {
              part: "c",
              marks: 9,
              topic: "addressing",
              prompt: md`Explain PC-relative addressing mode, Immediate addressing mode, and Base addressing mode with examples.`,
            },
          ],
        },
        {
          no: 7,
          parts: [
            {
              part: "a",
              marks: 20,
              topic: "int-arithmetic",
              prompt: md`Draw the diagram of the integer multiplication hardware following (i) long multiplication approach, and (ii) parallel add/shift approach assuming 32 bit multiplier and 32 bit multiplicand. For each approach, also simulate the steps of the multiplication with an example for two 4 bit integer numbers: 1000 (multiplicand), 1011 (multiplier).`,
              alsoAsked: ["2022-23 (CSE 209) Q4", "2018-19 Q5(a)"],
            },
            {
              part: "b",
              marks: 15,
              topic: "floating-point",
              prompt: md`What is the purpose of using a positive BIAS value in IEEE 754 floating point representation? Devise the smallest and largest values that can be expressed in (i) single precision (32 bit), and (ii) double precision (64 bits) using IEEE 754 floating point representation.`,
            },
          ],
        },
        {
          no: 8,
          parts: [
            {
              part: "a",
              marks: 20,
              topic: "single-cycle",
              prompt: md`A single cycle datapath implementation of a subset of 32-bit MIPS instruction set has been shown in Figure for Question 8(a). Answer the following:

\`\`\`fig
b22-8a-datapath
\`\`\`

- (i) Why is PC incremented by 4?
- (ii) How is the length of the clock cycle determined in a single cycle execution?
- (iii) Why is the upper 4 bits of PC + 4 concatenated in jump address calculation?
- (iv) "A single physical memory unit can be used to implement both instruction memory and data memory in a hardware based implementation of a single cycle datapath" – agree or disagree? Justify your answer.`,
            },
            {
              part: "b",
              marks: 10,
              topic: "single-cycle",
              prompt: md`Identify the component(s) required to be added to implement the jump instruction in the Figure for Question 8(a). Draw the diagram in your answer script implementing jump instruction assuming 32 bit addressing. [Include only the relevant components and control lines to implement jump instruction in your drawing.]`,
            },
            {
              part: "c",
              marks: 5,
              topic: "addressing",
              prompt: md`Given the following branch instruction where register \`$s0\` value equals to register \`$s1\` value and label L1 indicates an out of range branching distance. \`beq $s0, $s1, L1\`. Replace the beq instruction by a pair of instructions that offers a much greater branching distance and resolves the out of range branching issue.`,
              alsoAsked: ["2013-14 Q6(d)", "2011-12 Q2(c)"],
            },
          ],
        },
      ],
    },
  ],
}
