import React from 'react';
import { useOS, TabId } from '../context/OSContext';
import {
  BookOpen,
  ListPlus,
  Clock,
  BarChart3,
  ShieldAlert,
  HardDrive,
  Activity,
  CheckCircle,
} from 'lucide-react';

interface NavItem {
  id: TabId;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  category: 'Overview' | 'CO1: Scheduling & Multithreading' | 'CO2: Deadlock & Memory';
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, tasks } = useOS();

  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      sublabel: 'Architecture & OS Concepts',
      icon: <BookOpen className="w-4 h-4" />,
      category: 'Overview',
    },
    {
      id: 'creator',
      label: '1. Task Creator',
      sublabel: `${tasks.length} tasks ready`,
      icon: <ListPlus className="w-4 h-4" />,
      category: 'CO1: Scheduling & Multithreading',
    },
    {
      id: 'scheduling',
      label: '2. Scheduling & Threads',
      sublabel: 'Gantt chart & Worker pool',
      icon: <Clock className="w-4 h-4" />,
      category: 'CO1: Scheduling & Multithreading',
    },
    {
      id: 'compare',
      label: '3. Compare Algorithms',
      sublabel: 'FCFS / SJF / Priority / RR',
      icon: <BarChart3 className="w-4 h-4" />,
      category: 'CO1: Scheduling & Multithreading',
    },
    {
      id: 'bankers',
      label: '4. Deadlock Handling',
      sublabel: "Banker's Safety & Request",
      icon: <ShieldAlert className="w-4 h-4" />,
      category: 'CO2: Deadlock & Memory',
    },
    {
      id: 'memory',
      label: '5. Memory Allocation',
      sublabel: 'First / Best / Worst Fit',
      icon: <HardDrive className="w-4 h-4" />,
      category: 'CO2: Deadlock & Memory',
    },
    {
      id: 'utilization',
      label: '6. Resource Utilization',
      sublabel: '1–4 Worker thread benchmark',
      icon: <Activity className="w-4 h-4" />,
      category: 'CO1: Scheduling & Multithreading',
    },
  ];

  const categories = [
    'Overview',
    'CO1: Scheduling & Multithreading',
    'CO2: Deadlock & Memory',
  ] as const;

  return (
    <aside className="w-64 shrink-0 bg-slate-900/60 border-r border-slate-800 flex flex-col justify-between overflow-y-auto">
      <div className="p-4 space-y-6">
        {categories.map((cat) => {
          const items = navItems.filter((item) => item.category === cat);
          if (items.length === 0) return null;

          return (
            <div key={cat} className="space-y-1.5">
              <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {cat}
              </div>
              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                        isActive
                          ? 'bg-indigo-600/15 text-indigo-300 font-medium border border-indigo-500/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-md ${
                          isActive
                            ? 'bg-indigo-500/20 text-indigo-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium truncate">{item.label}</div>
                        <div className="text-[11px] text-slate-500 truncate">{item.sublabel}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* System Status info box */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 m-2 rounded-xl">
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium mb-1">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Real Browser Threading</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Web Workers execute slices asynchronously in real OS threads with producer-consumer queueing.
        </p>
      </div>
    </aside>
  );
};
