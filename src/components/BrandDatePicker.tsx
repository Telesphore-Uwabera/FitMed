"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import BrandSelect from "@/components/BrandSelect";

interface BrandDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Birth dates jump to past years and cannot be in the future. */
  preset?: "any" | "birth" | "future";
  variant?: "light" | "dark";
  disabled?: boolean;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const pad = (value: number) => String(value).padStart(2, "0");

function parseIsoDate(value?: string) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIso(year: number, monthIndex: number, day: number) {
  const last = new Date(year, monthIndex + 1, 0).getDate();
  return `${year}-${pad(monthIndex + 1)}-${pad(Math.min(day, last))}`;
}

function todayIso() {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth(), now.getDate());
}

export default function BrandDatePicker({
  value,
  onChange,
  placeholder = "Select date",
  className = "",
  preset = "any",
  variant = "light",
  disabled = false,
}: BrandDatePickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const dark = variant === "dark";
  const now = new Date();
  const currentYear = now.getFullYear();
  const minYear = preset === "future" ? currentYear : currentYear - 110;
  const maxYear = preset === "birth" ? currentYear : currentYear + 20;

  const selectedDate = parseIsoDate(value);
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(
    selectedDate?.getFullYear() || (preset === "birth" ? currentYear - 25 : currentYear)
  );
  const [viewMonth, setViewMonth] = useState(selectedDate?.getMonth() ?? now.getMonth());

  useEffect(() => {
    if (!selectedDate) return;
    setViewYear(selectedDate.getFullYear());
    setViewMonth(selectedDate.getMonth());
  }, [value]);

  useEffect(() => {
    const closePicker = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", closePicker);
    return () => document.removeEventListener("mousedown", closePicker);
  }, []);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Monday-first calendar days layout
  const calendarDays = useMemo(() => {
    const rawFirstDay = new Date(viewYear, viewMonth, 1).getDay();
    // Convert Sunday=0 to Monday=0 (Monday=0, Tuesday=1, ..., Sunday=6)
    const firstDayMonday = (rawFirstDay + 6) % 7;
    return [...Array(firstDayMonday).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  }, [viewYear, viewMonth, daysInMonth]);

  const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, index) => String(maxYear - index));
  const dayOptions = Array.from({ length: daysInMonth }, (_, index) => String(index + 1));
  const selectedDay =
    selectedDate && selectedDate.getMonth() === viewMonth && selectedDate.getFullYear() === viewYear
      ? String(selectedDate.getDate())
      : "";

  const applyDate = (year: number, monthIndex: number, day: number) => {
    const iso = toIso(year, monthIndex, day);
    if (preset === "birth" && iso > todayIso()) return;
    if (preset === "future" && iso < todayIso()) return;
    onChange(iso);
  };

  const formattedValue = selectedDate
    ? selectedDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : placeholder;

  const isToday = (day: number) => {
    return (
      day === now.getDate() &&
      viewMonth === now.getMonth() &&
      viewYear === currentYear
    );
  };

  return (
    <div ref={pickerRef} className={`relative ${className}`}>
      {/* Trigger Button styled with FitMed Brand Palette */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((open) => !open)}
        className={`w-full text-left flex items-center justify-between transition-all ${
          dark
            ? "px-3 py-2.5 rounded-xl text-xs font-semibold"
            : "px-3.5 py-2.5 rounded-xl text-xs font-semibold shadow-sm"
        } ${
          dark
            ? isOpen
              ? "bg-[#0B2D5C] border-2 border-[#12B8B0] ring-2 ring-[#12B8B0]/30 text-white"
              : "bg-white/10 border border-white/15 text-white hover:border-[#12B8B0]"
            : isOpen
              ? "bg-white border-2 border-[#12B8B0] ring-2 ring-[#12B8B0]/20 text-[#0B2D5C] shadow-md"
              : "bg-white border border-slate-200 hover:border-slate-300 text-slate-800"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={
            selectedDate
              ? dark
                ? "text-white font-bold"
                : "text-[#0B2D5C] font-bold"
              : dark
                ? "text-slate-300"
                : "text-slate-400"
          }
        >
          {formattedValue}
        </span>
        <CalendarIcon className="w-4 h-4 text-[#12B8B0] shrink-0" />
      </button>

      {/* Brand Calendar Popover */}
      {isOpen && (
        <div
          className={`absolute z-[99] mt-2 left-0 w-[20.5rem] rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 ${
            dark
              ? "bg-[#0B2D5C] border-2 border-[#12B8B0]/40 text-white shadow-[#0B2D5C]/50"
              : "bg-white border-2 border-[#0B2D5C]/10 text-slate-800 shadow-xl"
          }`}
        >
          {/* Fast Quick-Jump Dropdowns */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <BrandSelect
              size="compact"
              variant={dark ? "dark" : "light"}
              placeholder="Day"
              value={selectedDay}
              onChange={(day) => {
                applyDate(viewYear, viewMonth, Number(day));
                setIsOpen(false);
              }}
              options={dayOptions}
            />
            <BrandSelect
              size="compact"
              variant={dark ? "dark" : "light"}
              placeholder="Month"
              value={String(viewMonth)}
              onChange={(month) => {
                const nextMonth = Number(month);
                setViewMonth(nextMonth);
                if (selectedDate) applyDate(viewYear, nextMonth, selectedDate.getDate());
              }}
              options={MONTHS.map((label, index) => ({ value: String(index), label: label.slice(0, 3) }))}
            />
            <BrandSelect
              size="compact"
              variant={dark ? "dark" : "light"}
              placeholder="Year"
              value={String(viewYear)}
              onChange={(year) => {
                const nextYear = Number(year);
                setViewYear(nextYear);
                if (selectedDate) applyDate(nextYear, viewMonth, selectedDate.getDate());
              }}
              options={yearOptions}
            />
          </div>

          {/* Month Stepper Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 0) {
                  setViewMonth(11);
                  setViewYear((year) => Math.max(minYear, year - 1));
                } else {
                  setViewMonth((month) => month - 1);
                }
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                dark
                  ? "text-white hover:bg-white/10 hover:text-[#12B8B0]"
                  : "text-[#0B2D5C] hover:bg-[#edf6f6]"
              }`}
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span
              className={`text-xs font-black tracking-wide ${
                dark ? "text-white" : "text-[#0B2D5C]"
              }`}
            >
              {MONTHS[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={() => {
                if (viewMonth === 11) {
                  setViewMonth(0);
                  setViewYear((year) => Math.min(maxYear, year + 1));
                } else {
                  setViewMonth((month) => month + 1);
                }
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                dark
                  ? "text-white hover:bg-white/10 hover:text-[#12B8B0]"
                  : "text-[#0B2D5C] hover:bg-[#edf6f6]"
              }`}
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Headers (Monday First) */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold uppercase tracking-wider mb-1.5">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
              <span
                key={day}
                className={dark ? "text-[#12B8B0]/80" : "text-[#0B2D5C]/60"}
              >
                {day}
              </span>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (!day) return <span key={index} className="h-8" />;
              const iso = toIso(viewYear, viewMonth, day);
              const isSelected = iso === value;
              const isCurrentDay = isToday(day);
              const blocked =
                (preset === "birth" && iso > todayIso()) ||
                (preset === "future" && iso < todayIso());

              return (
                <button
                  key={index}
                  type="button"
                  disabled={blocked}
                  onClick={() => {
                    applyDate(viewYear, viewMonth, day);
                    setIsOpen(false);
                  }}
                  className={`h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                    blocked
                      ? dark
                        ? "text-white/20 cursor-not-allowed"
                        : "text-slate-300 cursor-not-allowed"
                      : isSelected
                        ? dark
                          ? "bg-[#12B8B0] text-[#0B2D5C] font-black shadow-md shadow-[#12B8B0]/30 scale-105"
                          : "bg-[#0B2D5C] text-white font-black shadow-md scale-105"
                        : isCurrentDay
                          ? dark
                            ? "border border-[#12B8B0] text-[#12B8B0] hover:bg-white/10"
                            : "border border-[#12B8B0] text-[#12B8B0] hover:bg-[#edf6f6]"
                          : dark
                            ? "text-white hover:bg-white/15 hover:text-[#12B8B0]"
                            : "text-slate-700 hover:bg-[#edf6f6] hover:text-[#0B2D5C]"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick Footer Controls: Clear & Today */}
          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className={`font-bold transition-colors ${
                dark ? "text-slate-400 hover:text-rose-400" : "text-slate-500 hover:text-rose-600"
              }`}
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => {
                const today = todayIso();
                if (preset === "future" || preset === "any" || (preset === "birth" && today <= todayIso())) {
                  onChange(today);
                  setViewYear(now.getFullYear());
                  setViewMonth(now.getMonth());
                  setIsOpen(false);
                }
              }}
              className="font-extrabold text-[#12B8B0] hover:underline"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

