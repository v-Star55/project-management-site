import React, { useState, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import Image from "next/image"
import { MessageSquareIcon, SendIcon } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { Realtime } from "ably"

interface TicketCommentsProps {
  ticketId: string
  currentUser: {
    id: string
    name: string
    email: string
    role: string
    imageUrl?: string | null
  }
}

export default function TicketComments({ ticketId, currentUser }: TicketCommentsProps) {
  const queryClient = useQueryClient()
  const [commentText, setCommentText] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState("")
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  // Fetch Ticket Comments
  const { data: commentsData, isLoading: isCommentsLoading } = useQuery({
    queryKey: ["ticketMessages", ticketId],
    queryFn: async () => {
      const response = await axios.get(`/api/tickets/${ticketId}/messages`)
      return response.data.messages
    },
    enabled: !!ticketId,
  })

  // Standalone Ably event handlers to keep function nesting depth <= 4 levels
  const handleCommentCreated = (msg: any) => {
    const newComment = msg.data
    queryClient.setQueryData(["ticketMessages", ticketId], (old: any) => {
      const oldComments = old || []
      if (oldComments.some((c: any) => c.id === newComment.id)) {
        return oldComments
      }
      return [...oldComments, newComment]
    })
  }

  const handleCommentUpdated = (msg: any) => {
    const updatedComment = msg.data
    queryClient.setQueryData(["ticketMessages", ticketId], (old: any) => {
      if (!old) return []
      return old.map((c: any) => (c.id === updatedComment.id ? updatedComment : c))
    })
  }

  const handleCommentDeleted = (msg: any) => {
    const { id: deletedCommentId } = msg.data
    queryClient.setQueryData(["ticketMessages", ticketId], (old: any) => {
      if (!old) return []
      return old.filter((c: any) => c.id !== deletedCommentId)
    })
  }

  // Subscribe to Ably for realtime comments
  useEffect(() => {
    if (!ticketId) return

    const ably = new Realtime({
      authUrl: "/api/ably",
    })

    const channel = ably.channels.get(`ticket:${ticketId}`)

    // Handle Comment Created
    channel.subscribe("comment:created", handleCommentCreated)?.catch?.((err) => {
      console.debug("Ably comment:created subscription error:", err)
    })

    // Handle Comment Updated
    channel.subscribe("comment:updated", handleCommentUpdated)?.catch?.((err) => {
      console.debug("Ably comment:updated subscription error:", err)
    })

    // Handle Comment Deleted
    channel.subscribe("comment:deleted", handleCommentDeleted)?.catch?.((err) => {
      console.debug("Ably comment:deleted subscription error:", err)
    })

    ably.connection.on("failed", () => {
      console.warn("Ably connection failed. Realtime comments might be disabled.")
    })

    return () => {
      channel.unsubscribe()
      if (ably.connection.state !== "closed" && ably.connection.state !== "closing") {
        ably.close()
      }
    }
  }, [ticketId, queryClient])

  const commentsList = commentsData || []

  // Mutation to add a comment
  const addCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await axios.post(`/api/tickets/${ticketId}/messages`, { text })
      return response.data.message
    },
    onSuccess: () => {
      setCommentText("")
      setIsExpanded(false)
      toast.success("Comment added")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to add comment")
    }
  })

  // Mutation to edit a comment
  const editCommentMutation = useMutation({
    mutationFn: async ({ messageId, text }: { messageId: string; text: string }) => {
      const response = await axios.put(`/api/tickets/${ticketId}/messages/${messageId}`, { text })
      return response.data.message
    },
    onSuccess: (updatedComment) => {
      queryClient.setQueryData(["ticketMessages", ticketId], (old: any) => {
        if (!old) return []
        return old.map((c: any) => (c.id === updatedComment.id ? updatedComment : c))
      })
      setEditingCommentId(null)
      setEditingText("")
      toast.success("Comment updated")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update comment")
    }
  })

  // Mutation to delete a comment
  const deleteCommentMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await axios.delete(`/api/tickets/${ticketId}/messages/${messageId}`)
      return messageId;
    },
    onSuccess: (deletedMessageId) => {
      queryClient.setQueryData(["ticketMessages", ticketId], (old: any) => {
        if (!old) return []
        return old.filter((c: any) => c.id !== deletedMessageId)
      })
      setDeletingCommentId(null)
      toast.success("Comment deleted")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete comment")
    }
  })

  const handleAddCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    addCommentMutation.mutate(commentText)
  }

  const handleEditCommentSubmit = (messageId: string) => {
    if (!editingText.trim()) return
    editCommentMutation.mutate({ messageId, text: editingText })
  }

  // Format initials helper
  const getInitials = (name: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Format full time helper
  const formatCommentTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  // Auto-scroll on initial load or new comment added (only if expanded composer/scrolled)
  useEffect(() => {
    if (commentsList.length > 0 && !isCommentsLoading) {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [commentsList.length, isCommentsLoading])

  const renderCommentsContent = () => {
    if (isCommentsLoading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center py-10">
          <Spinner className="size-6 text-primary animate-spin mb-2" />
          <p className="text-xs text-muted-foreground animate-pulse">Loading comments...</p>
        </div>
      )
    }

    if (commentsList.length > 0) {
      return (
        <div className="flex flex-col gap-4 divide-y divide-border/30">
          {commentsList.map((msg: any, index: number) => {
            const isCommentAuthor = msg.userId === currentUser.id
            const isOwnerOrAdmin = currentUser.role === "owner" || currentUser.role === "admin"
            const canDelete = isCommentAuthor || isOwnerOrAdmin
            const canEdit = isCommentAuthor

            const isEditing = editingCommentId === msg.id
            const isDeleting = deletingCommentId === msg.id

            return (
              <div key={msg.id} className={`flex gap-4 items-start ${index > 0 ? "pt-4" : ""}`}>
                {/* Author Avatar */}
                <Image
                  src={msg.user?.imageUrl || "https://github.com/shadcn.png"}
                  alt={msg.user?.name || "User"}
                  width={32}
                  height={32}
                  className="size-8 rounded-full object-cover border border-border shrink-0 mt-0.5"
                  unoptimized
                />

                {/* Comment Bubble Content */}
                <div className="flex-1 min-w-0 flex flex-col">
                  {/* Header: Author + Role + Date */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground truncate">{msg.user?.name}</span>
                    {msg.user?.role && (
                      <span className="px-1.5 py-0.5 rounded bg-muted text-[9px] border border-border/40 font-bold uppercase tracking-wider scale-90 shrink-0">
                        {msg.user.role}
                      </span>
                    )}
                    <span className="select-none text-[10px]">•</span>
                    <span className="text-[11px] font-medium">{formatCommentTime(msg.createdAt)}</span>
                  </div>

                  {/* Comment Body / Editor */}
                  {isEditing ? (
                    <div className="mt-2 flex flex-col gap-2">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full min-h-[80px] p-2.5 bg-muted/40 border border-border/80 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-xs text-foreground transition-all resize-y"
                        maxLength={1000}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCommentSubmit(msg.id)}
                          disabled={editCommentMutation.isPending || !editingText.trim()}
                          className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/95 font-semibold rounded-lg text-[11px] shadow-sm flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {editCommentMutation.isPending ? <Spinner className="size-2.5 animate-spin" /> : "Save"}
                        </button>
                        <button
                          onClick={() => {
                            setEditingCommentId(null)
                            setEditingText("")
                          }}
                          className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-lg text-[11px] transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-foreground/90 whitespace-pre-wrap mt-1.5 leading-relaxed break-words">
                      {msg.text}
                    </div>
                  )}

                  {/* Actions Row */}
                  {!isEditing && (
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground/80">
                      {isDeleting ? (
                        <div className="flex items-center gap-2 text-red-500 bg-red-500/5 px-2.5 py-1 border border-red-500/10 rounded-lg animate-in fade-in slide-in-from-left-2 duration-150">
                          <span className="font-semibold text-[10px]">Delete comment?</span>
                          <button
                            onClick={() => deleteCommentMutation.mutate(msg.id)}
                            disabled={deleteCommentMutation.isPending}
                            className="text-red-600 hover:text-red-700 font-bold hover:underline cursor-pointer disabled:opacity-50"
                          >
                            Yes, delete
                          </button>
                          <span className="text-muted-foreground/45">•</span>
                          <button
                            onClick={() => setDeletingCommentId(null)}
                            className="text-muted-foreground hover:text-foreground font-medium hover:underline cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          {canEdit && (
                            <button
                              onClick={() => {
                                setEditingCommentId(msg.id)
                                setEditingText(msg.text)
                                setDeletingCommentId(null) // Close deleting state if open
                              }}
                              className="hover:text-primary hover:underline transition duration-150 cursor-pointer flex items-center gap-1 font-medium"
                            >
                              Edit
                            </button>
                          )}
                          {canEdit && canDelete && <span className="select-none text-[8px] opacity-40">•</span>}
                          {canDelete && (
                            <button
                              onClick={() => {
                                setDeletingCommentId(msg.id)
                                setEditingCommentId(null) // Close editing state if open
                              }}
                              className="hover:text-red-500 hover:underline transition duration-150 cursor-pointer flex items-center gap-1 font-medium"
                            >
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
        <MessageSquareIcon className="size-8 text-muted-foreground/30 mb-2.5" />
        <p className="font-bold text-foreground/80 text-xs">No comments yet</p>
        <p className="text-[10px] text-muted-foreground mt-1 max-w-xs leading-normal">
          There are no comments on this ticket. Be the first to share an update!
        </p>
      </div>
    )
  }

  const currentUserInitials = getInitials(currentUser.name)

  return (
    <div className="flex flex-col gap-6 w-full max-h-[600px] overflow-hidden">
      {/* Comments List Stack */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-5 max-h-[420px]">
        {renderCommentsContent()}
        <div ref={commentsEndRef} />
      </div>

      {/* Comment Composer */}
      <div className="pt-4 border-t border-border/40 shrink-0">
        {isExpanded ? (
          <form onSubmit={handleAddCommentSubmit} className="flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* User Avatar */}
            <Image
              src={currentUser.imageUrl || "https://github.com/shadcn.png"}
              alt={currentUser.name}
              width={32}
              height={32}
              className="size-8 rounded-full object-cover border border-border shrink-0 mt-0.5"
              unoptimized
            />
            {/* Expanded Textarea Form */}
            <div className="flex-1 flex flex-col gap-2">
              <textarea
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full min-h-[100px] p-3 bg-muted/20 border border-border/60 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-xs text-foreground transition-all resize-y shadow-2xs"
                maxLength={1000}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={addCommentMutation.isPending || !commentText.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 font-semibold rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {addCommentMutation.isPending ? (
                    <Spinner className="size-3 animate-spin" />
                  ) : (
                    <SendIcon className="size-3" />
                  )}
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false)
                    setCommentText("")
                  }}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex gap-3 items-center">
            {/* User Avatar */}
            <Image
              src={currentUser.imageUrl || "https://github.com/shadcn.png"}
              alt={currentUser.name}
              width={32}
              height={32}
              className="size-8 rounded-full object-cover border border-border shrink-0"
              unoptimized
            />
            {/* Collapsed Button Input */}
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="flex-1 text-left px-4 py-2.5 bg-muted/20 border border-border/50 hover:bg-muted/40 hover:border-border/80 rounded-xl text-xs text-muted-foreground transition-all cursor-pointer shadow-2xs font-medium"
            >
              Add a comment...
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
