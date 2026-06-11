"use client"

/**
 * DueTodayCard.tsx
 *
 * Shows all tickets whose due-date falls on the current calendar day
 * and that are not yet completed. Displays a cheerful empty state
 * when the member has nothing urgent.
 */

import React from "react"
import { CalendarCheck2, CheckCircle2 } from "lucide-react"
import { DashboardTicket } from "./types"
import { PRIORITY_COLORS, STATUS_COLORS, STATUS_LABEL } from "./constants"

const getTicketCardBg = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-gradient-to-br from-emerald-500/[0.12] to-emerald-500/[0.04] dark:from-emerald-500/[0.08] dark:to-emerald-500/[0.02] border-emerald-500/25 hover:border-emerald-500/45 hover:from-emerald-500/[0.16] hover:to-emerald-500/[0.08]"
    case "in_progress":
      return "bg-gradient-to-br from-blue-500/[0.12] to-blue-500/[0.04] dark:from-blue-500/[0.08] dark:to-blue-500/[0.02] border-blue-500/25 hover:border-blue-500/45 hover:from-blue-500/[0.16] hover:to-blue-500/[0.08]"
    case "in_review":
      return "bg-gradient-to-br from-purple-500/[0.12] to-purple-500/[0.04] dark:from-purple-500/[0.08] dark:to-purple-500/[0.02] border-purple-500/25 hover:border-purple-500/45 hover:from-purple-500/[0.16] hover:to-purple-500/[0.08]"
    case "blocked":
      return "bg-gradient-to-br from-red-500/[0.12] to-red-500/[0.04] dark:from-red-500/[0.08] dark:to-red-500/[0.02] border-red-500/25 hover:border-red-500/45 hover:from-red-500/[0.16] hover:to-red-500/[0.08]"
    case "reopen":
      return "bg-gradient-to-br from-amber-500/[0.12] to-amber-500/[0.04] dark:from-amber-500/[0.08] dark:to-amber-500/[0.02] border-amber-500/25 hover:border-amber-500/45 hover:from-amber-500/[0.16] hover:to-amber-500/[0.08]"
    case "pending":
    default:
      return "bg-gradient-to-br from-stone-500/[0.12] to-stone-500/[0.04] dark:from-stone-500/[0.08] dark:to-stone-500/[0.02] border-stone-500/25 hover:border-stone-500/45 hover:from-stone-500/[0.16] hover:to-stone-500/[0.08]"
  }
}

interface DueTodayCardProps {
  tickets: DashboardTicket[]
}

/**
 * Card listing tickets due today, with priority + status pills per row.
 * Uses a subtle red tint to signal urgency without being alarming.
 */
export default function DueTodayCard({ tickets }: DueTodayCardProps) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-5 shadow-sm">
      {/* Card header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
          <CalendarCheck2 className="size-4 text-red-500" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">Due Today</h2>
          <p className="text-[11px] text-muted-foreground">
            {tickets.length === 0
              ? "You're all clear!"
              : `${tickets.length} ticket${tickets.length > 1 ? "s" : ""} to finish`}
          </p>
        </div>
      </div>

      {/* Empty state */}
      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <CheckCircle2 className="size-8 text-emerald-400 mb-2" />
          <p className="text-sm font-medium text-muted-foreground">No tickets due today 🎉</p>
        </div>
      ) : (
        /* Ticket list */
        <div className="flex flex-col gap-2">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className={`flex items-start gap-3 p-3 rounded-xl bg-card border transition-all duration-200 ${getTicketCardBg(ticket.status)}`}
            >
              {/* Title + project name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{ticket.title}</p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                  {ticket.project.title}
                </p>
              </div>

              {/* Priority + status badges */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold capitalize ${PRIORITY_COLORS[ticket.priority] ?? ""
                    }`}
                >
                  {ticket.priority}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${STATUS_COLORS[ticket.status] ?? ""
                    }`}
                >
                  {STATUS_LABEL[ticket.status] ?? ticket.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
