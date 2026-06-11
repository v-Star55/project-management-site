"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import axios from "axios"
import { format, formatDistanceToNow } from "date-fns"
import { 
  ArrowLeftIcon, 
  CheckCircle2Icon, 
  ClockIcon, 
  EyeIcon, 
  FileTextIcon, 
  LayersIcon, 
  LayoutListIcon, 
  SearchIcon,
  SettingsIcon,
  TrendingUpIcon,
  UsersIcon,
  CalendarIcon,
  LinkIcon,
  ActivityIcon,
  MoreVerticalIcon,
  EditIcon,
  PlusIcon
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import CreateTicket from "@/components/ticket/create-ticket"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface SprintDetailProps {
  projectId: string
  groupId: string
  userRole: string
  onBack: () => void
}

const getStatusBadgeClass = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    case "in_progress": return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    case "in_review": return "bg-purple-500/10 text-purple-500 border-purple-500/20"
    case "blocked": return "bg-red-500/10 text-red-500 border-red-500/20"
    case "pending":
    case "todo":
    case "not_started": return "bg-stone-500/10 text-stone-500 border-stone-500/20"
    default: return "bg-stone-500/10 text-stone-500 border-stone-500/20"
  }
}

const getPriorityClass = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case "high": return "text-red-500"
    case "medium": return "text-amber-500"
    case "low": return "text-emerald-500"
    default: return "text-stone-500"
  }
}

const getTicketTypeBadgeClass = (type: string) => {
  switch (type?.toLowerCase()) {
    case "bug":
      return "bg-rose-500/10 text-rose-500 border-rose-500/20"
    case "feature":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    case "task":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    case "improvement":
      return "bg-purple-500/10 text-purple-500 border-purple-500/20"
    case "documentation":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20"
    default:
      return "bg-slate-500/10 text-slate-500 border-slate-500/20"
  }
}

export default function SprintDetail({ projectId, groupId, userRole, onBack }: SprintDetailProps) {
  const params = useParams()
  const userId = params?.id
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("table")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAssignee, setSelectedAssignee] = useState("all")
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  // Edit Sprint State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editGoal, setEditGoal] = useState("")
  const [editStatus, setEditStatus] = useState("")
  const [editStartDate, setEditStartDate] = useState("")
  const [editEndDate, setEditEndDate] = useState("")

  // Add Ticket State
  const [isAddTicketOpen, setIsAddTicketOpen] = useState(false)

  const handleSearchChange = (val: string) => {
    setSearchQuery(val)
    setCurrentPage(1)
  }

  const handleAssigneeChange = (val: string) => {
    setSelectedAssignee(val)
    setCurrentPage(1)
  }

  const handlePriorityChange = (val: string) => {
    setSelectedPriority(val)
    setCurrentPage(1)
  }

  const handleStatusChange = (val: string) => {
    setSelectedStatus(val)
    setCurrentPage(1)
  }

  const handleTypeChange = (val: string) => {
    setSelectedType(val)
    setCurrentPage(1)
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ["project-group-detail", projectId, groupId],
    queryFn: async () => {
      const res = await axios.get(`/api/projects/${projectId}/groups/${groupId}`)
      return res.data
    },
    enabled: !!projectId && !!groupId,
  })

  const {
    data: activityData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["project-group-detail", projectId, groupId, "activity"],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await axios.get(
        `/api/projects/${projectId}/groups/${groupId}/activity?page=${pageParam}&limit=8`
      )
      return res.data
    },
    getNextPageParam: (lastPage: any) => lastPage.nextPage ?? undefined,
    initialPageParam: 1,
    enabled: !!projectId && !!groupId,
  })

  const allActivityLogs = React.useMemo(() => {
    return activityData?.pages.flatMap((page: any) => page.activityLogs) || []
  }, [activityData])

  useEffect(() => {
    const activeGroup = data?.group
    if (activeGroup) {
      setEditName(activeGroup.name || "")
      setEditDescription(activeGroup.description || "")
      setEditGoal(activeGroup.goal || "")
      setEditStatus(activeGroup.status || "not_started")
      setEditStartDate(activeGroup.startDate ? format(new Date(activeGroup.startDate), "yyyy-MM-dd") : "")
      setEditEndDate(activeGroup.endDate ? format(new Date(activeGroup.endDate), "yyyy-MM-dd") : "")
    }
  }, [data?.group, isEditOpen])

  const editSprintMutation = useMutation({
    mutationFn: async (payload: {
      name: string
      description: string
      goal?: string
      status: string
      startDate: string
      endDate?: string | null
    }) => {
      const res = await axios.patch(`/api/projects/${projectId}/groups/${groupId}`, payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-group-detail", projectId, groupId] })
      queryClient.invalidateQueries({ queryKey: ["project-groups", projectId] })
      toast.success("Sprint updated successfully!")
      setIsEditOpen(false)
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.error || "Failed to update sprint"
      toast.error(errMsg)
    }
  })

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName.trim()) {
      toast.error("Sprint Name is required")
      return
    }
    if (!editDescription.trim()) {
      toast.error("Description is required")
      return
    }
    if (!editStartDate) {
      toast.error("Start Date is required")
      return
    }

    editSprintMutation.mutate({
      name: editName.trim(),
      description: editDescription.trim(),
      goal: editGoal.trim() || undefined,
      status: editStatus,
      startDate: new Date(editStartDate).toISOString(),
      endDate: editEndDate ? new Date(editEndDate).toISOString() : null,
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    )
  }

  if (isError || !data?.group) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <LayersIcon className="size-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-bold">Failed to load sprint</h3>
        <p className="text-muted-foreground mb-4">The sprint might not exist or you don't have access.</p>
        <Button onClick={onBack} variant="outline">Go Back</Button>
      </div>
    )
  }

  const { group, activityLogs, projectMembers } = data
  const tickets = group.tickets || []
  
  const totalTickets = tickets.length
  const inProgress = tickets.filter((t: any) => t.status === "in_progress").length
  const inReview = tickets.filter((t: any) => t.status === "in_review").length
  const completed = tickets.filter((t: any) => t.status === "completed").length
  const progressPercent = totalTickets === 0 ? 0 : Math.round((completed / totalTickets) * 100)

  const filteredTickets = tickets.filter((t: any) => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesAssignee = 
      selectedAssignee === "all" || 
      t.assignedUserId === selectedAssignee
    
    const matchesPriority = 
      selectedPriority === "all" || 
      t.priority?.toLowerCase() === selectedPriority.toLowerCase()
    
    const matchesStatus = 
      selectedStatus === "all" || 
      t.status?.toLowerCase() === selectedStatus.toLowerCase()

    const matchesType = 
      selectedType === "all" || 
      t.type?.toLowerCase() === selectedType.toLowerCase()

    return matchesSearch && matchesAssignee && matchesPriority && matchesStatus && matchesType
  })

  // Pagination calculations
  const totalItems = filteredTickets.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex)

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300 pb-10">
      {/* Top Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={onBack} className="hover:text-foreground flex items-center gap-1 transition-colors">
          <ArrowLeftIcon className="size-4" />
          Back to Groups
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{group.name}</h1>
            <span className={cn("text-xs px-2.5 py-1 rounded-md font-semibold border flex items-center gap-1.5", getStatusBadgeClass(group.status))}>
              <div className="size-1.5 rounded-full bg-current" />
              {group.status.replace("_", " ")}
            </span>
          </div>
          <p className="text-sm text-muted-foreground max-w-3xl line-clamp-2">
            {group.description || "No description provided."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl shadow-sm h-10 hover:bg-muted/10" onClick={() => setIsEditOpen(true)}>
            <EditIcon className="size-4 mr-2" />
            Edit Sprint
          </Button>
          <Button className="rounded-xl shadow-sm h-10 bg-primary hover:bg-primary/90" onClick={() => setIsAddTicketOpen(true)}>
            <PlusIcon className="size-4 mr-2" />
            Add Ticket
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-300 hover:border-primary/30 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-0.5">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <LayoutListIcon className="size-4" />
            </div>
            <span className="text-2xl font-bold text-foreground">{totalTickets}</span>
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Tickets</span>
        </div>
        
        <div className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-300 hover:border-blue-500/30 hover:shadow-[0_4px_20px_-4px_rgba(59,130,246,0.1)] hover:-translate-y-0.5">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="size-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <ClockIcon className="size-4" />
            </div>
            <span className="text-2xl font-bold text-foreground">{inProgress}</span>
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">In Progress</span>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-300 hover:border-purple-500/30 hover:shadow-[0_4px_20px_-4px_rgba(168,85,247,0.1)] hover:-translate-y-0.5">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="size-8 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <EyeIcon className="size-4" />
            </div>
            <span className="text-2xl font-bold text-foreground">{inReview}</span>
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">In Review</span>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_4px_20px_-4px_rgba(16,185,129,0.1)] hover:-translate-y-0.5">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="size-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2Icon className="size-4" />
            </div>
            <span className="text-2xl font-bold text-foreground">{completed}</span>
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Completed</span>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-300 hover:border-stone-500/30 hover:shadow-[0_4px_20px_-4px_rgba(120,113,108,0.1)] hover:-translate-y-0.5">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="size-8 rounded-full bg-stone-500/10 text-stone-500 flex items-center justify-center">
              <CalendarIcon className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">
                {format(new Date(group.startDate), "MMM dd")} – {group.endDate ? format(new Date(group.endDate), "MMM dd, yyyy") : "Ongoing"}
              </span>
            </div>
          </div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Duration</span>
        </div>
      </div>      {/* Main Content & Activity Log Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* Left Column (Tabs & Main Content) */}
        <div className="lg:col-span-3 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
            <TabsList variant="line" className="bg-transparent border-b border-border w-full justify-start rounded-none h-auto p-0 gap-6">
              <TabsTrigger 
                value="table" 
                className="flex-none data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-1 py-3 text-sm font-semibold data-[state=active]:text-primary after:bg-primary transition-all duration-200"
              >
                <LayoutListIcon className="size-4 mr-2" />
                Table
              </TabsTrigger>
              <TabsTrigger 
                value="files" 
                className="flex-none data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-1 py-3 text-sm font-semibold data-[state=active]:text-primary after:bg-primary transition-all duration-200"
              >
                <FileTextIcon className="size-4 mr-2" />
                Files
              </TabsTrigger>
            </TabsList>

            <TabsContent value="table" className="pt-4 border-none p-0 outline-none flex-1 flex flex-col">
              <div className="flex-1 flex flex-col gap-4 bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
                
                {/* Table Controls */}
                <div className="p-4 flex flex-wrap gap-3 items-center justify-between border-b border-border/40">
                  <div className="relative w-full max-w-[280px]">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search tickets..." 
                      className="pl-9 bg-muted/20 border-border/40 h-9 rounded-xl text-sm"
                      value={searchQuery}
                      onChange={e => handleSearchChange(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap items-center">
                    {/* Assignee Filter */}
                    <Select value={selectedAssignee} onValueChange={handleAssigneeChange}>
                      <SelectTrigger className="h-8 rounded-lg text-xs font-medium border-border/50 bg-background w-[140px]">
                        <SelectValue placeholder="All Assignees" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Assignees</SelectItem>
                        {projectMembers?.map((member: any) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Priority Filter */}
                    <Select value={selectedPriority} onValueChange={handlePriorityChange}>
                      <SelectTrigger className="h-8 rounded-lg text-xs font-medium border-border/50 bg-background w-[120px]">
                        <SelectValue placeholder="All Priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Status Filter */}
                    <Select value={selectedStatus} onValueChange={handleStatusChange}>
                      <SelectTrigger className="h-8 rounded-lg text-xs font-medium border-border/50 bg-background w-[130px]">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="in_review">In Review</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="reopen">Reopen</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                        <SelectItem value="backlog">Backlog</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Type Filter */}
                    <Select value={selectedType} onValueChange={handleTypeChange}>
                      <SelectTrigger className="h-8 rounded-lg text-xs font-medium border-border/50 bg-background w-[110px]">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="feature">Feature</SelectItem>
                        <SelectItem value="bug">Bug</SelectItem>
                        <SelectItem value="improvement">Improvement</SelectItem>
                        <SelectItem value="documentation">Documentation</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Reset Filters */}
                    {(selectedAssignee !== "all" || selectedPriority !== "all" || selectedStatus !== "all" || selectedType !== "all" || searchQuery !== "") && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-xs text-muted-foreground hover:text-foreground font-semibold px-2 rounded-lg"
                        onClick={() => {
                          setSelectedAssignee("all")
                          setSelectedPriority("all")
                          setSelectedStatus("all")
                          setSelectedType("all")
                          setSearchQuery("")
                          setCurrentPage(1)
                        }}
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto flex-1">
                  <Table>
                    <TableHeader className="bg-muted/10 hover:bg-muted/10">
                      <TableRow className="border-border/40">
                        <TableHead className="w-[80px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">ID</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Group</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assignee</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right pr-4">Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTickets.length > 0 ? (
                        paginatedTickets.map((ticket: any) => (
                          <TableRow key={ticket.id} className="border-border/40 hover:bg-muted/10 cursor-pointer">
                            <TableCell className="font-medium text-xs text-muted-foreground">
                              {ticket.id.slice(-6).toUpperCase()}
                            </TableCell>
                            <TableCell className="font-medium text-sm text-foreground">
                              {ticket.title}
                            </TableCell>
                            <TableCell>
                              <span className={cn("px-2 py-0.5 border rounded text-[10px] font-semibold capitalize", getTicketTypeBadgeClass(ticket.type))}>
                                {ticket.type || "task"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-[10px] font-semibold">
                                {group.name}
                              </span>
                            </TableCell>
                            <TableCell>
                              {ticket.assignedUser ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="size-6 border">
                                    <AvatarImage src={ticket.assignedUser.imageUrl || "https://github.com/shadcn.png"} />
                                    <AvatarFallback className="text-[9px] font-bold">{ticket.assignedUser.name.slice(0,2).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs font-medium text-foreground">{ticket.assignedUser.name}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">Unassigned</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <div className={cn("size-2 rounded-full", getStatusBadgeClass(ticket.status).split(" ")[0].replace("bg-", "bg-").replace("/10", ""))} />
                                <span className="text-xs text-foreground font-medium capitalize">{ticket.status.replace("_", " ")}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <div className={cn("size-1.5 rounded-full bg-current", getPriorityClass(ticket.priority))} />
                                <span className="text-xs text-foreground font-medium capitalize">{ticket.priority}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground pr-4">
                              {format(new Date(ticket.createdAt), "MMM dd, yyyy")}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                            No tickets found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="p-4 flex items-center justify-between border-t border-border/40 bg-muted/5">
                    <span className="text-xs text-muted-foreground">
                      Showing {startIndex + 1} to {endIndex} of {totalItems} tickets
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 rounded-lg text-xs"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }).map((_, i) => (
                          <Button
                            key={i}
                            variant={currentPage === i + 1 ? "default" : "outline"}
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg text-xs font-semibold"
                            onClick={() => setCurrentPage(i + 1)}
                          >
                            {i + 1}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 rounded-lg text-xs"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="files" className="pt-4 outline-none flex-1 flex flex-col">
              <div className="flex-1 flex flex-col items-center justify-center bg-card border border-border/50 rounded-2xl min-h-[300px] shadow-sm">
                <FileTextIcon className="size-10 text-muted-foreground/40 mb-3" />
                <h3 className="font-semibold text-foreground">No files attached</h3>
                <p className="text-xs text-muted-foreground">Files related to this sprint will appear here.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column (Activity Log Sidebar) */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-sm text-foreground">Activity Log</h3>
              <Link 
                href={`/dashboard/${userId}/projects/${projectId}?tab=overview`}
                className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                View All
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-5 flex flex-col justify-between">
              <div className="space-y-5">
                {allActivityLogs.length > 0 ? (
                  allActivityLogs.map((log: any, index: number) => (
                    <div key={log.id} className="flex gap-3 relative group">
                      <Avatar className="size-8 border border-border bg-background z-10 relative mt-0.5 shrink-0">
                        <AvatarImage src={log.user.imageUrl || "https://github.com/shadcn.png"} />
                        <AvatarFallback className="text-[10px] font-bold">{log.user.name.slice(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      
                      {/* Vertical connecting line */}
                      {index < allActivityLogs.length - 1 && (
                        <div className="absolute left-4 top-8 bottom-[-20px] w-[1px] bg-border/60" />
                      )}

                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-foreground truncate">{log.user.name}</span>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug break-words">
                          {log.description}
                        </p>
                        <div className="mt-2">
                          <span className="inline-flex px-1.5 py-0.5 bg-muted/50 border border-border/50 rounded text-[9px] font-semibold text-muted-foreground">
                            {group.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <ActivityIcon className="size-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">No recent activity</p>
                  </div>
                )}
              </div>

              {hasNextPage && (
                <div className="pt-2 border-t border-border/40 mt-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs font-semibold text-primary hover:text-primary/80 transition-colors py-1.5 h-auto rounded-lg"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? "Loading more..." : "Load More Activity"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Footer Grid Sections */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <h4 className="font-bold text-sm mb-4">Sprint Details</h4>
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5"><CalendarIcon className="size-3.5" /> Start Date</span>
              <span className="font-medium">{format(new Date(group.startDate), "MMM dd, yyyy")}</span>
            </div>
            {group.endDate && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5"><CalendarIcon className="size-3.5" /> End Date</span>
                <span className="font-medium">{format(new Date(group.endDate), "MMM dd, yyyy")}</span>
              </div>
            )}
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border/40">
              <div className="flex justify-between text-xs font-semibold">
                <span>Progress</span>
                <span>{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <span className="text-[10px] text-muted-foreground text-right">{completed} of {totalTickets} completed</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-sm">Team</h4>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] uppercase font-bold tracking-wider rounded-md">Manage</Button>
          </div>
          <div className="flex flex-col gap-3">
            {projectMembers?.slice(0, 4).map((member: any) => (
              <div key={member.id} className="flex items-center gap-2.5">
                <Avatar className="size-8 border border-border">
                  <AvatarImage src={member.imageUrl || "https://github.com/shadcn.png"} />
                  <AvatarFallback className="text-[10px] font-bold">{member.name.slice(0,2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-foreground truncate">{member.name}</span>
                  <span className="text-[10px] text-muted-foreground truncate">{member.designation || member.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <h4 className="font-bold text-sm mb-2">Description & Goal</h4>
          <div className="text-xs text-muted-foreground leading-relaxed">
            {group.goal ? (
              <span className="block mb-2 font-medium text-foreground bg-primary/5 p-2 rounded-lg border border-primary/10">
                🎯 Goal: {group.goal}
              </span>
            ) : null}
            <p className="line-clamp-4">{group.description}</p>
          </div>
          <Button variant="outline" size="sm" className="w-full mt-4 h-8 text-xs hover:bg-muted/10" onClick={() => setIsEditOpen(true)}>Edit Description</Button>
        </div>

        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm flex flex-col">
          <h4 className="font-bold text-sm mb-3">Quick Links</h4>
          <div className="flex flex-col gap-1">
            <Button variant="ghost" className="justify-start h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
              <LayoutListIcon className="size-3.5 mr-2" /> Sprint Backlog
            </Button>
            <Button variant="ghost" className="justify-start h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
              <TrendingUpIcon className="size-3.5 mr-2" /> Burndown Chart
            </Button>
            <Button variant="ghost" className="justify-start h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
              <LinkIcon className="size-3.5 mr-2" /> Sprint Roadmap
            </Button>
            <Button variant="ghost" className="justify-start h-8 px-2 text-xs text-muted-foreground hover:text-foreground" onClick={() => setActiveTab("files")}>
              <FileTextIcon className="size-3.5 mr-2" /> Files & Documents
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Sprint Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border border-border/80 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <EditIcon className="size-5 text-primary" />
              Edit Sprint Details
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modify the sprint name, duration, and main goals.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="sprint-name" className="text-xs font-bold text-foreground/80 uppercase">
                Sprint Name
              </Label>
              <Input
                id="sprint-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Sprint 1"
                className="bg-muted/15 border-border/50 rounded-xl"
                required
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="sprint-desc" className="text-xs font-bold text-foreground/80 uppercase">
                Description
              </Label>
              <Textarea
                id="sprint-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Describe the main focus and scope of this sprint..."
                className="bg-muted/15 border-border/50 rounded-xl min-h-[90px]"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="sprint-goal" className="text-xs font-bold text-foreground/80 uppercase">
                Goal (Optional)
              </Label>
              <Input
                id="sprint-goal"
                value={editGoal}
                onChange={(e) => setEditGoal(e.target.value)}
                placeholder="e.g. Release beta version to testing environment"
                className="bg-muted/15 border-border/50 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="sprint-start" className="text-xs font-bold text-foreground/80 uppercase">
                  Start Date
                </Label>
                <Input
                  id="sprint-start"
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="bg-muted/15 border-border/50 rounded-xl text-sm"
                  required
                />
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="sprint-end" className="text-xs font-bold text-foreground/80 uppercase">
                  End Date (Optional)
                </Label>
                <Input
                  id="sprint-end"
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  className="bg-muted/15 border-border/50 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground/80 uppercase">
                Status
              </Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger className="bg-muted/15 border-border/50 rounded-xl text-sm h-10">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent className="border-border/50 rounded-xl">
                  <SelectItem value="not_started" className="cursor-pointer">Not Started</SelectItem>
                  <SelectItem value="in_progress" className="cursor-pointer">In Progress</SelectItem>
                  <SelectItem value="completed" className="cursor-pointer">Completed</SelectItem>
                  <SelectItem value="on_hold" className="cursor-pointer">On Hold</SelectItem>
                  <SelectItem value="cancelled" className="cursor-pointer">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4 border-t border-border/40 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={editSprintMutation.isPending} className="rounded-xl font-bold bg-primary hover:bg-primary/90">
                {editSprintMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Ticket Drawer Sheet */}
      <CreateTicket
        open={isAddTicketOpen}
        onClose={() => setIsAddTicketOpen(false)}
        defaultProjectId={projectId}
        defaultGroupId={groupId}
      />
    </div>
  )
}
