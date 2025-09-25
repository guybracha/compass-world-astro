// src/lib/dates.ts
export function formatHeDate(input?: string | Date): string | undefined {
  if (!input) return;
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return;
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}
