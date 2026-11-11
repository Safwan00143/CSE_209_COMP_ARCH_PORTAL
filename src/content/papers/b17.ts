import type { Paper } from "../types"
import { md } from "../md"

export const paperB17: Paper = {
  slug: "b17",
  batch: "17 batch",
  course: "CSE 305",
  session: "2019-2020",
  year: 2021,
  exam: "L-3/T-1 B. Sc. Engineering Examinations 2019-2020",
  date: "18/09/2021",
  fullMarks: 210,
  time: "2 hours and 30 minutes",
  sections: [
    {
      name: "Section A",
      instructions: "There are FOUR questions in this section. Answer any THREE.",
      questions: [
        {
          no: 1,
          parts: [
            {
              part: "a",
              marks: 15,
              topic: "performance",
              prompt: md`Suppose we want to compare the performance of Computer System A with Computer System B. For this purpose, Program 1 is run in both the computer systems and the corresponding information (logs) is captured. The logs are presented below in Table 1.1 and Table 1.2.

**Table 1.1: Logs from Computer System A**

| Operation | Required clock cycle(s) |
|---|---|
| Multiplication 1 of Program 1 | 4 |
| Addition 1 of Program 2 | 2 |
| I/O overhead time required by OS | 5 |
| Multiplication 2 of Program 1 | 4 |
| Division 1 of Program 1 | 5 |
| Multiplication 1 of Program 2 | 4 |
| I/O overhead time required by OS | 2 |
| Division 2 of Program 1 | 5 |
| I/O overhead time required by OS | 4 |
| Addition 1 of Program 3 | 2 |
| Addition 1 of Program 1 | 2 |

**Table 1.2: Logs from Computer System B**

| Operation | Required clock cycle(s) |
|---|---|
| Multiplication 1 of Program 4 | 5 |
| Multiplication 1 of Program 1 | 5 |
| I/O overhead time required by OS | 1 |
| Multiplication 2 of Program 1 | 5 |
| Division 1 of Program 1 | 6 |
| Multiplication 2 of Program 4 | 5 |
| Addition 1 of Program 4 | 3 |
| I/O overhead time required by OS | 3 |
| Addition 2 of Program 4 | 3 |
| Division 2 of Program 1 | 6 |
| Addition 1 of Program 1 | 3 |

If the clock rates of Computer System A and Computer System B are 2 GHz and 2.5 GHz respectively, then compare their performances based on the execution time of Program 1.`,
            },
            {
              part: "b",
              marks: 12,
              topic: "performance",
              prompt: md`What is the importance of Moore's Law? "To increase the overall performance of a computer by $x$ amount, it is required to identify the most important aspect of the computer and improve its performance by $x$ amount." Do you agree or disagree with the statement? Justify your answer with proper mathematical explanation. (4 + 8)`,
            },
            {
              part: "c",
              marks: 8,
              topic: "sync-linking",
              prompt: md`What are the advantages of using Dynamically Linked Libraries (DLL) during a C program execution? What is the role of JIT in Java program execution? (4 + 4)`,
            },
          ],
        },
        {
          no: 2,
          parts: [
            {
              part: "a",
              marks: 20,
              topic: "alu-design",
              alsoAsked: ["2020-21 Q10(b)"],
              prompt: md`Suppose you want to design a 4-bit ALU where the inputs to the ALU are A ($A_3A_2A_1A_0$) and B ($B_3B_2B_1B_0$), and the selection variables are $S_3, S_2, S_1$ and $S_0$. Also, consider $X_i, Y_i$ and $Z_i$ as the inputs to the $i^{th}$ parallel adder of the ALU. The ALU must satisfy the following functional design specification (Table 2a) that has to be realized through the parallel adders. Your task is to derive the input equations ($X_i, Y_i$ and $Z_i$) for the parallel adders of the ALU. You must design using the least possible number of gates.

**Table 2a: Required functional design specification**

| $S_3$ | $S_2$ | $S_1$ | $S_0$ | Required function |
|---|---|---|---|---|
| 0 | 0 | 0 | 0 | $F = A'$ |
| 0 | 0 | 0 | 1 | $F = A' + 1$ |
| 0 | 0 | 1 | 0 | $F = A' + B$ |
| 0 | 0 | 1 | 1 | $F = A' + B + 1$ |
| 0 | 1 | 0 | 0 | $F = A' - B - 1$ |
| 0 | 1 | 0 | 1 | $F = A' - B$ |
| 0 | 1 | 1 | 0 | $F = A' - 1$ |
| 0 | 1 | 1 | 1 | $F = A'$ |
| 1 | 0 | 0 | x | $F = (AB)'$ [NAND] |
| 1 | 0 | 1 | x | $F = A\odot B$ [XNOR] |
| 1 | 1 | 0 | x | $F = A\oplus B$ [XOR] |
| 1 | 1 | 1 | x | $F = A \lor B$ [OR] |`,
            },
            {
              part: "b",
              marks: 15,
              topic: "alu-design",
              alsoAsked: ["2020-21 Q12(d)"],
              prompt: md`Suppose you want to implement a hardware unit that would produce the value of $F$ using the following logic (given in C syntax).

\`\`\`
if ((A>=B && C!=D) || X==0)
    F=1;
else
    F=0;
\`\`\`

Here, each of the variables A, B, C, D and X is of 4 bits, and F is of 1 bit. You bought some basic gates and some status-generator modules (Figure 2b), each of which takes two 4-bit inputs and shows only the four status bits (V: Overflow, Z: Zero, S: Sign and C: Carry) for the subtraction of the 2nd input from the 1st input.

\`\`\`fig
alu-status
\`\`\`

Now (just) draw the circuit diagram of the full hardware unit using basic gates and status-generator modules.`,
              note: "Figure 2b in the paper is a plain box with two 4-bit inputs and outputs V, Z, S, C; the figure shown is the slides' status-bit circuit, which computes the same four bits.",
            },
          ],
        },
        {
          no: 3,
          parts: [
            {
              part: "a",
              marks: 15,
              topic: "mips-programming",
              alsoAsked: ["2022-23 Q6(c)"],
              prompt: md`Write down the equivalent MIPS code for each of the following C code fragments. (6 + 5 + 4)

i. Code Fragment 1:

\`\`\`
sum = 0;
x = 100;
while (x>=-5)
{
    sum = sum + x;
    x = x-1;
}
\`\`\`

ii. Code Fragment 2:

\`\`\`
if(x>y+131075)
    x=1;
\`\`\`

iii. Code Fragment 3:

\`\`\`
x = A[131075]+5;
\`\`\``,
            },
            {
              part: "b",
              marks: 12,
              topic: "sync-linking",
              prompt: md`With an appropriate example, briefly describe how pseudoinstructions work. Suppose there is a critical section in your code where performance matters. Do you think it is always a good idea to write the assembly code by yourself for such a scenario? Justify your answer. (6 + 2 + 4)`,
            },
            {
              part: "c",
              marks: 8,
              topic: "isa-basics",
              prompt: md`Why does the MIPS multiplication operation always strictly demand three operands? Why has the number of registers in the MIPS architecture been restricted to 32? (4 + 4)`,
            },
          ],
        },
        {
          no: 4,
          parts: [
            {
              part: "a",
              marks: 15,
              topic: "floating-point",
              prompt: md`Suppose you are working in a system where 16 bits are used to represent a floating-point value. The largest absolute floating-point value that can be represented by the system is $1.11\ldots1_{two}\times2^{63}$, while the smallest absolute floating-point value that can be represented is $1.00\ldots0_{two}\times2^{-62}$. (6 + 5 + 4)

i. Show the floating-point representation format (bit distribution among sign, exponent and fraction) of this system.

ii. Show the floating-point representation of the number $-110.11_{two}\times2^{1}$ in this system, assuming an appropriate bias.

iii. What is the smallest absolute denormalized floating-point value that can be stored in this system?`,
              note: "Part iii (denormalized numbers) is not covered in the lecture slides; parts i and ii are solved.",
            },
            {
              part: "b",
              marks: 12,
              topic: "int-arithmetic",
              prompt: md`See the diagram (Figure 4b) of the following multiplication hardware.

\`\`\`fig
arith-mult-v1
\`\`\`

Briefly describe the reasons why this hardware is inefficient for a multiplication operation. What changes are required to make this hardware efficient? Draw the diagram of the efficient hardware. (4 + 4 + 4)`,
            },
            {
              part: "c",
              marks: 8,
              topic: "floating-point",
              prompt: md`Consider the following C code fragment.

\`\`\`
if(a>b)
   c = c-(c*e)/d;
else
   c = c+d;
\`\`\`

If a, b, c, d and e are variables of type double and their values are already loaded in registers \`$f2\`, \`$f4\`, \`$f6\`, \`$f8\` and \`$f10\` respectively, then write down the equivalent MIPS assembly code for it. Use the least number of MIPS instructions possible.`,
              outOfScope: "Floating-point MIPS instructions are not covered in the lecture slides",
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
              marks: 15,
              topic: "data-hazards",
              prompt: md`Assume pipelined execution for the following sequence of instructions. The corresponding C code is A = B + C; D = A + D.

\`\`\`
lw  $t1, 0($t0)     # load B
lw  $t2, 4($t0)     # load C
add $t3, $t1, $t2   # add B & C
sw  $t3, 12($t0)    # store A
lw  $t4, 8($t0)     # load D
add $t4, $t3, $t4   # add A & D
sw  $t4, 8($t0)     # store D
\`\`\`

Draw the execution pipeline for the given sequence of instructions and clearly show the stalls and the forwarding paths. Note that data forwarding is available if needed.`,
            },
            {
              part: "b",
              marks: 5,
              topic: "data-hazards",
              prompt: md`How many stalls and clock cycles are required in question 5(a)?`,
            },
            {
              part: "c",
              marks: 15,
              topic: "data-hazards",
              prompt: md`Is it possible to rearrange the code in question 5(a) to reduce the required number of stalls? If not, then explain why it is not possible. If yes, then write down the rearranged code block and indicate the number of stalls and the total number of clock cycles required after the rearrangement.`,
            },
          ],
        },
        {
          no: 6,
          parts: [
            {
              part: "a",
              marks: 20,
              topic: "caches",
              prompt: md`Assume there are three small caches, each consisting of eight (8) one-word blocks. One cache is direct-mapped, a second is two-way set-associative, and the third is four-way set-associative. For each cache organization, complete the following table for the sequence of memory block addresses: 0, 12, 16, 18 and 0. You may subdivide the third column as needed.

Note that when it is necessary to replace an existing cache entry on a cache miss, follow the least recently used (LRU) replacement rule to determine which cache entry to replace, and show the cache content after the replacement.

| Address of memory block accessed | Hit or miss | Contents of cache blocks after reference |
|---|---|---|
| 0 | | |
| 12 | | |
| 16 | | |
| 18 | | |
| 0 | | |`,
            },
            {
              part: "b",
              marks: 15,
              topic: "caches",
              alsoAsked: ["2022-23 Q2(b)"],
              prompt: md`Assuming a cache of 4K blocks, a 4-word block size, and a 32-bit address, find the total number of tag bits for a cache that is eight-way set associative.`,
            },
          ],
        },
        {
          no: 7,
          parts: [
            {
              part: "a",
              marks: 20,
              topic: "caches",
              prompt: md`How many total bits are required for a direct-mapped cache with 64 KB of data and 8-word blocks (i.e., 32 bytes), assuming a 32-bit address?`,
            },
            {
              part: "b",
              marks: 5,
              topic: "virtual-memory",
              prompt: md`The TLB acts as a cache of the page table for the entries that map to physical pages only, as shown in Figure 7b. Write down the purpose of the tag bits in the TLB.`,
              note: "Figure 7b is the slides' TLB figure (P&H Figure 5.29): a TLB with valid, dirty, ref, tag and physical page fields in front of the page table.",
            },
            {
              part: "c",
              marks: 10,
              topic: "virtual-memory",
              prompt: md`Explain how a TLB miss is handled.`,
            },
          ],
        },
        {
          no: 8,
          parts: [
            {
              part: "a",
              marks: 15,
              topic: "single-cycle",
              prompt: md`Figure 8a shows a single-cycle datapath implementation of a subset of the MIPS instruction set. For each of the following three instructions, add, sw and beq, determine the values (0/1) of the following control signals: RegDst, Branch, MemRead, MemtoReg, MemWrite, ALUSrc, RegWrite. (5 × 3)

\`\`\`fig
dp-full
\`\`\``,
            },
            {
              part: "b",
              marks: 8,
              topic: "branch-hazards",
              prompt: md`Draw the finite state machine for a 2-bit dynamic branch prediction scheme.`,
            },
            {
              part: "c",
              marks: 12,
              topic: "data-hazards",
              alsoAsked: ["2022-23 Q1(c)"],
              prompt: md`Figure 8c shows a pipelined execution of three instructions sub, and, and or. The pipeline registers are IF/ID, ID/EX, EX/MEM and MEM/WB. The data forwarding path between sub and and is shown in green, and the path between sub and or in yellow. For each of these two data forwarding cases, write down the data forwarding conditions. (6 × 2)

\`\`\`fig
b17-8c
\`\`\``,
              note: "Figure 8c is the slides' forwarding example, in which sub writes register 2, and reads it as its first operand and or reads it as its second. The figure here is drawn from those instructions; its two forwarding arrows are the paper's green and yellow paths.",
            },
          ],
        },
      ],
    },
  ],
}
