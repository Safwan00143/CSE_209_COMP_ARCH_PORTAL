import { md } from "../md"

export const coherenceNote = md`
## The cache coherence problem

Suppose two CPU cores share a physical address space, each with its own write-through cache (slide 80). Memory location X starts at 0.

| Time step | Event | CPU A's cache | CPU B's cache | Memory |
|---|---|---|---|---|
| 0 | | | | 0 |
| 1 | CPU A reads X | 0 | | 0 |
| 2 | CPU B reads X | 0 | 0 | 0 |
| 3 | CPU A writes 1 to X | 1 | 0 | 1 |

After step 3, memory and A's cache hold 1, but **B's cache still holds 0**. If B reads X now, it gets the stale value 0. The two caches give different values for the same location: they are **incoherent**.

## What coherence means

Informally: **reads return the most recently written value** (slide 81). Formally, three conditions:

1. **P writes X, then P reads X** (no intervening writes by others): the read returns the written value.
2. **P1 writes X, then P2 reads X sufficiently later:** the read returns the written value. (CPU B reading X after step 3 above breaks this.)
3. **P1 writes X and P2 writes X:** all processors see the writes **in the same order** (write serialisation), so they end up with the same final value for X.

## Cache coherence protocols

Operations the caches in a multiprocessor perform to ensure coherence (slide 82):
- **migration** of data to local caches, which reduces the bandwidth demand on the shared memory;
- **replication** of read-shared data, which reduces contention for access.

Two kinds of protocol:

| | Snooping | Directory based |
|---|---|---|
| How | every cache monitors (snoops) the bus for reads and writes | the caches and memory record the sharing status of each block in a directory |
| Key idea | coherence by observing all bus transactions | coherence by consulting a central directory instead of broadcasting |
| Best for | small systems with a shared bus, where every cache can see every access | large systems, since it avoids flooding the bus with broadcasts |

## Snooping protocols

Every cache "snoops" on the memory bus to see whether other processors are reading or writing data it has cached (slide 83). If a cache sees that another processor wants to write a block it holds, it can **update** or **invalidate** its copy to keep coherence.

**Invalidating snooping protocol (slide 85).** A cache gets **exclusive access** to a block when it is to be written:
1. it broadcasts an **invalidate** message on the bus;
2. every other cache holding the block marks its copy invalid;
3. a later read of the block in another cache therefore **misses**;
4. the owning cache supplies the updated value.

**Example**, with write-back caches:

| CPU activity | Bus activity | CPU A's cache | CPU B's cache | Memory |
|---|---|---|---|---|
| | | | | 0 |
| CPU A reads X | cache miss for X | 0 | | 0 |
| CPU B reads X | cache miss for X | 0 | 0 | 0 |
| CPU A writes 1 to X | invalidate for X | 1 | (invalid) | 0 |
| CPU B reads X | cache miss for X | 1 | 1 | 1 |

At A's write, B's copy is invalidated (memory is not yet updated: the cache is write-back). When B then reads X it misses; A, which has the only up-to-date copy, supplies 1, and memory is updated too. B never sees the stale 0.

## Memory consistency

When are writes **seen** by other processors? "Seen" means a read returns the written value. It cannot be instantaneous (slide 86).

Assumptions:
- a write completes only when all processors have seen it;
- a processor does not reorder writes with other accesses.

Consequence: if P writes X and then writes Y, every processor that sees the new Y also sees the new X. Processors can reorder reads, but not writes.
`
