import React, { useState, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { schedule } from '../../engine/scheduler';
import { executeSlicesWithWorkers } from '../../engine/workerPool';
import { UtilizationBenchmarkRow } from '../../types/os';
import {
  Play,
  RotateCcw,
  Activity,
  AlertTriangle,
  Zap,
  TrendingDown,
  Info,
  Square,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export const UtilizationTab: React.FC = () => {
  const { tasks, addToast, setActiveTab } = useOS();

  const [benchmarkResults, setBenchmarkResults] = useState<UtilizationBenchmarkRow[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentTestingWorkers, setCurrentTestingWorkers] = useState<number | null>(null);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStartBenchmark = async () => {
    if (tasks.length === 0) {
      addToast('Create tasks first (Option 1 in C++).', 'warning');
      setActiveTab('creator');
      return;
    }

    // Port from C++: Result r = schedule(1, gTasks, 2); (FCFS order)
    const fcfsResult = schedule(1, tasks, 2);
    if (fcfsResult.slices.length === 0) {
      addToast('No tasks available to benchmark.', 'warning');
      return;
    }

    setIsRunning(true);
    setBenchmarkResults([]);
    setProgressPercent(0);
    abortControllerRef.current = new AbortController();

    const results: UtilizationBenchmarkRow[] = [];
    let baseTime = 0;

    try {
      for (let w = 1; w <= 4; w++) {
        setCurrentTestingWorkers(w);
        setProgressPercent(Math.round(((w - 1) / 4) * 100));

        // execute with w workers, msPerUnit = 60 for responsive smooth benchmark
        const stats = await executeSlicesWithWorkers({
          slices: fcfsResult.slices,
          workerCount: w,
          msPerUnit: 60,
          verbose: false,
          abortSignal: abortControllerRef.current.signal,
        });

        if (w === 1) {
          baseTime = stats.wallSec;
        }

        const speedup = baseTime > 0 ? Number((baseTime / stats.wallSec).toFixed(2)) : 1.0;
        const row: UtilizationBenchmarkRow = {
          workers: w,
          wallSec: stats.wallSec,
          utilization: stats.utilization,
          speedup,
        };

        results.push(row);
        setBenchmarkResults([...results]);
      }

      setProgressPercent(100);
      addToast('Benchmark across 1 to 4 worker threads completed successfully.', 'success');
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        addToast(`Benchmark stopped: ${(err as Error).message}`, 'error');
      }
    } finally {
      setIsRunning(false);
      setCurrentTestingWorkers(null);
      abortControllerRef.current = null;
    }
  };

  const handleStopBenchmark = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsRunning(false);
      setCurrentTestingWorkers(null);
      addToast('Benchmark stopped by user.', 'info');
    }
  };

  const chartData = benchmarkResults.map((r) => ({
    name: `${r.workers} Worker${r.workers > 1 ? 's' : ''}`,
    'Total Time (s)': r.wallSec,
    'Avg Utilization (%)': r.utilization,
    'Speedup (x)': r.speedup,
  }));

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header & Benchmark Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            6. Resource Utilization Analysis
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirical multithreading benchmark measuring wall time, speedup, and per-thread utilization across 1–4 workers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isRunning ? (
            <button
              onClick={handleStopBenchmark}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Cancel Benchmark</span>
            </button>
          ) : (
            <button
              onClick={handleStartBenchmark}
              disabled={tasks.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition-colors disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Run 1–4 Worker Benchmark</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      {isRunning && (
        <div className="border border-indigo-500/30 bg-indigo-950/20 rounded-xl p-5 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
              Testing {currentTestingWorkers} Worker {currentTestingWorkers === 1 ? 'Thread' : 'Threads'}...
            </span>
            <span className="font-mono text-indigo-300">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Dispatching task slices sequentially to native browser Web Workers to measure actual CPU busy time.
          </p>
        </div>
      )}

      {/* Observation Box matching C++ text */}
      <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
          <Info className="w-4 h-4" />
          <span>Core Operating Systems Observation</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          &quot;More threads reduce total time (speedup), but utilization per thread drops once threads outnumber the available work.&quot;
        </p>
        <p className="text-[11px] text-slate-500">
          When task slices are exhausted or uneven, worker threads spend time idle in condition variable waits,
          reducing average utilization despite overall wall-clock speedup.
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="border border-slate-800 rounded-xl p-10 text-center bg-slate-900/30 space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
          <h4 className="text-sm font-semibold text-white">No Tasks Defined</h4>
          <p className="text-xs text-slate-400">
            Please create tasks before running the 1–4 worker utilization benchmark.
          </p>
          <button
            onClick={() => setActiveTab('creator')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium"
          >
            Go to Task Creator
          </button>
        </div>
      ) : benchmarkResults.length === 0 && !isRunning ? (
        <div className="border border-slate-800 rounded-xl p-12 text-center bg-slate-900/20 space-y-3">
          <Activity className="w-10 h-10 text-indigo-400/40 mx-auto" />
          <h4 className="text-sm font-semibold text-white">Ready for Benchmark</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click &quot;Run 1–4 Worker Benchmark&quot; to execute the FCFS task sequence through 1, 2, 3, and 4
            concurrent Web Worker threads and plot speedup and utilization metrics.
          </p>
          <button
            onClick={handleStartBenchmark}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow"
          >
            Start Benchmark
          </button>
        </div>
      ) : (
        <>
          {/* Performance Table matching C++ output */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Benchmark Results Table
              </span>
              <span className="text-xs text-slate-500">FCFS Slices Sequence</span>
            </div>
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-sans">
                  <th className="py-3 px-5 font-semibold">Workers</th>
                  <th className="py-3 px-5 font-semibold">Total Time (s)</th>
                  <th className="py-3 px-5 font-semibold">Avg Utilization</th>
                  <th className="py-3 px-5 font-semibold">Speedup (Base = 1W)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {benchmarkResults.map((row) => (
                  <tr key={row.workers} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-5 text-white font-bold">{row.workers} Worker{row.workers > 1 ? 's' : ''}</td>
                    <td className="py-3 px-5 text-indigo-300">{row.wallSec.toFixed(2)} s</td>
                    <td className="py-3 px-5 text-emerald-300">{row.utilization.toFixed(1)}%</td>
                    <td className="py-3 px-5 text-amber-300 font-semibold">{row.speedup.toFixed(2)}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Benchmark Charts (Time, Utilization, Speedup) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chart 1: Speedup vs Workers */}
            <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5 space-y-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Speedup Curve (Parallel Efficiency)
              </span>
              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Speedup (x)"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#f59e0b' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Total Time vs Utilization */}
            <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5 space-y-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Total Time vs Avg Worker Utilization
              </span>
              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="Total Time (s)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Avg Utilization (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
