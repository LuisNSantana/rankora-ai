// Recursively sanitize object keys to be ASCII-only and safe for Convex field names
// - Removes diacritics (á → a)
// - Replaces spaces with underscores
// - Replaces any non [A-Za-z0-9_] characters with underscores

function sanitizeKey(key: string): string {
  // Normalize and strip diacritics
  const noDiacritics = key
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  // Replace spaces with underscore and drop other non-ASCII word chars
  const ascii = noDiacritics
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_]/g, "_");
  // Collapse multiple underscores
  return ascii.replace(/_+/g, "_");
}

export function sanitizeKeysDeep<T = any>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeKeysDeep(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, any>;
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      const safeKey = sanitizeKey(k);
      out[safeKey] = sanitizeKeysDeep(v);
    }
    return out as T;
  }
  return value;
}
