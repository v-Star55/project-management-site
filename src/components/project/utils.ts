import React from "react"
import { CheckSquareIcon, ClockIcon, EyeIcon, AlertCircleIcon, RotateCcwIcon } from "lucide-react"

export interface ProjectMember {
  id: string
  name: string
  email: string
  role: string
  imageUrl: string | null
  designation: string | null
}

export interface TicketReason {
  id: string
  type: "BLOCKED" | "REOPENED"
  reason: string
  createdAt: string
  ticketId: string
  userId: string
  user: {
    id: string
    name: string
    email?: string
    imageUrl: string | null
  }
}

export interface ProjectTicket {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  dueDate?: string | null
  projectId: string
  assignedUserId?: string | null
  reasonBlocked?: string | null
  reasonReopen?: string | null
  reasons?: TicketReason[]
  assignedUser: {
    id: string
    name: string
    email?: string
    imageUrl: string | null
  } | null
  assignedBy?: {
    id: string
    name: string
    email?: string
    imageUrl: string | null
  } | null
  groupId?: string | null
  group?: {
    id: string
    name: string
    type: string
  } | null
  estimatedHours?: number | null
  timeLogs?: any[] | null
}

export interface ProjectDetail {
  id: string
  title: string
  description: string | null
  status: string
  startDate: string | null
  completedDate: string | null
  targetDate: string | null
  phase: string
  category: string
  members: ProjectMember[]
  admins: ProjectMember[]
  tickets: ProjectTicket[]
}

export const getInitials = (name: string): string => {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "N/A"
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export const getProjectStatusLabel = (status: string): string => {
  switch (status.toLowerCase()) {
    case "completed": return "Completed"
    case "in_progress": return "In Progress"
    case "pending": default: return "Pending"
  }
}

export const getProjectStatusBadge = (status: string): string => {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    case "in_progress":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    case "pending":
    default:
      return "bg-amber-500/10 text-amber-500 border-amber-500/20"
  }
}

export const getTicketStatusLabel = (status: string): string => {
  switch (status.toLowerCase()) {
    case "completed": return "Completed"
    case "in_progress": return "In Progress"
    case "in_review": return "In Review"
    case "blocked": return "Blocked"
    case "reopen": return "Reopen"
    case "pending": default: return "Todo"
  }
}

export const getTicketStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    case "in_progress":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    case "in_review":
      return "bg-purple-500/10 text-purple-600 border-purple-500/20"
    case "blocked":
      return "bg-red-500/10 text-red-500 border-red-500/20"
    case "reopen":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20"
    case "pending":
    default:
      return "bg-stone-500/10 text-stone-500 border-stone-500/20"
  }
}

export const getTicketStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return React.createElement(CheckSquareIcon, { className: "size-4 text-emerald-500" })
    case "in_progress":
      return React.createElement(ClockIcon, { className: "size-4 text-blue-500 animate-pulse" })
    case "in_review":
      return React.createElement(EyeIcon, { className: "size-4 text-purple-500" })
    case "blocked":
      return React.createElement(AlertCircleIcon, { className: "size-4 text-red-500" })
    case "reopen":
      return React.createElement(RotateCcwIcon, { className: "size-4 text-amber-500" })
    default:
      return React.createElement(CheckSquareIcon, { className: "size-4 text-stone-400" })
  }
}

export const getPriorityColor = (priority: string): string => {
  switch (priority?.toLowerCase()) {
    case "high":
      return "bg-red-500/10 text-red-500 border-red-500/20"
    case "medium":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20"
    case "low":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    default:
      return "bg-stone-500/10 text-stone-500 border-stone-500/20"
  }
}
