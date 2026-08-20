"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

interface BrandDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const pad = (value: number) => String(value).padStart(2, "0");

export default function BrandDatePicker({ value, onChange, placeholder = "Select date", className = "" }: BrandDatePickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const selectedDate = value ? new Date(`${value}T12:00:00`) : null;
  const [isOpen, setIsOpen] = useState(false);
  const [month, setMonth] = useState(selectedDate || new Date());

  useEffect(() => {
    const closePicker = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", closePicker);
    return () => document.removeEventListener("mousedown", closePicker);
  }, []);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  }, [month]);

  const chooseDay = (day: number) => {
    onChange(`${month.getFullYear()}-${pad(month.getMonth() + 1)}-${pad(day)}`);
    setIsOpen(false);
  };

  const formattedValue = selectedDate
    ? selectedDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : placeholder;

  return (
    <div ref={pickerRef} className={`relative ${className}`}>
      <button type="button" onClick={() => setIsOpen((open) => !open)} className={`w-full p-3 rounded-xl border bg-white text-left text-xs font-semibold flex items-center justify-between transition-all ${isOpen ? "border-[#12B8B0] ring-2 ring-[#12B8B0]/20" : "border-slate-200 hover:border-[#12B8B0]"}`}>
        <span className={selectedDate ? "text-[#0B2D5C]" : "text-slate-400"}>{formattedValue}</span>
        <Calendar className="w-4 h-4 text-[#12B8B0]" />
      </button>

      {isOpen && (
        <div className="absolute z-[70] mt-2 w-72 rounded-2xl border-2 border-[#0B2D5C]/10 bg-white p-3 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="p-1.5 rounded-lg text-[#0B2D5C] hover:bg-[#edf6f6]" aria-label="Previous month"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm font-extrabold text-[#0B2D5C]">{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="p-1.5 rounded-lg text-[#0B2D5C] hover:bg-[#edf6f6]" aria-label="Next month"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const dayValue = day ? `${month.getFullYear()}-${pad(month.getMonth() + 1)}-${pad(day)}` : "";
              const isSelected = dayValue === value;
              return day ? <button key={index} type="button" onClick={() => chooseDay(day)} className={`h-8 rounded-lg text-xs font-semibold transition-colors ${isSelected ? "bg-[#0B2D5C] text-white" : "text-slate-700 hover:bg-[#edf6f6] hover:text-[#0B2D5C]"}`}>{isSelected ? <Check className="w-3.5 h-3.5 mx-auto text-[#12B8B0]" /> : day}</button> : <span key={index} className="h-8" />;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
