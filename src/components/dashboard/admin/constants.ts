export const TICKET_STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  reopen: "bg-red-500/10 text-red-500 border-red-500/20",
  in_review: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  blocked: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  backlog: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
};

export const TICKET_PRIORITY_COLORS: Record<string, string> = {
  high: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  low: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
};

export const PROJECT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

export const FEEDBACK_PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-rose-600/10 text-rose-600 border-rose-600/20",
  high: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  low: "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

export const FEEDBACK_STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  resolved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  rejected: "bg-rose-500/10 text-rose-500 border-rose-500/20",
};
