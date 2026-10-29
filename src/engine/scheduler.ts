/**
 * @license
 * Multithreaded Task Manager - OS Mini Project
 * Pure scheduling logic ported 1:1 from C++ main_portable.cpp
 */

import { Task, SchedulingResult } from '../types/os';

export function getAlgoName(algoId: number): string {
  switch (algoId) {
    case 1:
      return 'FCFS';
    case 2:
      return 'SJF';
    case 3:
      return 'Priority';
    case 4:
      return 'Round Robin';
    default:
      return '?';
  }
}

/**
 * CPU Scheduling (all tasks arrive at time 0)
 * Ported 1:1 from C++ schedule(int algo, const vector<Task> &tasks, int quantum)
 */
export function schedule(algo: number, tasks: Task[], quantum = 2): SchedulingResult {
  const n = tasks.length;
  const name = getAlgoName(algo);

  if (n === 0) {
    return {
      name,
      algoId: algo,
      wt: [],
      tat: [],
      avgWT: 0,
      avgTAT: 0,
      slices: [],
    };
  }

  const wt: number[] = new Array(n).fill(0);
  const tat: number[] = new Array(n).fill(0);
  const slices: { taskId: number; duration: number }[] = [];

  if (algo !== 4) {
    // 0..n-1 indices
    const order: number[] = Array.from({ length: n }, (_, i) => i);

    if (algo === 2) {
      // SJF: stable sort by burst ascending
      // JavaScript's Array.prototype.sort is guaranteed stable since ECMAScript 2019
      order.sort((a, b) => tasks[a].burst - tasks[b].burst);
    } else if (algo === 3) {
      // Priority: stable sort by priority ascending (1 = highest)
      order.sort((a, b) => tasks[a].priority - tasks[b].priority);
    }
    // algo === 1 is FCFS: order stays 0..n-1

    let t = 0;
    for (let k = 0; k < order.length; k++) {
      const idx = order[k];
      wt[idx] = t;
      slices.push({ taskId: tasks[idx].id, duration: tasks[idx].burst });
      t += tasks[idx].burst;
      tat[idx] = t;
    }
  } else {
    // Round Robin
    const qVal = Math.max(1, Math.floor(quantum));
    const rem: number[] = tasks.map((task) => task.burst);
    const queue: number[] = Array.from({ length: n }, (_, i) => i);

    let t = 0;
    while (queue.length > 0) {
      const idx = queue.shift()!;
      const run = Math.min(qVal, rem[idx]);
      slices.push({ taskId: tasks[idx].id, duration: run });
      t += run;
      rem[idx] -= run;

      if (rem[idx] > 0) {
        queue.push(idx);
      } else {
        tat[idx] = t;
        wt[idx] = t - tasks[idx].burst;
      }
    }
  }

  let sw = 0;
  let st = 0;
  for (let i = 0; i < n; i++) {
    sw += wt[i];
    st += tat[i];
  }

  const avgWT = Number((sw / n).toFixed(4));
  const avgTAT = Number((st / n).toFixed(4));

  return {
    name,
    algoId: algo,
    wt,
    tat,
    avgWT,
    avgTAT,
    slices,
  };
}

/**
 * Compare all 4 algorithms and determine the best one (lowest avg waiting time).
 */
export function compareAllAlgorithms(tasks: Task[], quantum = 2): {
  results: SchedulingResult[];
  bestAlgorithm: string;
  bestAvgWT: number;
  conclusion: string;
} {
  const results: SchedulingResult[] = [];
  let bestWT = Infinity;
  let bestName = '';

  for (let a = 1; a <= 4; a++) {
    const res = schedule(a, tasks, quantum);
    results.push(res);
    if (res.avgWT < bestWT) {
      bestWT = res.avgWT;
      bestName = res.name;
    }
  }

  const formattedBestWT = bestWT.toFixed(2);
  const conclusion = `${bestName} gives the lowest average waiting time (${formattedBestWT}) for this task set.`;

  return {
    results,
    bestAlgorithm: bestName,
    bestAvgWT: bestWT,
    conclusion,
  };
}
