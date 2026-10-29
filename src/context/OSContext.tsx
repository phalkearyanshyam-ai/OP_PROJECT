/**
 * @license
 * OS Mini Project - Shared React Context
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Task, BankerState, MemorySummary } from '../types/os';
import { SAMPLE_BANKERS_DATA, calculateNeedMatrix, checkBankersSafety } from '../engine/bankers';
import { SAMPLE_MEMORY_DATA_1 } from '../engine/memory';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

export type TabId = 'overview' | 'creator' | 'scheduling' | 'compare' | 'bankers' | 'memory' | 'utilization';

// Default verification sample tasks from user prompt:
// T1: burst 2, priority 3
// T2: burst 4, priority 2
// T3: burst 1, priority 1
export const VERIFICATION_SAMPLE_TASKS: Task[] = [
  { id: 1, burst: 2, priority: 3 },
  { id: 2, burst: 4, priority: 2 },
  { id: 3, burst: 1, priority: 1 },
];

export const EXTENDED_SAMPLE_TASKS: Task[] = [
  { id: 1, burst: 5, priority: 3 },
  { id: 2, burst: 3, priority: 1 },
  { id: 3, burst: 8, priority: 4 },
  { id: 4, burst: 2, priority: 2 },
  { id: 5, burst: 6, priority: 5 },
];

interface OSContextType {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  quantum: number;
  setQuantum: (q: number) => void;
  toasts: ToastMessage[];
  addToast: (message: string, type?: ToastMessage['type'], title?: string) => void;
  removeToast: (id: string) => void;
  // Banker's state
  bankerState: BankerState;
  setBankerState: React.Dispatch<React.SetStateAction<BankerState>>;
  resetBankerToSample: () => void;
  // Memory state
  memoryBlocks: number[];
  setMemoryBlocks: (b: number[]) => void;
  memoryProcesses: number[];
  setMemoryProcesses: (p: number[]) => void;
  loadMemorySample: (sampleNum: 1 | 2) => void;
  // Global Actions
  resetAll: () => void;
  exportJSON: () => void;
  exportCSV: () => void;
}

const OSContext = createContext<OSContextType | undefined>(undefined);

function initBankerState(): BankerState {
  const need = calculateNeedMatrix(SAMPLE_BANKERS_DATA.max, SAMPLE_BANKERS_DATA.allocation);
  const safety = checkBankersSafety(
    SAMPLE_BANKERS_DATA.n,
    SAMPLE_BANKERS_DATA.m,
    SAMPLE_BANKERS_DATA.available,
    SAMPLE_BANKERS_DATA.allocation,
    need
  );

  return {
    n: SAMPLE_BANKERS_DATA.n,
    m: SAMPLE_BANKERS_DATA.m,
    allocation: SAMPLE_BANKERS_DATA.allocation.map((r) => [...r]),
    max: SAMPLE_BANKERS_DATA.max.map((r) => [...r]),
    need,
    available: [...SAMPLE_BANKERS_DATA.available],
    isSafe: safety.isSafe,
    safeSequence: safety.safeSequence,
  };
}

export const OSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(VERIFICATION_SAMPLE_TASKS);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [quantum, setQuantum] = useState<number>(2);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [bankerState, setBankerState] = useState<BankerState>(initBankerState);
  const [memoryBlocks, setMemoryBlocks] = useState<number[]>([...SAMPLE_MEMORY_DATA_1.blocks]);
  const [memoryProcesses, setMemoryProcesses] = useState<number[]>([...SAMPLE_MEMORY_DATA_1.processes]);

  const addToast = (message: string, type: ToastMessage['type'] = 'info', title?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const resetBankerToSample = () => {
    setBankerState(initBankerState());
    addToast("Banker's state reset to standard 5-process 3-resource sample data.", 'success');
  };

  const loadMemorySample = (sampleNum: 1 | 2) => {
    if (sampleNum === 1) {
      setMemoryBlocks([100, 500, 200, 300, 600]);
      setMemoryProcesses([212, 417, 112, 426]);
      addToast('Loaded default C++ memory dataset (5 blocks, 4 processes).', 'info');
    } else {
      setMemoryBlocks([100, 200, 300, 400, 500]);
      setMemoryProcesses([150, 220, 300, 50]);
      addToast('Loaded verification memory dataset (Blocks: 100-500, Procs: 150, 220, 300, 50).', 'info');
    }
  };

  const resetAll = () => {
    setTasks(VERIFICATION_SAMPLE_TASKS);
    setQuantum(2);
    setBankerState(initBankerState());
    setMemoryBlocks([...SAMPLE_MEMORY_DATA_1.blocks]);
    setMemoryProcesses([...SAMPLE_MEMORY_DATA_1.processes]);
    addToast('All modules reset to initial baseline state.', 'success');
  };

  const exportJSON = () => {
    const data = {
      project: 'Multithreaded Task Manager – OS Mini Project',
      exportedAt: new Date().toISOString(),
      tasks,
      quantum,
      bankers: {
        allocation: bankerState.allocation,
        max: bankerState.max,
        need: bankerState.need,
        available: bankerState.available,
        isSafe: bankerState.isSafe,
        safeSequence: bankerState.safeSequence,
      },
      memory: {
        blocks: memoryBlocks,
        processes: memoryProcesses,
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `os-multithreaded-task-manager-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Project configuration exported to JSON file.', 'success');
  };

  const exportCSV = () => {
    let csv = 'Module,Parameter,Value\n';
    tasks.forEach((t) => {
      csv += `Tasks,T${t.id},Burst: ${t.burst} | Priority: ${t.priority}\n`;
    });
    csv += `Scheduling,Round Robin Quantum,${quantum}\n`;
    csv += `Bankers,Processes,${bankerState.n}\n`;
    csv += `Bankers,Resources,${bankerState.m}\n`;
    csv += `Bankers,Safe State,${bankerState.isSafe ? 'YES' : 'NO'}\n`;
    csv += `Bankers,Safe Sequence,"${bankerState.safeSequence.map((p) => `P${p}`).join(' -> ')}"\n`;
    csv += `Memory,Blocks,"${memoryBlocks.join(', ')}"\n`;
    csv += `Memory,Processes,"${memoryProcesses.join(', ')}"\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `os-multithreaded-task-manager-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Project summary exported to CSV file.', 'success');
  };

  return (
    <OSContext.Provider
      value={{
        tasks,
        setTasks,
        activeTab,
        setActiveTab,
        quantum,
        setQuantum,
        toasts,
        addToast,
        removeToast,
        bankerState,
        setBankerState,
        resetBankerToSample,
        memoryBlocks,
        setMemoryBlocks,
        memoryProcesses,
        setMemoryProcesses,
        loadMemorySample,
        resetAll,
        exportJSON,
        exportCSV,
      }}
    >
      {children}
    </OSContext.Provider>
  );
};

export const useOS = (): OSContextType => {
  const context = useContext(OSContext);
  if (!context) {
    throw new Error('useOS must be used within an OSProvider');
  }
  return context;
};
