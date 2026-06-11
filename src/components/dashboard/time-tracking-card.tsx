"use client"

import * as React from "react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell, 
  ResponsiveContainer 
} from "recharts"
import { ChevronDown } from "lucide-react"

interface TimeTrackingCardProps {
  thisWeekMinutes: number
  changeType: "up" | "down" | "neutral"
  roundedChange: number
  barChartData: Array<{ day: string; hours: number }>
  onViewTimesheet: () => void
}

export default function TimeTrackingCard({
  thisWeekMinutes,
  changeType,
  roundedChange,
  barChartData,
  onViewTimesheet
}: TimeTrackingCardProps) {
  const formatHoursAndMinutes = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="lg:col-span-2 bg-card border border-border/50 rounded-3xl p-6 shadow-xs flex flex-col justify-between min-h-[350px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-foreground">Time Tracking</h3>
        <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground border border-border/60 hover:bg-muted/40 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer">
          <span>This Week</span>
          <ChevronDown className="size-3.5" />
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-extrabold tracking-tight text-foreground">
            {formatHoursAndMinutes(thisWeekMinutes)}
          </span>
          <div className="flex items-center gap-1">
            <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${
              changeType === "up" 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                : changeType === "down" 
                ? "bg-red-500/10 text-red-600 dark:text-red-400" 
                : "bg-muted text-muted-foreground"
            }`}>
              {changeType === "up" && "↑"}
              {changeType === "down" && "↓"}
              {roundedChange}%
            </span>
            <span className="text-xs text-muted-foreground">vs last week</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground font-medium">Logged this week</p>
      </div>

      <div className="flex-1 w-full min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barChartData} margin={{ top: 10, right: 10, bottom: 0, left: -25 }}>
            <defs>
              <linearGradient id="activeBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <linearGradient id="emptyBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--muted)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--muted)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.3} vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
            <Tooltip 
              content={({ active, payload, label }: any) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-card border border-border/60 rounded-xl px-3 py-2 shadow-xl text-xs">
                      <p className="font-bold text-foreground mb-0.5">{label}</p>
                      <p className="text-primary font-medium">
                        Hours Logged: <span className="font-bold">{payload[0].value} hrs</span>
                      </p>
                    </div>
                  )
                }
                return null
              }} 
              cursor={{ fill: "var(--muted)", opacity: 0.15, radius: 8 }} 
            />
            <Bar dataKey="hours" name="Hours" radius={[6, 6, 6, 6]} barSize={16} minPointSize={5}>
              {barChartData.map((entry, index) => {
                const hasHours = entry.hours > 0
                return (
                  <Cell 
                    key={index} 
                    fill={hasHours ? "url(#activeBar)" : "url(#emptyBar)"}
                  />
                )
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-3 border-t border-border/40">
        <button 
          onClick={onViewTimesheet} 
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0 outline-hidden"
        >
          View Timesheet <span className="text-sm">→</span>
        </button>
      </div>
    </div>
  )
}
