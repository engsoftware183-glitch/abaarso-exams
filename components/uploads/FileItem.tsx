"use client";

import { Download, Eye, FileText, Replace, Trash2 } from "lucide-react";
import { formatFileSize } from "@/lib/file-formatters";

type FileItemProps = {
  file: File;
  error?: string;
  onRemove: () => void;
  onReplace: () => void;
  previewUrl?: string;
};

export function FileItem({ file, error, onRemove, onReplace, previewUrl }: FileItemProps) {
  function downloadSelectedFile() {
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-lg border border-[#E5E7EB] bg-white p-3">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#F5DBE5] text-[#701F3D]">
          <FileText className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[#111827]">{file.name}</p>
          <p className="text-xs text-[#6B7280]">{formatFileSize(file.size)}</p>
          {error ? <p className="mt-1 text-xs font-semibold text-[#DC2626]">{error}</p> : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {previewUrl ? (
          <a className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold" href={previewUrl} target="_blank">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            Preview
          </a>
        ) : null}
        <button className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold" type="button" onClick={downloadSelectedFile}>
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Download
        </button>
        <button className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold" type="button" onClick={onReplace}>
          <Replace className="h-3.5 w-3.5" aria-hidden="true" />
          Replace
        </button>
        <button className="inline-flex items-center gap-1 rounded-md border border-red-100 px-2.5 py-1.5 text-xs font-semibold text-[#DC2626]" type="button" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          Remove
        </button>
      </div>
    </div>
  );
}
