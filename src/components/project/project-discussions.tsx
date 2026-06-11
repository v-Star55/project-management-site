import React, { useState, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import Image from "next/image"
import { MessageSquareIcon, SendIcon } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"

interface ProjectDiscussionsProps {
  projectId: string
  currentUserId: string
}

export default function ProjectDiscussions({ projectId, currentUserId }: ProjectDiscussionsProps) {
  const queryClient = useQueryClient()
  const [messageText, setMessageText] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch Project Messages
  const { data: messagesData, isLoading: isMessagesLoading } = useQuery({
    queryKey: ["projectMessages", projectId],
    queryFn: async () => {
      const response = await axios.get(`/api/projects/${projectId}/messages`)
      return response.data.messages
    },
    enabled: !!projectId,
    refetchInterval: 3000, // Poll every 3 seconds for realtime updates
  })

  const messagesList = messagesData || []

  // Mutation to send a message
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await axios.post(`/api/projects/${projectId}/messages`, { text })
      return response.data.message
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData(["projectMessages", projectId], (old: any) => {
        return old ? [...old, newMessage] : [newMessage]
      })
      setMessageText("")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to send message")
    }
  })

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim()) return
    sendMessageMutation.mutate(messageText)
  }

  // Auto-scroll to bottom of chat when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messagesList])

  return (
    <div className="bg-card border border-border/60 rounded-2xl flex flex-col h-[600px] overflow-hidden shadow-xs animate-in fade-in duration-200">
      {/* Messages Header */}
      <div className="p-4 border-b border-border/40 bg-muted/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <MessageSquareIcon className="size-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Project Chat Wall</h3>
            <p className="text-[10px] text-muted-foreground">Collaborate with the team in real-time</p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-0.5 font-semibold bg-muted text-muted-foreground rounded-full border border-border/30">
          {messagesList.length} Messages
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-muted/5">
        {isMessagesLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Spinner className="size-6 text-primary animate-spin mb-2" />
            <p className="text-xs text-muted-foreground animate-pulse">Loading discussions...</p>
          </div>
        ) : messagesList.length > 0 ? (
          messagesList.map((msg: any) => {
            const isMe = msg.userId === currentUserId
            const msgInitials = msg.user.name
              ? msg.user.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
              : "U"
            return (
              <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isMe ? "self-end flex-row-reverse" : "self-start"}`}>
                {/* User Avatar */}
                {msg.user.imageUrl ? (
                  <Image
                    src={msg.user.imageUrl}
                    alt={msg.user.name}
                    width={32}
                    height={32}
                    className="size-8 rounded-full object-cover border border-border shrink-0"
                    unoptimized
                  />
                ) : (
                  <div className="size-8 rounded-full bg-stone-200 dark:bg-stone-800 border border-border flex items-center justify-center text-[10px] font-bold text-stone-700 dark:text-stone-300 shrink-0 select-none">
                    {msgInitials}
                  </div>
                )}

                {/* Chat Bubble Body */}
                <div className="flex flex-col gap-1">
                  {/* Sender Meta */}
                  <div className={`flex items-center gap-1.5 text-[10px] text-muted-foreground ${isMe ? "justify-end" : "justify-start"}`}>
                    <span className="font-bold text-foreground/80">{msg.user.name}</span>
                    <span className="px-1 py-px rounded bg-muted/50 border border-border/30 scale-90 uppercase tracking-widest font-semibold">{msg.user.role}</span>
                    <span>•</span>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Text Bubble */}
                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap border ${
                    isMe 
                      ? "bg-primary text-primary-foreground border-primary rounded-tr-none shadow-xs" 
                      : "bg-card text-foreground border-border/65 rounded-tl-none shadow-2xs"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <MessageSquareIcon className="size-10 text-muted-foreground/40 mb-3" />
            <p className="font-semibold text-foreground">No discussions yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">Be the first to start a discussion regarding this project deliverables.</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-border/40 bg-card flex gap-3">
        <input
          type="text"
          placeholder="Type your message regarding the project..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          className="flex-1 px-4.5 py-2.5 bg-muted/30 border border-border/60 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none text-xs text-foreground transition-all animate-in slide-in-from-bottom-2 duration-100"
          maxLength={1000}
        />
        <button
          type="submit"
          disabled={sendMessageMutation.isPending || !messageText.trim()}
          className="px-4.5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 font-semibold rounded-xl text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {sendMessageMutation.isPending ? (
            <Spinner className="size-3 animate-spin" />
          ) : (
            <SendIcon className="size-3.5" />
          )}
          Send
        </button>
      </form>
    </div>
  )
}
