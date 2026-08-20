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
}

export default function BrandSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Select an option...",
  className = "",
}: BrandSelectProps) {
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
        <label className="block text-xs font-bold uppercase tracking-wider text-[#0B2D5C]">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-3.5 rounded-2xl border bg-white text-left font-semibold text-sm flex items-center justify-between transition-all shadow-sm ${
          isOpen
            ? "border-[#12B8B0] ring-2 ring-[#12B8B0]/20 shadow-md"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <span className={selectedOption ? "text-[#0B2D5C] font-bold" : "text-slate-400"}>
          {selectedOption ? selectedOption.label || selectedOption.value : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#12B8B0] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Brand Styled Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-2xl border-2 border-[#0B2D5C]/10 shadow-2xl overflow-hidden animate-in fade-in duration-150 max-h-64 overflow-y-auto">
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
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                    isSelected
                      ? "bg-[#0B2D5C] text-white font-extrabold shadow-sm"
                      : "text-slate-700 hover:bg-[#edf6f6] hover:text-[#0B2D5C]"
                  }`}
                >
                  <div>
                    <div>{opt.label || opt.value}</div>
                    {opt.desc && (
                      <div className={`text-[10px] ${isSelected ? "text-teal-200" : "text-slate-400"}`}>
                        {opt.desc}
                      </div>
                    )}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#12B8B0] flex-shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
