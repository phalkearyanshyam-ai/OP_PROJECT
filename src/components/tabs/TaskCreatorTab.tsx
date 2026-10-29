import React, { useState } from 'react';
import { useOS, VERIFICATION_SAMPLE_TASKS, EXTENDED_SAMPLE_TASKS } from '../../context/OSContext';
import { Task } from '../../types/os';
import { getTaskColor } from '../../utils/colors';
import {
  Plus,
  Trash2,
  Dices,
  RotateCcw,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export const TaskCreatorTab: React.FC = () => {
  const { tasks, setTasks, addToast, setActiveTab } = useOS();

  // Generator states
  const [numTasksInput, setNumTasksInput] = useState<number>(5);
  const [generationMode, setGenerationMode] = useState<'manual' | 'random'>('random');

  // New task form state
  const [newBurst, setNewBurst] = useState<string>('3');
  const [newPriority, setNewPriority] = useState<string>('2');

  const totalBurst = tasks.reduce((sum, t) => sum + t.burst, 0);
  const avgBurst = tasks.length > 0 ? (totalBurst / tasks.length).toFixed(1) : '0';

  const handleAddTask = () => {
    const burstVal = parseInt(newBurst, 10);
    const priorityVal = parseInt(newPriority, 10);

    if (isNaN(burstVal) || burstVal < 1) {
      addToast('Burst time must be an integer >= 1.', 'error', 'Invalid Input');
      return;
    }
    if (isNaN(priorityVal) || priorityVal < 1) {
      addToast('Priority must be an integer >= 1 (1 = highest).', 'error', 'Invalid Input');
      return;
    }

    const nextId = tasks.length > 0 ? Math.max(...tasks.map((t) => t.id)) + 1 : 1;
    const newTask: Task = {
      id: nextId,
      burst: burstVal,
      priority: priorityVal,
    };

    setTasks([...tasks, newTask]);
    addToast(`Added Task T${newTask.id} (Burst: ${newTask.burst}, Priority: ${newTask.priority})`, 'success');
  };

  const handleDeleteTask = (id: number) => {
    setTasks(tasks.filter((t) => t.id !== id));
    addToast(`Task T${id} removed.`, 'info');
  };

  const handleUpdateTask = (id: number, field: 'burst' | 'priority', valueStr: string) => {
    const val = parseInt(valueStr, 10);
    if (isNaN(val) || val < 1) return;

    setTasks(
      tasks.map((t) => {
        if (t.id === id) {
          return { ...t, [field]: val };
        }
        return t;
      })
    );
  };

  const handleBatchGenerate = () => {
    const count = Math.max(1, Math.min(20, numTasksInput));

    if (generationMode === 'random') {
      // C++ logic: burst = rand() % 8 + 2 (range 2..9), priority = rand() % 5 + 1 (range 1..5)
      const generated: Task[] = [];
      for (let i = 1; i <= count; i++) {
        const burst = Math.floor(Math.random() * 8) + 2;
        const priority = Math.floor(Math.random() * 5) + 1;
        generated.push({ id: i, burst, priority });
      }
      setTasks(generated);
      addToast(`Generated ${count} random tasks (Burst: 2–9, Priority: 1–5).`, 'success');
    } else {
      // Manual template of count tasks
      const generated: Task[] = [];
      for (let i = 1; i <= count; i++) {
        generated.push({ id: i, burst: 3, priority: i <= 3 ? i : 3 });
      }
      setTasks(generated);
      addToast(`Created template table with ${count} tasks for manual editing.`, 'info');
    }
  };

  const handleClearAll = () => {
    setTasks([]);
    addToast('Task list cleared.', 'warning');
  };

  const handleLoadVerificationSample = () => {
    setTasks(VERIFICATION_SAMPLE_TASKS);
    addToast('Loaded verification set: T1(2,3), T2(4,2), T3(1,1)', 'success', 'Verification Set Loaded');
  };

  const handleLoadExtendedSample = () => {
    setTasks(EXTENDED_SAMPLE_TASKS);
    addToast('Loaded extended 5-task benchmark set.', 'success');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Banner / Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">1. Task Creator</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Create and edit processes with burst time and priority (1 = highest priority).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadVerificationSample}
            className="px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-950/40 border border-indigo-500/30 hover:bg-indigo-900/50 rounded-lg transition-colors flex items-center gap-1.5"
            title="Load T1(2,3), T2(4,2), T3(1,1)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Verification Sample</span>
          </button>
          <button
            onClick={handleLoadExtendedSample}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 border border-slate-700 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Load 5-Task Sample
          </button>
          <button
            onClick={handleClearAll}
            className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-slate-800 rounded-lg transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Generator Configuration Deck */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Batch Generator */}
        <div className="md:col-span-2 border border-slate-800 bg-slate-900/40 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Batch Task Generator (Option 1 in C++)
            </span>
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
              <button
                onClick={() => setGenerationMode('random')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  generationMode === 'random'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Random (2-9, 1-5)
              </button>
              <button
                onClick={() => setGenerationMode('manual')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  generationMode === 'manual'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Manual Template
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="num-tasks" className="text-xs text-slate-400">
                Number of tasks:
              </label>
              <input
                id="num-tasks"
                type="number"
                min="1"
                max="20"
                value={numTasksInput}
                onChange={(e) => setNumTasksInput(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-20 px-3 py-1.5 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleBatchGenerate}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
            >
              <Dices className="w-3.5 h-3.5" />
              <span>Generate Tasks</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-500">
            Random mode generates burst times between 2 and 9 and priorities from 1 to 5, exactly like the C++ source code.
          </p>
        </div>

        {/* Quick Metrics */}
        <div className="border border-slate-800 bg-slate-900/40 rounded-xl p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Current Task Metrics
          </span>

          <div className="grid grid-cols-3 gap-2 my-2 text-center">
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="text-xs text-slate-500">Count</div>
              <div className="text-lg font-bold font-mono text-white mt-0.5">{tasks.length}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="text-xs text-slate-500">Total Burst</div>
              <div className="text-lg font-bold font-mono text-indigo-400 mt-0.5">{totalBurst}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="text-xs text-slate-500">Avg Burst</div>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">{avgBurst}</div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('scheduling')}
            disabled={tasks.length === 0}
            className={`w-full py-2 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
              tasks.length > 0
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30'
                : 'bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed'
            }`}
          >
            <span>Proceed to Scheduling</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inline Single Task Adder */}
      <div className="border border-slate-800 bg-slate-900/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-300">Add Single Task</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Burst:</label>
            <input
              type="number"
              min="1"
              max="99"
              value={newBurst}
              onChange={(e) => setNewBurst(e.target.value)}
              className="w-16 px-2.5 py-1 text-xs font-mono bg-slate-950 border border-slate-800 rounded-md text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">Priority (1=High):</label>
            <input
              type="number"
              min="1"
              max="99"
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="w-16 px-2.5 py-1 text-xs font-mono bg-slate-950 border border-slate-800 rounded-md text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            onClick={handleAddTask}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white border border-slate-700 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Row</span>
          </button>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Active Task Set (Shared Across All Tabs)
          </span>
          <span className="text-xs text-slate-500">All tasks arrive at time 0</span>
        </div>

        {tasks.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400 font-medium">No tasks defined yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click &quot;Load Verification Sample&quot; or use the generator above to populate tasks for scheduling simulation.
            </p>
            <button
              onClick={handleLoadVerificationSample}
              className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow transition-colors"
            >
              Load Verification Sample (3 Tasks)
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                  <th className="py-3 px-5 font-semibold">Task ID</th>
                  <th className="py-3 px-5 font-semibold">Burst Time (CPU Units)</th>
                  <th className="py-3 px-5 font-semibold">Priority (1 = Highest)</th>
                  <th className="py-3 px-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {tasks.map((task) => {
                  const color = getTaskColor(task.id);
                  return (
                    <tr key={task.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="font-bold text-white">T{task.id}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={task.burst}
                          onChange={(e) => handleUpdateTask(task.id, 'burst', e.target.value)}
                          className="w-24 px-2 py-1 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="py-3 px-5">
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={task.priority}
                          onChange={(e) => handleUpdateTask(task.id, 'priority', e.target.value)}
                          className="w-24 px-2 py-1 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </td>
                      <td className="py-3 px-5 text-right font-sans">
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title={`Delete Task T${task.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
