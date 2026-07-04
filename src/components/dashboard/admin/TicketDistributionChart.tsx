"use client"

import React from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { AdminDashboardStats } from "./types"

interface TicketDistributionChartProps {
  stats: AdminDashboardStats
}

export default function TicketDistributionChart({ stats }: TicketDistributionChartProps) {
  const data = [
    { name: "To Do", value: stats.totalTickets - stats.completedTickets - stats.inProgressTickets - stats.inReviewTickets - stats.blockedTickets - stats.reopenTickets, color: "#94a3b8" }, // slate 400
    { name: "In Progress", value: stats.inProgressTickets, color: "#3b82f6" }, // blue 500
    { name: "In Review", value: stats.inReviewTickets, color: "#f59e0b" }, // amber 500
    { name: "Completed", value: stats.completedTickets, color: "#10b981" }, // emerald 500
    { name: "Blocked", value: stats.blockedTickets, color: "#f43f5e" }, // rose 500
    { name: "Reopened", value: stats.reopenTickets, color: "#ef4444" }, // red 500
  ].filter((item) => item.value > 0)

  // Fallback if no tickets
  const finalData = data.length > 0 ? data : [{ name: "No Tasks", value: 1, color: "#e2e8f0" }]

  return (
    <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[350px]">
      <div>
        <h3 className="text-base font-bold text-foreground">Task Distribution</h3>
        <p className="text-xs text-muted-foreground">Company-wide tickets breakdown by status</p>
      </div>

      <div className="flex flex-row items-center justify-between gap-6 py-4 flex-1">
        {/* Pie Chart container */}
        <div className="relative flex items-center justify-center shrink-0 w-[140px] h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={finalData}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={58}
                paddingAngle={3}
                dataKey="value"
              >
                {finalData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-card border border-border/60 rounded-xl px-3 py-2 shadow-xl text-xs">
                        <p className="font-bold text-foreground mb-0.5">{payload[0].name}</p>
                        <p className="text-primary font-medium">
                          Count: <span className="font-bold">{payload[0].value}</span>
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-foreground">{stats.totalTickets}</span>
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
              Total Tasks
            </span>
          </div>
        </div>

        {/* Legend container */}
        <div className="flex flex-col gap-2.5 flex-1 min-w-0">
          {finalData.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                ></span>
                <span className="text-muted-foreground font-semibold truncate">{item.name}</span>
              </div>
              {item.name !== "No Tasks" && (
                <span className="font-bold text-foreground ml-2 shrink-0">{item.value}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border/40 text-center">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Aggregated Project Statuses
        </span>
      </div>
    </div>
  )
}
