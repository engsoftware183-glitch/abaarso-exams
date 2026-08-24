"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  RotateCcw,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/StateBlocks";
import { UploadDropzone } from "@/components/uploads/UploadDropzone";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { getStoredUser } from "@/lib/auth-client";
import { getFileExtension } from "@/lib/file-formatters";
import { validateFile, spreadsheetValidation } from "@/lib/file-validation";
import { parseSpreadsheetFile, exceedsGridLimit, type ParsedGrid } from "@/lib/import/parse-file";
import { IMPORT_MODULES } from "@/lib/import/import-config";

type ImportSummary = { totalRows: number; valid: number; invalid: number; skipped: number };
type ImportRowResult = { rowNumber: number; status: "VALID" | "INVALID" | "SKIPPED"; reasons: string[] };
type ImportResponse = {
  success: boolean;
  dryRun: boolean;
  summary: ImportSummary;
  results: ImportRowResult[];
  imported: number;
  failed: number;
  skipped: number;
  message?: string;
};

const PREVIEW_ROW_LIMIT = 5;
const ERROR_LIST_LIMIT = 50;

function formatError(requestError: unknown): string {
  if (requestError instanceof ApiClientError) {
    return requestError.payload?.message ?? requestError.message;
  }
  return requestError instanceof Error ? requestError.message : "Something went wrong";
}

export function ImportFlow() {
  const user = useMemo(() => getStoredUser(), []);
  const isManager = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  const [moduleKey, setModuleKey] = useState<"students" | "courses" | "academics" | "faculties" | "departments" | "semesters" | "attendance" | "assessments" | "exams" | "student-exams">("students");
  const activeModule = IMPORT_MODULES[moduleKey];

  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [grid, setGrid] = useState<ParsedGrid | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [preview, setPreview] = useState<ImportResponse | null>(null);
  const [validating, setValidating] = useState(false);
  const [validateError, setValidateError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<ImportResponse | null>(null);

  function reset() {
    setFileName(null);
    setFileType(null);
    setGrid(null);
    setFileError(null);
    setPreview(null);
    setValidateError(null);
    setConfirmOpen(false);
    setSaveResult(null);
  }

  function switchModule(next: "students" | "courses" | "academics" | "faculties" | "departments" | "semesters" | "attendance" | "assessments" | "exams" | "student-exams") {
    setModuleKey(next);
    reset();
  }

  // =========================================
  // FILE SELECTION -> PARSE -> DRY RUN
  // =========================================

  function selectFile(file: File) {
    reset();

    const validation = validateFile(file, spreadsheetValidation);
    if (!validation.valid) {
      setFileName(file.name);
      setFileError(validation.errors.join(" "));
      return;
    }

    setFileName(file.name);
    setFileType(getFileExtension(file.name).toUpperCase());

    parseSpreadsheetFile(file)
      .then((parsed) => {
        if (exceedsGridLimit(parsed)) {
          setFileError("The file is too large to import.");
          return;
        }
        setGrid(parsed);
      })
      .catch((error) => {
        setFileError(error instanceof Error ? error.message : "Could not parse the file.");
      });
  }

  const runDryRun = useCallback(async () => {
    if (!grid) return;

    setValidating(true);
    setValidateError(null);
    setPreview(null);

    try {
      const response = await apiClient.post<ImportResponse>(activeModule.endpoint, {
        headers: grid.headers,
        rows: grid.rows,
        dryRun: true,
      });
      setPreview(response);
    } catch (requestError) {
      setValidateError(formatError(requestError));
    } finally {
      setValidating(false);
    }
  }, [grid, activeModule.endpoint]);

  useEffect(() => {
    if (grid) {
      void runDryRun();
    }
  }, [grid, runDryRun]);

  // =========================================
  // SAVE
  // =========================================

  async function confirmImport() {
    if (!grid) return;

    setSaving(true);
    setConfirmOpen(false);

    try {
      const response = await apiClient.post<ImportResponse>(activeModule.endpoint, {
        headers: grid.headers,
        rows: grid.rows,
        dryRun: false,
      });
      setSaveResult(response);
    } catch (requestError) {
      setValidateError(formatError(requestError));
    } finally {
      setSaving(false);
    }
  }

  function downloadTemplate() {
    const headerLine = activeModule.fields.map((field) => field.header).join(",");
    const sample = moduleKey === "students"
      ? "jdoe,Password123,John Doe,STU-001,MALE,jdoe@abaarso.edu,0612345678,Hargeisa,2026/2027,Faculty of Engineering,Computer Science,Semester 1"
      : moduleKey === "courses"
        ? "Data Structures,CSC201,3,Introduction to data structures,Computer Science,Semester 1"
        : moduleKey === "academics"
          ? "2026/2027"
          : moduleKey === "faculties"
            ? "Faculty of Engineering"
            : moduleKey === "departments"
              ? "Computer Science,Faculty of Engineering"
              : moduleKey === "semesters"
                ? "Semester 1,2026/2027,Faculty of Engineering"
                : moduleKey === "attendance"
                  ? "STU-001,CSC201,8,80"
                  : moduleKey === "assessments"
                    ? "STU-001,CSC201,15,10"
                    : moduleKey === "exams"
                      ? "MIDTERM,100,2026-03-15,2026/2027,Faculty of Engineering,Semester 1,CSC201"
                      : "STU-001,1,85";

    const csv = `${headerLine}\n${sample}\n`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `atu-${moduleKey}-import-template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!isManager) {
    return (
      <AppShell title="Import Data" description="Import students and courses from CSV or Excel files.">
        <EmptyState title="Manager access required" message="Only Super Admins and Admins can import records." />
      </AppShell>
    );
  }

  const previewRows = grid ? grid.rows.slice(0, PREVIEW_ROW_LIMIT) : [];
  const invalidResults = preview?.results.filter((r) => r.status === "INVALID") ?? [];
  const skippedResults = preview?.results.filter((r) => r.status === "SKIPPED") ?? [];

  return (
    <AppShell title="Import Data" description="Import students and courses from CSV or Excel files.">
      <div className="grid gap-6">
        {/* ============ MODULE SELECTOR ============ */}
        <section className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-[#111827]">Import type:</span>
            {(Object.keys(IMPORT_MODULES) as Array<"students" | "courses" | "academics" | "faculties" | "departments" | "semesters" | "attendance" | "assessments" | "exams" | "student-exams">).map((key) => (
              <button
                key={key}
                type="button"
                className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                  moduleKey === key
                    ? "bg-[#B03060] text-white shadow-sm"
                    : "border border-[#E5E7EB] bg-white text-[#374151] hover:border-[#B03060]"
                }`}
                onClick={() => switchModule(key)}
              >
                {IMPORT_MODULES[key].label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-[#6B7280]">
            Required columns: {activeModule.fields.filter((f) => f.required).map((f) => f.header).join(", ")}.
            Relationship values (faculty, department, semester, academic year) must match existing records.
          </p>
        </section>

        {/* ============ UPLOAD ============ */}
        <section className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-[#111827]">Upload {activeModule.label} file</p>
              <p className="mt-1 text-xs text-[#6B7280]">
                CSV, XLS, or XLSX. Maximum 15 MB, {activeModule.maxRows} rows.
              </p>
            </div>
            <Button variant="secondary" type="button" onClick={downloadTemplate}>
              <Download className="h-4 w-4" />
              Download template
            </Button>
          </div>

          <div className="mt-3">
            <UploadDropzone
              id={`import-dropzone-${moduleKey}`}
              title="Drop spreadsheet here or browse"
              description="The file is parsed and validated before anything is saved."
              accept=".csv,.xls,.xlsx"
              onSelect={selectFile}
            />
          </div>

          {fileError ? (
            <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-medium text-[#991B1B]" role="alert">
              {fileError}
            </div>
          ) : null}
        </section>

        {/* ============ PREVIEW ============ */}
        {fileName && !fileError ? (
          <section className="rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-[#701F3D]" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold text-[#111827]">{fileName}</p>
                  <p className="text-xs text-[#6B7280]">Type: {fileType ?? "—"}</p>
                </div>
              </div>
              <Button variant="ghost" type="button" onClick={reset}>
                <RotateCcw className="h-4 w-4" />
                Choose another file
              </Button>
            </div>

            {/* validation summary */}
            {validating ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-[#6B7280]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Validating rows…
              </div>
            ) : validateError ? (
              <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-medium text-[#991B1B]" role="alert">
                {validateError}
              </div>
            ) : preview ? (
              <div className="mt-4">
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div className="rounded-lg border border-[#E5E7EB] p-3">
                    <p className="text-xs font-bold text-[#6B7280]">Total rows</p>
                    <p className="mt-1 text-xl font-black text-[#111827]">{preview.summary.totalRows}</p>
                  </div>
                  <div className="rounded-lg border border-green-100 bg-green-50 p-3">
                    <p className="text-xs font-bold text-[#2D5842]">Valid</p>
                    <p className="mt-1 text-xl font-black text-[#2D5842]">{preview.summary.valid}</p>
                  </div>
                  <div className="rounded-lg border border-red-100 bg-red-50 p-3">
                    <p className="text-xs font-bold text-[#991B1B]">Invalid</p>
                    <p className="mt-1 text-xl font-black text-[#991B1B]">{preview.summary.invalid}</p>
                  </div>
                  <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                    <p className="text-xs font-bold text-amber-700">Skipped</p>
                    <p className="mt-1 text-xl font-black text-amber-700">{preview.summary.skipped}</p>
                  </div>
                </div>

                {/* first preview rows */}
                {grid && previewRows.length > 0 ? (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-xs">
                      <thead className="bg-[#F9FAFB] uppercase tracking-wide text-[#6B7280]">
                        <tr>
                          <th className="px-3 py-2 font-black">#</th>
                          {grid.headers.map((header) => (
                            <th key={header} className="px-3 py-2 font-black">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB]">
                        {previewRows.map((row, index) => (
                          <tr key={index} className="hover:bg-[#F9FAFB]">
                            <td className="px-3 py-2 font-semibold text-[#6B7280]">{index + 2}</td>
                            {grid.headers.map((_, cellIndex) => (
                              <td key={cellIndex} className="max-w-[180px] truncate px-3 py-2 text-[#111827]">
                                {row[cellIndex] || "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {grid.rows.length > PREVIEW_ROW_LIMIT ? (
                      <p className="mt-2 px-3 text-xs text-[#6B7280]">
                        Showing first {PREVIEW_ROW_LIMIT} of {grid.rows.length} rows.
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {/* per-row errors */}
                {invalidResults.length > 0 || skippedResults.length > 0 ? (
                  <div className="mt-4 rounded-lg border border-[#E5E7EB] p-3">
                    <p className="text-sm font-bold text-[#111827]">Row issues</p>
                    <ul className="mt-2 grid max-h-64 gap-1 overflow-y-auto text-xs">
                      {[...invalidResults, ...skippedResults].slice(0, ERROR_LIST_LIMIT).map((result) => (
                        <li key={result.rowNumber} className="flex items-start gap-2">
                          {result.status === "INVALID" ? (
                            <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#DC2626]" aria-hidden="true" />
                          ) : (
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />
                          )}
                          <span>
                            <strong>Row {result.rowNumber}:</strong> {result.reasons.join("; ")}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {invalidResults.length + skippedResults.length > ERROR_LIST_LIMIT ? (
                      <p className="mt-2 text-xs text-[#6B7280]">
                        …and {invalidResults.length + skippedResults.length - ERROR_LIST_LIMIT} more rows.
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {/* import action */}
                {preview.summary.valid > 0 ? (
                  <div className="mt-4 flex flex-col-reverse gap-3 border-t border-[#E5E7EB] pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-[#6B7280]">
                      {preview.summary.valid} row{preview.summary.valid === 1 ? "" : "s"} ready to import.
                    </p>
                    <Button type="button" onClick={() => setConfirmOpen(true)} disabled={saving}>
                      <UploadCloud className="h-4 w-4" />
                      Import {preview.summary.valid} row{preview.summary.valid === 1 ? "" : "s"}
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

        {/* ============ SAVE RESULT ============ */}
        {saveResult ? (
          <section className="rounded-lg border border-green-100 bg-green-50 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#2D5842]" aria-hidden="true" />
              <div>
                <p className="text-sm font-black text-[#2D5842]">Import complete</p>
                <p className="mt-1 text-sm text-[#2D5842]">
                  Imported <strong>{saveResult.imported}</strong>, failed <strong>{saveResult.failed}</strong>,
                  skipped <strong>{saveResult.skipped}</strong>.
                </p>
                {saveResult.results.length > 0 ? (
                  <ul className="mt-2 grid gap-1 text-xs text-[#2D5842]">
                    {saveResult.results.slice(0, ERROR_LIST_LIMIT).map((result) => (
                      <li key={result.rowNumber}>
                        Row {result.rowNumber}: {result.reasons.join("; ")}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <Button className="mt-3" variant="secondary" type="button" onClick={reset}>
                  Import another file
                </Button>
              </div>
            </div>
          </section>
        ) : null}
      </div>

      {/* ============ CONFIRM DIALOG ============ */}
      {confirmOpen && preview ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="import-confirm-title">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h2 id="import-confirm-title" className="text-lg font-black">
              Confirm import
            </h2>
            <p className="mt-2 text-sm text-[#6B7280]">
              You are about to import <strong>{preview.summary.valid}</strong> {activeModule.label.toLowerCase()} record
              {preview.summary.valid === 1 ? "" : "s"}. {preview.summary.invalid} invalid and{" "}
              {preview.summary.skipped} skipped rows will not be saved. This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="secondary" disabled={saving} onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button disabled={saving} onClick={() => void confirmImport()}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing…
                  </>
                ) : (
                  "Confirm import"
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
