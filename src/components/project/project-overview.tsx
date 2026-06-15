"use client"

import React from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { format, differenceInDays } from "date-fns"
import { 
  TrendingUp, 
  Users, 
  Layers, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  FolderOpen,
  ArrowRight,
  Crown,
  ChevronRight,
  Info
} from "lucide-react"
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts"

import { ProjectDetail, formatDate, getInitials } from "./utils"
import { Button } from "@/components/ui/button"
import ProjectActivityCard from "./project-activity-card"

interface ProjectOverviewProps {
  projectData: ProjectDetail
}

interface Ticket {
  id: string
  title: string
  status: string
  priority: string
}

interface ProjectGroup {
  id: string
  name: string
  description: string
  goal: string | null
  type: string
  status: string
  startDate: string
  endDate: string | null
  tickets: Ticket[]
}

const PIE_COLORS = {
  completed: "#10b981",   // emerald
  inProgress: "#3b82f6",  // blue
  inReview: "#a855f7",    // purple
  blocked: "#ef4444",     // red
  todo: "#78716c",        // stone
}

export default function ProjectOverview({ projectData }: ProjectOverviewProps) {
  const projectId = projectData.id

  // 1. Fetch project groups/sprints dynamically
  const { data: groupsData } = useQuery({
    queryKey: ["project-groups", projectId],
    queryFn: async () => {
      const res = await axios.get(`/api/projects/${projectId}/groups`)
      return res.data.groups as ProjectGroup[]
    },
    enabled: !!projectId,
  })

  const groups = groupsData || []
  const tickets = projectData.tickets || []

  // 2. Compute Ticket Stats
  const totalTickets = tickets.length
  const completedTickets = tickets.filter(t => t.status === "completed").length
  const inProgressTickets = tickets.filter(t => t.status === "in_progress").length
  const inReviewTickets = tickets.filter(t => t.status === "in_review").length
  const blockedTickets = tickets.filter(t => t.status === "blocked").length
  const todoTickets = tickets.filter(t => t.status === "pending" || t.status === "backlog" || t.status === "reopen").length

  // 3. Compute Project Health Score
  const completionRate = totalTickets > 0 ? (completedTickets / totalTickets) * 100 : 100
  let healthScore = completionRate
  
  // Apply penalties
  const blockedPenalty = blockedTickets * 15 // Heavy penalty for blocked tickets
  const highPriorityActiveCount = tickets.filter(t => t.priority === "high" && t.status !== "completed").length
  const highPriorityPenalty = highPriorityActiveCount * 5 // Penalty for uncompleted high priority tasks
  
  // Penalty for past-due active tickets
  const now = new Date()
  const overdueActiveCount = tickets.filter(t => {
    if (t.status === "completed" || !t.dueDate) return false
    return new Date(t.dueDate) < now
  }).length
  const overduePenalty = overdueActiveCount * 8

  healthScore = Math.max(0, Math.min(100, healthScore - blockedPenalty - highPriorityPenalty - overduePenalty))
  if (totalTickets === 0) healthScore = 100

  const getHealthStatus = (score: number) => {
    if (score >= 90) return { label: "Excellent", color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", description: "Project is on track and highly efficient." }
    if (score >= 70) return { label: "Good", color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20", description: "Minor blockers or overdue items present." }
    if (score >= 50) return { label: "At Risk", color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", description: "Multiple blocked or high priority items need attention." }
    return { label: "Critical", color: "text-red-500", bg: "bg-red-500/10 border-red-500/20", description: "Critical delay risk. Immediate action required." }
  }

  const health = getHealthStatus(healthScore)

  // 4. Ticket Breakdown Chart Data
  const pieData = [
    { name: "Completed", value: completedTickets, fill: PIE_COLORS.completed },
    { name: "In Progress", value: inProgressTickets, fill: PIE_COLORS.inProgress },
    { name: "In Review", value: inReviewTickets, fill: PIE_COLORS.inReview },
    { name: "Blocked", value: blockedTickets, fill: PIE_COLORS.blocked },
    { name: "To Do", value: todoTickets, fill: PIE_COLORS.todo },
  ].filter(d => d.value > 0)

  // 5. Timeline Calculation
  const startDate = projectData.startDate ? new Date(projectData.startDate) : null
  const targetDate = projectData.targetDate ? new Date(projectData.targetDate) : null
  const completedDate = projectData.completedDate ? new Date(projectData.completedDate) : null

  let timelinePercentage = 0
  let isOverdue = false

  if (startDate && targetDate) {
    const totalDays = differenceInDays(targetDate, startDate)
    const elapsedDays = differenceInDays(now, startDate)
    if (totalDays > 0) {
      timelinePercentage = Math.max(0, Math.min(100, (elapsedDays / totalDays) * 100))
    }
    if (now > targetDate && projectData.status !== "completed") {
      isOverdue = true
    }
  }

  // 6. Recent high priority & update tickets
  const priorityWeight = { high: 3, medium: 2, low: 1 }
  const recentTickets = [...tickets]
    .sort((a, b) => {
      if (a.status === "completed" && b.status !== "completed") return 1
      if (a.status !== "completed" && b.status === "completed") return -1
      
      const wA = priorityWeight[a.priority as keyof typeof priorityWeight] || 0
      const wB = priorityWeight[b.priority as keyof typeof priorityWeight] || 0
      if (wB !== wA) return wB - wA
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    .slice(0, 5)

  // Clean admins (excluding client role if any)
  const cleanAdmins = projectData.admins.filter(a => a.role !== "client")

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
      {/* LEFT COLUMN: Main Dashboard widgets */}
      <div className="lg:col-span-2 flex flex-col gap-6 w-full">
        
        {/* Project Details Card */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-border/30 pb-2.5">
            <div className="flex items-center gap-2">
              <Info className="size-4.5 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Project Details</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[9px] font-black rounded-full border bg-primary/10 text-primary border-primary/20 uppercase tracking-wider">
                {projectData.status}
              </span>
              <span className="px-2 py-0.5 text-[9px] font-black rounded-full border bg-blue-500/10 text-blue-500 border-blue-500/20 uppercase tracking-wider">
                {projectData.phase}
              </span>
              <span className="px-2 py-0.5 text-[9px] font-black rounded-full border bg-stone-500/10 text-stone-600 border-stone-500/20 dark:text-stone-400 uppercase tracking-wider">
                {projectData.category}
              </span>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground leading-relaxed">
            {projectData.description || "No description provided for this project."}
          </p>

          {/* Project Details Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-border/30 mt-1">
            <div className="min-w-0">
              <span className="block text-[9px] uppercase font-bold text-muted-foreground/60">Admin</span>
              <span className="text-xs font-bold text-foreground truncate block" title={cleanAdmins.map(a => a.name).join(", ")}>
                {cleanAdmins.map(a => a.name).join(", ") || "Unassigned"}
              </span>
            </div>
            <div>
              <span className="block text-[9px] uppercase font-bold text-muted-foreground/60">Team Size</span>
              <span className="text-xs font-bold text-foreground">
                {projectData.admins.length + projectData.members.length} members
              </span>
            </div>
            <div>
              <span className="block text-[9px] uppercase font-bold text-muted-foreground/60">Started At</span>
              <span className="text-xs font-bold text-foreground">
                {startDate ? format(startDate, "MMM d, yyyy") : "N/A"}
              </span>
            </div>
            <div>
              <span className="block text-[9px] uppercase font-bold text-muted-foreground/60">Tentative Target</span>
              <span className="text-xs font-bold text-foreground">
                {targetDate ? format(targetDate, "MMM d, yyyy") : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card border border-border/50 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs hover:border-border/80 transition-all flex flex-col justify-between h-28 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tickets</span>
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/15 group-hover:scale-110 transition-transform">
                <FolderOpen className="size-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-black text-foreground">{totalTickets}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Total project tickets</p>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs hover:border-border/80 transition-all flex flex-col justify-between h-28 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Completed</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border-emerald-500/15 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="size-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-black text-foreground">
                {completedTickets}
                {totalTickets > 0 && (
                  <span className="text-xs text-muted-foreground font-semibold ml-1.5">
                    ({Math.round(completionRate)}%)
                  </span>
                )}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Closed tickets</p>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs hover:border-border/80 transition-all flex flex-col justify-between h-28 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border-blue-500/15 group-hover:scale-110 transition-transform">
                <Clock className="size-4 animate-pulse" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-black text-foreground">
                {inProgressTickets + inReviewTickets}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">In Progress & Review</p>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-4.5 shadow-2xs hover:shadow-xs hover:border-border/80 transition-all flex flex-col justify-between h-28 group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Blocked</span>
              <div className="p-2 rounded-xl bg-red-500/10 text-red-500 border-red-500/15 group-hover:scale-110 transition-transform">
                <AlertTriangle className="size-4" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-black text-foreground">{blockedTickets}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Awaiting resolution</p>
            </div>
          </div>
        </div>

        {/* Dynamic Timeline Card */}
        {startDate && (targetDate || completedDate) && (
          <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="size-4.5 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Project Timeline Progress</h3>
              </div>
              {isOverdue && (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20">
                  Overdue
                </span>
              )}
            </div>
            
            <div className="space-y-4">
              {/* Progress Track */}
              <div className="relative flex items-center h-4 w-full">
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${
                      isOverdue 
                        ? "bg-gradient-to-r from-red-500 to-amber-500" 
                        : projectData.status === "completed" 
                        ? "bg-emerald-500" 
                        : "bg-primary"
                    }`}
                    style={{ width: `${timelinePercentage}%` }}
                  />
                </div>
                {/* Pointer for today */}
                {!isOverdue && projectData.status !== "completed" && timelinePercentage > 0 && timelinePercentage < 100 && (
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center z-10"
                    style={{ left: `${timelinePercentage}%` }}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-primary/25 border-2 border-card shadow-md" />
                  </div>
                )}
              </div>

              {/* Milestones Info */}
              <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-muted-foreground/60">Start Date</span>
                  <span className="text-foreground">{format(startDate, "MMM d, yyyy")}</span>
                </div>
                {projectData.status === "completed" && completedDate ? (
                  <div className="text-right">
                    <span className="block text-[10px] uppercase font-bold text-emerald-500/80">Completed Date</span>
                    <span className="text-emerald-600 font-bold">{format(completedDate, "MMM d, yyyy")}</span>
                  </div>
                ) : (
                  targetDate && (
                    <div className="text-right">
                      <span className="block text-[10px] uppercase font-bold text-muted-foreground/60">Target End Date</span>
                      <span className={`${isOverdue ? "text-red-500 font-bold" : "text-foreground"}`}>
                        {format(targetDate, "MMM d, yyyy")}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Charts & Status Breakdown section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-card border border-border/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Status Breakdown</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Tickets by current status</p>
            </div>
            
            {totalTickets === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-muted-foreground italic">
                No tickets to display.
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center my-3">
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }: any) => {
                        if (!active || !payload?.length) return null
                        const data = payload[0].payload
                        return (
                          <div className="bg-card border border-border/60 rounded-xl px-2.5 py-1.5 shadow-lg text-[11px]">
                            <span className="font-semibold text-foreground">{data.name}: </span>
                            <span className="font-bold" style={{ color: data.fill }}>{data.value}</span>
                          </div>
                        )
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 w-full text-[10px] font-semibold mt-2 text-muted-foreground">
                  {pieData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5 truncate">
                      <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                      <span className="truncate">{d.name}</span>
                      <span className="ml-auto text-foreground font-extrabold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-2 bg-card border border-border/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center border-b border-border/30 pb-3 mb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">Sprints & Phases</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Goal progression & tracking</p>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers className="size-3.5 text-primary" />
                <span className="text-xs font-bold text-foreground">{groups.length} active</span>
              </div>
            </div>

            {groups.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center p-4">
                <Layers className="size-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs font-bold text-foreground">No active groups or sprints</p>
                <p className="text-[10px] text-muted-foreground max-w-[200px] mt-0.5">
                  Create groups in the "Groups" tab to start tracking progress.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
                {groups.slice(0, 3).map((group) => {
                  const gTotal = group.tickets.length
                  const gCompleted = group.tickets.filter(t => t.status === "completed").length
                  const gProgress = gTotal > 0 ? Math.round((gCompleted / gTotal) * 100) : 0

                  return (
                    <div 
                      key={group.id}
                      className="group/item border border-border/40 hover:border-border bg-muted/10 hover:bg-muted/20 p-3 rounded-xl transition-all"
                    >
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-foreground truncate block group-hover/item:text-primary transition-colors">
                            {group.name}
                          </span>
                          {group.endDate && (
                            <span className="text-[9px] text-muted-foreground font-medium">
                              Target Date: {format(new Date(group.endDate), "MMM d, yyyy")}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-black text-foreground shrink-0">{gProgress}%</span>
                      </div>
                      
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${gProgress}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-muted-foreground font-semibold mt-1">
                        <span>{group.type.toUpperCase()}</span>
                        <span>{gCompleted}/{gTotal} Tickets completed</span>
                      </div>
                    </div>
                  )}
                )}
                {groups.length > 3 && (
                  <div className="text-center pt-1">
                    <span className="text-[10px] font-bold text-primary hover:underline cursor-pointer">
                      View all sprints (+{groups.length - 3} more)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Tickets Table Widget */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Priority Tasks & Next Items</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Important items awaiting completion</p>
            </div>
            <div className="p-1.5 rounded-lg bg-muted/40 border border-border/30">
              <TrendingUp className="size-3.5 text-primary" />
            </div>
          </div>

          {recentTickets.length === 0 ? (
            <div className="text-center py-10 text-xs text-muted-foreground italic">
              No tickets recorded for this project yet.
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pl-2">Ticket</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Priority</th>
                    <th className="py-2 text-right pr-2">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/25">
                  {recentTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-muted/15 transition-colors text-xs font-semibold">
                      <td className="py-2.5 pl-2 max-w-[200px] truncate pr-3">
                        <span className="text-foreground hover:text-primary transition-colors cursor-pointer" title={ticket.title}>
                          {ticket.title}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-extrabold tracking-wider border ${
                          ticket.status === "completed" 
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                            : ticket.status === "blocked"
                            ? "bg-red-500/10 text-red-500 border-red-500/20"
                            : "bg-muted text-muted-foreground border-border"
                        }`}>
                          {ticket.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-extrabold tracking-wider border ${
                          ticket.priority === "high" 
                            ? "bg-red-500/10 text-red-500 border-red-500/20" 
                            : ticket.priority === "medium"
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        }`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="py-2.5 text-right pr-2 text-muted-foreground text-[11px]">
                        {formatDate(ticket.dueDate || null)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: Sticky Sidebars */}
      <div className="lg:col-span-1 flex flex-col gap-6 w-full lg:sticky lg:top-6">
        
        {/* Project Health Score Circular Gauge */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm text-center">
          <div className="text-left border-b border-border/30 pb-3 mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Project Health</h3>
              <p className="text-[11px] text-muted-foreground">Derived from blockers, delays & priorities</p>
            </div>
            <div className={`p-1 rounded-full border ${health.bg}`}>
              <ShieldAlert className={`size-4 ${health.color}`} />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center my-3 relative">
            <svg className="size-32" viewBox="0 0 100 100">
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                stroke="currentColor" 
                strokeWidth="7" 
                fill="transparent" 
                className="text-muted/60"
              />
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                stroke="currentColor" 
                strokeWidth="7" 
                fill="transparent" 
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - healthScore / 100)}`}
                strokeLinecap="round"
                className={`transition-all duration-1000 ${health.color}`}
                transform="rotate(-90 50 50)"
              />
            </svg>
            
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-black text-foreground">{Math.round(healthScore)}</span>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Index</span>
            </div>
          </div>

          <div className="mt-4 space-y-1">
            <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${health.bg} ${health.color}`}>
              {health.label}
            </span>
            <p className="text-[11px] text-muted-foreground leading-relaxed px-4 pt-1">
              {health.description}
            </p>
          </div>
        </div>

        {/* Project Team Card */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="border-b border-border/30 pb-3 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="size-4.5 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Project Team</h3>
            </div>
            <span className="text-[10px] font-black text-muted-foreground uppercase bg-muted/40 px-2 py-0.5 rounded border border-border/20">
              {projectData.admins.length + projectData.members.length} members
            </span>
          </div>

          <div className="space-y-4">
            {projectData.admins.length > 0 && (
              <div className="space-y-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1.5">
                  <Crown className="size-3 text-amber-500 fill-amber-500" />
                  Project Admins
                </span>
                <div className="flex flex-col gap-2">
                  {projectData.admins.map((admin) => (
                    <div key={admin.id} className="flex items-center gap-2.5 p-1.5 hover:bg-muted/10 rounded-xl transition-colors">
                      <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 text-xs font-bold text-primary">
                        {getInitials(admin.name)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-foreground truncate block">{admin.name}</span>
                        <span className="text-[9px] text-muted-foreground block truncate">{admin.designation || "Admin"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {projectData.members.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/30">
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  Project Members
                </span>
                <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
                  {projectData.members.map((member) => (
                    <div key={member.id} className="flex items-center gap-2.5 p-1.5 hover:bg-muted/10 rounded-xl transition-colors">
                      <div className="size-8 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border/60 text-xs font-bold text-foreground/80">
                        {getInitials(member.name)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-foreground truncate block">{member.name}</span>
                        <span className="text-[9px] text-muted-foreground block truncate">{member.designation || "Engineer"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <ProjectActivityCard projectId={projectId} />

      </div>
    </div>
  )
}
