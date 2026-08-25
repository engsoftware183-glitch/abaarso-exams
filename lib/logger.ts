export function logError(tag: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(tag, error);
  } else {
    console.error(tag);
  }
}
