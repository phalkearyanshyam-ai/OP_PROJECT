export const TASK_COLORS: { [key: number]: { bg: string; border: string; text: string; hex: string } } = {
  1: { bg: 'bg-indigo-600', border: 'border-indigo-400', text: 'text-indigo-100', hex: '#4f46e5' },
  2: { bg: 'bg-emerald-600', border: 'border-emerald-400', text: 'text-emerald-100', hex: '#059669' },
  3: { bg: 'bg-amber-600', border: 'border-amber-400', text: 'text-amber-100', hex: '#d97706' },
  4: { bg: 'bg-rose-600', border: 'border-rose-400', text: 'text-rose-100', hex: '#e11d48' },
  5: { bg: 'bg-cyan-600', border: 'border-cyan-400', text: 'text-cyan-100', hex: '#0891b2' },
  6: { bg: 'bg-purple-600', border: 'border-purple-400', text: 'text-purple-100', hex: '#9333ea' },
  7: { bg: 'bg-teal-600', border: 'border-teal-400', text: 'text-teal-100', hex: '#0d9488' },
  8: { bg: 'bg-orange-600', border: 'border-orange-400', text: 'text-orange-100', hex: '#ea580c' },
  9: { bg: 'bg-blue-600', border: 'border-blue-400', text: 'text-blue-100', hex: '#2563eb' },
  10: { bg: 'bg-pink-600', border: 'border-pink-400', text: 'text-pink-100', hex: '#db2777' },
};

export function getTaskColor(taskId: number) {
  const index = ((Math.abs(taskId) - 1) % 10) + 1;
  return TASK_COLORS[index] || TASK_COLORS[1];
}

export const WORKER_COLORS = [
  { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', accent: '#3b82f6' },
  { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', accent: '#10b981' },
  { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', accent: '#a855f7' },
  { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', accent: '#f59e0b' },
  { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400', accent: '#ec4899' },
  { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', accent: '#06b6d4' },
  { bg: 'bg-lime-500/10', border: 'border-lime-500/30', text: 'text-lime-400', accent: '#84cc16' },
  { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', accent: '#f43f5e' },
];
