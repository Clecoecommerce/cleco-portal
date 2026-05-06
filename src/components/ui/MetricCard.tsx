import { cn } from "@/lib/utils";

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: string;
  deltaVariant?: "green" | "amber";
  deltaText?: string;
}

export function MetricCard({
  icon,
  label,
  value,
  delta,
  deltaVariant = "green",
  deltaText,
}: MetricCardProps) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[14px] px-[22px] py-5 shadow-sm">
      <div className="flex items-center gap-2 text-[12.5px] text-[#6B7280] font-medium mb-3">
        <span className="w-[22px] h-[22px] inline-flex items-center justify-center rounded-[6px] bg-[#EFF6FF] text-[#2563EB]">
          {icon}
        </span>
        {label}
      </div>

      <div
        className="text-[30px] font-semibold tracking-tight text-[#0F172A] leading-none"
        dangerouslySetInnerHTML={{ __html: value }}
      />

      {(delta || deltaText) && (
        <div className="mt-2.5 flex items-center gap-1.5 text-[12.5px] text-[#6B7280]">
          {delta && (
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-[4px] font-semibold text-[11.5px]",
                deltaVariant === "green" ? "bg-[#E5F4EC] text-[#1F7A4D]" : "bg-[#FBF3E1] text-[#B7791F]"
              )}
            >
              {delta}
            </span>
          )}
          {deltaText}
        </div>
      )}
    </div>
  );
}
