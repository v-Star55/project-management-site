"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { 
  ClockIcon, 
  BriefcaseIcon, 
  CalendarIcon, 
  CheckCircle2Icon, 
  User2Icon, 
  MailIcon, 
  ActivityIcon, 
  FolderIcon, 
  ListTodoIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  BadgeCheckIcon
} from "lucide-react"

interface Ticket {
  id: string
  title: string
  description: string
  status: string
  priority: string
  dueDate: string | null
  assignedUser: {
    id: string
    name: string
    email: string
    imageUrl: string | null
  } | null
}

interface Project {
  id: string
  title: string
  description: string | null
  status: string
  startDate: string | null
  completedDate: string | null
  tickets: Ticket[]
}

interface PreviousProject {
  id: string
  title: string
  description: string | null
  status: string
  completedDate: string | null
  isActive: boolean
}

interface TimeLog {
  id: string
  startTime: string
  endTime: string
  duration: number
  description: string | null
  ticket: {
    id: string
    title: string
    project: {
      id: string
      title: string
    } | null
  } | null
}

interface UserProfileResponse {
  basicInfo: {
    id: string
    name: string
    email: string
    role: string
    designation: string | null
    imageUrl: string | null
    isActive: boolean
    createdAt: string
    lastActive: string | null
    company: {
      id: string
      name: string
      description: string
      imageUrl: string
    } | null
  }
  currentProject: Project | null
  previousProjects: PreviousProject[]
  timeLogs: TimeLog[]
  totalLog: number
  ticketStats: {
    total: number
    completed: number
    pending: number
  }
}

const formatDuration = (minutes: number) => {
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hrs === 0) return `${mins}m`
  if (mins === 0) return `${hrs}h`
  return `${hrs}h ${mins}m`
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function ProfilePage() {
  const params = useParams()
  const userId = params.id as string

  const { data, isLoading, isError, error } = useQuery<UserProfileResponse>({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      const response = await axios.get(`/api/users/${userId}/profile`)
      return response.data
    },
    enabled: !!userId,
  })

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="size-8 text-primary animate-spin" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Loading profile details...
          </p>
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center p-6 bg-background">
        <Card className="max-w-md border-destructive/20 bg-destructive/5 text-center">
          <CardHeader className="flex flex-col items-center justify-center gap-2">
            <AlertTriangleIcon className="size-10 text-destructive" />
            <CardTitle className="text-lg font-bold text-foreground">Error Loading Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {(error as any)?.response?.data?.error || "Failed to load profile details. Please try again."}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { basicInfo, currentProject, previousProjects, timeLogs, totalLog, ticketStats } = data
  const defaultAvatar = basicInfo.name
    ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(basicInfo.name)}&backgroundType=gradientLinear&fontSize=40`
    : undefined

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Hero / Basic Info section */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          <div className="relative">
            <Avatar className="size-24 md:size-28 rounded-2xl border-2 border-border shadow-md">
              <AvatarImage src={basicInfo.imageUrl || defaultAvatar} alt={basicInfo.name} />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary rounded-2xl">
                {getInitials(basicInfo.name)}
              </AvatarFallback>
            </Avatar>
            {basicInfo.isActive && (
              <span className="absolute bottom-1 right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-card"></span>
              </span>
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="space-y-1">
              <div className="flex flex-col md:flex-row items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                  {basicInfo.name}
                </h1>
                <div className="flex gap-1.5 mt-1 md:mt-0">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    {basicInfo.role}
                  </span>
                  {basicInfo.designation && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border">
                      {basicInfo.designation}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-1.5">
                <MailIcon className="size-3.5" />
                {basicInfo.email}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 pt-2 text-xs text-muted-foreground border-t border-border/40">
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="size-3.5 text-primary/70" />
                Joined {formatDate(basicInfo.createdAt)}
              </span>
              {basicInfo.company && (
                <span className="flex items-center gap-1.5">
                  <BriefcaseIcon className="size-3.5 text-primary/70" />
                  {basicInfo.company.name}
                </span>
              )}
              {basicInfo.lastActive && (
                <span className="flex items-center gap-1.5">
                  <ActivityIcon className="size-3.5 text-primary/70" />
                  Last active {formatDate(basicInfo.lastActive)}
                </span>
              )}
            </div>
          </div>

          {/* Overall Work Summary Metric Cards */}
          <div className="flex flex-row md:flex-col gap-4 w-full md:w-auto shrink-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-border/40 md:pl-8">
            <div className="flex-1 md:flex-none p-4 rounded-xl bg-muted/30 border border-border/40 min-w-36 text-center md:text-left">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center justify-center md:justify-start gap-1">
                <ClockIcon className="size-3 text-blue-500" />
                Total Log
              </span>
              <p className="text-xl md:text-2xl font-black text-foreground mt-1">
                {formatDuration(totalLog)}
              </p>
            </div>
            <div className="flex-1 md:flex-none p-4 rounded-xl bg-muted/30 border border-border/40 min-w-36 text-center md:text-left">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center justify-center md:justify-start gap-1">
                <FolderIcon className="size-3 text-primary" />
                Projects
              </span>
              <p className="text-xl md:text-2xl font-black text-foreground mt-1">
                {1 + previousProjects.length}
              </p>
            </div>
            {ticketStats && (
              <div className="flex-1 md:flex-none p-4 rounded-xl bg-muted/30 border border-border/40 min-w-36 text-center md:text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center justify-center md:justify-start gap-1">
                  <ListTodoIcon className="size-3 text-amber-500" />
                  Tickets (T / C / P)
                </span>
                <p className="text-xl md:text-2xl font-black text-foreground mt-1">
                  {ticketStats.total} / {ticketStats.completed} / {ticketStats.pending}
                </p>
                <span className="text-[9px] text-muted-foreground block mt-1">
                  Total / Completed / Pending
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Current Project & Tasks (takes 2 cols on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-muted/15 flex flex-row items-center justify-between py-4">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <BriefcaseIcon className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold tracking-wide uppercase text-foreground">Current Project</CardTitle>
                </div>
              </div>
              {currentProject && (
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-extrabold bg-emerald-500/10 text-emerald-500 border border-emerald-500/25">
                  {currentProject.status.replace("_", " ")}
                </span>
              )}
            </CardHeader>
            <CardContent className="p-6">
              {currentProject ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-foreground">{currentProject.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {currentProject.description || "No project description provided."}
                    </p>
                    {currentProject.startDate && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                        <CalendarIcon className="size-3 text-primary/70" />
                        Started on {formatDate(currentProject.startDate)}
                      </p>
                    )}
                  </div>

                  {/* Tickets in Current Project */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                      <ListTodoIcon className="size-4 text-primary" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Project Tickets</h4>
                    </div>

                    {currentProject.tickets && currentProject.tickets.length > 0 ? (
                      <div className="divide-y divide-border/30 max-h-[400px] overflow-y-auto pr-1">
                        {currentProject.tickets.map((ticket) => (
                          <div key={ticket.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                            <div className="space-y-1 min-w-0">
                              <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                {ticket.title}
                              </p>
                              <p className="text-[11px] text-muted-foreground truncate max-w-lg">
                                {ticket.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-extrabold tracking-wider bg-muted text-muted-foreground border border-border">
                                {ticket.status.replace("_", " ")}
                              </span>
                              <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-extrabold tracking-wider border ${
                                ticket.priority === "high" 
                                  ? "bg-red-500/10 text-red-500 border-red-500/20" 
                                  : ticket.priority === "medium"
                                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                  : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                              }`}>
                                {ticket.priority}
                              </span>
                              {ticket.dueDate && (
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                  Due: {formatDate(ticket.dueDate)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-muted/10 border border-dashed border-border/30 rounded-xl">
                        <CheckCircle2Icon className="size-6 text-muted-foreground/30 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground italic">No tickets listed in this project</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/10 border border-dashed border-border/30 rounded-xl">
                  <BriefcaseIcon className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm font-bold text-foreground">No Current Project</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This user is not currently active on any project.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time Logs / History */}
          <Card className="border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-muted/15 flex flex-row items-center justify-between py-4">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <ClockIcon className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold tracking-wide uppercase text-foreground">Recent Time Logs</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {timeLogs && timeLogs.length > 0 ? (
                <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                  {timeLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className="p-3.5 bg-muted/10 border border-border/30 rounded-xl flex flex-col gap-2 hover:border-border/50 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <span className="text-[10px] text-muted-foreground block">
                            {formatDate(log.startTime)} at {new Date(log.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                          {log.ticket && (
                            <span className="text-xs font-bold text-foreground truncate mt-0.5 block">
                              {log.ticket.title}
                            </span>
                          )}
                          {log.ticket?.project && (
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-primary/80 mt-0.5 block">
                              {log.ticket.project.title}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-extrabold bg-primary/10 text-primary border border-primary/25 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                          {formatDuration(log.duration)}
                        </span>
                      </div>
                      {log.description && (
                        <p className="text-xs text-muted-foreground border-l-2 border-border/50 pl-3 leading-relaxed mt-1 italic">
                          {log.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-muted/10 border border-dashed border-border/30 rounded-xl">
                  <ClockIcon className="size-6 text-muted-foreground/30 mx-auto mb-1.5" />
                  <p className="text-xs text-muted-foreground italic">No logged time entries recorded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Sidebar (Previous Projects etc.) */}
        <div className="space-y-6">
          {/* Previous Projects */}
          <Card className="border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-muted/15 flex flex-row items-center justify-between py-4">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <FolderIcon className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold tracking-wide uppercase text-foreground">Previous Projects</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {previousProjects && previousProjects.length > 0 ? (
                <div className="space-y-3">
                  {previousProjects.map((project) => (
                    <div 
                      key={project.id} 
                      className="p-3 bg-muted/20 border border-border/30 rounded-xl flex items-center justify-between gap-3 group hover:border-border/60 transition-all"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {project.title}
                        </p>
                        {project.completedDate && (
                          <span className="text-[10px] text-muted-foreground block mt-0.5">
                            Completed: {formatDate(project.completedDate)}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-extrabold tracking-wider bg-muted text-muted-foreground border border-border whitespace-nowrap">
                        {project.status.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-muted/10 border border-dashed border-border/30 rounded-xl">
                  <FolderIcon className="size-6 text-muted-foreground/30 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground italic">No previous projects listed</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
