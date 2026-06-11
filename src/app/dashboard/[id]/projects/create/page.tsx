"use client"

import React, { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { 
  PlusIcon, 
  ArrowLeftIcon, 
  CheckIcon,
  FolderIcon,
  CalendarIcon
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  initials: string
}

interface DatePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  label: string
}

function DatePicker({ date, setDate, label }: DatePickerProps) {
  return (
    <div className="space-y-1.5 flex flex-col">
      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
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

export default function CreateProjectPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const { id: userId } = params
  const { user } = useSelector((state: RootState) => state.user)
  const companyId = user?.company?.id
  const userRole = user?.role || ""

  // Form Fields State
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("pending")
  const [phase, setPhase] = useState("idea")
  const [category, setCategory] = useState("software")
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined)
  const [completedDate, setCompletedDate] = useState<Date | undefined>(undefined)
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])

  // Fetch all Company Users (to select project members)
  const { data: companyUsersData, isLoading: isTeamLoading } = useQuery({
    queryKey: ["teams", companyId],
    queryFn: async () => {
      if (!companyId) return { teams: [] }
      const response = await axios.get(`/api/teams/${companyId}`)
      return response.data
    },
    enabled: !!companyId && (userRole === "owner" || userRole === "admin"),
  })

  const companyUsers: TeamMember[] = companyUsersData?.teams || []

  // Mutation to create project
  const createProjectMutation = useMutation({
    mutationFn: async (payload: {
      title: string
      description: string
      status: string
      phase: string
      category: string
      startDate: string | null
      targetDate: string | null
      completedDate: string | null
      memberIds: string[]
    }) => {
      const response = await axios.post("/api/projects", payload)
      return response.data.project
    },
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      toast.success("Project created successfully!")
      // Redirect to the new project detail view
      router.push(`/dashboard/${userId}/projects/${newProject.id}`)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to create project")
    }
  })

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error("Project Title is required")
      return
    }
    createProjectMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      status: status,
      phase: phase,
      category: category,
      startDate: startDate ? startDate.toISOString() : null,
      targetDate: targetDate ? targetDate.toISOString() : null,
      completedDate: completedDate ? completedDate.toISOString() : null,
      memberIds: selectedMemberIds,
    })
  }

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMemberIds((prev) => 
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    )
  }

  // Authorization Check: Only owners and admins can create projects.
  if (userRole !== "owner" && userRole !== "admin") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] text-center p-6">
        <p className="font-semibold text-foreground">Access Denied</p>
        <p className="text-sm text-muted-foreground mt-1">
          You do not have permission to create projects in this workspace.
        </p>
        <button 
          onClick={() => router.push(`/dashboard/${userId}`)}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 border border-border bg-transparent hover:bg-muted text-foreground font-medium rounded-xl text-xs transition-colors cursor-pointer"
        >
          <ArrowLeftIcon className="size-4" />
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 md:p-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Header and Back navigation */}
      <div className="flex flex-col gap-4">
        <button 
          onClick={() => router.push(`/dashboard/${userId}`)}
          className="inline-flex w-fit items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeftIcon className="size-3.5" />
          Back to Dashboard
        </button>
        
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
            <PlusIcon className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Create New Project
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Initialize a new project workspace, schedule project timeline, and add team members.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleCreateProject} className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-sm">
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Left Column (Metadata) */}
          <div className="flex flex-col gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Project Title <span className="text-red-500">*</span></label>
              <Input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter project title"
                className="bg-muted/15 border-border/40 focus-visible:border-primary/50 focus-visible:ring-primary/20 rounded-xl"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</label>
              <Textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter project description..."
                className="min-h-[120px] bg-muted/15 border-border/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 rounded-xl resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 flex flex-col">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Project Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full bg-muted/15 border-border/40 rounded-xl py-2 h-9 text-foreground font-medium focus-visible:ring-primary/20 focus-visible:border-primary/50">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-border/50 z-[200]">
                    <SelectItem value="pending" className="text-foreground cursor-pointer">Pending</SelectItem>
                    <SelectItem value="in_progress" className="text-foreground cursor-pointer">In Progress</SelectItem>
                    <SelectItem value="completed" className="text-foreground cursor-pointer">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 flex flex-col">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Project Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full bg-muted/15 border-border/40 rounded-xl py-2 h-9 text-foreground font-medium focus-visible:ring-primary/20 focus-visible:border-primary/50">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-border/50 z-[200]">
                    <SelectItem value="software" className="text-foreground cursor-pointer">Software Development</SelectItem>
                    <SelectItem value="marketing" className="text-foreground cursor-pointer">Marketing</SelectItem>
                    <SelectItem value="design" className="text-foreground cursor-pointer">Design</SelectItem>
                    <SelectItem value="interior" className="text-foreground cursor-pointer">Interior Design</SelectItem>
                    <SelectItem value="other" className="text-foreground cursor-pointer">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 flex flex-col">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Project Phase</label>
                <Select value={phase} onValueChange={setPhase}>
                  <SelectTrigger className="w-full bg-muted/15 border-border/40 rounded-xl py-2 h-9 text-foreground font-medium focus-visible:ring-primary/20 focus-visible:border-primary/50">
                    <SelectValue placeholder="Select Phase" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-border/50 z-[200] max-h-56 overflow-y-auto">
                    <SelectItem value="idea" className="text-foreground cursor-pointer">Idea</SelectItem>
                    <SelectItem value="discovery" className="text-foreground cursor-pointer">Discovery</SelectItem>
                    <SelectItem value="requirement_gathering" className="text-foreground cursor-pointer">Requirement Gathering</SelectItem>
                    <SelectItem value="prototype" className="text-foreground cursor-pointer">Prototype</SelectItem>
                    <SelectItem value="planning" className="text-foreground cursor-pointer">Planning</SelectItem>
                    <SelectItem value="design" className="text-foreground cursor-pointer">Design</SelectItem>
                    <SelectItem value="development" className="text-foreground cursor-pointer">Development</SelectItem>
                    <SelectItem value="testing" className="text-foreground cursor-pointer">Testing</SelectItem>
                    <SelectItem value="review" className="text-foreground cursor-pointer">Review</SelectItem>
                    <SelectItem value="deployment" className="text-foreground cursor-pointer">Deployment</SelectItem>
                    <SelectItem value="maintenance" className="text-foreground cursor-pointer">Maintenance</SelectItem>
                    <SelectItem value="completed" className="text-foreground cursor-pointer">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <DatePicker date={startDate} setDate={setStartDate} label="Start Date" />
              <DatePicker date={targetDate} setDate={setTargetDate} label="Target Date" />
              <DatePicker date={completedDate} setDate={setCompletedDate} label="Completed Date" />
            </div>
          </div>

          {/* Right Column (Members Multiselect) */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Project Members</label>
            <div className="border border-border/60 rounded-xl overflow-hidden bg-muted/15 flex flex-col flex-1 max-h-[380px]">
              {isTeamLoading ? (
                <div className="flex flex-col items-center justify-center flex-1 gap-2 p-6 text-xs text-muted-foreground">
                  <Spinner className="size-6 text-primary animate-spin" />
                  <span>Loading team members...</span>
                </div>
              ) : (
                <div className="overflow-y-auto p-3 flex flex-col gap-2">
                  {companyUsers.map((item) => {
                    const isSelected = selectedMemberIds.includes(item.id)
                    return (
                      <div 
                        key={item.id}
                        onClick={() => toggleMemberSelection(item.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected 
                            ? "bg-primary/5 border-primary/45 shadow-2xs" 
                            : "bg-card/40 border-border/40 hover:bg-muted/30 hover:border-border/80"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-[10px] font-bold text-stone-700 dark:text-stone-300">
                            {item.initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground">{item.name}</span>
                            <span className="text-[10px] text-muted-foreground">{item.role}</span>
                          </div>
                        </div>
                        <div className={`size-4.5 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border/80 bg-transparent"
                        }`}>
                          {isSelected && <CheckIcon className="size-3 stroke-[3]" />}
                        </div>
                      </div>
                    )
                  })}
                  {companyUsers.length === 0 && (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                      No team members available.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border/40 pt-4 mt-2">
          <button 
            type="button" 
            onClick={() => router.push(`/dashboard/${userId}`)}
            className="px-4 py-2 border border-border bg-transparent hover:bg-muted text-foreground font-medium rounded-xl text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={createProjectMutation.isPending}
            className="px-5 py-2 bg-primary text-primary-foreground hover:bg-primary/95 font-medium rounded-xl text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {createProjectMutation.isPending ? (
              <>
                <Spinner className="size-3 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Project"
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
