"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface Option {
  value: string;
  label?: string;
  desc?: string;
}

interface BrandSelectProps {
  label?: string;
  value: string;
  options: (string | Option)[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: "default" | "compact";
  variant?: "light" | "dark";
}

export default function BrandSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Select an option...",
  className = "",
  size = "default",
  variant = "light",
}: BrandSelectProps) {
  const compact = size === "compact";
  const dark = variant === "dark";
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const normalizedOptions: Option[] = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find((o) => o.value === value);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative space-y-1.5 ${className}`} ref={dropdownRef}>
      {label && (
        <label
          className={`block text-xs font-bold uppercase tracking-wider ${
            dark ? "text-[10px] font-extrabold text-slate-300" : "text-[#0B2D5C]"
          }`}
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full border text-left flex items-center justify-between transition-all ${
          compact
            ? "px-3 py-1.5 rounded-lg text-[11px] font-bold"
            : dark
            ? "px-3 py-2.5 rounded-xl text-xs font-semibold"
            : "p-3.5 rounded-2xl font-semibold text-sm shadow-sm"
        } ${
          dark
            ? isOpen
              ? "bg-[#0B2D5C] border-[#12B8B0] ring-2 ring-[#12B8B0]/30 text-white"
              : "bg-white/10 border-white/15 text-white hover:border-[#12B8B0]"
            : isOpen
              ? "bg-white border-[#12B8B0] ring-2 ring-[#12B8B0]/20 shadow-md"
              : "bg-white border-slate-200 hover:border-slate-300"
        }`}
      >
        <span className={selectedOption ? (dark ? "text-white font-bold" : "text-[#0B2D5C] font-bold") : dark ? "text-slate-300" : "text-slate-400"}>
          {selectedOption ? selectedOption.label || selectedOption.value : placeholder}
        </span>
        <ChevronDown
          className={`text-[#12B8B0] transition-transform duration-200 flex-shrink-0 ml-1 ${
            compact ? "w-3.5 h-3.5" : "w-4 h-4"
          } ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Brand Styled Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 left-0 right-0 mt-1.5 shadow-2xl overflow-hidden animate-in fade-in duration-150 max-h-64 overflow-y-auto ${
            compact ? "rounded-xl" : "rounded-2xl"
          } ${
            dark
              ? "bg-[#0B2D5C] border-2 border-[#12B8B0]/40"
              : "bg-white border-2 border-[#0B2D5C]/10"
          }`}
        >
          <div className="p-1.5 space-y-1">
            {normalizedOptions.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left rounded-xl font-semibold flex items-center justify-between transition-colors ${
                    compact ? "px-3 py-2 text-[11px]" : "px-3.5 py-2.5 text-xs"
                  } ${
                    dark
                      ? isSelected
                        ? "bg-[#12B8B0] text-[#0B2D5C] font-extrabold"
                        : "text-white hover:bg-white/10 hover:text-[#12B8B0]"
                      : isSelected
                        ? "bg-[#0B2D5C] text-white font-extrabold shadow-sm"
                        : "text-slate-700 hover:bg-[#edf6f6] hover:text-[#0B2D5C]"
                  }`}
                >
                  <div>
                    <div>{opt.label || opt.value}</div>
                    {opt.desc && (
                      <div className={`text-[10px] ${isSelected ? (dark ? "text-[#0B2D5C]/70" : "text-teal-200") : dark ? "text-slate-400" : "text-slate-400"}`}>
                        {opt.desc}
                      </div>
                    )}
                  </div>
                  {isSelected && <Check className={`w-4 h-4 flex-shrink-0 ml-2 ${dark ? "text-[#0B2D5C]" : "text-[#12B8B0]"}`} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
