import { useCallback, useMemo, useRef, useState } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { NotificationsContext } from '../hooks/useNotifications';

const baseToastClasses =
  'w-full max-w-sm rounded-xl border px-4 py-3 shadow-lg shadow-medical-primary/15 animate-slide-down pointer-events-auto';

const typeStyles = {
  success:
    'bg-white dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-300 shadow-emerald-100/50 dark:shadow-none',
  error:
    'bg-white dark:bg-red-950/40 border-red-200 dark:border-red-800/60 text-red-900 dark:text-red-300 shadow-red-100/50 dark:shadow-none',
  warning:
    'bg-white dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 shadow-amber-100/50 dark:shadow-none',
  info: 'bg-white dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60 text-sky-900 dark:text-sky-300 shadow-sky-100/50 dark:shadow-none',
};

const typeIcon = {
  success: <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
  error: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
  info: <Info className="h-5 w-5 text-sky-600 dark:text-sky-400" />,
};

const Toast = ({ toast, onDismiss }) => {
  const variant = typeStyles[toast.type] || typeStyles.info;

  return (
    <div
      className={`${baseToastClasses} ${variant} transition-all duration-300 backdrop-blur-md`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="pt-0.5">{typeIcon[toast.type] || typeIcon.info}</div>
        <div className="flex-1 min-w-0">
          {toast.title ? (
            <div className="font-bold leading-5 text-medical-dark dark:text-white">
              {toast.title}
            </div>
          ) : null}
          {toast.message ? (
            <div
              className={`text-sm font-medium ${toast.title ? 'mt-1 text-medical-gray-600 dark:text-medical-gray-300' : 'text-medical-dark dark:text-white'}`}
            >
              {toast.message}
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 rounded-md p-1.5 text-medical-gray-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-medical-dark dark:hover:text-white transition-all"
          aria-label="Dismiss notification"
        >
          <span className="text-xl leading-none" aria-hidden="true">
            ×
          </span>
        </button>
      </div>
    </div>
  );
};

export const NotificationsProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    ({ type = 'info', title, message, durationMs = 4500 } = {}) => {
      const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const toast = { id, type, title, message };

      setToasts((current) => [toast, ...current].slice(0, 4));

      if (durationMs > 0) {
        const timeout = setTimeout(() => dismiss(id), durationMs);
        timeoutsRef.current.set(id, timeout);
      }

      return id;
    },
    [dismiss]
  );

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </NotificationsContext.Provider>
  );
};
