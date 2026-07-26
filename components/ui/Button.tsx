import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  children: ReactNode;
};

const variants = {
  primary: "bg-[#16A34A] text-white shadow-sm hover:bg-[#15803D]",
  secondary: "border border-[#E5E7EB] bg-white text-[#111827] hover:border-[#16A34A] hover:text-[#15803D]",
  ghost: "text-[#374151] hover:bg-[#F3F4F6]",
  danger: "bg-[#DC2626] text-white hover:bg-[#B91C1C]",
};

export function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
