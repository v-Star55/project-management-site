/**
 * types.ts
 *
 * All shared TypeScript interfaces for the Member Dashboard.
 * Centralising types here means each sub-component only needs
 * to import from this one file, avoiding duplication.
 */

/** High-level numeric KPIs returned by the dashboard API */
export interface DashboardStats {
  totalProjects: number
  totalTickets: number
  completedTickets: number
  inProgressTickets: number
  inReviewTickets: number
  blockedTickets: number
  reopenTickets: number
  totalHours: number
  todayHours: number
}

/** A lightweight ticket representation used in the "due today" and "upcoming" lists */
export interface DashboardTicket {
  id: string
  title: string
  priority: string
  status: string
  dueDate: string | null
  project: {
    id: string
    title: string
    status: string
  }
}

/** Project summary card data */
export interface DashboardProject {
  id: string
  title: string
  status: string
  imageUrl: string | null
  startDate: string | null
  completedDate: string | null
  totalTickets: number
  completedTickets: number
  inProgressTickets: number
}

/** A single day entry in the weekly performance chart */
export interface WeeklyEntry {
  day: string          // e.g. "Mon"
  date: string         // e.g. "2026-06-09"
  hours: number        // total hours logged that day
  ticketsCompleted: number
}

/** A ticket entry for the schedule widget (day-view) */
export interface ScheduleTicket {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string
  project: { id: string; title: string }
  assignedUser?: { id: string; name: string; imageUrl: string | null }
}

/** A calendar event representation */
export interface CalendarEvent {
  id: string
  title: string
  description?: string | null
  date: string
  startTime: string
  endTime?: string | null
  type: string
  priority: string
  status: string
  link?: string | null
  project?: { id: string; title: string } | null
  assignedTo: Array<{ id: string; name: string; imageUrl: string | null }>
}


/** A personal note / to-do item */
export interface Note {
  id: string
  title: string
  description: string | null
  isCompleted: boolean
  createdAt: string
}

/** Full shape returned by GET /api/users/me/dashboard */
export interface DashboardData {
  stats: DashboardStats
  ticketsDueToday: DashboardTicket[]
  upcomingDeadlines: DashboardTicket[]
  projects: DashboardProject[]
  weeklyPerformance: WeeklyEntry[]
  alerts: {
    dueTodayCount: number
    awaitingReviewCount: number
    blockedCount: number
    reopenCount: number
  }
}
