"use client"

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
  CalendarClockIcon,
  MoreVertical as MoreVerticalIcon,
  Trash as TrashIcon,
  Edit as EditIcon,
} from "lucide-react"
import Image from "next/image"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

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

const getPriorityColor = (priority?: string) => {
  switch (priority?.toLowerCase()) {
    case "high":
      return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
    case "medium":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
    case "low":
    default:
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
  }
}

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

interface TicketDetailHeaderProps {
  ticket: Ticket
  isEditing: boolean
  setIsEditing: (editing: boolean) => void
  editTitle: string
  setEditTitle: (title: string) => void
  isProjectAdminOrOwner: boolean
  canEdit: boolean
  canDelete: boolean
  onStatusUpdate?: (status: string, reason?: string) => void
  onPriorityUpdate?: (priority: string) => void
  handleAssigneeUpdate: (userId: string) => void
  projectMembers: any[]
  setIsDeleteDialogOpen: (open: boolean) => void
  onOpenChange: (open: boolean) => void
  setPendingStatus: (status: "blocked" | "reopen" | null) => void
}

export default function TicketDetailHeader({
  ticket,
  isEditing,
  setIsEditing,
  editTitle,
  setEditTitle,
  isProjectAdminOrOwner,
  canEdit,
  canDelete,
  onStatusUpdate,
  onPriorityUpdate,
  handleAssigneeUpdate,
  projectMembers,
  setIsDeleteDialogOpen,
  onOpenChange,
  setPendingStatus,
}: TicketDetailHeaderProps) {
  return (
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

          {/* Meta block */}
          <div className="flex flex-col gap-1.5 mt-1.5">
            {/* Row 1: Dates & Times */}
            <div className="flex items-center gap-x-3 gap-y-1 text-xs text-muted-foreground whitespace-nowrap overflow-x-auto no-scrollbar pr-4">
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="size-3.5 opacity-60" />
                <span>Created <strong className="text-foreground/80 font-semibold">{formatDateTime(ticket.createdAt)}</strong></span>
              </span>
              <span className="h-3 w-px bg-border/60" />
              <span className="flex items-center gap-1.5">
                <ClockIcon className="size-3.5 opacity-60" />
                <span>Updated <strong className="text-foreground/80 font-semibold">{formatDateTime(ticket.updatedAt)}</strong></span>
              </span>
              {ticket.dueDate && (
                <>
                  <span className="h-3 w-px bg-border/60" />
                  <span className={`flex items-center gap-1.5 ${
                    new Date(ticket.dueDate) < new Date() && ticket.status !== "completed"
                      ? "text-red-500 font-bold"
                      : "text-amber-500 font-medium"
                  }`}>
                    <CalendarClockIcon className="size-3.5" />
                    <span>Due <strong className="font-semibold">{formatDate(ticket.dueDate)}</strong></span>
                  </span>
                </>
              )}
            </div>

            {/* Row 2: Assigned By & Estimated Hours */}
            {(ticket.assignedBy || (ticket.estimatedHours !== null && ticket.estimatedHours !== undefined)) && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {ticket.assignedBy && (
                  <span className="flex items-center gap-1.5">
                    <span className="font-bold text-[9px] uppercase tracking-wider text-muted-foreground/80">Assigned By:</span>
                    <span className="text-foreground/90 font-medium flex items-center gap-1">
                      <Image
                        src={ticket.assignedBy.imageUrl || "https://github.com/shadcn.png"}
                        alt={ticket.assignedBy.name}
                        width={14}
                        height={14}
                        className="size-3.5 rounded-full object-cover shrink-0"
                        unoptimized
                      />
                      {ticket.assignedBy.name}
                    </span>
                  </span>
                )}
                {ticket.assignedBy && ticket.estimatedHours !== null && ticket.estimatedHours !== undefined && (
                  <span className="h-3 w-px bg-border/60" />
                )}
                {ticket.estimatedHours !== null && ticket.estimatedHours !== undefined && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="font-bold text-[9px] uppercase tracking-wider text-muted-foreground/80">Est. Hours:</span>
                    <span className="text-foreground/90 font-medium">
                      {ticket.estimatedHours} hrs
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 mt-0.5">
          {/* Status Selector */}
          <Select
            disabled={!canEdit}
            value={ticket.status}
            onValueChange={(val) => {
              if (val === "blocked" || val === "reopen") {
                setPendingStatus(val as any)
              } else {
                onStatusUpdate?.(val)
              }
            }}
          >
            <SelectTrigger className={`h-9 px-3 rounded-xl text-xs font-semibold flex items-center gap-2 focus:ring-0 focus:ring-offset-0 w-[125px] shrink-0 cursor-pointer border transition-all duration-150 ${getStatusMeta(ticket.status).color}`}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border/50 rounded-2xl shadow-xl z-[200] w-[140px]">
              {Object.entries(STATUS_MAP).map(([raw, label]) => (
                <SelectItem key={raw} value={raw} className="rounded-xl cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${getStatusMeta(raw).dot}`} />
                    <span>{label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority Selector */}
          <Select
            disabled={!canEdit}
            value={ticket.priority?.toLowerCase() || "low"}
            onValueChange={(val) => {
              onPriorityUpdate?.(val)
            }}
          >
            <SelectTrigger className={`h-9 px-3 rounded-xl text-xs font-semibold flex items-center gap-2 focus:ring-0 focus:ring-offset-0 capitalize w-[105px] shrink-0 cursor-pointer border transition-all duration-150 ${getPriorityColor(ticket.priority)}`}>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border/50 rounded-2xl shadow-xl z-[200] w-[120px]">
              {["low", "medium", "high"].map((p) => (
                <SelectItem key={p} value={p} className="rounded-xl cursor-pointer capitalize">
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Assignee Selector */}
          {!isProjectAdminOrOwner ? (
            <div className="h-9 px-3 bg-card border border-border/50 rounded-xl text-xs font-semibold flex items-center gap-2 w-[145px] shrink-0">
              {ticket.assignedUser ? (
                <div className="flex items-center gap-1.5 min-w-0">
                  <Image
                    src={ticket.assignedUser.imageUrl || "https://github.com/shadcn.png"}
                    alt={ticket.assignedUser.name}
                    width={18}
                    height={18}
                    className="size-4.5 rounded-full border border-border object-cover shrink-0"
                    unoptimized
                  />
                  <span className="truncate max-w-[105px]">{ticket.assignedUser.name}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              )}
            </div>
          ) : (
            <Select
              value={ticket.assignedUserId || "unassigned"}
              onValueChange={handleAssigneeUpdate}
            >
              <SelectTrigger className="h-9 px-3 bg-card border border-border/50 rounded-xl text-xs font-semibold flex items-center gap-2 hover:bg-muted/30 focus:ring-0 focus:ring-offset-0 w-[145px] shrink-0 cursor-pointer">
                {ticket.assignedUser ? (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Image
                      src={ticket.assignedUser.imageUrl || "https://github.com/shadcn.png"}
                      alt={ticket.assignedUser.name}
                      width={18}
                      height={18}
                      className="size-4.5 rounded-full border border-border object-cover shrink-0"
                      unoptimized
                    />
                    <span className="truncate max-w-[105px]">{ticket.assignedUser.name}</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Assignee" />
                )}
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border/50 rounded-2xl shadow-xl z-[200] max-h-60 overflow-y-auto w-[180px]">
                <SelectItem value="unassigned" className="rounded-xl cursor-pointer">Unassigned</SelectItem>
                {projectMembers.map((member: any) => (
                  <SelectItem key={member.id} value={member.id} className="rounded-xl cursor-pointer py-2">
                    <div className="flex items-center gap-2.5">
                      <Image
                        src={member.imageUrl || "https://github.com/shadcn.png"}
                        alt={member.displayName}
                        width={18}
                        height={18}
                        className="size-4.5 rounded-full border border-border object-cover shrink-0"
                        unoptimized
                      />
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-semibold text-foreground leading-none">{member.displayName}</span>
                        <span className="text-[9px] text-muted-foreground mt-1 font-normal leading-none">{member.designationLabel}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Actions Dropdown */}
          {(canEdit || canDelete) && !isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-2 rounded-xl hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer"
                >
                  <MoreVerticalIcon className="size-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 z-[100] bg-popover border border-border/50 rounded-2xl shadow-xl">
                {canEdit && (
                  <DropdownMenuItem className="rounded-xl flex items-center gap-2 cursor-pointer" onClick={() => setIsEditing(true)}>
                    <EditIcon className="size-4" />
                    Edit Ticket
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    variant="destructive"
                    className="rounded-xl flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <TrashIcon className="size-4" />
                    Delete Ticket
                  </DropdownMenuItem>
                )}
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
  )
}
