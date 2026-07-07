"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query";
import axios from "axios"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner"
import { PencilIcon } from "lucide-react"


const DESIGNATIONS = [
  {
    category: "Software",
    options: [
      "Software Engineer",
      "Frontend Developer",
      "Backend Developer",
      "Full Stack Developer",
      "Mobile Developer",
      "Tech Lead",
      "Software Architect",
      "QA Engineer",
      "QA Automation Engineer",
      "DevOps Engineer",
      "Cloud Engineer",
      "Database Administrator",
      "UI/UX Designer",
      "Product Designer",
      "Business Analyst",
      "Product Owner",
      "Scrum Master",
      "Project Manager",
      "Engineering Manager",
      "Intern"
    ]
  },
  {
    category: "Marketing",
    options: [
      "Marketing Manager",
      "Digital Marketing Specialist",
      "SEO Specialist",
      "SEM Specialist",
      "Content Writer",
      "Content Strategist",
      "Social Media Manager",
      "Social Media Executive",
      "Graphic Designer",
      "Brand Manager",
      "Marketing Coordinator",
      "Email Marketing Specialist",
      "Growth Marketer",
      "Performance Marketing Specialist",
      "Marketing Analyst",
      "PR Manager",
      "Copywriter",
      "Creative Director"
    ]
  },
  {
    category: "Interior Design",
    options: [
      "Interior Designer",
      "Senior Interior Designer",
      "Junior Interior Designer",
      "Architect",
      "3D Visualizer",
      "CAD Designer",
      "Project Coordinator",
      "Project Manager",
      "Site Supervisor",
      "Procurement Manager",
      "Furniture Designer",
      "Lighting Designer",
      "Space Planner",
      "Material Consultant",
      "Client Relationship Manager",
      "Design Consultant"
    ]
  },
  {
    category: "High post",
    options: [
      "Co-Founder",
      "CEO",
      "COO",
      "CTO",
      "Director"
    ]
  }
]



import { ClockIcon, BriefcaseIcon, CalendarIcon, MailIcon, ActivityIcon, FolderIcon, ListTodoIcon, AlertTriangleIcon, Clock3Icon, BarChart3Icon, SearchIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import TimeTrackingCard from "@/components/dashboard/time-tracking-card"
import TaskOverviewCard from "@/components/dashboard/task-overview-card"
import ProjectDetailsTab from "@/components/dashboard/project-details-tab"

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
  type: string
  groupId: string | null
  groupName: string | null
}

interface ProjectMember {
  id: string
  name: string
  email: string
  imageUrl: string | null
  role: string
}

interface ProjectGroup {
  id: string
  name: string
}

interface Project {
  id: string
  title: string
  description: string | null
  status: string
  startDate: string | null
  completedDate: string | null
  isActive: boolean
  tickets: Ticket[]
  groups: ProjectGroup[]
  admins: ProjectMember[]
  members: ProjectMember[]
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
  projects: Project[]
  previousProjects: PreviousProject[]
  timeLogs: TimeLog[]
  totalLog: number
  ticketStats: {
    total: number
    completed: number
    pending: number
    todo: number
    inProgress: number
    inReview: number
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
  if (!name) return "U"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const getWeeklyChartData = (logs: TimeLog[]) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hoursMap: Record<string, number> = {
    Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0
  };
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  let hasLogThisWeek = false;
  logs.forEach(log => {
    const logDate = new Date(log.startTime);
    if (logDate >= sevenDaysAgo) {
      const dayName = days[logDate.getDay()];
      hoursMap[dayName] += (log.duration || 0) / 60;
      hasLogThisWeek = true;
    }
  });

  if (!hasLogThisWeek) {
    // Elegant fallback visuals for mock details
    return [
      { day: "Sun", hours: 0 },
      { day: "Mon", hours: 4.5 },
      { day: "Tue", hours: 6.2 },
      { day: "Wed", hours: 7.8 },
      { day: "Thu", hours: 5.0 },
      { day: "Fri", hours: 6.5 },
      { day: "Sat", hours: 1.2 },
    ];
  }
  
  return days.map(day => ({
    day,
    hours: Math.round(hoursMap[day] * 10) / 10
  }));
}

const CustomBarTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
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
}

interface UserProfileDetailProps {
  userId: string
  isSheet?: boolean
}

export default function UserProfileDetail({ userId, isSheet = false }: UserProfileDetailProps) {
  const [timelogSearch, setTimelogSearch] = React.useState("")
  const [activeTab, setActiveTab] = React.useState("overview")

  const { user: currentUser } = useSelector((state: RootState) => state.user)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [editName, setEditName] = React.useState("")
  const [editEmail, setEditEmail] = React.useState("")
  const [editRole, setEditRole] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState("")
  const [editDesignation, setEditDesignation] = React.useState("")
  const [designationSearch, setDesignationSearch] = React.useState("")

  const categoryGroup = DESIGNATIONS.find(g => g.category === selectedCategory)
  const filteredOptions = categoryGroup
    ? categoryGroup.options.filter(opt => opt.toLowerCase().includes(designationSearch.toLowerCase()))
    : []

  const [isSaving, setIsSaving] = React.useState(false)

  const { data, isLoading, isError, error } = useQuery<UserProfileResponse>({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      const response = await axios.get(`/api/users/${userId}/profile`)
      return response.data
    },
    enabled: !!userId,
  })

  // Pre-fill fields when dialog opens
  React.useEffect(() => {
    if (data?.basicInfo) {
      setEditName(data.basicInfo.name || "")
      setEditEmail(data.basicInfo.email || "")
      setEditRole(data.basicInfo.role || "")
      const design = data.basicInfo.designation || ""
      const group = DESIGNATIONS.find(g => g.options.includes(design))
      if (group) {
        setSelectedCategory(group.category)
        setEditDesignation(design)
      } else {
        setSelectedCategory("none")
        setEditDesignation("none")
      }
    }
  }, [data?.basicInfo, isEditDialogOpen])

  if (isLoading) {
    return (
      <div className={`flex w-full items-center justify-center bg-background ${isSheet ? "h-64" : "h-[calc(100vh-4rem)]"}`}>
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
      <div className={`flex w-full items-center justify-center p-6 bg-background ${isSheet ? "h-64" : "h-[calc(100vh-4rem)]"}`}>
        <Card className="max-w-md border-destructive/20 bg-destructive/5 text-center">
          <CardHeader className="flex flex-col items-center justify-center gap-2">
            <AlertTriangleIcon className="size-10 text-destructive" />
            <CardTitle className="text-lg font-bold text-foreground">Error Loading Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {(error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to load profile details. Please try again."}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { basicInfo, currentProject, projects, previousProjects, timeLogs, totalLog, ticketStats } = data
  const defaultAvatar = "https://github.com/shadcn.png"

  const currentUserRole = currentUser?.role || ""
  const isOwner = currentUserRole === "owner"
  const isSystemAdmin = currentUserRole === "admin"

  // Can current user edit this profile?
  const canEditProfile = () => {
    if (!currentUser || !basicInfo) return false
    // Self editing is always allowed
    if (currentUser.id === basicInfo.id) return true
    // Owner can edit any profile in the company
    if (isOwner) return true
    // Admin can edit members under their projects
    if (isSystemAdmin) {
      return projects.some(p => p.admins.some(a => a.id === currentUser.id))
    }
    return false
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!basicInfo) return

    setIsSaving(true)
    try {
      await axios.patch(`/api/users/${basicInfo.id}`, {
        name: editName,
        email: editEmail,
        role: (isOwner || isSystemAdmin) ? editRole : undefined,
        designation: (isOwner || isSystemAdmin) ? (editDesignation && editDesignation !== "none" ? editDesignation.trim() : null) : undefined,
      })
      toast.success("Profile updated successfully")
      setIsEditDialogOpen(false)
      // Hard refresh or reload is safest to update all context/redux
      window.location.reload()
    } catch (error: any) {
      console.error(error)
      toast.error(error.response?.data?.error || "Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  // Helper for date range calculation of "This Week" (Monday to Sunday) and "Last Week"
  const getWeekRanges = () => {
    const now = new Date()
    const currentDay = now.getDay()
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1
    
    const startOfThisWeek = new Date(now)
    startOfThisWeek.setDate(now.getDate() - daysToMonday)
    startOfThisWeek.setHours(0, 0, 0, 0)
    
    const endOfThisWeek = new Date(startOfThisWeek)
    endOfThisWeek.setDate(startOfThisWeek.getDate() + 6)
    endOfThisWeek.setHours(23, 59, 59, 999)
    
    const startOfLastWeek = new Date(startOfThisWeek)
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7)
    
    const endOfLastWeek = new Date(startOfLastWeek)
    endOfLastWeek.setDate(startOfLastWeek.getDate() + 6)
    endOfLastWeek.setHours(23, 59, 59, 999)
    
    return { startOfThisWeek, endOfThisWeek, startOfLastWeek, endOfLastWeek }
  }

  const { startOfThisWeek, endOfThisWeek, startOfLastWeek, endOfLastWeek } = getWeekRanges()
  
  let thisWeekMinutes = 0
  let lastWeekMinutes = 0
  const dailyMinutesThisWeek: Record<string, number> = {
    Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0
  }

  timeLogs.forEach(log => {
    const logDate = new Date(log.startTime)
    const duration = log.duration || 0
    
    if (logDate >= startOfThisWeek && logDate <= endOfThisWeek) {
      thisWeekMinutes += duration
      const dayIndex = logDate.getDay()
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      const dayName = dayNames[dayIndex]
      dailyMinutesThisWeek[dayName] += duration
    } else if (logDate >= startOfLastWeek && logDate <= endOfLastWeek) {
      lastWeekMinutes += duration
    }
  })

  const barChartData = [
    { day: "Mon", hours: Math.round((dailyMinutesThisWeek["Mon"] / 60) * 10) / 10 },
    { day: "Tue", hours: Math.round((dailyMinutesThisWeek["Tue"] / 60) * 10) / 10 },
    { day: "Wed", hours: Math.round((dailyMinutesThisWeek["Wed"] / 60) * 10) / 10 },
    { day: "Thu", hours: Math.round((dailyMinutesThisWeek["Thu"] / 60) * 10) / 10 },
    { day: "Fri", hours: Math.round((dailyMinutesThisWeek["Fri"] / 60) * 10) / 10 },
    { day: "Sat", hours: Math.round((dailyMinutesThisWeek["Sat"] / 60) * 10) / 10 },
    { day: "Sun", hours: Math.round((dailyMinutesThisWeek["Sun"] / 60) * 10) / 10 },
  ]

  let roundedChange = 0
  let changeType: "up" | "down" | "neutral" = "neutral"

  if (lastWeekMinutes > 0) {
    const pct = ((thisWeekMinutes - lastWeekMinutes) / lastWeekMinutes) * 100
    roundedChange = Math.abs(Math.round(pct))
    if (pct > 0) changeType = "up"
    else if (pct < 0) changeType = "down"
  } else if (thisWeekMinutes > 0) {
    roundedChange = 100
    changeType = "up"
  }

  const formatHoursAndMinutes = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours}h ${minutes}m`
  }

  // Task Overview Pie Chart details
  const hasTicketData = (ticketStats?.total || 0) > 0
  const pieData = hasTicketData 
    ? [
        { name: "To Do", value: ticketStats?.todo || 0, color: "#cbd5e1" },
        { name: "In Progress", value: ticketStats?.inProgress || 0, color: "#3b82f6" },
        { name: "In Review", value: ticketStats?.inReview || 0, color: "#f97316" },
        { name: "Completed", value: ticketStats?.completed || 0, color: "#22c55e" },
      ].filter(item => item.value > 0)
    : [
        { name: "To Do", value: 1, color: "#cbd5e1" },
        { name: "In Progress", value: 1, color: "#3b82f6" },
        { name: "In Review", value: 1, color: "#f97316" },
        { name: "Completed", value: 1, color: "#22c55e" },
      ]



  // Filter time logs
  const filteredTimeLogs = timeLogs.filter(log => {
    const ticketTitle = log.ticket?.title || ""
    const description = log.description || ""
    const projectTitle = log.ticket?.project?.title || ""
    return (
      ticketTitle.toLowerCase().includes(timelogSearch.toLowerCase()) ||
      description.toLowerCase().includes(timelogSearch.toLowerCase()) ||
      projectTitle.toLowerCase().includes(timelogSearch.toLowerCase())
    )
  })

  if (isSheet) {
    return (
      <div className="flex flex-col gap-6 p-6 overflow-y-auto">
        {/* Compact Hero/Basic Info */}
        <div className="flex flex-col items-center text-center space-y-4 pb-4 border-b border-border/40">
          <div className="relative">
            <Avatar className="size-20 rounded-2xl border border-border shadow-sm">
              <AvatarImage src={basicInfo.imageUrl || defaultAvatar} alt={basicInfo.name} />
              <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary rounded-2xl">
                {getInitials(basicInfo.name)}
              </AvatarFallback>
            </Avatar>
            {basicInfo.isActive && (
              <span className="absolute bottom-0.5 right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-card"></span>
              </span>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-extrabold tracking-tight text-foreground">{basicInfo.name}</h2>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <MailIcon className="size-3.5" />
              {basicInfo.email}
            </p>
            <div className="flex justify-center gap-1.5 mt-1">
              <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                {basicInfo.role}
              </span>
              {basicInfo.designation && (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border">
                  {basicInfo.designation}
                </span>
              )}
            </div>
          </div>

          <div className="w-full flex flex-col items-center gap-1.5 text-xs text-muted-foreground pt-2">
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

        {/* Compact Metrics Bar (Pill Shape) */}
        <div className="flex flex-col gap-1 p-2 rounded-2xl bg-muted/20 border border-border/30 shadow-xs">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ClockIcon className="size-3.5 text-blue-500 shrink-0" />
              Total Log
            </span>
            <span className="text-xs font-extrabold text-foreground whitespace-nowrap">
              {formatDuration(totalLog)}
            </span>
          </div>
          <div className="h-px bg-border/20 mx-3" />
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FolderIcon className="size-3.5 text-primary shrink-0" />
              Projects
            </span>
            <span className="text-xs font-extrabold text-foreground whitespace-nowrap">
              {1 + previousProjects.length}
            </span>
          </div>
          {ticketStats && (
            <>
              <div className="h-px bg-border/20 mx-3" />
              <div className="flex items-center justify-between px-3 py-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ListTodoIcon className="size-3.5 text-emerald-500 shrink-0" />
                  Tasks Completed
                </span>
                <span className="text-xs font-extrabold text-foreground whitespace-nowrap">
                  {ticketStats.completed} <span className="text-[10px] font-semibold text-muted-foreground">/ {ticketStats.total} total</span>
                </span>
              </div>
            </>
          )}
        </div>

        {/* Current Project */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="border-b border-border/40 bg-muted/15 py-3 px-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <BriefcaseIcon className="size-4 text-primary" />
              <CardTitle className="text-xs font-bold tracking-wide uppercase text-foreground">Current Project</CardTitle>
            </div>
            {currentProject && (
              <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-full font-extrabold bg-emerald-500/10 text-emerald-500 border border-emerald-500/25">
                {currentProject.status.replace("_", " ")}
              </span>
            )}
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {currentProject ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">{currentProject.title}</h3>
                  <p className="text-xs text-muted-foreground leading-normal line-clamp-3">
                    {currentProject.description || "No project description provided."}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 border-b border-border/40 pb-1.5">
                    <ListTodoIcon className="size-3.5 text-primary" />
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-foreground">Project Tickets</h4>
                  </div>

                  {currentProject.tickets && currentProject.tickets.length > 0 ? (
                    <div className="divide-y divide-border/30 max-h-[200px] overflow-y-auto pr-1">
                      {currentProject.tickets.map((ticket) => (
                        <div key={ticket.id} className="py-2 flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-foreground truncate">{ticket.title}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{ticket.description}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[8px] uppercase px-1 py-0.5 rounded font-extrabold tracking-wider bg-muted text-muted-foreground border border-border">
                              {ticket.status.replace("_", " ")}
                            </span>
                            <span className={`text-[8px] uppercase px-1 py-0.5 rounded font-extrabold tracking-wider border ${
                              ticket.priority === "high" 
                                ? "bg-red-500/10 text-red-500 border-red-500/20" 
                                : ticket.priority === "medium"
                                ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                            }`}>
                              {ticket.priority[0].toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground italic text-center py-2">No tickets listed</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 bg-muted/5 border border-dashed border-border/30 rounded-lg">
                <BriefcaseIcon className="size-6 text-muted-foreground/30 mx-auto mb-1" />
                <p className="text-xs font-bold text-foreground">No Current Project</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Time Logs */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="border-b border-border/40 bg-muted/15 py-3 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClockIcon className="size-4 text-primary" />
              <CardTitle className="text-xs font-bold tracking-wide uppercase text-foreground">Recent Time Logs</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {timeLogs && timeLogs.length > 0 ? (
              <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                {timeLogs.map((log) => (
                  <div key={log.id} className="p-2 bg-muted/10 border border-border/30 rounded-lg flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[9px] text-muted-foreground block">
                          {formatDate(log.startTime)} at {new Date(log.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        {log.ticket && (
                          <span className="text-[11px] font-bold text-foreground truncate block">
                            {log.ticket.title}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-extrabold bg-primary/10 text-primary border border-primary/25 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {formatDuration(log.duration)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic text-center py-2">No time entries recorded</p>
            )}
          </CardContent>
        </Card>

        {/* Previous Projects */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="border-b border-border/40 bg-muted/15 py-3 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderIcon className="size-4 text-primary" />
              <CardTitle className="text-xs font-bold tracking-wide uppercase text-foreground">Previous Projects</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {previousProjects && previousProjects.length > 0 ? (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {previousProjects.map((project) => (
                  <div key={project.id} className="p-2 bg-muted/10 border border-border/30 rounded-lg flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold text-foreground truncate">{project.title}</p>
                    <span className="text-[8px] uppercase px-1 py-0.5 rounded font-extrabold tracking-wider bg-muted text-muted-foreground border border-border whitespace-nowrap">
                      {project.status.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic text-center py-2">No previous projects listed</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Full Page Layout - Redesigned to use Full Width Dashboard style
  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 lg:p-12 w-full max-w-full animate-in fade-in duration-300">
      
      {/* Sleek Glassmorphic Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-r from-card to-card/85 p-6 md:p-8 shadow-md">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 relative z-10">
          
          {/* Avatar and Basic Details */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative shrink-0">
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

            <div className="text-center md:text-left space-y-3">
              <div className="space-y-1">
                <div className="flex flex-col md:flex-row items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
                    {basicInfo.name}
                  </h1>
                  <div className="flex items-center gap-1.5 mt-1 md:mt-0">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                      {basicInfo.role}
                    </span>
                    {basicInfo.designation && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border">
                        {basicInfo.designation}
                      </span>
                    )}
                    {canEditProfile() && (
                      <button
                        onClick={() => setIsEditDialogOpen(true)}
                        className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                        title="Edit Profile"
                      >
                        <PencilIcon className="size-3.5" />
                      </button>
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
          </div>

          {/* Metric summaries in a sleek, glassmorphic pill-shaped design */}
          <div className="flex flex-col sm:flex-row items-center gap-1 p-2 rounded-full bg-muted/30 border border-border/40 w-full lg:w-auto shrink-0 shadow-xs">
            {/* Total Log */}
            <div className="flex items-center gap-3 px-5 py-2 w-full sm:w-auto">
              <div className="size-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                <ClockIcon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground truncate">Total Log</p>
                <p className="text-sm font-extrabold text-foreground whitespace-nowrap">
                  {formatDuration(totalLog)}
                </p>
              </div>
            </div>

            <div className="hidden sm:block h-6 w-px bg-border/40" />

            {/* Projects */}
            <div className="flex items-center gap-3 px-5 py-2 w-full sm:w-auto border-t sm:border-t-0 border-border/20">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <FolderIcon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground truncate">Projects</p>
                <p className="text-sm font-extrabold text-foreground whitespace-nowrap">
                  {1 + previousProjects.length}
                </p>
              </div>
            </div>

            <div className="hidden sm:block h-6 w-px bg-border/40" />

            {/* Tickets */}
            {ticketStats && (
              <div className="flex items-center gap-3 px-5 py-2 w-full sm:w-auto border-t sm:border-t-0 border-border/20">
                <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                  <ListTodoIcon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground truncate">Tasks Completed</p>
                  <p className="text-sm font-extrabold text-foreground whitespace-nowrap">
                    {ticketStats.completed} <span className="text-xs font-semibold text-muted-foreground">/ {ticketStats.total} total</span>
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Tabs Layout */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col gap-6">
        <TabsList variant="line" className="bg-transparent border-b border-border w-full justify-start rounded-none h-auto p-0 gap-6">
          <TabsTrigger 
            value="overview" 
            className="flex-none data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-1 py-3 text-sm font-semibold data-[state=active]:text-primary after:bg-primary transition-all duration-200"
          >
            <BarChart3Icon className="size-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="projects" 
            className="flex-none data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-1 py-3 text-sm font-semibold data-[state=active]:text-primary after:bg-primary transition-all duration-200"
          >
            <BriefcaseIcon className="size-4 mr-2" />
            Projects & Tasks
          </TabsTrigger>
          <TabsTrigger 
            value="timelogs" 
            className="flex-none data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-1 py-3 text-sm font-semibold data-[state=active]:text-primary after:bg-primary transition-all duration-200"
          >
            <Clock3Icon className="size-4 mr-2" />
            Time Logs
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab Content */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-stretch">
            
            <TimeTrackingCard
              thisWeekMinutes={thisWeekMinutes}
              changeType={changeType}
              roundedChange={roundedChange}
              barChartData={barChartData}
              onViewTimesheet={() => setActiveTab("timelogs")}
            />

            <TaskOverviewCard
              ticketStats={ticketStats}
              pieData={pieData}
              onViewAllTasks={() => setActiveTab("projects")}
            />

          </div>
        </TabsContent>

        {/* Projects Tab Content */}
        <TabsContent value="projects" className="space-y-6">
          <ProjectDetailsTab
            projects={projects}
            formatDate={formatDate}
            getInitials={getInitials}
          />
        </TabsContent>

        {/* Time Logs Tab Content */}
        <TabsContent value="timelogs" className="space-y-6">
          <div className="bg-card border border-border/50 rounded-3xl shadow-xs overflow-hidden">
            {/* Header controls */}
            <div className="p-4 md:p-6 border-b border-border/40 bg-muted/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Work logs history</h3>
                <p className="text-xs text-muted-foreground">List of all recorded logs of time and notes.</p>
              </div>
              <div className="relative w-full sm:w-72">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search logs by task, project, notes..."
                  value={timelogSearch}
                  onChange={e => setTimelogSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-muted/40 rounded-xl border border-border/30 text-xs outline-hidden focus:border-primary/50 transition-all"
                />
              </div>
            </div>

            {/* Time logs table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10 hover:bg-muted/10">
                  <TableRow className="border-border/40">
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground pl-6">Date</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Task / Ticket</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Project</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Logged Hours</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground pr-6">Description / Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTimeLogs.length > 0 ? (
                    filteredTimeLogs.map((log) => (
                      <TableRow key={log.id} className="border-border/40">
                        <TableCell className="text-xs text-muted-foreground pl-6">
                          <span className="font-semibold block text-foreground">
                            {formatDate(log.startTime)}
                          </span>
                          <span className="text-[10px]">
                            {new Date(log.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </TableCell>
                        <TableCell className="font-bold text-xs text-foreground max-w-[220px] truncate" title={log.ticket?.title}>
                          {log.ticket ? log.ticket.title : <span className="text-muted-foreground font-normal italic">General Task</span>}
                        </TableCell>
                        <TableCell>
                          {log.ticket?.project ? (
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-primary border border-primary/20 bg-primary/5 px-2 py-0.5 rounded-md">
                              {log.ticket.project.title}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/60">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-bold text-xs text-blue-500">
                          {formatDuration(log.duration)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[320px] truncate pr-6 italic" title={log.description || ""}>
                          {log.description || <span className="text-muted-foreground/40 font-normal">No details</span>}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground italic pl-6 pr-6">
                        No time logs match your criteria
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-popover border border-border max-w-md rounded-3xl p-6">
          <DialogHeader className="pb-3 border-b border-border/40">
            <DialogTitle className="text-foreground font-bold text-lg">Edit Profile</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Modify details for <strong className="text-foreground">{basicInfo.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 py-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full px-3 py-2 bg-muted/30 border border-border/60 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-foreground"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
              <input
                type="email"
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
                className="w-full px-3 py-2 bg-muted/30 border border-border/60 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-foreground"
                required
              />
            </div>

            {/* Role & Designation - restricted to Owner and Admin */}
            {(isOwner || isSystemAdmin) && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Role</label>
                  <Select
                    value={editRole}
                    onValueChange={setEditRole}
                  >
                    <SelectTrigger className="w-full bg-muted/30 border border-border/60 rounded-xl h-10 text-foreground cursor-pointer">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border text-popover-foreground rounded-xl">
                      {/* Enforce role restriction rules */}
                      {isOwner && <SelectItem value="owner">Owner</SelectItem>}
                      {isOwner && <SelectItem value="admin">Admin</SelectItem>}
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="qa">QA</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Department / Category</label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(val) => {
                      setSelectedCategory(val)
                      setEditDesignation("")
                      setDesignationSearch("")
                    }}
                  >
                    <SelectTrigger className="w-full bg-muted/30 border border-border/60 rounded-xl h-10 text-foreground cursor-pointer">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-border bg-popover text-popover-foreground">
                      <SelectItem value="none">None / No Department</SelectItem>
                      {DESIGNATIONS.map((group) => {
                        if (group.category === "High post" && currentUser?.role !== "owner") {
                          return null
                        }
                        return (
                          <SelectItem key={group.category} value={group.category}>
                            {group.category}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Designation</label>
                  <Select
                    value={editDesignation}
                    onValueChange={setEditDesignation}
                    disabled={!selectedCategory || selectedCategory === "none"}
                  >
                    <SelectTrigger className="w-full bg-muted/30 border border-border/60 rounded-xl h-10 text-foreground cursor-pointer disabled:opacity-50">
                      <SelectValue placeholder={(!selectedCategory || selectedCategory === "none") ? "Select a department first" : "Select designation"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[250px] overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground">
                      {/* Search Input */}
                      <div className="p-2 border-b border-border/40 sticky top-0 bg-popover z-10">
                        <input
                          type="text"
                          placeholder="Search designation..."
                          value={designationSearch}
                          onChange={(e) => setDesignationSearch(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-2.5 py-1.5 bg-muted/40 rounded-lg border border-border/30 text-xs outline-none focus:border-primary/50 transition-all text-foreground font-medium"
                        />
                      </div>
                      <SelectItem value="none">None / No Designation</SelectItem>
                      {selectedCategory && selectedCategory !== "none" && (
                        <>
                          <SelectSeparator />
                          {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-4 text-center text-xs text-muted-foreground italic">
                              No matching designations
                            </div>
                          )}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <DialogFooter className="pt-3 border-t border-border/40 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditDialogOpen(false)}
                className="px-4 py-2 border border-border rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 font-medium rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
    </div>
  )
}
