"use client"


import { CalendarClock, Target } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AdminUpcomingDeadline } from "./types"
import { TICKET_PRIORITY_COLORS } from "./constants"

interface UpcomingDeadlinesCardProps {
  deadlines: AdminUpcomingDeadline[]
  userId?: string
}

/**
 * Lists tickets whose due date falls within the next 7 days.
 * Each row shows a countdown badge, ticket title, project name,
 * assigned user, and priority.
 */
export default function UpcomingDeadlinesCard({ deadlines, userId }: UpcomingDeadlinesCardProps) {
  const daysUntil = (dateStr: string | null): number | null => {
    if (!dateStr) return null
    const now = new Date()
    const due = new Date(dateStr)
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  const formatDateString = (dateStr: string | null) => {
    if (!dateStr) return "—"
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
            <CalendarClock className="size-4.5 text-amber-500" />
            Upcoming Deadlines
          </h3>
          <p className="text-xs text-muted-foreground">Tasks due within the next 7 days</p>
        </div>
        {deadlines.length > 0 && (
          <Badge
            variant="outline"
            className="text-[10px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
          >
            {deadlines.length} upcoming
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-y-auto max-h-[300px] pr-1 space-y-2.5">
        {deadlines.length === 0 ? (
          <div className="text-center py-10 bg-muted/15 border border-dashed border-border/30 rounded-2xl">
            <Target className="size-6 text-emerald-500/40 mx-auto mb-1.5" />
            <p className="text-[11px] text-muted-foreground italic">No deadlines in the next 7 days</p>
          </div>
        ) : (
          deadlines.map((ticket) => {
            const days = daysUntil(ticket.dueDate)
            const isToday = days !== null && days <= 0
            const isSoon = days !== null && days <= 2

            return (
              <div
                key={ticket.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors duration-200 ${
                  isToday
                    ? "border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10"
                    : isSoon
                    ? "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10"
                    : "border-border/40 bg-card hover:border-amber-500/30 hover:bg-muted/20"
                }`}
              >
                {/* Countdown badge */}
                <div
                  className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                    isToday
                      ? "bg-rose-500/15"
                      : isSoon
                      ? "bg-amber-500/15"
                      : "bg-amber-500/10"
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold leading-none ${
                      isToday
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {days !== null ? (isToday ? "Today" : `${days}d`) : "—"}
                  </span>
                  {!isToday && (
                    <span className="text-[9px] text-amber-500/60">left</span>
                  )}
                </div>

                {/* Ticket details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`/dashboard/${userId}/projects/${ticket.projectId}?tab=board`}
                      className="text-xs font-bold text-foreground hover:text-primary transition-colors hover:underline truncate"
                    >
                      {ticket.title}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground truncate">
                      {ticket.project.title}
                    </span>
                    {ticket.assignedUser && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Avatar className="size-3.5 border border-border">
                          <AvatarImage src={ticket.assignedUser.imageUrl || defaultAvatar} />
                          <AvatarFallback className="text-[6px] font-bold">
                            {ticket.assignedUser.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[9px] text-muted-foreground truncate max-w-[60px]">
                          {ticket.assignedUser.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: priority & date */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge
                    variant="outline"
                    className={`text-[8px] py-0 px-1 border uppercase font-extrabold ${
                      TICKET_PRIORITY_COLORS[ticket.priority] || ""
                    }`}
                  >
                    {ticket.priority}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {formatDateString(ticket.dueDate)}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
