"use client";

import { createContext, useCallback, useContext, useRef, useState, ReactNode } from "react";
import ConfirmModal from "@/components/ConfirmModal";

type Variant = "danger" | "warning" | "info" | "success";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
}

export interface PromptOptions extends ConfirmOptions {
  defaultValue?: string;
  placeholder?: string;
  inputLabel?: string;
  richText?: boolean;
}

interface DialogState extends PromptOptions {
  showInput: boolean;
}

interface DialogContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const resolverRef = useRef<((value: boolean | string | null) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = (value) => resolve(Boolean(value));
      setDialog({ ...options, showInput: false });
    });
  }, []);

  const prompt = useCallback((options: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      resolverRef.current = (value) => resolve(typeof value === "string" ? value : null);
      setDialog({ ...options, showInput: true });
    });
  }, []);

  const handleConfirm = (value?: string) => {
    const resolve = resolverRef.current;
    const showInput = dialog?.showInput;
    resolverRef.current = null;
    setDialog(null);
    window.setTimeout(() => {
      if (showInput) {
        const text = String(value || "");
        const empty = !text.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").trim();
        resolve?.(empty ? null : text);
      } else resolve?.(true);
    }, 40);
  };

  const handleCancel = () => {
    const resolve = resolverRef.current;
    const showInput = dialog?.showInput;
    resolverRef.current = null;
    setDialog(null);
    window.setTimeout(() => {
      resolve?.(showInput ? null : false);
    }, 40);
  };

  return (
    <DialogContext.Provider value={{ confirm, prompt }}>
      {children}
      <ConfirmModal
        isOpen={!!dialog}
        title={dialog?.title || ""}
        message={dialog?.message || ""}
        confirmLabel={dialog?.confirmLabel}
        cancelLabel={dialog?.cancelLabel}
        variant={dialog?.variant}
        showInput={dialog?.showInput}
        inputLabel={dialog?.inputLabel}
        inputPlaceholder={dialog?.placeholder}
        defaultValue={dialog?.defaultValue}
        richText={dialog?.richText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </DialogContext.Provider>
  );
}

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useDialog must be used inside <DialogProvider>");
  return ctx;
}
