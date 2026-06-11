/**
 * constants.ts
 *
 * Lookup maps for status / priority colours and display labels.
 * Keeping them here avoids scattering magic strings across components.
 */

/** Tailwind classes for ticket priority badges */
export const PRIORITY_COLORS: Record<string, string> = {
  high: "text-red-500 bg-red-500/10 border-red-500/20",
  medium: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  low: "text-blue-500 bg-blue-500/10 border-blue-500/20",
}

/** Tailwind classes for ticket status badges */
export const STATUS_COLORS: Record<string, string> = {
  pending: "text-stone-500 bg-stone-500/10 border-stone-500/20",
  in_progress: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  in_review: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  blocked: "text-red-500 bg-red-500/10 border-red-500/20",
  completed: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  reopen: "text-amber-500 bg-amber-500/10 border-amber-500/20",
}

/** Human-readable label for each ticket status key */
export const STATUS_LABEL: Record<string, string> = {
  pending: "Todo",
  in_progress: "In Progress",
  in_review: "In Review",
  blocked: "Blocked",
  completed: "Completed",
  reopen: "Reopen",
}

/** Human-readable label for each project status key */
export const PROJECT_STATUS_LABEL: Record<string, string> = {
  pending: "Not Started",
  in_progress: "Active",
  completed: "Completed",
}

/** Tailwind classes for project status pill */
export const PROJECT_STATUS_COLOR: Record<string, string> = {
  pending: "text-stone-500 bg-stone-500/10",
  in_progress: "text-blue-500 bg-blue-500/10",
  completed: "text-emerald-500 bg-emerald-500/10",
}

/** Fill colours used in the ticket-breakdown pie chart (one per status slice) */
export const PIE_COLORS = {
  completed: "#10b981",
  inProgress: "#3b82f6",
  inReview: "#a855f7",
  blocked: "#ef4444",
  rest: "#78716c",
}
