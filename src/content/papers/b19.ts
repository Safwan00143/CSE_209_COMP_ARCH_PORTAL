import type { Paper } from "../types"
import { md } from "../md"

export const paperB19: Paper = {
  slug: "b19",
  batch: "19 batch",
  course: "CSE 305",
  session: "2021-2022",
  year: 2023,
  exam: "L-3/T-1 B. Sc. Engineering Examinations 2021-2022",
  date: "06/04/2023",
  fullMarks: 210,
  time: "3 hours",
  sections: [
    {
      name: "Section A",
      instructions: "There are FOUR questions in this section. Answer any THREE questions.",
      questions: [
        {
          no: 1,
          parts: [
            {
              part: "a",
              marks: 10,
              topic: "single-cycle",
              prompt: md`Complete the provided incomplete diagram of the MIPS single cycle datapath for the branch if equal (beq) and jump (j) instructions.

(The provided figure is the single-cycle datapath with control, but its PC logic has only the PC + 4 adder: no branch or jump paths.)`,
            },
            {
              part: "b",
              marks: 10,
              topic: "data-hazards",
              prompt: md`Consider the following MIPS code:

\`\`\`
lw  $t1, 0($t0)
lw  $t2, 4($t0)
add $t3, $t1, $t2
sw  $t3, 12($t0)
lw  $t4, 8($t0)
add $t5, $t1, $t4
sw  $t5, 16($t0)
\`\`\`

How many cycles are required to execute the above code? Can you reduce the number of cycles using code scheduling? If yes, what will be resulting number of cycles?`,
              alsoAsked: ["2016-17 Q4(a)", "2014-15 Q3(a)"],
            },
            {
              part: "c",
              marks: 10,
              topic: "branch-hazards",
              prompt: md`What do you mean by data hazard for branches? Give MIPS code examples with explanations for each of the following cases of data hazard for branches:
- (i) Needs no stall to resolve
- (ii) Needs one cycle stall to resolve
- (iii) Needs two cycle stalls to resolve`,
              alsoAsked: ["2017-18 Q2(c)", "2013-14 Q8(c)"],
            },
            {
              part: "d",
              marks: 5,
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

What is the problem with the above code if we use 1 bit branch predictor? How can you solve that?`,
              alsoAsked: ["2023-24 Q1(c)", "2017-18 Q2(d)", "2013-14 Q8(d)"],
            },
          ],
        },
        {
          no: 2,
          parts: [
            {
              part: "a",
              marks: 15,
              topic: "data-hazards",
              prompt: md`What do you mean by forwarding for data hazard? Design a complete forwarding unit in the provided diagram with necessary equations for the MIPS pipeline considering double data hazard.`,
              alsoAsked: ["2023-24 Q1(a)", "2017-18 Q2(b)"],
            },
            {
              part: "b",
              marks: 10,
              topic: "multiple-issue",
              prompt: md`Draw the block diagram of a dynamically scheduled multiple-issue super-scalar CPU.`,
            },
            {
              part: "c",
              marks: 10,
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

What will be the Instructions per Cycle (IPC) for this scheduling? Which technique can increase the IPC even more?`,
              alsoAsked: ["2023-24 Q4(b)"],
            },
          ],
        },
        {
          no: 3,
          parts: [
            {
              part: "a",
              marks: 10,
              topic: "cache-performance",
              prompt: md`Suppose we have a processor with a base CPI of 1.0, assuming all references hit in the primary cache and a clock rate of 4 GHz. Assume a main memory access time of 200 ns, including all the miss handling. Suppose the miss rate per instruction at the primary cache is 4%. How much faster will the processor be if we add a second level cache that has a 10 ns access time for either a hit or a miss and is large enough to reduce the miss rate to main memory to 1%? How much faster will the processor be if we add a third level cache that has a 40 ns access time for either a hit or a miss and is large enough to reduce the miss rate to main memory to 0.5%?`,
              alsoAsked: ["2017-18 Q4(a)", "2023-24 Q2(a)"],
            },
            {
              part: "b",
              marks: 10,
              topic: "virtual-memory",
              prompt: md`Explain with necessary diagrams how the page table works with respect to the virtual address, physical address, main memory, and disk.`,
              alsoAsked: ["2017-18 Q3(c)", "2015-16 Q3(c)"],
            },
            {
              part: "c",
              marks: 10,
              topic: "virtual-memory",
              prompt: md`You are given the following hit/miss status of TLB, Page Table and Cache.

| Serial No. | TLB | Page Table | Cache |
|---|---|---|---|
| 1 | Hit | Hit | Hit |
| 2 | Hit | Miss | Hit |
| 3 | Miss | Miss | Hit |
| 4 | Miss | Miss | Miss |
| 5 | Miss | Hit | Hit |

Explain which of the scenarios in Table 3(c) is possible or impossible and under what circumstance with proper reasoning.`,
            },
            {
              part: "d",
              marks: 5,
              topic: "coherence",
              prompt: md`Explain how snooping protocol solves the cache coherence problem with an example.`,
              alsoAsked: ["2023-24 Q3(c)"],
            },
          ],
        },
        {
          no: 4,
          parts: [
            {
              part: "a",
              marks: 15,
              topic: "caches",
              prompt: md`Assume there are three small caches, each consisting of four one-word blocks and uses LRU replacement policy. One cache is fully associative, a second is two-way set-associative, and the third is direct-mapped. Find the number of misses for each cache organization given the following sequence of block addresses:

$$
1, 3, 2, 4, 5, 1, 3, 1, 3, 5, 3, 2
$$`,
            },
            {
              part: "b",
              marks: 10,
              topic: "gpu",
              prompt: md`Show with block diagrams how contemporary PCs with Intel and AMD CPUs connect a separate GPU. How do the CPU and GPU access each other's memory?`,
              alsoAsked: ["2023-24 Q4(a)"],
            },
            {
              part: "c",
              marks: 10,
              topic: "gpu",
              prompt: md`What do you mean by kernel, grid, and thread block of the CUDA paradigm? Briefly describe how they map to the streaming processor (SP) cores and streaming multiprocessors (SM) of the unified GPU architecture of NVIDIA.`,
              alsoAsked: ["2023-24 Q4(c)"],
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
          no: 5,
          parts: [
            {
              part: "a",
              marks: 15,
              topic: "isa-basics",
              prompt: md`The following four design principles have been guiding the instruction-set designers to find a balance between the number of instructions needed to execute a program, the number of clock cycles needed by an instruction, and the speed of the clock.
- (i) Simplicity favors regularity
- (ii) Smaller is faster
- (iii) Good design demands good compromise
- (iv) Make the common case faster

You are given several design features of MIPS instruction-set architecture in the following. Now, please identify which of the above principle(s) is behind each of these design decisions.
- (i) Keeping conditional branch's offset value in a range of 16 bits.
- (ii) Keeping 32 registers rather than many more.
- (iii) Consistent instruction format, i.e., always requiring three registers for R-type Instructions.
- (iv) Multiple instruction formats to allow flexibility.
- (v) Reduced instruction set, Complex instructions (i.e., pseudo instructions like bgt, bge, mov etc.) are translated into one or more basic instructions.`,
              alsoAsked: ["2016-17 Q6(c)"],
            },
            {
              part: "b",
              marks: 10,
              topic: "performance",
              prompt: md`Assume that 2% of the runtime of a program is not parallelizable. This program runs on 24 cores of an Intel Xeon Gold processor. Under the assumption that the program runs at the same speed on all of those cores and there are no additional overheads,
- (i) What is the parallel speedup for 24 cores?
- (ii) Is it possible to make the program 60 times faster? If yes, how can that be achieved? If not, mention the reasons.`,
            },
            {
              part: "c",
              marks: 10,
              topic: "multiple-issue",
              prompt: md`Discuss how can subword parallelism be used to accelerate common operations, such as matrix multiplication or image processing?`,
              outOfScope: "Subword parallelism is not covered in the lecture slides",
            },
          ],
        },
        {
          no: 6,
          parts: [
            {
              part: "a",
              marks: 15,
              topic: "mips-programming",
              prompt: md`Write the MIPS assembly code for the C code shown in the following figure (Figure: 6.a).

\`\`\`
int fib(int n) {
    if (n==0) return 0;
    else if (n == 1) return 1;
    else return fib(n-1) + fib(n-2);
}
\`\`\``,
            },
            {
              part: "b",
              marks: 10,
              topic: "addressing",
              prompt: md`Suppose the program counter (PC) is set to $\texttt{0x2000 0000}$. Explain your answer for the following questions.
- (i) Is it possible to use the jump (j) MIPS assembly instruction to set the PC to the address $\texttt{0x4000 0000}$?
- (ii) Is it possible to use single branch (beq/bneq) instruction to set the PC to this same address?`,
            },
            {
              part: "c",
              marks: 10,
              topic: "int-arithmetic",
              prompt: md`Draw the block diagram of 32-bit combined multiplication and division hardware which uses 32-bit ALU, and briefly mention functions of different components of this hardware.`,
              outOfScope: "Division hardware is not covered in the lecture slides",
            },
          ],
        },
        {
          no: 7,
          parts: [
            {
              part: "a",
              marks: 15,
              topic: "multiple-issue",
              prompt: md`Assume that you have four different threads as shown in figure (Figure: 7.a) below. Show how the four threads could be combined to execute on the processor more efficiency using the following three multithreading options. You only need to show the first 12 timeslots for each of the following options.
- (i) A superscalar with coarse-grained multithreading
- (ii) A superscalar with fine-grained multithreading
- (iii) A superscalar with simultaneous multithreading

(Figure 7.a: issue-slot usage of threads A, B, C and D over time slots T1–T8.)`,
              outOfScope: "Multithreading is not covered in the lecture slides",
            },
            {
              part: "b",
              marks: 16,
              topic: "performance",
              prompt: md`Suppose you are using Floating Point Operations Per Second (FLOPS) as a performance metric for comparing processors. Your research partner believes that FLOPS might be a misleading metric for measuring the general performance of a processor, but it could still be a useful performance measure for a specific part of the processor or a specific type of processors. Do you agree or disagree with your research partner's statements? Provide a detailed explanation to support your position.`,
              outOfScope: "FLOPS is not covered in the lecture slides",
            },
            {
              part: "c",
              marks: 10,
              topic: "multiple-issue",
              prompt: md`With illustrative example(s), explain how vector processor differs from array processor.`,
              outOfScope: "Vector and array processors are not covered in the lecture slides",
            },
          ],
        },
        {
          no: 8,
          parts: [
            {
              part: "a",
              marks: 11,
              topic: "performance",
              prompt: md`Consider two different implementations (P1 and P2) of the same instruction set architecture. There are three classes of instructions A, B, and C. Suppose, a program has 200,000 instructions divided into three classes as 25% class A, 60% class B, and 15% class C. The clock rate and CPI of each implementation are given in the following table (Table: 8.a).

| Implementation | Clock Rate | CPI of Class A | CPI of Class B | CPI of Class C |
|---|---|---|---|---|
| P1 | 2.7 GHz | 3 | 3 | 2 |
| P2 | 3.5 GHz | 2 | 4 | 1 |

- (i) Find the total clock cycle required in both implementations.
- (ii) Calculate the execution time required for both implementations and determine which implementation is faster.
- (iii) How much must we improve the CPI of Class C instructions if we want the program to run two times faster in the better implementation determined in the previous question?`,
            },
            {
              part: "b",
              marks: 14,
              topic: "floating-point",
              prompt: md`Consider representing the set of consecutive positive integers {1, 2, 3, 4, ..., n} using IEEE single precision floating point (8-bit exponent and 23-bit mantissa). Find the largest n such that every number in the above set can be represented.`,
            },
            {
              part: "c",
              marks: 10,
              topic: "addressing",
              prompt: md`What are the different addressing modes of MIPS? Illustrate the calculation process for each addressing mode.`,
              alsoAsked: ["2022-23 (CSE 209) Q11(c)", "2018-19 Q6(a)"],
            },
          ],
        },
      ],
    },
  ],
}
