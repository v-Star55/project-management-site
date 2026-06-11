"use client"

import React, { useState, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  PlusIcon,
  CalendarIcon,
  XIcon,
  Loader2Icon,
  LayersIcon,
  CheckCircle2Icon,
  TrendingUpIcon,
  BookmarkIcon,
  InfoIcon
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import SprintDetail from "./sprint-detail"

interface Ticket {
  id: string
  title: string
  status: string
  priority: string
}

interface ProjectGroup {
  id: string
  name: string
  description: string
  goal: string | null
  type: string
  status: string
  startDate: string
  endDate: string | null
  tickets: Ticket[]
}

interface ProjectGroupsProps {
  projectId: string
  userRole: string
}

interface DatePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  label: string
}

function DatePicker({ date, setDate, label }: DatePickerProps) {
  return (
    <div className="space-y-1.5 flex flex-col">
      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal bg-muted/15 border border-border/40 hover:bg-muted/20 text-foreground rounded-xl h-9 px-3",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-2xl border border-border/50 z-[200] bg-popover shadow-xl" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

// Styling utilities for Group Status Badges
const getGroupStatusLabel = (status: string) => {
  switch (status.toLowerCase()) {
    case "not_started": return "Not Started"
    case "in_progress": return "In Progress"
    case "completed": return "Completed"
    case "cancelled": return "Cancelled"
    case "on_hold": return "On Hold"
    default: return status
  }
}

const getGroupStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
    case "in_progress":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20"
    case "on_hold":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20"
    case "cancelled":
      return "bg-red-500/10 text-red-500 border-red-500/20"
    case "not_started":
    default:
      return "bg-stone-500/10 text-stone-500 border-stone-500/20"
  }
}

// Styling utilities for Group Type Badges
const getGroupTypeLabel = (type: string) => {
  switch (type.toLowerCase()) {
    case "sprint": return "Sprint"
    case "phase": return "Phase"
    case "section": return "Section"
    case "milestone": return "Milestone"
    case "campaign_stage": return "Campaign Stage"
    case "custom": return "Custom Group"
    default: return type
  }
}

const getGroupTypeBadge = (type: string) => {
  switch (type.toLowerCase()) {
    case "sprint":
      return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
    case "phase":
      return "bg-purple-500/10 text-purple-500 border-purple-500/20"
    case "milestone":
      return "bg-amber-500/10 text-amber-500 border-amber-500/20"
    case "campaign_stage":
      return "bg-pink-500/10 text-pink-500 border-pink-500/20"
    case "section":
    case "custom":
    default:
      return "bg-teal-500/10 text-teal-500 border-teal-500/20"
  }
}

export default function ProjectGroups({ projectId, userRole }: ProjectGroupsProps) {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  
  // Create Group Form States
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [goal, setGoal] = useState("")
  const [type, setType] = useState("sprint")
  const [status, setStatus] = useState("not_started")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)

  const isCreateAllowed = userRole === "owner" || userRole === "admin"

  // Fetch groups query
  const { data: groupsData, isLoading, isError } = useQuery({
    queryKey: ["project-groups", projectId],
    queryFn: async () => {
      const res = await axios.get(`/api/projects/${projectId}/groups`)
      return res.data.groups as ProjectGroup[]
    },
    enabled: !!projectId,
  })

  // Create Group Mutation
  const createGroupMutation = useMutation({
    mutationFn: async (payload: {
      name: string
      description: string
      goal?: string
      type: string
      status: string
      startDate: string
      endDate?: string | null
    }) => {
      const res = await axios.post(`/api/projects/${projectId}/groups`, payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-groups", projectId] })
      toast.success("Group created successfully!")
      setIsCreateOpen(false)
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.error || "Failed to create group"
      toast.error(errMsg)
    }
  })

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Group Name is required")
      return
    }
    if (!description.trim()) {
      toast.error("Description is required")
      return
    }
    if (!startDate) {
      toast.error("Start Date is required")
      return
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      goal: goal.trim() || undefined,
      type,
      status,
      startDate: startDate.toISOString(),
      endDate: endDate ? endDate.toISOString() : null
    }

    createGroupMutation.mutate(payload)
  }

  // Reset form when modal opens
  useEffect(() => {
    if (isCreateOpen) {
      setName("")
      setDescription("")
      setGoal("")
      setType("sprint")
      setStatus("not_started")
      setStartDate(undefined)
      setEndDate(undefined)
    }
  }, [isCreateOpen])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2 text-muted-foreground">
        <Loader2Icon className="size-6 text-primary animate-spin" />
        <span className="text-xs font-semibold">Loading project groups...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6 border border-dashed border-border rounded-2xl">
        <InfoIcon className="size-8 text-destructive mb-2" />
        <span className="text-sm font-semibold text-foreground">Failed to load groups</span>
        <span className="text-xs text-muted-foreground mt-1">Please try reloading the page.</span>
      </div>
    )
  }

  const groups = groupsData || []

  if (selectedGroupId) {
    return (
      <SprintDetail 
        projectId={projectId} 
        groupId={selectedGroupId} 
        userRole={userRole} 
        onBack={() => setSelectedGroupId(null)} 
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header and Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Project Groups</h2>
          <p className="text-xs text-muted-foreground">Organize and track sprints, milestones, or project phases.</p>
        </div>
        {isCreateAllowed && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded-lg text-xs transition-colors cursor-pointer"
            variant="ghost"
          >
            <PlusIcon className="size-3.5" />
            Create Group
          </Button>
        )}
      </div>

      {/* Groups List / Grid */}
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border/60 rounded-3xl text-center bg-card/10">
          <LayersIcon className="size-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-sm font-bold text-foreground">No groups created yet</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
            Create your first sprint, milestone, or custom phase to start organizing tickets.
          </p>
          {isCreateAllowed && (
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="mt-4 text-xs font-semibold rounded-xl"
              size="sm"
            >
              Create First Group
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groups.map((group) => {
            const totalTickets = group.tickets.length
            const completedTickets = group.tickets.filter((t) => t.status === "completed").length
            const progress = totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 0

            return (
              <div
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col justify-between gap-5 hover:shadow-md hover:border-border/80 transition-all duration-200 cursor-pointer"
              >
                {/* Header & Badges */}
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold text-foreground leading-tight truncate max-w-[250px]" title={group.name}>
                      {group.name}
                    </h3>
                    <span className={cn("text-[9px] px-2 py-0.5 font-semibold rounded-full border whitespace-nowrap", getGroupStatusBadge(group.status))}>
                      {getGroupStatusLabel(group.status)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={cn("text-[9px] px-2 py-0.5 font-semibold rounded-full border whitespace-nowrap", getGroupTypeBadge(group.type))}>
                      {getGroupTypeLabel(group.type)}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 font-medium rounded-full border border-border/30 bg-muted/20 text-muted-foreground whitespace-nowrap flex items-center gap-1">
                      <CalendarIcon className="size-2.5" />
                      {format(new Date(group.startDate), "MMM d")}
                      {group.endDate && ` - ${format(new Date(group.endDate), "MMM d, yyyy")}`}
                    </span>
                  </div>
                </div>

                {/* Description & Goal */}
                <div className="flex flex-col gap-2.5">
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {group.description}
                  </p>
                  {group.goal && (
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/10 border border-border/20 text-[10px] text-foreground/80 font-medium">
                      <BookmarkIcon className="size-3 text-primary" />
                      <span className="truncate"><strong>Goal:</strong> {group.goal}</span>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUpIcon className="size-3 text-primary" />
                      Progress Tracker
                    </span>
                    <span className="text-foreground">
                      {progress}% ({completedTickets}/{totalTickets} Tickets)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden border border-border/10">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Group tickets list preview */}
                <div className="border-t border-border/30 pt-3">
                  <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Associated Tickets</span>
                  {totalTickets === 0 ? (
                    <p className="text-xs text-muted-foreground italic mt-1.5">No tickets linked to this group.</p>
                  ) : (
                    <div className="flex flex-col gap-1.5 mt-2 max-h-[110px] overflow-y-auto pr-1">
                      {group.tickets.map((t) => (
                        <div key={t.id} className="flex items-center justify-between gap-3 text-xs bg-muted/10 border border-border/20 hover:border-border/60 p-2 rounded-lg transition-colors">
                          <span className="truncate text-foreground font-medium">{t.title}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md font-semibold border bg-background/55 text-muted-foreground uppercase shrink-0">
                            {t.status.replace("_", " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Group Modal */}
      {isCreateOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            aria-hidden="true"
            onClick={() => setIsCreateOpen(false)}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
          />

          {/* Modal Container */}
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6 transition-all duration-300 animate-in zoom-in-95"
          >
            <div
              className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border/80 overflow-hidden flex flex-col p-6 gap-5 max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-10 rounded-xl border border-primary/20 bg-primary/10 text-primary">
                    <PlusIcon className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground leading-tight">
                      Create New Group
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Define a new sprint, phase, or milestone for this project.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1 rounded-lg hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer"
                >
                  <XIcon className="size-4.5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="group-name" className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                    Group Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="group-name"
                    placeholder="e.g. Sprint 1, Design Phase, Q3 Milestone"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-muted/15 border-border/40 focus-visible:border-primary/50 focus-visible:ring-primary/20 rounded-xl"
                    required
                    autoFocus
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label htmlFor="group-desc" className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="group-desc"
                    placeholder="Describe the scope of this project group..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[90px] bg-muted/15 border-border/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl resize-none"
                    required
                  />
                </div>

                {/* Goal */}
                <div className="space-y-1.5">
                  <Label htmlFor="group-goal" className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                    Goal / Key Objective
                  </Label>
                  <Input
                    id="group-goal"
                    placeholder="e.g. Complete core frontend layout"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="bg-muted/15 border-border/40 focus-visible:border-primary/50 focus-visible:ring-primary/20 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Type Select */}
                  <div className="space-y-1.5 flex flex-col">
                    <Label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                      Group Type
                    </Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger className="w-full bg-muted/15 border-border/40 rounded-xl py-2 h-9 text-foreground font-medium focus-visible:ring-primary/20 focus-visible:border-primary/50">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-border/50 z-[200]">
                        <SelectItem value="sprint" className="text-foreground cursor-pointer">Sprint</SelectItem>
                        <SelectItem value="phase" className="text-foreground cursor-pointer">Phase</SelectItem>
                        <SelectItem value="section" className="text-foreground cursor-pointer">Section</SelectItem>
                        <SelectItem value="milestone" className="text-foreground cursor-pointer">Milestone</SelectItem>
                        <SelectItem value="campaign_stage" className="text-foreground cursor-pointer">Campaign Stage</SelectItem>
                        <SelectItem value="custom" className="text-foreground cursor-pointer">Custom Group</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Select */}
                  <div className="space-y-1.5 flex flex-col">
                    <Label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                      Initial Status
                    </Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="w-full bg-muted/15 border-border/40 rounded-xl py-2 h-9 text-foreground font-medium focus-visible:ring-primary/20 focus-visible:border-primary/50">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-border/50 z-[200]">
                        <SelectItem value="not_started" className="text-foreground cursor-pointer">Not Started</SelectItem>
                        <SelectItem value="in_progress" className="text-foreground cursor-pointer">In Progress</SelectItem>
                        <SelectItem value="completed" className="text-foreground cursor-pointer">Completed</SelectItem>
                        <SelectItem value="on_hold" className="text-foreground cursor-pointer">On Hold</SelectItem>
                        <SelectItem value="cancelled" className="text-foreground cursor-pointer">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Start Date */}
                  <DatePicker date={startDate} setDate={setStartDate} label="Start Date *" />

                  {/* End Date */}
                  <DatePicker date={endDate} setDate={setEndDate} label="End Date" />
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-4 mt-2 border-t border-border/30">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 text-sm rounded-xl cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createGroupMutation.isPending}
                    className="px-4 py-2 text-sm rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-50"
                  >
                    {createGroupMutation.isPending ? (
                      <>
                        <Loader2Icon className="size-4 animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      "Create Group"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
