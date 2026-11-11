import type { Paper } from "../types"
import { md } from "../md"

export const paperB16: Paper = {
  slug: "b16",
  batch: "16 batch",
  course: "CSE 305",
  session: "2018-2019",
  year: 2019,
  exam: "L-3/T-1 B. Sc. Engineering Examinations 2018-2019",
  date: "29/10/2019",
  fullMarks: 210,
  time: "3 hours",
  sections: [
    {
      name: "Section A",
      instructions: "There are FOUR questions in this section. Answer any THREE. You may choose to answer parts of some questions in the figures provided with the question script; in that case, attach that page, signed by the invigilator, to your answer script.",
      questions: [
        {
          no: 1,
          parts: [
            {
              part: "a",
              marks: 30,
              topic: "single-cycle",
              prompt: md`Consider the single-cycle datapath shown in Figure 1.A. Update the figure to implement the following MIPS instructions: bne, j, jr, jal, slt, lui. Briefly explain your updates. You can make the changes in Figure 1.A and have that page stapled with your script.

\`\`\`fig
dp-full
\`\`\``,
              note: "Figure 1.A in the scan is the basic single-cycle datapath with control (no jump). The figure shown is the slides' version, which already includes the jump path; the solution explains every addition.",
            },
            {
              part: "b",
              marks: 5,
              topic: "single-cycle",
              prompt: md`Why are single-cycle implementations not very efficient?`,
            },
          ],
        },
        {
          no: 2,
          parts: [
            {
              part: "a",
              marks: 10,
              topic: "branch-hazards",
              alsoAsked: ["2022-23 Q5"],
              prompt: md`Consider the following code snippet:

\`\`\`
        beq $1, $2, TARGET   # branch is/will be taken for this one
        lw  $3, 40($4)
        add $2, $3, $4
        sw  $2, 40($4)
TARGET: or  $1, $1, $2
\`\`\`

Assume that branch decision is checked using the ALU zero signal (i.e., no separate hardware is placed to decide early). Now can an attempt to flush and stall the pipeline occur simultaneously? If yes, then will there be an issue? Explain with the help of a single-cycle illustration. If there is an issue, you need to provide a solution. If there is no issue, you need to clearly explain why not.`,
            },
            {
              part: "b",
              marks: 10,
              topic: "branch-hazards",
              prompt: md`Discuss what the issues are and how they can be handled in the following code snippet. Assume that, using extra hardware, the branch decision is checked as early as possible. Use multicycle illustrations to explain. How many cycles will be needed to complete the code snippet?

\`\`\`
lw  $1, 100($2)
add $1, $1, $2
beq $1, $2, TARGET
\`\`\``,
            },
            {
              part: "c",
              marks: 15,
              topic: "virtual-memory",
              prompt: md`Discuss how a TLB miss is handled by the MIPS architecture. Consider the pipelined datapath in Figure 2.c that is capable of handling undefined instruction and overflow exceptions. Now, discuss how a TLB miss exception may be handled there. You may update Figure 2.c if you feel necessary.`,
              note: "Figure 2.c (the pipelined datapath with exception handling) is unreadable in the scan, and pipeline exception hardware is not covered in the lecture slides. The solution covers TLB miss handling, which the slides do cover.",
            },
          ],
        },
        {
          no: 3,
          parts: [
            {
              part: "a",
              marks: 8,
              topic: "virtual-memory",
              prompt: md`With the help of a flowchart, show how a real read or write request is processed in a system with a TLB interacting with an appropriate cache and virtual memory.`,
            },
            {
              part: "b",
              marks: 19,
              topic: "virtual-memory",
              prompt: md`Consider a virtual memory system with a 40-bit virtual byte address, 16 KB pages and a 36-bit physical byte address. All the virtual pages are in use and there are valid, protection, dirty and use bits. Disk addresses are not stored in the page table. There is a 2-way set-associative TLB with a total of 256 TLB entries. Now answer the following questions: (4 + 3 + 12)

a. What is the size of the page table?

b. What will be the size of the page table if we use the inverted page table concept?

c. With the help of an appropriate illustration, show how the virtual-to-physical mapping is done. Assume a 16 KB direct-mapped cache with 16-word blocks.`,
              note: "Sub-part b (the inverted page table) is not covered in the lecture slides; a and c are solved.",
            },
            {
              part: "c",
              marks: 8,
              topic: "virtual-memory",
              prompt: md`You have designed a processor with a 16-entry TLB and 4 KB pages and have exhausted your budget for implementing the system. During trial you have found that programs are accessing at least 2 MB of memory at a time. How would your system perform and why? Can you suggest how you can improve the system performance if no more money is available? What if more money is available?`,
            },
          ],
        },
        {
          no: 4,
          parts: [
            {
              part: "a",
              marks: 19,
              topic: "cache-performance",
              prompt: md`Consider three processors with different cache configurations and data as follows: (4 + 3 + 12)

| Processor/Cache | Processor cycle time | Organization | Block size (words) | Instruction miss rate | Data miss rate |
|---|---|---|---|---|---|
| 1 | 420 ps | Direct-mapped | 1 | 4% | 6% |
| 2 | 420 ps | Direct-mapped | 4 | 2% | 4% |
| 3 | 310 ps | Two-way set associative | 4 | 2% | 3% |

For these processors, one half of the instructions contain a data reference, and the cache miss penalty is 6 + block size in words. The CPI of this workload was measured on Processor 1 (i.e., with cache 1) and was found to be 2.0. Now answer the following questions.

a. Which processor spends the most cycles on cache misses?

b. Which processor is the fastest and which one is the slowest?

c. For processor 3, show the cache organization and how the cache will be accessed with the help of a detailed illustration.`,
            },
            {
              part: "b",
              marks: 16,
              topic: "caches",
              prompt: md`Suppose you are working on a computer architecture with the following properties: (4 + 6 + 6)

- 32-bit address
- byte-addressable RAM
- 256 KB cache
- 64-word blocks
- random replacement algorithm
- write-through scheme

Now answer the following questions:

a. What is the size of the cache?

b. What is the overhead if the cache is: i. direct-mapped; ii. 2-way set associative; iii. fully associative?

c. Consider the current value of \`$2\` is 1000 in decimal. Assuming direct-mapped organization, find the cache address for the following load word instruction: \`lw $1, 18($2)\`.`,
            },
          ],
        },
      ],
    },
    {
      name: "Section B",
      instructions: "There are FOUR questions in this section. Answer any THREE.",
      questions: [
        {
          no: 5,
          parts: [
            {
              part: "a",
              marks: 12,
              topic: "int-arithmetic",
              prompt: md`Draw the hardware block diagram and the flowchart of the sequential version of the multiplication algorithm. Also, draw the flowchart of the refined version of the algorithm.`,
            },
            {
              part: "b",
              marks: 8,
              topic: "floating-point",
              prompt: md`Consider a 16-bit floating-point representation system, where the exponent is 4 bits long. With this system, represent the floating-point numbers $(-1.25)_{10}$ and $(0.375)_{10}$ as bit strings of length 16 using an appropriate bias.`,
            },
            {
              part: "c",
              marks: 5,
              topic: "floating-point",
              prompt: md`Determine the decimal value of the floating-point number represented by the hexadecimal value $(\texttt{DF80 7500})_{16}$ according to the IEEE 754 single-precision floating-point format.`,
            },
            {
              part: "d",
              marks: 10,
              topic: "alu-design",
              alsoAsked: ["2017-18 Q6(a)"],
              prompt: md`Design a 4-bit ALU with three selection variables $S_0$, $S_1$ and $S_2$ that performs the following operations on two 4-bit inputs (A and B):

| $S_2$ | $S_1$ | $S_0$ | Operation |
|---|---|---|---|
| 0 | 0 | 0 | Addition |
| 0 | 0 | 1 | Transfer A |
| 0 | 1 | 0 | Add 1's complement of B to A |
| 0 | 1 | 1 | Increment A |
| 1 | 0 | 0 | XOR |
| 1 | 0 | 1 | NOT |
| 1 | 1 | 0 | AND |
| 1 | 1 | 1 | OR |

Draw the logic diagram of one typical stage of your designed ALU.`,
            },
          ],
        },
        {
          no: 6,
          parts: [
            {
              part: "a",
              marks: 15,
              topic: "addressing",
              prompt: md`What are the different addressing modes of MIPS? Describe and illustrate the calculation process for each addressing mode.`,
            },
            {
              part: "b",
              marks: 15,
              topic: "int-arithmetic",
              prompt: md`Suppose you have a 4-bit ALU and you are required to perform a division operation, where the dividend is 11001001 and the divisor is 1011. Show the division process step by step along with the value of each relevant register at each step.`,
              outOfScope: "Division hardware is not covered in the lecture slides",
            },
            {
              part: "c",
              marks: 5,
              topic: "isa-basics",
              prompt: md`How many instruction formats are there in MIPS? Write down the name of each instruction format along with the length of each field therein.`,
            },
          ],
        },
        {
          no: 7,
          parts: [
            {
              part: "a",
              marks: 10,
              topic: "addressing",
              prompt: md`Consider the following MIPS assembly language code and assume that the code fragment is loaded at location 60000 in the memory:

\`\`\`
Loop: sll  $t1, $s2, 2
      add  $t1, $t1, $s6
      lw   $t0, 0($t1)
      beq  $t0, $s5, Lp1
      j    Exit
Lp1:  addi $s2, $s2, 1
      j    Loop
Exit:
\`\`\`

Write down the MIPS machine code with appropriate decimal values for the above assembly code.`,
            },
            {
              part: "b",
              marks: 20,
              topic: "performance",
              prompt: md`Assume that a processor with a 4 GHz clock rate is executing a program that requires the following instruction types.

| Instructions | FP | INT | L/S | BRANCH |
|---|---|---|---|---|
| Instruction count (×10⁶) | 160 | 110 | 10 | 16 |
| CPI | 2 | 1 | 5 | 2 |

(i) Calculate the execution time of the program.

(ii) If you want the program to run two times faster, then how much should you improve the CPI of FP instructions? Explain your finding.

(iii) If you want the program to run two times faster, then how much should you improve the CPI of L/S instructions? Explain your finding.

(iv) By how much is the execution time changed if the CPI of INT and BRANCH instructions is increased by 15% and the CPI of FP and L/S instructions is decreased by 20%?`,
            },
            {
              part: "c",
              marks: 5,
              topic: "floating-point",
              prompt: md`What is the use of the bias in floating-point representation? Give the encoding of the floating-point "infinity".`,
            },
          ],
        },
        {
          no: 8,
          parts: [
            {
              part: "a",
              marks: 20,
              topic: "mips-programming",
              prompt: md`Consider the following C code, which calculates a^b (a raised to the power b):

\`\`\`
int fun (int a, int b)
{
    if (b == 0)
        return 0;
    else if (b % 2 == 0)
        return fun (a*a, b/2);
    return fun (a*a, b/2) * a;
}
\`\`\`

Write down the equivalent MIPS assembly code for it. Use a minimal number of MIPS instructions.`,
            },
            {
              part: "b",
              marks: 10,
              topic: "floating-point",
              prompt: md`What are the steps of floating-point addition? Describe with an example. Also, write down the conditions for overflow and underflow during a floating-point addition.`,
            },
            {
              part: "c",
              marks: 5,
              topic: "addressing",
              prompt: md`What is the problem in the following code snippet? How can you solve the problem?

| Address | Instruction |
|---|---|
| 005000 | \`beq $s0, $s1, 30500\` |`,
            },
          ],
        },
      ],
    },
  ],
}
