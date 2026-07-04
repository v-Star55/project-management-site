"use client"

import React, { useState, useMemo } from "react"
import {
  Layers,
  Search,
  Calendar,
  Compass,
  ArrowRight,
  User,
  Clock,
  Sparkles,
  ChevronDown
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AdminProject } from "./types"
import { PROJECT_STATUS_COLORS } from "./constants"

interface ProjectSprintCardProps {
  projects: AdminProject[]
  userId?: string
}

export default function ProjectSprintCard({ projects, userId }: ProjectSprintCardProps) {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "active" && project.status !== "completed") ||
        (activeTab === "completed" && project.status === "completed")

      const matchesSearch =
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchesTab && matchesSearch
    })
  }, [projects, activeTab, searchQuery])

  const formatDateString = (dateStr: string | null) => {
    if (!dateStr) return "Not Set"
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const defaultAvatar = "https://github.com/shadcn.png"

  return (
    <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm flex flex-col gap-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Layers className="size-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Assigned Projects Overview</h2>
            <p className="text-xs text-muted-foreground">Manage details, scope estimates, and sprint tracking</p>
          </div>
        </div>

        {/* Search & Tab Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-muted/30 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
            {(["all", "active", "completed"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg capitalize transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/30 rounded-3xl">
          <Layers className="size-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-semibold text-foreground">No projects found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search query or filters.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {filteredProjects.map((project) => {
            const progress =
              project.totalTickets > 0
                ? Math.round((project.completedTickets / project.totalTickets) * 100)
                : 0

            return (
              <div
                key={project.id}
                className="group flex flex-col gap-4 p-5 rounded-2xl border border-border/50 bg-muted/10 hover:bg-card hover:border-primary/20 hover:shadow-md transition-all duration-300"
              >
                {/* Project Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 text-sm font-black text-primary">
                      {project.title.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {project.description || "No project description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                    <Badge variant="outline" className="text-[10px] py-0.5 rounded-md capitalize">
                      {project.category}
                    </Badge>
                    <Badge
                      className={`text-[10px] py-0.5 rounded-md capitalize border ${
                        PROJECT_STATUS_COLORS[project.status] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {project.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>

                {/* Progress Indicators: Task Progress & Budget Hours */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tasks progress bar */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Task Completion Progress</span>
                      <span className="text-primary font-bold">
                        {project.completedTickets} / {project.totalTickets} ({progress}%)
                      </span>
                    </div>
                    <Progress value={progress} className="h-2 rounded-full" />
                  </div>

                  {/* Hours budget progression */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Scope estimates (Logged vs Est)</span>
                      <span className="text-foreground font-bold flex items-center gap-1">
                        <Clock className="size-3 text-muted-foreground" />
                        {project.loggedHours}h / {project.estimatedHours}h
                      </span>
                    </div>
                    <Progress
                      value={
                        project.estimatedHours > 0
                          ? Math.min(Math.round((project.loggedHours / project.estimatedHours) * 100), 100)
                          : 0
                      }
                      className="h-2 rounded-full"
                    />
                  </div>
                </div>

                {/* Details Section (Start Date, Target Phase, Active Sprint) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-card border border-border/30 text-xs">
                  <div>
                    <p className="text-muted-foreground font-semibold">Start & Target Dates</p>
                    <p className="font-bold text-foreground mt-0.5">
                      {formatDateString(project.startDate)} → {formatDateString(project.targetDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-semibold">Current Phase</p>
                    <p className="font-bold text-foreground capitalize mt-0.5">
                      {project.phase.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-semibold">Project Code / Workspace ID</p>
                    <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md font-mono mt-0.5 inline-block">
                      {project.id}
                    </code>
                  </div>
                </div>

                {/* Current Active Sprint Block */}
                <div className="p-3.5 rounded-xl border border-border/40 bg-muted/20">
                  <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                    <Compass className="size-3.5 text-primary" /> Current Active Sprint
                  </h4>
                  {project.activeSprint ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-foreground">{project.activeSprint.name}</span>
                          <Badge variant="outline" className="text-[9px] py-0 px-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                            Active
                          </Badge>
                        </div>
                        {project.activeSprint.goal && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 italic">
                            Goal: "{project.activeSprint.goal}"
                          </p>
                        )}
                      </div>
                      {project.activeSprint.endDate && (
                        <span className="text-[10px] text-muted-foreground bg-card border border-border px-2 py-0.5 rounded-md font-medium shrink-0">
                          Due: {formatDateString(project.activeSprint.endDate)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground italic">
                      No active sprint in progress for this project.
                    </p>
                  )}
                </div>

                {/* Footer stack: Assigned Team & Action Button */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border/30">
                  {/* Lead & Members Avatars */}
                  <div className="flex items-center gap-4">
                    {project.admins.length > 0 && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                          Project Lead
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Avatar className="size-6 border border-border">
                            <AvatarImage src={project.admins[0].imageUrl || defaultAvatar} />
                            <AvatarFallback className="text-[9px] font-bold">
                              {project.admins[0].name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-semibold text-foreground">
                            {project.admins[0].name}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                        Assigned Team
                      </span>
                      <div className="flex items-center">
                        <TooltipProvider>
                          <div className="flex -space-x-2 overflow-hidden">
                            {project.members.slice(0, 5).map((member) => (
                              <Tooltip key={member.id}>
                                <TooltipTrigger asChild>
                                  <Avatar className="size-6 border-2 border-card bg-background cursor-pointer hover:z-20 transition-all">
                                    <AvatarImage src={member.imageUrl || defaultAvatar} />
                                    <AvatarFallback className="text-[8px] font-bold">
                                      {member.name.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent className="p-2 flex flex-col gap-0.5">
                                  <p className="font-bold text-xs">{member.name}</p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {member.designation || "Member"}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        </TooltipProvider>

                        {project.members.length > 5 && (
                          <span className="text-[11px] font-bold text-muted-foreground ml-2">
                            +{project.members.length - 5} more
                          </span>
                        )}

                        {project.members.length === 0 && (
                          <span className="text-xs text-muted-foreground italic">None assigned</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nav links to Project Workspace */}
                  <a
                    href={`/dashboard/${userId}/projects/${project.id}?tab=overview`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline group/btn shrink-0"
                  >
                    Project Workspace
                    <ArrowRight className="size-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
