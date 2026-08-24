"use client";

import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown, Loader2, Printer } from "lucide-react";

// ======================================================
// EXPORT BUTTON
// ======================================================
//
// A split button that opens a small dropdown with two options:
//   CSV  |  Excel (.xlsx)
//
// Requirements met:
//   - Lucide icon (Download, ChevronDown, Loader2)
//   - Loading state while generating (spinner + "Exporting…")
//   - Disabled during in-flight request (prevents double-clicks)
//   - Error/success feedback is handled by the caller via toast
//   - Responsive: uses relative units, no fixed widths
//   - Uses existing ATU color tokens from Button.tsx

export type ExportFormat = "csv" | "xlsx" | "pdf" | "print";

type ExportButtonProps = {
  /** Called when the user selects a format. Must return a Promise. */
  onExport: (format: ExportFormat) => Promise<void>;
  /** Optional button label (defaults to "Export") */
  label?: string;
  /** Extra className applied to the wrapper */
  className?: string;
};

export function ExportButton({
  onExport,
  label = "Export",
  className = "",
}: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside.
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleSelect(format: ExportFormat) {
    setOpen(false);
    if (loading) return; // guard against double-clicks
    setLoading(true);
    try {
      await onExport(format);
    } catch {
      // Caller is responsible for surfacing the error (e.g. via toast).
      // We must still clear the loading state here.
    } finally {
      setLoading(false);
    }
  }

  const buttonBase =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";

  const primaryStyle = "bg-[#B03060] text-white shadow-sm hover:bg-[#90274F]";
  const secondaryStyle =
    "border border-[#E5E7EB] bg-white text-[#111827] hover:border-[#B03060] hover:text-[#90274F]";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Main label + toggle button */}
      <div className="flex items-stretch">
        {/* Left: icon + label (not clickable on its own — opens dropdown) */}
        <button
          type="button"
          disabled={loading}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`${label} — select format`}
          onClick={() => setOpen((prev) => !prev)}
          className={`${buttonBase} ${primaryStyle} rounded-r-none border-r border-[#90274F]`}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="h-4 w-4" aria-hidden="true" />
          )}
          {loading ? "Exporting…" : label}
        </button>

        {/* Right: chevron toggle */}
        <button
          type="button"
          disabled={loading}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Open export format menu"
          onClick={() => setOpen((prev) => !prev)}
          className={`${buttonBase} ${primaryStyle} rounded-l-none px-2`}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Dropdown */}
      {open && !loading && (
        <div
          role="listbox"
          aria-label="Export format"
          className="absolute right-0 z-50 mt-1 w-40 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-lg"
        >
          <button
            role="option"
            aria-selected={false}
            type="button"
            className={`${buttonBase} ${secondaryStyle} w-full justify-start rounded-none border-0 border-b border-[#E5E7EB]`}
            onClick={() => void handleSelect("csv")}
          >
            CSV
          </button>
          <button
            role="option"
            aria-selected={false}
            type="button"
            className={`${buttonBase} ${secondaryStyle} w-full justify-start rounded-none border-0 border-b border-[#E5E7EB]`}
            onClick={() => void handleSelect("xlsx")}
          >
            Excel (.xlsx)
          </button>
          <button
            role="option"
            aria-selected={false}
            type="button"
            className={`${buttonBase} ${secondaryStyle} w-full justify-start rounded-none border-0 border-b border-[#E5E7EB]`}
            onClick={() => void handleSelect("pdf")}
          >
            PDF
          </button>
          <button
            role="option"
            aria-selected={false}
            type="button"
            className={`${buttonBase} ${secondaryStyle} w-full justify-start rounded-none`}
            onClick={() => void handleSelect("print")}
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Print
          </button>
        </div>
      )}
    </div>
  );
}
