import { AlertCircle } from "lucide-react";

export function UploadErrorList({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;

  return (
    <div className="rounded-lg border border-red-100 bg-red-50 p-3" role="alert">
      <div className="flex gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 text-[#DC2626]" aria-hidden="true" />
        <ul className="grid gap-1 text-xs font-medium text-[#991B1B]">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
