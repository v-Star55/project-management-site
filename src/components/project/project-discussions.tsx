import React, { useState, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import Image from "next/image"
import { 
  MessageSquareIcon, 
  SendIcon, 
  SearchIcon, 
  StarIcon, 
  Trash2Icon, 
  CopyIcon, 
  CheckIcon, 
  UsersIcon, 
  SmileIcon,
  SparklesIcon,
  ActivityIcon,
  ClockIcon,
  Plus,
  Pin,
  Hash,
  Ticket,
  HelpCircle,
  AlertTriangle,
  CheckCircle,
  Megaphone,
  Heart,
  TrendingUp,
  MoreHorizontal,
  Info
} from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Realtime } from "ably"
import { ProjectDetail, getTicketStatusColor } from "./utils"

interface ProjectDiscussionsProps {
  projectId: string
  currentUserId: string
  projectData: ProjectDetail
  userRole: string
}

interface DiscussionGroup {
  id: string
  title: string
  type: "general" | "discussion" | "suggestion" | "complaint" | "decision" | "question" | "announcement" | "feedback" | "improvement" | "other"
  content: string | null
  isPinned: boolean
  isArchived: boolean
  userId: string
  projectId: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    role: string
    imageUrl: string | null
  }
  members: {
    id: string
    name: string
    email: string
    role: string
    imageUrl: string | null
    designation: string | null
  }[]
  tickets?: {
    id: string
    title: string
    status: string
    priority: string
  }[]
}

interface FileRecord {
  id: string
  fileName: string
  fileUrl: string
  createdAt: string
  ticketId: string
  ticket: {
    id: string
    title: string
    status: string
    priority: string
  }
  uploadedById: string | null
  uploadedBy: {
    id: string
    name: string
    email: string
    imageUrl: string | null
  } | null
}

export default function ProjectDiscussions({ projectId, currentUserId, projectData, userRole }: ProjectDiscussionsProps) {
  const queryClient = useQueryClient()
  const [selectedGroupId, setSelectedGroupId] = useState<string>("")
  const [messageText, setMessageText] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showStarredOnly, setShowStarredOnly] = useState(false)
  const [channelSearchQuery, setChannelSearchQuery] = useState("")
  const [channelTypeFilter, setChannelTypeFilter] = useState<string>("all")
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [ablyStatus, setAblyStatus] = useState<"connected" | "connecting" | "failed">("connecting")
  const [showDetails, setShowDetails] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Create/Edit Channel Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [newChannelTitle, setNewChannelTitle] = useState("")
  const [newChannelType, setNewChannelType] = useState<DiscussionGroup["type"]>("discussion")
  const [newChannelContent, setNewChannelContent] = useState("")
  const [newChannelMembers, setNewChannelMembers] = useState<string[]>([])
  const [newChannelTickets, setNewChannelTickets] = useState<string[]>([])

  // Construct unique member list for sidebar & modal
  const allMembersMap = new Map()
  projectData.admins?.forEach(m => allMembersMap.set(m.id, { ...m, isAdmin: true }))
  projectData.members?.forEach(m => {
    if (!allMembersMap.has(m.id)) {
      allMembersMap.set(m.id, { ...m, isAdmin: false })
    }
  })
  const uniqueMembers = Array.from(allMembersMap.values())

  // Fetch Project Discussion Groups
  const { data: groupsData, isLoading: isGroupsLoading } = useQuery({
    queryKey: ["projectDiscussionGroups", projectId],
    queryFn: async () => {
      const response = await axios.get(`/api/projects/${projectId}/discussion-groups`)
      return response.data.groups as DiscussionGroup[]
    },
    enabled: !!projectId
  })

  const groupsList = groupsData || []
  const allChannels = groupsList.filter(g => 
    g.members?.some(m => m.id === currentUserId) || 
    g.userId === currentUserId || 
    userRole === "owner" || 
    userRole === "admin"
  )
  const filteredChannels = allChannels.filter(channel => {
    const matchesSearch = channel.title.toLowerCase().includes(channelSearchQuery.toLowerCase())
    const matchesType = channelTypeFilter === "all" || channel.type === channelTypeFilter
    return matchesSearch && matchesType
  })
  const currentChannel = allChannels.find(g => g.id === selectedGroupId) || allChannels[0]

  // Fetch Messages for the selected channel
  const { data: messagesData, isLoading: isMessagesLoading } = useQuery({
    queryKey: ["projectMessages", projectId, selectedGroupId],
    queryFn: async () => {
      if (!selectedGroupId) return []
      const response = await axios.get(`/api/projects/${projectId}/messages?groupId=${selectedGroupId}`)
      return response.data.messages
    },
    enabled: !!projectId && !!selectedGroupId,
  })

  // Standalone Ably event handlers
  const handleProjectMessageReceived = (msg: any) => {
    const newMessage = msg.data
    const newMessageGroupId = newMessage.discussionGroupId
    if (!newMessageGroupId) return
    queryClient.setQueryData(["projectMessages", projectId, newMessageGroupId], (old: any) => {
      const oldMessages = old || []
      if (oldMessages.some((m: any) => m.id === newMessage.id)) {
        return oldMessages
      }
      return [...oldMessages, newMessage]
    })
  }

  const handleProjectMessageUpdated = (msg: any) => {
    const updatedMessage = msg.data
    const updatedMessageGroupId = updatedMessage.discussionGroupId
    if (!updatedMessageGroupId) return
    queryClient.setQueryData(["projectMessages", projectId, updatedMessageGroupId], (old: any) => {
      const oldMessages = old || []
      return oldMessages.map((m: any) => m.id === updatedMessage.id ? updatedMessage : m)
    })
  }

  const handleProjectMessageDeleted = (msg: any) => {
    const { id: deletedMessageId } = msg.data
    if (!selectedGroupId) return
    queryClient.setQueryData(["projectMessages", projectId, selectedGroupId], (old: any) => {
      const oldMessages = old || []
      return oldMessages.filter((m: any) => m.id !== deletedMessageId)
    })
  }

  // Subscribe to Ably for realtime messages
  useEffect(() => {
    if (!projectId) return

    const ably = new Realtime({
      authUrl: "/api/ably",
    })

    const channel = ably.channels.get(`project:${projectId}`)

    channel.subscribe("message", handleProjectMessageReceived)?.catch?.((err) => {
      console.debug("Ably subscription error:", err)
    })

    channel.subscribe("message_update", handleProjectMessageUpdated)?.catch?.((err) => {
      console.debug("Ably subscription update error:", err)
    })

    channel.subscribe("message_delete", handleProjectMessageDeleted)?.catch?.((err) => {
      console.debug("Ably subscription delete error:", err)
    })

    if (ably.connection.state === "connected") {
      setAblyStatus("connected")
    }

    ably.connection.on("connected", () => setAblyStatus("connected"))
    ably.connection.on("connecting", () => setAblyStatus("connecting"))
    ably.connection.on("failed", () => setAblyStatus("failed"))
    ably.connection.on("disconnected", () => setAblyStatus("failed"))

    return () => {
      channel.unsubscribe()
      if (ably.connection.state !== "closed" && ably.connection.state !== "closing") {
        ably.close()
      }
    }
  }, [projectId, queryClient])

  useEffect(() => {
    if (allChannels.length > 0) {
      if (!selectedGroupId || !allChannels.some(g => g.id === selectedGroupId)) {
        setSelectedGroupId(allChannels[0].id)
      }
    } else {
      setSelectedGroupId("")
    }
  }, [allChannels, selectedGroupId])

  const messagesList = messagesData || []

  // Mutation to send a message
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      const groupIdParam = selectedGroupId === "general" ? null : selectedGroupId
      const response = await axios.post(`/api/projects/${projectId}/messages`, { 
        text, 
        groupId: groupIdParam 
      })
      return response.data.message
    },
    onSuccess: () => {
      setMessageText("")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to send message")
    }
  })

  // Mutation to toggle message star
  const toggleStarMutation = useMutation({
    mutationFn: async ({ messageId, isStarred }: { messageId: string; isStarred: boolean }) => {
      const response = await axios.put(`/api/projects/${projectId}/messages/${messageId}`, { isStarred })
      return response.data.message
    },
    onSuccess: (updatedMsg) => {
      const msgGroupId = updatedMsg.discussionGroupId || "general"
      queryClient.setQueryData(["projectMessages", projectId, msgGroupId], (old: any) => {
        const oldMessages = old || []
        return oldMessages.map((m: any) => m.id === updatedMsg.id ? updatedMsg : m)
      })
    },
    onError: () => {
      toast.error("Failed to update star status")
    }
  })

  // Mutation to delete a message
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await axios.delete(`/api/projects/${projectId}/messages/${messageId}`)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["projectMessages", projectId, selectedGroupId], (old: any) => {
        const oldMessages = old || []
        return oldMessages.filter((m: any) => m.id !== data.messageId)
      })
      toast.success("Message deleted")
    },
    onError: () => {
      toast.error("Failed to delete message")
    }
  })

  // Mutation to edit channel archive/close status
  const toggleArchiveMutation = useMutation({
    mutationFn: async (isArchived: boolean) => {
      const response = await axios.patch(`/api/projects/${projectId}/discussion-groups/${currentChannel.id}`, { isArchived })
      return response.data.group as DiscussionGroup
    },
    onSuccess: (updatedGroup) => {
      toast.success(updatedGroup.isArchived ? "Channel closed/archived" : "Channel reopened")
      queryClient.setQueryData(["projectDiscussionGroups", projectId], (old: any) => {
        const oldGroups = old || []
        return oldGroups.map((g: any) => g.id === updatedGroup.id ? updatedGroup : g)
      })
    },
    onError: () => {
      toast.error("Failed to update channel status")
    }
  })

  // Mutation to toggle channel pinned state
  const togglePinMutation = useMutation({
    mutationFn: async (isPinned: boolean) => {
      const response = await axios.patch(`/api/projects/${projectId}/discussion-groups/${currentChannel.id}`, { isPinned })
      return response.data.group as DiscussionGroup
    },
    onSuccess: (updatedGroup) => {
      toast.success(updatedGroup.isPinned ? "Channel pinned" : "Channel unpinned")
      queryClient.setQueryData(["projectDiscussionGroups", projectId], (old: any) => {
        const oldGroups = old || []
        return oldGroups.map((g: any) => g.id === updatedGroup.id ? updatedGroup : g)
      })
    },
    onError: () => {
      toast.error("Failed to toggle pin status")
    }
  })

  // Mutation to delete a discussion group (channel)
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const response = await axios.delete(`/api/projects/${projectId}/discussion-groups/${groupId}`)
      return response.data
    },
    onSuccess: (data) => {
      toast.success("Channel deleted successfully")
      queryClient.setQueryData(["projectDiscussionGroups", projectId], (old: any) => {
        const oldGroups = old || []
        return oldGroups.filter((g: any) => g.id !== data.groupId)
      })
      setSelectedGroupId("")
    },
    onError: () => {
      toast.error("Failed to delete channel")
    }
  })

  // Mutation to create/edit a discussion group
  const createGroupMutation = useMutation({
    mutationFn: async () => {
      if (editingGroupId) {
        const response = await axios.patch(`/api/projects/${projectId}/discussion-groups/${editingGroupId}`, {
          title: newChannelTitle,
          type: newChannelType,
          content: newChannelContent,
          memberIds: newChannelMembers,
          ticketIds: newChannelTickets
        })
        return { group: response.data.group as DiscussionGroup, isEdit: true }
      } else {
        const response = await axios.post(`/api/projects/${projectId}/discussion-groups`, {
          title: newChannelTitle,
          type: newChannelType,
          content: newChannelContent,
          memberIds: newChannelMembers,
          ticketIds: newChannelTickets
        })
        return { group: response.data.group as DiscussionGroup, isEdit: false }
      }
    },
    onSuccess: ({ group: newGroup, isEdit }) => {
      toast.success(isEdit ? `Channel #${newGroup.title} updated!` : `Channel #${newGroup.title} created!`)
      queryClient.setQueryData(["projectDiscussionGroups", projectId], (old: any) => {
        const oldGroups = old || []
        if (isEdit) {
          return oldGroups.map((g: any) => g.id === newGroup.id ? newGroup : g)
        } else {
          return [...oldGroups, newGroup]
        }
      })
      if (!isEdit) {
        setSelectedGroupId(newGroup.id)
      }
      setIsCreateModalOpen(false)
      // Reset form
      setEditingGroupId(null)
      setNewChannelTitle("")
      setNewChannelType("discussion")
      setNewChannelContent("")
      setNewChannelMembers([])
      setNewChannelTickets([])
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to save channel details")
    }
  })

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim()) return
    sendMessageMutation.mutate(messageText)
  }

  const handleToggleStar = (messageId: string, currentStarred: boolean) => {
    toggleStarMutation.mutate({ messageId, isStarred: !currentStarred })
  }

  const handleDeleteMessage = (messageId: string) => {
    if (confirm("Are you sure you want to delete this message?")) {
      deleteMessageMutation.mutate(messageId)
    }
  }

  const handleCopyMessage = (messageId: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedMessageId(messageId)
    setTimeout(() => setCopiedMessageId(null), 2000)
  }

  const handleAddEmoji = (emoji: string) => {
    setMessageText(prev => prev + emoji)
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!searchQuery && !showStarredOnly) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messagesList, searchQuery, showStarredOnly])

  // Filter messages based on search query and starred status
  const filteredMessages = messagesList.filter((msg: any) => {
    const matchesSearch = searchQuery.trim() === "" || msg.text.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStarred = !showStarredOnly || msg.isStarred
    return matchesSearch && matchesStarred
  })

  const totalStarred = messagesList.filter((msg: any) => msg.isStarred).length

  // Filter team members list in sidebar to show current channel members
  const currentChannelMembers = currentChannel
    ? uniqueMembers.filter(m => currentChannel.members?.some((cm: any) => cm.id === m.id))
    : []

  // Check if current user can delete a message
  const canDeleteMessage = (msg: any) => {
    const isProjectAdmin = projectData.admins?.some(a => a.id === currentUserId) || false
    const isSender = msg.userId === currentUserId
    return isSender || isProjectAdmin
  }

  const getRoleBadge = (role: string, isAdmin: boolean) => {
    if (isAdmin) {
      return "text-indigo-500 bg-indigo-500/10 border-indigo-500/20"
    }
    switch (role.toLowerCase()) {
      case "owner":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20"
      case "client":
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
      case "member":
      default:
        return "text-slate-500 bg-slate-500/10 border-slate-500/20"
    }
  }

  const getRoleLabel = (role: string, isAdmin: boolean) => {
    if (isAdmin) return "Admin"
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  const getChannelIcon = (type: string) => {
    switch (type) {
      case "general":
        return <Hash className="size-3.5 text-stone-500" />
      case "discussion":
        return <MessageSquareIcon className="size-3.5 text-blue-500" />
      case "suggestion":
        return <SparklesIcon className="size-3.5 text-amber-500" />
      case "complaint":
        return <AlertTriangle className="size-3.5 text-red-500" />
      case "decision":
        return <CheckCircle className="size-3.5 text-emerald-500" />
      case "question":
        return <HelpCircle className="size-3.5 text-indigo-500" />
      case "announcement":
        return <Megaphone className="size-3.5 text-rose-500 animate-bounce" />
      case "feedback":
        return <Heart className="size-3.5 text-pink-500" />
      case "improvement":
        return <TrendingUp className="size-3.5 text-violet-500" />
      case "other":
      default:
        return <MoreHorizontal className="size-3.5 text-stone-400" />
    }
  }



  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHr = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHr / 24)

    if (diffSec < 60) return "Just now"
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHr < 24) return `${diffHr}h ago`
    return `${diffDay}d ago`
  }

  const formatGroupDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  let lastDateHeader = ""

  return (
    <div className="bg-transparent flex flex-1 w-full h-full overflow-hidden animate-in fade-in duration-200">
      
      {/* 1. Left Sidebar Pane */}
      <div className="w-72 border-r border-border/40 bg-muted/5 flex flex-col shrink-0">
        
        {/* Channels Section - occupy full height */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 shrink-0">
            <span className="flex items-center gap-1.5">
              <MessageSquareIcon className="size-3" /> 
              Channels
            </span>
            <button
              onClick={() => {
                setEditingGroupId(null)
                setNewChannelTitle("")
                setNewChannelType("discussion")
                setNewChannelContent("")
                setNewChannelMembers(uniqueMembers.map(m => m.id))
                setNewChannelTickets([])
                setIsCreateModalOpen(true)
              }}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Create Channel"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          {/* Channel Search & Filter */}
          <div className="flex flex-col gap-2 shrink-0">
            {/* Search Input */}
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground/60" />
              <input
                type="text"
                placeholder="Search channels..."
                value={channelSearchQuery}
                onChange={(e) => setChannelSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-muted/40 border border-border/40 rounded-lg text-xs placeholder:text-muted-foreground/60 focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-all text-foreground"
              />
            </div>
            
            {/* Type Filter Select */}
            <div className="flex gap-1.5">
              <Select value={channelTypeFilter} onValueChange={setChannelTypeFilter}>
                <SelectTrigger className="h-7 text-[10px] border border-border/40 bg-muted/40 rounded-lg font-medium cursor-pointer w-full text-muted-foreground hover:text-foreground">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem className="text-xs rounded-lg cursor-pointer" value="all">All Types</SelectItem>
                  <SelectItem className="text-xs rounded-lg cursor-pointer" value="general">General</SelectItem>
                  <SelectItem className="text-xs rounded-lg cursor-pointer" value="discussion">Discussion</SelectItem>
                  <SelectItem className="text-xs rounded-lg cursor-pointer" value="suggestion">Suggestion</SelectItem>
                  <SelectItem className="text-xs rounded-lg cursor-pointer" value="complaint">Complaint</SelectItem>
                  <SelectItem className="text-xs rounded-lg cursor-pointer" value="decision">Decision</SelectItem>
                  <SelectItem className="text-xs rounded-lg cursor-pointer" value="question">Question</SelectItem>
                  <SelectItem className="text-xs rounded-lg cursor-pointer" value="announcement">Announcement</SelectItem>
                  <SelectItem className="text-xs rounded-lg cursor-pointer" value="feedback">Feedback</SelectItem>
                  <SelectItem className="text-xs rounded-lg cursor-pointer" value="improvement">Improvement</SelectItem>
                  <SelectItem className="text-xs rounded-lg cursor-pointer" value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              
              {(channelSearchQuery || channelTypeFilter !== "all") && (
                <button
                  onClick={() => {
                    setChannelSearchQuery("")
                    setChannelTypeFilter("all")
                  }}
                  className="px-2 h-7 rounded-lg border border-border/40 hover:bg-muted text-[10px] font-bold text-muted-foreground hover:text-foreground shrink-0 transition-colors cursor-pointer"
                  title="Clear filters"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1 pr-1">
            {isGroupsLoading ? (
              <div className="py-2 flex items-center justify-center">
                <Spinner className="size-3.5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredChannels.length > 0 ? (
              filteredChannels.map((channel) => {
                const isSelected = channel.id === selectedGroupId
                return (
                  <button
                    key={channel.id}
                    onClick={() => {
                      setSelectedGroupId(channel.id)
                      setShowStarredOnly(false)
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2.5 rounded-xl text-xs font-semibold transition-all select-none cursor-pointer ${
                      isSelected && !showStarredOnly
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {getChannelIcon(channel.type)}
                      <span className="truncate">#{channel.title}</span>
                    </div>
                    {channel.isPinned && <Pin className="size-2.5 text-amber-500 fill-amber-500 shrink-0" />}
                  </button>
                )
              })
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground italic bg-muted/10 rounded-xl border border-dashed border-border/30">
                No channels found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Chat Area Pane */}
      {!currentChannel ? (
        <div className="flex-1 flex flex-col h-full bg-background justify-center items-center text-center p-8 border-r border-border/40">
          <MessageSquareIcon className="size-12 text-muted-foreground/30 mb-3" />
          <h3 className="text-sm font-bold text-foreground">No channels joined</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            You are not a member of any discussion channel in this project. Create a new channel or ask an administrator to add you.
          </p>
          <button
            onClick={() => {
              setEditingGroupId(null)
              setNewChannelTitle("")
              setNewChannelType("discussion")
              setNewChannelContent("")
              setNewChannelMembers(uniqueMembers.map(m => m.id))
              setNewChannelTickets([])
              setIsCreateModalOpen(true)
            }}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-primary/90 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs hover:scale-[1.02]"
          >
            <Plus className="size-4" />
            Create Channel
          </button>
        </div>
      ) : (
        <>
          <div className="flex-1 flex flex-col h-full bg-background border-r border-border/40">
        
        {/* Header */}
        <div className="p-4 border-b border-border/40 bg-muted/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs shrink-0">
              {getChannelIcon(currentChannel.type)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground truncate">#{currentChannel.title}</h3>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-muted/80 text-muted-foreground border border-border/30 uppercase font-semibold">
                  {currentChannel.type}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground truncate">
                {showStarredOnly 
                  ? `Viewing starred messages in #${currentChannel.title}` 
                  : currentChannel.content || "No topic set for this channel."
                }
              </p>
              
              {/* Display Associated Tickets in Header */}
              {currentChannel.tickets && currentChannel.tickets.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">Linked Tickets:</span>
                  {currentChannel.tickets.map(t => (
                    <span 
                      key={t.id}
                      className={`text-[8.5px] px-2 py-0.5 border rounded-md font-bold flex items-center gap-1 select-none ${getTicketStatusColor(t.status)}`}
                      title={`${t.title} (${t.status})`}
                    >
                      <Ticket className="size-2.5" />
                      {t.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {showStarredOnly && (
              <button 
                onClick={() => setShowStarredOnly(false)}
                className="text-[10px] px-2 py-1 rounded bg-muted hover:bg-muted/80 border border-border/30 text-muted-foreground hover:text-foreground font-bold transition-colors cursor-pointer"
              >
                Clear Filter
              </button>
            )}
            
            <button
              onClick={() => setShowDetails(prev => !prev)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                showDetails 
                  ? "bg-primary/10 border-primary/20 text-primary" 
                  : "text-muted-foreground hover:bg-muted border-border/30 hover:text-foreground"
              }`}
              title="Toggle Channel Details"
            >
              <Info className="size-4" />
            </button>

            <span className="text-xs px-2.5 py-0.5 font-bold bg-muted text-muted-foreground rounded-full border border-border/30">
              {filteredMessages.length} Messages
            </span>
          </div>
        </div>

        {/* Messages Scroll Feed */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 bg-muted/3">
          
          {isMessagesLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <Spinner className="size-6 text-primary animate-spin mb-2" />
              <p className="text-xs text-muted-foreground animate-pulse">Loading channel messages...</p>
            </div>
          ) : filteredMessages.length > 0 ? (
            filteredMessages.map((msg: any) => {
              const isMe = msg.userId === currentUserId
              const msgInitials = msg.user?.name
                ? msg.user.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
                : "U"

              const isProjectAdmin = projectData.admins?.some(a => a.id === msg.userId) || false
              const roleBadgeClass = getRoleBadge(msg.user?.role || "member", isProjectAdmin)
              const roleLabel = getRoleLabel(msg.user?.role || "member", isProjectAdmin)

              const msgDateStr = new Date(msg.createdAt).toDateString()
              const showDateSeparator = msgDateStr !== lastDateHeader
              if (showDateSeparator) {
                lastDateHeader = msgDateStr
              }

              return (
                <div key={msg.id} className="flex flex-col gap-3">
                  
                  {/* Date Separator */}
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-2 select-none">
                      <div className="flex-1 border-t border-border/30" />
                      <span className="px-3 text-[10px] font-bold text-muted-foreground bg-card border border-border/30 rounded-full py-0.5 mx-2 uppercase tracking-wider">
                        {formatGroupDate(msg.createdAt)}
                      </span>
                      <div className="flex-1 border-t border-border/30" />
                    </div>
                  )}

                  {/* Message Bubble Structure */}
                  <div className={`relative flex gap-3 max-w-[85%] group ${
                    isMe ? "self-end flex-row-reverse" : "self-start"
                  }`}>
                    
                    {/* Hover actions menu bar */}
                    <div className={`absolute -top-3.5 flex items-center bg-card border border-border/60 shadow-xs rounded-xl p-1 gap-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${
                      isMe ? "left-0" : "right-0"
                    }`}>
                      <button
                        onClick={() => handleToggleStar(msg.id, msg.isStarred)}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          msg.isStarred 
                            ? "text-amber-500 hover:bg-amber-500/10" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                        title={msg.isStarred ? "Unstar message" : "Star message"}
                      >
                        <StarIcon className={`size-3.5 ${msg.isStarred ? "fill-amber-500" : ""}`} />
                      </button>

                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.text)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title="Copy text"
                      >
                        {copiedMessageId === msg.id ? (
                          <CheckIcon className="size-3.5 text-emerald-500 animate-in fade-in duration-200" />
                        ) : (
                          <CopyIcon className="size-3.5" />
                        )}
                      </button>

                      {canDeleteMessage(msg) && (
                        <button
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          title="Delete message"
                        >
                          <Trash2Icon className="size-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Sender Image Avatar */}
                    {msg.user?.imageUrl ? (
                      <Image
                        src={msg.user.imageUrl}
                        alt={msg.user?.name || "User"}
                        width={32}
                        height={32}
                        className="size-8 rounded-full object-cover border border-border shrink-0 self-end shadow-2xs"
                        unoptimized
                      />
                    ) : (
                      <div className="size-8 rounded-full bg-linear-to-br from-stone-200 to-stone-300 dark:from-stone-800 dark:to-stone-900 border border-border flex items-center justify-center text-[10px] font-bold text-stone-700 dark:text-stone-300 shrink-0 self-end select-none shadow-2xs">
                        {msgInitials}
                      </div>
                    )}

                    {/* Content wrapper */}
                    <div className="flex flex-col gap-1 min-w-0">
                      
                      {/* Sender Meta */}
                      <div className={`flex items-center gap-2 text-[10px] text-muted-foreground ${
                        isMe ? "justify-end" : "justify-start"
                      }`}>
                        <span className="font-bold text-foreground/80">{msg.user?.name}</span>
                        <span className={`px-1 rounded scale-85 uppercase tracking-wide font-semibold border ${roleBadgeClass}`}>
                          {roleLabel}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <ClockIcon className="size-2.5" />
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.isStarred && (
                          <StarIcon className="size-2.5 fill-amber-400 text-amber-400 animate-in fade-in" />
                        )}
                      </div>

                      {/* Chat text Bubble */}
                      <div className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap border shadow-2xs transition-all ${
                        isMe 
                          ? "bg-primary text-primary-foreground border-primary rounded-tr-none" 
                          : "bg-card text-foreground border-border/70 rounded-tl-none"
                      }`}>
                        {msg.text}
                      </div>
                    </div>

                  </div>
                </div>
              )
            })
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <MessageSquareIcon className="size-12 text-muted-foreground/30 mb-3" />
              <p className="font-bold text-foreground">
                {showStarredOnly 
                  ? "No starred discussions" 
                  : searchQuery 
                    ? "No matching messages found" 
                    : `No messages in #${currentChannel.title}`
                }
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {showStarredOnly 
                  ? "Hover over any message bubble and click the Star icon to bookmark important messages." 
                  : searchQuery 
                    ? "Try adjusting your keywords to find the messages you are looking for."
                    : `Start the conversation in #${currentChannel.title} by posting a message below.`
                }
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Area */}
        <div className="p-4 border-t border-border/40 bg-background flex flex-col gap-3">
          
          {/* Reaction Shortcuts Row */}
          <div className="flex items-center justify-between border-b border-border/20 pb-2 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1 px-1">
              <SmileIcon className="size-3.5 text-muted-foreground/80" />
              <span className="font-semibold">Quick Reaction:</span>
              <div className="flex items-center gap-1.5 ml-2">
                {["👍", "❤️", "🔥", "😂", "🙌", "🎉", "🚀", "💬"].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleAddEmoji(emoji)}
                    className="hover:scale-120 transition-transform cursor-pointer focus:outline-hidden text-xs"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <SparklesIcon className="size-3 text-primary" />
              <span className="font-bold">{messageText.length} / 1000</span>
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              placeholder={`Type your message regarding #${currentChannel.title} channel...`}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="flex-1 px-4.5 py-3 bg-muted/30 border border-border/60 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-card outline-none text-xs text-foreground transition-all duration-150"
              maxLength={1000}
            />
            <button
              type="submit"
              disabled={sendMessageMutation.isPending || !messageText.trim()}
              className="px-5 py-3 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
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

      </div>

      {/* 3. Right Details Pane */}
      {showDetails && (
        <div className="w-80 bg-muted/5 flex flex-col shrink-0 h-full overflow-y-auto border-l border-border/40 animate-in slide-in-from-right duration-200 p-4 gap-4 scrollbar-thin">
          
          {/* Section: About this discussion */}
          <div className="bg-card/40 border border-border/40 rounded-xl p-4 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">About this discussion</h4>
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold">Type</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] bg-primary/10 border border-primary/20 text-primary font-bold uppercase">
                  {currentChannel.type}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold">Created by</span>
                {currentChannel.id === "general" ? (
                  <span className="font-bold text-foreground/80">System</span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    {currentChannel.user?.imageUrl ? (
                      <Image
                        src={currentChannel.user.imageUrl}
                        alt={currentChannel.user.name}
                        width={18}
                        height={18}
                        className="size-4.5 rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="size-4.5 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-[7px] font-bold text-stone-700 dark:text-stone-300">
                        {currentChannel.user?.name ? currentChannel.user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "S"}
                      </div>
                    )}
                    <span className="font-bold text-foreground/80 truncate max-w-[120px]">{currentChannel.user?.name}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold">Created on</span>
                <span className="font-semibold text-foreground/70">
                  {currentChannel.createdAt ? new Date(currentChannel.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold">Last activity</span>
                <span className="font-semibold text-foreground/70">
                  {messagesList.length > 0 ? getRelativeTime(messagesList[messagesList.length - 1].createdAt) : "No activity"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold">Status</span>
                {currentChannel.id === "general" ? (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold uppercase">
                    Active
                  </span>
                ) : (
                  <Select 
                    value={currentChannel.isArchived ? "archived" : "active"} 
                    onValueChange={(val) => toggleArchiveMutation.mutate(val === "archived")}
                  >
                    <SelectTrigger className={`h-7 text-[10px] border px-2.5 rounded-md font-bold uppercase cursor-pointer ${
                      currentChannel.isArchived 
                        ? "bg-red-500/10 text-red-500 border-red-500/20" 
                        : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    }`}>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem className="text-[10px] rounded-lg" value="active">Active</SelectItem>
                      <SelectItem className="text-[10px] rounded-lg" value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-semibold">Pinned</span>
                {currentChannel.id === "general" ? (
                  <span className="font-semibold text-foreground/70 flex items-center gap-1"><Pin className="size-3 text-amber-500 fill-amber-500" /> Yes</span>
                ) : (
                  <button
                    onClick={() => togglePinMutation.mutate(!currentChannel.isPinned)}
                    className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer text-xs font-semibold text-foreground/80"
                  >
                    {currentChannel.isPinned ? <Pin className="size-3 text-amber-500 fill-amber-500" /> : <Pin className="size-3 text-stone-400" />}
                    <span>{currentChannel.isPinned ? "Yes" : "No"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section: Participants */}
          <div className="bg-card/40 border border-border/40 rounded-xl p-4 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Participants ({currentChannelMembers.length})
            </h4>
            
            <div className="flex -space-x-1.5 overflow-hidden">
              {currentChannelMembers.slice(0, 5).map((member) => (
                <div key={member.id} className="relative inline-block" title={member.name}>
                  {member.imageUrl ? (
                    <Image
                      src={member.imageUrl}
                      alt={member.name}
                      width={24}
                      height={24}
                      className="size-6 rounded-full ring-2 ring-background object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="size-6 rounded-full bg-linear-to-br from-stone-200 to-stone-300 dark:from-stone-800 dark:to-stone-900 ring-2 ring-background flex items-center justify-center text-[8px] font-bold text-stone-700 dark:text-stone-300 select-none">
                      {member.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                  )}
                </div>
              ))}
              {currentChannelMembers.length > 5 && (
                <div className="size-6 rounded-full bg-muted border border-border/50 text-[8px] font-bold flex items-center justify-center text-muted-foreground ring-2 ring-background select-none">
                  +{currentChannelMembers.length - 5}
                </div>
              )}
            </div>
          </div>

          {/* Section: Related Tickets */}
          <div className="bg-card/40 border border-border/40 rounded-xl p-4 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Related Tickets ({currentChannel.tickets?.length || 0})
            </h4>
            
            {currentChannel.tickets && currentChannel.tickets.length > 0 ? (
              <div className="flex flex-col gap-2">
                {currentChannel.tickets.map(ticket => (
                  <div key={ticket.id} className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wide shrink-0">
                        TKT-{ticket.id.slice(-3).toUpperCase()}
                      </span>
                      <span className="text-xs font-semibold text-foreground/80 truncate" title={ticket.title}>
                        {ticket.title}
                      </span>
                    </div>
                    <span className={`text-[8px] px-1 py-0.2 rounded border uppercase font-bold scale-90 shrink-0 ${getTicketStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-[10px] text-muted-foreground italic">No linked tickets</span>
            )}
          </div>

          {/* Section: Actions */}
          <div className="bg-card/40 border border-border/40 rounded-xl p-4 flex flex-col gap-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Actions</h4>
            
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => {
                  // Set edit states
                  setEditingGroupId(currentChannel.id)
                  setNewChannelTitle(currentChannel.title)
                  setNewChannelType(currentChannel.type)
                  setNewChannelContent(currentChannel.content || "")
                  setNewChannelMembers(currentChannel.members.map(m => m.id))
                  setNewChannelTickets(currentChannel.tickets?.map(t => t.id) || [])
                  setIsCreateModalOpen(true)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-foreground/80 hover:bg-muted rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="size-3.5 text-stone-500" />
                Edit Channel Details
              </button>

              {(userRole === "owner" || userRole === "admin") && (
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this channel? All messages inside it will be permanently removed.")) {
                      deleteGroupMutation.mutate(currentChannel.id)
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2Icon className="size-3.5" />
                  Delete Channel
                </button>
              )}
            </div>
          </div>

        </div>
      )}
        </>
      )}

      {/* 4. Create/Edit Channel Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl flex flex-col overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-border/40 bg-muted/10 flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                {editingGroupId ? <Plus className="size-4 text-primary" /> : <Plus className="size-4 text-primary" />}
                {editingGroupId ? "Edit Channel Details" : "Create New Channel"}
              </h3>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false)
                  setEditingGroupId(null)
                }}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer font-bold"
              >
                Cancel
              </button>
            </div>

            {/* Modal Form */}
            <form 
              onSubmit={(e) => { 
                e.preventDefault(); 
                if (!newChannelTitle.trim()) return;
                createGroupMutation.mutate(); 
              }} 
              className="p-5 flex flex-col gap-4"
            >
              
              {/* Channel Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Channel Name</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 size-4 text-muted-foreground/60" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. design-assets"
                    value={newChannelTitle}
                    onChange={(e) => setNewChannelTitle(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    className="w-full pl-9 pr-4 py-2.5 bg-muted/30 border border-border/60 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-xs text-foreground transition-all"
                  />
                </div>
              </div>

              {/* Channel Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Channel Type</label>
                <Select value={newChannelType} onValueChange={(val: any) => setNewChannelType(val)}>
                  <SelectTrigger className="w-full px-3 py-2.5 bg-muted/30 border border-border/60 rounded-xl text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem className="text-xs rounded-lg" value="general">General</SelectItem>
                    <SelectItem className="text-xs rounded-lg" value="discussion">Discussion</SelectItem>
                    <SelectItem className="text-xs rounded-lg" value="suggestion">Suggestion</SelectItem>
                    <SelectItem className="text-xs rounded-lg" value="complaint">Complaint</SelectItem>
                    <SelectItem className="text-xs rounded-lg" value="decision">Decision</SelectItem>
                    <SelectItem className="text-xs rounded-lg" value="question">Question</SelectItem>
                    <SelectItem className="text-xs rounded-lg" value="announcement">Announcement</SelectItem>
                    <SelectItem className="text-xs rounded-lg" value="feedback">Feedback</SelectItem>
                    <SelectItem className="text-xs rounded-lg" value="improvement">Improvement</SelectItem>
                    <SelectItem className="text-xs rounded-lg" value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Channel Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description (Optional)</label>
                <textarea
                  placeholder="What is this channel about?"
                  value={newChannelContent}
                  onChange={(e) => setNewChannelContent(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/30 border border-border/60 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none text-xs text-foreground h-16 resize-none transition-all"
                />
              </div>

              {/* Select Members */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Select Members ({newChannelMembers.length})
                </label>
                <div className="border border-border/50 rounded-xl max-h-28 overflow-y-auto p-2 bg-muted/10 flex flex-col gap-1">
                  {uniqueMembers.map(m => {
                    const checked = newChannelMembers.includes(m.id)
                    return (
                      <label key={m.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 text-xs font-semibold cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewChannelMembers(prev => [...prev, m.id])
                            } else {
                              setNewChannelMembers(prev => prev.filter(id => id !== m.id))
                            }
                          }}
                          className="size-3.5 accent-primary border-border/60 rounded-sm cursor-pointer"
                        />
                        <span>{m.name}</span>
                        <span className="text-[9px] text-muted-foreground">({m.designation || "Member"})</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Select Tickets */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Associate Tickets ({newChannelTickets.length})
                </label>
                <div className="border border-border/50 rounded-xl max-h-28 overflow-y-auto p-2 bg-muted/10 flex flex-col gap-1">
                  {projectData.tickets && projectData.tickets.length > 0 ? (
                    projectData.tickets.map(ticket => {
                      const checked = newChannelTickets.includes(ticket.id)
                      return (
                        <label key={ticket.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 text-xs font-semibold cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewChannelTickets(prev => [...prev, ticket.id])
                              } else {
                                setNewChannelTickets(prev => prev.filter(id => id !== ticket.id))
                              }
                            }}
                            className="size-3.5 accent-primary border-border/60 rounded-sm cursor-pointer"
                          />
                          <span className="truncate max-w-[200px]">{ticket.title}</span>
                          <span className={`text-[8px] px-1 py-0.2 rounded border uppercase font-bold scale-90 ${getTicketStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                        </label>
                      )
                    })
                  ) : (
                    <p className="text-[10px] text-muted-foreground p-2">No tickets found in this project.</p>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={createGroupMutation.isPending || !newChannelTitle.trim()}
                className="mt-2 w-full py-3 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {createGroupMutation.isPending ? <Spinner className="size-3.5 animate-spin" /> : <Plus className="size-4" />}
                {editingGroupId ? "Save Changes" : "Create Channel"}
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}
