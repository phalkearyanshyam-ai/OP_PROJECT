/**
 * @license
 * Memory Allocation Strategies - First Fit, Best Fit, Worst Fit
 * (Fixed partitions: one process per block)
 * Ported 1:1 from C++ main_portable.cpp
 */

import { MemorySummary } from '../types/os';

export const SAMPLE_MEMORY_DATA_1 = {
  blocks: [100, 500, 200, 300, 600],
  processes: [212, 417, 112, 426],
  label: 'Default C++ Sample (5 blocks, 4 processes)',
};

export const SAMPLE_MEMORY_DATA_2 = {
  blocks: [100, 200, 300, 400, 500],
  processes: [150, 220, 300, 50],
  label: 'Verification Case (Fragmentation: First=280, Best=280, Worst=680)',
};

export const STRATEGY_NAMES = ['First Fit', 'Best Fit', 'Worst Fit'] as const;

/**
 * Execute memory allocation for a specific strategy:
 * 0 = First Fit
 * 1 = Best Fit
 * 2 = Worst Fit
 */
export function runMemoryAllocation(
  strategy: 0 | 1 | 2,
  blocks: number[],
  processes: number[]
): MemorySummary {
  const nb = blocks.length;
  const np = processes.length;
  const used: boolean[] = new Array(nb).fill(false);
  const alloc: number[] = new Array(np).fill(-1);

  for (let i = 0; i < np; i++) {
    let pick = -1;
    for (let b = 0; b < nb; b++) {
      if (used[b] || blocks[b] < processes[i]) continue;

      if (strategy === 0) {
        // First Fit: Pick the first suitable block
        pick = b;
        break;
      }
      if (strategy === 1) {
        // Best Fit: Pick the smallest suitable block
        if (pick === -1 || blocks[b] < blocks[pick]) {
          pick = b;
        }
      }
      if (strategy === 2) {
        // Worst Fit: Pick the largest suitable block
        if (pick === -1 || blocks[b] > blocks[pick]) {
          pick = b;
        }
      }
    }

    if (pick !== -1) {
      used[pick] = true;
      alloc[i] = pick;
    }
  }

  let internalFrag = 0;
  let unalloc = 0;
  let freeBlocksTotal = 0;

  const allocations = processes.map((procSize, i) => {
    const blockIdx = alloc[i];
    const isAllocated = blockIdx !== -1;
    const blockSize = isAllocated ? blocks[blockIdx] : 0;
    const frag = isAllocated ? blockSize - procSize : 0;

    if (isAllocated) {
      internalFrag += frag;
    } else {
      unalloc++;
    }

    return {
      processIndex: i,
      processSize: procSize,
      blockIndex: blockIdx,
      blockSize,
      fragmentation: frag,
    };
  });

  for (let b = 0; b < nb; b++) {
    if (!used[b]) {
      freeBlocksTotal += blocks[b];
    }
  }

  const blockAssignments = blocks.map((blockSize, b) => {
    const assignedProcIdx = alloc.findIndex((bIdx) => bIdx === b);
    const hasProc = assignedProcIdx !== -1;
    const procSize = hasProc ? processes[assignedProcIdx] : 0;
    const frag = hasProc ? blockSize - procSize : 0;

    return {
      blockIndex: b,
      blockSize,
      allocatedProcessIndex: hasProc ? assignedProcIdx : null,
      allocatedProcessSize: procSize,
      fragmentation: frag,
    };
  });

  return {
    name: STRATEGY_NAMES[strategy],
    strategyId: strategy,
    internalFrag,
    unalloc,
    freeBlocksTotal,
    allocations,
    blockAssignments,
  };
}

/**
 * Compare all three memory allocation strategies side by side and generate an evaluation summary.
 */
export function compareAllMemoryStrategies(
  blocks: number[],
  processes: number[]
): {
  summaries: MemorySummary[];
  bestStrategy: string;
  conclusion: string;
} {
  const summaries: MemorySummary[] = [0, 1, 2].map((st) =>
    runMemoryAllocation(st as 0 | 1 | 2, blocks, processes)
  );

  // Lowest unallocated first, then lowest internal fragmentation
  let best = summaries[0];
  for (let i = 1; i < summaries.length; i++) {
    if (
      summaries[i].unalloc < best.unalloc ||
      (summaries[i].unalloc === best.unalloc && summaries[i].internalFrag < best.internalFrag)
    ) {
      best = summaries[i];
    }
  }

  let conclusion = '';
  if (summaries[0].unalloc === summaries[1].unalloc && summaries[0].internalFrag === summaries[1].internalFrag) {
    conclusion = `Both First Fit and Best Fit achieved equal optimal internal fragmentation (${summaries[0].internalFrag} units) with ${summaries[0].unalloc} unallocated processes.`;
  } else {
    conclusion = `${best.name} performed best with ${best.unalloc} unallocated processes and ${best.internalFrag} units internal fragmentation.`;
  }

  return {
    summaries,
    bestStrategy: best.name,
    conclusion,
  };
}
