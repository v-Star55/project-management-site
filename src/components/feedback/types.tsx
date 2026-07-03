import React from "react"
import {
  BugIcon,
  LightbulbIcon,
  ActivityIcon,
  HeartIcon,
  PlusIcon,
  HelpCircleIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

export interface FeedbackComment {
  id: string
  text: string
  createdAt: string
  user: {
    id: string
    name: string
    role: string
    imageUrl: string | null
  }
}

export interface Feedback {
  id: string
  subject: string
  description: string
  type: string
  priority: string
  status: string
  projectId: string | null
  project: {
    id: string
    title: string
  } | null
  userId: string
  user: {
    id: string
    name: string
    email: string
    role: string
    imageUrl: string | null
  }
  _count?: {
    comments: number
  }
  createdAt: string
}

export interface Project {
  id: string
  title: string
}

export const PROBLEM_TYPES = [
  { value: "bug", label: "Bug Report", icon: <BugIcon className="size-3.5 text-red-500" /> },
  { value: "feature", label: "Feature Request", icon: <LightbulbIcon className="size-3.5 text-emerald-500" /> },
  { value: "improvement", label: "Improvement", icon: <ActivityIcon className="size-3.5 text-blue-500" /> },
  { value: "appreciation", label: "Appreciation", icon: <HeartIcon className="size-3.5 text-pink-500 fill-pink-500" /> },
  { value: "add_remove", label: "Ask to Add/Remove", icon: <PlusIcon className="size-3.5 text-purple-500" /> },
  { value: "question", label: "Question", icon: <HelpCircleIcon className="size-3.5 text-amber-500" /> },
  { value: "other", label: "Other", icon: <HelpCircleIcon className="size-3.5 text-muted-foreground" /> },
]

export const PRIORITY_LEVELS = [
  { value: "low", label: "Low", color: "bg-emerald-500", text: "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" },
  { value: "medium", label: "Medium", color: "bg-amber-500", text: "text-amber-500 border-amber-500/20 bg-amber-500/5" },
  { value: "high", label: "High", color: "bg-orange-500", text: "text-orange-500 border-orange-500/20 bg-orange-500/5" },
  { value: "critical", label: "Critical", color: "bg-red-500", text: "text-red-500 border-red-500/20 bg-red-500/5" },
]

export const getTypeBadge = (type: string) => {
  const found = PROBLEM_TYPES.find((t) => t.value === type)
  if (!found) return <Badge variant="outline">{type}</Badge>
  return (
    <Badge variant="outline" className="flex items-center gap-1 text-[11px] font-semibold border-border/60 bg-muted/40 text-foreground py-0.5 px-2 rounded-md">
      {found.icon}
      {found.label}
    </Badge>
  )
}

export const getPriorityBadge = (priority: string) => {
  const found = PRIORITY_LEVELS.find((p) => p.value === priority)
  const colorClass = found ? found.text : "text-muted-foreground border-border bg-muted/30"
  return (
    <Badge className={`text-[10px] uppercase tracking-wider font-extrabold border py-0.5 px-2 rounded-md ${colorClass}`}>
      {priority}
    </Badge>
  )
}

export const getStatusBadge = (status: string) => {
  let classes = ""
  switch (status) {
    case "pending":
      classes = "bg-amber-500/10 text-amber-500 border-amber-500/20"
      break
    case "in_progress":
      classes = "bg-blue-500/10 text-blue-500 border-blue-500/20"
      break
    case "resolved":
      classes = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      break
    case "rejected":
      classes = "bg-red-500/10 text-red-500 border-red-500/20"
      break
    default:
      classes = "bg-muted text-muted-foreground"
  }

  return (
    <Badge className={`text-[11px] font-bold border py-0.5 px-2.5 rounded-full capitalize ${classes}`}>
      {status.replace("_", " ")}
    </Badge>
  )
}
