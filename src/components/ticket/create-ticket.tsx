"use client"

import React, { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import {
  Loader2Icon,
  PlusIcon,
  FolderIcon,
  UserIcon,
  LayersIcon,
  CalendarIcon
} from "lucide-react"
import { toast } from "sonner"
import axios from "axios"

interface CreateTicketProps {
  open: boolean
  onClose: () => void
  defaultProjectId?: string
  defaultGroupId?: string
}

interface Project {
  id: string
  title: string
  isActive: boolean
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  initials: string
}

interface ProjectGroup {
  id: string
  name: string
  type: string
}

interface DatePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  label: string
}

function DatePicker({ date, setDate, label }: DatePickerProps) {
  return (
    <div className="space-y-1.5 flex flex-col">
      <Label className="text-xs font-bold text-foreground/85 uppercase tracking-wider">{label}</Label>
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

export default function CreateTicket({ open, onClose, defaultProjectId, defaultGroupId }: CreateTicketProps) {
  const queryClient = useQueryClient()
  const { user } = useSelector((state: RootState) => state.user)
  const companyId = user?.company?.id

  // Form States
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [projectId, setProjectId] = useState("")
  const [assignedUserId, setAssignedUserId] = useState<string>("unassigned")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("low")
  const [status, setStatus] = useState<string>("pending")
  const [groupId, setGroupId] = useState<string>("none")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [type, setType] = useState<string>("task")

  // Reset form state when sheet opens
  useEffect(() => {
    if (open) {
      setTitle("")
      setDescription("")
      setProjectId(defaultProjectId || "")
      setAssignedUserId("unassigned")
      setPriority("low")
      setStatus("pending")
      setGroupId(defaultGroupId || "none")
      setDueDate(undefined)
      setType("task")
    }
  }, [open, defaultProjectId, defaultGroupId])

  // Fetch company projects
  const { data: projectsData, isLoading: isProjectsLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects")
      if (!res.ok) throw new Error("Failed to fetch projects")
      return res.json()
    },
    enabled: open,
  })

  const projects: Project[] = projectsData?.projects || []

  // Fetch details of the selected project (to get its members and admins)
  const { data: selectedProjectData, isLoading: isProjectLoading } = useQuery({
    queryKey: ["project-assignees", projectId],
    queryFn: async () => {
      if (!projectId) return null
      const res = await axios.get(`/api/projects/${projectId}`)
      return res.data.project
    },
    enabled: open && !!projectId,
  })

  const assignableMembers = React.useMemo(() => {
    if (!selectedProjectData) return []
    const adminsList = (selectedProjectData.admins || []).map((a: any) => ({
      id: a.id,
      name: `${a.name} (Admin)`,
      email: a.email,
      role: a.role,
      initials: a.name.trim().split(/\s+/).filter(Boolean).map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "U",
    }))
    const membersList = (selectedProjectData.members || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      initials: m.name.trim().split(/\s+/).filter(Boolean).map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "U",
    }))

    const combined = [...adminsList, ...membersList]
    const seen = new Set()
    return combined.filter(member => {
      if (seen.has(member.id)) return false
      seen.add(member.id)
      return true
    })
  }, [selectedProjectData])

  // Fetch project groups
  const { data: groupsData, isLoading: isGroupsLoading } = useQuery({
    queryKey: ["project-groups", projectId],
    queryFn: async () => {
      if (!projectId) return []
      const res = await axios.get(`/api/projects/${projectId}/groups`)
      return res.data.groups as ProjectGroup[]
    },
    enabled: open && !!projectId,
  })

  const groups = groupsData || []

  // Create Ticket Mutation
  const createTicketMutation = useMutation({
    mutationFn: async (payload: {
      title: string
      description: string
      projectId: string
      assignedUserId?: string
      priority: string
      status: string
      groupId?: string
      dueDate?: string
      type: string
    }) => {
      const res = await axios.post("/api/tickets", payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
      queryClient.invalidateQueries({ queryKey: ["schedule"] })
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["project", projectId] })
        queryClient.invalidateQueries({ queryKey: ["project-groups", projectId] })
        queryClient.invalidateQueries({ queryKey: ["project-group-detail", projectId] })
      }
      toast.success("Ticket created successfully!")
      onClose()
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.error || "Failed to create ticket"
      toast.error(errMsg)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("Ticket Title is required")
      return
    }
    if (!description.trim()) {
      toast.error("Ticket Description is required")
      return
    }
    if (!projectId) {
      toast.error("Please select a project")
      return
    }

    const payload: any = {
      title: title.trim(),
      description: description.trim(),
      projectId,
      priority,
      status,
      type,
    }

    if (assignedUserId && assignedUserId !== "unassigned") {
      payload.assignedUserId = assignedUserId
    }

    if (groupId && groupId !== "none") {
      payload.groupId = groupId
    }

    if (dueDate) {
      payload.dueDate = dueDate.toISOString()
    }

    createTicketMutation.mutate(payload)
  }

  const selectedGroup = React.useMemo(() => {
    return groups.find((g: any) => g.id === groupId)
  }, [groups, groupId])

  return (
    <Sheet open={open} onOpenChange={(val) => { if (!val) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-5 flex flex-col h-full bg-card border-l border-border/80">
        
        {/* Header */}
        <SheetHeader className="p-0 mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl border border-primary/20 bg-primary/10 text-primary animate-pulse">
              <PlusIcon className="size-5" />
            </div>
            <div>
              <SheetTitle className="text-lg font-bold text-foreground leading-tight text-left">
                Create New Ticket
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5 text-left">
                {defaultProjectId && selectedProjectData ? (
                  <span className="inline-flex items-center gap-1.5 flex-wrap">
                    In <span className="font-semibold text-foreground bg-primary/5 px-2 py-0.5 rounded border border-primary/10">{selectedProjectData.title}</span>
                    {defaultGroupId && selectedGroup && (
                      <> › <span className="font-semibold text-foreground bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10">{selectedGroup.name}</span></>
                    )}
                  </span>
                ) : (
                  "Fill in details to track a new project deliverable."
                )}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">

          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="ticket-title" className="text-xs font-bold text-foreground/85 uppercase tracking-wider">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ticket-title"
              placeholder="Enter ticket title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-muted/15 border-border/40 focus-visible:border-primary/50 focus-visible:ring-primary/20 rounded-xl h-9 text-sm"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="ticket-desc" className="text-xs font-bold text-foreground/85 uppercase tracking-wider">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="ticket-desc"
              placeholder="Describe the ticket objective, steps, and expected outcome..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-16 bg-muted/15 border-border/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl resize-none text-sm p-2.5"
              required
            />
          </div>

          {/* Project & Group Select (Combined and conditional) */}
          {!defaultProjectId ? (
            <div className="grid grid-cols-2 gap-3">
              {/* Project Select */}
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs font-bold text-foreground/85 uppercase tracking-wider">
                  Project <span className="text-red-500">*</span>
                </Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger className="w-full bg-muted/15 border-border/40 rounded-xl py-2 h-9 text-foreground font-medium focus-visible:ring-primary/20 focus-visible:border-primary/50">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="rounded-xl border border-border/50 z-[200]">
                    {isProjectsLoading ? (
                      <div className="flex items-center gap-2 p-2 text-xs text-muted-foreground">
                        <Loader2Icon className="size-3 animate-spin" /> Loading projects...
                      </div>
                    ) : projects.length === 0 ? (
                      <div className="p-2 text-xs text-muted-foreground">No projects found</div>
                    ) : (
                      projects.map((proj) => (
                        <SelectItem key={proj.id} value={proj.id} className="text-foreground cursor-pointer">
                          <span className="flex items-center gap-2">
                            <FolderIcon className="size-3.5 text-primary/70" />
                            {proj.title}
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Project Group Select */}
              <div className="space-y-1 flex flex-col">
                <Label className="text-xs font-bold text-foreground/85 uppercase tracking-wider">
                  Project Group
                </Label>
                <Select value={groupId} onValueChange={setGroupId} disabled={!projectId}>
                  <SelectTrigger className="w-full bg-muted/15 border-border/40 rounded-xl py-2 h-9 text-foreground font-medium focus-visible:ring-primary/20 focus-visible:border-primary/50 disabled:opacity-50">
                    <SelectValue placeholder="None (Individual)" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="rounded-xl border border-border/50 z-[200]">
                    <SelectItem value="none" className="text-foreground cursor-pointer">
                      <span className="flex items-center gap-2">
                        <LayersIcon className="size-3.5 text-muted-foreground" />
                        None (Individual)
                      </span>
                    </SelectItem>
                    {isGroupsLoading ? (
                      <div className="flex items-center gap-2 p-2 text-xs text-muted-foreground">
                        <Loader2Icon className="size-3 animate-spin" /> Loading...
                      </div>
                    ) : groups.length === 0 ? (
                      <div className="p-2 text-xs text-muted-foreground italic">No groups available</div>
                    ) : (
                      groups.map((g) => (
                        <SelectItem key={g.id} value={g.id} className="text-foreground cursor-pointer">
                          <span className="flex items-center gap-2">
                            <LayersIcon className="size-3.5 text-primary/70" />
                            {g.name} ({g.type})
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : !defaultGroupId ? (
            /* Project is pre-set but group/sprint isn't */
            <div className="space-y-1 flex flex-col">
              <Label className="text-xs font-bold text-foreground/85 uppercase tracking-wider">
                Project Group
              </Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger className="w-full bg-muted/15 border-border/40 rounded-xl py-2 h-9 text-foreground font-medium focus-visible:ring-primary/20 focus-visible:border-primary/50">
                  <SelectValue placeholder="None (Individual)" />
                </SelectTrigger>
                <SelectContent position="popper" className="rounded-xl border border-border/50 z-[200]">
                  <SelectItem value="none" className="text-foreground cursor-pointer">
                    <span className="flex items-center gap-2">
                      <LayersIcon className="size-3.5 text-muted-foreground" />
                      None (Individual)
                    </span>
                  </SelectItem>
                  {isGroupsLoading ? (
                    <div className="flex items-center gap-2 p-2 text-xs text-muted-foreground">
                      <Loader2Icon className="size-3 animate-spin" /> Loading...
                    </div>
                  ) : groups.length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground italic">No groups available</div>
                  ) : (
                    groups.map((g) => (
                      <SelectItem key={g.id} value={g.id} className="text-foreground cursor-pointer">
                        <span className="flex items-center gap-2">
                          <LayersIcon className="size-3.5 text-primary/70" />
                          {g.name} ({g.type})
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Assignee Select */}
            <div className="space-y-1 flex flex-col">
              <Label className="text-xs font-bold text-foreground/85 uppercase tracking-wider">
                Assignee
              </Label>
              <Select value={assignedUserId} onValueChange={setAssignedUserId}>
                <SelectTrigger className="w-full bg-muted/15 border-border/40 rounded-xl py-2 h-9 text-foreground font-medium focus-visible:ring-primary/20 focus-visible:border-primary/50">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent position="popper" className="rounded-xl border border-border/50 z-[200]">
                  <SelectItem value="unassigned" className="text-foreground cursor-pointer">
                    <span className="flex items-center gap-2">
                      <UserIcon className="size-3.5 text-muted-foreground" />
                      Unassigned
                    </span>
                  </SelectItem>
                  {isProjectLoading ? (
                    <div className="flex items-center gap-2 p-2 text-xs text-muted-foreground">
                      <Loader2Icon className="size-3 animate-spin" /> Loading members...
                    </div>
                  ) : !projectId ? (
                    <div className="p-2 text-xs text-muted-foreground italic">Select a project first</div>
                  ) : assignableMembers.length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground italic">No members in this project</div>
                  ) : (
                    assignableMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id} className="text-foreground cursor-pointer">
                        <span className="flex items-center gap-2">
                          <span className="size-4.5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                            {member.initials}
                          </span>
                          {member.name}
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Priority Select */}
            <div className="space-y-1 flex flex-col">
              <Label className="text-xs font-bold text-foreground/85 uppercase tracking-wider">
                Priority
              </Label>
              <Select value={priority} onValueChange={(val) => setPriority(val as any)}>
                <SelectTrigger className="w-full bg-muted/15 border-border/40 rounded-xl py-2 h-9 text-foreground font-medium focus-visible:ring-primary/20 focus-visible:border-primary/50">
                  <SelectValue placeholder="Low" />
                </SelectTrigger>
                <SelectContent position="popper" className="rounded-xl border border-border/50 z-[200]">
                  <SelectItem value="low" className="text-foreground cursor-pointer">Low</SelectItem>
                  <SelectItem value="medium" className="text-foreground cursor-pointer">Medium</SelectItem>
                  <SelectItem value="high" className="text-foreground cursor-pointer">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Ticket Type */}
            <div className="space-y-1 flex flex-col">
              <Label className="text-xs font-bold text-foreground/85 uppercase tracking-wider">
                Type
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full bg-muted/15 border-border/40 rounded-xl py-2 h-9 text-foreground font-medium focus-visible:ring-primary/20 focus-visible:border-primary/50">
                  <SelectValue placeholder="Task" />
                </SelectTrigger>
                <SelectContent position="popper" className="rounded-xl border border-border/50 z-[200]">
                  <SelectItem value="task" className="text-foreground cursor-pointer">Task</SelectItem>
                  <SelectItem value="feature" className="text-foreground cursor-pointer">Feature</SelectItem>
                  <SelectItem value="bug" className="text-foreground cursor-pointer">Bug</SelectItem>
                  <SelectItem value="improvement" className="text-foreground cursor-pointer">Improvement</SelectItem>
                  <SelectItem value="documentation" className="text-foreground cursor-pointer">Documentation</SelectItem>
                  <SelectItem value="other" className="text-foreground cursor-pointer">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Select */}
            <div className="space-y-1 flex flex-col">
              <Label className="text-xs font-bold text-foreground/85 uppercase tracking-wider">
                Status
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full bg-muted/15 border-border/40 rounded-xl py-2 h-9 text-foreground font-medium focus-visible:ring-primary/20 focus-visible:border-primary/50">
                  <SelectValue placeholder="Todo" />
                </SelectTrigger>
                <SelectContent position="popper" className="rounded-xl border border-border/50 z-[200]">
                  <SelectItem value="pending" className="text-foreground cursor-pointer">Todo</SelectItem>
                  <SelectItem value="in_progress" className="text-foreground cursor-pointer">In Progress</SelectItem>
                  <SelectItem value="in_review" className="text-foreground cursor-pointer">In Review</SelectItem>
                  <SelectItem value="completed" className="text-foreground cursor-pointer">Completed</SelectItem>
                  <SelectItem value="blocked" className="text-foreground cursor-pointer">Blocked</SelectItem>
                  <SelectItem value="reopen" className="text-foreground cursor-pointer">Reopen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <DatePicker date={dueDate} setDate={setDueDate} label="Due Date" />

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 pt-4 mt-auto border-t border-border/30">
            <Button type="button" variant="outline" onClick={onClose} className="w-full h-9 rounded-xl cursor-pointer">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTicketMutation.isPending}
              className="w-full h-9 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-50 rounded-xl"
            >
              {createTicketMutation.isPending ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Loader2Icon className="size-3.5 animate-spin" />
                  Creating...
                </span>
              ) : (
                "Create Ticket"
              )}
            </Button>
          </div>

        </form>
      </SheetContent>
    </Sheet>
  )
}
