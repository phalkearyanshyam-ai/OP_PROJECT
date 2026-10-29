/**
 * @license
 * Banker's Algorithm for Deadlock Avoidance
 * Ported 1:1 from C++ main_portable.cpp with step-by-step tracking
 */

import { BankerState, BankerStep } from '../types/os';

export const SAMPLE_BANKERS_DATA = {
  n: 5,
  m: 3,
  allocation: [
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2],
  ],
  max: [
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3],
  ],
  available: [3, 3, 2],
};

/**
 * Calculate the Need matrix: Need[i][j] = Max[i][j] - Allocation[i][j]
 */
export function calculateNeedMatrix(max: number[][], alloc: number[][]): number[][] {
  const n = max.length;
  const m = max[0]?.length || 0;
  const need: number[][] = [];

  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < m; j++) {
      row.push(Math.max(0, (max[i]?.[j] ?? 0) - (alloc[i]?.[j] ?? 0)));
    }
    need.push(row);
  }
  return need;
}

/**
 * Checks safety and produces the exact sequence and step-by-step trace.
 */
export function checkBankersSafety(
  n: number,
  m: number,
  available: number[],
  allocation: number[][],
  need: number[][]
): {
  isSafe: boolean;
  safeSequence: number[];
  steps: BankerStep[];
  finalWork: number[];
} {
  const work = [...available];
  const finished = new Array(n).fill(false);
  const safeSequence: number[] = [];
  const steps: BankerStep[] = [];

  let count = 0;
  let round = 1;

  while (count < n) {
    let found = false;

    for (let i = 0; i < n; i++) {
      if (finished[i]) continue;

      let canAllocate = true;
      for (let j = 0; j < m; j++) {
        if (need[i][j] > work[j]) {
          canAllocate = false;
          break;
        }
      }

      if (canAllocate) {
        const workBefore = [...work];
        for (let j = 0; j < m; j++) {
          work[j] += allocation[i][j];
        }
        finished[i] = true;
        safeSequence.push(i);
        count++;
        found = true;

        steps.push({
          stepIndex: steps.length + 1,
          processId: i,
          workBefore,
          needVector: [...need[i]],
          allocationVector: [...allocation[i]],
          workAfter: [...work],
          explanation: `P${i} satisfied (Need [${need[i].join(', ')}] ≤ Work [${workBefore.join(', ')}]). Releases [${allocation[i].join(', ')}]. New Work: [${work.join(', ')}]`,
          isExecutable: true,
        });
      }
    }

    if (!found) {
      // No process could proceed -> Deadlock unsafe state
      steps.push({
        stepIndex: steps.length + 1,
        processId: -1,
        workBefore: [...work],
        needVector: [],
        allocationVector: [],
        workAfter: [...work],
        explanation: `Deadlock danger: None of the remaining unfinished processes can satisfy their need with current Work [${work.join(', ')}].`,
        isExecutable: false,
      });

      return {
        isSafe: false,
        safeSequence: [],
        steps,
        finalWork: work,
      };
    }
    round++;
  }

  return {
    isSafe: true,
    safeSequence,
    steps,
    finalWork: work,
  };
}

export interface ResourceRequestResult {
  granted: boolean;
  message: string;
  reasonCode: 'SUCCESS' | 'EXCEEDS_MAX' | 'NOT_ENOUGH_AVAILABLE' | 'UNSAFE_STATE';
  newSafeSequence?: number[];
  newAvailable?: number[];
  newAllocation?: number[][];
  newNeed?: number[][];
}

/**
 * Resource Request Algorithm:
 * 1. If Request_i[j] > Need_i[j], throw error (exceeded maximum claim).
 * 2. If Request_i[j] > Available[j], P_i must wait (resources not available).
 * 3. Pretend allocation:
 *    Available -= Request
 *    Allocation_i += Request
 *    Need_i -= Request
 * 4. Run safety algorithm. If safe -> grant. If unsafe -> roll back and deny.
 */
export function handleResourceRequest(
  processIndex: number,
  request: number[],
  currentState: BankerState
): ResourceRequestResult {
  const { n, m, allocation, max, need, available } = currentState;

  if (processIndex < 0 || processIndex >= n) {
    return {
      granted: false,
      message: `Invalid process ID P${processIndex}.`,
      reasonCode: 'EXCEEDS_MAX',
    };
  }

  // 1. Check if request <= need
  for (let j = 0; j < m; j++) {
    if (request[j] > need[processIndex][j]) {
      return {
        granted: false,
        message: `Error: Request exceeds maximum claim for Resource R${j} (Requested: ${request[j]}, Need: ${need[processIndex][j]}).`,
        reasonCode: 'EXCEEDS_MAX',
      };
    }
  }

  // 2. Check if request <= available
  for (let j = 0; j < m; j++) {
    if (request[j] > available[j]) {
      return {
        granted: false,
        message: `Resources not available for R${j} (Requested: ${request[j]}, Available: ${available[j]}). P${processIndex} must wait.`,
        reasonCode: 'NOT_ENOUGH_AVAILABLE',
      };
    }
  }

  // 3. Pretend to allocate
  const pretendAvailable = [...available];
  const pretendAlloc = allocation.map((row) => [...row]);
  const pretendNeed = need.map((row) => [...row]);

  for (let j = 0; j < m; j++) {
    pretendAvailable[j] -= request[j];
    pretendAlloc[processIndex][j] += request[j];
    pretendNeed[processIndex][j] -= request[j];
  }

  // 4. Test safety
  const safety = checkBankersSafety(n, m, pretendAvailable, pretendAlloc, pretendNeed);

  if (safety.isSafe) {
    return {
      granted: true,
      message: `Request can be GRANTED. System remains in a safe state.`,
      reasonCode: 'SUCCESS',
      newSafeSequence: safety.safeSequence,
      newAvailable: pretendAvailable,
      newAllocation: pretendAlloc,
      newNeed: pretendNeed,
    };
  } else {
    return {
      granted: false,
      message: `Request DENIED (would lead to an unsafe state / deadlock).`,
      reasonCode: 'UNSAFE_STATE',
    };
  }
}
