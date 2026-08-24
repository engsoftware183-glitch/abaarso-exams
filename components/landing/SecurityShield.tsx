import { ShieldCheck } from "lucide-react";

export function SecurityShield() {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-[#B03060] to-[#701F3D] shadow-[0_10px_22px_rgba(112,31,61,0.45)] sm:h-20 sm:w-20">
      <ShieldCheck className="h-8 w-8 text-white sm:h-10 sm:w-10" aria-hidden="true" strokeWidth={2.25} />
    </div>
  );
}
