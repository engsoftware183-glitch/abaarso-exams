import { spreadsheetValidation, validateFile } from "@/lib/file-validation";
import type { UploadValidation } from "@/types/upload";

export type SpreadsheetPreview = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: string[];
};

export function validateSpreadsheetFile(file: File): UploadValidation {
  return validateFile(file, spreadsheetValidation);
}

export function createSpreadsheetPreview(file: File): SpreadsheetPreview {
  const validation = validateSpreadsheetFile(file);

  return {
    totalRows: validation.valid ? 0 : 1,
    validRows: 0,
    invalidRows: validation.valid ? 0 : 1,
    errors: validation.errors,
  };
}
