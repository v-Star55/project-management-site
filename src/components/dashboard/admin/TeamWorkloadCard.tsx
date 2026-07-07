"use client"

import { useState, useMemo } from "react";
import { Users, Search, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AdminTeamWorkload } from "./types"

interface TeamWorkloadCardProps {
  teamWorkload: AdminTeamWorkload[]
}

export default function TeamWorkloadCard({ teamWorkload }: TeamWorkloadCardProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredWorkload = useMemo(() => {
    return teamWorkload.filter(
      (member) =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.designation && member.designation.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [teamWorkload, searchQuery])

  const defaultAvatar = "https://github.com/shadcn.png"

  return (
    <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm flex flex-col gap-4 h-full">
      <div>
        <h3 className="text-base font-bold text-foreground">Team Workload Allocation</h3>
        <p className="text-xs text-muted-foreground">Active ticket counts and estimate loads</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Filter team..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-muted/30 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
        />
      </div>

      {/* Workload Roster */}
      <div className="flex-1 overflow-y-auto max-h-[300px] pr-1 space-y-3">
        {filteredWorkload.length === 0 ? (
          <div className="text-center py-10 bg-muted/15 border border-dashed border-border/30 rounded-2xl">
            <Users className="size-6 text-muted-foreground/30 mx-auto mb-1.5" />
            <p className="text-[11px] text-muted-foreground italic">No team members found</p>
          </div>
        ) : (
          filteredWorkload.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/30 transition-all gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar className="size-8 border border-border/60 shrink-0">
                  <AvatarImage src={member.imageUrl || defaultAvatar} />
                  <AvatarFallback className="text-xs font-extrabold">
                    {member.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex flex-col">
                  <span className="text-xs font-bold text-foreground truncate">{member.name}</span>
                  <span className="text-[10px] text-muted-foreground truncate capitalize">
                    {member.designation || member.role}
                  </span>
                </div>
              </div>

              {/* Status and estimates breakdown */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Active Tickets */}
                <div className="flex flex-col items-end">
                  <Badge
                    variant="outline"
                    className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                      member.activeTicketsCount > 4
                        ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30"
                        : member.activeTicketsCount > 0
                        ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30"
                        : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800/30"
                    }`}
                  >
                    {member.activeTicketsCount} Tasks
                  </Badge>
                  {member.estimatedHours > 0 && (
                    <span className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-0.5">
                      <Clock className="size-2.5" />
                      {member.estimatedHours}h est
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
