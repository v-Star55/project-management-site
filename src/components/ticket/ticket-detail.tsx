"use client"

import { useEffect, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { Ticket } from "../dashboard/ticketsView"
import {
  CalendarIcon,
  CheckSquareIcon,
  ClockIcon,
  AlertCircleIcon,
  RotateCcwIcon,
  EyeIcon,
  XIcon,
  LayersIcon,
  MessageSquareIcon,
  CalendarClockIcon,
  MoreVertical as MoreVerticalIcon,
  Trash as TrashIcon,
  Edit as EditIcon,
  Loader2Icon,
} from "lucide-react"
import Image from "next/image"
import TicketAttachments from "./ticket-attachments"
import TicketTimeLogs from "./ticket-time-logs"
import ReasonDialog from "./reason-dialog"
import TicketComments from "./ticket-comments"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const STATUS_MAP: Record<string, string> = {
  pending: "Todo",
  in_progress: "In Progress",
  completed: "Completed",
  reopen: "Reopen",
  in_review: "In Review",
  blocked: "Blocked",
}

const getDisplayStatus = (raw: string): string =>
  STATUS_MAP[raw] ?? raw.charAt(0).toUpperCase() + raw.slice(1)

const getStatusMeta = (status: string) => {
  const display = getDisplayStatus(status)
  switch (display) {
    case "Completed":
      return {
        color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        dot: "bg-emerald-500",
        icon: <CheckSquareIcon className="size-3.5" />,
      }
    case "In Progress":
      return {
        color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        dot: "bg-blue-500",
        icon: <ClockIcon className="size-3.5 animate-pulse" />,
      }
    case "In Review":
      return {
        color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        dot: "bg-purple-500",
        icon: <EyeIcon className="size-3.5 animate-pulse" />,
      }
    case "Blocked":
      return {
        color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
        dot: "bg-red-500",
        icon: <AlertCircleIcon className="size-3.5" />,
      }
    case "Todo":
      return {
        color: "bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/20",
        dot: "bg-stone-400",
        icon: <CheckSquareIcon className="size-3.5" />,
      }
    case "Reopen":
      return {
        color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        dot: "bg-amber-500",
        icon: <RotateCcwIcon className="size-3.5" />,
      }
    default:
      return {
        color: "bg-muted text-muted-foreground border-border",
        dot: "bg-muted-foreground",
        icon: <CheckSquareIcon className="size-3.5" />,
      }
  }
}

const getInitials = (name: string) =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface TicketDetailProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: Ticket | null
  onStatusUpdate?: (status: string, reason?: string) => void
  onPriorityUpdate?: (priority: string) => void
}

export default function TicketDetail({
  open,
  onOpenChange,
  ticket,
  onStatusUpdate,
  onPriorityUpdate,
}: TicketDetailProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  
  const [pendingStatus, setPendingStatus] = useState<"blocked" | "reopen" | null>(null)
  const currentUser = useSelector((state: RootState) => state.user.user)
  const [activeTab, setActiveTab] = useState<"details" | "comments">("details")

  // Editing state
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">("low")
  const [editAssignedUserId, setEditAssignedUserId] = useState<string>("unassigned")
  const [editGroupId, setEditGroupId] = useState<string>("none")
  const [editDueDate, setEditDueDate] = useState<string | undefined>(undefined)

  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Sync edits when ticket changes
  useEffect(() => {
    if (ticket) {
      setEditTitle(ticket.title)
      setEditDescription(ticket.description || "")
      setEditPriority((ticket.priority?.toLowerCase() as any) || "low")
      setEditAssignedUserId(ticket.assignedUserId || "unassigned")
      setEditGroupId(ticket.groupId || "none")
      setEditDueDate(ticket.dueDate || undefined)
      setIsEditing(false)
    }
  }, [ticket])

  // Fetch Project details for member list and admin checks
  const { data: projectDetails } = useQuery({
    queryKey: ["project-edit", ticket?.projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${ticket?.projectId}`)
      if (!res.ok) throw new Error("Failed to fetch project")
      const data = await res.json()
      return data.project
    },
    enabled: open && !!ticket?.projectId,
  })

  // Fetch groups details
  const { data: groupsData } = useQuery({
    queryKey: ["project-groups-edit", ticket?.projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${ticket?.projectId}/groups`)
      if (!res.ok) throw new Error("Failed to fetch groups")
      const data = await res.json()
      return data.groups
    },
    enabled: open && !!ticket?.projectId,
  })

  const projectMembers: any[] = []
  if (projectDetails) {
    if (projectDetails.admins) projectMembers.push(...projectDetails.admins)
    if (projectDetails.members) projectMembers.push(...projectDetails.members)
  }
  const projectGroups = groupsData || []

  // Check roles
  const isOwner = currentUser?.role === "owner"
  const isProjectAdmin = projectDetails?.admins?.some((a: any) => a.id === currentUser?.id)
  const isProjectAdminOrOwner = isOwner || !!isProjectAdmin

  // Reset active tab to details when ticket changes
  useEffect(() => {
    setActiveTab("details")
  }, [ticket?.id])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    if (open) document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open, onOpenChange])

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!ticket) return null

  const handleSave = async () => {
    if (!editTitle.trim()) {
      toast.error("Title is required")
      return
    }
    setIsSaving(true)
    try {
      const payload: any = {
        id: ticket.id,
        title: editTitle.trim(),
        description: editDescription.trim(),
        priority: editPriority,
        assignedUserId: editAssignedUserId === "unassigned" ? "unassigned" : editAssignedUserId,
        groupId: editGroupId === "none" ? "none" : editGroupId,
        dueDate: editDueDate || null,
      }

      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update ticket")
      }

      toast.success("Ticket updated successfully!")
      setIsEditing(false)
      
      // Invalidate queries to refresh Kanban and all states
      queryClient.invalidateQueries({ queryKey: ["project", ticket.projectId] })
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
      queryClient.invalidateQueries({ queryKey: ["schedule"] })
      
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to save changes")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/tickets?id=${ticket.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete ticket")
      }

      toast.success("Ticket deleted successfully!")
      setIsDeleteDialogOpen(false)
      onOpenChange(false)

      queryClient.invalidateQueries({ queryKey: ["project", ticket.projectId] })
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
      queryClient.invalidateQueries({ queryKey: ["schedule"] })
    } catch (err: any) {
      toast.error(err.message || "Failed to delete ticket")
    } finally {
      setIsDeleting(false)
    }
  }

  const { color: statusColor, dot: statusDot, icon: statusIcon } = getStatusMeta(ticket.status)

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={() => onOpenChange(false)}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Modal Panel */}
      <div
        role="dialog"
        aria-modal="true"
        ref={overlayRef}
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 transition-all duration-300 pointer-events-none ${
          open ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <div
          className={`relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-card rounded-3xl shadow-2xl border border-border/60 overflow-hidden ${
            open ? "pointer-events-auto" : "pointer-events-none"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Gradient Header ──────────────────────────────────── */}
          <div className="relative flex-shrink-0 bg-gradient-to-br from-primary/8 via-card to-card border-b border-border/50 px-7 pt-7 pb-5">
            {/* Decorative blob */}
            <div className="absolute top-0 right-0 w-64 h-32 bg-primary/5 rounded-bl-[100px] pointer-events-none" />

            <div className="relative flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-primary uppercase bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/15">
                    <LayersIcon className="size-3" />
                    {ticket.project?.title || "No Project"}
                  </span>
                  {ticket.group && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase bg-stone-100 text-stone-600 dark:bg-stone-500/10 dark:text-stone-400 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-500/20">
                      <LayersIcon className="size-3" />
                      Group: {ticket.group.name}
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-lg border ${statusColor}`}>
                    {statusIcon}
                    {getDisplayStatus(ticket.status)}
                  </span>
                </div>

                {/* Title */}
                {isEditing ? (
                  <div className="mr-8 mt-1">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-tight bg-transparent border-b border-border/80 focus:outline-none focus:border-primary w-full py-1"
                      placeholder="Ticket Title"
                    />
                  </div>
                ) : (
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-tight pr-8">
                    {ticket.title}
                  </h2>
                )}

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1.5">
                    <CalendarIcon className="size-3.5 opacity-60" />
                    <span>Created <strong className="text-foreground/80 font-semibold">{formatDateTime(ticket.createdAt)}</strong></span>
                  </span>
                  <span className="h-3 w-px bg-border/60 hidden sm:block" />
                  <span className="flex items-center gap-1.5">
                    <ClockIcon className="size-3.5 opacity-60" />
                    <span>Updated <strong className="text-foreground/80 font-semibold">{formatDateTime(ticket.updatedAt)}</strong></span>
                  </span>
                  {ticket.dueDate && !isEditing && (
                    <>
                      <span className="h-3 w-px bg-border/60 hidden sm:block" />
                      <span className={`flex items-center gap-1.5 ${
                        new Date(ticket.dueDate) < new Date() && ticket.status !== "completed"
                          ? "text-red-500"
                          : "text-amber-500"
                      }`}>
                        <CalendarClockIcon className="size-3.5" />
                        <span>Due <strong className="font-semibold">{formatDateTime(ticket.dueDate)}</strong></span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                {isProjectAdminOrOwner && !isEditing && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="p-2 rounded-xl hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer"
                      >
                        <MoreVerticalIcon className="size-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36 z-[100] bg-popover border border-border/50 rounded-2xl shadow-xl">
                      <DropdownMenuItem className="rounded-xl flex items-center gap-2 cursor-pointer" onClick={() => setIsEditing(true)}>
                        <EditIcon className="size-4" />
                        Edit Ticket
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        className="rounded-xl flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                        onClick={() => setIsDeleteDialogOpen(true)}
                      >
                        <TrashIcon className="size-4" />
                        Delete Ticket
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Close */}
                <button
                  onClick={() => {
                    setIsEditing(false)
                    onOpenChange(false)
                  }}
                  className="p-2 rounded-xl hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer"
                >
                  <XIcon className="size-5" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Scrollable Body ────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] divide-y lg:divide-y-0 lg:divide-x divide-border/40">

              {/* ── LEFT SIDEBAR ─────────────────────────────── */}
              <aside className="flex flex-col gap-0 p-6 bg-muted/10">

                {/* Status Overview */}
                <div className="mb-5">
                  <p className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase mb-2.5">Current Status</p>
                  <div className="flex items-center gap-2.5 p-3 bg-card border border-border/50 rounded-2xl shadow-xs">
                    <span className={`size-2.5 rounded-full shrink-0 ${statusDot}`} />
                    <span className="text-sm font-bold text-foreground">{getDisplayStatus(ticket.status)}</span>
                  </div>
                </div>

                {/* Priority Selection */}
                <div className="mb-5">
                  <p className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase mb-2.5">Priority</p>
                  {isEditing ? (
                    <div className="flex gap-1.5">
                      {["low", "medium", "high"].map((p) => {
                        const isSelected = editPriority === p
                        let priorityColorClass = ""
                        if (isSelected) {
                          if (p === "high") priorityColorClass = "bg-red-500 text-white border-red-500 shadow-sm font-bold"
                          else if (p === "medium") priorityColorClass = "bg-amber-500 text-white border-amber-500 shadow-sm font-bold"
                          else priorityColorClass = "bg-blue-500 text-white border-blue-500 shadow-sm font-bold"
                        } else {
                          priorityColorClass = "bg-card hover:bg-muted/60 text-muted-foreground border-border/40"
                        }
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setEditPriority(p as any)}
                            className={`flex-1 text-center py-1.5 rounded-xl text-xs capitalize border transition-all duration-150 cursor-pointer ${priorityColorClass}`}
                          >
                            {p}
                          </button>
                        )
                      })}
                    </div>
                  ) : onPriorityUpdate ? (
                    <div className="flex gap-1.5">
                      {["low", "medium", "high"].map((p) => {
                        const isSelected = ticket.priority?.toLowerCase() === p
                        let priorityColorClass = ""
                        if (isSelected) {
                          if (p === "high") priorityColorClass = "bg-red-500 text-white border-red-500 shadow-sm font-bold"
                          else if (p === "medium") priorityColorClass = "bg-amber-500 text-white border-amber-500 shadow-sm font-bold"
                          else priorityColorClass = "bg-blue-500 text-white border-blue-500 shadow-sm font-bold"
                        } else {
                          priorityColorClass = "bg-card hover:bg-muted/60 text-muted-foreground border-border/40"
                        }
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => onPriorityUpdate(p)}
                            className={`flex-1 text-center py-1.5 rounded-xl text-xs capitalize border transition-all duration-150 cursor-pointer ${priorityColorClass}`}
                          >
                            {p}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 p-3 bg-card border border-border/50 rounded-2xl shadow-xs">
                      <span className="text-sm font-bold text-foreground capitalize">{ticket.priority || "Low"}</span>
                    </div>
                  )}
                </div>

                {/* Assignee */}
                {isEditing ? (
                  <div className="mb-5">
                    <p className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase mb-2.5">Assigned To</p>
                    <Select value={editAssignedUserId} onValueChange={setEditAssignedUserId}>
                      <SelectTrigger className="w-full bg-card border border-border/50 rounded-2xl h-10 px-3 text-xs">
                        <SelectValue placeholder="Select Assignee" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border border-border/50 rounded-2xl shadow-xl z-[200] max-h-60 overflow-y-auto">
                        <SelectItem value="unassigned" className="rounded-xl cursor-pointer">Unassigned</SelectItem>
                        {projectMembers.map((member: any) => (
                          <SelectItem key={member.id} value={member.id} className="rounded-xl cursor-pointer">
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : ticket.assignedUser ? (
                  <div className="mb-5">
                    <p className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase mb-2.5">Assigned To</p>
                    <div className="flex items-center gap-3 p-3 bg-card border border-border/50 rounded-2xl shadow-xs">
                      <Image
                        src={ticket.assignedUser.imageUrl || "https://github.com/shadcn.png"}
                        alt={ticket.assignedUser.name}
                        width={40}
                        height={40}
                        className="size-10 rounded-full border border-border object-cover shrink-0"
                        unoptimized
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-foreground truncate">{ticket.assignedUser.name}</span>
                        <span className="text-[11px] text-muted-foreground truncate">{ticket.assignedUser.email}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-5">
                    <p className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase mb-2.5">Assigned To</p>
                    <div className="p-3 bg-card border border-dashed border-border/50 rounded-2xl text-center">
                      <p className="text-xs text-muted-foreground italic">Unassigned</p>
                    </div>
                  </div>
                )}

                {/* Group (Only shown in Editing mode or if it is present) */}
                {isEditing ? (
                  <div className="mb-5">
                    <p className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase mb-2.5">Project Group</p>
                    <Select value={editGroupId} onValueChange={setEditGroupId}>
                      <SelectTrigger className="w-full bg-card border border-border/50 rounded-2xl h-10 px-3 text-xs">
                        <SelectValue placeholder="Select Group" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border border-border/50 rounded-2xl shadow-xl z-[200] max-h-60 overflow-y-auto">
                        <SelectItem value="none" className="rounded-xl cursor-pointer">None</SelectItem>
                        {projectGroups.map((g: any) => (
                          <SelectItem key={g.id} value={g.id} className="rounded-xl cursor-pointer">
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}

                {/* Due Date (Only shown in Editing mode) */}
                {isEditing ? (
                  <div className="mb-5">
                    <p className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase mb-2.5">Due Date</p>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full flex items-center justify-start text-left font-normal bg-card border border-border/50 hover:bg-muted/20 text-foreground rounded-2xl h-10 px-3 text-xs cursor-pointer"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                          {editDueDate ? new Date(editDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : <span>Pick a date</span>}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl border border-border/50 z-[200] bg-popover shadow-xl" align="start">
                        <Calendar
                          mode="single"
                          selected={editDueDate ? new Date(editDueDate) : undefined}
                          onSelect={(date) => setEditDueDate(date ? date.toISOString() : undefined)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                ) : null}

                {/* Update Status Quick Actions (Only when not editing) */}
                {!isEditing && onStatusUpdate && (
                  <div>
                    <p className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase mb-2.5">Update Status</p>
                    <div className="flex flex-col gap-1.5">
                      {Object.entries(STATUS_MAP).map(([rawStatus, label]) => {
                        const isActive = ticket.status === rawStatus
                        const { dot, icon } = getStatusMeta(rawStatus)
                        return (
                          <button
                            key={rawStatus}
                            type="button"
                            onClick={() => {
                              if (rawStatus === "blocked" || rawStatus === "reopen") {
                                setPendingStatus(rawStatus)
                              } else {
                                onStatusUpdate(rawStatus)
                              }
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-150 cursor-pointer ${
                              isActive
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground border-border/40"
                            }`}
                          >
                            <span className={`size-2 rounded-full shrink-0 ${isActive ? "bg-primary-foreground/70" : dot}`} />
                            {icon}
                            {label}
                            {isActive && (
                              <span className="ml-auto text-[9px] font-bold uppercase tracking-wider opacity-80">Current</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Save/Cancel actions for editing */}
                {isEditing && (
                  <div className="mt-auto pt-6 flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="w-full py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isSaving && <Loader2Icon className="size-3.5 animate-spin" />}
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                      className="w-full py-2.5 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-bold rounded-xl border border-border/40 transition-all cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </aside>

              {/* ── RIGHT MAIN CONTENT ────────────────────────── */}
              <main className="flex flex-col gap-0 p-6 overflow-y-auto">

                {/* Reason Banners */}
                {ticket.status === "blocked" && ticket.reasonBlocked && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-start gap-3 text-red-700 dark:text-red-400">
                    <AlertCircleIcon className="size-5 shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Blocked Reason</span>
                      <p className="text-sm mt-0.5">{ticket.reasonBlocked}</p>
                    </div>
                  </div>
                )}

                {ticket.status === "reopen" && ticket.reasonReopen && (
                  <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-start gap-3 text-amber-700 dark:text-amber-400">
                    <RotateCcwIcon className="size-5 shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Reopen Reason</span>
                      <p className="text-sm mt-0.5">{ticket.reasonReopen}</p>
                    </div>
                  </div>
                )}

                {/* Tabs Switcher */}
                <div className="flex border-b border-border/40 pb-px gap-6 mb-6">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`pb-3 text-sm font-bold tracking-wide transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                      activeTab === "details"
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <LayersIcon className="size-4" />
                    Ticket Details
                  </button>
                  <button
                    onClick={() => setActiveTab("comments")}
                    className={`pb-3 text-sm font-bold tracking-wide transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                      activeTab === "comments"
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <MessageSquareIcon className="size-4" />
                    Comments
                  </button>
                </div>

                {activeTab === "details" ? (
                  <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                    {/* Description */}
                    <section>
                      <h3 className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase mb-3">Description</h3>
                      {isEditing ? (
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full min-h-[150px] bg-muted/15 border border-border/40 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-2xl p-5 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap"
                          placeholder="Provide a detailed description of the ticket..."
                        />
                      ) : (
                        <div className="relative bg-muted/20 border border-border/40 rounded-2xl p-5 min-h-[100px] text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                          {ticket.description ? (
                            ticket.description
                          ) : (
                            <span className="text-muted-foreground italic">No description provided for this ticket.</span>
                          )}
                        </div>
                      )}
                    </section>

                    {/* Divider */}
                    <div className="w-full h-px bg-border/30" />

                    {/* Attachments & Time Logs */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      <TicketAttachments ticket={ticket} />
                      <TicketTimeLogs ticket={ticket} />
                    </div>
                  </div>
                ) : (
                  /* Comments tab */
                  <div className="animate-in fade-in duration-200">
                    {currentUser && (
                      <TicketComments ticketId={ticket.id} currentUser={currentUser} />
                    )}
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>
      </div>

      {pendingStatus && (
        <ReasonDialog
          open={!!pendingStatus}
          actionType={pendingStatus}
          onClose={() => setPendingStatus(null)}
          onSubmit={(reason) => {
            onStatusUpdate?.(pendingStatus, reason)
            setPendingStatus(null)
          }}
        />
      )}

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this ticket? This action is permanent and will soft-delete the ticket from active tracking.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDelete}
              className="flex items-center gap-1.5"
            >
              {isDeleting && <Loader2Icon className="size-3.5 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
