import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { schedule } from '../../engine/scheduler';
import { executeSlicesWithWorkers } from '../../engine/workerPool';
import { getTaskColor, WORKER_COLORS } from '../../utils/colors';
import { ExecStats, WorkerStatus, MonitorLog } from '../../types/os';
import {
  Play,
  RotateCcw,
  Cpu,
  Layers,
  Terminal,
  Clock,
  Zap,
  CheckCircle2,
  Square,
  AlertTriangle,
} from 'lucide-react';

export const SchedulingTab: React.FC = () => {
  const { tasks, quantum, setQuantum, addToast, setActiveTab } = useOS();

  // Algorithm selection: 1=FCFS, 2=SJF, 3=Priority, 4=Round Robin
  const [selectedAlgo, setSelectedAlgo] = useState<number>(1);

  // Web Worker execution settings
  const [numWorkers, setNumWorkers] = useState<number>(2);
  const [msPerUnit, setMsPerUnit] = useState<number>(100);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [execStats, setExecStats] = useState<ExecStats | null>(null);

  // Live telemetry state
  const [workerStatuses, setWorkerStatuses] = useState<WorkerStatus[]>([]);
  const [activeWorkersCount, setActiveWorkersCount] = useState<number>(0);
  const [logs, setLogs] = useState<MonitorLog[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Pure schedule calculation
  const currentResult = useMemo(() => {
    return schedule(selectedAlgo, tasks, quantum);
  }, [selectedAlgo, tasks, quantum]);

  const totalSimulationTime = useMemo(() => {
    return currentResult.slices.reduce((sum, s) => sum + s.duration, 0);
  }, [currentResult.slices]);

  const handleStartThreadExecution = async () => {
    if (tasks.length === 0) {
      addToast('Create tasks first (Option 1 in C++).', 'warning');
      setActiveTab('creator');
      return;
    }
    if (currentResult.slices.length === 0) {
      addToast('No task slices to execute.', 'warning');
      return;
    }

    setIsExecuting(true);
    setExecStats(null);
    setLogs([]);
    setWorkerStatuses(
      Array.from({ length: numWorkers }, (_, i) => ({
        id: i + 1,
        status: 'idle',
        elapsedMs: 0,
        totalDurationMs: 0,
      }))
    );

    abortControllerRef.current = new AbortController();

    try {
      const stats = await executeSlicesWithWorkers({
        slices: currentResult.slices,
        workerCount: numWorkers,
        msPerUnit,
        verbose: true,
        abortSignal: abortControllerRef.current.signal,
        onLog: (newLog) => {
          setLogs((prev) => [...prev.slice(-150), newLog]);
        },
        onWorkerStatuses: (statuses) => {
          setWorkerStatuses(statuses);
        },
        onActiveWorkersChange: (active, total) => {
          setActiveWorkersCount(active);
        },
      });

      setExecStats(stats);
      addToast(
        `Executed ${stats.completedSlices} slices in ${stats.wallSec}s with ${stats.utilization}% average worker utilization.`,
        'success'
      );
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        addToast(`Execution halted: ${(err as Error).message}`, 'error');
      }
    } finally {
      setIsExecuting(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopExecution = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsExecuting(false);
      addToast('Thread execution cancelled.', 'info');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Tab Header & Algorithm Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">2. CPU Scheduling Simulator</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Non-preemptive and preemptive algorithms with real browser Web Worker multithreading.
          </p>
        </div>

        {/* Algorithm Segmented Selector */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {[
            { id: 1, label: '1. FCFS' },
            { id: 2, label: '2. SJF' },
            { id: 3, label: '3. Priority' },
            { id: 4, label: '4. Round Robin' },
          ].map((algo) => (
            <button
              key={algo.id}
              onClick={() => setSelectedAlgo(algo.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedAlgo === algo.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {algo.label}
            </button>
          ))}
        </div>
      </div>

      {/* Round Robin Quantum Slider/Input if RR selected */}
      {selectedAlgo === 4 && (
        <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 flex flex-wrap items-center justify-between gap-4 animate-in fade-in">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-indigo-300">Round Robin Time Quantum: {quantum}</span>
            <p className="text-[11px] text-slate-400">
              Each process is allocated a maximum CPU slice of {quantum} time units before preemption.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="10"
              value={quantum}
              onChange={(e) => setQuantum(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-36 accent-indigo-500 cursor-pointer"
            />
            <input
              type="number"
              min="1"
              max="99"
              value={quantum}
              onChange={(e) => setQuantum(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-16 px-2 py-1 text-xs font-mono bg-slate-950 border border-slate-800 rounded text-center text-white"
            />
          </div>
        </div>
      )}

      {/* Empty State Warning */}
      {tasks.length === 0 ? (
        <div className="border border-slate-800 rounded-xl p-10 text-center bg-slate-900/30 space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
          <h4 className="text-sm font-semibold text-white">No Tasks Configured</h4>
          <p className="text-xs text-slate-400">
            Please populate tasks in the Task Creator tab to simulate CPU scheduling.
          </p>
          <button
            onClick={() => setActiveTab('creator')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium"
          >
            Go to Task Creator
          </button>
        </div>
      ) : (
        <>
          {/* Section A: Mathematical Gantt Chart & KPI Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Gantt Chart ({currentResult.name})
              </span>
              <span className="text-xs font-mono text-slate-400">
                Total CPU Burst: {totalSimulationTime} units
              </span>
            </div>

            {/* Gantt Bar with Time Ticks */}
            <div className="border border-slate-800 bg-slate-900/60 rounded-xl p-5 space-y-4 overflow-x-auto">
              <div className="min-w-[600px] space-y-2">
                <div className="h-12 w-full flex rounded-lg overflow-hidden border border-slate-700/80 shadow-inner">
                  {currentResult.slices.map((slice, idx) => {
                    const pct = totalSimulationTime > 0 ? (slice.duration / totalSimulationTime) * 100 : 0;
                    const color = getTaskColor(slice.taskId);
                    return (
                      <div
                        key={idx}
                        style={{ width: `${pct}%`, backgroundColor: color.hex }}
                        className="h-full flex items-center justify-center font-mono font-bold text-xs text-white border-r border-slate-950/40 relative group cursor-default transition-transform hover:brightness-110"
                        title={`Task T${slice.taskId} | Duration: ${slice.duration} units (${pct.toFixed(1)}%)`}
                      >
                        <span className="truncate px-1">T{slice.taskId}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Time Ticks */}
                <div className="relative h-6 w-full text-[11px] font-mono text-slate-400">
                  {(() => {
                    let accumulated = 0;
                    const markers = [{ time: 0, pct: 0 }];
                    currentResult.slices.forEach((s) => {
                      accumulated += s.duration;
                      markers.push({
                        time: accumulated,
                        pct: totalSimulationTime > 0 ? (accumulated / totalSimulationTime) * 100 : 0,
                      });
                    });

                    return markers.map((m, i) => (
                      <div
                        key={i}
                        className="absolute -translate-x-1/2 flex flex-col items-center"
                        style={{ left: `${m.pct}%` }}
                      >
                        <div className="h-1.5 w-0.5 bg-slate-600 mb-0.5" />
                        <span>{m.time}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* Averages & Results Table */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Average Waiting Time</div>
                  <div className="text-2xl font-bold font-mono text-indigo-400 mt-1">
                    {currentResult.avgWT.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Sum of waiting / {tasks.length}</div>
                </div>
                <Clock className="w-8 h-8 text-indigo-500/20" />
              </div>

              <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Average Turnaround Time</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                    {currentResult.avgTAT.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Sum of TAT / {tasks.length}</div>
                </div>
                <Zap className="w-8 h-8 text-emerald-500/20" />
              </div>

              <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Total Slices Executed</div>
                  <div className="text-2xl font-bold font-mono text-sky-400 mt-1">
                    {currentResult.slices.length}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {selectedAlgo === 4 ? `Preempted (q=${quantum})` : 'Non-preemptive'}
                  </div>
                </div>
                <Layers className="w-8 h-8 text-sky-500/20" />
              </div>
            </div>

            {/* Task Waiting & Turnaround Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-sans">
                    <th className="py-2.5 px-4 font-semibold">Task</th>
                    <th className="py-2.5 px-4 font-semibold">Burst Time</th>
                    <th className="py-2.5 px-4 font-semibold">Priority</th>
                    <th className="py-2.5 px-4 font-semibold">Waiting Time</th>
                    <th className="py-2.5 px-4 font-semibold">Turnaround Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {tasks.map((task, idx) => {
                    const color = getTaskColor(task.id);
                    return (
                      <tr key={task.id} className="hover:bg-slate-800/20">
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color.hex }} />
                            <span className="font-bold text-white">T{task.id}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-slate-300">{task.burst}</td>
                        <td className="py-2.5 px-4 text-slate-300">{task.priority}</td>
                        <td className="py-2.5 px-4 text-indigo-300 font-semibold">{currentResult.wt[idx]}</td>
                        <td className="py-2.5 px-4 text-emerald-300 font-semibold">{currentResult.tat[idx]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section B: Real Multithreading Execution (Web Workers) */}
          <div className="border border-slate-800 bg-slate-900/50 rounded-2xl p-6 space-y-6 mt-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold">
                  <Cpu className="w-4 h-4" />
                  <span>Real Multithreaded Execution (Web Worker Pool)</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Main thread acts as producer, worker threads act as consumers. Measures busy time and CPU slots in use.
                </p>
              </div>

              {/* Execution Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span>Workers:</span>
                  <select
                    value={numWorkers}
                    disabled={isExecuting}
                    onChange={(e) => setNumWorkers(parseInt(e.target.value, 10))}
                    className="px-2 py-1 bg-slate-950 border border-slate-800 rounded font-mono text-white text-xs"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((w) => (
                      <option key={w} value={w}>
                        {w} {w === 1 ? 'Worker' : 'Workers'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span>ms/unit:</span>
                  <select
                    value={msPerUnit}
                    disabled={isExecuting}
                    onChange={(e) => setMsPerUnit(parseInt(e.target.value, 10))}
                    className="px-2 py-1 bg-slate-950 border border-slate-800 rounded font-mono text-white text-xs"
                  >
                    <option value={30}>30ms (Fast)</option>
                    <option value={60}>60ms (Balanced)</option>
                    <option value={100}>100ms (C++ Default)</option>
                    <option value={200}>200ms (Slow)</option>
                  </select>
                </div>

                {isExecuting ? (
                  <button
                    onClick={handleStopExecution}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Stop Execution</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartThreadExecution}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Execute with Real Threads</span>
                  </button>
                )}
              </div>
            </div>

            {/* Live Resource Monitor Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <div className="space-y-0.5">
                <div className="text-[11px] text-slate-500">Live Active Workers</div>
                <div className="text-base font-bold font-mono text-white flex items-center gap-2">
                  <span>
                    {activeWorkersCount} / {numWorkers}
                  </span>
                  {activeWorkersCount > 0 && (
                    <span className="text-[11px] font-sans px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded">
                      Processing
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-[11px] text-slate-500">CPU Slots In Use</div>
                <div className="text-base font-bold font-mono text-indigo-400">
                  {numWorkers > 0 ? Math.round((activeWorkersCount / numWorkers) * 100) : 0}%
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-[11px] text-slate-500">Simulation Status</div>
                <div className="text-xs font-semibold text-slate-300">
                  {isExecuting ? (
                    <span className="text-emerald-400">Executing via Web Worker threads</span>
                  ) : execStats ? (
                    <span className="text-indigo-300">Completed in {execStats.wallSec}s</span>
                  ) : (
                    <span className="text-slate-500">Awaiting execution</span>
                  )}
                </div>
              </div>
            </div>

            {/* Per-Worker Live Status Cards */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400">Worker Thread Pool Status</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: numWorkers }, (_, i) => {
                  const status = workerStatuses[i] || {
                    id: i + 1,
                    status: 'idle',
                    elapsedMs: 0,
                    totalDurationMs: 0,
                  };
                  const isRunning = status.status === 'running';
                  const taskColor = status.currentTaskId ? getTaskColor(status.currentTaskId) : null;
                  const progressPct =
                    isRunning && status.totalDurationMs > 0
                      ? Math.min(100, Math.round((status.elapsedMs / status.totalDurationMs) * 100))
                      : 0;

                  return (
                    <div
                      key={i}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isRunning
                          ? 'border-indigo-500/40 bg-indigo-950/20'
                          : 'border-slate-800 bg-slate-950/50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-mono font-bold text-slate-300">Worker {i + 1}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isRunning
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {isRunning ? 'RUNNING' : 'IDLE'}
                        </span>
                      </div>

                      {isRunning ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Task:</span>
                            <span className="font-bold text-white flex items-center gap-1.5 font-mono">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: taskColor?.hex }}
                              />
                              T{status.currentTaskId} ({status.currentDuration}u)
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 transition-all duration-100 rounded-full"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 py-1 font-mono">Ready in pool</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Worker Timeline Gantt (Real execution timestamps) */}
            {execStats && execStats.timeline.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Worker Thread Timeline (Actual Wall Time Distribution)
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Wall Time: {execStats.wallSec}s | Avg Util: {execStats.utilization}%
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3 overflow-x-auto">
                  {Array.from({ length: numWorkers }, (_, wIdx) => {
                    const workerId = wIdx + 1;
                    const workerSlices = execStats.timeline.filter((ev) => ev.workerId === workerId);
                    const workerBusy = execStats.workerStats.find((ws) => ws.workerId === workerId);

                    return (
                      <div key={workerId} className="flex items-center gap-3 min-w-[650px]">
                        <div className="w-24 shrink-0 text-xs font-mono text-slate-400">
                          Worker {workerId}
                        </div>
                        <div className="flex-1 h-9 bg-slate-900 border border-slate-800 rounded-lg relative overflow-hidden">
                          {workerSlices.map((ev, sIdx) => {
                            const leftPct = (ev.startSec / execStats.wallSec) * 100;
                            const widthPct = Math.max(1, ((ev.endSec - ev.startSec) / execStats.wallSec) * 100);
                            const color = getTaskColor(ev.taskId);

                            return (
                              <div
                                key={sIdx}
                                style={{
                                  left: `${leftPct}%`,
                                  width: `${widthPct}%`,
                                  backgroundColor: color.hex,
                                }}
                                className="absolute top-0 bottom-0 flex items-center justify-center text-[10px] font-mono font-bold text-white border-r border-slate-950/40 truncate px-1 cursor-default"
                                title={`Worker ${workerId} ran T${ev.taskId} for ${Math.round(ev.durationMs)}ms`}
                              >
                                T{ev.taskId}
                              </div>
                            );
                          })}
                        </div>
                        <div className="w-28 shrink-0 text-right text-xs font-mono text-slate-400">
                          {workerBusy?.utilization}% util
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Execution Summary Table matching C++ verbose output */}
            {execStats && (
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Execution Summary (C++ Printout Equivalence)
                  </span>
                  <span className="text-xs font-mono text-emerald-400">
                    Average Utilization: {execStats.utilization}%
                  </span>
                </div>
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-sans">
                      <th className="py-2.5 px-4 font-semibold">Worker</th>
                      <th className="py-2.5 px-4 font-semibold">Busy Time (ms)</th>
                      <th className="py-2.5 px-4 font-semibold">Utilization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {execStats.workerStats.map((ws) => (
                      <tr key={ws.workerId} className="hover:bg-slate-800/20">
                        <td className="py-2 px-4 text-white font-bold">W{ws.workerId}</td>
                        <td className="py-2 px-4 text-slate-300">{ws.busyMs} ms</td>
                        <td className="py-2 px-4 text-indigo-400 font-semibold">{ws.utilization}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Live Terminal Logs Panel */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  Live Thread Console Output
                </span>
                <span className="text-[11px] text-slate-500">{logs.length} events logged</span>
              </div>

              <div className="h-44 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] overflow-y-auto space-y-1">
                {logs.length === 0 ? (
                  <div className="text-slate-600 italic py-4 text-center">
                    Click &quot;Execute with Real Threads&quot; to inspect real-time thread messages.
                  </div>
                ) : (
                  logs.map((l, i) => {
                    let color = 'text-slate-300';
                    if (l.type === 'start') color = 'text-indigo-400';
                    if (l.type === 'end') color = 'text-emerald-400';
                    if (l.type === 'monitor') color = 'text-amber-400/90';

                    return (
                      <div key={i} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-slate-600 select-none">[{l.timestamp}]</span>
                        <span className={color}>{l.message}</span>
                      </div>
                    );
                  })
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
