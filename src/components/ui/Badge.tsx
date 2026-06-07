import { cn } from "@/lib/utils";

type BadgeVariant = "blue" | "amber" | "green" | "red";

const variants: Record<BadgeVariant, string> = {
  blue:  "bg-[#E6EFF8] text-[#1A5FA5]",
  amber: "bg-[#FBF3E1] text-[#B7791F]",
  green: "bg-[#E5F4EC] text-[#1F7A4D]",
  red:   "bg-[#FBE9E9] text-[#B23B3B]",
};

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-[9px] py-[3px] rounded-full text-[12px] font-medium whitespace-nowrap",
        "before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-current",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function estadoToBadge(estado: string): { variant: BadgeVariant; label: string } {
  switch (estado) {
    case "en_gestion":  return { variant: "blue",  label: "En gestión" };
    case "pendiente":   return { variant: "amber", label: "Pendiente" };
    case "pagada":      return { variant: "green", label: "Pagada" };
    case "vencida":     return { variant: "red",   label: "Vencida" };
    case "liquidado":   return { variant: "green", label: "Liquidado" };
    case "en_proceso":  return { variant: "blue",  label: "En proceso" };
    case "bajo":        return { variant: "blue",  label: "Bajo" };
    case "medio":       return { variant: "amber", label: "Medio" };
    case "alto":        return { variant: "red",   label: "Alto" };
    default:            return { variant: "blue",  label: estado };
  }
}
