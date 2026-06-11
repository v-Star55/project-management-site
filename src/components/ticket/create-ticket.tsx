"use client"

import React, { useState, useEffect, useRef } from "react"
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
  XIcon,
  Loader2Icon,
  PlusIcon,
  FolderIcon,
  UserIcon,
} from "lucide-react"
import { toast } from "sonner"
import axios from "axios"

interface CreateTicketProps {
  open: boolean
  onClose: () => void
  defaultProjectId?: string
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

export default function CreateTicket({ open, onClose, defaultProjectId }: CreateTicketProps) {
  const queryClient = useQueryClient()
  const overlayRef = useRef<HTMLDivElement>(null)
  const { user } = useSelector((state: RootState) => state.user)
  const companyId = user?.company?.id

  // Form States
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [projectId, setProjectId] = useState("")
  const [assignedUserId, setAssignedUserId] = useState<string>("unassigned")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("low")
  const [status, setStatus] = useState<string>("pending")

  // Reset form state when modal opens/closes
  useEffect(() => {
    if (open) {
      setTitle("")
      setDescription("")
      setProjectId(defaultProjectId || "")
      setAssignedUserId("unassigned")
      setPriority("low")
      setStatus("pending")
    }
  }, [open, defaultProjectId])

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

  // Fetch company team members
  const { data: teamData, isLoading: isTeamLoading } = useQuery({
    queryKey: ["teams", companyId],
    queryFn: async () => {
      if (!companyId) return { teams: [] }
      const res = await axios.get(`/api/teams/${companyId}`)
      return res.data
    },
    enabled: open && !!companyId,
  })

  const teamMembers: TeamMember[] = teamData?.teams || []

  // Create Ticket Mutation
  const createTicketMutation = useMutation({
    mutationFn: async (payload: {
      title: string
      description: string
      projectId: string
      assignedUserId?: string
      priority: string
      status: string
    }) => {
      const res = await axios.post("/api/tickets", payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
      queryClient.invalidateQueries({ queryKey: ["schedule"] })
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      }
      toast.success("Ticket created successfully!")
      onClose()
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.error || "Failed to create ticket"
      toast.error(errMsg)
    },
  })

  // Keyboard accessibility: Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, onClose])

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

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
    }

    if (assignedUserId && assignedUserId !== "unassigned") {
      payload.assignedUserId = assignedUserId
    }

    createTicketMutation.mutate(payload)
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      {/* Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        ref={overlayRef}
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
                  Create New Ticket
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Fill in details to track a new project deliverable.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer"
            >
              <XIcon className="size-4.5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="ticket-title" className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ticket-title"
                placeholder="Enter ticket title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-muted/15 border-border/40 focus-visible:border-primary/50 focus-visible:ring-primary/20 rounded-xl"
                required
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="ticket-desc" className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="ticket-desc"
                placeholder="Describe the ticket objective, steps, and expected outcome..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] bg-muted/15 border-border/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Project Select */}
              <div className="space-y-1.5 flex flex-col">
                <Label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                  Project <span className="text-red-500">*</span>
                </Label>
                <Select value={projectId} onValueChange={setProjectId} disabled={!!defaultProjectId}>
                  <SelectTrigger className="w-full bg-muted/15 border-border/40 rounded-xl py-2 h-9 text-foreground font-medium focus-visible:ring-primary/20 focus-visible:border-primary/50 disabled:opacity-75 disabled:cursor-not-allowed">
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
                        <SelectItem key={proj.id} value={proj.id} className="text-foreground">
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

              {/* Assignee Select */}
              <div className="space-y-1.5 flex flex-col">
                <Label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                  Assignee
                </Label>
                <Select value={assignedUserId} onValueChange={setAssignedUserId}>
                  <SelectTrigger className="w-full bg-muted/15 border-border/40 rounded-xl py-2 h-9 text-foreground font-medium focus-visible:ring-primary/20 focus-visible:border-primary/50">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="rounded-xl border border-border/50 z-[200]">
                    <SelectItem value="unassigned" className="text-foreground">
                      <span className="flex items-center gap-2">
                        <UserIcon className="size-3.5 text-muted-foreground" />
                        Unassigned
                      </span>
                    </SelectItem>
                    {isTeamLoading ? (
                      <div className="flex items-center gap-2 p-2 text-xs text-muted-foreground">
                        <Loader2Icon className="size-3 animate-spin" /> Loading members...
                      </div>
                    ) : (
                      teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id} className="text-foreground">
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

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Priority Select */}
              <div className="space-y-1.5 flex flex-col">
                <Label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                  Priority
                </Label>
                <Select value={priority} onValueChange={(val) => setPriority(val as any)}>
                  <SelectTrigger className="w-full bg-muted/15 border-border/40 rounded-xl py-2 h-9 text-foreground font-medium focus-visible:ring-primary/20 focus-visible:border-primary/50">
                    <SelectValue placeholder="Low" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="rounded-xl border border-border/50 z-[200]">
                    <SelectItem value="low" className="text-foreground">Low</SelectItem>
                    <SelectItem value="medium" className="text-foreground">Medium</SelectItem>
                    <SelectItem value="high" className="text-foreground">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Select */}
              <div className="space-y-1.5 flex flex-col">
                <Label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                  Status
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full bg-muted/15 border-border/40 rounded-xl py-2 h-9 text-foreground font-medium focus-visible:ring-primary/20 focus-visible:border-primary/50">
                    <SelectValue placeholder="Todo" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="rounded-xl border border-border/50 z-[200]">
                    <SelectItem value="pending" className="text-foreground">Todo</SelectItem>
                    <SelectItem value="in_progress" className="text-foreground">In Progress</SelectItem>
                    <SelectItem value="in_review" className="text-foreground">In Review</SelectItem>
                    <SelectItem value="completed" className="text-foreground">Completed</SelectItem>
                    <SelectItem value="blocked" className="text-foreground">Blocked</SelectItem>
                    <SelectItem value="reopen" className="text-foreground">Reopen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 mt-2 border-t border-border/30">
              <Button type="button" variant="outline" onClick={onClose} className="px-4 py-2 text-sm rounded-xl">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createTicketMutation.isPending}
                className="px-4 py-2 text-sm rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                {createTicketMutation.isPending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Ticket"
                )}
              </Button>
            </div>

          </form>
        </div>
      </div>
    </>
  )
}
