import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";

function toDate(value: string | Date): Date | null {
  const date = typeof value === "string" ? parseISO(value) : value;
  return isValid(date) ? date : null;
}

/** "12 Mar 2026" */
export function formatDate(value: string | Date): string {
  const date = toDate(value);
  return date ? format(date, "d MMM yyyy") : "";
}

/** "12 Mar 2026, 14:05" */
export function formatDateTime(value: string | Date): string {
  const date = toDate(value);
  return date ? format(date, "d MMM yyyy, HH:mm") : "";
}

/** "3 days ago" */
export function formatRelative(value: string | Date): string {
  const date = toDate(value);
  return date ? `${formatDistanceToNowStrict(date)} ago` : "";
}

/** Time-of-day greeting for the overview page. */
export function greetingForHour(hour: number): string {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
