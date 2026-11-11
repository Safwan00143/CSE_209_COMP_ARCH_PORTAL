import { md } from "../md"

export const cachePerformanceNote = md`
## Measuring cache performance

Components of CPU time:
- **program execution cycles**, which include the cache **hit** time;
- **memory stall cycles**, mainly from cache **misses**.

$$
\text{CPU time} = (\text{execution cycles} + \text{memory stall cycles})\times\text{clock cycle time}
$$

With simplifying assumptions (reads and writes have the same miss penalty, write buffers never fill):
$$
\text{Memory stall cycles} = \frac{\text{memory accesses}}{\text{program}}\times\text{miss rate}\times\text{miss penalty}
$$
$$
= \frac{\text{instructions}}{\text{program}}\times\frac{\text{misses}}{\text{instruction}}\times\text{miss penalty}
$$

Per instruction, with separate instruction and data caches:
$$
\text{CPI}_{\text{actual}} = \text{CPI}_{\text{base}} + \underbrace{1\times m_I\times P}_{\text{every instruction is fetched}} + \underbrace{f_{\text{ld/st}}\times m_D\times P}_{\text{loads and stores}}
$$
where $m_I$, $m_D$ are the miss rates, $P$ the miss penalty in cycles, and $f_{\text{ld/st}}$ the fraction of instructions that are loads or stores.

## Example (slide 34)

I-cache miss rate 2%, D-cache miss rate 4%, miss penalty 100 cycles, base CPI (ideal cache) 2, loads and stores are 36% of instructions.

**Step 1: miss cycles per instruction.**
$$
\text{I-cache: } 0.02\times100 = 2
$$
$$
\text{D-cache: } 0.36\times0.04\times100 = 1.44
$$

**Step 2: actual CPI.**
$$
\text{CPI} = 2 + 2 + 1.44 = 5.44
$$

**Step 3: compare with a perfect cache.** Same instruction count and clock, so the speed-up is the CPI ratio:
$$
\frac{5.44}{2} = 2.72
$$
A CPU with an ideal cache would be 2.72 times faster.

**Fraction of time on memory stalls:** $3.44/5.44 \approx 63\%$.

## A faster CPU with the same memory (slide 35)

Reduce the base CPI from 2 to 1 without changing the clock rate.
$$
\text{CPI} = 1 + 2 + 1.44 = 4.44
$$
The ideal CPU is now $4.44/1 = 4.44$ times faster. Time spent on memory stalls rises from $3.44/5.44 \approx 63\%$ to $3.44/4.44 \approx 77\%$.

## Average memory access time

Hit time also matters for performance (slide 36):
$$
\text{AMAT} = \text{Hit time} + \text{Miss rate}\times\text{Miss penalty}
$$

**Example.** CPU with a 1 ns clock, hit time = 1 cycle, miss penalty = 20 cycles, I-cache miss rate = 5%.
$$
\text{AMAT} = 1 + 0.05\times20 = 2\ \text{cycles} = 2\ \text{ns}
$$
that is, 2 cycles per instruction fetch.

## Performance summary (slide 37)

When CPU performance increases, the miss penalty becomes more significant:
- **decreasing the base CPI** puts a greater proportion of the time into memory stalls;
- **increasing the clock rate** makes memory stalls cost more CPU cycles (the memory takes the same number of nanoseconds).

Cache behaviour cannot be neglected when evaluating system performance.

## Multilevel caches

- The **primary (L1) cache** is attached to the CPU: small, but fast.
- The **level-2 (L2) cache** services misses from the primary cache: larger and slower, but still faster than main memory.
- **Main memory** services L2 misses.
- Some high-end systems include an **L3** cache.

**Converting times to cycles.** Penalties given in nanoseconds become cycles by dividing by the clock period:
$$
\text{cycles} = \frac{\text{time}}{T_c} = \text{time}\times\text{clock rate}
$$

**Miss rates.**
- The **local** miss rate of a cache = its misses ÷ the accesses that reach it.
- The **global** miss rate = its misses ÷ all CPU accesses (or per instruction). The global L2 miss rate is the L1 miss rate × the L2 local miss rate. "Miss rate to main memory" means the global miss rate of the last cache.

**CPI with two levels** (miss rates per instruction):
$$
\text{CPI} = \text{CPI}_{\text{base}} + m_{L1}\times P_{L2} + m_{\text{global}}\times P_{\text{mem}}
$$
Every L1 miss pays the L2 access time $P_{L2}$; those that also miss in L2 pay the main-memory time $P_{\text{mem}}$ on top. With an L3, add $m_{\text{global }L2}\times P_{L3}$ and use the L3 global miss rate for main memory.

## Multilevel cache example (slides 47–48)

CPU base CPI = 1, clock rate = 4 GHz, miss rate per instruction = 2%, main memory access time = 100 ns.

**Step 1: clock period.** $T_c = 1/4\ \text{GHz} = 0.25$ ns.

**Step 2: with just the primary cache.**
$$
\text{Miss penalty} = \frac{100\ \text{ns}}{0.25\ \text{ns}} = 400\ \text{cycles}
$$
$$
\text{CPI} = 1 + 0.02\times400 = 9
$$

**Step 3: add an L2 cache.** Access time 5 ns; global miss rate to main memory 0.5%.
- A primary miss that hits in L2: penalty $5/0.25 = 20$ cycles.
- A primary miss that also misses in L2: an extra 400 cycles.
$$
\text{CPI} = 1 + 0.02\times20 + 0.005\times400 = 1 + 0.4 + 2 = 3.4
$$

**Step 4: compare.**
$$
\text{Performance ratio} = \frac{9}{3.4} \approx 2.6
$$
The processor with L2 is about 2.6 times faster.

## Multilevel cache considerations (slide 49)

- **Primary cache:** focus on minimal **hit time**.
- **L2 cache:** focus on a low **miss rate**, to avoid main-memory accesses; its hit time has less overall impact.
- Results: an L1 cache is usually smaller than a single (only) cache would be, and the L1 block size is smaller than the L2 block size.

## Interactions with advanced CPUs

Out-of-order CPUs can execute instructions during a cache miss (slide 50):
- the pending store stays in the load/store unit;
- dependent instructions wait in reservation stations;
- independent instructions continue.

The effect of a miss depends on the program's data flow, which is much harder to analyse; use system simulation.

## Interactions with software

Misses depend on **memory access patterns**: the algorithm's behaviour and the compiler's optimisation for memory access (slide 51).

The slide's graphs compare Radix Sort and Quicksort:
- **instructions per item:** Radix Sort executes fewer instructions per item than Quicksort for large arrays, its algorithmic advantage;
- **clock cycles per item:** Radix Sort's line starts on the same trajectory but diverges upward as the data grows;
- **cache misses per item:** Radix Sort's misses climb sharply for large arrays, while Quicksort's stay low.

So instruction count alone does not predict the time: Radix Sort's memory access pattern has poor locality for large inputs, and its extra cache misses (each costing many cycles) outweigh the instructions it saves.

## Software optimisation via blocking

Goal: **maximise accesses to data before it is replaced** (slide 52). The inner loops of DGEMM (double-precision matrix multiply):

\`\`\`
for (int j = 0; j < n; ++j) {
    double cij = C[i+j*n];
    for (int k = 0; k < n; k++)
        cij += A[i+k*n] * B[k+j*n];
    C[i+j*n] = cij;
}
\`\`\`

For large n, the rows and columns touched by the inner loop do not fit in the cache, so they are reloaded on every pass. **Blocking** splits the matrices into BLOCKSIZE × BLOCKSIZE submatrices (BLOCKSIZE = 32 on the slide) and multiplies one block at a time. Each block is small enough to stay in the cache while it is reused, so far fewer misses occur (slide 55: the blocked access pattern touches a much smaller region at a time).

## Pitfalls

- **Ignoring memory-system effects when writing or generating code**, e.g. iterating over the rows versus the columns of an array: large strides give poor locality (slide 90).
- In a multiprocessor with a shared L2 or L3 cache, **less associativity than cores** results in conflict misses: more cores need more associativity (slide 91).
- **Using AMAT to evaluate out-of-order processors** ignores the effect of non-blocked accesses; evaluate by simulation instead.
`
