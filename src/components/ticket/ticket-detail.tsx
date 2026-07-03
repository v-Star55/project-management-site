"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { Ticket } from "../dashboard/ticketsView"
import { AlertCircleIcon, RotateCcwIcon, MessageSquareIcon, Loader2Icon } from "lucide-react"
import TicketAttachments from "./ticket-attachments"
import TicketTimeLogs from "./ticket-time-logs"
import ReasonDialog from "./reason-dialog"
import TicketComments from "./ticket-comments"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import TicketDetailHeader from "./ticket-detail-header"
import TicketReasonHistory from "./ticket-reason-history"
import TicketDescriptionEditor from "./ticket-description-editor"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface TicketDetailProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: Ticket | null
  onStatusUpdate?: (status: string, reason?: string) => void
  onPriorityUpdate?: (priority: string) => void
}

export default function TicketDetail({
  open,
  onOpenChange,
  ticket,
  onStatusUpdate,
  onPriorityUpdate,
}: TicketDetailProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  
  const [pendingStatus, setPendingStatus] = useState<"blocked" | "reopen" | null>(null)
  const currentUser = useSelector((state: RootState) => state.user.user)

  // Editing state
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">("low")
  const [editAssignedUserId, setEditAssignedUserId] = useState<string>("unassigned")
  const [editGroupId, setEditGroupId] = useState<string>("none")
  const [editDueDate, setEditDueDate] = useState<string | undefined>(undefined)
  const [editEstimatedHours, setEditEstimatedHours] = useState("")

  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Sync edits when ticket changes
  useEffect(() => {
    if (ticket) {
      setEditTitle(ticket.title)
      setEditDescription(ticket.description || "")
      setEditPriority((ticket.priority?.toLowerCase() as any) || "low")
      setEditAssignedUserId(ticket.assignedUserId || "unassigned")
      setEditGroupId(ticket.groupId || "none")
      setEditDueDate(ticket.dueDate || undefined)
      setEditEstimatedHours(ticket.estimatedHours !== null && ticket.estimatedHours !== undefined ? ticket.estimatedHours.toString() : "")
      setIsEditing(false)
    }
  }, [ticket])

  // Fetch Project details for member list and admin checks
  const { data: projectDetails } = useQuery({
    queryKey: ["project-edit", ticket?.projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${ticket?.projectId}`)
      if (!res.ok) throw new Error("Failed to fetch project")
      const data = await res.json()
      return data.project
    },
    enabled: open && !!ticket?.projectId,
  })

  // Fetch groups details
  const { data: groupsData } = useQuery({
    queryKey: ["project-groups-edit", ticket?.projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${ticket?.projectId}/groups`)
      if (!res.ok) throw new Error("Failed to fetch groups")
      const data = await res.json()
      return data.groups
    },
    enabled: open && !!ticket?.projectId,
  })

  const projectMembers = useMemo(() => {
    const members: any[] = []
    if (projectDetails) {
      const getDesignation = (u: any) => {
        return (u.designation && u.designation.trim()) || (u.role ? (u.role.charAt(0).toUpperCase() + u.role.slice(1)) : "");
      }
      const seen = new Set<string>()
      const add = (list: any[]) => {
        for (const m of list) {
          if (m && m.id && !seen.has(m.id) && m.role !== "client") {
            seen.add(m.id)
            members.push({
              ...m,
              displayName: m.name,
              designationLabel: getDesignation(m),
            })
          }
        }
      }
      if (projectDetails.admins) add(projectDetails.admins)
      if (projectDetails.members) add(projectDetails.members)
    }
    return members
  }, [projectDetails])
  const projectGroups = groupsData || []

  // Check roles
  const isOwner = currentUser?.role === "owner"
  const isProjectAdmin = projectDetails?.admins?.some((a: any) => a.id === currentUser?.id)
  const isProjectAdminOrOwner = isOwner || (currentUser?.role === "admin" && !!isProjectAdmin)

  const isAssignee = ticket?.assignedUserId === currentUser?.id
  const canEdit = isProjectAdminOrOwner || ((currentUser?.role === "member" || currentUser?.role === "qa") && isAssignee)
  const canDelete = isProjectAdminOrOwner

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    if (open) document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open, onOpenChange])

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!ticket) return null

  const handleSave = async () => {
    if (!editTitle.trim()) {
      toast.error("Title is required")
      return
    }

    if (editGroupId && editGroupId !== "none" && editDueDate) {
      const selectedGroup = projectGroups.find((g: any) => g.id === editGroupId)
      if (selectedGroup) {
        const ticketDueDate = new Date(editDueDate)
        const groupStart = new Date(selectedGroup.startDate)
        if (ticketDueDate < groupStart) {
          const formattedStart = groupStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          toast.error(`Ticket due date cannot be before the sprint/group start date (${formattedStart})`)
          return
        }
        if (selectedGroup.endDate) {
          const groupEnd = new Date(selectedGroup.endDate)
          if (ticketDueDate > groupEnd) {
            const formattedEnd = groupEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
            toast.error(`Ticket due date cannot be after the sprint/group end date (${formattedEnd})`)
            return
          }
        }
      }
    }

    setIsSaving(true)
    try {
      const payload: any = {
        id: ticket.id,
        title: editTitle.trim(),
        description: editDescription.trim(),
        priority: editPriority,
        assignedUserId: editAssignedUserId === "unassigned" ? "unassigned" : editAssignedUserId,
        groupId: editGroupId === "none" ? "none" : editGroupId,
        dueDate: editDueDate || null,
        estimatedHours: editEstimatedHours !== "" ? parseFloat(editEstimatedHours) : null,
      }

      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update ticket")
      }

      toast.success("Ticket updated successfully!")
      setIsEditing(false)
      
      // Invalidate queries to refresh Kanban and all states
      queryClient.invalidateQueries({ queryKey: ["project", ticket.projectId] })
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
      queryClient.invalidateQueries({ queryKey: ["schedule"] })
      
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to save changes")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/tickets?id=${ticket.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete ticket")
      }

      toast.success("Ticket deleted successfully!")
      setIsDeleteDialogOpen(false)
      onOpenChange(false)

      queryClient.invalidateQueries({ queryKey: ["project", ticket.projectId] })
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
      queryClient.invalidateQueries({ queryKey: ["schedule"] })
    } catch (err: any) {
      toast.error(err.message || "Failed to delete ticket")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAssigneeUpdate = async (userId: string) => {
    try {
      const payload: any = {
        id: ticket.id,
        assignedUserId: userId === "unassigned" ? "unassigned" : userId,
      }
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update assignee")
      }
      toast.success("Assignee updated successfully")
      queryClient.invalidateQueries({ queryKey: ["project", ticket.projectId] })
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
      queryClient.invalidateQueries({ queryKey: ["schedule"] })
    } catch (err: any) {
      toast.error(err.message || "Failed to update assignee")
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={() => onOpenChange(false)}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Modal Panel */}
      <div
        role="dialog"
        aria-modal="true"
        ref={overlayRef}
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 transition-all duration-300 pointer-events-none ${
          open ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <div
          className={`relative w-full max-w-[95vw] xl:max-w-[1400px] 2xl:max-w-[1600px] max-h-[92vh] flex flex-col bg-card rounded-3xl shadow-2xl border border-border/60 overflow-hidden ${
            open ? "pointer-events-auto" : "pointer-events-none"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Component */}
          <TicketDetailHeader
            ticket={ticket}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            editTitle={editTitle}
            setEditTitle={setEditTitle}
            isProjectAdminOrOwner={isProjectAdminOrOwner}
            canEdit={canEdit}
            canDelete={canDelete}
            onStatusUpdate={onStatusUpdate}
            onPriorityUpdate={onPriorityUpdate}
            handleAssigneeUpdate={handleAssigneeUpdate}
            projectMembers={projectMembers}
            setIsDeleteDialogOpen={setIsDeleteDialogOpen}
            onOpenChange={onOpenChange}
            setPendingStatus={setPendingStatus}
          />

          {/* ── Scrollable Body ────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-7 sm:p-8">
            <main className="flex flex-col gap-6">

              {/* 3-Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 animate-in fade-in duration-200">
                
                {/* Column 1 (Left): Reason History */}
                <div className="lg:col-span-3">
                  <TicketReasonHistory ticket={ticket} />
                </div>

                {/* Column 2 (Mid): Description Editor, Attachments, Comments */}
                <div className="lg:col-span-5 xl:col-span-6 flex flex-col gap-6">
                  
                  {/* Reason Banners */}
                  {ticket.status === "blocked" && (ticket.reasonBlocked || (ticket.reasons && ticket.reasons.some(r => r.type === "BLOCKED"))) && (
                    <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-start gap-3 text-red-700 dark:text-red-400 animate-in fade-in duration-200">
                      <AlertCircleIcon className="size-5 shrink-0 mt-0.5" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Blocked Reason</span>
                        <p className="text-sm mt-0.5">
                          {ticket.reasons?.find(r => r.type === "BLOCKED")?.reason || ticket.reasonBlocked}
                        </p>
                      </div>
                    </div>
                  )}

                  {ticket.status === "reopen" && (ticket.reasonReopen || (ticket.reasons && ticket.reasons.some(r => r.type === "REOPENED"))) && (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-start gap-3 text-amber-700 dark:text-amber-400 animate-in fade-in duration-200">
                      <RotateCcwIcon className="size-5 shrink-0 mt-0.5" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Reopen Reason</span>
                        <p className="text-sm mt-0.5">
                          {ticket.reasons?.find(r => r.type === "REOPENED")?.reason || ticket.reasonReopen}
                        </p>
                      </div>
                    </div>
                  )}

                  <TicketDescriptionEditor
                    ticket={ticket}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    editDescription={editDescription}
                    setEditDescription={setEditDescription}
                    editGroupId={editGroupId}
                    setEditGroupId={setEditGroupId}
                    editDueDate={editDueDate}
                    setEditDueDate={setEditDueDate}
                    editEstimatedHours={editEstimatedHours}
                    setEditEstimatedHours={setEditEstimatedHours}
                    projectGroups={projectGroups}
                    isSaving={isSaving}
                    handleSave={handleSave}
                  />

                  {/* Divider */}
                  <div className="w-full h-px bg-border/30" />

                  {/* Attachments Section */}
                  <TicketAttachments ticket={ticket} />

                  {/* Divider */}
                  <div className="w-full h-px bg-border/30" />

                  {/* Comments Section */}
                  <section className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <MessageSquareIcon className="size-3.5 text-purple-500" />
                      </div>
                      <h3 className="text-xs font-bold uppercase text-foreground tracking-widest">Comments</h3>
                    </div>
                    {currentUser && (
                      <TicketComments ticketId={ticket.id} currentUser={currentUser} />
                    )}
                  </section>
                </div>

                {/* Column 3 (Right): Time Logs */}
                <div className="lg:col-span-4 xl:col-span-3">
                  <TicketTimeLogs
                    ticket={ticket}
                    canLogHours={canEdit}
                    isProjectAdminOrOwner={isProjectAdminOrOwner}
                  />
                </div>

              </div>
            </main>
          </div>
        </div>
      </div>

      {pendingStatus && (
        <ReasonDialog
          open={!!pendingStatus}
          actionType={pendingStatus}
          onClose={() => setPendingStatus(null)}
          onSubmit={(reason) => {
            onStatusUpdate?.(pendingStatus, reason)
            setPendingStatus(null)
          }}
        />
      )}

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this ticket? This action is permanent and will soft-delete the ticket from active tracking.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDelete}
              className="flex items-center gap-1.5"
            >
              {isDeleting && <Loader2Icon className="size-3.5 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
