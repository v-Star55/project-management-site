"use client"

import { useState } from "react";
import { ShieldAlert, Plus, Trash2, Edit3, ClipboardList, UserCheck } from "lucide-react";
import { AuditLogItem } from "./types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/components/project/utils"

interface AuditLogWidgetProps {
  logs: AuditLogItem[]
}

export default function AuditLogWidget({ logs }: AuditLogWidgetProps) {
  const [filter, setFilter] = useState<"all" | "high_risk" | "updates">("all")

  const getActionIcon = (action: string) => {
    const act = action.toUpperCase()
    if (act.includes("DELETE") || act.includes("REMOVED") || act.includes("ARCHIVED")) {
      return <Trash2 className="size-3.5 text-rose-500" />
    }
    if (act.includes("CREATE") || act.includes("INVITED") || act.includes("JOINED")) {
      return <Plus className="size-3.5 text-emerald-500" />
    }
    if (act.includes("ROLE") || act.includes("ASSIGNED")) {
      return <UserCheck className="size-3.5 text-blue-500" />
    }
    if (act.includes("UPDATE") || act.includes("CHANGED") || act.includes("MOVED")) {
      return <Edit3 className="size-3.5 text-amber-500" />
    }
    return <ClipboardList className="size-3.5 text-indigo-500" />
  }

  const getActionLabel = (action: string) => {
    return action.toLowerCase().replace(/_/g, " ")
  }

  const filteredLogs = logs.filter((log) => {
    if (filter === "high_risk") {
      const act = log.action.toUpperCase()
      return act.includes("DELETE") || act.includes("REMOVE") || act.includes("ROLE") || act.includes("ARCHIVED")
    }
    if (filter === "updates") {
      return log.action.toUpperCase().includes("UPDATE") || log.action.toUpperCase().includes("CHANGED")
    }
    return true
  })

  return (
    <div className="bg-card/45 backdrop-blur-md border border-border/50 rounded-3xl p-5 shadow-xs flex flex-col gap-4 w-full h-[350px] overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <ShieldAlert className="size-4.5 text-primary" />
            Executive Activity Audit Log
          </h2>
          <p className="text-xs text-muted-foreground">Company-wide operational event log auditing</p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-1 bg-background/50 border border-border/40 p-0.5 rounded-xl text-[10px] font-bold text-muted-foreground self-start sm:self-auto shrink-0">
          <button
            onClick={() => setFilter("all")}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              filter === "all" ? "bg-primary text-primary-foreground shadow-inner" : "hover:text-foreground"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("high_risk")}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              filter === "high_risk" ? "bg-primary text-primary-foreground shadow-inner" : "hover:text-foreground"
            }`}
          >
            Admin Deletions
          </button>
          <button
            onClick={() => setFilter("updates")}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              filter === "updates" ? "bg-primary text-primary-foreground shadow-inner" : "hover:text-foreground"
            }`}
          >
            Updates
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 scrollbar-thin">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2 border border-dashed border-border/40 rounded-2xl">
            <p className="text-xs font-bold text-foreground">No activities found</p>
            <p className="text-[11px] text-muted-foreground">Recent changes will display in this feed.</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start justify-between gap-3 p-3 bg-background/25 border border-border/30 rounded-2xl hover:bg-background/55 transition-all duration-200"
            >
              {/* Profile & description */}
              <div className="flex items-start gap-3 min-w-0">
                <Avatar className="size-8 rounded-full border border-border/60 shrink-0 mt-0.5">
                  <AvatarImage src={log.user.imageUrl || undefined} alt={log.user.name} />
                  <AvatarFallback className="text-[9px] font-black uppercase bg-primary/10 text-primary">
                    {getInitials(log.user.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 text-xs">
                  <p className="font-extrabold text-foreground leading-normal">
                    {log.user.name}{" "}
                    <span className="font-bold text-primary/95 capitalize">
                      {getActionLabel(log.action)}
                    </span>
                  </p>
                  {log.description && (
                    <p className="text-[11px] text-muted-foreground/80 mt-1 leading-relaxed">
                      {log.description}
                    </p>
                  )}
                  {log.targetUser && (
                    <span className="inline-block mt-1 text-[10px] text-muted-foreground font-semibold px-2 py-0.5 bg-muted rounded-md border border-border/30">
                      Target User: {log.targetUser.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Action icon / timestamp */}
              <div className="flex flex-col items-end shrink-0 gap-2">
                <div className="size-6 rounded-lg bg-background border border-border/40 flex items-center justify-center shadow-inner">
                  {getActionIcon(log.action)}
                </div>
                <span className="text-[9px] text-muted-foreground/75 font-semibold">
                  {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
