import type { Paper } from "../types"
import { md } from "../md"

export const paperB12: Paper = {
  slug: "b12",
  batch: "12 batch",
  course: "CSE 305",
  session: "2014-2015",
  year: 2016,
  exam: "L-3/T-1 B. Sc. Engineering Examinations 2014-2015",
  date: "26/01/2016",
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
            { part: "a", marks: 10, topic: "coherence", alsoAsked: ["2016-17 Q3(d)"], prompt: md`Describe SISD, SIMD, MIMD and MISD architectures with block diagrams.`, outOfScope: "Flynn's classification is not covered in the lecture slides" },
            {
              part: "b",
              marks: 4,
              topic: "coherence",
              alsoAsked: ["2016-17 Q4(d)"],
              prompt: md`Consider a bus-based shared-memory multiprocessor system. It is constructed using processors with a speed of 10⁶ fetches/sec, and a bus with a peak bandwidth of 10⁵ fetches/sec. The caches are designed to support a hit rate of 90%. (i) What is the maximum number of processors that can be supported by this system? (ii) What hit rate is needed to support a 20-processor system?`,
              outOfScope: "Bus-based multiprocessor bandwidth is not covered in the lecture slides",
            },
            { part: "c", marks: 8, topic: "isa-basics", alsoAsked: ["2016-17 Q4(c)"], prompt: md`Compare the characteristics of typical CISC and RISC architectures.`, outOfScope: "CISC versus RISC is only mentioned in passing on the slides" },
            {
              part: "d",
              marks: 13,
              topic: "multiple-issue",
              prompt: md`Show the time-space diagram for pipelining in a superscalar processor. Briefly describe the architecture of a typical superscalar RISC processor with necessary block diagrams. Mention the differences between a superscalar processor and a VLIW processor. (3 + 8 + 2)`,
            },
          ],
        },
        {
          no: 2,
          parts: [
            {
              part: "a",
              marks: 12,
              topic: "memory-tech",
              alsoAsked: ["2016-17 Q3(a)"],
              prompt: md`List the key characteristics of computer systems. What do you mean by the principle of locality of reference? Discuss the role of the principle of locality of reference in designing the memory hierarchy. (6 + 3 + 3)`,
              note: "The first sub-part (key characteristics of computer systems, from Stallings) is not covered in the lecture slides; the locality and memory-hierarchy sub-parts are solved.",
            },
            {
              part: "b",
              marks: 8,
              topic: "memory-tech",
              prompt: md`Write short notes on (i) flash storage and (ii) holographic data storage. (4 + 4)`,
              note: "Holographic data storage is not covered in the lecture slides; the note on flash storage is solved.",
            },
            {
              part: "c",
              marks: 15,
              topic: "caches",
              alsoAsked: ["2016-17 Q3(b)"],
              prompt: md`Answer the following questions for a memory system that uses 32-bit addresses at the byte level, and a cache that uses a 64-byte line size.

(i) Assume a direct-mapped cache with a tag field in the address of 20 bits. Show the address format and determine the number of addressable units, the number of blocks in main memory, and the number of lines in the cache.

(ii) Assume an associative cache. Show the address format and determine the number of addressable units, the number of blocks of main memory, the number of lines in the cache and the size of the tag.

(iii) Assume a four-way set-associative cache with a tag field in the address of 9 bits. Show the address format and determine the number of addressable units, the number of blocks in main memory, the number of lines in a set, the number of sets in the cache, and the number of lines in the cache.`,
            },
          ],
        },
        {
          no: 3,
          parts: [
            {
              part: "a",
              marks: 10,
              topic: "data-hazards",
              alsoAsked: ["2016-17 Q4(a)"],
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
            { part: "b", marks: 10, topic: "branch-hazards", prompt: md`Briefly describe the different dynamic branch prediction techniques for dealing with control hazards.` },
            {
              part: "c",
              marks: 15,
              topic: "pipelining",
              alsoAsked: ["2016-17 Q4(b)"],
              prompt: md`Perform the necessary modification of the single-cycle datapath in Figure 1 for a pipelined implementation by inserting pipeline registers and a forwarding unit. Describe the modification step by step and draw the final modified datapath with all necessary control signals.`,
              note: "Figure 1 is the single-cycle datapath divided into the five stages IF, ID, EX, MEM and WB (P&H Figure 4.33).",
            },
          ],
        },
        {
          no: 4,
          parts: [
            { part: "a", marks: 8, topic: "memory-tech", prompt: md`Show the components of an I/O module using a block diagram and describe the functions of each component.`, outOfScope: "I/O modules are not covered in the lecture slides" },
            { part: "b", marks: 10, topic: "memory-tech", prompt: md`Describe the operation of a vectored interrupt structure with a daisy-chain interface for detecting and managing interrupting I/O devices.`, outOfScope: "Interrupts are not covered in the lecture slides" },
            { part: "c", marks: 12, topic: "memory-tech", prompt: md`Mention the advantages of DMA transfer over programmed I/O and interrupt-driven I/O. Briefly describe a DMA transfer structure with necessary diagrams. (4 + 8)`, outOfScope: "DMA is not covered in the lecture slides" },
            {
              part: "d",
              marks: 5,
              topic: "cache-performance",
              alsoAsked: ["2016-17 Q3(c)"],
              prompt: md`The access time of the cache M₁ of a single cache memory system is 6 ns/bit during a hit, and that of the main memory M₂ is 900 ns/bit during a miss. Calculate the block transfer time and the access efficiency of the memory system at a hit ratio of 0.8.`,
              outOfScope: "The ns/bit access-efficiency model is not covered in the lecture slides",
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
              marks: 20,
              topic: "performance",
              prompt: md`"Computer architects have invented several great ideas in the last 60 years of computer design. These ideas are so powerful that they have lasted long after the first computer that used them, with newer architects demonstrating their admiration by imitating their predecessors." These ideas include: 1. Design for Moore's Law; 2. Use abstraction to simplify design; 3. Make the common case fast; 4. Performance via parallelism; 5. Performance via pipelining; 6. Performance via prediction; 7. Hierarchy of memories; 8. Dependability via redundancy.

Identify which of the above great ideas are behind these design decisions:

1. In the MIPS datapath, there is an adder which computes the value of PC + 4. For branch addressing, the MIPS address is actually relative to this PC + 4 rather than PC. This form of branch addressing is called PC-relative addressing.
2. In the past, most PCs and server systems used separate SRAM chips for their primary, secondary, or even tertiary caches. Today, all levels of caches are integrated onto the processor chip, so the market for separate SRAM chips has nearly evaporated.
3. A fast multiplication hardware "unrolls the loop" by using 31 adders rather than using a single 32-bit adder 31 times.
4. Procedures or functions allow programmers to concentrate on just one portion of the task at a time; parameters act as an interface between the procedure and the rest of the program and data, since they can pass values and return results.
5. Modern computers use a technique called prefetching. In prefetching, a block of data is brought into the cache before it is actually referenced. Many microprocessors use hardware prefetching to access the block needed in the future that may be difficult for software to notice.`,
            },
            {
              part: "b",
              marks: 15,
              topic: "performance",
              alsoAsked: ["2018-19 Q7(b)"],
              prompt: md`Assume a processor with a 2 GHz clock rate is executing a program that requires the following instructions.

| Instructions | FP | INT | L/S | BRANCH |
|---|---|---|---|---|
| Instruction count (×10⁶) | 160 | 110 | 10 | 16 |
| CPI | 2 | 1 | 5 | 2 |

(i) Calculate the execution time of the program.

(ii) By how much must we improve the CPI of FP instructions if we want the program to run two times faster?

(iii) By how much must we improve the CPI of L/S instructions if we want the program to run two times faster?`,
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
              prompt: md`A simple recursive C function and its corresponding MIPS assembly code are given below. Note that the latter is not complete. Please complete it with appropriate expressions (the blanks are shown as ___).

\`\`\`
int recurseSum(int n){
    if(n<1) return 0;
    else return n+recurseSum(n-1);
}
\`\`\`

\`\`\`
recurseSum:
        ___   $t0, $a0, 1
        beq   $t0, $zero, Recurse
        add   $v0, $zero, $zero
        jr    ___
Recurse:
        addi  $sp, $sp, ___
        sw    $ra, ___
        sw    ___, 0($sp)
        addi  $a0, $a0, -1
        jal   recurseSum
        lw    ___, 0($sp)
        lw    $ra, ___
        ___
        add   ___, $a0, $v0
        jr    ___
\`\`\``,
            },
            { part: "b", marks: 5, topic: "sync-linking", alsoAsked: ["2016-17 Q6(b)"], prompt: md`What support does the MIPS instruction set architecture provide for synchronization?` },
            {
              part: "c",
              marks: 15,
              topic: "addressing",
              alsoAsked: ["2018-19 Q7(a)"],
              prompt: md`A simple MIPS assembly code snippet and its corresponding MIPS machine code are given below. Note that the latter is not complete. Please complete it with appropriate decimal values.

\`\`\`
Loop: sll  $t1, $s2, 2
      add  $t1, $t1, $s6
      lw   $t0, 0($t1)
      beq  $t0, $s5, L1
      j    Exit
L1:   addi $s2, $s2, 1
      j    Loop
Exit:
\`\`\`

| Address | Fields given |
|---|---|
| 6000 | 0, 0, 18, 9, ___, 0 |
| 6004 | 0, ___, ___, ___, 0, 32 |
| 6008 | 35, ___, ___, 0 |
| 6012 | 4, 8, 21, ___ |
| 6016 | ___ |
| 6020 | 8, 18, 18, 1 |
| 6024 | 2, ___ |
| 6028 | |`,
            },
          ],
        },
        {
          no: 7,
          parts: [
            { part: "a", marks: 15, topic: "addressing", alsoAsked: ["2016-17 Q7(a)"], prompt: md`Please draw the illustrations of the five MIPS addressing modes.` },
            {
              part: "b",
              marks: 10,
              topic: "isa-basics",
              prompt: md`The MIPS instruction set architecture supports beq and bne instructions; however, it does not support other branching instructions like blt, bge, etc. What is the reason behind this design decision? How could you program these instructions (blt, bge, etc.) in MIPS instructions? (5 + 5)`,
            },
            {
              part: "c",
              marks: 10,
              topic: "addressing",
              alsoAsked: ["2018-19 Q8(c)"],
              prompt: md`What is the problem in the following code snippet? How can you solve this problem? (5 + 5)

| Address | Instruction |
|---|---|
| 005000 | \`beq $s0, $s1, 30500\` |`,
            },
          ],
        },
        {
          no: 8,
          parts: [
            {
              part: "a",
              marks: 12,
              topic: "int-arithmetic",
              alsoAsked: ["2016-17 Q8(a)"],
              prompt: md`The following table illustrates the various combinations of two operands for binary addition and subtraction. Identify the overflow conditions in the table. Then, formulate the overflow Boolean variable as a logical function of the input variables (you don't need to simplify the function). (8 + 4)

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

Here: operation O = 0 for A + B and 1 for A − B; $S_A$, $S_B$ = sign bits of operands A and B (0 if ≥ 0, 1 if < 0); $S_R$ = sign bit of the result R; V = 0 for "overflow occurred" and 1 for "no overflow possible" (as printed).`,
              note: "The paper defines V = 0 for overflow and V = 1 for no overflow, the reverse of the usual convention (and of the 2016-17 paper). The solution uses V = 1 for overflow and says how the printed convention changes the answer.",
            },
            {
              part: "b",
              marks: 13,
              topic: "int-arithmetic",
              prompt: md`In the following figure, a multiplication hardware is given. Draw the flowchart of the sequential version of the multiplication algorithm for this hardware. This simple hardware is not register-optimized; therefore, draw a register-optimized refined version of this hardware. (8 + 5)

\`\`\`fig
arith-mult-v1
\`\`\``,
            },
            {
              part: "c",
              marks: 10,
              topic: "single-cycle",
              prompt: md`A simple MIPS datapath and its control signals are illustrated below. Design the control bits corresponding to the instruction "beq rs, rt, address" for this datapath.

\`\`\`fig
dp-full
\`\`\`

| Control signal | 0 | 1 |
|---|---|---|
| RegDst | write register address = rt | write register address = rd |
| RegWrite | – | write register |
| ALUSrc | ALU second operand = Read data 2 | ALU second operand = lower 16 bits of instruction |
| MemRead | – | read data from memory |
| MemWrite | – | write data into memory |
| MemtoReg | register write data from ALU | register write data from data memory |
| PCSrc | PC = PC + 4 | PC = branch target |
| ALUOp1 | not dependent on function | dependent on function |
| ALUOp0 | addition | subtraction |`,
              note: "The paper's datapath has no jump path and a PCSrc control signal driving the PC mux directly; the figure shown is the slides' version.",
            },
          ],
        },
      ],
    },
  ],
}
