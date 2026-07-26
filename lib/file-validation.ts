import type { UploadValidation } from "@/types/upload";
import { getFileExtension } from "@/lib/file-formatters";

type FileValidationOptions = {
  extensions: string[];
  mimeTypes: string[];
  maxSizeMb: number;
};

export const imageValidation: FileValidationOptions = {
  extensions: ["png", "jpg", "jpeg", "webp"],
  mimeTypes: ["image/png", "image/jpeg", "image/webp"],
  maxSizeMb: 5,
};

export const documentValidation: FileValidationOptions = {
  extensions: ["pdf", "doc", "docx"],
  mimeTypes: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  maxSizeMb: 10,
};

export const spreadsheetValidation: FileValidationOptions = {
  extensions: ["csv", "xls", "xlsx"],
  mimeTypes: [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  maxSizeMb: 15,
};

export function validateFile(file: File, options: FileValidationOptions): UploadValidation {
  const errors: string[] = [];
  const extension = getFileExtension(file.name);
  const maxBytes = options.maxSizeMb * 1024 * 1024;

  if (file.size === 0) errors.push("The selected file is empty.");
  if (!options.extensions.includes(extension)) errors.push(`Unsupported file type .${extension || "unknown"}.`);
  if (file.type && !options.mimeTypes.includes(file.type)) errors.push("The selected file MIME type is not supported.");
  if (file.size > maxBytes) errors.push(`File must be ${options.maxSizeMb} MB or smaller.`);

  return {
    valid: errors.length === 0,
    errors,
  };
}
