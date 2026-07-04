"use client"

import React from "react"
import { MessageSquare, ArrowUpRight, Check, AlertCircle, XCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AdminFeedback } from "./types"
import { FEEDBACK_PRIORITY_COLORS, FEEDBACK_STATUS_COLORS } from "./constants"

interface OpenFeedbackCardProps {
  feedbacks: AdminFeedback[]
  userId?: string
}

export default function OpenFeedbackCard({ feedbacks, userId }: OpenFeedbackCardProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const defaultAvatar = "https://github.com/shadcn.png"

  return (
    <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm flex flex-col gap-4 h-[350px]">
      <div>
        <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
          <MessageSquare className="size-4.5 text-amber-500" />
          Open Feedback Logs
        </h3>
        <p className="text-xs text-muted-foreground">Unresolved bug reports and client queries</p>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
        {feedbacks.length === 0 ? (
          <div className="text-center py-10 bg-muted/15 border border-dashed border-border/30 rounded-2xl">
            <Check className="size-6 text-emerald-500/40 mx-auto mb-1.5" />
            <p className="text-[11px] text-muted-foreground italic">No open feedbacks pending</p>
          </div>
        ) : (
          feedbacks.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl border border-border bg-muted/10 hover:bg-muted/30 transition-all flex flex-col gap-2"
            >
              {/* Header row: Project & Priority Badge */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider truncate max-w-[130px]">
                  {item.project?.title || "General"}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge
                    variant="outline"
                    className={`text-[8px] py-0 px-1 border uppercase font-extrabold ${FEEDBACK_PRIORITY_COLORS[item.priority] || ""
                      }`}
                  >
                    {item.priority}
                  </Badge>
                  <Badge
                    className={`text-[8px] py-0 px-1 border uppercase font-bold ${FEEDBACK_STATUS_COLORS[item.status] || ""
                      }`}
                  >
                    {item.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>

              {/* Subject Title & Link */}
              <div className="flex justify-between items-start gap-2">
                <a
                  href={`/dashboard/${userId}/feedback`}
                  className="text-xs font-bold text-foreground hover:text-primary transition-colors hover:underline line-clamp-1"
                >
                  {item.subject}
                </a>
                <a
                  href={`/dashboard/${userId}/feedback`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowUpRight className="size-3.5" />
                </a>
              </div>

              {/* Short snippet */}
              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                {item.description}
              </p>

              {/* Footer: Submitter info and Date */}
              <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border/20 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Avatar className="size-4.5 border border-border">
                    <AvatarImage src={item.user.imageUrl || defaultAvatar} />
                    <AvatarFallback className="text-[7px] font-bold">
                      {item.user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold truncate max-w-[80px] text-foreground/80">
                    {item.user.name}
                  </span>
                </div>
                <span className="font-medium whitespace-nowrap">{formatDate(item.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
