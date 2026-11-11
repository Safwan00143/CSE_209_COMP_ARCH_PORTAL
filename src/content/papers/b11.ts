import type { Paper } from "../types"
import { md } from "../md"

export const paperB11: Paper = {
  slug: "b11",
  batch: "11 batch",
  course: "CSE 305",
  session: "2013-2014",
  year: 2015,
  exam: "L-3/T-1 B. Sc. Engineering Examinations 2013-2014",
  date: "05/07/2015",
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
            { part: "a", marks: 6, topic: "memory-tech", prompt: md`State the principle of temporal locality and the principle of spatial locality. (3 + 3)` },
            {
              part: "b",
              marks: 9,
              topic: "caches",
              prompt: md`Assume a two-way set-associative cache with four blocks. The cache is currently empty. Assuming an LRU replacement policy, how many hits does the address sequence 0, 2, 4, 0, 2, 4, 0, 2, 4 exhibit? Show the state of the cache after every address access.`,
            },
            { part: "c", marks: 9, topic: "coherence", prompt: md`State three conditions required for a cache/memory to be coherent.` },
            { part: "d", marks: 5, topic: "virtual-memory", prompt: md`What is the limitation of a processor that does not have a TLB but uses the virtual memory technique?` },
            {
              part: "e",
              marks: 6,
              topic: "caches",
              prompt: md`What is the size of the tag field for a direct-mapped cache with $2^{n}$ blocks and the following configuration: 32-bit byte address and a block size of $2^{m}$ words (assume 1 word = 4 bytes)?`,
            },
          ],
        },
        {
          no: 2,
          parts: [
            {
              part: "a",
              marks: 5,
              topic: "coherence",
              prompt: md`Suppose a single shared-memory processor has 20 GB of main memory. Five clustered computers each have 4 GB. The OS occupies 1 GB. How much more space is there for users with shared memory?`,
              outOfScope: "Clusters are not covered in the lecture slides",
            },
            { part: "b", marks: 8, topic: "coherence", prompt: md`Determine the total network bandwidth and bisection bandwidth for ring and fully connected topologies. Assume that the number of processors is P.`, outOfScope: "Interconnection networks are not covered in the lecture slides" },
            { part: "c", marks: 5, topic: "coherence", prompt: md`Differentiate a UMA shared-memory multiprocessor from a NUMA shared-memory multiprocessor.`, outOfScope: "UMA and NUMA multiprocessors are not covered in the lecture slides" },
            {
              part: "d",
              marks: 7,
              topic: "virtual-memory",
              prompt: md`A virtual memory system has the following parameters: virtual address 32 bits; physical DRAM installed 4 GB; page size 8 KB; PTE size 4 bytes. How many page table entries are needed? How much physical memory is needed for storing the page table?`,
            },
            { part: "e", marks: 10, topic: "virtual-memory", alsoAsked: ["2019-20 Q7(c)"], prompt: md`Write down the procedure to handle a TLB page miss.` },
          ],
        },
        {
          no: 3,
          parts: [
            { part: "a", marks: 10, topic: "floating-point", alsoAsked: ["2018-19 Q8(b)", "2015-16 Q6(a)"], prompt: md`Write down the steps for the addition of two binary floating-point numbers.` },
            { part: "b", marks: 10, topic: "floating-point", prompt: md`Show the IEEE 754 binary representation of the number $-0.75_{ten}$ in single precision.` },
            {
              part: "c",
              marks: 15,
              topic: "int-arithmetic",
              prompt: md`Draw a block diagram of the hardware organization and the corresponding flowchart for the multiplication of two 32-bit binary unsigned integer numbers, where there is no separate multiplier register.`,
            },
          ],
        },
        {
          no: 4,
          parts: [
            { part: "a", marks: 5, topic: "memory-tech", prompt: md`Why does RAID 0 improve disk performance?`, outOfScope: "RAID is not covered in the lecture slides" },
            { part: "b", marks: 12, topic: "memory-tech", prompt: md`Write down the steps of handling an interrupt.`, outOfScope: "Interrupts are not covered in the lecture slides" },
            {
              part: "c",
              marks: 6,
              topic: "memory-tech",
              prompt: md`What happens if the interrupt enable bit of the Cause register is not set when handling an interrupt? What value could the interrupt mask take to accomplish the same thing? (3 + 3)`,
              outOfScope: "Interrupts are not covered in the lecture slides",
            },
            { part: "d", marks: 12, topic: "memory-tech", prompt: md`What is the "DMA stale data problem"? How can it occur in a system with caches?`, outOfScope: "DMA is not covered in the lecture slides" },
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
            { part: "a", marks: 6, topic: "performance", prompt: md`What is Moore's Law? What do you mean by response time and throughput?` },
            {
              part: "b",
              marks: 15,
              topic: "performance",
              prompt: md`Consider two different implementations of the same instruction set architecture. There are four classes of instructions, A, B, C and D. The clock rate and CPI of each implementation are given in the following table:

| Implementation | Clock rate | CPI class A | CPI class B | CPI class C | CPI class D |
|---|---|---|---|---|---|
| P1 | 3 GHz | 1 | 2 | 3 | 4 |
| P2 | 2 GHz | 2 | 2 | 2 | 2 |

Given a program with 200 instructions divided into classes as follows: 10% class A, 20% class B, 50% class C and 20% class D.

(i) Find the clock cycles required in both cases. (ii) Which implementation is faster? (iii) What is the global CPI for each implementation?`,
            },
            {
              part: "c",
              marks: 8,
              topic: "performance",
              prompt: md`What do you mean by Amdahl's law? Write down the equation. Suppose a sample program takes 100 seconds to complete. The division operation accounts for 80 seconds. How much improvement in the division operations' performance can give a 4× overall improvement?`,
            },
            {
              part: "d",
              marks: 6,
              topic: "performance",
              alsoAsked: ["2015-16 Q2(a)"],
              prompt: md`Consider the following information for two different computers.

| Computer | Number of instructions | Clock rate | CPI |
|---|---|---|---|
| A | 10 billion | 4 GHz | 1 |
| B | 8 billion | 4 GHz | 1.1 |

(i) Which one has the highest MIPS rating? (ii) Which one is faster?`,
            },
          ],
        },
        {
          no: 6,
          parts: [
            { part: "a", marks: 8, topic: "sync-linking", prompt: md`What are the four design principles used for MIPS instruction set design? What are the steps for starting a Java application?` },
            {
              part: "b",
              marks: 12,
              topic: "isa-basics",
              prompt: md`Write down the MIPS code and the corresponding machine code for the following C code:

$$
A[3] = A[1] - A[2];
$$

Consider the base address of A is in \`$s0\`. The op-code for load word is 35, and for store word is 43. The (op-code, function-code) for addition is (0, 32), and for subtraction is (0, 34). Registers \`$t0\` to \`$t7\` are numbered from 8 to 15, and \`$s0\` to \`$s7\` are numbered from 16 to 23.`,
            },
            {
              part: "c",
              marks: 12,
              topic: "mips-programming",
              prompt: md`Write down the MIPS code for the following C procedure:

\`\`\`
int sum (int n)
{
    if (n <= 0) return 0;
    else return n + sum (n - 1);
}
\`\`\`

Consider n in \`$a0\` and the result in \`$v0\`.`,
            },
            {
              part: "d",
              marks: 3,
              topic: "addressing",
              prompt: md`If the branch target is too far to encode with a 16-bit offset, how does the assembler rewrite the following code?

\`\`\`
beq $s0, $s1, L1
\`\`\``,
            },
          ],
        },
        {
          no: 7,
          parts: [
            {
              part: "a",
              marks: 8,
              topic: "sync-linking",
              prompt: md`Briefly describe the two instructions used for synchronization in MIPS. Write down the MIPS code to do the following atomically:

$$
A[0] = X
$$

Consider the base address of A is in \`$s1\` and X is in \`$s2\`.`,
            },
            { part: "b", marks: 4, topic: "addressing", prompt: md`Describe the MIPS addressing modes.` },
            { part: "c", marks: 14, topic: "single-cycle", prompt: md`Consider the following set of instructions: add, sw, beq. Draw the complete single-cycle datapath (not pipelined) and control that can execute the above set of instructions.` },
            {
              part: "d",
              marks: 9,
              topic: "pipelining",
              prompt: md`What are the five stages of the MIPS pipeline? Consider the following information for the load word (lw) instruction:

| Instruction | Instruction fetch | Register read | ALU op | Memory access | Register write |
|---|---|---|---|---|---|
| lw | 200 ps | 100 ps | 200 ps | 200 ps | 100 ps |

Consider the following program:

\`\`\`
lw $1, 100($0)
lw $2, 200($0)
lw $3, 300($0)
\`\`\`

What is the speed-up for the pipelined datapath over the single-cycle datapath for this program? What will the speed-up be if we add 1,000,000 more load word (lw) instructions?`,
            },
          ],
        },
        {
          no: 8,
          parts: [
            { part: "a", marks: 15, topic: "pipelining", alsoAsked: ["2015-16 Q2(c)"], prompt: md`Draw the complete MIPS pipelined datapath and control for the load word (lw) instruction with pipeline registers.` },
            {
              part: "b",
              marks: 7,
              topic: "data-hazards",
              prompt: md`Consider the following MIPS code:

\`\`\`
add $s0, $t0, $t1
sub $t2, $s0, $t3
lw  $s1, 20($t1)
sub $t4, $s1, $t2
\`\`\`

How many data hazards are there? Describe the techniques to eliminate the data hazards in the above code.`,
            },
            {
              part: "c",
              marks: 9,
              topic: "branch-hazards",
              alsoAsked: ["2021-22 Q1(c)", "2017-18 Q2(c)"],
              prompt: md`What do you mean by data hazard for branches? Give examples with MIPS code for each of the following cases of data hazards for branches: (i) needs no stall to resolve; (ii) needs one cycle stall to resolve; (iii) needs two cycle stalls to resolve.`,
            },
            {
              part: "d",
              marks: 4,
              topic: "branch-hazards",
              alsoAsked: ["2023-24 Q1(c)", "2021-22 Q1(d)", "2017-18 Q2(d)"],
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

What is the problem with the above code if we use a 1-bit branch predictor? How can you solve that? Explain.`,
            },
          ],
        },
      ],
    },
  ],
}
