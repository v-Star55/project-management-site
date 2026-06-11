import React from "react"
import { ClockIcon, CalendarIcon, CheckSquareIcon } from "lucide-react"
import { 
  ProjectDetail, 
  getProjectStatusLabel, 
  getProjectStatusBadge, 
  formatDate 
} from "./utils"

interface ProjectStatsProps {
  projectData: ProjectDetail
}

export default function ProjectStats({ projectData }: ProjectStatsProps) {
  const stats = [
    { 
      label: "Status", 
      value: getProjectStatusLabel(projectData.status), 
      icon: <ClockIcon className="size-4 text-amber-500" />, 
      desc: "Project timeline status" 
    },
    { 
      label: "Start Date", 
      value: formatDate(projectData.startDate), 
      icon: <CalendarIcon className="size-4 text-blue-500" />, 
      desc: "Official kick-off date" 
    },
    { 
      label: "Completed Date", 
      value: formatDate(projectData.completedDate), 
      icon: <CalendarIcon className="size-4 text-emerald-500" />, 
      desc: "Project closeout date" 
    },
    { 
      label: "Total Tickets", 
      value: projectData.tickets.length, 
      icon: <CheckSquareIcon className="size-4 text-purple-500" />, 
      desc: "Backlog & current sprint" 
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in duration-200">
      {stats.map((stat, idx) => (
        <div 
          key={idx} 
          className="bg-card border border-border/60 p-4.5 rounded-2xl shadow-2xs hover:shadow-xs hover:border-border transition-all flex flex-col justify-between h-28"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">{stat.label}</span>
            <div className="p-1.5 rounded-lg bg-muted/40 border border-border/20">
              {stat.icon}
            </div>
          </div>
          <div className="mt-2">
            <p className="text-lg font-bold text-foreground truncate">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{stat.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
