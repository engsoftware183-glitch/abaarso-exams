import { apiRequest } from "@/lib/api-client";

export async function uploadFile<T>(path: string, file: File, fieldName = "file") {
  const formData = new FormData();
  formData.append(fieldName, file);

  return apiRequest<T>(path, {
    method: "POST",
    body: formData,
  });
}
