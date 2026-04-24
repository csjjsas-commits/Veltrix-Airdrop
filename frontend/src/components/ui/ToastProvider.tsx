import React, { createContext, useContext, useMemo, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description: string;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts(current => [...current, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts(current => current.filter(item => item.id !== id));
    }, 4500);
  };

  const value = useMemo(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-5 z-50 mx-auto flex max-w-7xl flex-col items-end gap-3 px-6 sm:px-8">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full max-w-sm rounded-3xl border px-4 py-4 shadow-2xl shadow-slate-950/30 backdrop-blur-xl transition duration-300 ${
              toast.type === 'success'
                ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100'
                : toast.type === 'error'
                ? 'border-rose-400/20 bg-rose-500/10 text-rose-100'
                : 'border-slate-500/20 bg-slate-900/90 text-slate-100'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em]">
                  {toast.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{toast.description}</p>
              </div>
              <button
                type="button"
                aria-label="Cerrar notificación"
                className="text-slate-400 transition hover:text-white"
                onClick={() => setToasts(current => current.filter(item => item.id !== toast.id))}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
