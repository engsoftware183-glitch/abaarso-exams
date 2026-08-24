import { GraduationCap } from "lucide-react";

const books = [
  { label: "DATA STRUCTURES", color: "bg-[#B03060]" },
  { label: "DATABASE SYSTEMS", color: "bg-[#1E293B]" },
  { label: "ALGORITHMS", color: "bg-[#701F3D]" },
];

export function AcademicBookStack() {
  return (
    <div className="relative w-36 sm:w-44">
      <GraduationCap
        className="absolute -top-8 left-1/2 h-12 w-12 -translate-x-1/2 text-[#1E293B] drop-shadow-md sm:h-14 sm:w-14"
        aria-hidden="true"
      />
      <span
        className="absolute -top-9 left-1/2 h-2.5 w-2.5 -translate-x-1 rounded-full bg-[#D4A017]"
        aria-hidden="true"
      />

      <div className="flex flex-col-reverse gap-1">
        {books.map((book) => (
          <div
            key={book.label}
            className={`flex h-8 items-center rounded-md ${book.color} px-3 shadow-[0_6px_10px_rgba(0,0,0,0.25)] sm:h-9`}
          >
            <span className="text-[9px] font-bold tracking-wide text-white sm:text-[10px]">{book.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
