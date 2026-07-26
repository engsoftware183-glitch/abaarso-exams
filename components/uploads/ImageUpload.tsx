"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { ImageUp } from "lucide-react";
import { imageValidation, validateFile } from "@/lib/file-validation";
import { UploadDropzone } from "@/components/uploads/UploadDropzone";
import { UploadErrorList } from "@/components/uploads/UploadErrorList";
import { Button } from "@/components/ui/Button";

export function ImageUpload({ label = "Profile image", circular = true }: { label?: string; circular?: boolean }) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function selectFile(nextFile: File) {
    const validation = validateFile(nextFile, imageValidation);
    setFile(nextFile);
    setErrors(validation.errors);
  }

  return (
    <div className="grid gap-3">
      <div>
        <p className="text-sm font-bold text-[#111827]">{label}</p>
        <p className="mt-1 text-xs text-[#6B7280]">PNG, JPG, JPEG, or WEBP. Maximum file size 5 MB.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
        <div className={`relative grid aspect-square place-items-center overflow-hidden border border-[#E5E7EB] bg-white ${circular ? "rounded-full" : "rounded-lg"}`}>
          {preview ? (
            <Image src={preview} alt="Selected preview" fill className="object-cover" unoptimized />
          ) : (
            <ImageUp className="h-9 w-9 text-[#9CA3AF]" aria-hidden="true" />
          )}
        </div>
        <UploadDropzone id={id} title="Drop image here or browse" description="Preview appears immediately after selection." accept=".png,.jpg,.jpeg,.webp" onSelect={selectFile} />
      </div>
      <input ref={inputRef} className="sr-only" type="file" accept=".png,.jpg,.jpeg,.webp" onChange={(event) => event.target.files?.[0] && selectFile(event.target.files[0])} />
      <UploadErrorList errors={errors} />
      {file ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" type="button" onClick={() => inputRef.current?.click()}>
            Replace image
          </Button>
          <Button variant="ghost" type="button" onClick={() => setFile(null)}>
            Remove image
          </Button>
        </div>
      ) : null}
    </div>
  );
}
