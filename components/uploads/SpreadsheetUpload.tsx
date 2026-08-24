"use client";

import { FileSpreadsheet } from "lucide-react";
import { useId, useState } from "react";
import { createSpreadsheetPreview } from "@/lib/spreadsheet-validation";
import type { SpreadsheetPreview } from "@/lib/spreadsheet-validation";
import { UploadDropzone } from "@/components/uploads/UploadDropzone";
import { UploadErrorList } from "@/components/uploads/UploadErrorList";
import { Button } from "@/components/ui/Button";

export function SpreadsheetUpload({ label = "Bulk upload spreadsheet" }: { label?: string }) {
  const id = useId();
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<SpreadsheetPreview | null>(null);

  function selectFile(file: File) {
    setFileName(file.name);
    setPreview(createSpreadsheetPreview(file));
  }

  function downloadTemplate() {
    const csv = "student_id,full_name,roll_no,email,faculty,department,semester\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "atu-import-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[#111827]">{label}</p>
          <p className="mt-1 text-xs text-[#6B7280]">CSV, XLS, or XLSX. Maximum file size 15 MB.</p>
        </div>
        <Button variant="secondary" type="button" onClick={downloadTemplate}>
          Download template
        </Button>
      </div>
      <UploadDropzone id={id} title="Drop spreadsheet here or browse" description="Validation preview is shown before import confirmation." accept=".csv,.xls,.xlsx" onSelect={selectFile} />
      {fileName ? (
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-[#701F3D]" aria-hidden="true" />
            <span className="text-sm font-bold">{fileName}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <span>Total rows: {preview?.totalRows ?? 0}</span>
            <span>Valid: {preview?.validRows ?? 0}</span>
            <span>Invalid: {preview?.invalidRows ?? 0}</span>
            <span>Success: 0</span>
          </div>
        </div>
      ) : null}
      <UploadErrorList errors={preview?.errors ?? []} />
    </div>
  );
}
