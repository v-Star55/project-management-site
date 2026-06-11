/**
 * utils.ts
 *
 * Pure helper functions shared across the member dashboard components.
 * These are intentionally side-effect free so they are easy to unit-test.
 */

/**
 * Formats an ISO date string into a short, human-readable form.
 * Returns "—" when the date is null / undefined.
 *
 * @example formatDate("2026-06-15") → "Jun 15"
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

/**
 * Returns the number of whole days between now and the given ISO date.
 * A positive result means the date is in the future.
 * Returns null when the input is falsy.
 *
 * @example daysUntil("2026-06-13") → 2  (if today is Jun 11)
 */
export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null
  const now = new Date()
  const due = new Date(iso)
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}
