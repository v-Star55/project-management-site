"use client"

/**
 * HoursBarChart.tsx
 *
 * Simple bar chart showing total hours logged per day for the current week.
 * Today's bar is highlighted in the primary (emerald) colour; other days
 * use a translucent version to draw the eye to the current day.
 *
 * Reuses the same custom tooltip style as WeeklyPerformanceChart for
 * visual consistency across the dashboard.
 */


import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";
import { WeeklyEntry } from "./types"

// ─── Custom tooltip (shared style) ───────────────────────────────────────────

const BarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border/60 rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="font-bold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-1.5">
          <span className="font-semibold">{p.name}:</span> {p.value}h
        </p>
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface HoursBarChartProps {
  data: WeeklyEntry[]
}

/**
 * Renders a bar chart of daily hours logged this week.
 * Today's short day-name is derived at render time so it always
 * reflects the current locale without any prop drilling.
 */
export default function HoursBarChart({ data }: HoursBarChartProps) {
  // Derive today's short weekday name for bar highlighting
  const todayLabel = new Date().toLocaleDateString("en-US", { weekday: "short" })

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
      {/* Card header */}
      <div className="mb-4">
        <h2 className="text-base font-bold text-foreground">Hours Logged — This Week</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Daily breakdown of your logged time
        </p>
      </div>

      {/* Recharts bar chart */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
          barSize={28}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            strokeOpacity={0.4}
            vertical={false}   // Only horizontal grid lines — less visual noise
          />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<BarTooltip />}
            cursor={{ fill: "var(--muted)", opacity: 0.4, radius: 8 }}
          />

          <Bar dataKey="hours" name="Hours" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                // Today's bar uses full brand green; past/future days are translucent
                fill="var(--primary)"
                fillOpacity={entry.day === todayLabel ? 1 : 0.25}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
