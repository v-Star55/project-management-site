"use client"

/**
 * index.tsx  —  Member Dashboard root
 *
 * This file is intentionally thin. Its only responsibilities are:
 *   1. Fetch the dashboard data via React Query.
 *   2. Handle loading / error states.
 *   3. Pass slices of data to each focused sub-component.
 *
 * If you need to add a new section, create a component in this folder,
 * import it here, and add one line to the JSX below.
 *
 * File → component map:
 *   DashboardSkeleton        — pulse loader that mirrors the real layout
 *   AlertBanner              — "You have: 3 tasks due today …" strip
 *   StatCards                — four KPI tiles at the top
 *   WeeklyPerformanceChart   — area chart (hours + tickets, last 7 days)
 *   TicketBreakdownChart     — donut chart of ticket status distribution
 *   DueTodayCard             — tickets whose due-date is today
 *   UpcomingDeadlinesCard    — tickets due in the next 7 days
 *   ProjectsSection          — tabbed grid of active / completed projects
 *   HoursBarChart            — bar chart of daily hours logged this week
 */

import React from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle } from "lucide-react"

import { DashboardData } from "./types"
import DashboardSkeleton from "./DashboardSkeleton"
import AlertBanner from "./AlertBanner"
import StatCards from "./StatCards"
import WeeklyPerformanceChart from "./WeeklyPerformanceChart"
import TicketBreakdownChart from "./TicketBreakdownChart"
import DueTodayCard from "./DueTodayCard"
import UpcomingDeadlinesCard from "./UpcomingDeadlinesCard"
import ProjectsSection from "./ProjectsSection"
import HoursBarChart from "./HoursBarChart"
import NotesCard from "./NotesCard"
import RecentActivityCard from "./RecentActivityCard"

export default function MemberDashboard() {
  // ── Data fetching ──────────────────────────────────────────────────────────
  // staleTime of 2 min avoids re-fetching on every tab focus while still
  // ensuring the dashboard refreshes reasonably often during a workday.
  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ["memberDashboard"],
    queryFn: async () => {
      const res = await fetch("/api/users/me/dashboard")
      if (!res.ok) throw new Error("Failed to fetch dashboard data")
      return res.json()
    },
    staleTime: 1000 * 60 * 2,        // 2 minutes
    refetchOnWindowFocus: false,      // Avoid spurious refetches on tab switch
  })

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) return <DashboardSkeleton />

  // ── Error state ────────────────────────────────────────────────────────────
  if (isError || !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="size-10 text-red-400 mx-auto mb-3" />
          <p className="font-semibold text-foreground">Failed to load dashboard</p>
          <p className="text-sm text-muted-foreground mt-1">Please refresh the page</p>
        </div>
      </div>
    )
  }

  // ── Destructure API response for clean prop passing ────────────────────────
  const { stats, ticketsDueToday, upcomingDeadlines, projects, weeklyPerformance, alerts } = data

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col gap-6 p-5 md:p-7 w-full overflow-auto animate-in fade-in slide-in-from-bottom-3 duration-300">

      {/* Page title */}
      <div className="flex flex-col gap-0.5">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          My Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening with your work today
        </p>
        <AlertBanner alerts={alerts} />
      </div>

      {/* Two-column layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
        {/* Left column: 2/3 width */}
        <div className="lg:col-span-2 flex flex-col gap-6 w-full">
          {/* KPI stat cards */}
          <StatCards stats={stats} />

          {/* Charts row: area chart (2/3 width) + donut chart (1/3 width) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <WeeklyPerformanceChart data={weeklyPerformance} />
            </div>
            <div className="lg:col-span-1">
              <TicketBreakdownChart stats={stats} />
            </div>
          </div>

          {/* Due-today card + upcoming deadlines side by side on md+ screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DueTodayCard tickets={ticketsDueToday} />
            <UpcomingDeadlinesCard tickets={upcomingDeadlines} />
          </div>

          {/* Tabbed project grid */}
          <ProjectsSection projects={projects} />

          {/* Daily hours bar chart */}
          <HoursBarChart data={weeklyPerformance} />
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6 w-full lg:sticky lg:top-6">
          <RecentActivityCard />
          <NotesCard />
        </div>
      </div>

    </div>
  )
}
