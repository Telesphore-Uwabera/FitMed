"use client";

import BrandSelect from "@/components/BrandSelect";

interface BrandTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const pad = (value: number) => String(value).padStart(2, "0");
const hours = Array.from({ length: 24 }, (_, index) => ({ value: pad(index), label: pad(index) }));
const minutes = Array.from({ length: 12 }, (_, index) => ({ value: pad(index * 5), label: pad(index * 5) }));

function getDefaultTimeAhead() {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 15);
  const remainder = now.getMinutes() % 5;
  if (remainder !== 0) now.setMinutes(now.getMinutes() + (5 - remainder));
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export default function BrandTimePicker({ value, onChange, className = "" }: BrandTimePickerProps) {
  const fallback = getDefaultTimeAhead();
  const [hour = fallback.split(":")[0], minute = fallback.split(":")[1]] = String(value || fallback).split(":");
  const minuteValue = minutes.some((item) => item.value === minute.slice(0, 2)) ? minute.slice(0, 2) : "00";

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      <BrandSelect size="compact" placeholder="Hour" value={hour} onChange={(nextHour) => onChange(`${nextHour}:${minuteValue}`)} options={hours} />
      <BrandSelect size="compact" placeholder="Min" value={minuteValue} onChange={(nextMinute) => onChange(`${hour}:${nextMinute}`)} options={minutes} />
    </div>
  );
}
