"use client"

import React from "react"
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts"
import { AdminWeeklyPerformance } from "./types"

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border/60 rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="font-bold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-1.5">
          <span className="font-semibold">{p.name}:</span>
          {p.value}
          {p.dataKey === "hours" ? " hrs" : " tasks"}
        </p>
      ))}
    </div>
  )
}

interface WeeklyTrendsChartProps {
  data: AdminWeeklyPerformance[]
}

export default function WeeklyTrendsChart({ data }: WeeklyTrendsChartProps) {
  return (
    <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-bold text-foreground">Weekly Trends</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Admin logged hours vs. company task completions (last 7 days)
          </p>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-medium text-muted-foreground shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-primary inline-block" />
            Admin Hours
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 inline-block" />
            Tasks Completed
          </span>
        </div>
      </div>

      <div className="w-full h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: -5, bottom: 0, left: -25 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              strokeOpacity={0.4}
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: "var(--border)", strokeWidth: 1, opacity: 0.15 }}
            />

            {/* Tasks Completed Bar */}
            <Bar
              yAxisId="right"
              dataKey="ticketsCompleted"
              name="Tasks Completed"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              barSize={16}
            />

            {/* Admin Hours Line */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="hours"
              name="Admin Hours"
              stroke="var(--primary)"
              strokeWidth={3}
              dot={{ fill: "var(--primary)", r: 4, strokeWidth: 1 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
