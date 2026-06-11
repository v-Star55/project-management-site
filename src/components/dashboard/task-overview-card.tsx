"use client"

import * as React from "react"
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer 
} from "recharts"

interface TaskOverviewCardProps {
  ticketStats: {
    total: number
    todo: number
    inProgress: number
    inReview: number
    completed: number
  } | null
  pieData: Array<{ name: string; value: number; color: string }>
  onViewAllTasks: () => void
}

export default function TaskOverviewCard({
  ticketStats,
  pieData,
  onViewAllTasks
}: TaskOverviewCardProps) {
  return (
    <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-xs flex flex-col justify-between min-h-[350px]">
      <div className="w-full text-left mb-2">
        <h3 className="text-base font-bold text-foreground">Task Overview</h3>
      </div>
      
      <div className="flex flex-row items-center justify-between gap-6 w-full py-4 flex-1">
        {/* Pie Chart container */}
        <div className="relative flex items-center justify-center shrink-0">
          <ResponsiveContainer width={130} height={130}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={54}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-foreground">{ticketStats?.total || 0}</span>
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Total</span>
          </div>
        </div>

        {/* Legend container */}
        <div className="flex flex-col gap-2.5 flex-1 min-w-0">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2.5 w-2.5 rounded-full bg-[#cbd5e1] shrink-0"></span>
              <span className="text-muted-foreground font-semibold truncate">To Do</span>
            </div>
            <span className="font-bold text-foreground ml-2 shrink-0">{ticketStats?.todo || 0}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2.5 w-2.5 rounded-full bg-[#3b82f6] shrink-0"></span>
              <span className="text-muted-foreground font-semibold truncate">In Progress</span>
            </div>
            <span className="font-bold text-foreground ml-2 shrink-0">{ticketStats?.inProgress || 0}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2.5 w-2.5 rounded-full bg-[#f97316] shrink-0"></span>
              <span className="text-muted-foreground font-semibold truncate">In Review</span>
            </div>
            <span className="font-bold text-foreground ml-2 shrink-0">{ticketStats?.inReview || 0}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e] shrink-0"></span>
              <span className="text-muted-foreground font-semibold truncate">Completed</span>
            </div>
            <span className="font-bold text-foreground ml-2 shrink-0">{ticketStats?.completed || 0}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border/40">
        <button 
          onClick={onViewAllTasks} 
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0 outline-hidden"
        >
          View All Tasks <span className="text-sm">→</span>
        </button>
      </div>
    </div>
  )
}
