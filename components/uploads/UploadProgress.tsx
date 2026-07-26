export function UploadProgress({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-gray-100" aria-label={`Upload progress ${value}%`}>
      <div className="h-full rounded-full bg-[#16A34A]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
