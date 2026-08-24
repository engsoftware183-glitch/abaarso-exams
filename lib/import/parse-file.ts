"use client";

import Papa from "papaparse";
import * as XLSX from "xlsx";
import { getFileExtension } from "@/lib/file-formatters";

// ======================================================
// REAL CSV / XLSX FILE PARSING (client-side)
// ======================================================
//
// Parses the ACTUAL uploaded file contents into a uniform grid
// { headers, rows }. No fake row counts, no representative rows.

export type ParsedGrid = {
  headers: string[];
  rows: string[][];
};

const MAX_CELLS = 20000;

function toCell(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : String(value);
  return String(value).trim();
}

function parseCsv(file: File): Promise<ParsedGrid> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      skipEmptyLines: "greedy",
      complete: (result) => {
        const grid = result.data;
        if (grid.length === 0) {
          reject(new Error("The file contains no data."));
          return;
        }

        const headers = grid[0].map((cell) => toCell(cell));
        const rows = grid
          .slice(1)
          .map((row) => row.map((cell) => toCell(cell)))
          .filter((row) => row.some((cell) => cell !== ""));

        resolve({ headers, rows });
      },
      error: (error) => reject(new Error(error.message)),
    });
  });
}

function parseXlsx(file: File): Promise<ParsedGrid> {
  return new Promise((resolve, reject) => {
    file
      .arrayBuffer()
      .then((buffer) => {
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          reject(new Error("The workbook contains no sheets."));
          return;
        }

        const sheet = workbook.Sheets[sheetName];
        const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
          header: 1,
          defval: "",
          blankrows: false,
        });

        if (grid.length === 0) {
          reject(new Error("The worksheet contains no data."));
          return;
        }

        const headers = grid[0].map((cell) => toCell(cell));
        const rows = grid
          .slice(1)
          .map((row) => row.map((cell) => toCell(cell)))
          .filter((row) => row.some((cell) => cell !== ""));

        resolve({ headers, rows });
      })
      .catch(() => reject(new Error("Could not read the spreadsheet file. It may be corrupted.")));
  });
}

export async function parseSpreadsheetFile(file: File): Promise<ParsedGrid> {
  const extension = getFileExtension(file.name);

  if (extension === "csv") {
    return parseCsv(file);
  }

  if (extension === "xlsx" || extension === "xls") {
    return parseXlsx(file);
  }

  throw new Error(`Unsupported file type .${extension || "unknown"}.`);
}

/** Guard against pathological files (huge row/cell counts). */
export function exceedsGridLimit(grid: ParsedGrid): boolean {
  const cells = grid.rows.reduce((sum, row) => sum + row.length, grid.headers.length);
  return cells > MAX_CELLS;
}
