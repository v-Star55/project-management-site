"use client"


import { MessageSquare, Calendar } from "lucide-react";
import { OwnerFeedback } from "./types"
import { useRouter } from "next/navigation"

interface ClientFeedbackWidgetProps {
  feedbacks: OwnerFeedback[]
  userId: string
}

export default function ClientFeedbackWidget({ feedbacks, userId }: ClientFeedbackWidgetProps) {
  const router = useRouter()

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
      case "high":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20"
      case "medium":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      default:
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    }
  }

  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return "bg-muted text-muted-foreground border-border/30"
    switch (status.toLowerCase()) {
      case "resolved":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "in_progress":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      default:
        return "bg-muted text-muted-foreground border-border/30"
    }
  }

  return (
    <div className="bg-card/45 backdrop-blur-md border border-border/50 rounded-3xl p-5 shadow-xs flex flex-col gap-4 h-[320px] overflow-hidden w-full">
      <div className="flex justify-between items-center pb-1">
        <div>
          <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <MessageSquare className="size-4.5 text-primary" />
            Client Satisfaction Hub
          </h2>
          <p className="text-xs text-muted-foreground">Feedback feed and client satisfaction logs</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
        {feedbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2 border border-dashed border-border/40 rounded-2xl">
            <p className="text-xs font-bold text-foreground">No client feedback found</p>
            <p className="text-[11px] text-muted-foreground">Clients will submit reviews here.</p>
          </div>
        ) : (
          feedbacks.map((feedback) => (
            <div
              key={feedback.id}
              onClick={() => router.push(`/dashboard/${userId}/feedback`)}
              className="p-3.5 bg-background/40 hover:bg-background/80 border border-border/40 hover:border-primary/10 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col gap-2.5 group"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-extrabold text-foreground group-hover:text-primary transition-colors truncate max-w-[200px]">
                  {feedback.subject}
                </span>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`px-1.5 py-0.5 text-[8px] font-black rounded-md border uppercase tracking-wider ${getPriorityColor(feedback.priority)}`}>
                    {feedback.priority}
                  </span>
                  {feedback.status && (
                    <span className={`px-1.5 py-0.5 text-[8px] font-black rounded-md border uppercase tracking-wider ${getStatusColor(feedback.status)}`}>
                      {feedback.status.replace("_", " ")}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-[11px] text-muted-foreground/90 line-clamp-2 leading-relaxed">
                {feedback.description}
              </p>

              {/* Footer */}
              <div className="flex justify-between items-center gap-2 border-t border-border/30 pt-2 mt-0.5 text-[10px] text-muted-foreground font-semibold">
                <span className="truncate">
                  Project: <span className="text-foreground">{feedback.project?.title || "General"}</span>
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  <Calendar className="size-3" />
                  {new Date(feedback.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
