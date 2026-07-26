export type UploadKind = "image" | "document" | "spreadsheet";

export type UploadFileState = {
  file: File;
  id: string;
  progress: number;
  status: "ready" | "validating" | "uploading" | "success" | "error";
  error?: string;
};

export type UploadValidation = {
  valid: boolean;
  errors: string[];
};
