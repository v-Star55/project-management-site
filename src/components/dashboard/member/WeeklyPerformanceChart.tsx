"use client"

/**
 * WeeklyPerformanceChart.tsx
 *
 * Dual-area chart showing hours logged and tasks completed for each
 * of the last 7 days. Uses recharts AreaChart with SVG gradient fills.
 *
 * Design decisions:
 *  - Gradient fill makes the chart feel rich without adding visual noise.
 *  - Axis lines removed; grid lines kept at low opacity for readability.
 *  - Custom tooltip avoids recharts' default tooltip that ignores theme tokens.
 */


import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { WeeklyEntry } from "./types"

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

/**
 * Themed tooltip for the area chart.
 * Uses CSS variables so it respects light/dark mode automatically.
 */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border/60 rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="font-bold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-1.5">
          <span className="font-semibold">{p.name}:</span>
          {p.value}
          {p.dataKey === "hours" ? "h" : ""}
        </p>
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface WeeklyPerformanceChartProps {
  data: WeeklyEntry[]
}

/**
 * Area chart for the weekly performance panel.
 * Wrapped in a card with its own title and legend row.
 */
export default function WeeklyPerformanceChart({ data }: WeeklyPerformanceChartProps) {
  return (
    <div className="lg:col-span-2 rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
      {/* Card header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-foreground">Weekly Performance</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Hours logged &amp; tickets completed this week
          </p>
        </div>

        {/* Inline legend */}
        <div className="flex items-center gap-3 text-[11px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-primary/80 inline-block" />
            Hours
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500/80 inline-block" />
            Tickets
          </span>
        </div>
      </div>

      {/* Recharts area chart */}
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          {/* SVG gradient definitions — referenced by fill="url(#...)" below */}
          <defs>
            <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="ticketsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            strokeOpacity={0.4}
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
            content={<ChartTooltip />}
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          />

          {/* Hours area */}
          <Area
            type="monotone"
            dataKey="hours"
            name="Hours"
            stroke="var(--primary)"
            strokeWidth={2.5}
            fill="url(#hoursGrad)"
            dot={{ fill: "var(--primary)", r: 3 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />

          {/* Tickets completed area */}
          <Area
            type="monotone"
            dataKey="ticketsCompleted"
            name="Tickets"
            stroke="#3b82f6"
            strokeWidth={2.5}
            fill="url(#ticketsGrad)"
            dot={{ fill: "#3b82f6", r: 3 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
