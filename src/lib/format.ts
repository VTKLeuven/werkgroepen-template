export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatEventDate(
  startAt: Date,
  endAt?: Date | null,
  locale = "en-GB",
) {
  const date = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(startAt);

  if (!endAt) return date;

  const endTime = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(endAt);

  return `${date} - ${endTime}`;
}

export function mediaUrl(id?: string | null) {
  return id ? `/media/${id}` : null;
}

/**
 * Album photos are served from their own route, not /media: they are rows in
 * Photo rather than MediaAsset, and they come in two sizes.
 */
export function photoUrl(id?: string | null, size: "full" | "thumb" = "full") {
  if (!id) return null;
  return size === "thumb" ? `/photo/${id}?size=thumb` : `/photo/${id}`;
}

export function formatAlbumDate(date: Date, locale = "en-GB") {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
