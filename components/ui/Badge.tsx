import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  tone?: "green" | "maroon" | "amber" | "red" | "gray";
};

const tones = {
  green: "bg-[#DDEEE6] text-[#2D5842]",
  maroon: "bg-[#F5DBE5] text-[#701F3D]",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  gray: "bg-gray-100 text-gray-700",
};

export function Badge({ children, tone = "gray" }: BadgeProps) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}
