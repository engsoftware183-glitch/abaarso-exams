"use client";

import { UploadCloud } from "lucide-react";
import type { ChangeEvent, DragEvent, ReactNode } from "react";

type UploadDropzoneProps = {
  id: string;
  title: string;
  description: string;
  accept: string;
  disabled?: boolean;
  children?: ReactNode;
  onSelect: (file: File) => void;
};

export function UploadDropzone({ id, title, description, accept, disabled, children, onSelect }: UploadDropzoneProps) {
  function handleFiles(fileList: FileList | null) {
    const file = fileList?.[0];
    if (file) onSelect(file);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    if (!disabled) handleFiles(event.dataTransfer.files);
  }

  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#CBD5E1] bg-white p-6 text-center transition hover:border-[#B03060] hover:bg-[#F8FAFC] ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") document.getElementById(id)?.click();
      }}
    >
      <UploadCloud className="h-8 w-8 text-[#B03060]" aria-hidden="true" />
      <span className="mt-3 text-sm font-bold text-[#111827]">{title}</span>
      <span className="mt-1 text-xs leading-5 text-[#6B7280]">{description}</span>
      {children}
      <input
        id={id}
        className="sr-only"
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(event: ChangeEvent<HTMLInputElement>) => handleFiles(event.target.files)}
      />
    </label>
  );
}
