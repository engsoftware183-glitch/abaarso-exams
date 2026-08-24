import type { LucideIcon } from "lucide-react";

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex h-full min-h-[210px] flex-col rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md motion-reduce:hover:translate-y-0 sm:min-h-[230px] sm:p-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5DBE5] text-[#90274F]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 className="mt-3.5 text-lg font-black text-[#0F172A] sm:text-xl">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{description}</p>
    </div>
  );
}
