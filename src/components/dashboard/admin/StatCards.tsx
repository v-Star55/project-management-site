"use client"

import React from "react"
import { Briefcase, CheckCircle2, AlertOctagon, MessageSquare, TrendingUp, Users } from "lucide-react"
import { AdminDashboardStats } from "./types"

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  gradient: string
  iconBg: string
  trend?: {
    value: number
    type: "up" | "down" | "neutral"
  }
}

function StatCard({ icon, label, value, sub, gradient, iconBg, trend }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group">
      {/* Decorative blurred blob */}
      <div
        className={`absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-2xl transition-all duration-300 group-hover:opacity-30 ${gradient}`}
      />

      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>

        {trend && trend.type !== "neutral" && (
          <span
            className={`text-xs font-semibold flex items-center gap-1 ${
              trend.type === "up" ? "text-emerald-500" : "text-rose-500"
            }`}
          >
            <TrendingUp className={`size-3.5 ${trend.type === "down" ? "rotate-180" : ""}`} />
            {trend.value}%
          </span>
        )}
      </div>

      <div>
        <p className="text-2xl font-extrabold text-foreground tracking-tight">{value}</p>
        <p className="text-xs font-medium text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground/70 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

interface StatCardsProps {
  stats: AdminDashboardStats
}

export default function StatCards({ stats }: StatCardsProps) {
  const completionRate =
    stats.totalTickets > 0 ? Math.round((stats.completedTickets / stats.totalTickets) * 100) : 0

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-4">
      <StatCard
        icon={<Briefcase className="size-5 text-emerald-500" />}
        label="Managed Projects"
        value={stats.totalProjects}
        sub={`${stats.activeProjects} Active / ${stats.completedProjects} Completed`}
        gradient="bg-emerald-500"
        iconBg="bg-emerald-500/10"
      />

      <StatCard
        icon={<Users className="size-5 text-blue-500" />}
        label="Team Members"
        value={stats.totalTickets > 0 ? "Assigned" : "0"}
        sub="Assigned to your projects"
        gradient="bg-blue-500"
        iconBg="bg-blue-500/10"
      />

      <StatCard
        icon={<CheckCircle2 className="size-5 text-indigo-500" />}
        label="Total Tasks"
        value={stats.totalTickets}
        sub={`${completionRate}% Completed (${stats.completedTickets} tasks)`}
        gradient="bg-indigo-500"
        iconBg="bg-indigo-500/10"
      />

      <StatCard
        icon={<MessageSquare className="size-5 text-amber-500" />}
        label="Open Feedbacks"
        value={stats.openFeedbacksCount}
        sub="Awaiting resolution"
        gradient="bg-amber-500"
        iconBg="bg-amber-500/10"
      />

      <StatCard
        icon={<AlertOctagon className="size-5 text-rose-500" />}
        label="Blocked Tasks"
        value={stats.blockedTickets + stats.reopenTickets}
        sub={`${stats.blockedTickets} Blocked / ${stats.reopenTickets} Reopened`}
        gradient="bg-rose-500"
        iconBg="bg-rose-500/10"
      />
    </div>
  )
}
