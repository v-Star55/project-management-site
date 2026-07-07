"use client"

import React from "react"
import { Briefcase, Users, Clock, AlertOctagon, TrendingUp } from "lucide-react"
import { OwnerDashboardStats } from "./types"

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

interface OwnerStatCardsProps {
  stats: OwnerDashboardStats
}

export default function OwnerStatCards({ stats }: OwnerStatCardsProps) {
  const totalBlockers = stats.blockedCompanyTickets + stats.overdueCompanyTickets

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      <StatCard
        icon={<Briefcase className="size-5 text-emerald-500" />}
        label="Company Projects"
        value={stats.totalProjects}
        sub={`${stats.activeProjects} Active / ${stats.completedProjects} Completed`}
        gradient="bg-emerald-500"
        iconBg="bg-emerald-500/10"
      />

      <StatCard
        icon={<Users className="size-5 text-blue-500" />}
        label="Total Employees"
        value={stats.roleCounts.total - stats.roleCounts.client}
        sub={`${stats.roleCounts.admin} Admins / ${stats.roleCounts.member} Devs / ${stats.roleCounts.qa} QA`}
        gradient="bg-blue-500"
        iconBg="bg-blue-500/10"
      />

      <StatCard
        icon={<Clock className="size-5 text-indigo-500" />}
        label="Hours Logged (Month)"
        value={`${stats.monthlyHours} hrs`}
        sub="Across all active projects"
        gradient="bg-indigo-500"
        iconBg="bg-indigo-500/10"
      />

      <StatCard
        icon={<AlertOctagon className="size-5 text-rose-500" />}
        label="Company Blockers"
        value={totalBlockers}
        sub={`${stats.blockedCompanyTickets} Blocked / ${stats.overdueCompanyTickets} Overdue`}
        gradient="bg-rose-500"
        iconBg="bg-rose-500/10"
      />
    </div>
  )
}
