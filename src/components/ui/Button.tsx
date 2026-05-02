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
            "bg-[#185FA5] text-white hover:bg-[#134d85]",
          variant === "secondary" &&
            "bg-white text-[#2B3A4F] border-[#E4E8EE] hover:bg-[#EFF2F6]",
          variant === "ghost" &&
            "bg-transparent text-[#2B3A4F] hover:bg-[#EFF2F6]",
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
        "w-9 h-9 rounded-[6px] border border-[#E4E8EE] bg-white text-[#2B3A4F] inline-flex items-center justify-center hover:bg-[#EFF2F6] transition-colors",
        className
      )}
    >
      {children}
    </button>
  );
}
