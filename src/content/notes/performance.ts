import { md } from "../md"

export const performanceNote = md`
## What the course studies

Chapter 1 opens with four questions the course answers:

1. How are programs translated into machine language, and how does the hardware run them?
2. What is the hardware/software interface (the **instruction set architecture**)?
3. What decides a program's performance, and how can it be improved?
4. How do hardware designers improve performance (pipelining, caches, parallel processing)?

Four layers decide how fast a program runs:

| Component | What it decides |
|---|---|
| Algorithm | the number of operations executed |
| Programming language, compiler, architecture | the number of machine instructions per operation |
| Processor and memory system | how fast instructions execute |
| I/O system (including the OS) | how fast I/O operations execute |

## The eight great ideas

Every design decision in the course is an instance of one of these eight ideas. Exams give a design feature and ask which idea it uses, so learn one clear example of each.

| Idea | Meaning | Example from the course |
|---|---|---|
| Design for Moore's Law | Transistor counts double every 18–24 months, so design for the technology that will exist when the product ships, not today's | Integrating all cache levels onto the processor chip |
| Use abstraction to simplify design | Hide lower-level detail behind a simple interface | The ISA hides the hardware; procedures hide their bodies behind parameters |
| Make the common case fast | Speed up the frequent case rather than optimising rare ones | PC-relative branches, since most branch targets are near; 16-bit immediates, since most constants are small |
| Performance via parallelism | Do several operations at the same time | A fast multiplier with 31 adders working at once instead of one adder used 31 times; multicore chips; GPUs |
| Performance via pipelining | Overlap the steps of successive operations, like an assembly line | The five-stage MIPS pipeline |
| Performance via prediction | Guess and start work early, if guessing is cheap to undo and usually right | Branch prediction; hardware prefetching of cache blocks |
| Hierarchy of memories | Fastest, smallest, dearest memory at the top; slowest, largest, cheapest at the bottom | Registers, cache, main memory, disk |
| Dependability via redundancy | Spare components take over when one fails | RAID disks, ECC memory |

Some features fit two ideas. In an answer, pick the one that matches the *reason* given for the feature and say why in one line.

## Below your program

- **Application software** is written in a high-level language.
- **System software:**
  - the **compiler** translates high-level code to machine code;
  - the **operating system** handles input/output, manages memory and storage, and schedules tasks and shares resources.
- **Hardware:** processor, memory, I/O controllers.

Program code exists at three levels:

1. **High-level language** (C, Java): close to the problem, productive and portable.
2. **Assembly language**: a textual form of machine instructions, such as \`add $t0, $s1, $s2\`.
3. **Machine language**: binary digits, the encoded instructions and data.

The five classic **components of a computer** are the same for desktops, servers and embedded systems. They are input, output, memory, datapath and control; the datapath and control together form the processor.

- **Input/output devices:**
  - user-interface devices (display, keyboard, mouse);
  - storage devices (hard disk, flash);
  - network adapters.
- **Memory** holds the program and its data while it runs.
- The **datapath** does the arithmetic.
- **Control** tells the datapath, memory and I/O what to do according to the program's instructions.

**Abstractions.**

- The **instruction set architecture (ISA)** is the interface between hardware and the lowest software. It covers the instructions, registers, memory access and I/O.
- The **application binary interface (ABI)** is the ISA plus the operating-system interface.
- An **implementation** is hardware that obeys the ISA. Many implementations can share one ISA at different cost and speed.

## Response time and throughput

- **Response time** (execution time): how long one task takes, from start to finish.
- **Throughput** (bandwidth): total work done per unit time, e.g. tasks per hour.

They are *not* the same.

- **A faster processor improves both:** each task finishes sooner, so more finish per hour.
- **Adding processors improves only throughput:** more tasks run at once, but no single task finishes sooner.

The chapter focuses on response time.

## Relative performance

Performance is the reciprocal of execution time:
$$
\text{Performance}_X = \frac{1}{\text{Execution time}_X}
$$

"X is $n$ times faster than Y" means
$$
n = \frac{\text{Performance}_X}{\text{Performance}_Y} = \frac{\text{Execution time}_Y}{\text{Execution time}_X}
$$

**Example (slide).** A program takes 10 s on A and 15 s on B.
$$
\frac{\text{Execution time}_B}{\text{Execution time}_A} = \frac{15\ \text{s}}{10\ \text{s}} = 1.5
$$
So A is 1.5 times faster than B.

Always answer a comparison with the **ratio**, and say which machine is faster. "A is 5 s faster" is not the expected answer.

## Measuring execution time

- **Elapsed time:** total response time, including processing, I/O, OS overhead and idle time. It decides system performance.
- **CPU time:** time the processor spends on this job only. It leaves out I/O time and other jobs' shares, and splits into **user CPU time** and **system CPU time**.

Different programs are affected differently by CPU and system performance. When a question gives a log of operations from several programs plus OS overhead, CPU time for program P counts **only P's own cycles**.

## Clock cycles

All digital hardware is driven by a constant-rate clock.

- **Clock period** $T_c$ is the duration of one cycle, e.g. $250\ \text{ps} = 0.25\ \text{ns} = 250\times10^{-12}\ \text{s}$.
- **Clock rate** $f$ is cycles per second, e.g. $4.0\ \text{GHz} = 4000\ \text{MHz} = 4.0\times10^{9}\ \text{Hz}$.

They are reciprocals:
$$
T_c = \frac{1}{f}
$$
So 4 GHz gives $T_c = 1/(4\times10^9) = 0.25\ \text{ns} = 250\ \text{ps}$.

## CPU time

$$
\text{CPU time} = \text{CPU clock cycles}\times T_c = \frac{\text{CPU clock cycles}}{\text{Clock rate}}
$$

Performance improves by reducing the number of clock cycles or by raising the clock rate. A hardware designer must often trade one against the other: a faster clock can need more cycles for the same work.

**Example (slide): how fast must B's clock be?**
Computer A has a 2 GHz clock and runs a program in 10 s. We want B to run it in 6 s. B can have a faster clock, but then it needs 1.2 times as many clock cycles as A.

**Step 1: cycles on A.**
$$
\text{Clock cycles}_A = \text{CPU time}_A\times\text{Clock rate}_A = 10\ \text{s}\times2\times10^{9}\ \text{Hz} = 20\times10^{9}
$$

**Step 2: cycles on B.**
$$
\text{Clock cycles}_B = 1.2\times20\times10^{9} = 24\times10^{9}
$$

**Step 3: clock rate of B.**
$$
\text{Clock rate}_B = \frac{\text{Clock cycles}_B}{\text{CPU time}_B} = \frac{24\times10^{9}}{6\ \text{s}} = 4\times10^{9}\ \text{Hz} = 4\ \text{GHz}
$$

## Instruction count and CPI

$$
\text{Clock cycles} = \text{Instruction count}\times\text{CPI}
$$

- **Instruction count (IC)** is fixed by the program, the ISA and the compiler.
- **CPI**, the average number of cycles per instruction, is fixed by the CPU hardware. If different instructions take different numbers of cycles, the average CPI depends on the **instruction mix**.

Putting it together gives the **CPU time equation**:
$$
\text{CPU time} = \text{IC}\times\text{CPI}\times T_c = \frac{\text{IC}\times\text{CPI}}{\text{Clock rate}}
$$

In words: seconds per program = instructions per program × clock cycles per instruction × seconds per clock cycle.

**Example (slide): same ISA, which is faster?** A has $T_c = 250$ ps and CPI 2.0. B has $T_c = 500$ ps and CPI 1.2. Both run the same program, so IC is the same; call it $I$.

**Step 1: time on each.**
$$
\text{CPU time}_A = I\times2.0\times250\ \text{ps} = 500I\ \text{ps}
$$
$$
\text{CPU time}_B = I\times1.2\times500\ \text{ps} = 600I\ \text{ps}
$$

**Step 2: ratio.**
$$
\frac{\text{CPU time}_B}{\text{CPU time}_A} = \frac{600I\ \text{ps}}{500I\ \text{ps}} = 1.2
$$
A is 1.2 times faster than B.

## CPI in more detail

When instruction classes take different numbers of cycles:
$$
\text{Clock cycles} = \sum_{i=1}^{n}\text{CPI}_i\times\text{IC}_i
$$
The **weighted average CPI** is
$$
\text{CPI} = \frac{\text{Clock cycles}}{\text{IC}} = \sum_{i=1}^{n}\text{CPI}_i\times\frac{\text{IC}_i}{\text{IC}}
$$
where $\text{IC}_i/\text{IC}$ is the **relative frequency** of class $i$.

**Example (slide): two compiled code sequences.**

| Class | A | B | C |
|---|---|---|---|
| CPI for class | 1 | 2 | 3 |
| IC in sequence 1 | 2 | 1 | 2 |
| IC in sequence 2 | 4 | 1 | 1 |

**Sequence 1.** IC = 2 + 1 + 2 = 5.
$$
\text{Clock cycles} = 2\times1 + 1\times2 + 2\times3 = 10
$$
$$
\text{Average CPI} = 10/5 = 2.0
$$

**Sequence 2.** IC = 4 + 1 + 1 = 6.
$$
\text{Clock cycles} = 4\times1 + 1\times2 + 1\times3 = 9
$$
$$
\text{Average CPI} = 9/6 = 1.5
$$

Sequence 2 executes **more** instructions but needs **fewer** cycles, so it is faster. Instruction count alone does not decide performance.

### A standard exam pattern: "run two times faster"

A program's time is $\sum \text{IC}_i\times\text{CPI}_i / f$. To run $k$ times faster, the total cycles must fall to $1/k$ of the original. If only class $j$ improves:
$$
\text{IC}_j\times\text{CPI}_j' = \frac{\text{Cycles}}{k} - \sum_{i\neq j}\text{IC}_i\times\text{CPI}_i
$$
If the right side is zero or negative, **no** improvement of class $j$ alone can reach the target. Say so, and give the reason: the other classes alone already need more than the target number of cycles.

## What performance depends on

| Changed by | IC | CPI | $T_c$ |
|---|---|---|---|
| Algorithm | yes | possibly | |
| Programming language | yes | yes | |
| Compiler | yes | yes | |
| Instruction set architecture | yes | yes | yes |

Execution time is the only reliable measure of performance.

## Pitfall: Amdahl's law

Improving one aspect of a computer does **not** give a proportional improvement overall. Only the part that uses the improvement gets faster:
$$
T_{\text{improved}} = \frac{T_{\text{affected}}}{\text{improvement factor}} + T_{\text{unaffected}}
$$
The overall speed-up is
$$
\text{Speed-up} = \frac{T_{\text{before}}}{T_{\text{improved}}}
$$
Equivalently, with $F$ the fraction of the original time that is improved and $S$ the speed-up of that part:
$$
\text{Speed-up} = \frac{1}{(1-F) + F/S}
$$
Even with $S\to\infty$, the speed-up is at most $1/(1-F)$.

**Example (slide).** Multiply takes 80 s of a 100 s program. How much faster must multiply be to make the program 5 times faster?

**Step 1: target time.** 5 times faster means $100/5 = 20$ s.

**Step 2: Amdahl's law with factor $n$.**
$$
20 = \frac{80}{n} + 20
$$

**Step 3: solve.**
$$
\frac{80}{n} = 0
$$
No finite $n$ works. The 20 s that does not use multiply already equals the whole target, so 5 times faster is impossible.

The corollary is the great idea **make the common case fast**: speed up the part that takes most of the time.

## Pitfall: MIPS as a performance metric

MIPS is millions of instructions per second:
$$
\text{MIPS} = \frac{\text{Instruction count}}{\text{Execution time}\times10^{6}} = \frac{\text{Clock rate}}{\text{CPI}\times10^{6}}
$$

MIPS ignores three things:
- **Differences in ISAs between computers.** One instruction on one machine may do the work of several on another, so instruction counts differ.
- **Differences in complexity between instructions.** A program with many simple instructions scores a high MIPS without being faster.
- **CPI varies between programs on the same CPU.** So one machine has no single MIPS rating.

A higher MIPS rating does not mean a faster computer for a given program. Compare execution times instead.

**Typical question.** Two computers run the same program at 4 GHz. A executes 10 billion instructions at CPI 1.0; B executes 8 billion at CPI 1.1.
$$
\text{MIPS}_A = \frac{4\times10^{9}}{1.0\times10^{6}} = 4000,\qquad \text{MIPS}_B = \frac{4\times10^{9}}{1.1\times10^{6}} \approx 3636
$$
$$
\text{CPU time}_A = \frac{10\times10^{9}\times1.0}{4\times10^{9}} = 2.5\ \text{s},\qquad \text{CPU time}_B = \frac{8\times10^{9}\times1.1}{4\times10^{9}} = 2.2\ \text{s}
$$
A has the higher MIPS rating, yet B is faster, by $2.5/2.2 \approx 1.14$ times.

## Concluding remarks from the slides

- Cost/performance keeps improving because the underlying technology improves.
- Hierarchical layers of abstraction exist in both hardware and software, and the ISA is the hardware/software interface.
- Execution time is the best performance measure.
- Power is a limiting factor, so designers turn to parallelism to keep improving performance.
`
