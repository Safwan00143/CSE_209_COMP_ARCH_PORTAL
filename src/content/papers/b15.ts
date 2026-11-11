import type { Paper } from "../types"
import { md } from "../md"

export const paperB15: Paper = {
  slug: "b15",
  batch: "15 batch",
  course: "CSE 305",
  session: "2017-2018",
  year: 2018,
  exam: "L-3/T-1 B. Sc. Engineering Examinations 2017-2018",
  date: "23/09/2018",
  fullMarks: 210,
  time: "3 hours",
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
              marks: 10,
              topic: "data-hazards",
              alsoAsked: ["2022-23 Q1(c)", "2015-16 Q2(d)"],
              prompt: md`Consider the following C code:

$$
A = B + C;\qquad D = A + E;
$$

All the above are memory instructions. The base address is in register t0 and the offsets are A (0), B (4), C (8), D (12), E (16). How many cycles are required to execute the above? Can you reduce the number of cycles using code scheduling? If yes, what will be the resulting number of cycles? Show each step.`,
            },
            {
              part: "b",
              marks: 15,
              topic: "single-cycle",
              prompt: md`Consider the following set of instructions: add, lw, beq. Draw the complete single-cycle datapath (not pipelined) and control that can execute the above set of instructions.`,
            },
            {
              part: "c",
              marks: 5,
              topic: "pipelining",
              prompt: md`Consider the following information for the load word (lw) instruction:

| Instr. | Instruction fetch | Register read | ALU op | Memory access | Register write |
|---|---|---|---|---|---|
| lw | 200 ps | 100 ps | 100 ps | 200 ps | 100 ps |

Consider the following program:

\`\`\`
lw $1, 100($0)
lw $2, 200($0)
lw $3, 300($0)
\`\`\`

What is the speedup for the pipelined datapath over the single-cycle datapath for this program? What will be the speedup if we add 3,000,000 more load word (lw) instructions?`,
            },
            {
              part: "d",
              marks: 5,
              topic: "branch-hazards",
              alsoAsked: ["2023-24 Q1(c)", "2021-22 Q1(d)"],
              prompt: md`"Even with a perfect branch predictor, 1-cycle penalty for a taken branch." Why is that? How to solve this?`,
            },
          ],
        },
        {
          no: 2,
          parts: [
            {
              part: "a",
              marks: 10,
              topic: "data-hazards",
              prompt: md`Briefly explain double data hazard with an example. How does MIPS detect the hazard due to the use of a load instruction, and how does MIPS stall the pipeline?`,
            },
            {
              part: "b",
              marks: 15,
              topic: "data-hazards",
              alsoAsked: ["2023-24 Q1(a)", "2021-22 Q2(a)"],
              prompt: md`Design a complete forwarding unit with necessary equations for MIPS considering double data hazard. Draw the complete forwarding unit using the provided figure (the pipelined datapath with control).`,
              note: "The provided figure is the slides' pipelined datapath with control (P&H Figure 4.51); the solution draws the forwarding unit on the slides' forwarding diagram.",
            },
            {
              part: "c",
              marks: 5,
              topic: "branch-hazards",
              alsoAsked: ["2021-22 Q1(c)"],
              prompt: md`Give the MIPS code for each of the following cases of data hazard for branches:

(i) Needs one cycle stall to resolve

(ii) Needs two cycle stalls to resolve`,
            },
            {
              part: "d",
              marks: 5,
              topic: "branch-hazards",
              alsoAsked: ["2023-24 Q1(c)", "2021-22 Q1(d)"],
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

What is the problem with the above code if we use a 1-bit branch predictor? How can you solve that?`,
            },
          ],
        },
        {
          no: 3,
          parts: [
            {
              part: "a",
              marks: 10,
              topic: "memory-tech",
              prompt: md`What are the three sources of cache misses? The specification of an ideal disk is as follows: sector size 1 MB, rotational speed 10000 rpm, average seek time 5 ms, transfer rate 100 MB/s, and controller overhead 0.5 ms. What is the average read time for the disk? If the average seek time can be reduced to 2 ms, then how much improvement is possible in the average read time?`,
              note: "The paper prints \"rotational latency: 10000 rpm\"; 10000 rpm is the rotational speed, from which the latency is found.",
            },
            {
              part: "b",
              marks: 15,
              topic: "caches",
              prompt: md`What is meant by spatial and temporal locality? Briefly explain the write-through and write-back schemes for a cache. How do the write-through and write-back schemes handle a write miss?`,
            },
            {
              part: "c",
              marks: 5,
              topic: "virtual-memory",
              alsoAsked: ["2021-22 Q3(b)"],
              prompt: md`Briefly explain how the page table works with respect to the virtual address, physical address, main memory and disk.`,
            },
            {
              part: "d",
              marks: 5,
              topic: "cache-performance",
              prompt: md`Assume the miss rate of an instruction cache is 3%, the miss rate of the data cache is 5%, and the frequency of all loads and stores is 40%. If a processor has a CPI of 2 without any memory stalls and the miss penalty is 200 cycles for all misses, determine how much faster the processor would run with a perfect cache that never missed. Also, determine the amount of execution time spent on memory stalls.`,
            },
          ],
        },
        {
          no: 4,
          parts: [
            {
              part: "a",
              marks: 10,
              topic: "cache-performance",
              alsoAsked: ["2021-22 Q3(a)", "2023-24 Q2(a)"],
              prompt: md`Suppose we have a processor with a base CPI of 1.0, assuming all references hit in the primary cache, and a clock rate of 4 GHz. Assume a main memory that has an access time of 200 ns, including all the miss handling. Suppose the miss rate per instruction at the primary cache is 4%. How much faster will the processor be if we add a second-level cache that has a 10 ns access time for either a hit or a miss and is large enough to reduce the miss rate to main memory to 1%? How much faster will the processor be if we add a third-level cache that has a 40 ns access time for either a hit or a miss and is large enough to reduce the miss rate to main memory to 0.5%?`,
            },
            {
              part: "b",
              marks: 15,
              topic: "caches",
              prompt: md`Assume there are three small caches, each consisting of four one-word blocks and using the LRU replacement policy. One cache is fully associative, the second is two-way set-associative, and the third is direct-mapped. Find the number of misses for each cache organization, given the following sequence of block addresses:

1, 3, 5, 1, 3, 1, 3, 5, 3, 1, 5, 3`,
            },
            {
              part: "c",
              marks: 5,
              topic: "virtual-memory",
              prompt: md`What is meant by TLB? Why is a TLB necessary in a virtual memory system?`,
            },
            {
              part: "d",
              marks: 5,
              topic: "virtual-memory",
              alsoAsked: ["2023-24 Q3(a)"],
              prompt: md`Explain (with a flow chart) the interaction between the TLB and the data cache for only the write operation.`,
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
              topic: "performance",
              prompt: md`Suppose there are three classes of instructions A, B and C in a particular instruction set architecture with CPIs 1.2, 2 and 2.5, respectively. The number of instructions from each class in two separate programs P1 and P2 are as follows: (8 + 7)

| Program | A | B | C |
|---|---|---|---|
| P1 | 40 | 10 | 16 |
| P2 | 12 | 13 | 40 |

(i) Which program will execute faster and by how much?

(ii) By how much should we improve the CPI of instruction class B to make P1 execute two times faster? Explain your finding.`,
            },
            {
              part: "b",
              marks: 15,
              topic: "floating-point",
              prompt: md`Consider a half-precision floating-point representation system where each floating-point number is represented by 16 bits, in which the exponent is 4 bits long. Now convert the two floating-point numbers $(0.75)_{10}$ and $(1.25)_{10}$ into the mentioned representation system and then demonstrate the addition of them step by step, along with the values of the exponent and fraction fields at every step.`,
            },
            {
              part: "c",
              marks: 5,
              topic: "floating-point",
              prompt: md`Determine the decimal value of the floating-point number represented by the hexadecimal value $(\texttt{7F80 0005})_{hex}$ according to the IEEE 754 single-precision floating-point format.`,
            },
          ],
        },
        {
          no: 6,
          parts: [
            {
              part: "a",
              marks: 25,
              topic: "alu-design",
              alsoAsked: ["2018-19 Q5(d)"],
              prompt: md`Design an ALU with three selection variables $S_2$, $S_1$ and $S_0$ that performs the following operations on two 4-bit inputs (A and B):

| $S_2$ | $S_1$ | $S_0$ | Operation |
|---|---|---|---|
| 0 | 0 | 0 | Addition |
| 0 | 0 | 1 | Transfer A |
| 0 | 1 | 0 | Decrement A |
| 0 | 1 | 1 | Add 1's complement of B to A |
| 1 | 0 | 0 | XOR |
| 1 | 0 | 1 | AND |
| 1 | 1 | 0 | NOT |
| 1 | 1 | 1 | OR |

Draw the logic diagram of one typical stage of your designed ALU.`,
            },
            {
              part: "b",
              marks: 10,
              topic: "alu-design",
              prompt: md`For each arithmetic operation listed in question 6(a), find out the conditions under which the output carry will be equal to 1.`,
            },
          ],
        },
        {
          no: 7,
          parts: [
            {
              part: "a",
              marks: 25,
              topic: "mips-programming",
              prompt: md`The following C code segment can sort an array of integers in ascending order. Write down the equivalent MIPS assembly code for it. Assume appropriate registers for the variables.

\`\`\`
void swap(int v[], int k)
{
    int temp;
    temp = v[k];
    v[k] = v[k+1];
    v[k+1] = temp;
}

void sort (int v[], int n)
{
    int i, j;
    for (i = 0; i < n; i += 1) {
        for (j = i - 1; j >= 0 && v[j] > v[j + 1]; j -= 1) {
            swap(v, j);
        }
    }
}
\`\`\``,
            },
            {
              part: "b",
              marks: 10,
              topic: "addressing",
              prompt: md`Suppose you are required to jump to the instruction at address $(\texttt{4000 0001})_{hex}$. Write down the MIPS assembly code for this task.`,
            },
          ],
        },
        {
          no: 8,
          parts: [
            {
              part: "a",
              marks: 15,
              topic: "int-arithmetic",
              prompt: md`Suppose you have a 4-bit ALU and you are required to perform a division operation, where the dividend is 11010101 and the divisor is 1011. Show the division process step by step along with the value of each relevant register at every step.`,
              outOfScope: "Division hardware is not covered in the lecture slides",
            },
            {
              part: "b",
              marks: 10,
              topic: "floating-point",
              prompt: md`Write down the equivalent MIPS assembly code for the following function, written in C. Assume appropriate registers for the variables.

\`\`\`
float convert (float cels)
{
    float ferh = (9.0 * cels) / 5.0;
    ferh = ferh + 32.0;
    return ferh;
}
\`\`\``,
              outOfScope: "Floating-point MIPS instructions are not covered in the lecture slides",
            },
            {
              part: "c",
              marks: 10,
              topic: "isa-basics",
              alsoAsked: ["2018-19 Q6(c)"],
              prompt: md`How many instruction formats are there in MIPS? Write down the name of each instruction format along with the length of each field in it.`,
            },
          ],
        },
      ],
    },
  ],
}
