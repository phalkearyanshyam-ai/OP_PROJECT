/**
 * @license
 * Multithreaded Task Manager – OS Mini Project
 * Main Application Component
 */

import React from 'react';
import { OSProvider, useOS } from './context/OSContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/ToastContainer';
import { OverviewTab } from './components/tabs/OverviewTab';
import { TaskCreatorTab } from './components/tabs/TaskCreatorTab';
import { SchedulingTab } from './components/tabs/SchedulingTab';
import { CompareTab } from './components/tabs/CompareTab';
import { BankersTab } from './components/tabs/BankersTab';
import { MemoryTab } from './components/tabs/MemoryTab';
import { UtilizationTab } from './components/tabs/UtilizationTab';

const AppContent: React.FC = () => {
  const { activeTab } = useOS();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-8">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'creator' && <TaskCreatorTab />}
          {activeTab === 'scheduling' && <SchedulingTab />}
          {activeTab === 'compare' && <CompareTab />}
          {activeTab === 'bankers' && <BankersTab />}
          {activeTab === 'memory' && <MemoryTab />}
          {activeTab === 'utilization' && <UtilizationTab />}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <OSProvider>
      <AppContent />
    </OSProvider>
  );
}
