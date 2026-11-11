import type { Paper } from "../types"
import { md } from "../md"

export const paperB10: Paper = {
  slug: "b10",
  batch: "10 batch",
  course: "CSE 305",
  session: "2012-2013",
  year: 2014,
  exam: "L-3/T-1 B. Sc. Engineering Examinations 2012-2013",
  date: "10/05/2014",
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
            { part: "a", marks: 15, topic: "mips-programming", prompt: md`What is a jump address table? Discuss with an appropriate example how Case/Switch statements can be implemented with a jump address table.` },
            { part: "b", marks: 5, topic: "addressing", prompt: md`How can you create a 32-bit constant in MIPS assembly language?` },
            {
              part: "c",
              marks: 8,
              topic: "addressing",
              prompt: md`Consider the following MIPS assembly language code and assume that the code fragment is loaded at location 80000 in memory. What should be the values of the immediate fields of the bne instruction and the j instruction?

\`\`\`
Loop: sll  $t1, $s3, 2
      add  $t1, $t2, $s6
      lw   $t0, 0($t1)
      bne  $t0, $s5, Exit
      addi $s3, $s3, 1
      j    Loop
Exit:
\`\`\``,
              note: "The scan prints the fourth instruction as \"bnr\" with a misspelt register; it is read as bne comparing t0 with s5.",
            },
            {
              part: "d",
              marks: 7,
              topic: "addressing",
              prompt: md`Explain why the assembler might have problems directly implementing the branch instruction in the following code fragment. How can this problem be fixed?

\`\`\`
here:  beq $s0, $s2, there
       ...
       ...
there: add $s0, $s0, $s0
\`\`\``,
            },
          ],
        },
        {
          no: 2,
          parts: [
            {
              part: "",
              marks: 35,
              topic: "single-cycle",
              alsoAsked: ["2018-19 Q1(a)"],
              prompt: md`Consider the single-cycle datapath in Figure 2, which is constructed for add, sub, and, or, lw, sw, beq. Now, implement the following instructions in the datapath: bne, j, jr, jal. You need to clearly explain your implementation and mention the values of the control lines (including any additional control lines you have introduced) for the new instructions.

\`\`\`fig
dp-full
\`\`\``,
              note: "Figure 2 is the basic single-cycle datapath with control, without the jump path; the figure shown is the slides' version, which already includes the jump path.",
            },
          ],
        },
        {
          no: 3,
          parts: [
            {
              part: "a",
              marks: 17,
              topic: "multicycle-control",
              prompt: md`Present and explain a microprogram for the control unit of the multicycle implementation illustrated in Figure 3.

\`\`\`fig
ctl-fsm
\`\`\``,
              note: "Figure 3 is the multicycle datapath of Appendix D; the figure shown is its control FSM.",
            },
            { part: "b", marks: 8, topic: "multicycle-control", prompt: md`Modify the implementation of Figure 3 so that it can handle the Undefined Instruction Exception and the Overflow Exception.`, outOfScope: "Exceptions are not covered in the lecture slides" },
            {
              part: "c",
              marks: 5,
              topic: "multicycle-control",
              prompt: md`In which stage should you detect the overflow exception so as to ensure that the offending instruction does not change the content of the destination register? Justify your answer.`,
              outOfScope: "Exceptions are not covered in the lecture slides",
            },
            { part: "d", marks: 5, topic: "multicycle-control", prompt: md`Your friend claims that the PCWriteCond signal can be safely replaced by PCSource[0]. Do you agree? Justify your answer.` },
          ],
        },
        {
          no: 4,
          parts: [
            { part: "a", marks: 17, topic: "data-hazards", prompt: md`Discuss how you can detect data hazards and solve them with the help of a forwarding unit.` },
            { part: "b", marks: 13, topic: "data-hazards", prompt: md`Present a scenario where you cannot solve a data hazard with the help of a forwarding unit. Suggest what to do in this case.` },
            { part: "c", marks: 5, topic: "branch-hazards", prompt: md`What is a branch hazard?` },
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
              marks: 10,
              topic: "memory-tech",
              prompt: md`What is the average time to read or write a 512-byte sector for a typical disk rotating at 15,000 RPM? The seek time is 4 ms, the transfer rate is 100 MB/sec, and the controller overhead is 0.2 ms. Assume that the disk is idle, so that there is no waiting time.`,
            },
            { part: "b", marks: 20, topic: "memory-tech", prompt: md`What is the purpose of using RAID organization? Briefly describe the concept of the different RAID levels with diagrams. (2 + 18)`, outOfScope: "RAID is not covered in the lecture slides" },
            { part: "c", marks: 5, topic: "memory-tech", prompt: md`Differentiate between NAND and NOR flash memories.` },
          ],
        },
        {
          no: 6,
          parts: [
            {
              part: "a",
              marks: 9,
              topic: "performance",
              prompt: md`Consider a computer running a program with the CPU times shown in the following table: (3 + 3 + 3)

| FP instr. | INT instr. | Load/Store instr. | Branch instr. | Total time |
|---|---|---|---|---|
| 50 s | 80 s | 50 s | 30 s | 210 s |

(i) By how much (in %) is the total time reduced if the time for FP operations is reduced by 20%?

(ii) Assume that the time for INT operations is improved. By how much (in %) is the time for INT operations reduced if the total time is reduced by 20%?

(iii) Can the total time be reduced by 20% by reducing only the time for branch instructions?`,
            },
            { part: "b", marks: 6, topic: "virtual-memory", prompt: md`What are the disadvantages of using a virtually addressed cache?`, outOfScope: "Virtually addressed caches are not covered in the lecture slides" },
            { part: "c", marks: 7, topic: "virtual-memory", prompt: md`"The TLB acts as a cache of the page table for the entries that map to physical pages only." Do you agree or disagree? Explain.` },
            {
              part: "d",
              marks: 13,
              topic: "caches",
              prompt: md`A program accesses 2 cache blocks, one that begins at memory address 0x1000 and another one that begins at memory address 0x2000. Memory accesses alternate between these two blocks, and each block is accessed 100 times. If the program is run on a system with a 1 KB direct-mapped cache with 32 blocks, how many cache misses will occur? How many of these misses will be compulsory and conflict misses? Mention the reason behind classifying a miss as a compulsory or a conflict miss. Note that there will be no capacity miss, as the total amount of data accessed by the program is less than the capacity of the cache.`,
            },
          ],
        },
        {
          no: 7,
          parts: [
            { part: "a", marks: 6, topic: "caches", prompt: md`State the advantages of using a write-back cache.` },
            { part: "b", marks: 9, topic: "caches", prompt: md`If a cache has a capacity of 16 KB and a line length (block size) of 128 bytes, how many sets does the cache have if it is 2-way, 4-way and 8-way set associative?` },
            {
              part: "c",
              marks: 12,
              topic: "cache-performance",
              prompt: md`Consider a processor with the following parameters:

| Parameter | Value |
|---|---|
| Base CPI, no memory stalls | 2.0 |
| Processor speed | 1 GHz |
| Main memory access time | 100 ns |
| First-level cache miss rate per instruction | 4% |
| Second-level cache, direct-mapped, speed | 10 cycles |
| Global miss rate with second-level cache, direct-mapped | 4% |
| Second-level cache, eight-way set associative, speed | 20 cycles |
| Global miss rate with second-level cache, eight-way set associative | 1.6% |

Calculate the CPI for the processor using (i) only a first-level cache, (ii) both a first-level cache and a second-level direct-mapped cache, (iii) both a first-level cache and a second-level eight-way set-associative cache.`,
            },
            { part: "d", marks: 4, topic: "memory-tech", prompt: md`Briefly discuss interleaved memory organization.` },
            { part: "e", marks: 4, topic: "multiple-issue", prompt: md`Differentiate between fine-grain and coarse-grain multithreading.`, outOfScope: "Multithreading is not covered in the lecture slides" },
          ],
        },
        {
          no: 8,
          parts: [
            { part: "a", marks: 5, topic: "floating-point", prompt: md`What is the purpose of using biased notation for representing the exponents of floating-point numbers?` },
            { part: "b", marks: 12, topic: "int-arithmetic", prompt: md`Draw the flowchart showing the execution steps of the division operation for the given division hardware organization (32-bit divisor, 32-bit ALU, 64-bit remainder register with shift right, shift left and write controls).`, outOfScope: "Division hardware is not covered in the lecture slides" },
            { part: "c", marks: 8, topic: "memory-tech", prompt: md`Describe the steps of DMA transfer.`, outOfScope: "DMA is not covered in the lecture slides" },
            { part: "d", marks: 10, topic: "coherence", prompt: md`Discuss crossbar networks and Omega networks with diagrams.`, outOfScope: "Interconnection networks are not covered in the lecture slides" },
          ],
        },
      ],
    },
  ],
}
