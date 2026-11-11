import type { Paper } from "../types"
import { md } from "../md"

const SINGLE_BUS = "The single-bus CPU organisation (Hamacher) is not covered in the lecture slides"

export const paperB14: Paper = {
  slug: "b14",
  batch: "14 batch",
  course: "CSE 305",
  session: "2016-2017",
  year: 2017,
  exam: "L-3/T-1 B. Sc. Engineering Examinations 2016-2017",
  date: "02/08/2017",
  fullMarks: 210,
  time: "3 hours",
  sections: [
    {
      name: "Section A",
      instructions: "There are FOUR questions in this section. Answer any THREE.",
      questions: [
        {
          no: 1,
          stem: md`Consider a CPU which has PC, MAR, MDR, IR, ALU and Instruction Decoder. There are six general-purpose registers R0, R1, R2, R3, R4, R5 and a temporary register TEMP inside the CPU. The CPU gets one input directly from the bus and the other input through a register Y. The output of the ALU is sent to the bus through a register Z. The ALU can perform ten arithmetic-logic operations and has a special input for Carry-in.`,
          parts: [
            { part: "a", marks: 10, topic: "multicycle-control", prompt: md`Draw a block diagram of the single-bus datapaths inside the CPU following the description above.`, outOfScope: SINGLE_BUS },
            {
              part: "b",
              marks: 10,
              topic: "multicycle-control",
              prompt: md`Show step-wise control signals for executing the instruction **Add (R3), R1**, which adds the contents of a memory location pointed to by register R3 to register R1. Assume that the instruction is stored in memory and PC contains the address of the instruction.`,
              outOfScope: SINGLE_BUS,
            },
            { part: "c", marks: 10, topic: "multicycle-control", prompt: md`Design a control word for the CPU above such that the number of bits in the control word is significantly smaller than the number of control signals.`, outOfScope: SINGLE_BUS },
            { part: "d", marks: 5, topic: "multicycle-control", prompt: md`What are the relative merits of horizontal and vertical microinstruction formats?` },
          ],
        },
        {
          no: 2,
          stem: md`Answer the following questions based on the MIPS architecture shown in Figure 1.

\`\`\`fig
dp-full
\`\`\``,
          parts: [
            { part: "a", marks: 5, topic: "single-cycle", prompt: md`Write the functions of the control signals ALUSrc, ALUOp, RegDst, MemWrite and RegWrite.` },
            { part: "b", marks: 10, topic: "single-cycle", prompt: md`Explain how the ALU control bits are set depending on the ALUOp control bits and the function codes for the R-type instructions.` },
            { part: "c", marks: 10, topic: "single-cycle", prompt: md`Describe the datapaths for R-type instructions.` },
            { part: "d", marks: 5, topic: "single-cycle", prompt: md`How is the content of the PC updated for the branch (beq) instruction?` },
            { part: "e", marks: 5, topic: "single-cycle", prompt: md`What are the two inputs of the MUX at the input of the ALU?` },
          ],
        },
        {
          no: 3,
          parts: [
            { part: "a", marks: 5, topic: "memory-tech", prompt: md`What do you mean by the principle of locality of reference? Discuss the role of the principle of locality of reference in designing the memory hierarchy.` },
            {
              part: "b",
              marks: 15,
              topic: "caches",
              alsoAsked: ["2014-15 Q2(c)"],
              prompt: md`Answer the following questions for a memory system that uses 32-bit addresses at the byte level, and a cache that uses a 64-byte line size.

(i) Assume a direct-mapped cache with a tag field in the address of 20 bits. Show the address format and determine the number of addressable units, the number of blocks in main memory, and the number of lines in the cache.

(ii) Assume an associative cache. Show the address format and determine the number of addressable units, the number of blocks in main memory, the number of lines in the cache and the size of the tag.

(iii) Assume a four-way set-associative cache with a tag field in the address of 9 bits. Show the address format and determine the number of addressable units, the number of blocks in main memory, the number of lines in a set, the number of sets in the cache, and the number of lines in the cache.`,
            },
            {
              part: "c",
              marks: 5,
              topic: "cache-performance",
              prompt: md`The access time of the cache M₁ of a single cache memory system is 6 ns/bit during a hit, and that of the main memory M₂ is 900 ns/bit during a miss. Calculate the block transfer time and the access efficiency of the memory system at a hit ratio of 0.8.`,
              outOfScope: "The ns/bit access-efficiency model is not covered in the lecture slides",
            },
            { part: "d", marks: 10, topic: "coherence", prompt: md`Describe SISD, SIMD and MISD architectures with block diagrams.`, outOfScope: "Flynn's classification is not covered in the lecture slides" },
          ],
        },
        {
          no: 4,
          parts: [
            {
              part: "a",
              marks: 10,
              topic: "data-hazards",
              alsoAsked: ["2014-15 Q3(a)"],
              prompt: md`What are pipeline hazards? Explain a structural pipeline hazard with a time-space diagram. What type of pipeline hazard occurs in the following code segment? How can it be overcome?

\`\`\`
lw  $t1, 0($t0)
lw  $t2, 4($t0)
add $t3, $t1, $t2
sw  $t3, 12($t0)
lw  $t4, 8($t0)
add $t5, $t1, $t4
sw  $t5, 16($t0)
\`\`\``,
            },
            {
              part: "b",
              marks: 15,
              topic: "pipelining",
              alsoAsked: ["2014-15 Q3(c)"],
              prompt: md`Perform the necessary modification of the single-cycle datapath in Figure 2 for a pipelined implementation by inserting pipeline registers, the forwarding unit and the hazard detection unit. Describe the modification step by step and draw the final modified datapath with all necessary control signals.

\`\`\`fig
pipe-stages
\`\`\``,
              note: "Figure 2 is the single-cycle datapath divided into the five stages IF, ID, EX, MEM and WB (P&H Figure 4.33).",
            },
            { part: "c", marks: 6, topic: "isa-basics", alsoAsked: ["2014-15 Q1(c)"], prompt: md`Compare the characteristics of typical CISC and RISC architectures.`, outOfScope: "CISC versus RISC is only mentioned in passing on the slides" },
            {
              part: "d",
              marks: 4,
              topic: "coherence",
              alsoAsked: ["2014-15 Q1(b)"],
              prompt: md`Consider a bus-based shared-memory multiprocessor system. It is constructed using processors with a speed of 10⁶ fetches/sec and a bus with a peak bandwidth of 10⁵ fetches/sec. The caches are designed to support a hit rate of 90%.

(i) What is the maximum number of processors that can be supported by this system?

(ii) What hit rate is needed to support a 20-processor system?`,
              outOfScope: "Bus-based multiprocessor bandwidth is not covered in the lecture slides",
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
              marks: 10,
              topic: "performance",
              prompt: md`"Computer architects have invented several great ideas in the last 60 years of computer design. These ideas are so powerful that they have lasted long after the first computer that used them, with newer architects demonstrating their admiration by imitating their predecessors." These ideas include: (i) Design for Moore's Law; (ii) Use abstraction to simplify design; (iii) Make the common case fast; (iv) Performance via parallelism; (v) Performance via pipelining; (vi) Performance via prediction; (vii) Hierarchy of memories; (viii) Dependability via redundancy.

You are given several design features of MIPS and other modern computing systems below. Identify which of the above great ideas are behind these design decisions.

(i) While implementing instructions at the hardware level, it is possible to implement all the instructions as single-cycle instructions. However, modern designers do not use this single-cycle design as it is inefficient. (Hint: for a single-cycle implementation, the clock cycle must have the same length for every instruction, and the longest instruction determines the clock cycle length.)

(ii) Modern computers use a technique called prefetching. "In prefetching, a block of data is brought into the cache before it is actually referenced. Many microprocessors use hardware prefetching to access the block needed in the future that may be difficult for software to notice."`,
            },
            {
              part: "b",
              marks: 10,
              topic: "performance",
              prompt: md`A Lenovo x3650 M5 server containing 32 cores (Intel Xeon E5-2699v4) obtained the following results in the SPEC test. Find the SPEC ratio for the computer.

| Program | Execution time | Reference time |
|---|---|---|
| perlbench | 236 | 9770 |
| bzip2 | 375 | 9650 |
| gcc | 208 | 8050 |
| mcf | 133 | 9120 |
| gobmk | 337 | 10490 |
| hmmer | 105 | 9330 |
| sjeng | 340 | 12100 |
| libquantum | 2 | 20720 |
| h264ref | 379 | 22130 |
| omnetpp | 119 | 6250 |
| astar | 195 | 7020 |
| xalancbmk | 86 | 6900 |`,
              outOfScope: "SPEC benchmarks are not covered in the lecture slides",
            },
            {
              part: "c",
              marks: 15,
              topic: "performance",
              prompt: md`Assume a processor with a 3 GHz clock rate is executing a program that requires the following instructions:

| Instructions | FP | INT | L/S | BRANCH |
|---|---|---|---|---|
| Instruction count (×10⁶) | 40 | 80 | 90 | 15 |
| CPI | 1 | 1 | 3 | 2 |

(i) Calculate the execution time of the program.

(ii) By how much must we improve the CPI of FP instructions if we want the program to run two times faster?

(iii) By how much is the execution time of the program changed (improved or degraded) if the CPI of INT and FP instructions is increased by 20% and the CPI of L/S and Branch is reduced by 10%?`,
            },
          ],
        },
        {
          no: 6,
          parts: [
            {
              part: "a",
              marks: 10,
              topic: "addressing",
              prompt: md`A simple MIPS assembly code snippet and its corresponding MIPS machine code are given below. Note that the former is not complete. Please complete it with appropriate MIPS assembly code.

| Assembly | Address | op | | | | |
|---|---|---|---|---|---|---|
| \`sll\` | 1000 | 0 | 00000 | 10000 | 01111 | 00010 000000 |
| \`add\` | 1004 | 0 | 01111 | 10001 | 01111 | 00000 100000 |
| \`lw\` | 1008 | 35 | 01111 | 01000 | 00000 | 00000 000000 |
| \`bne\` | 1012 | 5 | 01000 | 10111 | 00000 | 00000 000001 |
| \`addi\` | 1016 | 8 | 10000 | 10000 | 00000 | 00000 000001 |
| \`j\` | 1020 | 2 | 00000 | 00000 | 00000 | 00011 111010 |`,
            },
            { part: "b", marks: 10, topic: "sync-linking", prompt: md`What support does the MIPS instruction set architecture provide for synchronization? Explain with an example.` },
            {
              part: "c",
              marks: 15,
              topic: "isa-basics",
              prompt: md`The following four design principles have been guiding instruction-set designers to find a balance between the number of instructions needed to execute a program, the number of clock cycles needed by an instruction, and the speed of the clock: (i) Simplicity favors regularity; (ii) Smaller is faster; (iii) Good design demands good compromise; (iv) Make the common case fast.

You are given several design features of the MIPS instruction-set architecture below. Identify which of the above principles are behind these design decisions.

(i) keeping the instruction immediate value in a range of 16 bits

(ii) always requiring three register operands in arithmetic instructions

(iii) using PC-relative addressing for conditional branching

(iv) keeping 32 registers rather than many more

(v) keeping the register fields in the same place in each instruction format`,
            },
          ],
        },
        {
          no: 7,
          parts: [
            {
              part: "a",
              marks: 20,
              topic: "addressing",
              alsoAsked: ["2018-19 Q6(a)", "2022-23 Q11(c)"],
              prompt: md`Please draw the illustrations of the five MIPS addressing modes. Also give an example instruction for each of the five addressing modes. (10 + 10)`,
            },
            {
              part: "b",
              marks: 15,
              topic: "floating-point",
              prompt: md`Consider the following block diagram of a floating-point addition hardware.

\`\`\`fig
fp-adder
\`\`\`

Using the given hardware, simulate the floating-point addition algorithm by filling up the following table. The two numbers for addition are $-(0.25)_{10}$ and $(0.625)_{10}$.

| | $-(0.25)_{10}$ | $(0.625)_{10}$ |
|---|---|---|
| Binary | | |
| Step 1: Exponent matching | | |
| Step 2: Significand addition | | |
| Step 3: Normalization | | |
| Step 4: Rounding | | |`,
            },
          ],
        },
        {
          no: 8,
          parts: [
            {
              part: "a",
              marks: 10,
              topic: "int-arithmetic",
              alsoAsked: ["2014-15 Q8(a)"],
              prompt: md`The following table illustrates the various combinations of two operands for binary addition and subtraction. Identify the overflow conditions in the table. Then, formulate the overflow Boolean variable as a logical function of the input variables (you don't need to simplify the function). (5 + 5)

| O | $S_A$ | $S_B$ | $S_R$ | V |
|---|---|---|---|---|
| 0 | 0 | 0 | | |
| 0 | 0 | 1 | | |
| 0 | 1 | 0 | | |
| 0 | 1 | 1 | | |
| 1 | 0 | 0 | | |
| 1 | 0 | 1 | | |
| 1 | 1 | 0 | | |
| 1 | 1 | 1 | | |

Here: operation O = 0 for A + B and 1 for A − B; $S_A$, $S_B$ = sign bits of operands A and B (0 if ≥ 0, 1 if < 0); $S_R$ = sign bit of the result R; V = 1 if overflow occurred, 0 if no overflow is possible.`,
            },
            {
              part: "b",
              marks: 10,
              topic: "memory-tech",
              prompt: md`In a single-bus computer architecture, various devices like the processor, memory and I/O devices are connected with each other via a single bus. These devices do not operate at a similar rate. How can you redesign this single-bus computer architecture so that these devices can interact with each other smoothly using this single bus? Just draw your redesigned single-bus computer architecture.`,
              outOfScope: "I/O buses are not covered in the lecture slides",
            },
            {
              part: "c",
              marks: 15,
              topic: "int-arithmetic",
              prompt: md`Consider the following multiplication hardware.

\`\`\`fig
arith-mult-v2
\`\`\`

Using the given hardware, simulate the unsigned multiplication algorithm by filling up a table (iteration, step, multiplicand, product) for Multiplicand 0110 and Multiplier 0110.`,
            },
          ],
        },
      ],
    },
  ],
}
