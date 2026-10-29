import React from 'react';
import { useOS } from '../context/OSContext';
import { Download, RotateCcw, Cpu } from 'lucide-react';

export const Header: React.FC = () => {
  const { tasks, exportJSON, resetAll } = useOS();

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
      {/* Zone 1: Brand title, single element */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Cpu className="w-4 h-4" />
        </div>
        <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
          Multithreaded Task Manager
        </span>
      </div>

      {/* Zone 2: Informative metadata text (No pill badges, clean separators) */}
      <div className="hidden md:flex items-center gap-3 text-xs text-slate-400 whitespace-nowrap shrink-0">
        <span>OS Mini Project</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>{tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'} Loaded</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>Web Worker Pool</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span>C++ Logic Port</span>
      </div>

      {/* Zone 3: Primary action controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={exportJSON}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shadow-sm"
          title="Export current state and benchmarks as JSON"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
        <button
          onClick={resetAll}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-900/50 rounded-lg transition-colors whitespace-nowrap"
          title="Reset all modules to initial baseline"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All</span>
        </button>
      </div>
    </header>
  );
};
