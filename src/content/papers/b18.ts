import type { Paper } from "../types"
import { md } from "../md"

export const paperB18: Paper = {
  slug: "b18",
  batch: "18 batch",
  course: "CSE 305",
  session: "2020-2021",
  year: 2022,
  exam: "L-3/T-1 B. Sc. Engineering Examinations 2020-2021",
  date: "24/09/2022",
  fullMarks: 210,
  time: "3 hours",
  sections: [
    {
      name: "Section A",
      instructions: "There are NINE questions in this section. Answer any SEVEN questions.",
      questions: [
        {
          no: 1,
          parts: [
            {
              part: "",
              marks: 15,
              topic: "performance",
              prompt: md`You have surely learnt about the eight big ideas of computer architecture. They are again mentioned below to brush up your memory:
- Design for Moore's Law
- Use abstraction to simplify design
- Make the common case fast
- Performance via parallelism
- Performance via pipelining
- Performance via prediction
- Hierarchy of memories
- Dependability via redundancy

Now identify the statements below best relate to which of the above ideas. Each statement should relate to a single idea. Elaborate the justification behind your answer.
- (a) Code reordering is done to avoid the use of load result in the next instruction.
- (b) Different caches for data and memory can effectively increase bandwidth.
- (c) As CPUs have hit their physical performance barrier due to power limit issues, GPUs have started gaining increased popularity among the programming community.`,
            },
          ],
        },
        {
          no: 2,
          parts: [
            {
              part: "",
              marks: 15,
              topic: "performance",
              prompt: md`What is your most favorite topic learnt from processor, memory hierarchy, and multiprocessors? Describe briefly.`,
              outOfScope: "An open essay question with no fixed answer",
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
              prompt: md`A full datapath with a control unit is given in Figure 1. Highlight the datapath elements that will be active for the \`ori $t1, 100($t2)\` instruction. Also, mention which control bits will be set. [You may highlight the given figure and attach it to your answer script.]`,
              note: "Figure 1 is not in the scanned paper; the solution uses the slides' single-cycle datapath. The instruction is printed in load/store form (offset 100, base t2); the solution reads it as the I-format ori with destination t1, source t2 and immediate 100.",
            },
          ],
        },
        {
          no: 4,
          parts: [
            {
              part: "",
              marks: 15,
              topic: "data-hazards",
              prompt: md`Suppose you are maintaining a 5-stage pipeline in a MIPS datapath. You are given the following code snippet to execute. Identify all the data hazards that can occur using a multi-cycle pipeline diagram and mark where there is a need for forwarding. Also write down the forwarding conditions to mitigate the hazards. Can all of the hazards in this snippet be addressed using forwarding? Defend your position.

\`\`\`
lw  $t0, 0($t1)
add $t0, $t0, $t1
add $t0, $t2, $t0
add $t0, $t0, $t3
sub $t1, $t2, $t3
and $t4, $t5, $t6
sw  $t0, 0($t6)
\`\`\``,
            },
          ],
        },
        {
          no: 5,
          parts: [
            {
              part: "",
              marks: 15,
              topic: "multiple-issue",
              prompt: md`You are given the following code snippet and have been tasked to run multiple issues in parallel for faster execution. Refactor the code so that IPC is maximized. Also compute the effective IPC. [Hint: you do not have to limit the code to two issues.]

\`\`\`
Loop: lw   $t0, 0($s0)
      lw   $t1, 0($s1)
      addu $t0, $t0, $t1
      sw   $t0, 0($s1)
      addi $s0, $s0, -4
      addi $s1, $s1, -4
      bne  $s1, $zero, Loop
\`\`\``,
            },
          ],
        },
        {
          no: 6,
          parts: [
            {
              part: "",
              marks: 15,
              topic: "caches",
              prompt: md`Answer the questions below for the following memory address subdivision and a 2-way set associate LRU cache:

| 31 … 20 | 19 … 12 | 11 … 2 | 1 … 0 |
|---|---|---|---|
| 12-bits | 8-bits | 10-bits | 2-bits |

- (a) How many distinct blocks of data can there be in the cache?
- (b) In which cache index will the decimal address 24092022 map to?
- (c) If a cache index is valid, what is the probability that one of its elements will have to be replaced in the next request? Assume each memory address has equal likelihood of being requested and each element in a cache index has equal likelihood of being filled.`,
            },
          ],
        },
        {
          no: 7,
          parts: [
            {
              part: "",
              marks: 15,
              topic: "cache-performance",
              prompt: md`Suppose in a memory hierarchy there are four types of memories: Cache → RAM → SSD → HDD. Their local miss rates are 5%, 15%, 25%, and 0% respectively. Their access times are 1, 10, 100, and 1,000 cycles respectively. Now answer the following questions:
- (a) What is the probability that a data will be fetched from the SSD?
- (b) What is the expected time of a fetch?
- (c) If the cache is separated into an I-cache and a D-cache, what will the miss rate of the I-cache be for a program that accesses data elements in 10% of its instructions if the overall miss rate remains constant (i.e., 5%) and the D-cache miss rate is 10%?`,
            },
          ],
        },
        {
          no: 8,
          parts: [
            {
              part: "",
              marks: 15,
              topic: "virtual-memory",
              prompt: md`Suppose you have implemented an approximate LRU page replacement scheme using a reference bit for each page table entry. Your virtual memory has eight and page table has four entries. After every four time-steps, the reference bits are cleared. Assuming a fully set associative page table, simulate your page replacement scheme for the virtual memory reference below:

$$
0, 0, 2, 7, 0, 6, 1, 2, 6, 7, 1, 1, 7, 1, 4, 1
$$

You have to print the page table after each page table reference. You also have to mention whether or not it is a hit or miss.`,
            },
          ],
        },
        {
          no: 9,
          parts: [
            {
              part: "",
              marks: 15,
              topic: "multiple-issue",
              prompt: md`You want to perform two sums in a program: one is a sum of 8 scalar variables and another is a matrix sum of a pair of two-dimensional arrays of size 8 by 8. Assume you are doing these sums with 8 processors.
- (a) Assume only the matrix sum is parallelizable, what speed-up will you get with 8 versus 16 processors?
- (b) Again assuming only the matrix sum is parallelizable, calculate the speed-up when the matrices grow to 16 by 16.
- (c) Devise a recursive algorithm to speed-up the scalar sum and calculate the new speed-up.`,
              outOfScope: "Multiprocessor speed-up is not covered in the lecture slides",
            },
          ],
        },
      ],
    },
    {
      name: "Section B",
      instructions: "There are FOUR questions in this section. Answer any THREE questions.",
      questions: [
        {
          no: 10,
          parts: [
            {
              part: "a",
              marks: 12,
              topic: "performance",
              prompt: md`Briefly explain the eight great ideas in Computer Architecture.`,
            },
            {
              part: "b",
              marks: 18,
              topic: "alu-design",
              prompt: md`Suppose you want to design a 4-bit ALU where the inputs to the ALU are A $(A_3A_2A_1A_0)$ and B $(B_3B_2B_1B_0)$, and the selection variables are $S_3$, $S_2$, $S_1$ and $S_0$. Also, consider $X_i$, $Y_i$ and $Z_i$ as the inputs to the i-th parallel adder of the ALU. The ALU must satisfy the following functional design specification (given in Table 10b) that has to be realized through the parallel adders. Your task is to derive the input equations ($X_i$, $Y_i$ and $Z_i$) for the parallel adders of the ALU. You must design using the least possible number of gates.

| $S_3$ | $S_2$ | $S_1$ | $S_0$ | Required Functions |
|---|---|---|---|---|
| 0 | 0 | 0 | 0 | F = A |
| 0 | 0 | 0 | 1 | F = A − 1 |
| 0 | 0 | 1 | 0 | F = A + B + 1 |
| 0 | 0 | 1 | 1 | F = A + B |
| 0 | 1 | 0 | 0 | F = A − B |
| 0 | 1 | 0 | 1 | F = A − B − 1 |
| 0 | 1 | 1 | 0 | F = A + 1 |
| 0 | 1 | 1 | 1 | F = A |
| 1 | 0 | 0 | X | F = A′ |
| 1 | 0 | 1 | X | F = AB′ |
| 1 | 1 | 0 | X | F = A ⊙ B (XNOR) |
| 1 | 1 | 1 | X | F = A ∨ B (OR) |`,
              alsoAsked: ["2019-20 Q2(a)"],
            },
            {
              part: "c",
              marks: 5,
              topic: "int-arithmetic",
              prompt: md`Briefly describe how to perform a signed multiplication operation.`,
              outOfScope: "Signed multiplication is not covered in the lecture slides",
            },
          ],
        },
        {
          no: 11,
          parts: [
            {
              part: "a",
              marks: 10,
              topic: "performance",
              prompt: md`Suppose a hypothetical performance benchmark SPECBM101 runs on a computing system and the following data is obtained.

| Description | Execution Time (seconds) | Reference Time (seconds) |
|---|---|---|
| Program 1 | ? | 9770 |
| Program 2 | 527 | 10490 |
| Program 3 | 586 | 12100 |
| Program 4 | 109 | 20720 |
| Program 5 | 470 | 7020 |
| Program 6 | 275 | 6900 |

If the geometric mean of the benchmark is 28.74 seconds, what is the execution time of Program 1?`,
              outOfScope: "SPEC benchmarks are not covered in the lecture slides",
            },
            {
              part: "b",
              marks: 8,
              topic: "alu-design",
              prompt: md`Consider the following figure (Figure 11b) of a processor unit employing a scratchpad memory. How many micro operations does it require to complete an addition operation with two operands, and store the result? Which changes and constraints are required to reduce the number of micro operations to only one?`,
              outOfScope: "The scratchpad processor unit (Mano §9.2) is not covered in the lecture slides",
            },
            {
              part: "c",
              marks: 12,
              topic: "mips-programming",
              prompt: md`Write the equivalent efficiency sequence of MIPS instructions for the following C code fragment.

\`\`\`
int testFunc (int a, int b, int c)
{
    int i=0, result=0;
    do
    {
        if(i>b)
            result += c;
        i++;
    }while (i<a);
    return result;
}
\`\`\`

Assume, \`$s1\` and \`$s2\` will carry the values of variable *i* and variable *result*, respectively.`,
            },
            {
              part: "d",
              marks: 5,
              topic: "isa-basics",
              prompt: md`Provide an illustrative example for showing how MIPS architecture follows the design principle: "Good design demands good compromises."`,
            },
          ],
        },
        {
          no: 12,
          parts: [
            {
              part: "a",
              marks: 8,
              topic: "performance",
              prompt: md`The data for the two programs A and B are given below.

| Instruction Type | Clock Cycle per Instruction (CPI) | Instruction Count in Program A | Instruction Count in Program B |
|---|---|---|---|
| Multiplication | 3 | 2 | 3 |
| Addition | 1 | 1 | 2 |
| Subtraction | 2 | 4 | 3 |
| Division | 4 | 2 | 2 |

Which program has the higher average clock cycle per instruction?`,
            },
            {
              part: "b",
              marks: 10,
              topic: "addressing",
              prompt: md`Consider the following MIPS code:

\`\`\`
L1: bne  $t0, $t1, L3
L2: j    LX
L3: addi $t0, $t1, 1
\`\`\`

Now, if the opcode of *j*, *bne* and *addi* are 2, 5 and 8 respectively, the register \`$t0\` and \`$t1\` are indicated by register values 8 and 9 respectively, and the addresses are L1 → 1000, L2 → 1004, L3 → 1008, LX → 131072, then, write down the instruction format name and the instruction values for each of the above-mentioned instructions. The following example is provided as a hint.

**Example:** Consider the following MIPS instruction: \`add $s1, $s2, $s3\`. The instruction format is R-format and instruction values should be:

| Address | 6 bits | 5 bits | 5 bits | 5 bits | 5 bits | 6 bits |
|---|---|---|---|---|---|---|
| 0400 | 0 | 18 | 19 | 17 | 0 | 0 |`,
            },
            {
              part: "c",
              marks: 9,
              topic: "floating-point",
              prompt: md`Briefly explain the importance of guard digit, round digit, and sticky bit during rounding an intermediate floating point number.`,
              outOfScope: "Guard, round and sticky bits are not covered in the lecture slides",
            },
            {
              part: "d",
              marks: 8,
              topic: "alu-design",
              prompt: md`Consider the following module. This module takes two 4-bit inputs, and shows only the four status bits (V: Overflow, Z: Zero, S: Sign and C: Carry) considering the subtraction operation of the second input from the first input. If the first 4-bit input is expressed by A and second 4-bit input is expressed by B, draw the diagram of the complete circuit that can determine whether A>B, A=B, or A<B.`,
              alsoAsked: ["2019-20 Q2(b)"],
            },
          ],
        },
        {
          no: 13,
          parts: [
            {
              part: "a",
              marks: 16,
              topic: "floating-point",
              prompt: md`Consider a 32-bit system where 24 bits are reserved for fraction, one bit for sign, and the rest for exponent. Answer the following questions.
- (i) Why is bias used during the floating point representation?
- (ii) What should be the value of the bias for this system? Why?
- (iii) What are the smallest and the largest absolute values that can be stored in this system?
- (iv) What is the smallest denormalized number that can be stored using this system?`,
              note: "Part (iv), on denormalised numbers, is not covered in the lecture slides and is not solved.",
            },
            {
              part: "b",
              marks: 7,
              topic: "addressing",
              prompt: md`How is address calculation performed in PC-relative addressing?`,
            },
            {
              part: "c",
              marks: 7,
              topic: "floating-point",
              prompt: md`Write the equivalent efficient sequence of MIPS instructions for the following C code fragment. Assume appropriate registers for each of the variables.

\`\`\`
float a, b, c;
double w, x, y, z;
if (a+b>c)
    x=(y*z)/w;
\`\`\``,
              outOfScope: "Floating-point MIPS instructions are not covered in the lecture slides",
            },
            {
              part: "d",
              marks: 5,
              topic: "isa-basics",
              prompt: md`What are the main differences between x86 architecture and MIPS architecture?`,
              outOfScope: "x86 is only mentioned in passing on the slides",
            },
          ],
        },
      ],
    },
  ],
}
