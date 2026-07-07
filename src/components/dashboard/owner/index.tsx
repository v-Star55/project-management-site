"use client"

import { useRef } from "react";
import { useQuery } from "@tanstack/react-query"
import { AlertCircle } from "lucide-react"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"

import { OwnerDashboardData } from "./types"
import DashboardSkeleton from "../admin/DashboardSkeleton"
import OwnerStatCards from "./OwnerStatCards"
import WeeklyDigestStrip from "./WeeklyDigestStrip"
import OwnerKpiPills from "./OwnerKpiPills"
import PortfolioHealthMatrix from "./PortfolioHealthMatrix"
import ResourceHeatmap from "./ResourceHeatmap"
import EstimateVsActualChart from "./EstimateVsActualChart"
import ClientFeedbackWidget from "./ClientFeedbackWidget"
import ExecutiveNotesWidget from "./ExecutiveNotesWidget"
import AuditLogWidget from "./AuditLogWidget"
import NotesReminderBanner from "./NotesReminderBanner"

export default function OwnerDashboard() {
  const user = useSelector((state: RootState) => state.user.user)
  const notesRef = useRef<HTMLDivElement>(null)

  const scrollToNotes = () => {
    notesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  const { data, isLoading, isError, error } = useQuery<OwnerDashboardData>({
    queryKey: ["ownerDashboard"],
    queryFn: async () => {
      const res = await fetch("/api/owner/dashboard")
      if (!res.ok) throw new Error("Failed to fetch owner command center analytics")
      return res.json()
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
  })

  if (isLoading) return <DashboardSkeleton />

  if (isError || !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <AlertCircle className="size-10 text-rose-500 mx-auto mb-3" />
          <p className="font-bold text-foreground">Failed to load owner dashboard</p>
          <p className="text-xs text-muted-foreground mt-1.5">
            {error instanceof Error ? error.message : "Please check your network connection or verify authorization."}
          </p>
        </div>
      </div>
    )
  }

  const { stats, projects, weeklyDigest, notes, resourceWorkload, estimateVsActualData, feedbacks, auditLogs } = data

  return (
    <div className="flex-1 flex flex-col gap-6 p-5 md:p-7 w-full overflow-auto animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Greetings Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground bg-clip-text bg-gradient-to-r from-primary to-blue-500">
          Executive Command Center
        </h1>
        <p className="text-sm text-muted-foreground leading-normal">
          Company-wide operational digest, resource utilization, and portfolio analytics at{" "}
          <span className="font-bold text-foreground">{user?.company?.name || "your workspace"}</span>
        </p>
      </div>

      {/* Notes Reminder Banner */}
      <NotesReminderBanner notes={notes} onScrollToNotes={scrollToNotes} />

      {/* KPI Pills Banner */}
      <OwnerKpiPills stats={stats} />

      {/* Week-over-Week Performance Digest Strip */}
      <WeeklyDigestStrip digest={weeklyDigest} />

      {/* KPI Stats cards */}
      <OwnerStatCards stats={stats} />

      {/* Main 2-column layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch w-full">
        {/* Left Column (Portfolio health & Estimate vs Reality) */}
        <div className="flex flex-col gap-6 w-full">
          <PortfolioHealthMatrix projects={projects} userId={user?.id || ""} />
          <EstimateVsActualChart data={estimateVsActualData} />
        </div>

        {/* Right Column (Resource allocation, Feedback Hub, Sticky notes) */}
        <div className="flex flex-col gap-6 w-full">
          <ResourceHeatmap workload={resourceWorkload} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <ClientFeedbackWidget feedbacks={feedbacks} userId={user?.id || ""} />
            <div ref={notesRef}>
              <ExecutiveNotesWidget notes={notes} />
            </div>
          </div>
        </div>
      </div>

      {/* Full Width Bottom Section (Global System Audits) */}
      <AuditLogWidget logs={auditLogs} />
    </div>
  )
}
