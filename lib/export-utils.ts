// ======================================================
// EXPORT UTILITIES (server-side)
// ======================================================
//
// Shared helpers for the three export API routes
// (students, courses, results). No client-side code here.
//
// CSV SECURITY
// - sanitizeCsvCell() prevents formula injection by prefixing
//   cells that begin with =, +, -, @ with a single quote.
// - UTF-8 BOM is prepended so Excel opens the file without
//   a "Select encoding" prompt.
//
// EXCEL
// - Uses the already-installed xlsx@0.18.5 package (same one
//   used by the Import system). No additional library.

import * as XLSX from "xlsx";

// ======================================================
// CSV HELPERS
// ======================================================

// Characters that spreadsheet applications interpret as
// formula starters when they appear at the beginning of a cell.
const DANGEROUS_PREFIXES = /^[=+\-@|]/;

/**
 * Prevent CSV formula injection.
 * Prefixes dangerous leading characters with a single quote so the
 * value is treated as a text literal rather than a formula.
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value == null) return "";
  const str = String(value);
  if (DANGEROUS_PREFIXES.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Quote a CSV cell: wraps value in double-quotes and escapes
 * any embedded double-quotes by doubling them (RFC 4180).
 */
function quoteCsvCell(str: string): string {
  // Always quote so embedded commas, newlines, and quotes are safe.
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Build a UTF-8 BOM + comma-separated CSV string.
 * All cells are sanitised against formula injection before quoting.
 */
export function buildCsvString(
  headers: string[],
  rows: (string | number | null | undefined)[][]
): string {
  const BOM = "\uFEFF";

  const headerRow = headers.map((h) => quoteCsvCell(sanitizeCsvCell(h))).join(",");

  const dataRows = rows.map((row) =>
    row.map((cell) => quoteCsvCell(sanitizeCsvCell(cell))).join(",")
  );

  return BOM + [headerRow, ...dataRows].join("\r\n");
}

// ======================================================
// EXCEL (xlsx) HELPERS
// ======================================================

/**
 * Build an .xlsx binary buffer from headers + rows.
 * Column widths are set to the widest value in each column,
 * capped at 60 characters.
 */
export function buildXlsxBuffer(
  headers: string[],
  rows: (string | number | null | undefined)[][]
): Buffer {
  const wsData: (string | number | null | undefined)[][] = [headers, ...rows];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Compute sensible column widths (characters).
  const colWidths = headers.map((header, colIndex) => {
    const headerLen = header.length;
    const maxDataLen = rows.reduce((max, row) => {
      const cell = row[colIndex];
      const len = cell == null ? 0 : String(cell).length;
      return Math.max(max, len);
    }, 0);
    return Math.min(60, Math.max(headerLen, maxDataLen) + 2);
  });

  ws["!cols"] = colWidths.map((wch) => ({ wch }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Export");

  // Write to a Node Buffer (server-side).
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return buf;
}

// ======================================================
// SAFE FILENAME HELPER
// ======================================================

/**
 * Generate a filename such as "students-export-2026-08-24.csv"
 * The date is always UTC today so filenames are deterministic.
 */
export function buildExportFilename(module: string, format: "csv" | "xlsx"): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `${module}-export-${today}.${format}`;
}

// ======================================================
// EXPORT SIZE LIMIT
// ======================================================

/** Maximum rows returned by a single export request. */
export const EXPORT_MAX_ROWS = 5000;
