import React, { useState } from "react"
import { useParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { XIcon, CheckIcon, ShieldAlertIcon, UsersIcon } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { ProjectDetail } from "./utils"

interface EditProjectFormProps {
  projectData: ProjectDetail
  companyId: string | undefined
  userRole: string
  onClose: () => void
}

const phaseOptions = [
  { value: "idea", label: "Idea" },
  { value: "discovery", label: "Discovery" },
  { value: "requirement_gathering", label: "Requirement Gathering" },
  { value: "prototype", label: "Prototype" },
  { value: "planning", label: "Planning" },
  { value: "design", label: "Design" },
  { value: "development", label: "Development" },
  { value: "testing", label: "Testing" },
  { value: "review", label: "Review" },
  { value: "deployment", label: "Deployment" },
  { value: "maintenance", label: "Maintenance" },
  { value: "completed", label: "Completed" },
]

const categoryOptions = [
  { value: "software", label: "Software Development" },
  { value: "marketing", label: "Marketing Campaign" },
  { value: "design", label: "UI/UX Design" },
  { value: "interior", label: "Interior Design" },
  { value: "other", label: "Other" },
]

export default function EditProjectForm({ 
  projectData, 
  companyId, 
  userRole, 
  onClose 
}: EditProjectFormProps) {
  const params = useParams()
  const queryClient = useQueryClient()
  
  const { id: userId, projectId } = params

  // Edit Form Fields State
  const [editTitle, setEditTitle] = useState(projectData.title)
  const [editDescription, setEditDescription] = useState(projectData.description || "")
  const [editStatus, setEditStatus] = useState(projectData.status)
  
  const [editStartDate, setEditStartDate] = useState(
    projectData.startDate ? new Date(projectData.startDate).toISOString().split("T")[0] : ""
  )
  const [editCompletedDate, setEditCompletedDate] = useState(
    projectData.completedDate ? new Date(projectData.completedDate).toISOString().split("T")[0] : ""
  )
  const [editTargetDate, setEditTargetDate] = useState(
    projectData.targetDate ? new Date(projectData.targetDate).toISOString().split("T")[0] : ""
  )
  const [editPhase, setEditPhase] = useState(projectData.phase || "idea")
  const [editCategory, setEditCategory] = useState(projectData.category || "software")

  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    projectData.members ? projectData.members.map(m => m.id) : []
  )
  const [selectedAdminIds, setSelectedAdminIds] = useState<string[]>(
    projectData.admins ? projectData.admins.map(a => a.id) : []
  )

  const isProjectAdmin = projectData.admins?.some(a => a.id === userId)
  const canManageTeam = userRole === "owner" || userRole === "admin" || isProjectAdmin

  // Fetch all Company Users (to select project members/admins)
  const { data: companyUsersData } = useQuery({
    queryKey: ["teams", companyId],
    queryFn: async () => {
      if (!companyId) return { teams: [] }
      const response = await axios.get(`/api/teams/${companyId}`)
      return response.data
    },
    enabled: !!companyId && canManageTeam,
  })

  const companyUsers = companyUsersData?.teams || []

  // Filter company users by role
  // Project Admins: show only company Admin/Owner users
  const adminUsers = companyUsers.filter((u: any) => u.role === "Admin" || u.role === "Owner")
  // Project Members: show only company Member users
  const memberUsers = companyUsers.filter((u: any) => u.role === "Member")

  // Mutation to update project
  const updateProjectMutation = useMutation({
    mutationFn: async (payload: {
      title: string
      description: string
      status: string
      startDate: string | null
      completedDate: string | null
      targetDate: string | null
      phase: string
      category: string
      memberIds: string[]
      adminIds: string[]
    }) => {
      const response = await axios.patch(`/api/projects/${projectId}`, payload)
      return response.data.project
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["project", projectId], data)
      queryClient.invalidateQueries({ queryKey: ["projects", userId] })
      toast.success("Project updated successfully!")
      onClose()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update project")
    }
  })

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTitle.trim()) {
      toast.error("Project Title is required")
      return
    }
    updateProjectMutation.mutate({
      title: editTitle,
      description: editDescription,
      status: editStatus,
      startDate: editStartDate || null,
      completedDate: editCompletedDate || null,
      targetDate: editTargetDate || null,
      phase: editPhase,
      category: editCategory,
      memberIds: selectedMemberIds,
      adminIds: selectedAdminIds,
    })
  }

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMemberIds(prev => 
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    )
  }

  const toggleAdminSelection = (adminId: string) => {
    setSelectedAdminIds(prev => 
      prev.includes(adminId) ? prev.filter(id => id !== adminId) : [...prev, adminId]
    )
  }

  return (
    <form onSubmit={handleSaveProject} className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-sm animate-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <h2 className="text-xl font-bold text-foreground">Edit Project Details</h2>
        <button 
          type="button" 
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <XIcon className="size-5" />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Project Title</label>
            <input 
              type="text" 
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Enter project title"
              className="w-full mt-1.5 px-4.5 py-2.5 bg-muted/30 border border-border/60 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-foreground transition-all"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</label>
            <textarea 
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Enter project description"
              rows={3}
              className="w-full mt-1.5 px-4.5 py-2.5 bg-muted/30 border border-border/60 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-foreground resize-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Project Status</label>
              <select 
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full mt-1.5 px-4 py-2.5 bg-muted/30 border border-border/60 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-foreground transition-all"
              >
                <option value="pending" className="bg-card text-foreground">Pending</option>
                <option value="in_progress" className="bg-card text-foreground">In Progress</option>
                <option value="completed" className="bg-card text-foreground">Completed</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</label>
              <select 
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full mt-1.5 px-4 py-2.5 bg-muted/30 border border-border/60 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-foreground transition-all"
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-card text-foreground">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Project Phase</label>
            <select 
              value={editPhase}
              onChange={(e) => setEditPhase(e.target.value)}
              className="w-full mt-1.5 px-4 py-2.5 bg-muted/30 border border-border/60 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-foreground transition-all"
            >
              {phaseOptions.map(option => (
                <option key={option.value} value={option.value} className="bg-card text-foreground">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Start Date</label>
              <input 
                type="date" 
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className="w-full mt-1.5 px-2 py-2.5 bg-muted/30 border border-border/60 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-foreground text-xs transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Target Date</label>
              <input 
                type="date" 
                value={editTargetDate}
                onChange={(e) => setEditTargetDate(e.target.value)}
                className="w-full mt-1.5 px-2 py-2.5 bg-muted/30 border border-border/60 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-foreground text-xs transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Completed Date</label>
              <input 
                type="date" 
                value={editCompletedDate}
                onChange={(e) => setEditCompletedDate(e.target.value)}
                className="w-full mt-1.5 px-2 py-2.5 bg-muted/30 border border-border/60 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-foreground text-xs transition-all"
              />
            </div>
          </div>
        </div>

        {/* Select Team Section */}
        <div className="flex flex-col gap-5">
          {canManageTeam ? (
            <>
              {/* Project Admins Panel */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlertIcon className="size-3.5 text-primary" />
                  Project Admins (Owners / Admins Only)
                </label>
                <div className="border border-border/60 rounded-xl overflow-hidden bg-muted/15 flex flex-col max-h-[175px]">
                  <div className="overflow-y-auto p-3 flex flex-col gap-2">
                    {adminUsers.map((item: any) => {
                      const isSelected = selectedAdminIds.includes(item.id)
                      return (
                        <div 
                          key={item.id}
                          onClick={() => toggleAdminSelection(item.id)}
                          className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                            isSelected 
                              ? "bg-primary/5 border-primary/45 shadow-2xs" 
                              : "bg-card/40 border-border/40 hover:bg-muted/30 hover:border-border/80"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="size-7 rounded-full bg-primary/5 dark:bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                              {item.initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-foreground">{item.name}</span>
                              <span className="text-[9px] text-muted-foreground">{item.role}</span>
                            </div>
                          </div>
                          <div className={`size-4 rounded-md border flex items-center justify-center transition-colors ${
                            isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border/80 bg-transparent"
                          }`}>
                            {isSelected && <CheckIcon className="size-2.5 stroke-[3]" />}
                          </div>
                        </div>
                      )
                    })}
                    {adminUsers.length === 0 && (
                      <div className="text-center py-4 text-xs text-muted-foreground">
                        No company admins available.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Project Members Panel */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <UsersIcon className="size-3.5 text-muted-foreground" />
                  Project Members (Members Only)
                </label>
                <div className="border border-border/60 rounded-xl overflow-hidden bg-muted/15 flex flex-col max-h-[175px]">
                  <div className="overflow-y-auto p-3 flex flex-col gap-2">
                    {memberUsers.map((item: any) => {
                      const isSelected = selectedMemberIds.includes(item.id)
                      return (
                        <div 
                          key={item.id}
                          onClick={() => toggleMemberSelection(item.id)}
                          className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                            isSelected 
                              ? "bg-primary/5 border-primary/45 shadow-2xs" 
                              : "bg-card/40 border-border/40 hover:bg-muted/30 hover:border-border/80"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="size-7 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-[10px] font-bold text-stone-700 dark:text-stone-300">
                              {item.initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-foreground">{item.name}</span>
                              <span className="text-[9px] text-muted-foreground">{item.role}</span>
                            </div>
                          </div>
                          <div className={`size-4 rounded-md border flex items-center justify-center transition-colors ${
                            isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border/80 bg-transparent"
                          }`}>
                            {isSelected && <CheckIcon className="size-2.5 stroke-[3]" />}
                          </div>
                        </div>
                      )
                    })}
                    {memberUsers.length === 0 && (
                      <div className="text-center py-4 text-xs text-muted-foreground">
                        No company members available.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-4 bg-muted/20 border border-border/40 rounded-xl text-xs text-muted-foreground flex flex-col gap-3">
              <p>As a team collaborator, you do not have permissions to modify the project team list.</p>
              <div className="flex flex-col gap-1.5">
                <p className="font-semibold text-foreground flex items-center gap-1">
                  <ShieldAlertIcon className="size-3 text-primary" />
                  Current Admins:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {projectData.admins && projectData.admins.map(m => (
                    <span key={m.id} className="bg-primary/5 border border-primary/20 px-2 py-0.5 rounded-lg text-[9px] font-bold text-primary">
                      {m.name}
                    </span>
                  ))}
                  {(!projectData.admins || projectData.admins.length === 0) && (
                    <span className="text-[10px] italic">None</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 mt-1">
                <p className="font-semibold text-foreground flex items-center gap-1">
                  <UsersIcon className="size-3 text-muted-foreground" />
                  Current Members:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {projectData.members.map(m => (
                    <span key={m.id} className="bg-card border border-border px-2.5 py-0.5 rounded-lg text-[9px] font-bold text-foreground/80">
                      {m.name}
                    </span>
                  ))}
                  {projectData.members.length === 0 && (
                    <span className="text-[10px] italic">None</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border/40 pt-4 mt-2">
        <button 
          type="button" 
          onClick={onClose}
          className="px-4 py-2 border border-border bg-transparent hover:bg-muted text-foreground font-medium rounded-xl text-xs transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button 
          type="submit"
          disabled={updateProjectMutation.isPending}
          className="px-5 py-2 bg-primary text-primary-foreground hover:bg-primary/95 font-medium rounded-xl text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {updateProjectMutation.isPending ? (
            <>
              <Spinner className="size-3 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </form>
  )
}
