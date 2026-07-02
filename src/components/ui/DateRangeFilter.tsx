"use client";

export interface DateRange {
  from: string; // "" = sin límite inferior, si no "YYYY-MM-DD"
  to: string;   // "" = sin límite superior, si no "YYYY-MM-DD"
}

export const EMPTY_DATE_RANGE: DateRange = { from: "", to: "" };

export function inDateRange(dateIso: string, range: DateRange): boolean {
  if (range.from && dateIso < range.from) return false;
  if (range.to && dateIso > range.to) return false;
  return true;
}

const inputClass =
  "h-9 px-3 border border-[#E2E8F0] rounded-[6px] text-[13px] bg-white text-[#0F172A] " +
  "focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10";

export function DateRangeFilter({ value, onChange }: { value: DateRange; onChange: (v: DateRange) => void }) {
  const active = value.from || value.to;
  return (
    <div className="flex items-center gap-2">
      <input type="date" value={value.from} onChange={e => onChange({ ...value, from: e.target.value })} className={inputClass} aria-label="Desde" />
      <span className="text-[12px] text-[#9CA3AF]">a</span>
      <input type="date" value={value.to} onChange={e => onChange({ ...value, to: e.target.value })} className={inputClass} aria-label="Hasta" />
      {active && (
        <button onClick={() => onChange(EMPTY_DATE_RANGE)} className="text-[12px] text-[#9CA3AF] hover:text-[#1E293B] cursor-pointer">
          Limpiar
        </button>
      )}
    </div>
  );
}
