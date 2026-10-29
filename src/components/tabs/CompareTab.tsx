import React, { useMemo } from 'react';
import { useOS } from '../../context/OSContext';
import { compareAllAlgorithms } from '../../engine/scheduler';
import { getTaskColor } from '../../utils/colors';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Trophy, AlertTriangle, Layers, ArrowRight } from 'lucide-react';

export const CompareTab: React.FC = () => {
  const { tasks, quantum, setQuantum, setActiveTab } = useOS();

  const comparison = useMemo(() => {
    return compareAllAlgorithms(tasks, quantum);
  }, [tasks, quantum]);

  const chartData = useMemo(() => {
    return comparison.results.map((r) => ({
      name: r.name,
      'Avg Waiting Time': r.avgWT,
      'Avg Turnaround Time': r.avgTAT,
    }));
  }, [comparison]);

  const maxDuration = useMemo(() => {
    let m = 0;
    comparison.results.forEach((r) => {
      const sum = r.slices.reduce((acc, s) => acc + s.duration, 0);
      if (sum > m) m = sum;
    });
    return m;
  }, [comparison]);

  if (tasks.length === 0) {
    return (
      <div className="max-w-4xl mx-auto border border-slate-800 rounded-xl p-10 text-center bg-slate-900/30 space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <h4 className="text-sm font-semibold text-white">Create Tasks First</h4>
        <p className="text-xs text-slate-400">
          Option 3 in the C++ program requires tasks to compare scheduling algorithms.
        </p>
        <button
          onClick={() => setActiveTab('creator')}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium"
        >
          Go to Task Creator
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header and Quantum Control */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">3. Compare All Algorithms</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluating FCFS, Shortest Job First (SJF), Priority, and Round Robin on the current task set.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-2 rounded-xl">
          <label className="text-xs text-slate-400 font-medium">RR Time Quantum:</label>
          <input
            type="number"
            min="1"
            max="20"
            value={quantum}
            onChange={(e) => setQuantum(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-16 px-2.5 py-1 text-xs font-mono bg-slate-950 border border-slate-800 rounded text-center text-white"
          />
        </div>
      </div>

      {/* Winner Highlight Card */}
      <div className="border border-emerald-500/30 bg-emerald-950/20 rounded-xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <Trophy className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Optimal Policy Determined
          </div>
          <div className="text-base font-bold text-white tracking-tight">
            {comparison.conclusion}
          </div>
          <p className="text-xs text-slate-400">
            Lowest average waiting time minimizes idle latency across all arriving processes.
          </p>
        </div>
      </div>

      {/* Comparison Table & Bar Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table matching C++ printout */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40 flex flex-col justify-between">
          <div>
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Performance Metrics Table
              </span>
              <span className="text-xs text-slate-500">{tasks.length} Tasks</span>
            </div>
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-sans">
                  <th className="py-3 px-5 font-semibold">Algorithm</th>
                  <th className="py-3 px-5 font-semibold">Avg Waiting Time</th>
                  <th className="py-3 px-5 font-semibold">Avg Turnaround Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {comparison.results.map((r) => {
                  const isBest = r.name === comparison.bestAlgorithm;
                  return (
                    <tr
                      key={r.algoId}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        isBest ? 'bg-emerald-950/20 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-5 text-white flex items-center gap-2">
                        {r.name}
                        {isBest && (
                          <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            BEST
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-indigo-400">{r.avgWT.toFixed(2)}</td>
                      <td className="py-3 px-5 text-emerald-400">{r.avgTAT.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-800/80 bg-slate-950/50 text-[11px] text-slate-400 space-y-1">
            <p>
              • <strong>SJF</strong> is mathematically provably optimal in reducing average waiting time for uniprocessor queues with zero arrival delays.
            </p>
            <p>
              • <strong>Round Robin</strong> ensures responsiveness and prevents starvation through time quantum ({quantum}) preemption.
            </p>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Comparative Chart (WT vs TAT)
            </span>
            <span className="text-xs text-slate-500">Lower is better</span>
          </div>

          <div className="h-64 w-full pt-2">
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
                  itemStyle={{ color: '#cbd5e1' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Avg Waiting Time" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Avg Turnaround Time" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Stacked Gantt Charts for all 4 algorithms */}
      <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Stacked Gantt Charts (Visual Flow Comparison)
          </span>
          <span className="text-xs font-mono text-slate-500">Total: {maxDuration} units</span>
        </div>

        <div className="space-y-4 pt-1">
          {comparison.results.map((res) => {
            return (
              <div key={res.algoId} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{res.name}</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Avg WT: <strong className="text-indigo-400">{res.avgWT.toFixed(2)}</strong> | Avg TAT:{' '}
                    <strong className="text-emerald-400">{res.avgTAT.toFixed(2)}</strong>
                  </span>
                </div>

                <div className="h-8 w-full flex rounded-lg overflow-hidden border border-slate-700/80 shadow-inner bg-slate-950">
                  {res.slices.map((slice, sIdx) => {
                    const pct = maxDuration > 0 ? (slice.duration / maxDuration) * 100 : 0;
                    const color = getTaskColor(slice.taskId);
                    return (
                      <div
                        key={sIdx}
                        style={{ width: `${pct}%`, backgroundColor: color.hex }}
                        className="h-full flex items-center justify-center font-mono font-bold text-[10px] text-white border-r border-slate-950/40 truncate px-1 cursor-default hover:brightness-110"
                        title={`Task T${slice.taskId} | Duration: ${slice.duration} units`}
                      >
                        T{slice.taskId}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
