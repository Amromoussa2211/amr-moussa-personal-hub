export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export function formatDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00Z");
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function formatDateLong(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00Z");
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function isUpcoming(iso: string | undefined): boolean {
  if (!iso) return false;
  return new Date(iso + "T00:00:00Z").getTime() > Date.now();
}
