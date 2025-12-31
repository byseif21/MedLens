import { useCallback, useMemo, useRef, useState } from 'react';
import { NotificationsContext } from '../hooks/useNotifications';

const baseToastClasses =
  'w-full max-w-sm rounded-xl border px-4 py-3 shadow-medical-lg animate-slide-down pointer-events-auto';

const typeStyles = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  error: 'bg-red-50 border-red-200 text-red-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
  info: 'bg-sky-50 border-sky-200 text-sky-900',
};

const typeIcon = {
  success: (
    <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 01.006 1.414l-7.5 7.57a1 1 0 01-1.424 0l-3.5-3.535a1 1 0 011.424-1.414l2.788 2.815 6.788-6.85a1 1 0 011.418 0z"
        clipRule="evenodd"
      />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm2.707-10.707a1 1 0 00-1.414-1.414L10 7.172 8.707 5.879A1 1 0 007.293 7.293L8.586 8.586 7.293 9.879a1 1 0 101.414 1.414L10 10l1.293 1.293a1 1 0 001.414-1.414L11.414 8.586l1.293-1.293z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.59c.75 1.334-.214 3.01-1.742 3.01H3.48c-1.528 0-2.492-1.676-1.742-3.01l6.52-11.59zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V7a1 1 0 112 0v4a1 1 0 01-1 1z"
        clipRule="evenodd"
      />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5 text-sky-600" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-9-1a1 1 0 112 0v5a1 1 0 11-2 0V9zm1-4a1.25 1.25 0 100 2.5A1.25 1.25 0 0010 5z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

const Toast = ({ toast, onDismiss }) => {
  const variant = typeStyles[toast.type] || typeStyles.info;

  return (
    <div className={`${baseToastClasses} ${variant}`} role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        <div className="pt-0.5">{typeIcon[toast.type] || typeIcon.info}</div>
        <div className="flex-1 min-w-0">
          {toast.title ? <div className="font-semibold leading-5">{toast.title}</div> : null}
          {toast.message ? (
            <div className={`text-sm ${toast.title ? 'mt-0.5' : ''}`}>{toast.message}</div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 rounded-md px-2 py-1 text-sm hover:bg-black/5"
          aria-label="Dismiss notification"
        >
          <span aria-hidden="true">×</span>
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
