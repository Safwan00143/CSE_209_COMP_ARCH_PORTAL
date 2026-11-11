import type { Paper } from "../types"
import { md } from "../md"

export const paperB21: Paper = {
  slug: "b21",
  batch: "21 batch",
  course: "CSE 209",
  session: "2022-2023",
  year: 2025,
  exam: "L-2/T-2 B. Sc. Engineering Examinations 2022-2023",
  date: "13/01/2025",
  fullMarks: 210,
  time: "3 hours",
  sections: [
    {
      name: "Section A",
      instructions:
        "There are EIGHT questions in this section. Question No. 1 is mandatory. Answer any FIVE from the remaining 7 questions (i.e. 2 to 8). You can make justified assumptions in case of any kind of missing data/information. Carefully read the instructions in each question to understand what is being asked. Providing unnecessary information that is not requested will not guarantee any additional marks.",
      questions: [
        {
          no: 1,
          parts: [
            {
              part: "a",
              marks: 10,
              topic: "floating-point",
              prompt: md`Express the steps of floating-point addition using a flow chart. Also, write down the conditions of overflow, underflow, NaN and infinity during a floating-point addition.`,
              alsoAsked: ["2018-19 Q8(b)", "2011-12 Q5(a)"],
            },
            {
              part: "b",
              marks: 10,
              topic: "int-arithmetic",
              prompt: md`Suppose you have a 6-bit ALU and you are required to perform a division operation, where the dividend is 1011 1100 1111 and the divisor is 110101. Determine the result of the division process; show the step-by-step calculation along with the value of each relevant register at each step.`,
              outOfScope: "Division is not covered in the lecture slides",
            },
            {
              part: "c",
              marks: 10,
              topic: "data-hazards",
              prompt: md`Consider the following code

$$
A = B + C;\qquad D = A + E;
$$

All the above are memory instructions (i.e. the values of the variable are stored in a memory location). The base address is in register \`$t0\` and the offsets are 0, 4, 8, 12, 16 for A, B, C, D, and E, respectively. Write the equivalent MIPS assembly code to determine the number of cycles that are required to execute the code.

Can you reduce the number of cycles computed above using code scheduling? If yes, then rearrange the MIPS assembly code and recount the number of cycles required to execute the rearranged code.`,
              alsoAsked: ["2017-18 Q1(a)", "2015-16 Q2(d)"],
            },
          ],
        },
        {
          no: 2,
          parts: [
            {
              part: "",
              marks: 15,
              topic: "data-hazards",
              prompt: md`Consider the following code snippet:

\`\`\`
lw   $t0, 55($t1)
addi $t1, $t0, 1
lw   $t0, 57($t1)
sw   $t0, 32($t4)
\`\`\`

Identify the hazard(s) present in the given code snippet. Write the detection conditions for each identified hazard. Complete the *Hazard Detection Unit* by including all the necessary input and output signals in the provided reference figure (Figure for Question 2) to ensure that hazard(s) can be detected and stalls can be applied when necessary. Draw the given partial diagram in your script and complete only the Hazard Detection Unit.`,
            },
          ],
        },
        {
          no: 3,
          parts: [
            {
              part: "",
              marks: 15,
              topic: "single-cycle",
              prompt: md`In the given incomplete MIPS single cycle data path shown in the Figure for Question 3 (register file, ALUSrc mux, ALU, data memory and MemtoReg mux; no PC logic), add new connections (no need to draw the control unit; if you need control signal(s) just naming them will suffice) to support beq, bneq, j and jr instructions using minimum numbers of MUX. You can only use 2 × 1 MUXs.`,
              alsoAsked: ["2018-19 Q1(a)", "2012-13 Q2"],
            },
          ],
        },
        {
          no: 4,
          parts: [
            {
              part: "",
              marks: 15,
              topic: "int-arithmetic",
              prompt: md`Draw the hardware block diagram and the flowchart of the sequential version of the multiplication algorithm. Also, draw the hardware block diagram and the flowchart of the refined version of the algorithm.`,
              alsoAsked: ["2023-24 Q7(a)", "2018-19 Q5(a)", "2013-14 Q3(c)"],
            },
          ],
        },
        {
          no: 5,
          parts: [
            {
              part: "",
              marks: 15,
              topic: "branch-hazards",
              prompt: md`Consider the following code snippet:

\`\`\`
        beq $1, $2, TARGET   # branch is/will be taken for this one
        lw  $3, 40($4)
        add $2, $3, $4
        sw  $2, 40($4)
TARGET: or  $1, $1, $2
\`\`\`

Assume that branch decision is checked using the ALU zero signal (i.e., no separate hardware is placed to decide early). Now can an attempt to flush and stall the pipeline occur simultaneously? If yes, explain with the help of an illustration.

Will there be an issue if flush and stall signals occur simultaneously? If there is an issue, you need to provide a solution. If there is no issue, you need to clearly explain why not.`,
              alsoAsked: ["2018-19 Q2(a)"],
            },
          ],
        },
        {
          no: 6,
          parts: [
            {
              part: "",
              marks: 15,
              topic: "single-cycle",
              prompt: md`The current implementation of MIPS hardware doesn't support memory values as operand for R-type instructions. You can perform R-type instructions only if both of the operand values are stored in a register. Now you want to add a new instruction type (i.e. M-type instruction).

In M-type instruction you should perform only addition and subtraction, where one of the operand value would be stored in the memory (i.e. memory operand).

Now you need to design the M-type instruction format (i.e. which bits will represent which value) and the conversion protocol for transforming MIPS assembly to machine code for M-type instruction. You have the full freedom to design the new format and you can set any rules you wish; you can add new control signal(s) if needed. Explain your designed instruction format with proper justification. While designing your new protocol you **mustn't** hamper the working of the three original instruction formats.

Also, there will be major change(s) needed in hardware for the above-described M-type instruction. Identify the change(s) and explain them with proper justification.`,
            },
          ],
        },
        {
          no: 7,
          parts: [
            {
              part: "",
              marks: 15,
              topic: "branch-hazards",
              prompt: md`Read the following conversation between three friends.

*Chandler:* In the pipelined version of MIPS implementation, every jump instruction would need a 1-cycle stall.

*Joey:* If we just move the control unit in IF stage, we won't need any stall for jump instruction.

*Ross:* That would cause other problems. I have a better solution to avoid stalls (most of the time) which wouldn't cause any side effect problem.

Now answer the following:
- (i) Do you agree with Chandler's statement? Justify your answer.
- (ii) If you implement Joey's solution what would be the problem? Explain your answer.
- (iii) Can you rediscover Ross's solution, which avoids the problem present in Joey's solution? Provide a brief explanation of your solution.`,
            },
          ],
        },
        {
          no: 8,
          parts: [
            {
              part: "",
              marks: 15,
              topic: "branch-hazards",
              prompt: md`Make the necessary changes to incorporate precise exception handling in pipelined version of MIPS hardware. You can make the changes in the Figure given in Figure for Question 8 and have that page stapled securely with your answer script. The question page containing the figure must then be signed by the invigilator.

You do not need to draw any input signal for *Hazard detection unit*. If any output signal is needed for incorporating precise exception handling you must draw that. For any other output signal which isn't necessary for exception handling you do not need to draw it.`,
              outOfScope: "Exceptions are not covered in the lecture slides",
            },
          ],
        },
      ],
    },
    {
      name: "Section B",
      instructions: "There are FOUR questions in this section. Question No. 9 is mandatory. Answer any TWO questions from the Question No. 10, 11, and 12.",
      questions: [
        {
          no: 9,
          parts: [
            {
              part: "a",
              marks: 15,
              topic: "cache-performance",
              prompt: md`Assume there are two processors, P1 and P2 where P1 has two levels of cache (L1 and L2) and P2 has three levels of cache (L1, L2 and L3). The DRAM memory access time is 100 ns, and memory accesses constitute 30% of all instructions. Additionally, the L2 hit time is twenty times the cycle times for both P1 and P2. The base CPI for both P1 and P2 is 1.

L1 Cache Data:

| Processor | L1 Size | L1 Miss Rate | L1 Hit Time |
|---|---|---|---|
| P1 | 16 KB | 4% | 1.16 ns |
| P2 | 32 KB | 3% | 2.04 ns |

L2 Cache Data:

| Processor | L2 Size | L2 Miss Rate | L2 Hit Time |
|---|---|---|---|
| P1 | 16 MB | 65% | 27.5 ns |
| P2 | 8 MB | 50% | 30.5 ns |

L3 Cache Data:

| L3 Size | L3 Global Miss Rate | L3 Hit Time |
|---|---|---|
| 64 MB | 1% | 50.7 ns |

- (i) Determine the faster processor between P1 and P2. Justify your answer by determining the effective CPI for each processor.
- (ii) If P1 is faster, determine the miss rate P2 would need in its L2 cache to match P1's performance. If P2 is faster, determine the miss rate P1 would need in its L2 cache to match P2's performance.`,
            },
            {
              part: "b",
              marks: 10,
              topic: "caches",
              prompt: md`Determine the total size of a 4-way set-associative cache with the following specifications. Assume the cache has tag bits, a valid bit, a dirty bit, a protection bit, and the data bits.
- Address length: 48 bits
- Cache (Data only) size: 64 KB
- Block size: 16 words
- The cache has hardware support for the instruction lb (load byte).`,
            },
            {
              part: "c",
              marks: 10,
              topic: "mips-programming",
              prompt: md`Convert the code snippet below to the MIPS assembly code.

\`\`\`
int fun(int a, int b) {
    if (b == 0) return 0;
    else if (b / 2 == 0) return fun(a*4, b/8);
    return fun(a+a, b/4) + a;
}
\`\`\``,
              alsoAsked: ["2018-19 Q8(a)"],
            },
          ],
        },
        {
          no: 10,
          parts: [
            {
              part: "a",
              marks: 15,
              topic: "virtual-memory",
              prompt: md`Consider a memory system where the virtual address is 38 bits long, the physical DRAM installed is 8 GB, the page size is 16 KB, and the PTE size is 4 bytes. The computer system where this memory system is used has 75 processes running. The PID of each process is 8 bits long.
- (i) For a single-level page table, calculate how much physical memory is needed for storing the page tables.
- (ii) For a three-level page table where each level has an equal length of bits, calculate how much physical memory is needed for storing the page tables in the best case, average case, and worst case scenario.
- (iii) For an inverted page table, calculate how much physical memory is needed for storing the page table. An extra 4 bytes of information besides the required ones is stored in the PTE.`,
              note: "Only (i) is solved: multi-level and inverted page tables, parts (ii) and (iii), are not covered in the lecture slides.",
            },
            {
              part: "b",
              marks: 10,
              topic: "virtual-memory",
              prompt: md`Draw the block diagram of TLB and data cache interaction with necessary labels in a memory system with the following specifications.
- Page size is 32 KB, and the virtual address is 64 bits long.
- The physical DRAM size is 64 GB.
- TLB cache has 32 entries and is fully associative. The cache has tag bits, a valid bit, a dirty bit, 24 bookkeeping bits, and the data bits.
- The data cache is 64 KB and direct-mapped. It has 64 words/blocks. It is a physically indexed, physically tagged cache.`,
            },
            {
              part: "c",
              marks: 10,
              topic: "virtual-memory",
              prompt: md`Why must the operating system clear the TLB and data cache during a context switch? How does the operating system address these issues to avoid clearing the caches?`,
            },
          ],
        },
        {
          no: 11,
          parts: [
            {
              part: "a",
              marks: 7,
              topic: "int-arithmetic",
              prompt: md`Why is the overflow bit (V) computed by XOR-ing the last two carry bits in binary arithmetic operations?`,
            },
            {
              part: "b",
              marks: 8,
              topic: "isa-basics",
              prompt: md`How does "jal" instruction differ from an unconditional jump instruction? How is the NOT operation performed in the MIPS assembly language?`,
            },
            {
              part: "c",
              marks: 10,
              topic: "addressing",
              prompt: md`What are the different addressing modes of MIPS? Illustrate the calculation process for each addressing mode.`,
              alsoAsked: ["2021-22 Q8(c)", "2018-19 Q6(a)", "2015-16 Q6(b)"],
            },
            {
              part: "d",
              marks: 10,
              topic: "alu-design",
              prompt: md`Design a 4-bit Arithmetic Logic Unit (ALU) with three selection variables, $S_0$, $S_1$, and $S_2$. These selecting variables control the ALU to perform various operations on two 4-bit inputs, labeled as A and B. Derive the input equations ($X_i$, $Y_i$, and $Z_i$) for the parallel adders used in the ALU that satisfy the following functional design specifications, (where X means don't care).

| $S_2$ | $S_1$ | $S_0$ | Required Operation |
|---|---|---|---|
| 0 | 0 | 0 | −A − B − 2 |
| 0 | 0 | 1 | Add 1's complement of A to B |
| 0 | 1 | 0 | A + B |
| 0 | 1 | 1 | A − B |
| 1 | 0 | x | A AND B |
| 1 | 1 | x | A XOR B |`,
            },
          ],
        },
        {
          no: 12,
          parts: [
            {
              part: "a",
              marks: 5,
              topic: "sync-linking",
              prompt: md`How does Just-In-Time (JIT) compilation improve the performance of a Java application?`,
            },
            {
              part: "b",
              marks: 10,
              topic: "sync-linking",
              prompt: md`What is the main difference between static linking and dynamic linking? What are the advantages of using dynamic linking?`,
            },
            {
              part: "c",
              marks: 10,
              topic: "addressing",
              prompt: md`- (i) Write the MIPS assembly code that creates the 32-bit constant 0010 0000 0000 0001 0100 1001 0010 0100 (binary) and stores that value to register \`$t1\`.
- (ii) If the current value of the PC is $\texttt{0x00000000}$ can you use a single jump instruction to go to the address equal to the constant shown in question 12(c)(i)?
- (iii) If the current value of the PC is $\texttt{0x1FFFF000}$, can you use a single branch instruction to go to the address equal to the constant shown in Question 12(c)(i)?`,
            },
            {
              part: "d",
              marks: 10,
              topic: "cache-performance",
              prompt: md`Consider Figure 12.1 and Figure 12.2, which show the comparison of Quicksort and Radix Sort in terms of instructions and clock cycles. As expected, for large arrays, Radix Sort has an algorithmic advantage over Quicksort regarding the number of operations, as shown in Figure 12.1. Figure 12.2 shows clock cycles taken instead of instructions executed. We see that the lines start on the same trajectory as in Figure 12.1, but then the Radix Sort line diverges as the data to sort increases. Explain briefly why Figure 12.2 is not following Figure 12.1.

(Figure 12.1: instructions per item against size (K items to sort, 4 to 4096); Radix Sort falls from about 1150 to below Quicksort's roughly 200–250. Figure 12.2: clock cycles per item; Radix Sort falls from about 1900 to about 450 at 64K items, then rises to about 700, staying above Quicksort, which rises slowly from about 250 to about 550.)`,
            },
          ],
        },
      ],
    },
  ],
}
