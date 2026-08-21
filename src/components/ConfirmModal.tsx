"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Info, CheckCircle2, XCircle, X } from "lucide-react";
import RichTextEditor, { isVisuallyEmpty } from "@/components/RichTextEditor";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info" | "success";
  showInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  defaultValue?: string;
  richText?: boolean;
  onConfirm: (value?: string) => void;
  onCancel: () => void;
}

const variantConfig = {
  danger: {
    icon: XCircle,
    iconColor: "text-rose-500",
    iconBg: "bg-rose-100",
    confirmBtn: "bg-rose-600 hover:bg-rose-700 text-white",
    border: "border-rose-200",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-100",
    confirmBtn: "bg-amber-500 hover:bg-amber-600 text-white",
    border: "border-amber-200",
  },
  info: {
    icon: Info,
    iconColor: "text-[#12B8B0]",
    iconBg: "bg-teal-100",
    confirmBtn: "bg-[#0B2D5C] hover:bg-[#082247] text-white",
    border: "border-teal-200",
  },
  success: {
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-100",
    confirmBtn: "bg-emerald-600 hover:bg-emerald-700 text-white",
    border: "border-emerald-200",
  },
};

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "info",
  showInput = false,
  inputLabel,
  inputPlaceholder,
  defaultValue = "",
  richText = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [inputValue, setInputValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) setInputValue(defaultValue);
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const cfg = variantConfig[variant];
  const Icon = cfg.icon;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      <div
        className={`relative z-10 w-full bg-white dark:bg-[#10243f] rounded-3xl shadow-2xl border ${cfg.border} animate-in zoom-in-95 duration-200 ${
          richText ? "max-w-4xl" : "max-w-md"
        }`}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>

        <div className={`${richText ? "p-6 sm:p-8" : "p-8"} space-y-5`}>
          <div className={`${richText ? "w-11 h-11 rounded-xl" : "w-14 h-14 rounded-2xl"} ${cfg.iconBg} flex items-center justify-center`}>
            <Icon className={`${richText ? "w-5 h-5" : "w-7 h-7"} ${cfg.iconColor}`} />
          </div>

          <div className="space-y-2">
            <h3
              className="text-lg font-extrabold text-[#0B2D5C] dark:text-slate-100"
              style={{ fontFamily: "var(--font-primary)" }}
            >
              {title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-300 leading-relaxed whitespace-pre-line">{message}</p>
          </div>

          {showInput && (
            <div className="space-y-1.5">
              {inputLabel && (
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  {inputLabel}
                </label>
              )}
              {richText ? (
                <RichTextEditor defaultValue={defaultValue} onChange={setInputValue} minHeight={320} />
              ) : (
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={inputPlaceholder}
                  rows={6}
                  autoFocus
                  className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-[#0c1c33] text-sm text-slate-800 dark:text-slate-100 font-medium leading-relaxed focus:outline-none focus:border-[#12B8B0] resize-y min-h-[120px]"
                />
              )}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => onConfirm(showInput ? inputValue : undefined)}
              disabled={showInput && (richText ? isVisuallyEmpty(inputValue) : !inputValue.trim())}
              className={`flex-1 py-3 rounded-xl font-extrabold text-sm transition-colors shadow-sm active:scale-95 disabled:opacity-50 ${cfg.confirmBtn}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
