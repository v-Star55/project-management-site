"use client"

/**
 * UpcomingDeadlinesCard.tsx
 *
 * Lists tickets whose due-date falls within the next 7 days (excluding today).
 * Each row shows a countdown badge ("3d left"), the ticket title,
 * the project name, and the formatted deadline date.
 */

import React from "react"
import { CalendarClock, Target } from "lucide-react"
import { DashboardTicket } from "./types"
import { formatDate, daysUntil } from "./utils"

interface UpcomingDeadlinesCardProps {
  tickets: DashboardTicket[]
}

/**
 * Card listing upcoming deadlines sorted by due-date ascending.
 * Uses a warm amber tint to signal time-sensitivity without urgency.
 */
export default function UpcomingDeadlinesCard({ tickets }: UpcomingDeadlinesCardProps) {
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-5 shadow-sm">
      {/* Card header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <CalendarClock className="size-4 text-amber-500" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">Upcoming Deadlines</h2>
          <p className="text-[11px] text-muted-foreground">Next 7 days</p>
        </div>
      </div>

      {/* Empty state */}
      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Target className="size-8 text-emerald-400 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">No upcoming deadlines</p>
        </div>
      ) : (
        /* Deadline list */
        <div className="flex flex-col gap-2">
          {tickets.map((ticket) => {
            // Calculate days remaining for the countdown badge
            const days = daysUntil(ticket.dueDate)

            return (
              <div
                key={ticket.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/40 hover:border-amber-500/30 transition-colors duration-200"
              >
                {/* Countdown badge */}
                <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center bg-amber-500/10 shrink-0">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 leading-none">
                    {days !== null ? `${days}d` : "—"}
                  </span>
                  <span className="text-[9px] text-amber-500/60">left</span>
                </div>

                {/* Ticket title + project */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{ticket.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {ticket.project.title}
                  </p>
                </div>

                {/* Formatted due date */}
                <div className="shrink-0 text-[11px] text-muted-foreground">
                  {formatDate(ticket.dueDate)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
