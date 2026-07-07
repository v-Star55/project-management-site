"use client"

import { useState } from "react";
import { AlertTriangle, CheckCircle, Flame, Users, Search } from "lucide-react";
import { ResourceWorkload } from "./types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/components/project/utils"

interface ResourceHeatmapProps {
  workload: ResourceWorkload[]
}

export default function ResourceHeatmap({ workload }: ResourceHeatmapProps) {
  const [search, setSearch] = useState("")

  const filteredWorkload = workload.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  )

  const getBurnoutBadge = (risk: ResourceWorkload["burnoutRisk"]) => {
    switch (risk) {
      case "high":
        return {
          bg: "bg-rose-500/10 text-rose-500 border-rose-500/20",
          label: "Overloaded",
          icon: <Flame className="size-3.5 text-rose-500 animate-pulse" />,
        }
      case "medium":
        return {
          bg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
          label: "On Track",
          icon: <AlertTriangle className="size-3.5 text-amber-500" />,
        }
      case "low":
        return {
          bg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
          label: "Available",
          icon: <CheckCircle className="size-3.5 text-emerald-500" />,
        }
    }
  }

  return (
    <div className="bg-card/45 backdrop-blur-md border border-border/50 rounded-3xl p-5 shadow-xs flex flex-col gap-4 max-h-[350px] overflow-hidden w-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <Users className="size-4.5 text-primary" />
            Resource Utilization
          </h2>
          <p className="text-xs text-muted-foreground">Burnout risk audit and developer capacity heatmaps</p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Search team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-background/50 border border-border/40 hover:border-border/80 focus:border-primary rounded-xl text-xs outline-none transition-all placeholder:text-muted-foreground/60 text-foreground"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 scrollbar-thin">
        {filteredWorkload.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2 border border-dashed border-border/40 rounded-2xl">
            <p className="text-xs font-bold text-foreground">No members found</p>
            <p className="text-[11px] text-muted-foreground">Team members will display here.</p>
          </div>
        ) : (
          filteredWorkload.map((user) => {
            const badge = getBurnoutBadge(user.burnoutRisk)

            return (
              <div
                key={user.id}
                className="flex items-center justify-between p-3.5 bg-background/40 hover:bg-background/80 border border-border/40 hover:border-primary/10 rounded-2xl transition-all duration-200 gap-3"
              >
                {/* Profile */}
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="size-9 rounded-full border border-border/60">
                    <AvatarImage src={user.imageUrl || undefined} alt={user.name} />
                    <AvatarFallback className="text-[10px] font-black uppercase bg-primary/10 text-primary">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-foreground truncate max-w-[130px]">
                        {user.name}
                      </span>
                      <span className="px-1.5 py-0.5 text-[8px] font-bold rounded-md bg-muted border border-border/30 capitalize text-muted-foreground">
                        {user.role}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-semibold truncate block mt-0.5">
                      {user.designation || "Team Member"}
                    </span>
                  </div>
                </div>

                {/* Utilization specs */}
                <div className="flex items-center gap-5 shrink-0">
                  <div className="text-center min-w-[50px] hidden sm:block">
                    <p className="text-xs font-black text-foreground">{user.activeTicketsCount}</p>
                    <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
                      Tasks
                    </p>
                  </div>

                  <div className="text-center min-w-[55px] hidden sm:block">
                    <p className="text-xs font-black text-foreground">{user.weeklyHours}h</p>
                    <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
                      This Week
                    </p>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border flex items-center gap-1 shrink-0 ${badge.bg}`}>
                    {badge.icon}
                    {badge.label}
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
