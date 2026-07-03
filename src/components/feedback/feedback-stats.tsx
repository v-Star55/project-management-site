import React from "react"
import {
  MessageSquareIcon,
  ClockIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface FeedbackStatsProps {
  totalCount: number
  pendingCount: number
  inProgressCount: number
  resolvedCount: number
}

export function FeedbackStats({
  totalCount,
  pendingCount,
  inProgressCount,
  resolvedCount,
}: FeedbackStatsProps) {
  const statsConfig = [
    {
      label: "Total Feedback",
      value: totalCount,
      description: "All client requests",
      icon: <MessageSquareIcon className="size-4 text-primary" />,
      color: "from-primary/10 to-primary/5",
      border: "border-primary/10",
    },
    {
      label: "Awaiting Review",
      value: pendingCount,
      description: "Pending initial triaging",
      icon: <AlertCircleIcon className="size-4 text-amber-500" />,
      color: "from-amber-500/10 to-amber-500/5",
      border: "border-amber-500/10",
    },
    {
      label: "In Progress",
      value: inProgressCount,
      description: "Actively being worked on",
      icon: <ClockIcon className="size-4 text-blue-500" />,
      color: "from-blue-500/10 to-blue-500/5",
      border: "border-blue-500/10",
    },
    {
      label: "Resolved",
      value: resolvedCount,
      description: "Completed and closed",
      icon: <CheckCircle2Icon className="size-4 text-emerald-500" />,
      color: "from-emerald-500/10 to-emerald-500/5",
      border: "border-emerald-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statsConfig.map((stat, idx) => (
        <Card key={idx} className={`relative overflow-hidden border ${stat.border} shadow-xs rounded-3xl bg-card`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-40`} />
          <CardContent className="relative p-5 flex items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-wider select-none">{stat.label}</p>
              <h3 className="text-xl font-black text-foreground tracking-tight">{stat.value}</h3>
              <p className="text-[9px] text-muted-foreground font-medium select-none">{stat.description}</p>
            </div>
            <div className="p-2.5 rounded-2xl bg-card border border-border/50 shadow-xs shrink-0 select-none">
              {stat.icon}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
