"use client"

import React from "react"
import { Clock, ArrowUpRight, User, AlertTriangle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AdminOverdueTicket } from "./types"
import { TICKET_PRIORITY_COLORS, TICKET_STATUS_COLORS } from "./constants"

interface OverdueTasksCardProps {
  tickets: AdminOverdueTicket[]
  userId?: string
}

/**
 * Shows tasks that are past their due date but not yet completed.
 * Sorted by how overdue they are (most overdue first).
 */
export default function OverdueTasksCard({ tickets, userId }: OverdueTasksCardProps) {
  const daysOverdue = (dateStr: string | null) => {
    if (!dateStr) return null
    const due = new Date(dateStr)
    const now = new Date()
    return Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
  }

  const formatDateString = (dateStr: string | null) => {
    if (!dateStr) return "No due date"
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const defaultAvatar = "https://github.com/shadcn.png"

  return (
    <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
            <Clock className="size-4.5 text-orange-500" />
            Overdue Tasks
          </h3>
          <p className="text-xs text-muted-foreground">Tasks past their deadline</p>
        </div>
        {tickets.length > 0 && (
          <Badge
            variant="outline"
            className="text-[10px] font-extrabold bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
          >
            {tickets.length} overdue
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-y-auto max-h-[300px] pr-1 space-y-3">
        {tickets.length === 0 ? (
          <div className="text-center py-10 bg-muted/15 border border-dashed border-border/30 rounded-2xl">
            <Clock className="size-6 text-emerald-500/40 mx-auto mb-1.5" />
            <p className="text-[11px] text-muted-foreground italic">All tasks are on schedule!</p>
          </div>
        ) : (
          tickets.map((ticket) => {
            const overdueDays = daysOverdue(ticket.dueDate)
            const isUrgent = overdueDays !== null && overdueDays > 3

            return (
              <div
                key={ticket.id}
                className={`p-3.5 rounded-xl border flex flex-col gap-2.5 transition-all ${
                  isUrgent
                    ? "bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10"
                    : "bg-orange-500/5 border-orange-500/20 hover:bg-orange-500/10"
                }`}
              >
                {/* Header row: Project & Overdue Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider truncate max-w-[150px]">
                    {ticket.project.title}
                  </span>
                  <div className="flex items-center gap-1">
                    <Badge
                      className={`text-[9px] py-0 px-1.5 rounded-md font-bold border ${
                        isUrgent
                          ? "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400"
                          : "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400"
                      }`}
                    >
                      <AlertTriangle className="size-2.5 mr-0.5" />
                      {overdueDays !== null ? `${overdueDays}d overdue` : "Overdue"}
                    </Badge>
                  </div>
                </div>

                {/* Ticket Title & Link */}
                <div className="flex justify-between items-start gap-2">
                  <a
                    href={`/dashboard/${userId}/projects/${ticket.projectId}?tab=board`}
                    className="text-xs font-bold text-foreground hover:text-primary transition-colors hover:underline line-clamp-1 leading-snug"
                  >
                    {ticket.title}
                  </a>
                  <a
                    href={`/dashboard/${userId}/projects/${ticket.projectId}?tab=board`}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ArrowUpRight className="size-3.5" />
                  </a>
                </div>

                {/* Footer (Assignee, priority, due date) */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/20 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    {ticket.assignedUser ? (
                      <>
                        <Avatar className="size-4.5 border border-border">
                          <AvatarImage src={ticket.assignedUser.imageUrl || defaultAvatar} />
                          <AvatarFallback className="text-[7px] font-bold">
                            {ticket.assignedUser.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-muted-foreground font-semibold truncate max-w-[80px]">
                          {ticket.assignedUser.name}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground italic flex items-center gap-0.5">
                        <User className="size-3" />
                        Unassigned
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[8px] py-0 px-1 border uppercase font-extrabold ${
                        TICKET_PRIORITY_COLORS[ticket.priority] || ""
                      }`}
                    >
                      {ticket.priority}
                    </Badge>
                    <span className="text-muted-foreground font-medium whitespace-nowrap line-through decoration-rose-400/60">
                      {formatDateString(ticket.dueDate)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
