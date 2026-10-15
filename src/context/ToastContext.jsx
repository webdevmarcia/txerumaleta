import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CircleAlert, CircleCheck, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const show = useCallback(
    (message, type = "success") => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t.slice(-2), { id, message, type }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (m) => show(m, "success"),
      error: (m) => show(m instanceof Error ? m.message : m, "error"),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 md:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="animate-fade-up pointer-events-auto flex max-w-md items-start gap-3 rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-lg"
          >
            {t.type === "error" ? (
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-coral-500" />
            ) : (
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-sun-400" />
            )}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="text-white/60 hover:text-white" aria-label="Fechar">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext);
}
