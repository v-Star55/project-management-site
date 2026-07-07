import React from "react"
import {
  TrashIcon,
  MoreVerticalIcon,
  PencilIcon,
  XIcon,
  User2Icon,
  CalendarIcon,
  FolderIcon,
  FileTextIcon,
  ActivityIcon,
  ClockIcon,
  CheckIcon,
  MessageSquareIcon,
  Loader2Icon,
  SendIcon,
} from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatDistanceToNow } from "date-fns"
import {
  PROBLEM_TYPES,
  PRIORITY_LEVELS,
  Feedback,
  Project,
  getTypeBadge,
  getPriorityBadge,
  getStatusBadge,
} from "./types"

interface FeedbackDetailSheetProps {
  activeFeedback: Feedback | null
  onClose: () => void
  user: any
  isAdminOrOwner: boolean
  deleteFeedbackMutation: any
  updateStatusMutation: any
  updateFeedbackMutation: any
  postCommentMutation: any
  commentsData: any
  isCommentsLoading: boolean
  newCommentText: string
  onNewCommentTextChange: (val: string) => void
  onCommentSubmit: (e: React.FormEvent) => void
  isEditing: boolean
  onIsEditingChange: (val: boolean) => void
  editFormData: {
    subject: string
    description: string
    type: string
    priority: string
    projectId: string
    satisfactionLevel: string
  }
  onEditFormDataChange: (val: any) => void
  projects: Project[]
}

export function FeedbackDetailSheet({
  activeFeedback,
  onClose,
  user,
  isAdminOrOwner,
  deleteFeedbackMutation,
  updateStatusMutation,
  updateFeedbackMutation,
  postCommentMutation,
  commentsData,
  isCommentsLoading,
  newCommentText,
  onNewCommentTextChange,
  onCommentSubmit,
  isEditing,
  onIsEditingChange,
  editFormData,
  onEditFormDataChange,
  projects,
}: FeedbackDetailSheetProps) {
  return (
    <Sheet open={!!activeFeedback} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" showCloseButton={false} className="w-full sm:max-w-xl flex flex-col h-full overflow-hidden p-0 border-l border-border/60 bg-background">
        {activeFeedback && (
          <div className="flex flex-col h-full">
            {/* Drawer Header */}
            <SheetHeader className="p-6 border-b border-border/40 bg-muted/10 shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 select-none">
                  {getTypeBadge(activeFeedback.type)}
                  {activeFeedback.type !== "appreciation" && getPriorityBadge(activeFeedback.priority)}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(activeFeedback.status)}
                  
                  {/* Action 3-dot Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:bg-muted/80 h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground"
                        title="Actions"
                      >
                        <MoreVerticalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-2xl">
                      {/* Edit: Only creator if pending, or admin/owner */}
                      {((activeFeedback.user.id === user?.id && activeFeedback.status === "pending") || isAdminOrOwner) && (
                        <DropdownMenuItem
                          onClick={() => onIsEditingChange(true)}
                          className="cursor-pointer gap-2"
                        >
                          <PencilIcon className="size-3.5" />
                          <span>Edit Feedback</span>
                        </DropdownMenuItem>
                      )}
                      
                      {/* Delete: Only creator if pending, or admin/owner */}
                      {((activeFeedback.user.id === user?.id && activeFeedback.status === "pending") || isAdminOrOwner) && (
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this feedback?")) {
                              deleteFeedbackMutation.mutate(activeFeedback.id)
                            }
                          }}
                          disabled={deleteFeedbackMutation.isPending}
                          className="cursor-pointer gap-2"
                        >
                          <TrashIcon className="size-3.5" />
                          <span>Delete Feedback</span>
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator />
                      
                      {/* Close Option */}
                      <DropdownMenuItem
                        onClick={onClose}
                        className="cursor-pointer gap-2"
                      >
                        <XIcon className="size-3.5" />
                        <span>Close Detail</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {/* Subject - Hide/Render inline if not editing */}
              {!isEditing && (
                <>
                  <SheetTitle className="text-lg font-extrabold text-foreground mt-3 leading-snug tracking-tight">
                    {activeFeedback.subject}
                  </SheetTitle>
                  
                  {/* Premium Metadata Badges */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5 bg-muted/30 border border-border/50 py-1 px-2.5 rounded-full select-none">
                      <User2Icon className="size-3 text-muted-foreground" />
                      <span className="font-semibold text-foreground">{activeFeedback.user.name}</span>
                      <span className="text-[8px] uppercase font-black text-muted-foreground bg-muted/70 px-1 py-0.5 rounded leading-none text-foreground/70">
                        {activeFeedback.user.role}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-muted/30 border border-border/50 py-1 px-2.5 rounded-full select-none">
                      <CalendarIcon className="size-3 text-muted-foreground" />
                      <span>{new Date(activeFeedback.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>

                    {activeFeedback.project && (
                      <div className="flex items-center gap-1.5 bg-primary/5 border border-primary/10 py-1 px-2.5 rounded-full select-none">
                        <FolderIcon className="size-3 text-primary" />
                        <span className="text-primary font-bold">{activeFeedback.project.title}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </SheetHeader>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {isEditing ? (
                /* ── EDIT MODE FORM ── */
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 select-none">
                    <PencilIcon className="size-3.5 text-primary" />
                    <span>Edit Feedback Details</span>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-subject" className="text-xs font-semibold text-foreground">Subject</Label>
                    <Input
                      id="edit-subject"
                      placeholder="Enter subject..."
                      value={editFormData.subject}
                      onChange={(e) => onEditFormDataChange({ ...editFormData, subject: e.target.value })}
                      className="text-xs bg-muted/15 border border-border/80 rounded-xl focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-description" className="text-xs font-semibold text-foreground">Description</Label>
                    <Textarea
                      id="edit-description"
                      placeholder="Enter description..."
                      value={editFormData.description}
                      onChange={(e) => onEditFormDataChange({ ...editFormData, description: e.target.value })}
                      className="text-xs min-h-[120px] bg-muted/15 border border-border/80 rounded-xl leading-relaxed resize-y focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Category</Label>
                      <Select
                        value={editFormData.type}
                        onValueChange={(val) => onEditFormDataChange({ ...editFormData, type: val })}
                      >
                        <SelectTrigger className="text-xs h-9 bg-muted/15 border-border/80 rounded-xl focus:ring-1 focus:ring-primary">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {PROBLEM_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value} className="text-xs rounded-lg cursor-pointer">
                              <div className="flex items-center gap-2">
                                {t.icon}
                                <span>{t.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">Priority {editFormData.type === "appreciation" && "(Optional)"}</Label>
                      <Select
                        value={editFormData.priority}
                        onValueChange={(val) => onEditFormDataChange({ ...editFormData, priority: val })}
                      >
                        <SelectTrigger className="text-xs h-9 bg-muted/15 border-border/80 rounded-xl focus:ring-1 focus:ring-primary">
                          <SelectValue placeholder={editFormData.type === "appreciation" ? "None / Not Applicable" : "Select priority"} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {editFormData.type === "appreciation" && (
                            <SelectItem value="none" className="text-xs rounded-lg cursor-pointer">None / Not Applicable</SelectItem>
                          )}
                          {PRIORITY_LEVELS.map((p) => (
                            <SelectItem key={p.value} value={p.value} className="text-xs rounded-lg cursor-pointer">
                              <div className="flex items-center gap-2">
                                <span className={`size-2 rounded-full ${p.color}`} />
                                <span>{p.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Satisfaction level selector inside edit mode */}
                  {editFormData.type === "appreciation" && (
                    <div className="space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                      <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                        <span>Client Satisfaction Level</span>
                        <span className="text-pink-500 font-extrabold text-[12px] bg-pink-500/10 px-2.5 py-0.5 rounded-full select-none">
                          {editFormData.satisfactionLevel || "10"} / 10
                        </span>
                      </Label>
                      <div className="grid grid-cols-10 gap-1 bg-muted/20 p-1.5 border border-border/50 rounded-2xl select-none">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                          const rating = String(num)
                          const isSelected = editFormData.satisfactionLevel === rating
                          
                          let colorClass = "hover:bg-muted-foreground/15 text-muted-foreground hover:scale-105"
                          if (isSelected) {
                            if (num <= 3) colorClass = "bg-red-500 text-white font-black shadow-md hover:bg-red-600 scale-105"
                            else if (num <= 6) colorClass = "bg-amber-500 text-white font-black shadow-md hover:bg-amber-600 scale-105"
                            else if (num <= 8) colorClass = "bg-emerald-500 text-white font-black shadow-md hover:bg-emerald-600 scale-105"
                            else colorClass = "bg-pink-500 text-white font-black shadow-md hover:bg-pink-600 scale-105"
                          }

                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => onEditFormDataChange({ ...editFormData, satisfactionLevel: rating })}
                              className={`h-7 w-full flex items-center justify-center text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${colorClass}`}
                            >
                              {num}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">Project Relation (Optional)</Label>
                    <Select
                      value={editFormData.projectId}
                      onValueChange={(val) => onEditFormDataChange({ ...editFormData, projectId: val })}
                    >
                      <SelectTrigger className="text-xs h-9 bg-muted/15 border-border/80 rounded-xl focus:ring-1 focus:ring-primary">
                        <SelectValue placeholder="Select Project" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="none" className="text-xs rounded-lg cursor-pointer">No Project relation</SelectItem>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id} className="text-xs rounded-lg cursor-pointer">{p.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 pt-4">
                    <Button
                      size="sm"
                      onClick={() => {
                        const isApprec = editFormData.type === "appreciation";
                        if (!editFormData.subject.trim() || !editFormData.description.trim() || !editFormData.type || (!isApprec && (!editFormData.priority || editFormData.priority === "none"))) {
                          return
                        }
                        updateFeedbackMutation.mutate({
                          id: activeFeedback.id,
                          subject: editFormData.subject,
                          description: editFormData.description,
                          type: editFormData.type,
                          priority: isApprec && (editFormData.priority === "none" || !editFormData.priority) ? "low" : editFormData.priority,
                          projectId: editFormData.projectId === "none" ? null : editFormData.projectId,
                          satisfactionLevel: isApprec ? parseInt(editFormData.satisfactionLevel, 10) : null,
                        })
                      }}
                      disabled={updateFeedbackMutation.isPending}
                      className="rounded-xl font-bold cursor-pointer h-9 text-xs px-4"
                    >
                      {updateFeedbackMutation.isPending && <Loader2Icon className="size-3 mr-1.5 animate-spin" />}
                      Save Changes
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onIsEditingChange(false)}
                      className="rounded-xl font-semibold cursor-pointer h-9 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                /* ── READ MODE DETAIL ── */
                <>
                  {/* Satisfaction Level Display */}
                  {(activeFeedback.type === "appreciation" || activeFeedback.status === "resolved") && activeFeedback.satisfactionLevel && (
                    <div className="space-y-2.5 animate-in fade-in duration-200">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        <svg className="size-3.5 text-pink-500 fill-pink-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        <span>Client Satisfaction Rating</span>
                      </div>
                      <div className="relative overflow-hidden rounded-2xl border border-pink-500/20 bg-pink-500/5 p-4 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-extrabold text-pink-500 tracking-wider">Client Delight Index</p>
                          <h3 className="text-[13px] font-black text-foreground">
                            Satisfaction is rated at <span className="text-pink-500 font-extrabold">{activeFeedback.satisfactionLevel}/10</span>
                          </h3>
                        </div>
                        {/* Rating dots display */}
                        <div className="flex items-center gap-1.5 select-none">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                            const score = activeFeedback.satisfactionLevel ?? 0
                            const active = score > 0 && num <= score
                            return (
                              <span
                                key={num}
                                className={`size-3 rounded-full transition-all duration-300 ${
                                  active 
                                    ? score <= 3 
                                      ? "bg-red-500 shadow-xs shadow-red-500/50 scale-110" 
                                      : score <= 6 
                                        ? "bg-amber-500 shadow-xs shadow-amber-500/50 scale-110" 
                                        : score <= 8 
                                          ? "bg-emerald-500 shadow-xs shadow-emerald-500/50 scale-110" 
                                          : "bg-pink-500 shadow-xs shadow-pink-500/50 scale-115"
                                    : "bg-muted/40 border border-border/60"
                                }`}
                              />
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Description Box */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      <FileTextIcon className="size-3.5 text-muted-foreground" />
                      <span>Description</span>
                    </div>
                    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-muted/15 p-5 shadow-xs">
                      <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-medium">
                        {activeFeedback.description}
                      </p>
                    </div>
                  </div>

                  {/* Admin Status Transitions */}
                  {isAdminOrOwner && (
                    <div className="space-y-3 p-5 rounded-2xl border border-border bg-muted/15">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground uppercase tracking-wider">
                        <ActivityIcon className="size-3.5 text-primary" />
                        <span>Triage Actions</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ id: activeFeedback.id, status: "in_progress" })}
                          disabled={activeFeedback.status === "in_progress" || updateStatusMutation.isPending}
                          className="text-xs h-8 border-blue-500/20 text-blue-500 hover:bg-blue-500/10 bg-blue-500/5 cursor-pointer rounded-xl font-bold"
                        >
                          <ClockIcon className="size-3.5 mr-1" />
                          In Progress
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ id: activeFeedback.id, status: "resolved" })}
                          disabled={activeFeedback.status === "resolved" || updateStatusMutation.isPending}
                          className="text-xs h-8 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 bg-emerald-500/5 cursor-pointer rounded-xl font-bold"
                        >
                          <CheckIcon className="size-3.5 mr-1" />
                          Resolve
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ id: activeFeedback.id, status: "rejected" })}
                          disabled={activeFeedback.status === "rejected" || updateStatusMutation.isPending}
                          className="text-xs h-8 border-red-500/20 text-red-500 hover:bg-red-500/10 bg-red-500/5 cursor-pointer rounded-xl font-bold"
                        >
                          <XIcon className="size-3.5 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Client resolution satisfaction rating prompt */}
                  {activeFeedback.status === "resolved" && activeFeedback.user.id === user?.id && (
                    <div className="space-y-3 p-5 rounded-2xl border border-border bg-muted/15">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground uppercase tracking-wider">
                          <svg className="size-3.5 text-pink-500 fill-pink-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                          <span>{activeFeedback.satisfactionLevel ? "Update Resolution Rating" : "Rate Resolution Satisfaction"}</span>
                        </div>
                        {activeFeedback.satisfactionLevel && (
                          <span className="text-[10px] text-pink-500 font-extrabold bg-pink-500/10 px-2 py-0.5 rounded-full select-none">
                            {activeFeedback.satisfactionLevel} / 10
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-normal">
                        Please rate your satisfaction with how the product team resolved this request:
                      </p>
                      <div className="grid grid-cols-10 gap-1 bg-background p-1.5 border border-border/50 rounded-2xl select-none">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                          const rating = String(num)
                          const isSelected = activeFeedback.satisfactionLevel === num
                          
                          let colorClass = "hover:bg-muted-foreground/15 text-muted-foreground hover:scale-105"
                          if (isSelected) {
                            if (num <= 3) colorClass = "bg-red-500 text-white font-black shadow-md hover:bg-red-600 scale-105"
                            else if (num <= 6) colorClass = "bg-amber-500 text-white font-black shadow-md hover:bg-amber-600 scale-105"
                            else if (num <= 8) colorClass = "bg-emerald-500 text-white font-black shadow-md hover:bg-emerald-600 scale-105"
                            else colorClass = "bg-pink-500 text-white font-black shadow-md hover:bg-pink-600 scale-105"
                          }

                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => {
                                updateFeedbackMutation.mutate({
                                  id: activeFeedback.id,
                                  subject: activeFeedback.subject,
                                  description: activeFeedback.description,
                                  type: activeFeedback.type,
                                  priority: activeFeedback.priority,
                                  projectId: activeFeedback.projectId,
                                  satisfactionLevel: num
                                })
                              }}
                              className={`h-7 w-full flex items-center justify-center text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer ${colorClass}`}
                            >
                              {num}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Comment / Conversation Thread */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      <MessageSquareIcon className="size-3.5 text-primary" />
                      <span>Conversation Loop</span>
                    </div>
                    
                    {isCommentsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2Icon className="size-5 text-primary animate-spin" />
                      </div>
                    ) : !commentsData?.comments || commentsData.comments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center py-10 px-4 bg-muted/10 border border-dashed border-border/40 rounded-3xl">
                        <div className="size-10 rounded-2xl bg-muted flex items-center justify-center mb-3">
                          <MessageSquareIcon className="size-5 text-muted-foreground/60" />
                        </div>
                        <p className="text-xs font-bold text-foreground">No conversations yet</p>
                        <p className="text-[10px] text-muted-foreground mt-1 max-w-[240px] leading-relaxed">
                          Post a question, update, or clarification to begin the discussion.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {commentsData.comments.map((comment: any) => {
                          if (comment.isSystem) {
                            return (
                              <div key={comment.id} className="flex items-start gap-3 pl-3 py-1 select-none animate-in fade-in duration-200">
                                <div className="relative flex h-full flex-col items-center shrink-0">
                                  <div className="size-2 rounded-full bg-primary/40 border border-primary/60 mt-1.5" />
                                  <div className="w-0.5 grow bg-border/40 mt-1 min-h-[16px]" />
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[11px] text-muted-foreground leading-normal">
                                    <span className="font-bold text-foreground">{comment.user.id === user?.id ? "You" : comment.user.name}</span>{" "}
                                    <span className="italic font-medium text-muted-foreground/85">{comment.text}</span>
                                  </p>
                                  <span className="text-[9px] text-muted-foreground/50">
                                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                  </span>
                                </div>
                              </div>
                            )
                          }
                          const isCommentAdmin = comment.user.role === "admin" || comment.user.role === "owner"
                          const isSelf = comment.user.id === user?.id
                          return (
                            <div
                              key={comment.id}
                              className={`flex gap-3 max-w-[85%] ${isSelf ? "ml-auto flex-row-reverse" : ""}`}
                            >
                              <Avatar className="size-8 border border-border/80 shadow-xs shrink-0 select-none">
                                <AvatarImage src={comment.user.imageUrl || ""} />
                                <AvatarFallback className="text-[10px] font-black bg-primary/10 text-primary">
                                  {comment.user.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col gap-1.5 min-w-0">
                                <div className={`flex items-center gap-2 text-[10px] text-muted-foreground select-none ${isSelf ? "justify-end" : ""}`}>
                                  <span className="font-bold text-foreground truncate">{comment.user.name}</span>
                                  {isCommentAdmin ? (
                                    <Badge className="text-[8px] tracking-wider py-0 px-1.5 bg-primary text-primary-foreground font-black rounded">
                                      STAFF
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[8px] tracking-wider py-0 px-1.5 text-muted-foreground border-border bg-muted/40 font-bold rounded">
                                      {comment.user.role.toUpperCase()}
                                    </Badge>
                                  )}
                                  <span className="text-[9px] opacity-60">•</span>
                                  <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                                </div>
                                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed border break-words shadow-xs ${
                                  isSelf 
                                    ? "bg-primary text-primary-foreground border-primary/20 rounded-tr-none font-medium" 
                                    : isCommentAdmin
                                      ? "bg-primary/5 text-foreground border-primary/15 rounded-tl-none font-medium"
                                      : "bg-muted/40 text-foreground border-border/60 rounded-tl-none font-medium"
                                }`}>
                                  {comment.text}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}

            </div>

            {/* Add Comment Input Form Box at bottom */}
            <div className="p-4 border-t border-border/40 bg-muted/10 shrink-0">
              <form onSubmit={onCommentSubmit} className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
                <Textarea
                  placeholder="Type your reply..."
                  value={newCommentText}
                  onChange={(e) => onNewCommentTextChange(e.target.value)}
                  className="min-h-[50px] max-h-[120px] text-xs border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent resize-none p-2 text-foreground leading-relaxed w-full focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      onCommentSubmit(e)
                    }
                  }}
                />
                <div className="flex items-center justify-between border-t border-border/30 pt-2 px-1 select-none">
                  <span className="text-[10px] text-muted-foreground/60">
                    Press <span className="font-sans font-semibold">Enter</span> to send
                  </span>
                  <Button
                    type="submit"
                    disabled={postCommentMutation.isPending || !newCommentText.trim()}
                    size="sm"
                    className="rounded-xl h-8 px-3 text-xs font-bold gap-1.5 cursor-pointer shrink-0"
                  >
                    {postCommentMutation.isPending ? (
                      <Loader2Icon className="size-3.5 animate-spin" />
                    ) : (
                      <>
                        <SendIcon className="size-3" />
                        <span>Reply</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
