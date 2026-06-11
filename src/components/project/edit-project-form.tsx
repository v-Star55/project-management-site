import React, { useState } from "react"
import { useParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { XIcon, CheckIcon } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { ProjectDetail } from "./utils"

interface EditProjectFormProps {
  projectData: ProjectDetail
  companyId: string | undefined
  userRole: string
  onClose: () => void
}

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
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    projectData.members.map(m => m.id)
  )

  // Fetch all Company Users (to select project members)
  const { data: companyUsersData } = useQuery({
    queryKey: ["teams", companyId],
    queryFn: async () => {
      if (!companyId) return { teams: [] }
      const response = await axios.get(`/api/teams/${companyId}`)
      return response.data
    },
    enabled: !!companyId && (userRole === "owner" || userRole === "admin"),
  })

  const companyUsers = companyUsersData?.teams || []

  // Mutation to update project
  const updateProjectMutation = useMutation({
    mutationFn: async (payload: {
      title: string
      description: string
      status: string
      startDate: string | null
      completedDate: string | null
      memberIds: string[]
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
      memberIds: selectedMemberIds,
    })
  }

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMemberIds(prev => 
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
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
              rows={4}
              className="w-full mt-1.5 px-4.5 py-2.5 bg-muted/30 border border-border/60 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-foreground resize-none transition-all"
            />
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Start Date</label>
              <input 
                type="date" 
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className="w-full mt-1.5 px-4 py-2.5 bg-muted/30 border border-border/60 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-foreground transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Completed Date</label>
              <input 
                type="date" 
                value={editCompletedDate}
                onChange={(e) => setEditCompletedDate(e.target.value)}
                className="w-full mt-1.5 px-4 py-2.5 bg-muted/30 border border-border/60 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-foreground transition-all"
              />
            </div>
          </div>
        </div>

        {/* Select Members Section */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Project Members</label>
          {(userRole === "owner" || userRole === "admin") ? (
            <div className="border border-border/60 rounded-xl overflow-hidden bg-muted/15 flex flex-col flex-1 max-h-[350px]">
              <div className="overflow-y-auto p-3 flex flex-col gap-2">
                {companyUsers.map((item: any) => {
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
            </div>
          ) : (
            <div className="p-4 bg-muted/20 border border-border/40 rounded-xl text-xs text-muted-foreground flex flex-col gap-2">
              <p>As a project member, you do not have permissions to modify the project team list.</p>
              <p className="font-semibold text-foreground">Current Team members:</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {projectData.members.map(m => (
                  <span key={m.id} className="bg-card border border-border px-2.5 py-1 rounded-lg text-[10px] font-bold text-foreground/80">
                    {m.name}
                  </span>
                ))}
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
