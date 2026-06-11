"use client"

import React, { useState } from "react"
import Image from "next/image"
import {
  PlusIcon,
  CalendarIcon,
  CheckSquareIcon,
  ClockIcon,
  AlertCircleIcon,
  RotateCcwIcon,
  EyeIcon,
  MoreVertical as MoreVerticalIcon,
  Trash as TrashIcon,
  Edit as EditIcon
} from "lucide-react"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
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

import {
  ProjectDetail,
  ProjectTicket,
  getTicketStatusIcon,
  getTicketStatusColor,
  getTicketStatusLabel,
  getPriorityColor,
  formatDate,
  getInitials
} from "./utils"

import TicketDetail from "../ticket/ticket-detail"
import ReasonDialog from "../ticket/reason-dialog"
import CreateTicket from "../ticket/create-ticket"
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

interface ProjectTicketsProps {
  projectData: ProjectDetail
  userId: string
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

export default function ProjectTickets({ projectData, userId }: ProjectTicketsProps) {
  const queryClient = useQueryClient()
  const { user } = useSelector((state: RootState) => state.user)
  const userRole = user?.role || ""
  const isProjectAdmin = projectData.admins?.some((a) => a.id === user?.id)
  const isOwner = userRole === "owner"
  const isProjectAdminOrOwner = isOwner || !!isProjectAdmin
  const isCreateAllowed = isProjectAdminOrOwner
  const canDrag = isProjectAdminOrOwner

  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    ticketId: string
    targetStatus: "blocked" | "reopen"
  } | null>(null)

  const tickets = projectData.tickets || []

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
      await queryClient.cancelQueries({ queryKey: ["project", projectData.id] })
      const previousProjectData = queryClient.getQueryData(["project", projectData.id])

      // Optimistically update project tickets
      queryClient.setQueryData(["project", projectData.id], (old: any) => {
        if (!old) return old
        const updatedTickets = old.tickets.map((t: any) =>
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
        return { ...old, tickets: updatedTickets }
      })

      return { previousProjectData }
    },
    onError: (err, variables, context) => {
      if (context?.previousProjectData) {
        queryClient.setQueryData(["project", projectData.id], context.previousProjectData)
      }
      toast.error("Failed to update ticket")
    },
    onSuccess: () => {
      toast.success("Ticket updated successfully!")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectData.id] })
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
    },
  })

  // Mutation to delete a ticket
  const deleteTicketMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const res = await fetch(`/api/tickets?id=${ticketId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete ticket")
      return res.json()
    },
    onMutate: async (ticketId) => {
      await queryClient.cancelQueries({ queryKey: ["project", projectData.id] })
      const previousProjectData = queryClient.getQueryData(["project", projectData.id])

      // Optimistically remove ticket
      queryClient.setQueryData(["project", projectData.id], (old: any) => {
        if (!old) return old
        return {
          ...old,
          tickets: old.tickets.filter((t: any) => t.id !== ticketId),
        }
      })

      return { previousProjectData }
    },
    onError: (err, variables, context) => {
      if (context?.previousProjectData) {
        queryClient.setQueryData(["project", projectData.id], context.previousProjectData)
      }
      toast.error("Failed to delete ticket")
    },
    onSuccess: () => {
      toast.success("Ticket deleted successfully!")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectData.id] })
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
    },
  })

  const handleDeleteTicket = (ticketId: string) => {
    deleteTicketMutation.mutate(ticketId)
  }

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
    if (!canDrag) return
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    if (!canDrag) return
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
    return tickets.filter((ticket) => statuses.includes(ticket.status))
  }

  const handleTicketClick = (ticket: any) => {
    // Build a fully-compatible Ticket object for TicketDetail
    const ticketWithProject = {
      ...ticket,
      description: ticket.description ?? null,
      reasonBlocked: ticket.reasonBlocked ?? null,
      reasonReopen: ticket.reasonReopen ?? null,
      timeLogs: ticket.timeLogs ?? [],
      attachments: ticket.attachments ?? [],
      assignedUser: ticket.assignedUser
        ? {
            ...ticket.assignedUser,
            email: ticket.assignedUser.email ?? "",
          }
        : null,
      project: {
        id: projectData.id,
        title: projectData.title,
      },
    }
    setSelectedTicket(ticketWithProject)
    setIsDetailOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Project Tickets</h2>
          <p className="text-xs text-muted-foreground">Deliverables and issues tracked under this project.</p>
        </div>
        {isCreateAllowed && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded-lg text-xs transition-colors cursor-pointer"
          >
            <PlusIcon className="size-3.5" />
            Create Ticket
          </button>
        )}
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex flex-col lg:flex-row gap-4 overflow-x-auto pb-4 items-start select-none w-full">
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
                canDrag={canDrag}
              />
            )
          })}
        </div>

        <DragOverlay>
          {activeId ? (
            <DraggableTicketCard
              ticket={tickets.find((t) => t.id === activeId)!}
              isOverlay
              canDrag={canDrag}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TicketDetail
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        ticket={
          selectedTicket
            ? tickets.find((t) => t.id === selectedTicket.id)
                ? {
                    ...tickets.find((t) => t.id === selectedTicket.id)!,
                    project: { id: projectData.id, title: projectData.title },
                  }
                : selectedTicket
            : null
        }
        onStatusUpdate={(status, reason) => {
          if (selectedTicket) {
            const updatePayload: any = { ticketId: selectedTicket.id, status }
            if (status === "blocked") {
              updatePayload.reasonBlocked = reason
            } else if (status === "reopen") {
              updatePayload.reasonReopen = reason
            }
            updateTicketMutation.mutate(updatePayload)
            setSelectedTicket((prev: any) => (prev ? { ...prev, status } : null))
          }
        }}
        onPriorityUpdate={(priority) => {
          if (selectedTicket) {
            updateTicketMutation.mutate({ ticketId: selectedTicket.id, priority })
            setSelectedTicket((prev: any) => (prev ? { ...prev, priority } : null))
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

      <CreateTicket
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultProjectId={projectData.id}
      />
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────────── */
/*                                SUBCOMPONENTS                               */
/* ────────────────────────────────────────────────────────────────────────── */

interface TicketColumnProps {
  id: string
  title: string
  tickets: ProjectTicket[]
  dotColor: string
  onTicketClick: (ticket: ProjectTicket) => void
  canDrag: boolean
}

function TicketColumn({ id, title, tickets, dotColor, onTicketClick, canDrag }: TicketColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[250px] w-full lg:w-auto bg-card rounded-2xl border border-border/70 p-4 flex flex-col gap-4 transition-all duration-200 ${
        isOver && canDrag
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
      <div className="flex-1 flex flex-col gap-2.5 min-h-[350px]">
        {tickets.map((ticket) => (
          <DraggableTicketCard
            key={ticket.id}
            ticket={ticket}
            onClick={() => onTicketClick(ticket)}
            canDrag={canDrag}
          />
        ))}
        {tickets.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-border/50 rounded-xl py-12 text-center">
            <p className="text-xs text-muted-foreground">Empty column</p>
          </div>
        )}
      </div>
    </div>
  )
}

interface DraggableTicketCardProps {
  ticket: ProjectTicket
  isOverlay?: boolean
  onClick?: () => void
  canDrag: boolean
}

function DraggableTicketCard({
  ticket,
  isOverlay = false,
  onClick,
  canDrag,
}: DraggableTicketCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: ticket.id,
    data: { ticket },
    disabled: !canDrag,
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
      <div className="flex justify-between items-start gap-3">
        <div className="flex flex-col gap-1.5 min-w-0">
          {ticket.group && (
            <span className="self-start px-1.5 py-0.5 text-[9px] font-bold rounded bg-primary/10 text-primary border border-primary/20 capitalize truncate max-w-[120px]">
              {ticket.group.name}
            </span>
          )}
          <h3 className="font-semibold text-xs text-foreground leading-snug group-hover:text-primary transition-colors duration-200 truncate max-w-[160px]">
            {ticket.title}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={`text-[9px] px-1.5 py-0.5 font-semibold rounded-full border whitespace-nowrap ${getStatusColor(
              ticket.status
            )}`}
          >
            {getDisplayStatus(ticket.status)}
          </span>
          {ticket.priority && (
            <span
              className={`text-[9px] px-1.5 py-0.5 font-semibold rounded-full border whitespace-nowrap capitalize ${getPriorityColor(
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
        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
          {ticket.description}
        </p>
      )}

      {/* Ticket Footer */}
      <div className="flex items-center justify-between border-t border-border/50 pt-2.5 mt-0.5">
        <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
          {getStatusIcon(ticket.status)}
          <span className="text-foreground/80">{getDisplayStatus(ticket.status)}</span>
        </div>

        <div className="flex items-center gap-2">
          {ticket.dueDate && (
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <CalendarIcon className="size-2.5" />
              <span>{formatDate(ticket.dueDate)}</span>
            </div>
          )}

          {/* Assignee */}
          {ticket.assignedUser ? (
            <div className="relative group/avatar cursor-pointer flex items-center shrink-0">
              <Image
                src={ticket.assignedUser.imageUrl || "https://github.com/shadcn.png"}
                alt={ticket.assignedUser.name}
                width={18}
                height={18}
                className="size-4.5 rounded-full border border-card object-cover"
                unoptimized
              />

              {/* Hover Card */}
              <div className="absolute right-0 bottom-full mb-2 w-48 bg-card/95 backdrop-blur-md border border-border/80 p-2.5 rounded-xl shadow-xl opacity-0 scale-95 pointer-events-none group-hover/avatar:opacity-100 group-hover/avatar:scale-100 transition-all duration-200 ease-out z-50 flex items-center gap-2">
                <Image
                  src={ticket.assignedUser.imageUrl || "https://github.com/shadcn.png"}
                  alt={ticket.assignedUser.name}
                  width={28}
                  height={28}
                  className="size-7 rounded-full border border-border/50 object-cover shrink-0"
                  unoptimized
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-bold text-foreground truncate">
                    {ticket.assignedUser.name}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <span className="text-[9px] text-muted-foreground italic shrink-0">Unassigned</span>
          )}
        </div>
      </div>
    </div>
  )

  if (isOverlay) {
    return (
      <div
        className={`border p-4 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] rotate-1 opacity-95 w-[250px] cursor-grabbing select-none ${getTicketCardBg(
          ticket.status
        )}`}
      >
        {cardContent}
      </div>
    )
  }

  const cursorClass = canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(canDrag ? listeners : {})}
      {...(canDrag ? attributes : {})}
      className={`group border p-4 rounded-xl transition-all duration-200 flex flex-col justify-between gap-3 select-none hover:shadow-[0_4px_14px_rgba(0,0,0,0.07)] hover:brightness-[0.97] ${cursorClass} ${getTicketCardBg(
        ticket.status
      )} ${isDragging ? "opacity-30 shadow-none scale-[0.98]" : "shadow-[0_1px_2px_rgba(0,0,0,0.04)]"}`}
    >
      {cardContent}
    </div>
  )
}
