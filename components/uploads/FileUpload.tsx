"use client";

import { useId, useRef, useState } from "react";
import { documentValidation, validateFile } from "@/lib/file-validation";
import { UploadDropzone } from "@/components/uploads/UploadDropzone";
import { FileItem } from "@/components/uploads/FileItem";
import { UploadErrorList } from "@/components/uploads/UploadErrorList";

export function FileUpload({ label = "Supporting document" }: { label?: string }) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  function selectFile(nextFile: File) {
    const validation = validateFile(nextFile, documentValidation);
    setFile(nextFile);
    setErrors(validation.errors);
  }

  return (
    <div className="grid gap-3">
      <div>
        <p className="text-sm font-bold text-[#111827]">{label}</p>
        <p className="mt-1 text-xs text-[#6B7280]">PDF, DOC, or DOCX. Maximum file size 10 MB.</p>
      </div>
      <UploadDropzone
        id={id}
        title="Drop document here or browse"
        description="Use this integration point for backend upload routes when approved."
        accept=".pdf,.doc,.docx"
        onSelect={selectFile}
      />
      <input ref={inputRef} className="sr-only" type="file" accept=".pdf,.doc,.docx" onChange={(event) => event.target.files?.[0] && selectFile(event.target.files[0])} />
      <UploadErrorList errors={errors} />
      {file ? <FileItem file={file} error={errors[0]} onRemove={() => setFile(null)} onReplace={() => inputRef.current?.click()} /> : null}
    </div>
  );
}
