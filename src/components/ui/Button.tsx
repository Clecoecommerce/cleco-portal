import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-all active:translate-y-px border border-transparent whitespace-nowrap",
          size === "md" && "h-11 px-[18px] text-[14px]",
          size === "sm" && "h-9 px-3.5 text-[13px]",
          variant === "primary" &&
            "bg-[#2563EB] text-white hover:bg-[#1d4ed8]",
          variant === "secondary" &&
            "bg-white text-[#1E293B] border-[#E2E8F0] hover:bg-[#F1F5F9]",
          variant === "ghost" &&
            "bg-transparent text-[#1E293B] hover:bg-[#F1F5F9]",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export function IconButton({
  className,
  children,
  title,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  title?: string;
  onClick?: () => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        "w-9 h-9 rounded-[6px] border border-[#E2E8F0] bg-white text-[#1E293B] inline-flex items-center justify-center hover:bg-[#F1F5F9] transition-colors",
        className
      )}
    >
      {children}
    </button>
  );
}
