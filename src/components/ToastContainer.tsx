import React from 'react';
import { useOS } from '../context/OSContext';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useOS();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        let icon = <Info className="w-5 h-5 text-sky-400 shrink-0" />;
        let borderColor = 'border-sky-500/30';
        let bgGradient = 'bg-slate-900/95';

        if (toast.type === 'success') {
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
          borderColor = 'border-emerald-500/30';
        } else if (toast.type === 'error') {
          icon = <XCircle className="w-5 h-5 text-rose-400 shrink-0" />;
          borderColor = 'border-rose-500/30';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
          borderColor = 'border-amber-500/30';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border ${borderColor} ${bgGradient} backdrop-blur-md shadow-xl text-slate-200 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              {toast.title && <h5 className="text-sm font-semibold text-white mb-0.5">{toast.title}</h5>}
              <p className="text-xs text-slate-300 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
