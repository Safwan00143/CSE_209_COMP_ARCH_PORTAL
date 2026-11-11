import type { Paper } from "../types"
import { md } from "../md"

export const paperB09: Paper = {
  slug: "b09",
  batch: "09 batch",
  course: "CSE 305",
  session: "2011-2012",
  year: 2013,
  exam: "L-3/T-1 B. Sc. Engineering Examinations 2011-2012",
  date: "27/07/2013",
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
            { part: "a", marks: 7.5, topic: "performance", prompt: md`What are the components of a computer? Mention the task of each of these components.` },
            { part: "b", marks: 10, topic: "isa-basics", prompt: md`Briefly describe ISA classes with examples and block diagrams.`, outOfScope: "ISA classes (stack, accumulator, register-memory) are not covered in the lecture slides" },
            {
              part: "c",
              marks: 7,
              topic: "performance",
              prompt: md`Suppose we have two implementations of the same instruction set architecture. Computer A has a clock cycle time of 250 ps and a CPI of 2.0 for some program, and computer B has a clock cycle time of 500 ps and a CPI of 1.2 for the same program. Which computer is faster for this program, and by how much? (Show all steps of calculation.)`,
            },
            {
              part: "d",
              marks: 6,
              topic: "performance",
              prompt: md`Suppose a program runs in 10 seconds and the program spends 50% of its time executing floating-point instructions. We improve the floating-point unit by a factor of five. How big is the speed-up?`,
            },
            { part: "e", marks: 4.5, topic: "performance", prompt: md`What are the problems with measuring performance in terms of MIPS (million instructions per second)?` },
          ],
        },
        {
          no: 2,
          parts: [
            { part: "a", marks: 8, topic: "isa-basics", prompt: md`What are the MIPS design principles? Mention one use of each of these design principles in the MIPS ISA. (4 + 4)` },
            { part: "b", marks: 7.5, topic: "mips-programming", prompt: md`Which instructions and registers are used in a procedure call in MIPS hardware? What is the purpose of using these registers and instructions?` },
            {
              part: "c",
              marks: 3.5,
              topic: "addressing",
              alsoAsked: ["2013-14 Q6(d)"],
              prompt: md`If the branch target is too far to encode with a 16-bit offset, how does the assembler rewrite the following code?

\`\`\`
beq $s0, $s1, L1
\`\`\``,
            },
            { part: "d", marks: 10, topic: "addressing", alsoAsked: ["2018-19 Q6(a)", "2015-16 Q6(b)"], prompt: md`Describe the MIPS addressing modes.` },
            { part: "e", marks: 6, topic: "isa-basics", prompt: md`Give three examples of the complexity of IA-32.`, outOfScope: "IA-32 is only mentioned in passing on the slides" },
          ],
        },
        {
          no: 3,
          parts: [
            {
              part: "a",
              marks: 15,
              topic: "single-cycle",
              prompt: md`Consider the following set of instructions: ADD, SW, JUMP. Draw the single-cycle datapath and control that can execute the above set of instructions. Minimize the amount of hardware used as much as possible, i.e., there should be no redundant hardware in your design. (Note that explanation is not required.)`,
            },
            { part: "b", marks: 6, topic: "single-cycle", prompt: md`Write the purpose of using the ALU unit for R-type, load/store, and branch instructions.` },
            { part: "c", marks: 6, topic: "multicycle-control", prompt: md`Briefly describe the properties of hard-wired and microprogrammed control unit design.` },
            {
              part: "d",
              marks: 8,
              topic: "pipelining",
              prompt: md`Consider the following MIPS instructions: (i) \`lw $6, 36($1)\`; (ii) \`add $5, $5, $5\`. What do these instructions perform in the EX and MEM stages? Assume that the pipelined datapath has 5 stages: IF (instruction fetch), ID (instruction decode and register file read), EX (execution or address calculation), MEM (data memory access), and WB (write back).`,
            },
          ],
        },
        {
          no: 4,
          parts: [
            { part: "a", marks: 6, topic: "pipelining", prompt: md`What are the values stored in the IF/ID and ID/EX pipeline registers?` },
            { part: "b", marks: 8, topic: "pipelining", prompt: md`What is a pipeline hazard? What are the different types of pipeline hazards? (2 + 6)` },
            { part: "c", marks: 3, topic: "data-hazards", prompt: md`Give an example of a double data hazard.` },
            {
              part: "d",
              marks: 4,
              topic: "data-hazards",
              prompt: md`Consider the following sequence of instructions:

\`\`\`
lw  $1, 40($6)
add $6, $2, $2
sw  $6, 50($1)
\`\`\`

Assume that there is no forwarding in this pipelined processor. Eliminate the data hazards with "nop" instructions.`,
              note: "The printed word \"Estimate\" is corrected by hand to \"Eliminate\" on the scan.",
            },
            {
              part: "e",
              marks: 7,
              topic: "branch-hazards",
              prompt: md`Consider the following repeating pattern of branch outcomes: T, T, NT, T. What is the accuracy of the two-bit predictor for this sequence of branch outcomes? What is the accuracy of the two-bit predictor in steady state if this pattern is repeated forever? Assume that the 2-bit predictor starts off in the bottom-left state (predict not taken) of the figure given below.

\`\`\`fig
bh-2bit
\`\`\``,
              note: "The paper's figure is the slides' 2-bit predictor (strongly/weakly taken, weakly/strongly not taken); its bottom-left state is strongly not taken (SN).",
            },
            { part: "f", marks: 7, topic: "pipelining", prompt: md`Why does the MIPS implementation use EPC and Cause registers for processing an exception? What is an imprecise exception? (4 + 3)`, outOfScope: "Exceptions are not covered in the lecture slides" },
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
            { part: "a", marks: 10, topic: "floating-point", alsoAsked: ["2018-19 Q8(b)", "2015-16 Q6(a)"], prompt: md`Draw the flow diagram of floating-point addition. Also write down the conditions of overflow or underflow during a floating-point addition. (8 + 2)` },
            { part: "b", marks: 6, topic: "caches", prompt: md`What are the "direct-mapped", "set-associative" and "fully associative" cache schemes?` },
            {
              part: "c",
              marks: 15,
              topic: "caches",
              prompt: md`Assume there are three small caches, each consisting of 4 one-word blocks. One is fully associative, another is 2-way set associative, and the third is direct mapped. Find the number of misses for each cache organization, given the following sequence of block addresses: 0, 4, 0, 2, 6, 8.`,
            },
            { part: "d", marks: 4, topic: "cache-performance", prompt: md`What is a "split cache"? How is it different from a multilevel cache system? (2 + 2)` },
          ],
        },
        {
          no: 6,
          parts: [
            { part: "a", marks: 15, topic: "int-arithmetic", prompt: md`Draw diagrams of the first and refined versions of the multiplication hardware. Discuss the improvement of the refined version over the first version. (5 + 5 + 5)` },
            {
              part: "b",
              marks: 10,
              topic: "cache-performance",
              prompt: md`Assume the miss rate of an instruction cache is 2% and the miss rate of a data cache is 4%. If a processor has a CPI of 6 without any memory stalls, determine how much faster a processor would run with a perfect cache that never misses. Assume a main memory access time of 100 ns (including all the miss handling) and a processor clock rate of 4 GHz.`,
            },
            { part: "c", marks: 5, topic: "caches", prompt: md`Write down the steps to handle a cache miss.` },
            { part: "d", marks: 5, topic: "memory-tech", prompt: md`Discuss the components of disk data access time.` },
          ],
        },
        {
          no: 7,
          parts: [
            {
              part: "a",
              marks: 20,
              topic: "virtual-memory",
              prompt: md`(i) What do you understand by the "virtual memory" scheme? (3)

(ii) Explain the purpose of a "page table" and a "page table register" in this scheme. (4 + 2)

(iii) Draw the mapping from a 32-bit virtual address to a 30-bit physical address using a page table. (6)

(iv) With a 32-bit virtual address, 4 KB pages and 4 bytes per page table entry, compute the total size of a page table. (5)`,
            },
            { part: "b", marks: 10, topic: "caches", prompt: md`Draw the state diagram of a simple cache controller.`, outOfScope: "The cache controller FSM is not covered in the lecture slides" },
            { part: "c", marks: 5, topic: "memory-tech", prompt: md`What are the "synchronous" and the "asynchronous" bus systems?`, outOfScope: "Buses are not covered in the lecture slides" },
          ],
        },
        {
          no: 8,
          parts: [
            {
              part: "a",
              marks: 10,
              topic: "caches",
              prompt: md`Assuming a cache of 16K blocks, a 4-word block size and a 32-bit address, find the total number of tag bits for a 4-way set-associative cache. Also find the total size of the cache. [Byte offset = 2 bits, 1 word = 32 bits, and 1K = 2¹⁰.]`,
            },
            { part: "b", marks: 12, topic: "coherence", prompt: md`Briefly describe the "shared memory multiprocessor" and the "message passing multiprocessor" systems. (6 + 6)`, outOfScope: "Multiprocessor organisations are not covered in the lecture slides" },
            {
              part: "c",
              marks: 8,
              topic: "coherence",
              alsoAsked: ["2013-14 Q2(a)"],
              prompt: md`Suppose a single shared-memory processor has 20 GB of main memory. Five clustered computers occupy 4 GB each, and the OS occupies 2 GB. How much more space is there for users with shared memory?`,
              outOfScope: "Clusters are not covered in the lecture slides",
            },
            { part: "d", marks: 5, topic: "memory-tech", prompt: md`What are the processor-memory bus and the backplane bus?`, outOfScope: "Buses are not covered in the lecture slides" },
          ],
        },
      ],
    },
  ],
}
