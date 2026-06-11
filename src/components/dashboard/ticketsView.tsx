"use client"

import React, { useState } from "react"
import TicketDetail from "../ticket/ticket-detail"
import ReasonDialog from "../ticket/reason-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  SearchIcon,
  PlusIcon,
  CalendarIcon,
  CheckSquareIcon,
  ClockIcon,
  AlertCircleIcon,
  RotateCcwIcon,
  Loader2Icon,
  EyeIcon
} from "lucide-react"
import Image from "next/image"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"

export interface TicketAttachment {
  id: string
  ticketId: string
  fileName: string
  fileUrl: string
  createdAt: string
}

export interface TimeLog {
  id: string
  startTime: string
  endTime: string
  duration: number
  description: string | null
  userId: string
  user: {
    id: string
    name: string
    email: string
    imageUrl: string | null
  }
  createdAt: string
}

export interface Ticket {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  dueDate?: string | null
  projectId: string
  assignedUserId: string
  groupId?: string | null
  project: {
    id: string
    title: string
  }
  assignedUser: {
    id: string
    name: string
    email: string
    imageUrl: string | null
  }
  attachments?: TicketAttachment[]
  timeLogs?: TimeLog[]
  reasonBlocked?: string | null
  reasonReopen?: string | null
  group?: {
    id: string
    name: string
    type: string
  } | null
}

const STATUS_MAP: Record<string, string> = {
  pending: "Todo",
  todo: "Todo",
  in_progress: "In Progress",
  in_review: "In Review",
  blocked: "Blocked",
  completed: "Completed",
  reopen: "Reopen",
}

const getDisplayStatus = (raw: string): string => {
  return STATUS_MAP[raw] ?? raw.charAt(0).toUpperCase() + raw.slice(1)
}

const ALL_STATUSES = ["All", "Todo", "In Progress", "In Review", "Blocked", "Completed", "Reopen"]

const PRIORITY_VALUES: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
}

const getPriorityValue = (priority?: string): number => {
  if (!priority) return 0
  return PRIORITY_VALUES[priority.toLowerCase()] ?? 0
}

const COLUMNS = [
  {
    id: "todo",
    title: "Todo / Reopen",
    statuses: ["pending", "reopen"],
    dotColor: "bg-stone-400",
  },
  {
    id: "inProgress",
    title: "In Progress",
    statuses: ["in_progress"],
    dotColor: "bg-blue-500",
  },
  {
    id: "inReview",
    title: "In Review",
    statuses: ["in_review"],
    dotColor: "bg-purple-500",
  },
  {
    id: "completed",
    title: "Completed / Blocked",
    statuses: ["completed", "blocked"],
    dotColor: "bg-emerald-500",
  },
]

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

const getStatusColor = (status: string) => {
  const display = getDisplayStatus(status)
  switch (display) {
    case "Completed":
      return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/25"
    case "In Progress":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/25"
    case "In Review":
      return "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/25"
    case "Blocked":
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25"
    case "Todo":
      return "bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-500/15 dark:text-stone-400 dark:border-stone-500/25"
    case "Reopen":
      return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

const getPriorityColor = (priority: string) => {
  if (!priority) return "bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-500/15 dark:text-stone-400 dark:border-stone-500/25"
  switch (priority.toLowerCase()) {
    case "high":
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/25"
    case "medium":
      return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25"
    case "low":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/25"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

const getTicketCardBg = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-emerald-50/60 dark:bg-emerald-500/[0.07] border-emerald-100 dark:border-emerald-500/15"
    case "in_progress":
      return "bg-blue-50/60 dark:bg-blue-500/[0.07] border-blue-100 dark:border-blue-500/15"
    case "in_review":
      return "bg-purple-50/60 dark:bg-purple-500/[0.07] border-purple-100 dark:border-purple-500/15"
    case "blocked":
      return "bg-red-50/60 dark:bg-red-500/[0.07] border-red-100 dark:border-red-500/15"
    case "reopen":
      return "bg-amber-50/60 dark:bg-amber-500/[0.07] border-amber-100 dark:border-amber-500/15"
    case "pending":
    default:
      return "bg-stone-50/80 dark:bg-stone-500/[0.07] border-stone-100 dark:border-stone-500/15"
  }
}

const getStatusIcon = (status: string) => {
  const display = getDisplayStatus(status)
  switch (display) {
    case "Todo":
      return <CheckSquareIcon className="size-4 text-stone-400" />
    case "In Progress":
      return <ClockIcon className="size-4 text-blue-500 animate-pulse" />
    case "In Review":
      return <EyeIcon className="size-4 text-purple-500 animate-pulse" />
    case "Blocked":
      return <AlertCircleIcon className="size-4 text-red-500" />
    case "Completed":
      return <CheckSquareIcon className="size-4 text-emerald-500 fill-emerald-500/20" />
    case "Reopen":
      return <RotateCcwIcon className="size-4 text-amber-500" />
    default:
      return <CheckSquareIcon className="size-4 text-muted-foreground" />
  }
}

export default function TicketsView() {
  const { user } = useSelector((state: RootState) => state.user)
  const isCreateAllowed = user?.role === "owner" || user?.role === "admin"
  const queryClient = useQueryClient()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("All")
  const [search, setSearch] = useState<string>("")
  const [sortBy, setSortBy] = useState<"date" | "priority-high-to-low" | "priority-low-to-high">("date")

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all")
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    ticketId: string
    targetStatus: "blocked" | "reopen"
  } | null>(null)

  // Fetch active projects for filter dropdown
  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects")
      if (!res.ok) throw new Error("Failed to fetch projects")
      return res.json()
    }
  })
  const projects = projectsData?.projects || []

  const fetchTickets = async () => {
    const res = await fetch("/api/tickets")
    if (!res.ok) throw new Error("Failed to fetch tickets")
    return res.json()
  }

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["tickets"],
    queryFn: fetchTickets,
    staleTime: 1000 * 60 * 5,
  })

  // Mutation to update ticket status/priority
  const updateTicketMutation = useMutation({
    mutationFn: async ({
      ticketId,
      status,
      priority,
      reasonBlocked,
      reasonReopen,
    }: {
      ticketId: string
      status?: string
      priority?: string
      reasonBlocked?: string
      reasonReopen?: string
    }) => {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: ticketId,
          status,
          priority,
          reasonBlocked,
          reasonReopen,
        }),
      })
      if (!res.ok) throw new Error("Failed to update ticket")
      return res.json()
    },
    onMutate: async ({ ticketId, status, priority, reasonBlocked, reasonReopen }) => {
      await queryClient.cancelQueries({ queryKey: ["tickets"] })
      const previousTicketsData = queryClient.getQueryData(["tickets"])

      queryClient.setQueryData(["tickets"], (old: any) => {
        if (!old) return old
        const currentTickets = Array.isArray(old) ? old : old.tickets ?? []
        const updated = currentTickets.map((t: any) =>
          t.id === ticketId
            ? {
              ...t,
              ...(status !== undefined ? { status } : {}),
              ...(priority !== undefined ? { priority } : {}),
              ...(reasonBlocked !== undefined ? { reasonBlocked } : {}),
              ...(reasonReopen !== undefined ? { reasonReopen } : {}),
            }
            : t
        )
        return Array.isArray(old) ? updated : { ...old, tickets: updated }
      })

      return { previousTicketsData }
    },
    onError: (err, variables, context) => {
      if (context?.previousTicketsData) {
        queryClient.setQueryData(["tickets"], context.previousTicketsData)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
    },
  })

  const tickets: Ticket[] = Array.isArray(data) ? data : data?.tickets ?? []

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(search.toLowerCase()) ||
      ticket.project.title.toLowerCase().includes(search.toLowerCase()) ||
      (ticket.description ?? "").toLowerCase().includes(search.toLowerCase())

    const matchesStatus = filter === "All" || getDisplayStatus(ticket.status) === filter
    const matchesProject = selectedProjectId === "all" || ticket.projectId === selectedProjectId

    return matchesSearch && matchesStatus && matchesProject
  })

  // Sort tickets
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (sortBy === "priority-high-to-low") {
      return getPriorityValue(b.priority) - getPriorityValue(a.priority)
    }
    if (sortBy === "priority-low-to-high") {
      return getPriorityValue(a.priority) - getPriorityValue(b.priority)
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (typeof document !== "undefined") {
      document.body.style.pointerEvents = ""
    }

    if (!over) return

    const ticketId = active.id as string
    const targetColumnId = over.id as string

    const ticket = tickets.find((t) => t.id === ticketId)
    if (!ticket) return

    let targetStatus = ""
    if (targetColumnId === "todo") {
      targetStatus = ticket.status === "completed" ? "reopen" : "pending"
    } else if (targetColumnId === "inProgress") {
      targetStatus = "in_progress"
    } else if (targetColumnId === "inReview") {
      targetStatus = "in_review"
    } else if (targetColumnId === "completed") {
      targetStatus = ticket.status === "blocked" ? "blocked" : "completed"
    }

    if (targetStatus && ticket.status !== targetStatus) {
      if (targetStatus === "reopen" || targetStatus === "blocked") {
        setPendingStatusChange({ ticketId, targetStatus })
      } else {
        updateTicketMutation.mutate({ ticketId, status: targetStatus })
      }
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
    if (typeof document !== "undefined") {
      document.body.style.pointerEvents = ""
    }
  }

  const getTicketsForColumn = (statuses: string[]) => {
    return sortedTickets.filter((ticket) => statuses.includes(ticket.status))
  }

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setIsDetailOpen(true)
  }

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 md:p-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">My Tickets</h1>
          <p className="text-sm text-muted-foreground mt-1">Keep track of your projects and active responsibilities.</p>
        </div>
      </div>

      {/* Filters, Search & Sorting */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card backdrop-blur-md p-4 rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-muted/50 rounded-xl border border-border/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-sm outline-none transition-all"
            />
          </div>

          {/* Sort Selector */}
          <div className="w-full sm:w-56">
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as any)}
            >
              <SelectTrigger className="w-full bg-muted/50 border-border/40 rounded-xl py-2 h-9 text-muted-foreground font-medium focus-visible:ring-primary/20 focus-visible:border-primary/50">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent position="popper" className="rounded-xl border border-border/50">
                <SelectItem value="date" className="text-foreground">Sort: Newest</SelectItem>
                <SelectItem value="priority-high-to-low" className="text-foreground">Sort: Priority (High to Low)</SelectItem>
                <SelectItem value="priority-low-to-high" className="text-foreground">Sort: Priority (Low to High)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Project Filter Selector */}
          <div className="w-full sm:w-56">
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
            >
              <SelectTrigger className="w-full bg-muted/50 border-border/40 rounded-xl py-2 h-9 text-muted-foreground font-medium focus-visible:ring-primary/20 focus-visible:border-primary/50">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent position="popper" className="rounded-xl border border-border/50">
                <SelectItem value="all" className="text-foreground">All Projects</SelectItem>
                {projects.map((proj: any) => (
                  <SelectItem key={proj.id} value={proj.id} className="text-foreground">
                    {proj.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {ALL_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${filter === status
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-muted/30 hover:bg-muted text-muted-foreground border-border/30"
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-16 flex flex-col items-center justify-center bg-card/40 rounded-2xl border border-dashed border-border/80 text-center">
          <Loader2Icon className="size-8 text-primary animate-spin mb-3" />
          <p className="font-semibold text-foreground">Loading tickets...</p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="py-16 flex flex-col items-center justify-center bg-red-500/5 rounded-2xl border border-dashed border-red-500/30 text-center">
          <AlertCircleIcon className="size-10 text-red-500/60 mb-3" />
          <p className="font-semibold text-foreground">Failed to load tickets</p>
          <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message ?? "Something went wrong."}</p>
        </div>
      )}

      {/* Kanban Board */}
      {!isLoading && !isError && (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex flex-col lg:flex-row gap-4 overflow-x-auto pb-4 items-start select-none">
            {COLUMNS.map((column) => {
              const columnTickets = getTicketsForColumn(column.statuses)
              return (
                <TicketColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  tickets={columnTickets}
                  dotColor={column.dotColor}
                  onTicketClick={handleTicketClick}
                />
              )
            })}
          </div>

          <DragOverlay>
            {activeId ? (
              <DraggableTicketCard
                ticket={tickets.find((t) => t.id === activeId)!}
                isOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <TicketDetail
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        ticket={selectedTicket ? tickets.find((t) => t.id === selectedTicket.id) || selectedTicket : null}
        onStatusUpdate={(status, reason) => {
          if (selectedTicket) {
            const updatePayload: any = { ticketId: selectedTicket.id, status }
            if (status === "blocked") {
              updatePayload.reasonBlocked = reason
            } else if (status === "reopen") {
              updatePayload.reasonReopen = reason
            }
            updateTicketMutation.mutate(updatePayload)
            setSelectedTicket((prev) => prev ? { ...prev, status } : null)
          }
        }}
        onPriorityUpdate={(priority) => {
          if (selectedTicket) {
            updateTicketMutation.mutate({ ticketId: selectedTicket.id, priority })
            setSelectedTicket((prev) => prev ? { ...prev, priority } : null)
          }
        }}
      />

      {pendingStatusChange && (
        <ReasonDialog
          open={!!pendingStatusChange}
          actionType={pendingStatusChange.targetStatus}
          onClose={() => setPendingStatusChange(null)}
          onSubmit={(reason) => {
            const { ticketId, targetStatus } = pendingStatusChange
            const updatePayload: any = { ticketId, status: targetStatus }
            if (targetStatus === "blocked") {
              updatePayload.reasonBlocked = reason
            } else if (targetStatus === "reopen") {
              updatePayload.reasonReopen = reason
            }
            updateTicketMutation.mutate(updatePayload)
            setPendingStatusChange(null)
          }}
        />
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*                                SUBCOMPONENTS                               */
/* ────────────────────────────────────────────────────────────────────────── */

interface TicketColumnProps {
  id: string
  title: string
  tickets: Ticket[]
  dotColor: string
  onTicketClick: (ticket: Ticket) => void
}

function TicketColumn({ id, title, tickets, dotColor, onTicketClick }: TicketColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[280px] w-full lg:w-auto bg-card rounded-2xl border border-border/70 p-4 flex flex-col gap-4 transition-all duration-200 ${isOver
          ? "ring-2 ring-primary/25 border-primary/40 shadow-[0_8px_30px_rgba(0,0,0,0.08)] scale-[1.01]"
          : "shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]"
        }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className={`size-2 rounded-full ${dotColor}`} />
          <h3 className="font-semibold text-[13px] text-foreground">{title}</h3>
        </div>
        <span className="text-[11px] px-2 py-0.5 font-bold rounded-md bg-muted text-foreground">
          {tickets.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 flex flex-col gap-2.5 min-h-[400px]">
        {tickets.map((ticket) => (
          <DraggableTicketCard key={ticket.id} ticket={ticket} onClick={() => onTicketClick(ticket)} />
        ))}
        {tickets.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-border/50 rounded-xl py-12 text-center">
            <p className="text-xs text-muted-foreground">Drop tickets here</p>
          </div>
        )}
      </div>
    </div>
  )
}

interface DraggableTicketCardProps {
  ticket: Ticket
  isOverlay?: boolean
  onClick?: () => void
}

function DraggableTicketCard({ ticket, isOverlay = false, onClick }: DraggableTicketCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
    data: { ticket },
  })

  const style = transform
    ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      zIndex: isOverlay ? 100 : 50,
    }
    : undefined

  const cardContent = (
    <div className="flex flex-col justify-between gap-3 h-full" onClick={onClick}>
      {/* Ticket Header */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase truncate">
              {ticket.project.title}
            </span>
            {ticket.group && (
              <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-primary/10 text-primary border border-primary/20 capitalize truncate max-w-[120px]">
                {ticket.group.name}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-sm text-foreground leading-snug group-hover:text-primary transition-colors duration-200">
            {ticket.title}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={`text-[9px] px-2 py-0.5 font-semibold rounded-full border whitespace-nowrap ${getStatusColor(
              ticket.status
            )}`}
          >
            {getDisplayStatus(ticket.status)}
          </span>
          {ticket.priority && (
            <span
              className={`text-[9px] px-2 py-0.5 font-semibold rounded-full border whitespace-nowrap capitalize ${getPriorityColor(
                ticket.priority
              )}`}
            >
              {ticket.priority}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {ticket.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {ticket.description}
        </p>
      )}

      {/* Ticket Footer */}
      <div className="flex items-center justify-between border-t border-border/50 pt-2.5 mt-0.5">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          {getStatusIcon(ticket.status)}
          <span className="text-foreground/80">{getDisplayStatus(ticket.status)}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <CalendarIcon className="size-3" />
            <span>{formatDate(ticket.createdAt)}</span>
          </div>

          {/* Assignee */}
          {ticket.assignedUser && (
            <div className="relative group/avatar cursor-pointer flex items-center">
              <Image
                src={ticket.assignedUser.imageUrl || "https://github.com/shadcn.png"}
                alt={ticket.assignedUser.name}
                width={20}
                height={20}
                className="size-5 rounded-full border border-card object-cover"
                unoptimized
              />

              {/* Hover Card */}
              <div className="absolute right-0 bottom-full mb-2 w-56 bg-card/95 backdrop-blur-md border border-border/80 p-3 rounded-xl shadow-xl opacity-0 scale-95 pointer-events-none group-hover/avatar:opacity-100 group-hover/avatar:scale-100 transition-all duration-200 ease-out z-50 flex items-center gap-3">
                <Image
                  src={ticket.assignedUser.imageUrl || "https://github.com/shadcn.png"}
                  alt={ticket.assignedUser.name}
                  width={36}
                  height={36}
                  className="size-9 rounded-full border border-border/50 object-cover shrink-0"
                  unoptimized
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-foreground truncate">
                    {ticket.assignedUser.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {ticket.assignedUser.email}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (isOverlay) {
    return (
      <div className={`border p-4 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] rotate-1 opacity-95 w-[280px] ${getTicketCardBg(ticket.status)}`}>
        {cardContent}
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group border p-4 rounded-xl transition-all duration-200 flex flex-col justify-between gap-3 cursor-grab active:cursor-grabbing select-none hover:shadow-[0_4px_14px_rgba(0,0,0,0.07)] hover:brightness-[0.97] ${getTicketCardBg(ticket.status)} ${isDragging ? "opacity-30 shadow-none scale-[0.98]" : "shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        }`}
    >
      {cardContent}
    </div>
  )
}
