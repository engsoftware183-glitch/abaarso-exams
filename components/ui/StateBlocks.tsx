import { AlertCircle, Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function LoadingSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-[#6B7280]" role="status" aria-live="polite">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

export function SkeletonLoader({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid gap-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-lg bg-gray-100" />
      ))}
    </div>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#E5E7EB] bg-white p-8 text-center">
      <Inbox className="mx-auto h-8 w-8 text-[#6B7280]" aria-hidden="true" />
      <h3 className="mt-3 text-sm font-bold text-[#111827]">{title}</h3>
      <p className="mt-1 text-sm text-[#6B7280]">{message}</p>
    </div>
  );
}

export function ErrorState({ title, message, onRetry }: { title: string; message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-red-100 bg-red-50 p-4">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 text-[#DC2626]" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-bold text-[#991B1B]">{title}</h3>
          <p className="mt-1 text-sm text-[#7F1D1D]">{message}</p>
          {onRetry ? (
            <Button className="mt-3" variant="secondary" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
