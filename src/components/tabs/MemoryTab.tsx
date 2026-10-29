import React, { useState, useMemo } from 'react';
import { useOS } from '../../context/OSContext';
import {
  compareAllMemoryStrategies,
  SAMPLE_MEMORY_DATA_1,
  SAMPLE_MEMORY_DATA_2,
} from '../../engine/memory';
import {
  HardDrive,
  Sparkles,
  Layers,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const MemoryTab: React.FC = () => {
  const {
    memoryBlocks,
    setMemoryBlocks,
    memoryProcesses,
    setMemoryProcesses,
    loadMemorySample,
    addToast,
  } = useOS();

  // Custom input raw strings
  const [blocksInput, setBlocksInput] = useState<string>(memoryBlocks.join(', '));
  const [procsInput, setProcsInput] = useState<string>(memoryProcesses.join(', '));

  // Memory evaluation
  const comparison = useMemo(() => {
    return compareAllMemoryStrategies(memoryBlocks, memoryProcesses);
  }, [memoryBlocks, memoryProcesses]);

  const handleApplyCustom = () => {
    const parsedBlocks = blocksInput
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);

    const parsedProcs = procsInput
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);

    if (parsedBlocks.length === 0 || parsedProcs.length === 0) {
      addToast('Please enter at least one positive block size and process size.', 'error');
      return;
    }

    setMemoryBlocks(parsedBlocks);
    setMemoryProcesses(parsedProcs);
    addToast(
      `Applied ${parsedBlocks.length} memory blocks and ${parsedProcs.length} processes.`,
      'success'
    );
  };

  const handleLoadSample = (sampleNum: 1 | 2) => {
    loadMemorySample(sampleNum);
    if (sampleNum === 1) {
      setBlocksInput(SAMPLE_MEMORY_DATA_1.blocks.join(', '));
      setProcsInput(SAMPLE_MEMORY_DATA_1.processes.join(', '));
    } else {
      setBlocksInput(SAMPLE_MEMORY_DATA_2.blocks.join(', '));
      setProcsInput(SAMPLE_MEMORY_DATA_2.processes.join(', '));
    }
  };

  // Find max block size for visual proportionality
  const maxBlockSize = Math.max(...memoryBlocks, 1);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header & Sample Loaders */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">5. Memory Allocation Simulator</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Fixed partitions (one process per block) evaluating First Fit, Best Fit, and Worst Fit.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleLoadSample(1)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-950/40 border border-indigo-500/30 hover:bg-indigo-900/40 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Default C++ Sample (5 blocks, 4 procs)</span>
          </button>
          <button
            onClick={() => handleLoadSample(2)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/40 rounded-lg transition-colors"
            title="Verification case: Blocks 100-500, Procs 150, 220, 300, 50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Verification Test Sample</span>
          </button>
        </div>
      </div>

      {/* Input Deck */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-800 bg-slate-900/40 rounded-xl p-5">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Memory Blocks (Sizes in KB)
          </label>
          <input
            type="text"
            value={blocksInput}
            onChange={(e) => setBlocksInput(e.target.value)}
            placeholder="e.g. 100, 500, 200, 300, 600"
            className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          />
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <span>{memoryBlocks.length} blocks defined:</span>
            <span className="font-mono text-slate-400">[{memoryBlocks.join(', ')}]</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Process Requirements (Sizes in KB)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={procsInput}
              onChange={(e) => setProcsInput(e.target.value)}
              placeholder="e.g. 212, 417, 112, 426"
              className="flex-1 px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleApplyCustom}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shrink-0"
            >
              Apply
            </button>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <span>{memoryProcesses.length} processes arriving:</span>
            <span className="font-mono text-slate-400">[{memoryProcesses.join(', ')}]</span>
          </div>
        </div>
      </div>

      {/* Comparison Summary Banner */}
      <div className="border border-indigo-500/30 bg-indigo-950/20 rounded-xl p-5 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Allocation Conclusion
          </div>
          <div className="text-base font-bold text-white tracking-tight">
            {comparison.conclusion}
          </div>
          <p className="text-xs text-slate-400">
            Lower internal fragmentation preserves contiguous memory for future process requests.
          </p>
        </div>
      </div>

      {/* Strategy Comparison Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Overall Strategy Comparison (Ported from C++ Summary)
          </span>
          <span className="text-xs text-slate-500">Fixed Partitioning</span>
        </div>
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-sans">
              <th className="py-3 px-5 font-semibold">Algorithm</th>
              <th className="py-3 px-5 font-semibold">Internal Fragmentation</th>
              <th className="py-3 px-5 font-semibold">Unallocated Processes</th>
              <th className="py-3 px-5 font-semibold">Free Blocks Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {comparison.summaries.map((s) => {
              const isBest = s.name === comparison.bestStrategy;
              return (
                <tr
                  key={s.strategyId}
                  className={`hover:bg-slate-800/30 transition-colors ${
                    isBest ? 'bg-indigo-950/20 font-semibold' : ''
                  }`}
                >
                  <td className="py-3 px-5 text-white flex items-center gap-2">
                    {s.name}
                    {isBest && (
                      <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        OPTIMAL
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-5 text-amber-400">{s.internalFrag} KB</td>
                  <td className="py-3 px-5 text-rose-400">{s.unalloc}</td>
                  <td className="py-3 px-5 text-emerald-400">{s.freeBlocksTotal} KB</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Proportional Memory Block Visualizer & Process Tables (Side by Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {comparison.summaries.map((summary) => (
          <div
            key={summary.strategyId}
            className="border border-slate-800 bg-slate-900/50 rounded-xl p-5 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-white">{summary.name}</h4>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase">Internal Frag.</div>
                  <div className="text-xs font-bold font-mono text-amber-400">
                    {summary.internalFrag} KB
                  </div>
                </div>
              </div>

              {/* Visual Memory Bars (Proportional to size with hatched fragmentation) */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Memory Blocks Layout
                </span>
                <div className="space-y-2 pt-1">
                  {summary.blockAssignments.map((ba) => {
                    const hasProc = ba.allocatedProcessIndex !== null;
                    const procPct = ba.blockSize > 0 ? (ba.allocatedProcessSize / ba.blockSize) * 100 : 0;
                    const fragPct = 100 - procPct;

                    return (
                      <div key={ba.blockIndex} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-300 font-semibold">
                            Block B{ba.blockIndex + 1} ({ba.blockSize} KB)
                          </span>
                          <span className="text-slate-400">
                            {hasProc ? (
                              <span className="text-indigo-400">
                                P{ba.allocatedProcessIndex! + 1} ({ba.allocatedProcessSize} KB)
                              </span>
                            ) : (
                              <span className="text-emerald-400">FREE</span>
                            )}
                          </span>
                        </div>

                        {/* Bar with filled process and hatched leftover */}
                        <div className="h-6 w-full rounded border border-slate-800 bg-slate-950 flex overflow-hidden">
                          {hasProc ? (
                            <>
                              {/* Filled process portion */}
                              <div
                                style={{ width: `${procPct}%` }}
                                className="h-full bg-indigo-600 flex items-center justify-center text-[10px] font-mono font-bold text-white truncate px-1"
                                title={`Process P${ba.allocatedProcessIndex! + 1}: ${ba.allocatedProcessSize} KB`}
                              >
                                P{ba.allocatedProcessIndex! + 1}
                              </div>

                              {/* Hatched fragmentation portion */}
                              {fragPct > 0 && (
                                <div
                                  style={{
                                    width: `${fragPct}%`,
                                    backgroundImage:
                                      'repeating-linear-gradient(45deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.15) 4px, rgba(245, 158, 11, 0.3) 4px, rgba(245, 158, 11, 0.3) 8px)',
                                  }}
                                  className="h-full border-l border-amber-500/40 flex items-center justify-center text-[9px] font-mono text-amber-300/90 truncate"
                                  title={`Internal Fragmentation: ${ba.fragmentation} KB`}
                                >
                                  +{ba.fragmentation} KB
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="h-full w-full bg-emerald-950/20 flex items-center justify-center text-[10px] font-mono text-emerald-400/80">
                              Unallocated Free Block
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Process Allocation Table */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Process Placement
                </span>
                <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/50">
                  <table className="w-full text-left text-[11px] font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 bg-slate-900/50">
                        <th className="py-1.5 px-3">Proc</th>
                        <th className="py-1.5 px-3">Size</th>
                        <th className="py-1.5 px-3">Block</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {summary.allocations.map((a) => (
                        <tr key={a.processIndex}>
                          <td className="py-1.5 px-3 text-white font-bold">
                            P{a.processIndex + 1}
                          </td>
                          <td className="py-1.5 px-3 text-slate-400">{a.processSize}</td>
                          <td className="py-1.5 px-3">
                            {a.blockIndex !== -1 ? (
                              <span className="text-emerald-400 font-semibold">
                                B{a.blockIndex + 1} ({a.blockSize})
                              </span>
                            ) : (
                              <span className="text-rose-400 font-semibold">NOT ALLOCATED</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Unallocated: {summary.unalloc}</span>
              <span>Free Total: {summary.freeBlocksTotal} KB</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
