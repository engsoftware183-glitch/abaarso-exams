import { PenLine } from "lucide-react";

const rows = [1, 2, 3, 4, 5];
const choices = ["A", "B", "C", "D"];

export function ExamAnswerSheet() {
  return (
    <div className="relative w-40 rotate-[5deg] rounded-lg border border-[#E5E7EB] bg-white p-3 shadow-[0_10px_24px_rgba(0,0,0,0.18)] sm:w-48 sm:p-3.5">
      <p className="text-[10px] font-black uppercase tracking-wide text-[#0F172A] sm:text-xs">Examination</p>
      <p className="text-[9px] font-semibold text-[#94A3B8] sm:text-[10px]">Answer Sheet</p>

      <div className="mt-2 space-y-1.5">
        {rows.map((row) => (
          <div key={row} className="flex items-center gap-1.5">
            <span className="w-3 text-[8px] font-semibold text-[#94A3B8]">{row}.</span>
            {choices.map((choice) => (
              <span
                key={choice}
                className="flex h-3 w-3 items-center justify-center rounded-full border border-[#CBD5E1] text-[6px] font-bold text-[#94A3B8] sm:h-3.5 sm:w-3.5"
              >
                {choice}
              </span>
            ))}
          </div>
        ))}
      </div>

      <PenLine
        className="absolute -bottom-3 -right-4 h-10 w-10 rotate-[38deg] text-[#B03060] drop-shadow-md sm:h-12 sm:w-12"
        aria-hidden="true"
      />
    </div>
  );
}
