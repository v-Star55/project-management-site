"use client"

import React, { useState, useMemo } from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  ClockIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  Edit3Icon,
  CalendarIcon,
  FileTextIcon,
  UserIcon,
  FolderOpenIcon,
  Loader2Icon,
  AlertCircleIcon,
  FilterIcon,
  XIcon
} from "lucide-react"
import Image from "next/image"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TimeLog {
  id: string
  startTime: string
  endTime: string
  duration: number // in minutes
  description: string | null
  userId: string
  user: {
    id: string
    name: string
    email: string
    imageUrl: string | null
    role: string
  }
  projectId: string | null
  project?: {
    id: string
    title: string
  } | null
  ticketId: string | null
  ticket?: {
    id: string
    title: string
  } | null
  createdAt: string
}

export default function TimeLogsView() {
  const { user } = useSelector((state: RootState) => state.user)
  const queryClient = useQueryClient()

  // State filters
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all")
  const [selectedTicketId, setSelectedTicketId] = useState<string>("all")
  const [selectedMemberId, setSelectedMemberId] = useState<string>("all")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Modals state
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<TimeLog | null>(null)

  // Form states
  const [formProjectId, setFormProjectId] = useState<string>("")
  const [formTicketId, setFormTicketId] = useState<string>("none")
  const [formStartTime, setFormStartTime] = useState<string>("")
  const [formEndTime, setFormEndTime] = useState<string>("")
  const [formDuration, setFormDuration] = useState<string>("")
  const [formDescription, setFormDescription] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isOwnerOrAdmin = user?.role === "owner" || user?.role === "admin"

  // ─── Fetch Projects ───────────────────────────────────────────
  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects")
      if (!res.ok) throw new Error("Failed to fetch projects")
      return res.json()
    }
  })
  const projects = projectsData?.projects || []

  // ─── Fetch Tickets ────────────────────────────────────────────
  const { data: ticketsData } = useQuery({
    queryKey: ["tickets"],
    queryFn: async () => {
      const res = await fetch("/api/tickets")
      if (!res.ok) throw new Error("Failed to fetch tickets")
      return res.json()
    }
  })
  const tickets = ticketsData?.tickets || []

  // ─── Fetch Team Members (Admin/Owner only) ────────────────────
  const companyId = user?.company?.id
  const { data: teamData } = useQuery({
    queryKey: ["teams", companyId],
    queryFn: async () => {
      if (!companyId) return { teams: [] }
      const res = await fetch(`/api/teams/${companyId}`)
      if (!res.ok) throw new Error("Failed to fetch team members")
      return res.json()
    },
    enabled: !!companyId && isOwnerOrAdmin,
  })
  const teamMembers = teamData?.teams || []
  const activeMembers = teamMembers.filter((m: any) => m.role !== "Client")

  // Filter tickets by selected project in Form
  const formFilteredTickets = useMemo(() => {
    if (!formProjectId) return []
    return tickets.filter((t: any) => t.projectId === formProjectId)
  }, [formProjectId, tickets])

  // Filter tickets by selected project in filters row
  const filterFilteredTickets = useMemo(() => {
    if (selectedProjectId === "all") return tickets
    return tickets.filter((t: any) => t.projectId === selectedProjectId)
  }, [selectedProjectId, tickets])

  // ─── Fetch Time Logs ──────────────────────────────────────────
  const { data: logsData, isLoading, isError, error } = useQuery({
    queryKey: ["time-logs", selectedProjectId, selectedTicketId, selectedMemberId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedProjectId && selectedProjectId !== "all") params.append("projectId", selectedProjectId)
      if (selectedTicketId && selectedTicketId !== "all") params.append("ticketId", selectedTicketId)
      if (selectedMemberId && selectedMemberId !== "all") params.append("userId", selectedMemberId)
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

      const res = await fetch(`/api/time-logs?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch time logs")
      return res.json()
    }
  })
  const allLogs: TimeLog[] = logsData?.timeLogs || []

  // Filter logs by search query (client side)
  const filteredLogs = useMemo(() => {
    if (!searchQuery) return allLogs
    const q = searchQuery.toLowerCase()
    return allLogs.filter(log => 
      (log.description || "").toLowerCase().includes(q) ||
      (log.user.name || "").toLowerCase().includes(q) ||
      (log.project?.title || "").toLowerCase().includes(q) ||
      (log.ticket?.title || "").toLowerCase().includes(q)
    )
  }, [allLogs, searchQuery])

  // ─── Stats Calculations ───────────────────────────────────────
  const stats = useMemo(() => {
    let total = 0
    let month = 0
    let week = 0
    let today = 0

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    
    // Start of current week (Sunday)
    const sunday = new Date(now)
    sunday.setDate(now.getDate() - now.getDay())
    const startOfWeek = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate()).getTime()

    // Start of current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime()

    filteredLogs.forEach(log => {
      const durHours = log.duration / 60
      total += durHours

      const logTime = new Date(log.startTime).getTime()
      if (logTime >= startOfToday) {
        today += durHours
      }
      if (logTime >= startOfWeek) {
        week += durHours
      }
      if (logTime >= startOfMonth) {
        month += durHours
      }
    })

    return {
      total: total.toFixed(1),
      month: month.toFixed(1),
      week: week.toFixed(1),
      today: today.toFixed(1)
    }
  }, [filteredLogs])

  // ─── Mutations ────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (logId: string) => {
      const res = await fetch(`/api/time-logs?id=${logId}`, {
        method: "DELETE"
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to delete time log")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Time log deleted successfully")
      queryClient.invalidateQueries({ queryKey: ["time-logs"] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    }
  })

  // ─── Actions ──────────────────────────────────────────────────
  const openLogModal = () => {
    // Set default values for new log
    setFormProjectId(projects[0]?.id || "")
    setFormTicketId("none")
    setFormDescription("")
    
    const nowStr = new Date().toISOString().slice(0, 16)
    setFormStartTime(nowStr)
    setFormEndTime(nowStr)
    setFormDuration("60")

    setEditingLog(null)
    setIsLogModalOpen(true)
  }

  const openEditModal = (log: TimeLog) => {
    setEditingLog(log)
    setFormProjectId(log.projectId || "")
    setFormTicketId(log.ticketId || "none")
    setFormDescription(log.description || "")
    setFormStartTime(new Date(log.startTime).toISOString().slice(0, 16))
    setFormEndTime(new Date(log.endTime).toISOString().slice(0, 16))
    setFormDuration(log.duration.toString())
    setIsLogModalOpen(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formProjectId) {
      toast.error("Please select a project")
      return
    }

    const dur = parseInt(formDuration, 10)
    if (isNaN(dur) || dur <= 0) {
      toast.error("Please enter a valid positive duration")
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        projectId: formProjectId,
        ticketId: formTicketId === "none" ? null : formTicketId,
        startTime: formStartTime ? new Date(formStartTime).toISOString() : null,
        endTime: formEndTime ? new Date(formEndTime).toISOString() : null,
        duration: dur,
        description: formDescription.trim() || null
      }

      let res
      if (editingLog) {
        res = await fetch("/api/time-logs", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingLog.id, ...payload })
        })
      } else {
        res = await fetch("/api/time-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
      }

      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || "Failed to save time log")

      toast.success(editingLog ? "Time log updated successfully" : "Time logged successfully")
      setIsLogModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ["time-logs"] })
    } catch (err: any) {
      toast.error(err.message || "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Auto-calculate end time or duration on change
  const handleStartTimeChange = (val: string) => {
    setFormStartTime(val)
    if (val && formDuration) {
      const startMs = new Date(val).getTime()
      const durMin = parseInt(formDuration, 10)
      if (!isNaN(durMin)) {
        const endStr = new Date(startMs + durMin * 60000).toISOString().slice(0, 16)
        setFormEndTime(endStr)
      }
    }
  }

  const handleEndTimeChange = (val: string) => {
    setFormEndTime(val)
    if (val && formStartTime) {
      const startMs = new Date(formStartTime).getTime()
      const endMs = new Date(val).getTime()
      if (endMs > startMs) {
        const diffMin = Math.round((endMs - startMs) / 60000)
        setFormDuration(diffMin.toString())
      }
    }
  }

  const handleDurationChange = (val: string) => {
    setFormDuration(val)
    const durMin = parseInt(val, 10)
    if (formStartTime && !isNaN(durMin) && durMin > 0) {
      const startMs = new Date(formStartTime).getTime()
      const endStr = new Date(startMs + durMin * 60000).toISOString().slice(0, 16)
      setFormEndTime(endStr)
    }
  }

  const formatLogDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  const formatLogTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 md:p-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Time Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor, filter, and record work hours logged across tasks.</p>
        </div>
        <button
          onClick={openLogModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <PlusIcon className="size-4" />
          Log Time
        </button>
      </div>

      {/* ─── Stats Cards Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-card/60 backdrop-blur-md p-5 rounded-2xl border border-border/60 shadow-xs flex flex-col gap-1.5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[80px] pointer-events-none" />
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Today</span>
          <span className="text-2xl font-black text-foreground">{stats.today} <span className="text-sm font-normal text-muted-foreground">hrs</span></span>
        </div>
        <div className="relative overflow-hidden bg-card/60 backdrop-blur-md p-5 rounded-2xl border border-border/60 shadow-xs flex flex-col gap-1.5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-[80px] pointer-events-none" />
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">This Week</span>
          <span className="text-2xl font-black text-foreground">{stats.week} <span className="text-sm font-normal text-muted-foreground">hrs</span></span>
        </div>
        <div className="relative overflow-hidden bg-card/60 backdrop-blur-md p-5 rounded-2xl border border-border/60 shadow-xs flex flex-col gap-1.5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-[80px] pointer-events-none" />
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">This Month</span>
          <span className="text-2xl font-black text-foreground">{stats.month} <span className="text-sm font-normal text-muted-foreground">hrs</span></span>
        </div>
        <div className="relative overflow-hidden bg-card/60 backdrop-blur-md p-5 rounded-2xl border border-border/60 shadow-xs flex flex-col gap-1.5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-[80px] pointer-events-none" />
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Total Hours Logged</span>
          <span className="text-2xl font-black text-foreground">{stats.total} <span className="text-sm font-normal text-muted-foreground">hrs</span></span>
        </div>
      </div>

      {/* ─── Filters Row ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 bg-card/40 backdrop-blur-md p-5 rounded-2xl border border-border/60 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <FilterIcon className="size-3.5" />
          <span>Filter Logs</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
          
          {/* Search */}
          <div className="relative w-full">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-muted/30 hover:bg-muted/50 rounded-xl border border-border/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-xs outline-none transition-all h-9"
            />
          </div>

          {/* Project filter */}
          <div>
            <Select value={selectedProjectId} onValueChange={(val) => {
              setSelectedProjectId(val)
              setSelectedTicketId("all")
            }}>
              <SelectTrigger className="w-full bg-muted/30 border-border/40 rounded-xl h-9 text-xs">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border/50 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ticket filter */}
          <div>
            <Select value={selectedTicketId} onValueChange={setSelectedTicketId}>
              <SelectTrigger className="w-full bg-muted/30 border-border/40 rounded-xl h-9 text-xs">
                <SelectValue placeholder="All Tickets" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border/50 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                <SelectItem value="all">All Tickets</SelectItem>
                {filterFilteredTickets.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Member filter (Admin/Owner only) */}
          {isOwnerOrAdmin ? (
            <div>
              <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                <SelectTrigger className="w-full bg-muted/30 border-border/40 rounded-xl h-9 text-xs">
                  <SelectValue placeholder="All Members" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border/50 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                  <SelectItem value="all">All Members</SelectItem>
                  {activeMembers.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {/* Date range inputs */}
          <div className="flex gap-2 items-center sm:col-span-2 lg:col-span-1">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-muted/30 hover:bg-muted/50 text-xs rounded-xl border border-border/40 focus:outline-none focus:border-primary/50 h-9"
              placeholder="Start"
            />
            <span className="text-muted-foreground text-xs font-semibold">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-muted/30 hover:bg-muted/50 text-xs rounded-xl border border-border/40 focus:outline-none focus:border-primary/50 h-9"
              placeholder="End"
            />
          </div>

        </div>
      </div>

      {/* ─── Main Content Loading & List ───────────────────────── */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center bg-card/30 rounded-2xl border border-dashed border-border/80">
          <Loader2Icon className="size-8 text-primary animate-spin mb-3" />
          <p className="font-semibold text-foreground">Loading time logs...</p>
        </div>
      ) : isError ? (
        <div className="py-20 flex flex-col items-center justify-center bg-red-500/5 rounded-2xl border border-dashed border-red-500/20 text-center">
          <AlertCircleIcon className="size-10 text-red-500/60 mb-3" />
          <p className="font-semibold text-foreground">Failed to load time logs</p>
          <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message || "Internal error."}</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center bg-card/30 rounded-2xl border border-dashed border-border/60 text-center">
          <ClockIcon className="size-10 text-muted-foreground/50 mb-3 animate-pulse" />
          <p className="font-semibold text-foreground">No time logs found</p>
          <p className="text-xs text-muted-foreground mt-1">Start by clicking "Log Time" to add your first work hours entry.</p>
        </div>
      ) : (
        <div className="bg-card/45 backdrop-blur-md rounded-2xl border border-border/60 overflow-hidden shadow-xs">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/40 text-[10px] font-bold tracking-widest text-muted-foreground uppercase bg-muted/10">
                  <th className="px-6 py-4">Logged By</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4">Timeline / Date</th>
                  <th className="px-6 py-4 text-right">Duration</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredLogs.map((log) => {
                  const isLogCreator = log.userId === user?.id
                  const canManage = isOwnerOrAdmin || isLogCreator

                  return (
                    <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                      {/* User Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Image
                            src={log.user.imageUrl || "https://github.com/shadcn.png"}
                            alt={log.user.name}
                            width={32}
                            height={32}
                            className="size-8 rounded-full border border-border object-cover shrink-0"
                            unoptimized
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-foreground truncate">{log.user.name}</span>
                            <span className="text-[10px] text-muted-foreground truncate capitalize">{log.user.role}</span>
                          </div>
                        </div>
                      </td>

                      {/* Details (Project & Ticket) */}
                      <td className="px-6 py-4 min-w-[240px]">
                        <div className="flex flex-col gap-1.5">
                          {log.project && (
                            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold tracking-wider uppercase text-primary/80 bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10 w-fit">
                              <FolderOpenIcon className="size-2.5" />
                              {log.project.title}
                            </span>
                          )}
                          {log.ticket && (
                            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold tracking-wider uppercase bg-stone-100 text-stone-600 dark:bg-stone-500/10 dark:text-stone-400 px-2 py-0.5 rounded-md border border-stone-200 dark:border-stone-500/20 w-fit">
                              <FileTextIcon className="size-2.5" />
                              {log.ticket.title}
                            </span>
                          )}
                          <p className="text-xs text-foreground/80 leading-relaxed font-medium mt-0.5 line-clamp-2">
                            {log.description || <span className="text-muted-foreground italic">No description provided</span>}
                          </p>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-foreground">{formatLogDate(log.startTime)}</span>
                          <span className="text-muted-foreground text-[10px]">
                            {formatLogTime(log.startTime)} - {formatLogTime(log.endTime)}
                          </span>
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="px-6 py-4 whitespace-nowrap text-right font-black text-sm text-foreground">
                        {(log.duration / 60).toFixed(1)} <span className="text-[10px] font-normal text-muted-foreground">hrs</span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {canManage ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEditModal(log)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                              title="Edit Log"
                            >
                              <Edit3Icon className="size-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this time log?")) {
                                  deleteMutation.mutate(log.id)
                                }
                              }}
                              className="p-1.5 rounded-lg text-red-500/70 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition cursor-pointer"
                              title="Delete Log"
                            >
                              <TrashIcon className="size-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">No access</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Log/Edit Time Dialog Overlay ───────────────────────── */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsLogModalOpen(false)}
          />
          
          <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <h2 className="text-lg font-black text-foreground">
                {editingLog ? "Edit Time Log" : "Log Hours Worked"}
              </h2>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition cursor-pointer"
              >
                <XIcon className="size-4.5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 flex flex-col gap-4">
              
              {/* Project Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Project</label>
                <Select value={formProjectId} onValueChange={(val) => {
                  setFormProjectId(val)
                  setFormTicketId("none")
                }}>
                  <SelectTrigger className="w-full bg-muted/20 border-border/40 rounded-xl h-10 px-3 text-xs">
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border/50 rounded-xl shadow-xl max-h-48 overflow-y-auto z-[300]">
                    {projects.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ticket Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ticket (Optional)</label>
                <Select value={formTicketId} onValueChange={setFormTicketId}>
                  <SelectTrigger className="w-full bg-muted/20 border-border/40 rounded-xl h-10 px-3 text-xs">
                    <SelectValue placeholder="No Associated Ticket" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border/50 rounded-xl shadow-xl max-h-48 overflow-y-auto z-[300]">
                    <SelectItem value="none">None</SelectItem>
                    {formFilteredTickets.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start & End Date Time inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formStartTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    className="w-full px-3 py-2 bg-muted/20 text-xs rounded-xl border border-border/40 focus:outline-none focus:border-primary/50 h-10"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formEndTime}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    className="w-full px-3 py-2 bg-muted/20 text-xs rounded-xl border border-border/40 focus:outline-none focus:border-primary/50 h-10"
                    required
                  />
                </div>
              </div>

              {/* Duration input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Duration (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  value={formDuration}
                  onChange={(e) => handleDurationChange(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/20 text-xs rounded-xl border border-border/40 focus:outline-none focus:border-primary/50 h-10"
                  placeholder="e.g. 60"
                  required
                />
              </div>

              {/* Description input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Work Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full min-h-[80px] px-3 py-2 bg-muted/20 text-xs rounded-xl border border-border/40 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 leading-relaxed resize-none"
                  placeholder="Describe the tasks done during this duration..."
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/40 mt-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <Loader2Icon className="size-3.5 animate-spin" />}
                  {editingLog ? "Save Changes" : "Log Hours"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}
