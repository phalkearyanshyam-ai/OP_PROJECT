/**
 * @license
 * Browser Web Worker Pool implementing Producer-Consumer architecture
 * Ported 1:1 from C++ main_portable.cpp's multithreaded execution
 */

import { Slice, ExecStats, WorkerStatus, MonitorLog, WorkerTimelineEvent } from '../types/os';

// Worker source script as an inline string to guarantee cross-environment isolation
const WORKER_SCRIPT = `
self.onmessage = function(e) {
  const data = e.data;
  if (data.type === 'EXECUTE') {
    const { workerId, sliceIndex, taskId, duration, msPerUnit } = data;
    const totalMs = duration * msPerUnit;
    const startTime = performance.now();

    self.postMessage({
      type: 'START',
      workerId,
      sliceIndex,
      taskId,
      duration,
      startTime
    });

    const intervalTime = Math.min(50, totalMs / 10);
    let intervalId = null;

    if (totalMs > 100) {
      intervalId = setInterval(() => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(99, Math.round((elapsed / totalMs) * 100));
        self.postMessage({
          type: 'PROGRESS',
          workerId,
          sliceIndex,
          taskId,
          progress,
          elapsed
        });
      }, intervalTime);
    }

    setTimeout(() => {
      if (intervalId) clearInterval(intervalId);
      const endTime = performance.now();
      const busyMs = endTime - startTime;

      self.postMessage({
        type: 'END',
        workerId,
        sliceIndex,
        taskId,
        duration,
        busyMs,
        endTime
      });
    }, totalMs);
  }
};
`;

export interface RunOptions {
  slices: Slice[];
  workerCount: number;
  msPerUnit?: number;
  verbose?: boolean;
  onLog?: (log: MonitorLog) => void;
  onWorkerStatuses?: (statuses: WorkerStatus[]) => void;
  onActiveWorkersChange?: (active: number, total: number) => void;
  abortSignal?: AbortSignal;
}

export async function executeSlicesWithWorkers(options: RunOptions): Promise<ExecStats> {
  const {
    slices,
    workerCount,
    msPerUnit = 100,
    verbose = true,
    onLog,
    onWorkerStatuses,
    onActiveWorkersChange,
    abortSignal,
  } = options;

  const numWorkers = Math.max(1, Math.min(8, workerCount));
  const queue: { slice: Slice; index: number }[] = slices.map((s, idx) => ({ slice: s, index: idx }));
  const busyMs: number[] = new Array(numWorkers).fill(0);
  const timeline: WorkerTimelineEvent[] = [];

  const workerStatuses: WorkerStatus[] = Array.from({ length: numWorkers }, (_, i) => ({
    id: i + 1,
    status: 'idle',
    elapsedMs: 0,
    totalDurationMs: 0,
  }));

  // Create Worker Blob
  const blob = new Blob([WORKER_SCRIPT], { type: 'application/javascript' });
  const workerBlobUrl = URL.createObjectURL(blob);
  const workers: Worker[] = [];

  for (let i = 0; i < numWorkers; i++) {
    workers.push(new Worker(workerBlobUrl));
  }

  const log = (message: string, type: MonitorLog['type'] = 'info', workerId?: number) => {
    if (!verbose && type !== 'info') return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(
      now.getMilliseconds()
    ).padStart(3, '0')}`;

    if (onLog) {
      onLog({
        timestamp: timeStr,
        message,
        type,
        workerId,
      });
    }
  };

  return new Promise<ExecStats>((resolve, reject) => {
    let completed = 0;
    let activeWorkers = 0;
    let isTerminated = false;
    const startTimeEpoch = performance.now();

    const cleanup = () => {
      isTerminated = true;
      if (monitorInterval) clearInterval(monitorInterval);
      workers.forEach((w) => w.terminate());
      URL.revokeObjectURL(workerBlobUrl);
    };

    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        cleanup();
        reject(new Error('Execution cancelled by user.'));
      });
    }

    // Monitor Loop (runs every 500ms, matching C++ monitorLoop)
    const monitorInterval = setInterval(() => {
      if (isTerminated) return;
      const pct = Math.round((activeWorkers / numWorkers) * 100);
      log(`[MONITOR] Active workers: ${activeWorkers}/${numWorkers} | CPU slots in use: ${pct}%`, 'monitor');
      if (onActiveWorkersChange) {
        onActiveWorkersChange(activeWorkers, numWorkers);
      }
    }, 500);

    const updateStatuses = () => {
      if (onWorkerStatuses) {
        onWorkerStatuses([...workerStatuses]);
      }
      if (onActiveWorkersChange) {
        onActiveWorkersChange(activeWorkers, numWorkers);
      }
    };

    // Helper to dispatch next slice to an idle worker
    const tryDispatch = (wIdx: number) => {
      if (isTerminated || queue.length === 0) return;

      const item = queue.shift()!;
      activeWorkers++;
      workerStatuses[wIdx] = {
        id: wIdx + 1,
        status: 'running',
        currentTaskId: item.slice.taskId,
        currentDuration: item.slice.duration,
        elapsedMs: 0,
        totalDurationMs: item.slice.duration * msPerUnit,
      };
      updateStatuses();

      workers[wIdx].postMessage({
        type: 'EXECUTE',
        workerId: wIdx + 1,
        sliceIndex: item.index,
        taskId: item.slice.taskId,
        duration: item.slice.duration,
        msPerUnit,
      });
    };

    // Attach message handlers to all workers
    workers.forEach((worker, wIdx) => {
      worker.onmessage = (e) => {
        if (isTerminated) return;
        const msg = e.data;

        if (msg.type === 'START') {
          log(`[Worker ${msg.workerId}] START Task T${msg.taskId} for ${msg.duration} units`, 'start', msg.workerId);
        } else if (msg.type === 'PROGRESS') {
          if (workerStatuses[wIdx].status === 'running') {
            workerStatuses[wIdx].elapsedMs = msg.elapsed;
            updateStatuses();
          }
        } else if (msg.type === 'END') {
          log(`[Worker ${msg.workerId}] END   Task T${msg.taskId}`, 'end', msg.workerId);

          busyMs[wIdx] += msg.busyMs;
          activeWorkers = Math.max(0, activeWorkers - 1);
          completed++;

          const startWallSec = (msg.endTime - msg.busyMs - startTimeEpoch) / 1000;
          const endWallSec = (msg.endTime - startTimeEpoch) / 1000;

          timeline.push({
            workerId: msg.workerId,
            taskId: msg.taskId,
            sliceIndex: msg.sliceIndex,
            startSec: Math.max(0, startWallSec),
            endSec: endWallSec,
            durationMs: msg.busyMs,
          });

          workerStatuses[wIdx] = {
            id: wIdx + 1,
            status: 'idle',
            elapsedMs: 0,
            totalDurationMs: 0,
          };
          updateStatuses();

          // Check if all slices are completed
          if (completed >= slices.length) {
            const wallSec = (performance.now() - startTimeEpoch) / 1000;
            let busyTotal = 0;
            for (let w = 0; w < numWorkers; w++) {
              busyTotal += busyMs[w];
            }

            const overallUtilization = (busyTotal / 1000) / (numWorkers * wallSec) * 100;

            const workerStats = busyMs.map((ms, idx) => ({
              workerId: idx + 1,
              busyMs: Math.round(ms),
              utilization: Number(((ms / 1000 / wallSec) * 100).toFixed(1)),
            }));

            log(`All ${completed} slices executed by ${numWorkers} worker threads in ${wallSec.toFixed(2)} s`);
            log(`Average utilization: ${overallUtilization.toFixed(1)}%`);

            cleanup();

            resolve({
              wallSec: Number(wallSec.toFixed(2)),
              utilization: Number(overallUtilization.toFixed(1)),
              busyMs: busyMs.map(Math.round),
              workerStats,
              completedSlices: completed,
              timeline,
            });
            return;
          }

          // Pick next slice if available
          if (queue.length > 0) {
            tryDispatch(wIdx);
          }
        }
      };

      worker.onerror = (err) => {
        cleanup();
        reject(err);
      };
    });

    // Producer starts: fill initial idle workers with items from queue
    for (let w = 0; w < numWorkers; w++) {
      if (queue.length > 0) {
        tryDispatch(w);
      }
    }
  });
}
