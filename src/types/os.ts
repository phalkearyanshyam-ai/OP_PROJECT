export interface Task {
  id: number;
  burst: number;
  priority: number; // lower number = higher priority
}

export interface Slice {
  taskId: number;
  duration: number;
}

export interface SchedulingResult {
  name: string;
  algoId: number;
  wt: number[];
  tat: number[];
  avgWT: number;
  avgTAT: number;
  slices: Slice[];
}

export interface WorkerBusyStat {
  workerId: number;
  busyMs: number;
  utilization: number;
}

export interface ExecStats {
  wallSec: number;
  utilization: number; // average worker utilization %
  busyMs: number[];
  workerStats: WorkerBusyStat[];
  completedSlices: number;
  timeline: WorkerTimelineEvent[];
}

export interface WorkerTimelineEvent {
  workerId: number;
  taskId: number;
  sliceIndex: number;
  startSec: number;
  endSec: number;
  durationMs: number;
}

export interface WorkerStatus {
  id: number;
  status: 'idle' | 'running';
  currentTaskId?: number;
  currentDuration?: number;
  elapsedMs: number;
  totalDurationMs: number;
}

export interface MonitorLog {
  timestamp: string;
  message: string;
  type: 'info' | 'start' | 'end' | 'monitor';
  workerId?: number;
}

export interface BankerState {
  n: number;
  m: number;
  allocation: number[][];
  max: number[][];
  need: number[][];
  available: number[];
  isSafe: boolean;
  safeSequence: number[];
}

export interface BankerStep {
  stepIndex: number;
  processId: number;
  workBefore: number[];
  needVector: number[];
  allocationVector: number[];
  workAfter: number[];
  explanation: string;
  isExecutable: boolean;
}

export interface MemorySummary {
  name: string;
  strategyId: number;
  internalFrag: number;
  unalloc: number;
  freeBlocksTotal: number;
  allocations: {
    processIndex: number;
    processSize: number;
    blockIndex: number; // -1 if not allocated
    blockSize: number;
    fragmentation: number;
  }[];
  blockAssignments: {
    blockIndex: number;
    blockSize: number;
    allocatedProcessIndex: number | null;
    allocatedProcessSize: number;
    fragmentation: number;
  }[];
}

export interface UtilizationBenchmarkRow {
  workers: number;
  wallSec: number;
  utilization: number;
  speedup: number;
}
