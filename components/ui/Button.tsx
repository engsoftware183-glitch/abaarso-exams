import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  children: ReactNode;
};

const variants = {
  primary: "bg-[#B03060] text-white shadow-sm hover:bg-[#90274F]",
  secondary: "border border-[#E5E7EB] bg-white text-[#111827] hover:border-[#B03060] hover:text-[#90274F]",
  ghost: "text-[#374151] hover:bg-[#F3F4F6]",
  danger: "bg-[#DC2626] text-white hover:bg-[#B91C1C]",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

export function Button({ variant = "primary", size = "md", className = "", children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
