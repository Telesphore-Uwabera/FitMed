"use client";

import { useState, useEffect, createContext, useContext, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (options: Omit<Toast, "id">) => void;
  success: (title: string, message?: string, duration?: number) => void;
  error: (title: string, message?: string, duration?: number) => void;
  warning: (title: string, message?: string, duration?: number) => void;
  info: (title: string, message?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const duration = toast.duration ?? (toast.message && toast.message.length > 80 ? 9000 : 6500);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 280);
  }, [onRemove, toast.id]);

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dismiss, duration]);

  const configs = {
    success: {
      icon: CheckCircle2,
      bar: "bg-[#12B8B0]",
      iconColor: "text-[#12B8B0]",
      badge: "bg-[#12B8B0]/10 border-[#12B8B0]/20",
    },
    error: {
      icon: XCircle,
      bar: "bg-rose-500",
      iconColor: "text-rose-500",
      badge: "bg-rose-50 border-rose-200",
    },
    warning: {
      icon: AlertTriangle,
      bar: "bg-amber-400",
      iconColor: "text-amber-500",
      badge: "bg-amber-50 border-amber-200",
    },
    info: {
      icon: Info,
      bar: "bg-[#0B2D5C]",
      iconColor: "text-[#0B2D5C]",
      badge: "bg-[#0B2D5C]/5 border-[#0B2D5C]/10",
    },
  };

  const cfg = configs[toast.type];
  const Icon = cfg.icon;

  return (
    <div
      className={`relative flex items-start gap-3 p-4 pr-10 rounded-2xl bg-white dark:bg-[#10243f] border border-slate-200 dark:border-slate-600 w-[360px] sm:w-[420px] max-w-[calc(100vw-2rem)] overflow-hidden transition-all duration-300 ease-out ${
        exiting ? "opacity-0 translate-x-8" : "opacity-100 translate-x-0"
      }`}
      style={{ boxShadow: "0 12px 40px -8px rgba(11,45,92,0.28), 0 4px 12px -2px rgba(18,184,176,0.16)" }}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${cfg.bar}`} />

      <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border ${cfg.badge}`}>
        <Icon className={`w-5 h-5 ${cfg.iconColor}`} strokeWidth={2.5} />
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#12B8B0] mb-0.5">
          {toast.type === "success" ? "Completed" : toast.type === "error" ? "Failed" : toast.type === "warning" ? "Notice" : "Update"}
        </p>
        <p className="text-sm font-extrabold text-[#0B2D5C] dark:text-slate-100 leading-tight">
          {toast.title}
        </p>
        {toast.message && (
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
            {toast.message}
          </p>
        )}
      </div>

      <button
        onClick={dismiss}
        className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div
        className={`absolute bottom-0 left-0 h-0.5 ${cfg.bar} opacity-40`}
        style={{ animation: `shrink ${duration}ms linear forwards` }}
      />
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((options: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev.slice(-4), { ...options, id }]);
  }, []);

  const success = useCallback((title: string, message?: string, duration?: number) =>
    addToast({ type: "success", title, message, duration }), [addToast]);
  const error = useCallback((title: string, message?: string, duration?: number) =>
    addToast({ type: "error", title, message, duration }), [addToast]);
  const warning = useCallback((title: string, message?: string, duration?: number) =>
    addToast({ type: "warning", title, message, duration }), [addToast]);
  const info = useCallback((title: string, message?: string, duration?: number) =>
    addToast({ type: "info", title, message, duration }), [addToast]);

  const stack = (
    <div className="fixed top-4 right-4 z-[2147483646] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onRemove={removeToast} />
        </div>
      ))}
    </div>
  );

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, warning, info }}>
      {children}
      {mounted ? createPortal(stack, document.body) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
