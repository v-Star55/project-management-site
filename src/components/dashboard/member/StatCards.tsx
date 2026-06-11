"use client"

/**
 * StatCards.tsx
 *
 * Renders the row of four KPI summary cards at the top of the dashboard:
 *   • Total Projects
 *   • Total Projects
 *   • Tickets Completed
 *   • In Progress
 *   • Hours Logged
 *
 * Each card receives an icon, colour tokens, and the numeric value.
 * The decorative gradient blob in the top-right corner is purely cosmetic.
 */

import React from "react"
import { Briefcase, CheckCircle2, Clock, Timer, TrendingUp } from "lucide-react"
import { DashboardStats } from "./types"

// ─── Individual card props ───────────────────────────────────────────────────
interface StatCardProps {
  /** Icon element rendered inside the coloured pill */
  icon: React.ReactNode
  /** Short metric label shown below the value */
  label: string
  /** Primary value — bold and large */
  value: string | number
  /** Secondary line in smaller muted text */
  sub?: string
  /** Tailwind bg-* class for the decorative blur blob */
  gradient: string
  /** Tailwind bg-* class for the icon container */
  iconBg: string
  /** Optional percentage trend. Positive → green arrow, negative → red */
  trend?: number
}

/** A single KPI card with a gradient blob, icon, value, and optional trend */
function StatCard({ icon, label, value, sub, gradient, iconBg, trend }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group">
      {/* Decorative blurred colour blob — gives each card a subtle tint */}
      <div
        className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-2xl transition-all duration-300 group-hover:opacity-30 ${gradient}`}
      />

      {/* Icon + optional trend badge */}
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>

        {trend !== undefined && (
          <span
            className={`text-xs font-semibold flex items-center gap-1 ${
              trend >= 0 ? "text-emerald-500" : "text-red-500"
            }`}
          >
            <TrendingUp className={`size-3 ${trend < 0 ? "rotate-180" : ""}`} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      {/* Value + label */}
      <div>
        <p className="text-2xl font-extrabold text-foreground tracking-tight">{value}</p>
        <p className="text-xs font-medium text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground/70 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Exported section ─────────────────────────────────────────────────────────

interface StatCardsProps {
  stats: DashboardStats
}

/**
 * Renders the four top-level KPI cards in a responsive grid.
 * Receives the full stats object from the dashboard API.
 */
export default function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <StatCard
        icon={<Briefcase className="size-5 text-emerald-500" />}
        label="Total Projects"
        value={stats.totalProjects}
        sub="Projects you're assigned to"
        gradient="bg-emerald-500"
        iconBg="bg-emerald-500/10"
      />
      <StatCard
        icon={<CheckCircle2 className="size-5 text-blue-500" />}
        label="Tickets Completed"
        value={stats.completedTickets}
        sub={`of ${stats.totalTickets} total tickets`}
        gradient="bg-blue-500"
        iconBg="bg-blue-500/10"
      />
      <StatCard
        icon={<Clock className="size-5 text-purple-500" />}
        label="In Progress"
        value={stats.inProgressTickets}
        sub={`${stats.inReviewTickets} awaiting review`}
        gradient="bg-purple-500"
        iconBg="bg-purple-500/10"
      />
      <StatCard
        icon={<Timer className="size-5 text-amber-500" />}
        label="Hours Logged"
        value={`${stats.totalHours}h`}
        sub={`${stats.todayHours}h today`}
        gradient="bg-amber-500"
        iconBg="bg-amber-500/10"
      />
    </div>
  )
}
