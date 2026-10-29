import React, { useState, useMemo } from 'react';
import { useOS } from '../../context/OSContext';
import {
  calculateNeedMatrix,
  checkBankersSafety,
  handleResourceRequest,
  SAMPLE_BANKERS_DATA,
  ResourceRequestResult,
} from '../../engine/bankers';
import {
  ShieldCheck,
  ShieldAlert,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Send,
  HelpCircle,
  StepForward,
} from 'lucide-react';

export const BankersTab: React.FC = () => {
  const { bankerState, setBankerState, resetBankerToSample, addToast } = useOS();

  // Step-by-step animation state
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isPlayingSteps, setIsPlayingSteps] = useState<boolean>(false);

  // Resource Request Form state
  const [requestProcess, setRequestProcess] = useState<number>(1);
  const [requestVector, setRequestVector] = useState<string[]>(() =>
    new Array(bankerState.m).fill('0')
  );
  const [requestResult, setRequestResult] = useState<ResourceRequestResult | null>(null);

  // Matrix size dimension controls
  const [dimN, setDimN] = useState<number>(bankerState.n);
  const [dimM, setDimM] = useState<number>(bankerState.m);

  // Auto-calculated Need and Safety trace
  const safetyTrace = useMemo(() => {
    return checkBankersSafety(
      bankerState.n,
      bankerState.m,
      bankerState.available,
      bankerState.allocation,
      bankerState.need
    );
  }, [bankerState]);

  // Update Need and matrices safely when allocation, max, or available changes
  const handleMatrixCellChange = (
    matrixType: 'allocation' | 'max',
    row: number,
    col: number,
    valStr: string
  ) => {
    const val = Math.max(0, parseInt(valStr, 10) || 0);
    const newMatrix = bankerState[matrixType].map((r, rIdx) =>
      rIdx === row ? r.map((c, cIdx) => (cIdx === col ? val : c)) : [...r]
    );

    const newAlloc = matrixType === 'allocation' ? newMatrix : bankerState.allocation;
    const newMax = matrixType === 'max' ? newMatrix : bankerState.max;
    const newNeed = calculateNeedMatrix(newMax, newAlloc);
    const safety = checkBankersSafety(
      bankerState.n,
      bankerState.m,
      bankerState.available,
      newAlloc,
      newNeed
    );

    setBankerState({
      ...bankerState,
      [matrixType]: newMatrix,
      need: newNeed,
      isSafe: safety.isSafe,
      safeSequence: safety.safeSequence,
    });
    setActiveStepIndex(0);
    setRequestResult(null);
  };

  const handleAvailableChange = (col: number, valStr: string) => {
    const val = Math.max(0, parseInt(valStr, 10) || 0);
    const newAvail = [...bankerState.available];
    newAvail[col] = val;

    const safety = checkBankersSafety(
      bankerState.n,
      bankerState.m,
      newAvail,
      bankerState.allocation,
      bankerState.need
    );

    setBankerState({
      ...bankerState,
      available: newAvail,
      isSafe: safety.isSafe,
      safeSequence: safety.safeSequence,
    });
    setActiveStepIndex(0);
    setRequestResult(null);
  };

  const handleResizeDimensions = () => {
    const newN = Math.max(1, Math.min(10, dimN));
    const newM = Math.max(1, Math.min(6, dimM));

    const newAlloc: number[][] = [];
    const newMax: number[][] = [];
    const newAvail: number[] = [];

    for (let i = 0; i < newN; i++) {
      const aRow: number[] = [];
      const mRow: number[] = [];
      for (let j = 0; j < newM; j++) {
        aRow.push(bankerState.allocation[i]?.[j] ?? 0);
        mRow.push(bankerState.max[i]?.[j] ?? 2);
      }
      newAlloc.push(aRow);
      newMax.push(mRow);
    }

    for (let j = 0; j < newM; j++) {
      newAvail.push(bankerState.available[j] ?? 2);
    }

    const newNeed = calculateNeedMatrix(newMax, newAlloc);
    const safety = checkBankersSafety(newN, newM, newAvail, newAlloc, newNeed);

    setBankerState({
      n: newN,
      m: newM,
      allocation: newAlloc,
      max: newMax,
      need: newNeed,
      available: newAvail,
      isSafe: safety.isSafe,
      safeSequence: safety.safeSequence,
    });
    setRequestVector(new Array(newM).fill('0'));
    setRequestResult(null);
    setActiveStepIndex(0);
    addToast(`Resized Banker matrices to ${newN} processes × ${newM} resources.`, 'info');
  };

  const handleStepPlay = () => {
    if (safetyTrace.steps.length === 0) return;
    setIsPlayingSteps(true);
    setActiveStepIndex(0);

    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current >= safetyTrace.steps.length) {
        clearInterval(interval);
        setIsPlayingSteps(false);
      }
      setActiveStepIndex(current);
    }, 1200);
  };

  const handleTestRequest = () => {
    const reqVec = requestVector.map((v) => Math.max(0, parseInt(v, 10) || 0));
    const result = handleResourceRequest(requestProcess, reqVec, bankerState);
    setRequestResult(result);

    if (result.granted) {
      addToast(result.message, 'success', 'Request Granted');
    } else {
      addToast(result.message, 'error', 'Request Denied');
    }
  };

  const handleApplyRequestPermanently = () => {
    if (!requestResult || !requestResult.granted || !requestResult.newAvailable) return;

    setBankerState({
      ...bankerState,
      available: requestResult.newAvailable,
      allocation: requestResult.newAllocation!,
      need: requestResult.newNeed!,
      isSafe: true,
      safeSequence: requestResult.newSafeSequence || [],
    });
    setRequestResult(null);
    addToast(`Granted resources committed to P${requestProcess}.`, 'success');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">4. Deadlock Handling – Banker&apos;s Algorithm</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dijkstra&apos;s safety algorithm ensuring no circular wait or deadlock via Work vector verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetBankerToSample}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/40 border border-amber-500/30 hover:bg-amber-900/40 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample Data (5 Proc, 3 Res)</span>
          </button>
        </div>
      </div>

      {/* Safety Badge & Safe Sequence Card */}
      <div
        className={`border rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
          safetyTrace.isSafe
            ? 'border-emerald-500/30 bg-emerald-950/20'
            : 'border-rose-500/30 bg-rose-950/20'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              safetyTrace.isSafe
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            {safetyTrace.isSafe ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <ShieldAlert className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  safetyTrace.isSafe ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {safetyTrace.isSafe ? 'SYSTEM IN SAFE STATE' : 'SYSTEM IN UNSAFE STATE'}
              </span>
              <span className="text-[11px] text-slate-400">
                ({bankerState.n} processes, {bankerState.m} resources)
              </span>
            </div>
            <div className="text-base font-bold text-white mt-1">
              {safetyTrace.isSafe ? (
                <span>
                  Safe Sequence:{' '}
                  <span className="font-mono text-emerald-300">
                    {safetyTrace.safeSequence.map((p) => `P${p}`).join(' → ')}
                  </span>
                </span>
              ) : (
                <span className="text-rose-300">
                  Potential deadlock detected. No valid execution sequence exists.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Step-by-Step Animation Trigger */}
        {safetyTrace.isSafe && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleStepPlay}
              disabled={isPlayingSteps}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isPlayingSteps ? 'Playing Steps...' : 'Animate Safety Steps'}</span>
            </button>
            <button
              onClick={() => setActiveStepIndex((prev) => Math.min(safetyTrace.steps.length, prev + 1))}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              title="Next Step"
            >
              <StepForward className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Step-by-Step Trace Visualizer */}
      {safetyTrace.steps.length > 0 && activeStepIndex > 0 && (
        <div className="border border-indigo-500/30 bg-slate-900/60 rounded-xl p-5 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Safety Verification Step {activeStepIndex} of {safetyTrace.steps.length}
            </span>
            <button
              onClick={() => setActiveStepIndex(0)}
              className="text-[11px] text-slate-400 hover:text-white"
            >
              Reset Step View
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
            {safetyTrace.steps.slice(0, activeStepIndex).map((step, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-700/80 bg-slate-950/80 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Step {step.stepIndex}: P{step.processId}</span>
                  <span className="text-[10px] text-emerald-400">PASSED</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Work Before: [{step.workBefore.join(', ')}]
                </div>
                <div className="text-[11px] text-indigo-300">
                  Need: [{step.needVector.join(', ')}] ≤ Work
                </div>
                <div className="text-[11px] text-emerald-300">
                  New Work: [{step.workAfter.join(', ')}]
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dimension Resizer Bar */}
      <div className="border border-slate-800 bg-slate-900/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-medium text-slate-300">Matrix Dimensions</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-slate-400">Processes (n):</label>
            <input
              type="number"
              min="1"
              max="10"
              value={dimN}
              onChange={(e) => setDimN(parseInt(e.target.value, 10) || 1)}
              className="w-16 px-2 py-1 font-mono bg-slate-950 border border-slate-800 rounded text-center text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-400">Resources (m):</label>
            <input
              type="number"
              min="1"
              max="6"
              value={dimM}
              onChange={(e) => setDimM(parseInt(e.target.value, 10) || 1)}
              className="w-16 px-2 py-1 font-mono bg-slate-950 border border-slate-800 rounded text-center text-white"
            />
          </div>
          <button
            onClick={handleResizeDimensions}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded font-medium border border-slate-700 transition-colors"
          >
            Apply Dimensions
          </button>
        </div>
      </div>

      {/* Available Vector Ribbon */}
      <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Available Vector (Currently Unallocated Resources)
          </span>
          <p className="text-[11px] text-slate-500">Edit values directly to test different system states.</p>
        </div>
        <div className="flex items-center gap-3">
          {bankerState.available.map((avail, j) => (
            <div key={j} className="flex items-center gap-1.5 font-mono text-xs">
              <span className="text-slate-400">R{j}:</span>
              <input
                type="number"
                min="0"
                max="99"
                value={avail}
                onChange={(e) => handleAvailableChange(j, e.target.value)}
                className="w-14 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-center text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Matrices Tables: Allocation, Max, Need */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Process Resource State Table (Allocation, Max, Need)
          </span>
          <span className="text-xs text-slate-500">Need = Max − Allocation</span>
        </div>

        <div className="overflow-x-auto font-mono text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-sans">
                <th className="py-2.5 px-4 font-semibold">Process</th>
                <th className="py-2.5 px-4 font-semibold text-center bg-slate-900/30">
                  Allocation ({bankerState.m} resources)
                </th>
                <th className="py-2.5 px-4 font-semibold text-center bg-slate-900/10">
                  Max Claim ({bankerState.m} resources)
                </th>
                <th className="py-2.5 px-4 font-semibold text-center bg-indigo-950/20 text-indigo-300">
                  Need Matrix (Max − Alloc)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {Array.from({ length: bankerState.n }, (_, i) => (
                <tr key={i} className="hover:bg-slate-800/20">
                  <td className="py-2.5 px-4 font-bold text-white">P{i}</td>

                  {/* Allocation Inputs */}
                  <td className="py-2.5 px-4 text-center bg-slate-900/30">
                    <div className="flex items-center justify-center gap-2">
                      {bankerState.allocation[i].map((val, j) => (
                        <input
                          key={j}
                          type="number"
                          min="0"
                          max="99"
                          value={val}
                          onChange={(e) => handleMatrixCellChange('allocation', i, j, e.target.value)}
                          className="w-12 px-1.5 py-1 text-center bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      ))}
                    </div>
                  </td>

                  {/* Max Inputs */}
                  <td className="py-2.5 px-4 text-center bg-slate-900/10">
                    <div className="flex items-center justify-center gap-2">
                      {bankerState.max[i].map((val, j) => (
                        <input
                          key={j}
                          type="number"
                          min="0"
                          max="99"
                          value={val}
                          onChange={(e) => handleMatrixCellChange('max', i, j, e.target.value)}
                          className="w-12 px-1.5 py-1 text-center bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      ))}
                    </div>
                  </td>

                  {/* Auto Calculated Need */}
                  <td className="py-2.5 px-4 text-center bg-indigo-950/20 text-indigo-300 font-bold">
                    <div className="flex items-center justify-center gap-2">
                      {bankerState.need[i].map((val, j) => (
                        <span key={j} className="w-12 py-1 inline-block text-center bg-slate-950/60 rounded border border-indigo-900/40">
                          {val}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section: Resource Request Algorithm */}
      <div className="border border-slate-800 bg-slate-900/50 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold">
          <Send className="w-4 h-4" />
          <span>Resource Request Simulator (Option 4 Sub-step in C++)</span>
        </div>
        <p className="text-xs text-slate-400">
          Simulate a process requesting additional resource instances. Performs the 3-phase check:
          Request ≤ Need, Request ≤ Available, and tests whether pretend allocation leaves the system in a SAFE state.
        </p>

        <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center gap-2 text-xs">
            <label className="text-slate-400 font-medium">Requesting Process:</label>
            <select
              value={requestProcess}
              onChange={(e) => {
                setRequestProcess(parseInt(e.target.value, 10));
                setRequestResult(null);
              }}
              className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white font-mono text-xs"
            >
              {Array.from({ length: bankerState.n }, (_, i) => (
                <option key={i} value={i}>
                  P{i}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Request Vector:</span>
            <div className="flex items-center gap-1.5 font-mono">
              {Array.from({ length: bankerState.m }, (_, j) => (
                <div key={j} className="flex items-center gap-1">
                  <span className="text-slate-500 text-[11px]">R{j}:</span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={requestVector[j] ?? '0'}
                    onChange={(e) => {
                      const updated = [...requestVector];
                      updated[j] = e.target.value;
                      setRequestVector(updated);
                      setRequestResult(null);
                    }}
                    className="w-12 px-1.5 py-1 text-center bg-slate-900 border border-slate-700 rounded text-white text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleTestRequest}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <span>Test Request</span>
          </button>
        </div>

        {/* Request Result Display */}
        {requestResult && (
          <div
            className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in ${
              requestResult.granted
                ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                : 'border-rose-500/40 bg-rose-950/20 text-rose-300'
            }`}
          >
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                {requestResult.granted ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>REQUEST GRANTED</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>REQUEST DENIED</span>
                  </>
                )}
              </div>
              <div className="text-xs leading-relaxed text-slate-200">
                {requestResult.message}
              </div>
              {requestResult.newSafeSequence && (
                <div className="text-xs font-mono text-emerald-400 mt-1">
                  New Safe Sequence: {requestResult.newSafeSequence.map((p) => `P${p}`).join(' → ')}
                </div>
              )}
            </div>

            {requestResult.granted && (
              <button
                onClick={handleApplyRequestPermanently}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shrink-0"
              >
                Apply Allocation Permanently
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
