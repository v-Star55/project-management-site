"use client"

import React from "react"
import { AlertCircle, ArrowUpRight, HelpCircle, User, RefreshCw, XCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AdminBlockedTicket } from "./types"
import { TICKET_PRIORITY_COLORS } from "./constants"

interface BlockedTicketsCardProps {
  tickets: AdminBlockedTicket[]
  userId?: string
}

export default function BlockedTicketsCard({ tickets, userId }: BlockedTicketsCardProps) {
  const formatDateString = (dateStr: string | null) => {
    if (!dateStr) return "No due date"
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const defaultAvatar = "https://github.com/shadcn.png"

  return (
    <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm flex flex-col gap-4 h-[350px]">
      <div>
        <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
          <AlertCircle className="size-4.5 text-rose-500" />
          Attention Required
        </h3>
        <p className="text-xs text-muted-foreground">Blocked or reopened tasks blocking progress</p>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-3.5">
        {tickets.length === 0 ? (
          <div className="text-center py-10 bg-muted/15 border border-dashed border-border/30 rounded-2xl">
            <XCircle className="size-6 text-emerald-500/40 mx-auto mb-1.5" />
            <p className="text-[11px] text-muted-foreground italic">No blocked or reopened tasks</p>
          </div>
        ) : (
          tickets.map((ticket) => {
            const isBlocked = ticket.status === "blocked"
            const reason = isBlocked ? ticket.reasonBlocked : ticket.reasonReopen
            const title = isBlocked ? "Blocked Reason" : "Reopen Reason"

            return (
              <div
                key={ticket.id}
                className={`p-3.5 rounded-xl border flex flex-col gap-2.5 transition-all ${isBlocked
                  ? "bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10"
                  : "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10"
                  }`}
              >
                {/* Header row: Project & Status Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider truncate max-w-[150px]">
                    {ticket.project.title}
                  </span>
                  <Badge
                    className={`text-[9px] py-0 px-1.5 rounded-md uppercase font-bold border ${isBlocked
                      ? "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400"
                      : "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400"
                      }`}
                  >
                    {isBlocked ? "Blocked" : "Reopened"}
                  </Badge>
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

                {/* Reason description */}
                {reason && (
                  <div className="p-2 rounded-lg bg-card/65 border border-border/30 text-[11px] leading-relaxed">
                    <p className="font-bold text-foreground/80 mb-0.5">{title}:</p>
                    <p className="text-muted-foreground italic">"{reason}"</p>
                  </div>
                )}

                {/* Footer specs (Assignee, priority, due date) */}
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
                      className={`text-[8px] py-0 px-1 border uppercase font-extrabold ${TICKET_PRIORITY_COLORS[ticket.priority] || ""
                        }`}
                    >
                      {ticket.priority}
                    </Badge>
                    <span className="text-muted-foreground font-medium whitespace-nowrap">
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
