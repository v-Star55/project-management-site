"use client"

import React, { useState } from "react"
import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Timer,
  TrendingUp,
  User2,
  ActivityIcon,
  Calendar,
  Layers,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Search,
  Users,
  Compass,
  ArrowRight,
  AlertCircle
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Admin {
  id: string
  name: string
  email: string
  imageUrl: string | null
  designation: string | null
}

interface Member {
  id: string
  name: string
  email: string
  imageUrl: string | null
  designation: string | null
  role: string
}

interface Group {
  id: string
  name: string
  description: string
  goal: string | null
  startDate: string
  endDate: string | null
  status: string
}

interface ActivityLog {
  id: string
  action: string
  description: string | null
  createdAt: string
  user: {
    id: string
    name: string
    imageUrl: string | null
    role: string
  }
  project: {
    id: string
    title: string
  } | null
}

interface Project {
  id: string
  title: string
  description: string | null
  status: string
  phase: string
  category: string
  startDate: string | null
  targetDate: string | null
  completedDate: string | null
  totalTickets: number
  completedTickets: number
  inProgressTickets: number
  admins: Admin[]
  members: Member[]
  groups: Group[]
}

interface ClientDashboardData {
  role: string
  stats: {
    totalProjects: number
    activeProjects: number
    completedProjects: number
    totalTickets: number
    completedTickets: number
    inProgressTickets: number
    inReviewTickets: number
    blockedTickets: number
    reopenTickets: number
  }
  projects: Project[]
  recentActivities: ActivityLog[]
}

const defaultAvatar = "https://github.com/shadcn.png"

export default function ClientDashboard() {
  const user = useSelector((state: RootState) => state.user.user)
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch client dashboard statistics and projects list
  const { data, isLoading, isError } = useQuery<ClientDashboardData>({
    queryKey: ["clientDashboard"],
    queryFn: async () => {
      const res = await fetch("/api/users/me/dashboard")
      if (!res.ok) throw new Error("Failed to fetch client dashboard data")
      return res.json()
    },
    staleTime: 1000 * 60 * 2, // 2 minutes cache
  })

  // Fetch paginated activities (initial page parameters: onlyActivities=true, limit=5)
  const {
    data: activityPagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isActivitiesLoading,
  } = useInfiniteQuery({
    queryKey: ["clientDashboardActivities"],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(`/api/users/me/dashboard?onlyActivities=true&page=${pageParam}&limit=5`)
      if (!res.ok) throw new Error("Failed to fetch client dashboard activities")
      return res.json()
    },
    getNextPageParam: (lastPage: any) => lastPage.nextPage ?? undefined,
    initialPageParam: 1,
  })

  const recentActivities = React.useMemo(() => {
    return activityPagesData?.pages.flatMap((page: any) => page.activityLogs) || []
  }, [activityPagesData])

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="size-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading dashboard insights...</p>
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <AlertCircle className="size-10 text-red-500 mx-auto mb-3" />
          <h2 className="font-bold text-lg text-foreground">Failed to load Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-2">
            There was an error retrieving the project details. Please refresh the page or contact support.
          </p>
        </div>
      </div>
    )
  }

  const { stats, projects } = data

  // Filter projects by status tab and search query
  const filteredProjects = projects.filter((project) => {
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "active" && project.status !== "completed") ||
      (activeTab === "completed" && project.status === "completed")

    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesTab && matchesSearch
  })

  // Format date helper
  const formatDateString = (dateStr: string | null) => {
    if (!dateStr) return "N/A"
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Task progress percentage
  const globalProgress =
    stats.totalTickets > 0 ? Math.round((stats.completedTickets / stats.totalTickets) * 100) : 0

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 md:p-8 w-full overflow-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* ── Greeting Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 md:p-8 shadow-xs">
        <div className="flex flex-col gap-2 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Client Portal</span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Welcome back, {user?.name || "Client"}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            Monitor and track active projects, milestones progress, and updates for your workspace at{" "}
            <span className="font-semibold text-foreground">{user?.company?.name}</span>.
          </p>
        </div>
      </div>

      {/* ── KPI Pill Style Banner ── */}
      <div className="w-full">
        <div className="w-full rounded-full border border-border/80 bg-muted/40 px-6 py-4 flex flex-wrap items-center justify-between md:justify-start gap-y-3 gap-x-6 shadow-xs text-xs font-medium">
          
          <div className="flex items-center gap-2">
            <Briefcase className="size-4 text-emerald-500" />
            <span className="text-foreground"><strong className="font-extrabold text-sm">{stats.totalProjects}</strong> <span className="text-muted-foreground font-semibold">Total Projects</span></span>
          </div>

          <div className="hidden md:block w-px h-4 bg-border/60" />

          <div className="flex items-center gap-2">
            <Timer className="size-4 text-blue-500" />
            <span className="text-foreground"><strong className="font-extrabold text-sm">{stats.activeProjects}</strong> <span className="text-muted-foreground font-semibold">Active Projects</span></span>
          </div>

          <div className="hidden md:block w-px h-4 bg-border/60" />

          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-purple-500" />
            <span className="text-foreground"><strong className="font-extrabold text-sm">{stats.completedProjects}</strong> <span className="text-muted-foreground font-semibold">Completed Projects</span></span>
          </div>

          <div className="hidden md:block w-px h-4 bg-border/60" />

          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-amber-500" />
            <span className="text-foreground">
              <strong className="font-extrabold text-sm">{stats.completedTickets} / {stats.totalTickets}</strong> <span className="text-muted-foreground font-semibold">Tasks Completed ({globalProgress}%)</span>
            </span>
          </div>

          <div className="hidden md:block w-px h-4 bg-border/60" />

          <div className="flex items-center gap-2">
            <Clock className="size-4 text-sky-500" />
            <span className="text-foreground"><strong className="font-extrabold text-sm">{stats.inReviewTickets}</strong> <span className="text-muted-foreground font-semibold">Awaiting Review</span></span>
          </div>

          <div className="hidden md:block w-px h-4 bg-border/60" />

          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-red-500" />
            <span className="text-foreground"><strong className="font-extrabold text-sm">{stats.blockedTickets}</strong> <span className="text-muted-foreground font-semibold">Blocked Tasks</span></span>
          </div>
        </div>
      </div>

      {/* ── Main Dashboard Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch w-full">
        
        {/* Left Column: Projects & Milestones (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-6 w-full">
          
          <div className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm flex-1 flex flex-col">
            {/* Header controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Layers className="size-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Projects Tracking</h2>
                  <p className="text-xs text-muted-foreground">Detailed roadmap and milestone views</p>
                </div>
              </div>

              {/* Search + Tab filters */}
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

            {/* Projects list */}
            {filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/30 rounded-3xl">
                <Briefcase className="size-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-semibold text-foreground">No projects found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try adjusting your search query or filter criteria.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
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
                      {/* Project Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 text-sm font-black text-primary">
                            {project.title.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {project.title}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {project.description || "No project description provided."}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                          <Badge variant="outline" className="text-[10px] py-0.5 rounded-md capitalize">
                            {project.category}
                          </Badge>
                          <Badge
                            className={`text-[10px] py-0.5 rounded-md capitalize ${
                              project.status === "completed"
                                ? "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20"
                                : "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                            }`}
                          >
                            {project.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>

                      {/* Project Timeline & Stats */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-card border border-border/30 text-xs">
                        <div>
                          <p className="text-muted-foreground font-medium">Start Date</p>
                          <p className="font-semibold text-foreground mt-0.5">
                            {formatDateString(project.startDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground font-medium">Target Date</p>
                          <p className="font-semibold text-foreground mt-0.5">
                            {formatDateString(project.targetDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground font-medium">Project Phase</p>
                          <p className="font-semibold text-foreground capitalize mt-0.5">
                            {project.phase.replace("_", " ")}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground font-medium">Tasks Completion</p>
                          <p className="font-semibold text-foreground mt-0.5">
                            {project.completedTickets} / {project.totalTickets} Tasks ({progress}%)
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-muted-foreground">Project Completion</span>
                          <span className="text-primary">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2 rounded-full" />
                      </div>

                      {/* Active Sprints / Milestones */}
                      <div>
                        <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                          <Compass className="size-3 text-primary" /> Active Sprints & Milestones
                        </h4>
                        {project.groups && project.groups.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {project.groups.map((group) => (
                              <div
                                key={group.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-border/30 bg-muted/20 text-xs gap-2"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-foreground">{group.name}</span>
                                    <Badge variant="outline" className="text-[9px] py-0 px-1 rounded-sm capitalize">
                                      {group.status.replace("_", " ")}
                                    </Badge>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-md">
                                    {group.goal || group.description}
                                  </p>
                                </div>
                                {group.endDate && (
                                  <span className="text-[10px] text-muted-foreground shrink-0 sm:text-right font-medium">
                                    Due: {formatDateString(group.endDate)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 text-center border border-dashed border-border/30 rounded-xl">
                            <p className="text-[11px] text-muted-foreground italic">
                              No active sprints or milestones defined currently.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Project Managers & Team Members */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border/30">
                        <div className="flex items-center gap-4">
                          {/* Admins / Managers */}
                          {project.admins.length > 0 && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
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

                          {/* Team Size / Avatars */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
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
                                          {member.designation || member.role}
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
                            </div>
                          </div>
                        </div>

                        {/* Link to project detail board */}
                        <Button variant="ghost" size="sm" asChild className="group/btn text-xs font-semibold p-0 h-auto hover:bg-transparent text-primary">
                          <a href={`/dashboard/${user?.id}/projects/${project.id}?tab=overview`} className="flex items-center gap-1">
                            Project Workspace
                            <ArrowRight className="size-3.5 group-hover/btn:translate-x-1 transition-transform" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Project Activities & Upcoming Milestones (1/3 width) */}
        <div className="lg:col-span-1 flex flex-col gap-6 w-full h-full">
          
          {/* Recent Activities */}
          <Card className="border-border/50 shadow-xs rounded-3xl overflow-hidden flex-1 flex flex-col">
            <CardHeader className="border-b border-border/40 bg-muted/15 flex flex-row items-center py-4 px-6 justify-between">
              <div className="flex items-center gap-2">
                <ActivityIcon className="size-4 text-primary" />
                <CardTitle className="text-sm font-bold tracking-wide uppercase text-foreground">
                  Workspace Feed
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col min-h-0 justify-between">
              {recentActivities.length > 0 ? (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="space-y-6 flex-1 overflow-y-auto pr-1 pb-4">
                    {recentActivities.map((log, index) => (
                      <div key={log.id} className="flex gap-3 relative group">
                        <Avatar className="size-8 border border-border bg-background z-10 relative shrink-0">
                          <AvatarImage src={log.user.imageUrl || defaultAvatar} />
                          <AvatarFallback className="text-xs font-bold">
                            {log.user.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        {index < recentActivities.length - 1 && (
                          <div className="absolute left-4 top-8 bottom-[-24px] w-[1px] bg-border/60" />
                        )}

                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-foreground truncate">{log.user.name}</span>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed break-words bg-muted/10 border border-border/20 p-2.5 rounded-xl">
                            {log.description}
                          </p>
                          {log.project && (
                            <div className="mt-1 flex justify-start">
                              <span className="inline-flex px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded-md text-[9px] font-semibold text-primary">
                                {log.project.title}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {hasNextPage && (
                    <div className="pt-3 border-t border-border/40 mt-2 flex justify-center shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs font-bold text-primary hover:text-primary/80 transition-colors py-1.5 h-auto rounded-xl border border-border/30 bg-muted/10"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                      >
                        {isFetchingNextPage ? "Loading..." : "Load More Activity"}
                      </Button>
                    </div>
                  )}
                </div>
              ) : isActivitiesLoading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                  <Spinner className="size-5 text-primary animate-spin" />
                  <span className="text-[10px] font-semibold">Loading activities...</span>
                </div>
              ) : (
                <div className="text-center py-10 bg-muted/10 border border-dashed border-border/30 rounded-2xl">
                  <ActivityIcon className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground italic">No recent workspace activities.</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  )
}