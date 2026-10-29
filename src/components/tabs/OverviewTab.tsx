import React from 'react';
import { useOS, TabId } from '../../context/OSContext';
import {
  Cpu,
  Layers,
  ShieldCheck,
  HardDrive,
  Activity,
  ArrowRight,
  GitBranch,
  Terminal,
} from 'lucide-react';

export const OverviewTab: React.FC = () => {
  const { setActiveTab, tasks } = useOS();

  const modules = [
    {
      tab: 'creator' as TabId,
      number: '01',
      title: 'Task Creator',
      desc: 'Define processes with burst times and priorities. Supports inline manual entry and random generation.',
      icon: <Layers className="w-5 h-5 text-indigo-400" />,
      tag: 'Input Engine',
    },
    {
      tab: 'scheduling' as TabId,
      number: '02',
      title: 'Scheduling & Real Threads',
      desc: 'Execute FCFS, SJF, Priority, or Round Robin. Dispatches time slices to browser Web Workers in real OS threads.',
      icon: <Cpu className="w-5 h-5 text-emerald-400" />,
      tag: 'CO1: Threads & CPU Scheduling',
    },
    {
      tab: 'compare' as TabId,
      number: '03',
      title: 'Algorithm Comparison',
      desc: 'Simulate all four scheduling policies in parallel. View stacked Gantt charts, average metrics, and best algorithm deduction.',
      icon: <GitBranch className="w-5 h-5 text-sky-400" />,
      tag: 'CO1: Scheduling Analysis',
    },
    {
      tab: 'bankers' as TabId,
      number: '04',
      title: "Banker's Algorithm",
      desc: 'Deadlock avoidance engine. Computes Need matrices, verifies safe states, animates step-by-step Work updates, and validates resource requests.',
      icon: <ShieldCheck className="w-5 h-5 text-amber-400" />,
      tag: "CO2: Deadlock Avoidance",
    },
    {
      tab: 'memory' as TabId,
      number: '05',
      title: 'Memory Allocation',
      desc: 'Fixed partition allocation simulating First Fit, Best Fit, and Worst Fit. Renders proportional block bars with internal fragmentation.',
      icon: <HardDrive className="w-5 h-5 text-purple-400" />,
      tag: 'CO2: Memory Management',
    },
    {
      tab: 'utilization' as TabId,
      number: '06',
      title: 'Worker Utilization Benchmark',
      desc: 'Empirically executes task slices across 1 to 4 worker threads. Generates live speedup curves and utilization trade-off observations.',
      icon: <Activity className="w-5 h-5 text-rose-400" />,
      tag: 'CO1: Resource Utilization',
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Hero Section */}
      <div className="border border-slate-800 bg-slate-900/50 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden">
        <div className="max-w-2xl space-y-4">
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
            <span>Operating Systems Mini Project</span>
            <span aria-hidden="true">·</span>
            <span>C++ Portable Architecture Port</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white leading-tight">
            Multithreaded Task Manager &amp; Resource Utilization
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            A comprehensive, interactive laboratory porting the native C++ OS console program to the browser.
            Demonstrating real Web Worker multithreading, CPU scheduling algorithms, Banker&apos;s deadlock
            avoidance, and contiguous memory partition allocation.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setActiveTab('creator')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-indigo-600/20"
            >
              <span>Start with Task Creator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveTab('scheduling')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              <span>Run Multithreaded Simulator</span>
            </button>
          </div>
        </div>
      </div>

      {/* Project Structure & Architecture Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Course Outcome 1 (CO1)</h3>
              <p className="text-xs text-slate-400">Threads, CPU scheduling &amp; synchronization</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Demonstrates uniprocessor CPU scheduling (FCFS, SJF, Priority, Round Robin) with non-preemptive and preemptive time-slicing.
            The scheduled slices are then dispatched through a producer-consumer pipeline executed by real browser Web Workers,
            measuring thread busy time, overall utilization, and speedup.
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
            <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700/60">Producer-Consumer Queue</span>
            <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700/60">Worker Thread Pool</span>
            <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700/60">Chrono Busy Timing</span>
          </div>
        </div>

        <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Course Outcome 2 (CO2)</h3>
              <p className="text-xs text-slate-400">Deadlock avoidance &amp; memory allocation</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Implements Edsger Dijkstra&apos;s Banker&apos;s Algorithm for resource allocation safety verification and on-the-fly request evaluation.
            Simulates contiguous fixed partition memory placement strategies (First Fit, Best Fit, Worst Fit) and calculates exact internal fragmentation.
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
            <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700/60">Safe Sequence Detection</span>
            <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700/60">Resource Request Test</span>
            <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700/60">Internal Fragmentation</span>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Project Modules</h2>
            <p className="text-xs text-slate-400">Select any module to inspect the algorithms and run experiments.</p>
          </div>
          <span className="text-xs text-slate-500">6 Functional Modules</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((m) => (
            <div
              key={m.tab}
              onClick={() => setActiveTab(m.tab)}
              className="group border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700 rounded-xl p-5 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-slate-800/80 group-hover:scale-105 transition-transform">
                    {m.icon}
                  </div>
                  <span className="text-xs font-mono text-slate-500">{m.number}</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                    {m.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">{m.tag}</span>
                <span className="text-indigo-400 flex items-center gap-1 font-medium group-hover:translate-x-0.5 transition-transform">
                  Launch <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* C++ Code Alignment Reference */}
      <div className="border border-slate-800 bg-slate-950/60 rounded-xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Equivalence with C++ Source Code (`main_portable.cpp`)</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Every mathematical formula in this web application is implemented as an exact port of the C++ logic:
          stable sorting in SJF and Priority ties, Round Robin time slicing, Banker&apos;s need evaluation matrix math,
          and partition searches in First/Best/Worst Fit.
        </p>
      </div>
    </div>
  );
};
