"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import BrandSelect from "@/components/BrandSelect";

interface BrandDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Birth dates jump to past years and cannot be in the future. */
  preset?: "any" | "birth" | "future";
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
}: BrandDatePickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const minYear = preset === "future" ? now.getFullYear() : now.getFullYear() - 110;
  const maxYear = preset === "birth" ? now.getFullYear() : now.getFullYear() + 3;
  const selectedDate = parseIsoDate(value);
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selectedDate?.getFullYear() || (preset === "birth" ? now.getFullYear() - 25 : now.getFullYear()));
  const [viewMonth, setViewMonth] = useState(selectedDate?.getMonth() ?? now.getMonth());

  useEffect(() => {
    if (!selectedDate) return;
    setViewYear(selectedDate.getFullYear());
    setViewMonth(selectedDate.getMonth());
  }, [value]);

  useEffect(() => {
    const closePicker = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", closePicker);
    return () => document.removeEventListener("mousedown", closePicker);
  }, []);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    return [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  }, [viewYear, viewMonth, daysInMonth]);

  const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, index) => String(maxYear - index));
  const dayOptions = Array.from({ length: daysInMonth }, (_, index) => String(index + 1));
  const selectedDay = selectedDate && selectedDate.getMonth() === viewMonth && selectedDate.getFullYear() === viewYear
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

  return (
    <div ref={pickerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`w-full p-3 rounded-xl border bg-white text-left text-xs font-semibold flex items-center justify-between transition-all ${
          isOpen ? "border-[#12B8B0] ring-2 ring-[#12B8B0]/20" : "border-slate-200 hover:border-[#12B8B0]"
        }`}
      >
        <span className={selectedDate ? "text-[#0B2D5C]" : "text-slate-400"}>{formattedValue}</span>
        <Calendar className="w-4 h-4 text-[#12B8B0]" />
      </button>

      {isOpen && (
        <div className="absolute z-[80] mt-2 w-[20.5rem] rounded-2xl border-2 border-[#0B2D5C]/10 bg-white p-3 shadow-2xl">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <BrandSelect
              size="compact"
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

          <div className="flex items-center justify-between mb-2">
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
              className="p-1.5 rounded-lg text-[#0B2D5C] hover:bg-[#edf6f6]"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-extrabold text-[#0B2D5C]">
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
              className="p-1.5 rounded-lg text-[#0B2D5C] hover:bg-[#edf6f6]"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (!day) return <span key={index} className="h-8" />;
              const iso = toIso(viewYear, viewMonth, day);
              const isSelected = iso === value;
              const blocked =
                (preset === "birth" && iso > todayIso()) || (preset === "future" && iso < todayIso());
              return (
                <button
                  key={index}
                  type="button"
                  disabled={blocked}
                  onClick={() => {
                    applyDate(viewYear, viewMonth, day);
                    setIsOpen(false);
                  }}
                  className={`h-8 rounded-lg text-xs font-semibold transition-colors ${
                    blocked
                      ? "text-slate-300 cursor-not-allowed"
                      : isSelected
                        ? "bg-[#0B2D5C] text-white"
                        : "text-slate-700 hover:bg-[#edf6f6] hover:text-[#0B2D5C]"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          {preset === "birth" && (
            <p className="mt-2 text-[10px] text-slate-500">Pick year, month, then the day. Future dates are not allowed.</p>
          )}
        </div>
      )}
    </div>
  );
}
