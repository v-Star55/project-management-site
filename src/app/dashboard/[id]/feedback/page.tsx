"use client"

import React, { useState } from "react"
import { useParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { toast } from "sonner"


import { FeedbackStats } from "@/components/feedback/feedback-stats"
import { FeedbackSubmitForm } from "@/components/feedback/feedback-submit-form"
import { FeedbackList } from "@/components/feedback/feedback-list"
import { FeedbackDetailModal } from "@/components/feedback/feedback-detail-modal"
import { FeedbackBreakdownCard } from "@/components/feedback/feedback-breakdown-card"
import { Feedback, FeedbackComment, Project } from "@/components/feedback/types"

export default function FeedbackDashboardPage() {
  const params = useParams()
  const user = useSelector((state: RootState) => state.user.user)
  const queryClient = useQueryClient()

  // State
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all")
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all")
  const [selectedProjectFilter, setSelectedProjectFilter] = useState("all")
  const [activeTab, setActiveTab] = useState<"active" | "resolved" | "appreciation">("active")
  const [ratingFilter, setRatingFilter] = useState<"all" | "high" | "low">("all")

  const handleTabChange = (tab: "active" | "resolved" | "appreciation") => {
    setActiveTab(tab)
    setSelectedStatusFilter("all")
    setRatingFilter("all")
  }
  
  // Selected feedback for details drawer
  const [activeFeedback, setActiveFeedback] = useState<Feedback | null>(null)
  const [newCommentText, setNewCommentText] = useState("")
  
  // Edit Feedback Form State
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState({
    subject: "",
    description: "",
    type: "",
    priority: "",
    projectId: "none",
    satisfactionLevel: "10",
  })

  const handleSelectFeedback = (item: Feedback) => {
    setActiveFeedback(item)
    setEditFormData({
      subject: item.subject,
      description: item.description,
      type: item.type,
      priority: item.priority,
      projectId: item.projectId || "none",
      satisfactionLevel: item.satisfactionLevel ? String(item.satisfactionLevel) : "10",
    })
    setIsEditing(false)
  }
  
  // Submit Feedback Form State
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    type: "",
    priority: "",
    projectId: "none",
    satisfactionLevel: "10",
  })

  // Queries
  const { data: feedbacksData, isLoading: isFeedbacksLoading } = useQuery<{ feedbacks: Feedback[] }>({
    queryKey: ["feedbacks"],
    queryFn: async () => {
      const res = await fetch("/api/feedback")
      if (!res.ok) throw new Error("Failed to fetch feedbacks")
      return res.json()
    },
  })

  const { data: projectsData } = useQuery<{ projects: Project[] }>({
    queryKey: ["projects-list", user?.id],
    queryFn: async () => {
      const res = await fetch("/api/projects")
      if (!res.ok) throw new Error("Failed to fetch projects")
      return res.json()
    },
    enabled: !!user?.id,
  })

  // Comments Query
  const { data: commentsData, isLoading: isCommentsLoading } = useQuery<{ comments: FeedbackComment[] }>({
    queryKey: ["comments", activeFeedback?.id],
    queryFn: async () => {
      const res = await fetch(`/api/feedback/${activeFeedback?.id}/comments`)
      if (!res.ok) throw new Error("Failed to fetch comments")
      return res.json()
    },
    enabled: !!activeFeedback?.id,
  })

  // Mutations
  const createFeedbackMutation = useMutation({
    mutationFn: async (newFeedback: typeof formData) => {
      const body = {
        ...newFeedback,
        projectId: newFeedback.projectId === "none" ? null : newFeedback.projectId,
        priority: newFeedback.type === "appreciation" && (newFeedback.priority === "none" || !newFeedback.priority) ? "low" : newFeedback.priority,
        satisfactionLevel: newFeedback.type === "appreciation" ? parseInt(newFeedback.satisfactionLevel, 10) : null,
      }
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to create feedback")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Feedback submitted successfully!")
      setFormData({
        subject: "",
        description: "",
        type: "",
        priority: "",
        projectId: "none",
        satisfactionLevel: "10",
      })
      queryClient.invalidateQueries({ queryKey: ["feedbacks"] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    },
  })

  const deleteFeedbackMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to delete feedback")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Feedback deleted successfully")
      setActiveFeedback(null)
      queryClient.invalidateQueries({ queryKey: ["feedbacks"] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to update status")
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast.success("Feedback status updated")
      // Update local state in details sheet
      if (activeFeedback && activeFeedback.id === data.feedback.id) {
        setActiveFeedback(data.feedback)
        setEditFormData({
          subject: data.feedback.subject,
          description: data.feedback.description,
          type: data.feedback.type,
          priority: data.feedback.priority,
          projectId: data.feedback.projectId || "none",
          satisfactionLevel: data.feedback.satisfactionLevel ? String(data.feedback.satisfactionLevel) : "10",
        })
      }
      queryClient.invalidateQueries({ queryKey: ["feedbacks"] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    },
  })

  const updateFeedbackMutation = useMutation({
    mutationFn: async ({
      id,
      subject,
      description,
      type,
      priority,
      projectId,
      satisfactionLevel,
    }: {
      id: string
      subject: string
      description: string
      type: string
      priority: string
      projectId: string | null
      satisfactionLevel?: number | null
    }) => {
      const res = await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, description, type, priority, projectId, satisfactionLevel }),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to update feedback")
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast.success("Feedback updated successfully")
      setActiveFeedback(data.feedback)
      setIsEditing(false)
      queryClient.invalidateQueries({ queryKey: ["feedbacks"] })
    },
    onError: (err: any) => {
      toast.error(err.message)
    },
  })

  const postCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch(`/api/feedback/${activeFeedback?.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error("Failed to post comment")
      return res.json()
    },
    onSuccess: () => {
      setNewCommentText("")
      queryClient.invalidateQueries({ queryKey: ["comments", activeFeedback?.id] })
      queryClient.invalidateQueries({ queryKey: ["feedbacks"] })
    },
    onError: () => {
      toast.error("Failed to post comment")
    },
  })

  // Handlers
  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const isAppreciation = formData.type === "appreciation";
    if (!formData.subject.trim() || !formData.description.trim() || !formData.type || (!isAppreciation && (!formData.priority || formData.priority === "none"))) {
      toast.error("Please fill in all fields")
      return
    }
    createFeedbackMutation.mutate(formData)
  }

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCommentText.trim()) return
    postCommentMutation.mutate(newCommentText)
  }

  const isAdminOrOwner = user?.role === "admin" || user?.role === "owner"
  const isAllowedRole = user?.role === "owner" || user?.role === "admin" || user?.role === "client"

  const feedbacks = feedbacksData?.feedbacks || []
  const projects = projectsData?.projects || []

  // Exclusively appreciations for owner/admin right panel
  const appreciationFeedbacks = feedbacks.filter((f) => {
    if (f.type !== "appreciation") return false
    const score = f.satisfactionLevel ?? 0
    if (ratingFilter === "high") return score >= 9
    if (ratingFilter === "low") return score > 0 && score < 7
    return true
  })

  // Filtered feedbacks
  const filteredFeedbacks = feedbacks.filter((f) => {
    // Active vs Resolved vs Appreciation tab filtering
    if (activeTab === "active") {
      if (f.type === "appreciation") return false
      if (f.status !== "pending" && f.status !== "in_progress") {
        return false
      }
    } else if (activeTab === "resolved") {
      if (f.type === "appreciation") return false
      if (f.status !== "resolved" && f.status !== "rejected") {
        return false
      }
    } else if (activeTab === "appreciation") {
      if (f.type !== "appreciation") return false
      // Filter by rating score
      const score = f.satisfactionLevel ?? 0
      if (ratingFilter === "high") {
        if (score < 9) return false
      } else if (ratingFilter === "low") {
        if (score === 0 || score >= 7) return false
      }
    }

    const matchesSearch =
      f.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedTypeFilter === "all" || f.type === selectedTypeFilter
    const matchesStatus = selectedStatusFilter === "all" || f.status === selectedStatusFilter
    const matchesProject = selectedProjectFilter === "all" || 
      (selectedProjectFilter === "none" && !f.projectId) || 
      f.projectId === selectedProjectFilter

    return matchesSearch && matchesType && matchesStatus && matchesProject
  })

  // Filter feedbacks for stats based on project filter
  const statsFeedbacks = selectedProjectFilter === "all"
    ? feedbacks
    : feedbacks.filter((f) => 
        selectedProjectFilter === "none" ? !f.projectId : f.projectId === selectedProjectFilter
      )

  // Stats calculation
  const totalSubmitted = statsFeedbacks.length
  const pendingCount = statsFeedbacks.filter((f) => f.status === "pending").length
  const inProgressCount = statsFeedbacks.filter((f) => f.status === "in_progress").length
  const resolvedCount = statsFeedbacks.filter((f) => f.status === "resolved").length

  const statsBugs = statsFeedbacks.filter((f) => f.type === "bug").length
  const statsFeatures = statsFeedbacks.filter((f) => f.type === "feature").length
  const statsImprovements = statsFeedbacks.filter((f) => f.type === "improvement").length
  const statsAppreciations = statsFeedbacks.filter((f) => f.type === "appreciation").length
  const statsOthers = statsFeedbacks.filter((f) => 
    f.type !== "bug" && f.type !== "feature" && f.type !== "improvement" && f.type !== "appreciation"
  ).length

  // Calculate Net Delight Index (Average Satisfaction Score)
  const ratedFeedbacks = statsFeedbacks.filter((f) => f.satisfactionLevel !== null && f.satisfactionLevel !== undefined)
  const averageSatisfaction = ratedFeedbacks.length > 0
    ? (ratedFeedbacks.reduce((sum, f) => sum + (f.satisfactionLevel ?? 0), 0) / ratedFeedbacks.length).toFixed(1)
    : "N/A"
  const ratedCount = ratedFeedbacks.length

  if (user && !isAllowedRole) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none py-24 font-sans">
        <div className="size-16 rounded-3xl bg-destructive/10 text-destructive flex items-center justify-center mb-4 border border-destructive/20 shadow-xs">
          <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-black text-foreground">Access Denied</h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-[280px] leading-relaxed">
          You do not have permission to view the feedback dashboard.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 md:p-8 w-full overflow-auto animate-in fade-in slide-in-from-bottom-4 duration-300 font-sans">
      
      {/* ── Greeting Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 md:p-8 shadow-xs border border-primary/5">
        <div className="flex flex-col gap-2 max-w-2xl">
          <div className="flex items-center gap-2 select-none">
            <span className="text-[10px] uppercase font-extrabold text-primary tracking-widest bg-primary/10 px-2.5 py-1 rounded-full">
              Workspace Portal
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mt-1">
            {isAdminOrOwner ? "Feedback & Requests Management" : "Client Feedback Dashboard"}
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isAdminOrOwner 
              ? "Triage incoming client suggestions, bugs, appreciation, and requests. Communicate directly through the comment timeline below."
              : "Review your submitted feedback loop, check updates, track implementation status, or submit a new ticket for the development team."
            }
          </p>
        </div>
      </div>

      {/* ── Stats Metric Cards row ── */}
      <FeedbackStats
        totalCount={totalSubmitted}
        pendingCount={pendingCount}
        inProgressCount={inProgressCount}
        resolvedCount={resolvedCount}
        averageSatisfaction={averageSatisfaction}
        ratedCount={ratedCount}
      />

      {/* ── Dashboard Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side Queue Column */}
        <div className="lg:col-span-2">
          <FeedbackList
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            selectedTypeFilter={selectedTypeFilter}
            onTypeFilterChange={setSelectedTypeFilter}
            selectedStatusFilter={selectedStatusFilter}
            onStatusFilterChange={setSelectedStatusFilter}
            selectedProjectFilter={selectedProjectFilter}
            onProjectFilterChange={setSelectedProjectFilter}
            projects={projects}
            filteredFeedbacks={filteredFeedbacks}
            onSelectFeedback={handleSelectFeedback}
            isAdminOrOwner={isAdminOrOwner}
            isLoading={isFeedbacksLoading}
            activeTab={activeTab}
            onActiveTabChange={handleTabChange}
            feedbacks={feedbacks}
            ratingFilter={ratingFilter}
            onRatingFilterChange={setRatingFilter}
          />
        </div>

        {/* Right Side Form/Appreciation Column */}
        <div className="lg:col-span-1">
          {isAdminOrOwner ? (
            <FeedbackBreakdownCard
              bugs={statsBugs}
              features={statsFeatures}
              improvements={statsImprovements}
              appreciations={statsAppreciations}
              others={statsOthers}
              total={statsFeedbacks.length}
            />
          ) : (
            <FeedbackSubmitForm
              isAdminOrOwner={isAdminOrOwner}
              formData={formData}
              onFormChange={handleFormChange}
              onSubmit={handleFormSubmit}
              projects={projects}
              isPending={createFeedbackMutation.isPending}
            />
          )}
        </div>

      </div>

      {/* ── Feedback Detail & Commenting Modal ── */}
      <FeedbackDetailModal
        activeFeedback={activeFeedback}
        onClose={() => setActiveFeedback(null)}
        user={user}
        isAdminOrOwner={isAdminOrOwner}
        deleteFeedbackMutation={deleteFeedbackMutation}
        updateStatusMutation={updateStatusMutation}
        updateFeedbackMutation={updateFeedbackMutation}
        postCommentMutation={postCommentMutation}
        commentsData={commentsData}
        isCommentsLoading={isCommentsLoading}
        newCommentText={newCommentText}
        onNewCommentTextChange={setNewCommentText}
        onCommentSubmit={handleCommentSubmit}
        isEditing={isEditing}
        onIsEditingChange={setIsEditing}
        editFormData={editFormData}
        onEditFormDataChange={setEditFormData}
        projects={projects}
      />

    </div>
  )
}
