import type { Paper } from "../types"
import { md } from "../md"

export const paperB13: Paper = {
  slug: "b13",
  batch: "13 batch",
  course: "CSE 305",
  session: "2015-2016",
  year: 2017,
  exam: "L-3/T-1 B. Sc. Engineering Examinations 2015-2016",
  date: "18/01/2017",
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
              topic: "performance",
              prompt: md`Consider three different processors P1, P2 and P3 executing the same instruction set. P1 has a 3 GHz clock rate and a CPI of 1.5. P2 has a 2.5 GHz clock rate and a CPI of 1.0. P3 has a 4.0 GHz clock rate and a CPI of 2.2.

(i) Which processor has the highest performance expressed in instructions per second?

(ii) If the processors each execute a program in 10 seconds, find the number of cycles and the number of instructions.

(iii) We are trying to reduce the execution time by 30%, but this leads to an increase of 20% in the CPI. What clock rate should we have to get this time reduction?`,
            },
            {
              part: "b",
              marks: 10,
              topic: "performance",
              prompt: md`The following tables show the number of instructions of each type in a program, and the number of cycles taken by each type.

| | Arithmetic | Store | Load | Branch |
|---|---|---|---|---|
| Instructions | 500 | 50 | 100 | 50 |
| Cycles per instruction | 1 | 5 | 5 | 2 |

(i) What is the execution time of the program on a 4 GHz processor?

(ii) What is the CPI of the program?

(iii) If the number of load instructions can be reduced by half, what are the speed-up and the CPI?`,
            },
            {
              part: "c",
              marks: 15,
              topic: "performance",
              prompt: md`Assume that for arithmetic, load/store and branch instructions, a processor has CPIs of 1, 12 and 5, respectively. Also assume that on a single processor a program requires the execution of 2.56 billion arithmetic instructions, 1.28 billion load/store instructions and 256 million branch instructions. Assume that each processor has a 2 GHz clock frequency. Assume that, as the program is parallelized to run over multiple cores, the number of arithmetic and load/store instructions per processor is divided by 0.7 × p (where p is the number of processors), but the number of branch instructions per processor remains the same. (1 billion = 10⁹, 1 million = 10⁶.)

(i) Find the total execution time for this program on 1, 2 and 4 processors, and show the relative speed-up of 2 and 4 processors compared to the single processor.

(ii) If the CPI of the arithmetic instructions was doubled, what would the impact be on the execution time of the program on 1, 2 and 4 processors?

(iii) How much should the CPI of load/store instructions be reduced for a single processor to match the performance of 4 processors using the original CPI values?`,
            },
          ],
        },
        {
          no: 2,
          parts: [
            {
              part: "a",
              marks: 5,
              topic: "performance",
              alsoAsked: ["2013-14 Q5(d)"],
              prompt: md`Consider the following information for two different computers.

| Computer | Number of instructions | Clock rate | CPI |
|---|---|---|---|
| A | 10 billion | 4 GHz | 1 |
| B | 8 billion | 4 GHz | 1.1 |

(i) Which has the highest MIPS rating? (ii) Which is faster?`,
            },
            {
              part: "b",
              marks: 5,
              topic: "pipelining",
              prompt: md`Consider the following information for the load word (lw) instruction:

| Instr. | Instruction fetch | Register read | ALU op | Memory access | Register write |
|---|---|---|---|---|---|
| lw | 200 ps | 100 ps | 200 ps | 200 ps | 100 ps |

Consider the following program:

\`\`\`
lw $1, 100($0)
lw $2, 200($0)
lw $3, 300($0)
\`\`\`

What is the speed-up for the pipelined datapath over the single-cycle datapath for this program? What will the speed-up be if we add 2,000,000 more load word (lw) instructions?`,
            },
            {
              part: "c",
              marks: 10,
              topic: "pipelining",
              alsoAsked: ["2013-14 Q8(a)"],
              prompt: md`Draw the complete MIPS pipelined datapath and control for the load (lw) instruction with pipeline registers.`,
            },
            {
              part: "d",
              marks: 10,
              topic: "data-hazards",
              alsoAsked: ["2022-23 Q1(c)", "2017-18 Q1(a)"],
              prompt: md`Consider the following C code:

$$
A = B + C;\qquad D = A + E;
$$

All the above are memory instructions. The base address is in register t0 and the offsets are A (0), B (4), C (8), D (12), E (16). How many cycles are required to execute the above? Can you reduce the number of cycles using code scheduling? If yes, what will be the resulting number of cycles? Show each step.`,
            },
            {
              part: "e",
              marks: 5,
              topic: "branch-hazards",
              alsoAsked: ["2023-24 Q1(c)", "2017-18 Q1(d)"],
              prompt: md`"Even with a perfect branch predictor, 1-cycle penalty for a taken branch." Why is that? How to solve this?`,
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
              alsoAsked: ["2017-18 Q2(a)"],
              prompt: md`What do you mean by double data hazard? Write down the equations to detect forwarding in MIPS considering double data hazard. How does MIPS detect the hazard due to the use of a load instruction?`,
            },
            {
              part: "b",
              marks: 10,
              topic: "caches",
              alsoAsked: ["2017-18 Q3(b)"],
              prompt: md`Briefly explain the write-through and write-back schemes for a cache. How do the write-through and write-back schemes handle a write miss?`,
            },
            {
              part: "c",
              marks: 5,
              topic: "virtual-memory",
              alsoAsked: ["2021-22 Q3(b)", "2017-18 Q3(c)"],
              prompt: md`Briefly explain how the page table works with respect to the virtual address, physical address, main memory and disk.`,
            },
            {
              part: "d",
              marks: 10,
              topic: "virtual-memory",
              alsoAsked: ["2023-24 Q3(a)"],
              prompt: md`Though both the TLB and the data cache are cache memories, how are they different from each other? Explain with a flow chart the interaction between the TLB and the data cache for both read and write operations.`,
            },
          ],
        },
        {
          no: 4,
          parts: [
            {
              part: "a",
              marks: 5,
              topic: "cache-performance",
              prompt: md`Assume the miss rate of an instruction cache is 3% and the miss rate of the data cache is 5%. If a processor has a CPI of 2 without any memory stalls and the miss penalty is 100 cycles for all misses, determine how much faster a processor would run with a perfect cache that never missed. Assume the frequency of all loads and stores is 40%. What is the amount of execution time spent on memory stalls?`,
            },
            {
              part: "b",
              marks: 10,
              topic: "caches",
              alsoAsked: ["2023-24 Q2(b)"],
              prompt: md`For a direct-mapped cache design with a 32-bit address, the following bits of the address are used to access the cache.

| Tag | Index | Offset |
|---|---|---|
| 31 – 10 | 9 – 5 | 4 – 0 |

What is the cache block size (in words), and how many entries does the cache have? Starting from power on, the following byte-addressed cache references are recorded:

0, 4, 16, 132, 232, 160, 1024, 30, 140, 3100, 180, 2180

How many blocks are replaced, and what is the hit ratio?`,
            },
            {
              part: "c",
              marks: 15,
              topic: "caches",
              prompt: md`Assume there are three small caches, each consisting of four one-word blocks and using the LRU replacement policy. One cache is fully associative, a second is two-way set-associative, and the third is direct-mapped. Find the number of misses for each cache organization, given the following two independent sequences of block addresses:

- 0, 2, 4, 8, 10, 12, 14, 16, 0
- 1, 3, 5, 1, 3, 1, 3, 5, 3`,
            },
            {
              part: "d",
              marks: 5,
              topic: "cache-performance",
              prompt: md`Suppose we have a processor with a base CPI of 1.0, assuming all references hit in the primary cache, and a clock rate of 4 GHz. Assume a main memory access time of 100 ns, including all the miss handling. Suppose the miss rate per instruction at the primary cache is 3%. How much faster will the processor be if we add a secondary cache that has a 5 ns access time for either a hit or a miss and is large enough to reduce the miss rate to main memory to 1%?`,
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
              marks: 25,
              topic: "mips-programming",
              prompt: md`Produce the compiled MIPS code for the following C function. Assume that the addresses of dest and source are in \`$a0\` and \`$a1\`. Use a minimal number of MIPS assembly instructions.

\`\`\`
void rstrcopy (char *dest, char *source)
{
    if (*source)
    {
        *dest++ = *source++;
        rcopy (dest, source);
    }
    else
        *dest = '\0';
}
\`\`\``,
              note: "The recursive call is printed as rcopy; it is read as a call to rstrcopy itself.",
            },
            {
              part: "b",
              marks: 6,
              topic: "addressing",
              prompt: md`What is the MIPS assembly code to load this 32-bit constant into register \`$s0\`?

0001 0000 0011 1101 0000 1001 0000 0000`,
            },
            {
              part: "c",
              marks: 4,
              topic: "sync-linking",
              prompt: md`What do you understand by pseudoinstructions? Give two examples of pseudoinstructions that the MIPS assembler accepts.`,
            },
          ],
        },
        {
          no: 6,
          parts: [
            { part: "a", marks: 12, topic: "floating-point", alsoAsked: ["2018-19 Q8(b)"], prompt: md`What are the steps of floating-point addition? Describe with an example.` },
            { part: "b", marks: 15, topic: "addressing", alsoAsked: ["2018-19 Q6(a)", "2016-17 Q7(a)"], prompt: md`What are the different addressing modes of MIPS? Describe and illustrate the calculation process for each addressing mode.` },
            { part: "c", marks: 8, topic: "sync-linking", alsoAsked: ["2016-17 Q6(b)"], prompt: md`What is a data race? What instructions are available in MIPS to address this issue? How do these instructions work?` },
          ],
        },
        {
          no: 7,
          parts: [
            {
              part: "a",
              marks: 15,
              topic: "multiple-issue",
              prompt: md`Assume that you have four different threads. Show how the four threads could be combined to execute on the processor more efficiently using the following three multithreading options: (i) a superscalar with coarse-grained multithreading; (ii) a superscalar with fine-grained multithreading; (iii) a superscalar with simultaneous multithreading. (The paper gives a diagram of how the four threads A, B, C, D would execute independently on a superscalar without multithreading support.)`,
              outOfScope: "Multithreading is not covered in the lecture slides",
            },
            { part: "b", marks: 10, topic: "coherence", prompt: md`Find the maximum number of processors, each having clock rate i, with cache memories, that a bus with bandwidth B can support.`, outOfScope: "Bus-based multiprocessor bandwidth is not covered in the lecture slides" },
            { part: "c", marks: 10, topic: "floating-point", alsoAsked: ["2018-19 Q7(c)"], prompt: md`What is the use of the bias in floating-point representation? Give the encoding of floating-point infinity.` },
          ],
        },
        {
          no: 8,
          parts: [
            { part: "a", marks: 10, topic: "coherence", prompt: md`What are the different methods to maintain coherence among all caches and global memory in a shared-memory system? Describe briefly.` },
            {
              part: "b",
              marks: 20,
              topic: "coherence",
              prompt: md`Suppose we want to sum 64,000 numbers on a multiprocessor computer with 64 processors, (i) with uniform memory access (UMA), (ii) message passing. Write the corresponding C code (a) for each processor to sum its subset of numbers, (b) to add the partial sums.`,
              outOfScope: "Multiprocessor programming is not covered in the lecture slides",
            },
            { part: "c", marks: 5, topic: "coherence", prompt: md`Draw the organization of a message-passing multiprocessor.`, outOfScope: "Message-passing multiprocessors are not covered in the lecture slides" },
          ],
        },
      ],
    },
  ],
}
