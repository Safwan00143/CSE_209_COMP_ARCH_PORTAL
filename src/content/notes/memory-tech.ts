import { md } from "../md"

export const memoryTechNote = md`
## The principle of locality

Programs access a small proportion of their address space at any time (slide 2).

- **Temporal locality:** items accessed recently are likely to be accessed again soon. Examples: instructions in a loop, induction variables (loop counters).
- **Spatial locality:** items near those accessed recently are likely to be accessed soon. Examples: sequential instruction access, array data.

## Taking advantage of locality: the memory hierarchy

\`\`\`fig
mem-pyramid
\`\`\`

- Store everything on **disk**.
- Copy recently accessed (and nearby) items from disk to a smaller **DRAM** memory: the **main memory**.
- Copy more recently accessed (and nearby) items from DRAM to a smaller **SRAM** memory: the **cache**, attached to the CPU.

**How locality shapes the hierarchy.**
- *Temporal locality* is why keeping recently used items in the small, fast upper levels pays off: they are likely to be used again while still there.
- *Spatial locality* is why data are copied in **blocks** of several words: the neighbours of an accessed word are likely to be needed soon, and they arrive with it.

Together they let a small, fast memory serve most accesses, giving the illusion of a memory as large as the lowest level and almost as fast as the highest.

## Hierarchy terms

- **Block** (or **line**): the unit of copying between levels; may be multiple words.
- **Hit:** the accessed data is present in the upper level, and the access is satisfied there.
  $$
  \text{Hit ratio} = \frac{\text{hits}}{\text{accesses}}
  $$
- **Miss:** the data is absent. The block is copied from the lower level; the time taken is the **miss penalty**. Then the data is supplied from the upper level.
  $$
  \text{Miss ratio} = \frac{\text{misses}}{\text{accesses}} = 1 - \text{hit ratio}
  $$

## Memory technology

| Technology | Access time | Cost per GB |
|---|---|---|
| Static RAM (SRAM) | 0.5 ns – 2.5 ns | \$2000 – \$5000 |
| Dynamic RAM (DRAM) | 50 ns – 70 ns | \$20 – \$75 |
| Magnetic disk | 5 ms – 20 ms | \$0.20 – \$2 |

The **ideal memory** would have the access time of SRAM with the capacity and cost per GB of disk. The hierarchy approximates it.

## DRAM

- Data is stored as a **charge in a capacitor**; a single transistor accesses the charge.
- It must be **periodically refreshed**: read the contents and write them back. Refresh is done on a whole DRAM **row** at a time.

**Advanced DRAM organisation (slide 7).**
- Bits are organised as a rectangular array, and DRAM accesses an entire row.
- **Burst mode:** supply successive words from a row with reduced latency.
- **Double data rate (DDR) DRAM:** transfer on both the rising and the falling clock edges.
- **Quad data rate (QDR) DRAM:** separate DDR inputs and outputs.

**DRAM performance factors (slide 9).**
- **Row buffer:** allows several words to be read and refreshed in parallel.
- **Synchronous DRAM:** allows consecutive accesses in bursts without sending each address; improves bandwidth.
- **DRAM banking:** allows simultaneous access to multiple banks; improves bandwidth. (Spreading consecutive words across banks so they can be accessed in parallel is **interleaved memory**.)

Capacity per chip grew from 64 Kbit (1980, \$1,500,000 per GB) to 1 Gbit (2007, \$50 per GB).

## Flash storage

- **Nonvolatile** semiconductor storage.
- 100× – 1000× faster than disk; smaller, lower power, more robust.
- But more \$ per GB (between disk and DRAM).

| | NOR flash | NAND flash |
|---|---|---|
| Bit cell | like a NOR gate | like a NAND gate |
| Access | random read/write | block at a time |
| Density, cost | lower density | denser (bits/area), cheaper per GB |
| Used for | instruction memory in embedded systems | USB keys, media storage |

Flash bits **wear out** after thousands of writes, so flash is not suitable as a direct RAM or disk replacement. **Wear leveling** remaps data to less-used blocks.

## Disk storage

Nonvolatile, rotating magnetic storage. Each **sector** records:
- a sector ID;
- data (512 bytes; 4096 bytes proposed);
- an error-correcting code (ECC), to hide defects and recording errors;
- synchronisation fields and gaps.

**Access to a sector involves:**
1. **queuing delay**, if other accesses are pending;
2. **seek**: moving the heads to the track;
3. **rotational latency**: waiting for the sector to come under the head. On average, half a rotation;
4. **data transfer**;
5. **controller overhead**.

$$
\text{Average read time} = \text{seek} + \frac{0.5\ \text{rotation}}{\text{rotations per second}} + \frac{\text{sector size}}{\text{transfer rate}} + \text{controller overhead}
$$

**Example (slide 15).** 512 B sector, 15,000 rpm, 4 ms average seek time, 100 MB/s transfer rate, 0.2 ms controller overhead, idle disk.

**Step 1: seek.** 4 ms.

**Step 2: rotational latency.** 15,000 rpm = 15,000/60 = 250 rotations per second.
$$
\frac{0.5}{250\ \text{rps}} = 0.002\ \text{s} = 2\ \text{ms}
$$

**Step 3: transfer.**
$$
\frac{512\ \text{B}}{100\ \text{MB/s}} = \frac{512}{100\times10^{6}}\ \text{s} = 0.00512\ \text{ms} \approx 0.005\ \text{ms}
$$

**Step 4: controller.** 0.2 ms.

**Total:**
$$
4 + 2 + 0.005 + 0.2 = 6.2\ \text{ms}
$$

If the actual average seek time is 1 ms (thanks to locality), the average read time is $1 + 2 + 0.005 + 0.2 \approx 3.2$ ms.

**Disk performance issues (slide 16).**
- Manufacturers quote the average seek time over all possible seeks; locality and OS scheduling make the actual average smaller.
- Smart disk controllers allocate physical sectors on the disk and present a logical sector interface to the host (SCSI, ATA, SATA).
- Disk drives include caches: they prefetch sectors in anticipation of access, avoiding seek and rotational delay.

## Concluding remarks

- Fast memories are small and large memories are slow. We want fast, large memories, and caching gives that illusion.
- It works because of the principle of locality: programs use a small part of their memory space frequently.
- The hierarchy: L1 cache → L2 cache → … → DRAM memory → disk.
- Memory-system design is critical for multiprocessors.
`
