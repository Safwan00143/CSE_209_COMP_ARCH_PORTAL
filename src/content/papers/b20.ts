import type { Paper } from "../types"
import { md } from "../md"

export const paperB20: Paper = {
  slug: "b20",
  batch: "20 batch",
  course: "CSE 305",
  session: "2022-2023",
  year: 2024,
  exam: "L-3/T-1 B. Sc. Engineering Examinations 2022-2023",
  date: "25/04/2024",
  fullMarks: 210,
  time: "3 hours",
  sections: [
    {
      name: "Section A",
      instructions: "There are FOUR questions in this section. Answer Question No. 1 (Mandatory) and any TWO other questions.",
      questions: [
        {
          no: 1,
          stem: md`Assume pipelined execution for the following sequence of instructions.

\`\`\`
ins 1: sub $2, $1, $3
ins 2: and $2, $2, $5
ins 3: or  $6, $2, $7
\`\`\``,
          parts: [
            {
              part: "a",
              marks: 12,
              topic: "data-hazards",
              prompt: md`Assume that **no data forwarding mechanism** is available to you. Construct the execution pipeline for the given sequence along with the stalls required to produce correct output. Evaluate the total number of clock cycles required to execute all three instructions.`,
            },
            {
              part: "b",
              marks: 16,
              topic: "data-hazards",
              prompt: md`Adapt **data forwarding mechanism** for the instruction set in Question 1(a) to enhance parallelism. Reconstruct the execution pipeline for the given sequence showing all pipelined registers and the forwarding lines. Revise the evaluation of the total number of clock cycles required to execute all three instructions. Explain double-data hazard with the help of your constructed pipeline.`,
            },
            {
              part: "c",
              marks: 7,
              topic: "data-hazards",
              prompt: md`Formulate the data forwarding condition between ins 1 and ins 2 in your constructed pipeline for 1(b).`,
              alsoAsked: ["2019-20 Q8(c)"],
            },
          ],
        },
        {
          no: 2,
          parts: [
            {
              part: "a",
              marks: 20,
              topic: "caches",
              prompt: md`Assume that there are two small caches, each consisting of eight (8) blocks. One cache is direct-mapped, and the other is a two-way set-associative cache. For each cache organization,
- (i) Construct the following table for each cache organization for the following sequence of memory block addresses: 32, 36, 35, 32, 48, 32, 51 and 35. Note that you are allowed to subdivide the column "Cache content after access" as needed. Also, when it is necessary to replace an existing cache entry on a cache miss, follow the least recently used (LRU) replacement policy.

| Address of Memory Block Accessed | Cache Index | Hit or Miss | Cache content after access |
|---|---|---|---|

- (ii) Compute the hit ratio from the constructed tables in (i) for each cache organization.`,
            },
            {
              part: "b",
              marks: 15,
              topic: "caches",
              prompt: md`How many total bits are required for an **eight-way set associative** cache of 4K blocks, a 4-word block size (i.e., 16 bytes), assuming a 32-bit address? [Show set number and tag bit calculations.]`,
              alsoAsked: ["2019-20 Q6(b)"],
            },
          ],
        },
        {
          no: 3,
          parts: [
            {
              part: "a",
              marks: 25,
              topic: "cache-performance",
              prompt: md`Suppose we have a processor with a base CPI of 2.0, assuming all references hit in the primary cache, and a clock cycle length of 0.5 ns. Assume a main memory access time of 150 ns, including all the miss handling. Suppose the miss rate per instruction at the primary cache is 5%.
- (i) Calculate the total CPI for one-level of caching. How much faster the ideal CPU is?
- (ii) Now assume that we add a secondary cache that has a 15 ns access time for either a hit or a miss and is large enough to reduce the miss rate to 0.5%. The miss rate for primary cache remains 5%. Calculate the total CPI for two-level of caching. [Note that this secondary cache is accessed when there is a miss in the primary cache]
- (iii) How much faster will the processor be with a two-level of caching compared to the processor with just one-level of caching?`,
            },
            {
              part: "b",
              marks: 5,
              topic: "virtual-memory",
              prompt: md`What is difference between a virtual address and a physical address of instructions of a program? What is the purpose of the virtual addressing of instructions of a program?`,
            },
            {
              part: "c",
              marks: 5,
              topic: "virtual-memory",
              prompt: md`Consider a mapping of a 64-bit virtual address and to a 30-bit physical address. How many entries are there in the page table if the page size is 8 KB.`,
            },
          ],
        },
        {
          no: 4,
          parts: [
            {
              part: "a",
              marks: 16,
              topic: "single-cycle",
              prompt: md`Consider the following branch type instruction format given in Figure for Question 4(a) assuming 32 bit addressing. Construct the formula to calculate branch target address. Draw the single cycle datapath for branch-on-equal instruction assuming 32 bit addressing. [Include only the relevant components and control lines in your design. For example, you can exclude data memory from your design.]

\`\`\`fig
b20-4a-format
\`\`\``,
            },
            {
              part: "b",
              marks: 12,
              topic: "branch-hazards",
              prompt: md`Four hardware components have been added in the ID stage of the pipelined datapath design as shown in Figure for Question 4(b) to reduce branch stalls. Write down the names of these four newly added components. Explain how the branch decision and the target address becomes available by the end of the ID stage of the *beq* instruction.

(The figure is the slides' "reducing branch delay" datapath, with \`36: sub $10, $4, $8\`, \`40: beq $1, $3, 7\` and \`44: and $12, $2, $5\` in the pipeline and IF.Flush marked.)`,
            },
            {
              part: "c",
              marks: 7,
              topic: "multiple-issue",
              prompt: md`Briefly explain the following concepts:
- i. Shared Memory Multiprocessor (SMP)
- ii. SISD vs MIMD`,
              outOfScope: "Multiprocessors and Flynn's categories are not covered in the lecture slides",
            },
          ],
        },
      ],
    },
    {
      name: "Section B",
      instructions: "There are FOUR questions in this section. Question No. 5 is mandatory. Answer any TWO questions from Questions No. 6, 7, and 8. All relevant tables and figures are provided at the end of the question.",
      questions: [
        {
          no: 5,
          stem: "**[MANDATORY QUESTION]**",
          parts: [
            {
              part: "a",
              marks: 7,
              topic: "mips-programming",
              prompt: md`Rachel has a basic MIPS instruction set without support for multiple languages. In an attempt to add such support, she introduces four new instructions: lh (load halfword), lhu (load halfword unsigned), sh (store halfword), and shu (store halfword unsigned). However, Ross argued that she doesn't need all these instructions to achieve multi-language support. Do you agree with Ross? Justify your answer.`,
            },
            {
              part: "b",
              marks: 14,
              topic: "alu-design",
              prompt: md`Howard wants to demonstrate his engineering skills, but Sheldon sets a challenging constraint for him. Howard is tasked with designing a 4-bit Arithmetic Logic Unit (ALU), and the constraint is that he cannot use any parallel adder. Instead, he is only allowed to use parallel subtractors and logic gates for the ALU design. The ALU should have three selection variables, denoted as S0, S1, and S2. These selection variables control the ALU to perform various operations on two 4-bit inputs, Labelled as A and B. Your task is to help Howard design the 4-bit Arithmetic Logic Unit (ALU) so that it can do the following operations:

| $S_2$ | $S_1$ | $S_0$ | Operation |
|---|---|---|---|
| 0 | 0 | 0 | A − B |
| 0 | 0 | 1 | A + B |
| 0 | 1 | 0 | −A − B − 2 |
| 0 | 1 | 1 | B − A |
| 1 | 0 | 0 | A XOR B |
| 1 | 1 | 0 | A AND B |`,
            },
            {
              part: "c",
              marks: 14,
              topic: "sync-linking",
              prompt: md`Assemble the two object files of Figure for Question 5(c)-1 and Figure for Question 5(c)-2. Find the updated addresses of the first few instructions of the completed executable file. Note that all the necessary addresses and symbols must be updated in the link process. [Use Figure for Question 5(c)-3 for reference]

**Object file header for Procedure A**

| | | | |
|---|---|---|---|
| Object file header | Name | Procedure A | |
| | Text size | 150 (hex) | |
| | Data size | 40 (hex) | |
| Text segment | Address | Instruction | |
| | 0 | \`lw $a0, 0($gp)\` | |
| | 4 | \`jal 0\` | |
| | … | … | |
| Data segment | 0 | (X) | |
| | … | … | |
| Relocation information | Address | Instruction type | Dependency |
| | 0 | lw | X |
| | 4 | jal | B |
| Symbol table | Label | Address | |
| | X | – | |
| | B | – | |

**Object file header for Procedure B**

| | | | |
|---|---|---|---|
| Object file header | Name | Procedure B | |
| | Text size | 350 (hex) | |
| | Data size | 50 (hex) | |
| Text segment | Address | Instruction | |
| | 0 | \`sw $a1, 0($gp)\` | |
| | 4 | \`jal 0\` | |
| | … | … | |
| Data segment | 0 | (Y) | |
| | … | … | |
| Relocation information | Address | Instruction type | Dependency |
| | 0 | sw | Y |
| | 4 | jal | A |
| Symbol table | Label | Address | |
| | Y | – | |
| | A | – | |

**The MIPS memory allocation for program and data** (Figure for Question 5(c)-3): \`$sp\` → 7fff fffc (hex), stack growing down; dynamic data; static data with \`$gp\` → 1000 8000 (hex), starting at 1000 0000 (hex); text starting at pc → 0040 0000 (hex); reserved below.`,
            },
          ],
        },
        {
          no: 6,
          parts: [
            {
              part: "a",
              marks: 5,
              topic: "performance",
              prompt: md`Joey claims that the number of cycles is identical to the number of instructions. Do you agree with Joey's statement? Justify your answer.`,
            },
            {
              part: "b",
              marks: 7,
              topic: "sync-linking",
              prompt: md`What support does the MIPS instruction-set architecture provide for synchronization? Explain with an example.`,
              alsoAsked: ["2016-17 Q6(b)", "2014-15 Q6(b)", "2013-14 Q7(a)"],
            },
            {
              part: "c",
              marks: 8,
              topic: "mips-programming",
              prompt: md`Write down the equivalent MIPS code for the following C code, considering registers \`$t1\` and \`$t2\` for variables x and y, respectively:

\`\`\`
if (x > y + 131075)
    x = 8;
\`\`\``,
              alsoAsked: ["2019-20 Q3(a)"],
            },
            {
              part: "d",
              marks: 15,
              topic: "performance",
              prompt: md`Consider two different implementations (P1 and P2) of the same instruction-set architecture. The instructions can be divided into four classes according to their CPI (class A, B, C, and D). P1 with a clock rate of 2.7 GHz and CPIs of 2, 1, 3 and 2, and P2 with a clock rate of 3.2 GHz and CPIs of 2, 3, 2, and 3.

Leonard develops a program with a dynamic instruction count of 1.2 E6 instructions, which is divided into the following classes: 20% class A, 25% class B, 40% class C, and 15% class D.
- (i) Find the number of clock cycles required in both cases.
- (ii) Which implementation is faster and how much faster compared to the other one?
- (iii) If Sheldon has improved 40 percent of the code for the program, determine the maximum possible improvement factor Sheldon can obtain for that program.`,
            },
          ],
        },
        {
          no: 7,
          parts: [
            {
              part: "a",
              marks: 5,
              topic: "performance",
              prompt: md`Define response time and throughput. Are these two terms synonymous?`,
            },
            {
              part: "b",
              marks: 7,
              topic: "isa-basics",
              prompt: md`Chandler has used 40 variables in his program, whereas the MIPS architecture has only 32 registers. What does the compiler do in such a scenario?`,
            },
            {
              part: "c",
              marks: 8,
              topic: "mips-programming",
              prompt: md`Translate function f (defined below) into MIPS assembly language. If you need to use registers \`$t0\` through \`$t7\`, use the lower-numbered registers first. Assume the function declaration for func is "int func(int a, int b);". The code for function f is as follows:

\`\`\`
int f (int a, int b, int c, int d) {
    return func(func(a,b), c+d);
}
\`\`\``,
            },
            {
              part: "d",
              marks: 15,
              topic: "sync-linking",
              prompt: md`Write about the main difference between static linking and dynamic linking. With the necessary diagrams, explain how dynamically linked libraries (DLLs) are called.`,
              alsoAsked: ["2022-23 (CSE 209) Q12(b)"],
            },
          ],
        },
        {
          no: 8,
          parts: [
            {
              part: "a",
              marks: 7,
              topic: "floating-point",
              prompt: md`Write down equivalent efficient sequence of MIPS instructions for the following C code fragment. Assume appropriate registers for each of the variables.

\`\`\`
float a, b, c;
double w, x, y, z;
if (a+b>c)
    x=(y*z)/ w;
\`\`\``,
              outOfScope: "Floating-point MIPS instructions are not covered in the lecture slides",
            },
            {
              part: "b",
              marks: 8,
              topic: "floating-point",
              prompt: md`Consider a 32-bit system where 19 bits are reserved for fraction, one bit for sign, and the rest for exponent. Answer the following questions:
- (i) What is the precision range of this system?
- (ii) What are the smallest and the largest absolute values that can be stored in this system?
- (iii) What is the smallest denormalized number that can be stored using this system?`,
              note: "Part (iii), on denormalised numbers, is not covered in the lecture slides and is not solved.",
            },
            {
              part: "c",
              marks: 20,
              topic: "floating-point",
              prompt: md`Consider two normalized floating point numbers f1 and f2 that are represented as IEEE single precision floats. This defines two 32-bit strings.
- (i) Suppose f1 is less than f2, that is, f1 < f2. If the same two 32-bit strings were treated as unsigned integers (call them i1 and i2, respectively), can we conclude that i1 < i2?
- (ii) Similar to (i), if the two 32-bit strings were treated as signed integers j1 and j2, can we conclude that j1 < j2?`,
            },
          ],
        },
      ],
    },
  ],
}
