/**
 * Utility to resolve enclosure URLs.
 * Resolves student photos, documents, and identity enclosures
 * to the appropriate URL path.
 */

export function getEnclosureUrl(path?: string | null): string {
  if (!path || typeof path !== "string") {
    return "";
  }

  const trimmed = path.trim();
  if (!trimmed) {
    return "";
  }

  // If already an absolute external URL or data URI / blob URI
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  // If already formatted as enclosure API route
  if (trimmed.startsWith("/api/enclosures/")) {
    return trimmed;
  }

  // If static public /uploads/ prefix was stored
  if (trimmed.startsWith("/uploads/")) {
    return trimmed;
  }

  // If raw filename stored in DB (e.g. 1740000000000-photo.jpg)
  const cleanFilename = trimmed.replace(/^[\/\\]+/, "");
  return `/api/enclosures/${encodeURIComponent(cleanFilename)}`;
}
