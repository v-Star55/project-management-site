"use client"

import React, { useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { Spinner } from "@/components/ui/spinner"
import { 
  FolderIcon, 
  CheckSquareIcon, 
  EditIcon, 
  ArrowLeftIcon, 
  MessageSquareIcon,
  UsersIcon,
  LayersIcon
} from "lucide-react"

import { 
  ProjectDetail, 
  getProjectStatusBadge, 
  getProjectStatusLabel 
} from "@/components/project/utils"
import ProjectStats from "@/components/project/project-stats"
import ProjectTickets from "@/components/project/project-tickets"
import ProjectTeam from "@/components/project/project-team"
import ProjectDiscussions from "@/components/project/project-discussions"
import EditProjectForm from "@/components/project/edit-project-form"
import ProjectGroups from "@/components/project/project-groups"

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const { id: userId, projectId } = params
  const { user } = useSelector((state: RootState) => state.user)
  const companyId = user?.company?.id
  const userRole = user?.role || ""

  const [isEditing, setIsEditing] = useState(false)
  const tabParam = searchParams?.get("tab") as "overview" | "groups" | "board" | "team" | "messages" | null
  const activeTab = tabParam || "overview"

  // Fetch Project Details
  const { data: projectData, isLoading: isProjectLoading, isError: isProjectError } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const response = await axios.get(`/api/projects/${projectId}`)
      return response.data.project as ProjectDetail
    },
    enabled: !!projectId,
  })

  // Authorization Check: Only owners, admins, and project-level admins can edit.
  const isProjectAdmin = projectData?.admins?.some((a) => a.id === user?.id)
  const canEdit = userRole === "owner" || userRole === "admin" || !!isProjectAdmin

  if (isProjectLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="size-8 text-primary animate-spin" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Loading project details...
          </p>
        </div>
      </div>
    )
  }

  if (isProjectError || !projectData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] text-center p-6">
        <FolderIcon className="size-10 text-destructive mb-3 animate-bounce" />
        <p className="font-semibold text-foreground">Project not found</p>
        <p className="text-sm text-muted-foreground mt-1">
          This project might not exist or you don't have permission to view it.
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

  const clients = projectData.members.filter((m) => m.role === "client")

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 md:p-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {isEditing ? (
        /* Edit Project Mode */
        <EditProjectForm 
          projectData={projectData}
          companyId={companyId}
          userRole={userRole}
          onClose={() => setIsEditing(false)}
        />
      ) : (
        /* View Project Mode */
        <>
          {activeTab === "overview" && (
            /* Header and Back navigation - only visible in Overview */
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                    <FolderIcon className="size-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                        {projectData.title}
                      </h1>
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-md border ${getProjectStatusBadge(projectData.status)}`}>
                        {getProjectStatusLabel(projectData.status)}
                      </span>
                    </div>
                    {clients.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground/70">Client:</span>
                        <span className="font-semibold text-foreground bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                          {clients.map((c) => c.name).join(", ")}
                        </span>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                      {projectData.description || "No description provided for this project."}
                    </p>
                  </div>
                </div>

                {canEdit && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-border bg-card hover:bg-accent/40 text-foreground font-medium rounded-xl shadow-2xs hover:shadow transition-all cursor-pointer"
                  >
                    <EditIcon className="size-4" />
                    Edit Project
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === "overview" ? (
            /* Overview tab */
            <div className="animate-in fade-in duration-200">
              <ProjectStats projectData={projectData} />
            </div>
          ) : activeTab === "groups" ? (
            /* Groups tab */
            <div className="animate-in fade-in duration-200">
              <ProjectGroups projectId={projectId as string} userRole={userRole} />
            </div>
          ) : activeTab === "board" ? (
            /* Board/Tickets tab */
            <div className="animate-in fade-in duration-200">
              <ProjectTickets projectData={projectData} userId={userId as string} />
            </div>
          ) : activeTab === "team" ? (
            /* Project Team tab */
            <div className="animate-in fade-in duration-200">
              <ProjectTeam projectData={projectData} userId={userId as string} />
            </div>
          ) : (
            /* Discussions tab */
            <ProjectDiscussions projectId={projectId as string} currentUserId={user?.id || ""} />
          )}
        </>
      )}
    </div>
  )
}
