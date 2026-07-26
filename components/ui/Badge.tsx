import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  tone?: "green" | "blue" | "amber" | "red" | "gray";
};

const tones = {
  green: "bg-[#DCFCE7] text-[#15803D]",
  blue: "bg-blue-50 text-blue-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  gray: "bg-gray-100 text-gray-700",
};

export function Badge({ children, tone = "gray" }: BadgeProps) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}
