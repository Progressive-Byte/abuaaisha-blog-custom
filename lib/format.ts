const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

export function toBanglaDigits(value: number | string): string {
  return String(value).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

const gregorian = new Intl.DateTimeFormat("bn-BD", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const hijri = new Intl.DateTimeFormat("bn-BD-u-ca-islamic-umalqura", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function dayMonthYear(fmt: Intl.DateTimeFormat, date: Date): string {
  const parts = fmt.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")} ${get("month")} ${get("year")}`;
}

export function formatDate(date: Date): string {
  return dayMonthYear(gregorian, date);
}

export function formatDualDate(date: Date): string {
  return `${formatDate(date)} / ${dayMonthYear(hijri, date)}`;
}

/** About 200 words per minute for Bangla; at least one minute. */
export function readingMinutes(markdown: string): number {
  const words = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function readingTimeLabel(markdown: string): string {
  return `${toBanglaDigits(readingMinutes(markdown))} মিনিটের পড়া`;
}

const adminDate = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatAdminDate(date: Date): string {
  return adminDate.format(date);
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
