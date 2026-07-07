"use client"


import { CheckCircle2, Clock, ClipboardList, PlayCircle } from "lucide-react";
import { OwnerDashboardStats } from "./types"

interface OwnerKpiPillsProps {
  stats: OwnerDashboardStats
}

export default function OwnerKpiPills({ stats }: OwnerKpiPillsProps) {
  const globalProgress =
    stats.totalCompanyTickets > 0
      ? Math.round((stats.completedCompanyTickets / stats.totalCompanyTickets) * 100)
      : 0

  const hoursProgress =
    stats.totalEstimatedHours > 0
      ? Math.round((stats.totalLoggedHours / stats.totalEstimatedHours) * 100)
      : 0

  return (
    <div className="w-full">
      <div className="w-full rounded-full border border-border/80 bg-muted/40 px-6 py-4 flex flex-wrap items-center justify-between md:justify-start gap-y-3 gap-x-6 shadow-xs text-xs font-medium">
        
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-primary" />
          <span className="text-foreground">
            <strong className="font-extrabold text-sm">{stats.totalCompanyTickets}</strong>{" "}
            <span className="text-muted-foreground font-semibold">Total Tickets</span>
          </span>
        </div>

        <div className="hidden md:block w-px h-4 bg-border/60" />

        <div className="flex items-center gap-2">
          <PlayCircle className="size-4 text-blue-500" />
          <span className="text-foreground">
            <strong className="font-extrabold text-sm">{stats.inProgressCompanyTickets}</strong>{" "}
            <span className="text-muted-foreground font-semibold">In Progress</span>
          </span>
        </div>

        <div className="hidden md:block w-px h-4 bg-border/60" />

        <div className="flex items-center gap-2">
          <Clock className="size-4 text-sky-500" />
          <span className="text-foreground">
            <strong className="font-extrabold text-sm">{stats.inReviewCompanyTickets}</strong>{" "}
            <span className="text-muted-foreground font-semibold">In Review</span>
          </span>
        </div>

        <div className="hidden md:block w-px h-4 bg-border/60" />

        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-500" />
          <span className="text-foreground">
            <strong className="font-extrabold text-sm">{stats.completedCompanyTickets}</strong>{" "}
            <span className="text-muted-foreground font-semibold">Completed ({globalProgress}%)</span>
          </span>
        </div>



      </div>
    </div>
  )
}
