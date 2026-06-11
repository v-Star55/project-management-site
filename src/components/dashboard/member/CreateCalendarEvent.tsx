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
  UsersIcon,
  Link2Icon,
} from "lucide-react"
import { toast } from "sonner"
import axios from "axios"

interface CreateCalendarEventProps {
  open: boolean
  onClose: () => void
  selectedDate?: Date
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

const MEETING_TITLES = [
  "Daily Standup",
  "Sprint Planning",
  "Client Discussion",
  "general discussion",
  "Retrospective"
]

const REMINDER_TITLES = [
  "Submit Timesheet",
  "Review Pull Request",
  "Update Documentation"
]

const SPRINT_TITLES = [
  "Sprint Start",
  "Sprint End",
  "Sprint Review",
  "Sprint Demo",
  "Feature Demo",
  "Sprint Retrospective",
  "Team Improvement Discussion"
]

export default function CreateCalendarEvent({ open, onClose, selectedDate }: CreateCalendarEventProps) {
  const queryClient = useQueryClient()
  const overlayRef = useRef<HTMLDivElement>(null)
  const { user } = useSelector((state: RootState) => state.user)
  const companyId = user?.company?.id

  // Form States
  const [type, setType] = useState<string>("meeting")
  const [titleOption, setTitleOption] = useState<string>("")
  const [customTitle, setCustomTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dateStr, setDateStr] = useState("")
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [priority, setPriority] = useState<string>("low")
  const [status, setStatus] = useState<string>("scheduled")
  const [link, setLink] = useState("")
  const [projectId, setProjectId] = useState("none")
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([])

  // Load selectedDate into state when opening
  useEffect(() => {
    if (open) {
      const initialDate = selectedDate || new Date()
      // format to YYYY-MM-DD locally
      const yyyy = initialDate.getFullYear()
      const mm = String(initialDate.getMonth() + 1).padStart(2, '0')
      const dd = String(initialDate.getDate()).padStart(2, '0')
      setDateStr(`${yyyy}-${mm}-${dd}`)
      
      setType("meeting")
      setTitleOption(MEETING_TITLES[0])
      setCustomTitle("")
      setDescription("")
      setStartTime("09:00")
      setEndTime("10:00")
      setPriority("low")
      setStatus("scheduled")
      setLink("")
      setProjectId("none")
      // default assign to current user
      setAssignedUserIds(user?.id ? [user.id] : [])
    }
  }, [open, selectedDate, user])

  // Get suggestions depending on event type
  const getSuggestions = (t: string) => {
    switch (t) {
      case "meeting":
        return MEETING_TITLES
      case "reminder":
        return REMINDER_TITLES
      case "sprint":
        return SPRINT_TITLES
      default:
        return []
    }
  }

  const currentSuggestions = getSuggestions(type)
  const hasSuggestions = currentSuggestions.length > 0

  // Adjust title choice when type changes
  useEffect(() => {
    const sug = getSuggestions(type)
    if (sug.length > 0) {
      setTitleOption(sug[0])
      setCustomTitle("")
    } else {
      setTitleOption("custom")
      setCustomTitle("")
    }
  }, [type])

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

  // Create Event Mutation
  const createEventMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axios.post("/api/users/me/calendar", payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar"] })
      toast.success("Calendar event created successfully!")
      onClose()
    },
    onError: (err: any) => {
      const errMsg = err.response?.data?.error || "Failed to create event"
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

    const title = titleOption === "custom" ? customTitle.trim() : titleOption
    if (!title) {
      toast.error("Event Title is required")
      return
    }

    if (!dateStr) {
      toast.error("Date is required")
      return
    }

    if (!startTime) {
      toast.error("Start Time is required")
      return
    }

    const payload: any = {
      title,
      description: description.trim() || undefined,
      date: dateStr,
      startTime,
      endTime: endTime || undefined,
      type,
      priority,
      status,
      link: link.trim() || undefined,
      projectId: projectId !== "none" ? projectId : undefined,
      assignedTo: assignedUserIds,
    }

    createEventMutation.mutate(payload)
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
                  Create Calendar Event
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Schedule meetings, reminders, sprints, and other events.
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
            
            {/* Event Type */}
            <div className="space-y-1.5 flex flex-col">
              <Label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                Event Type <span className="text-red-500">*</span>
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-full bg-muted/15 border-border/40 rounded-xl py-2 h-9 text-foreground font-medium focus-visible:ring-primary/20 focus-visible:border-primary/50">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent position="popper" className="rounded-xl border border-border/50 z-[200]">
                  <SelectItem value="meeting" className="text-foreground">Meeting</SelectItem>
                  <SelectItem value="reminder" className="text-foreground">Reminder</SelectItem>
                  <SelectItem value="sprint" className="text-foreground">Sprint</SelectItem>
                  <SelectItem value="call" className="text-foreground">Call</SelectItem>
                  <SelectItem value="task" className="text-foreground">Task</SelectItem>
                  <SelectItem value="other" className="text-foreground">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title Selector/Input */}
            <div className="space-y-1.5 flex flex-col">
              <Label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                Title <span className="text-red-500">*</span>
              </Label>
              {hasSuggestions ? (
                <div className="space-y-2">
                  <Select value={titleOption} onValueChange={setTitleOption}>
                    <SelectTrigger className="w-full bg-muted/15 border-border/40 rounded-xl py-2 h-9 text-foreground font-medium focus-visible:ring-primary/20 focus-visible:border-primary/50">
                      <SelectValue placeholder="Select a title option" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="rounded-xl border border-border/50 z-[200]">
                      {currentSuggestions.map((item) => (
                        <SelectItem key={item} value={item} className="text-foreground">
                          {item}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom" className="text-foreground font-semibold text-primary">
                        -- Custom Title --
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {titleOption === "custom" && (
                    <Input
                      placeholder="Enter custom event title"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="bg-muted/15 border-border/40 focus-visible:border-primary/50 focus-visible:ring-primary/20 rounded-xl"
                      required
                    />
                  )}
                </div>
              ) : (
                <Input
                  placeholder="Enter event title"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="bg-muted/15 border-border/40 focus-visible:border-primary/50 focus-visible:ring-primary/20 rounded-xl"
                  required
                />
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="event-desc" className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                Description
              </Label>
              <Textarea
                id="event-desc"
                placeholder="Optional details, agenda, notes, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[70px] bg-muted/15 border-border/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl resize-none"
              />
            </div>

            {/* Date & Time Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="event-date" className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="event-date"
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="bg-muted/15 border-border/40 rounded-xl py-2 h-9 text-foreground"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="start-time" className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                  Start Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-muted/15 border-border/40 rounded-xl py-2 h-9 text-foreground"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="end-time" className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                  End Time
                </Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-muted/15 border-border/40 rounded-xl py-2 h-9 text-foreground"
                />
              </div>
            </div>

            {/* Project & Link Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 flex flex-col">
                <Label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                  Related Project
                </Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger className="w-full bg-muted/15 border-border/40 rounded-xl py-2 h-9 text-foreground font-medium focus-visible:ring-primary/20 focus-visible:border-primary/50">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="rounded-xl border border-border/50 z-[200]">
                    <SelectItem value="none" className="text-foreground">None</SelectItem>
                    {isProjectsLoading ? (
                      <div className="flex items-center gap-2 p-2 text-xs text-muted-foreground">
                        <Loader2Icon className="size-3 animate-spin" /> Loading...
                      </div>
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

              <div className="space-y-1.5">
                <Label htmlFor="event-link" className="text-xs font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-1">
                  <Link2Icon className="size-3 text-muted-foreground" /> Meeting Link
                </Label>
                <Input
                  id="event-link"
                  type="url"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="bg-muted/15 border-border/40 focus-visible:border-primary/50 focus-visible:ring-primary/20 rounded-xl"
                />
              </div>
            </div>

            {/* Multi-Assignee Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-1">
                <UsersIcon className="size-3 text-muted-foreground" /> Assignees <span className="text-red-500">*</span>
              </Label>
              <div className="border border-border/40 rounded-xl p-3 bg-muted/10 max-h-32 overflow-y-auto space-y-2">
                {isTeamLoading ? (
                  <div className="flex items-center gap-2 p-2 text-xs text-muted-foreground">
                    <Loader2Icon className="size-3 animate-spin" /> Loading team members...
                  </div>
                ) : teamMembers.length === 0 ? (
                  <div className="p-2 text-xs text-muted-foreground">No team members found</div>
                ) : (
                  teamMembers.map((member) => {
                    const isChecked = assignedUserIds.includes(member.id)
                    return (
                      <label
                        key={member.id}
                        className="flex items-center gap-2.5 text-xs font-medium cursor-pointer text-foreground hover:bg-muted/30 p-1.5 rounded-lg transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setAssignedUserIds(assignedUserIds.filter(id => id !== member.id))
                            } else {
                              setAssignedUserIds([...assignedUserIds, member.id])
                            }
                          }}
                          className="rounded border-border/40 text-purple-600 focus:ring-purple-500 size-3.5 cursor-pointer"
                        />
                        <div className="size-5.5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                          {member.initials}
                        </div>
                        <div className="flex flex-col">
                          <span>{member.name}</span>
                          <span className="text-[10px] text-muted-foreground font-normal leading-none">{member.role}</span>
                        </div>
                      </label>
                    )
                  })
                )}
              </div>
            </div>

            {/* Priority & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 flex flex-col">
                <Label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                  Priority
                </Label>
                <Select value={priority} onValueChange={setPriority}>
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

              <div className="space-y-1.5 flex flex-col">
                <Label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
                  Status
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full bg-muted/15 border-border/40 rounded-xl py-2 h-9 text-foreground font-medium focus-visible:ring-primary/20 focus-visible:border-primary/50">
                    <SelectValue placeholder="Scheduled" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="rounded-xl border border-border/50 z-[200]">
                    <SelectItem value="scheduled" className="text-foreground">Scheduled</SelectItem>
                    <SelectItem value="completed" className="text-foreground">Completed</SelectItem>
                    <SelectItem value="cancelled" className="text-foreground">Cancelled</SelectItem>
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
                disabled={createEventMutation.isPending}
                className="px-4 py-2 text-sm rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                {createEventMutation.isPending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Event"
                )}
              </Button>
            </div>

          </form>
        </div>
      </div>
    </>
  )
}
