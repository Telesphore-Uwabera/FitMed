"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

export default function ThemeToggle({
  variant = "nav",
  className,
}: {
  variant?: "nav" | "hero" | "drawer" | "icon";
  className?: string;
}) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      suppressHydrationWarning
      onClick={toggleTheme}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0",
        variant === "hero" &&
          "px-3 py-2 text-white/85 hover:text-white hover:bg-white/12 border border-white/20",
        variant === "nav" &&
          "px-3 py-2 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600",
        variant === "drawer" &&
          "w-full py-3 text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-600",
        variant === "icon" &&
          "w-9 h-9 p-0",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? (
        <Sun className="w-3.5 h-3.5 text-amber-400" />
      ) : (
        <Moon className={cn(
          "w-3.5 h-3.5",
          variant === "hero" && "text-white",
          variant === "icon" && "text-current",
          variant !== "hero" && variant !== "icon" && "text-[#0B2D5C]"
        )} />
      )}
      {variant !== "icon" && <span>{isDark ? "Light" : "Dark"}</span>}
    </button>
  );
}
