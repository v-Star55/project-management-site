"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertCircle } from "lucide-react"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"

import { AdminDashboardData } from "./types"
import DashboardSkeleton from "./DashboardSkeleton"
import StatCards from "./StatCards"
import WeeklyTrendsChart from "./WeeklyTrendsChart"
import ProjectSprintCard from "./ProjectSprintCard"
import TicketDistributionChart from "./TicketDistributionChart"
import TeamWorkloadCard from "./TeamWorkloadCard"
import BlockedTicketsCard from "./BlockedTicketsCard"
import OpenFeedbackCard from "./OpenFeedbackCard"
import OverdueTasksCard from "./OverdueTasksCard"
import UpcomingDeadlinesCard from "./UpcomingDeadlinesCard"
import RecentActivityCard from "../member/RecentActivityCard"

export default function AdminDashboard() {
  const user = useSelector((state: RootState) => state.user.user)

  const { data, isLoading, isError, error } = useQuery<AdminDashboardData>({
    queryKey: ["adminDashboard"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard")
      if (!res.ok) throw new Error("Failed to fetch admin dashboard analytics")
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
          <p className="font-bold text-foreground">Failed to load admin dashboard</p>
          <p className="text-xs text-muted-foreground mt-1.5">
            {error instanceof Error ? error.message : "Please check your network connection or verify authorization."}
          </p>
        </div>
      </div>
    )
  }

  const { stats, projects, blockedOrReopenedTickets, openFeedbacks, overdueTickets, upcomingDeadlines, teamWorkload, weeklyPerformance } = data

  return (
    <div className="flex-1 flex flex-col gap-6 p-5 md:p-7 w-full overflow-auto animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Greetings Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          Admin Command Center
        </h1>
        <p className="text-sm text-muted-foreground leading-normal">
          Oversight summary for assigned projects, estimates tracking, active sprints and workloads at{" "}
          <span className="font-bold text-foreground">{user?.company?.name || "your workspace"}</span>
        </p>
      </div>

      {/* KPI Stats cards */}
      <StatCards stats={stats} />

      {/* Main 2-column layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch w-full">
        {/* Left column (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-6 w-full">
          {/* Weekly Performance trends */}
          <WeeklyTrendsChart data={weeklyPerformance} />

          {/* Overdue tasks + upcoming deadlines side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <OverdueTasksCard tickets={overdueTickets} userId={user?.id} />
            <UpcomingDeadlinesCard deadlines={upcomingDeadlines} userId={user?.id} />
          </div>

          {/* Assigned projects list + active sprint */}
          <ProjectSprintCard projects={projects} userId={user?.id} />

          {/* Team workload overview — stretches to fill remaining left column height */}
          <div className="flex-1 flex flex-col min-h-[350px]">
            <TeamWorkloadCard teamWorkload={teamWorkload} />
          </div>
        </div>

        {/* Right column (1/3 width) */}
        <div className="lg:col-span-1 flex flex-col gap-6 w-full">
          {/* Ticket distribution pie chart */}
          <TicketDistributionChart stats={stats} />

          {/* Blocked or reopened tickets needing attention */}
          <BlockedTicketsCard tickets={blockedOrReopenedTickets} userId={user?.id} />

          {/* Open feedbacks backlog */}
          <OpenFeedbackCard feedbacks={openFeedbacks} userId={user?.id} />

          {/* Recent Activity Feed — stretches to fill remaining right column height */}
          <RecentActivityCard className="flex-1 min-h-[350px]" />
        </div>
      </div>
    </div>
  )
}
