"use client"


import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { EstimateVsActual } from "./types"
import { BarChart3 } from "lucide-react"

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border/60 rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="font-bold text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="flex items-center gap-1.5" style={{ color: p.color }}>
          <span className="font-semibold">{p.name}:</span>
          {p.value} hrs
        </p>
      ))}
    </div>
  )
}

interface EstimateVsActualChartProps {
  data: EstimateVsActual[]
}

export default function EstimateVsActualChart({ data }: EstimateVsActualChartProps) {
  return (
    <div className="rounded-3xl border border-border/50 bg-card/45 backdrop-blur-md p-5 shadow-xs flex flex-col gap-4 w-full h-[392px]">
      <div>
        <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
          <BarChart3 className="size-4.5 text-primary" />
          Estimation vs. Reality
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Projected estimated hours vs. actual hours logged across company projects
        </p>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 0, bottom: 0, left: -25 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              strokeOpacity={0.4}
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: "var(--border)", strokeWidth: 1, opacity: 0.15 }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11 }}
            />
            <Bar
              dataKey="estimated"
              name="Estimated Hours"
              fill="var(--primary)"
              radius={[4, 4, 0, 0]}
              barSize={12}
            />
            <Bar
              dataKey="actual"
              name="Actual Logged"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              barSize={12}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
