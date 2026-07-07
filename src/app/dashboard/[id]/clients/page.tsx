"use client"

import React, { useState } from "react"
import { UsersIcon, UserPlusIcon, MailIcon, MoreVerticalIcon, SearchIcon, EyeIcon, PencilIcon, ChevronLeftIcon, ChevronRightIcon, Loader2Icon, CircleDotIcon, Trash2Icon, SparklesIcon, FolderIcon } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { Spinner } from "@/components/ui/spinner"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import InviteClientForm from "@/components/dashboard/invite-client-form"

interface TeamMember {
  id: string
  name: string
  email: string
  role: "Owner" | "Admin" | "Member" | "Client"
  status: "Online" | "Away" | "Offline"
  lastActive: string
  initials: string
  projects?: { id: string; title: string }[]
  createdAt?: string
  isActive?: boolean
  isPending?: boolean
  designation?: string | null
  assignedTicketsCount?: number
  completedTicketsCount?: number
}

export default function ClientsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState<string>("")
  const [activeTab, setActiveTab] = useState<"all" | "active" | "inactive" | "pending">("all")
  
  // Pagination State (Locked to 10 per page)
  const [page, setPage] = useState<number>(1)
  const pageSize = 10
  
  // Modal / Dialog States
  const [isInviteOpen, setIsInviteOpen] = useState<boolean>(false)
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false)
  const [editingClient, setEditingClient] = useState<TeamMember | null>(null)
  const [editName, setEditName] = useState<string>("")
  const [editDesignation, setEditDesignation] = useState<string>("")
  const [editProjectIds, setEditProjectIds] = useState<string[]>([])
  const [isEditSubmitting, setIsEditSubmitting] = useState<boolean>(false)

  const { user } = useSelector((state: RootState) => state.user)
  const companyId = user?.company?.id

  // Fetch projects to list inside Edit Dialog
  const { data: projectsData } = useQuery({
    queryKey: ["projects", user?.id],
    queryFn: async () => {
      const response = await axios.get("/api/projects")
      return response.data.projects
    },
    enabled: !!user?.id,
  })
  const projectsList = projectsData || []

  // Fetch all team/client members
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["teams", companyId],
    queryFn: async () => {
      if (!companyId) return { teams: [] }
      const response = await axios.get(`/api/teams/${companyId}`)
      return response.data
    },
    enabled: !!companyId,
  })

  // Filter list to only "Client" role
  const clientList: TeamMember[] = (data?.teams || []).filter(
    (member: TeamMember) => member.role === "Client"
  )

  // Apply tab filter & search
  const filteredClients = clientList.filter((client) => {
    // 1. Tab filter
    if (activeTab === "active" && (!client.isActive || client.isPending)) return false
    if (activeTab === "inactive" && client.isActive) return false
    if (activeTab === "pending" && !client.isPending) return false

    // 2. Search query filter
    const matchesSearch =
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.email.toLowerCase().includes(search.toLowerCase())

    return matchesSearch
  })

  // Pagination Slice
  const totalCount = filteredClients.length
  const totalPages = Math.ceil(totalCount / pageSize) || 1
  const startIndex = (page - 1) * pageSize
  const paginatedClients = filteredClients.slice(startIndex, startIndex + pageSize)

  // Status mapping logic
  const getClientStatus = (client: TeamMember) => {
    if (client.isPending) return "Pending"
    if (!client.isActive) return "Inactive"
    return client.status === "Online" ? "Online" : "Offline"
  }

  const getStatusColorClasses = (status: string) => {
    switch (status) {
      case "Online":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      case "Offline":
        return "text-stone-400 bg-stone-500/10 border-stone-500/20"
      case "Inactive":
        return "text-orange-400 bg-orange-500/10 border-orange-500/20"
      case "Pending":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20"
      default:
        return "text-stone-400 bg-stone-500/10 border-stone-500/20"
    }
  }

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "Online":
        return "bg-emerald-500"
      case "Offline":
        return "bg-stone-400"
      case "Inactive":
        return "bg-orange-500"
      case "Pending":
        return "bg-amber-500"
      default:
        return "bg-stone-400"
    }
  }

  // Generate initials colors matching the screenshot
  const getAvatarGradient = (name: string) => {
    const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0)
    const gradients = [
      "from-emerald-600 to-teal-800 text-emerald-100",
      "from-violet-600 to-indigo-800 text-violet-100",
      "from-amber-500 to-orange-700 text-amber-100",
      "from-rose-600 to-red-800 text-rose-100",
      "from-sky-500 to-blue-700 text-sky-100",
      "from-fuchsia-600 to-pink-800 text-fuchsia-100",
      "from-purple-600 to-violet-800 text-purple-100"
    ]
    return gradients[code % gradients.length]
  }

  // Handle Edit Action
  const openEditDialog = (client: TeamMember) => {
    setEditingClient(client)
    setEditName(client.name)
    setEditDesignation(client.designation || "Client Representative")
    setEditProjectIds(client.projects?.map(p => p.id) || [])
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClient) return

    setIsEditSubmitting(true)
    try {
      // 1. Update basic profile
      await axios.patch(`/api/users/${editingClient.id}/profile`, {
        name: editName,
        designation: editDesignation,
      })
      
      // 2. Update projects list
      await axios.patch(`/api/teams/${companyId}`, {
        memberId: editingClient.id,
        projectIds: editProjectIds,
      })

      toast.success("Client profile and projects updated successfully")
      setIsEditOpen(false)
      queryClient.invalidateQueries({ queryKey: ["teams", companyId] })
      refetch()
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error || "Failed to update profile")
    } finally {
      setIsEditSubmitting(false)
    }
  }

  // Handle Remove Action
  const handleRemoveClient = async (clientId: string, clientName: string) => {
    if (confirm(`Are you sure you want to remove client "${clientName}"? This will revoke all dashboard access.`)) {
      try {
        await axios.delete(`/api/teams/${companyId}?memberId=${clientId}`)
        toast.success(`Client "${clientName}" removed successfully.`)
        queryClient.invalidateQueries({ queryKey: ["teams", companyId] })
        refetch()
      } catch (err: any) {
        console.error(err)
        toast.error(err.response?.data?.error || "Failed to remove client")
      }
    }
  }

  const formatJoinedDate = (dateStr?: string) => {
    if (!dateStr) return "May 10, 2024"
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="size-8 text-primary animate-spin" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Loading clients...
          </p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <UsersIcon className="size-10 text-destructive mb-3 animate-bounce" />
        <p className="font-semibold text-foreground">Failed to load clients</p>
        <p className="text-sm text-muted-foreground mt-1">Please try again later.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 md:p-8 max-w-6xl mx-auto w-full animate-in fade-in duration-300">
      
      {/* Top Banner Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Clients Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage company clients, monitor activities, assign projects, and send invitations.
          </p>
        </div>
        {(user?.role === "owner" || user?.role === "admin") && (
          <button
            onClick={() => setIsInviteOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/95 font-semibold rounded-xl shadow-md transition-all duration-200 cursor-pointer text-sm"
          >
            <UserPlusIcon className="size-4" />
            Invite Client
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500 delay-150">
        {/* Total Clients Card */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 group hover:border-primary/20">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Clients</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-foreground transition-all duration-300 group-hover:scale-105 origin-left">
                {clientList.length}
              </h3>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
              <UsersIcon className="size-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
            <span className="text-indigo-400">Company</span> registered clients
          </div>
        </div>

        {/* Active Engagement Card */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 group hover:border-emerald/20">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Engagement</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-foreground transition-all duration-300 group-hover:scale-105 origin-left">
                {clientList.filter(c => c.isActive && !c.isPending && (c.status === "Online" || c.status === "Away")).length}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
              <SparklesIcon className="size-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
            <span className="flex size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-400 font-bold">{clientList.filter(c => c.status === "Online").length} Online</span> right now
          </div>
        </div>

        {/* Pending Invites Card */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 group hover:border-amber/20">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Invites</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-foreground transition-all duration-300 group-hover:scale-105 origin-left">
                {clientList.filter(c => c.isPending).length}
              </h3>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
              <MailIcon className="size-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
            <span className="text-amber-400 font-bold">Awaiting</span> client registration
          </div>
        </div>

        {/* Project Engagements Card */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 group hover:border-sky/20">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project Engagements</p>
              <h3 className="text-3xl font-extrabold tracking-tight text-foreground transition-all duration-300 group-hover:scale-105 origin-left">
                {clientList.reduce((acc, c) => acc + (c.projects?.length || 0), 0)}
              </h3>
            </div>
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
              <FolderIcon className="size-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
            <span className="text-sky-400">Total</span> active client projects
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Row */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        
        {/* Pill Tabs */}
        <div className="flex flex-wrap gap-2 sm:gap-6 border-b border-border/20 w-full lg:w-auto">
          <button
            onClick={() => { setActiveTab("all"); setPage(1); }}
            className={`relative pb-3 text-sm font-bold transition-colors cursor-pointer ${
              activeTab === "all" ? "text-primary font-black" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Clients
            {activeTab === "all" && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-full" />
            )}
          </button>

          <button
            onClick={() => { setActiveTab("active"); setPage(1); }}
            className={`relative pb-3 text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "active" ? "text-primary font-black" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Active
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {clientList.filter(c => c.isActive && !c.isPending).length}
            </span>
            {activeTab === "active" && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-full" />
            )}
          </button>

          <button
            onClick={() => { setActiveTab("inactive"); setPage(1); }}
            className={`relative pb-3 text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "inactive" ? "text-primary font-black" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Inactive
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-stone-500/10 text-stone-400 border border-stone-500/20">
              {clientList.filter(c => !c.isActive).length}
            </span>
            {activeTab === "inactive" && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-full" />
            )}
          </button>

          <button
            onClick={() => { setActiveTab("pending"); setPage(1); }}
            className={`relative pb-3 text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "pending" ? "text-primary font-black" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pending Invites
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {clientList.filter(c => c.isPending).length}
            </span>
            {activeTab === "pending" && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary rounded-full" />
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full lg:max-w-xs shrink-0">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by client or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-muted/30 hover:bg-muted/50 rounded-xl border border-border/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-xs outline-none transition-all text-foreground"
          />
        </div>
      </div>

      {/* Clients Tabular List */}
    <div className="bg-card border border-border/50 rounded-2xl overflow-x-auto shadow-sm">
      {paginatedClients.length > 0 ? (
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
              <th className="py-4 px-6">Client</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6">Assigned Projects</th>
              <th className="py-4 px-6 text-center">Ticket Progress</th>
              <th className="py-4 px-6">Joined On</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {paginatedClients.map((client) => {
              const status = getClientStatus(client)

              return (
                <tr
                  key={client.id}
                  id={client.id}
                  className="group border-border/30 hover:bg-muted/10 transition-colors duration-200"
                >
                  {/* Client Name / Email Column */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className={`size-10 rounded-xl bg-gradient-to-br ${getAvatarGradient(client.name)} flex items-center justify-center text-xs font-black border border-border/20 shadow-inner`}>
                          {client.initials}
                        </div>
                        {/* Mini Status Badge on Avatar corner */}
                        <span className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card ${getStatusDotColor(status)}`} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm text-foreground hover:text-primary transition-colors truncate">
                          {client.name}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">{client.email}</span>
                        <span className="text-[10px] text-muted-foreground/60 font-semibold">{client.lastActive}</span>
                      </div>
                    </div>
                  </td>

                  {/* Status badge Column */}
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border ${getStatusColorClasses(status)}`}>
                      <span className={`size-1.5 rounded-full ${getStatusDotColor(status)}`} />
                      {status}
                    </span>
                  </td>

                  {/* Assigned Projects Column */}
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                      {client.projects && client.projects.length > 0 ? (
                        <>
                          {client.projects.slice(0, 2).map((proj) => (
                            <span
                              key={proj.id}
                              className="px-2 py-0.5 text-[10px] font-bold rounded bg-primary/10 text-primary border border-primary/20 max-w-[90px] truncate"
                              title={proj.title}
                            >
                              {proj.title}
                            </span>
                          ))}
                          {client.projects.length > 2 && (
                            <span
                              className="px-2 py-0.5 text-[10px] font-bold rounded bg-muted text-muted-foreground border border-border cursor-help"
                              title={client.projects.slice(2).map(p => p.title).join(", ")}
                            >
                              +{client.projects.length - 2} more
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground italic font-medium">None</span>
                      )}
                    </div>
                  </td>

                  {/* Ticket Progress Column */}
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1 items-center justify-center min-w-[120px]">
                      {client.assignedTicketsCount && client.assignedTicketsCount > 0 ? (
                        <>
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
                            <span>{client.completedTicketsCount || 0}</span>
                            <span className="text-muted-foreground">/</span>
                            <span>{client.assignedTicketsCount}</span>
                            <span className="text-[10px] text-muted-foreground/80">tickets</span>
                          </div>
                          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden border border-border/40">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.round(
                                    ((client.completedTicketsCount || 0) /
                                      client.assignedTicketsCount) *
                                      100
                                  )
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="text-[9px] font-bold text-emerald-500/80">
                            {Math.round(
                              ((client.completedTicketsCount || 0) /
                                client.assignedTicketsCount) *
                                100
                            )}% done
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground italic font-medium">No tickets</span>
                      )}
                    </div>
                  </td>

                  {/* Joined On Column */}
                  <td className="py-4 px-6 text-xs text-muted-foreground font-semibold">
                    {formatJoinedDate(client.createdAt)}
                  </td>

                  {/* Actions Column */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {status === "Pending" && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(client.email);
                            toast.success("Client email copied to clipboard!");
                          }}
                          className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-all cursor-pointer"
                          title="Copy Invitation Email"
                        >
                          <MailIcon className="size-4" />
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/dashboard/${client.id}/profile`)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
                        title="View Profile"
                      >
                        <EyeIcon className="size-4" />
                      </button>
                      {(user?.role === "owner" || user?.role === "admin") && (
                        <>
                          <button
                            onClick={() => openEditDialog(client)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
                            title="Edit Client"
                          >
                            <PencilIcon className="size-4" />
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer">
                                <MoreVerticalIcon className="size-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 bg-popover border border-border text-popover-foreground rounded-xl">
                              <DropdownMenuItem
                                className="text-destructive font-semibold cursor-pointer flex items-center gap-2"
                                onClick={() => handleRemoveClient(client.id, client.name)}
                              >
                                <Trash2Icon className="size-3.5 text-destructive" />
                                Remove Client
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
          </table>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <UsersIcon className="size-12 text-muted-foreground/50 mb-3" />
            <p className="font-bold text-foreground">No clients found</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              No client users are matching the current filters or search query.
            </p>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-2">
          {/* Status count */}
          <div className="text-xs text-muted-foreground font-semibold">
            Showing <span className="text-foreground">{startIndex + 1}</span> to{" "}
            <span className="text-foreground">
              {Math.min(startIndex + pageSize, totalCount)}
            </span>{" "}
            of <span className="text-foreground">{totalCount}</span> clients
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border border-border/60 hover:bg-muted/80 rounded-lg text-muted-foreground disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <ChevronLeftIcon className="size-4" />
              </button>

              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNum = index + 1
                const isSelected = page === pageNum
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`size-8 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground shadow"
                        : "border border-border/40 hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 border border-border/60 hover:bg-muted/80 rounded-lg text-muted-foreground disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <ChevronRightIcon className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Client Sheet */}
      <Sheet open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-6 overflow-y-auto flex flex-col gap-6 bg-background border-l border-border/50">
          <SheetHeader className="pb-4 border-b border-border/40">
            <SheetTitle className="text-xl font-black text-foreground flex items-center gap-2">
              <UserPlusIcon className="size-5 text-primary" />
              Invite Client Company
            </SheetTitle>
          </SheetHeader>
          {companyId && (
            <InviteClientForm
              companyId={companyId}
              onSuccess={() => {
                setIsInviteOpen(false)
                refetch()
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Client Profile Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-popover border border-border max-w-sm rounded-3xl p-6 text-foreground">
          <DialogHeader className="pb-3 border-b border-border/40">
            <DialogTitle className="text-foreground font-black text-lg">Edit Client details</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Update the name or role description for this client user.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 py-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Client / Company Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="w-full px-4 py-2 bg-muted/50 rounded-xl border border-border/40 focus:border-primary/50 text-sm outline-none transition-all text-foreground font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Role Description
              </label>
              <input
                type="text"
                value={editDesignation}
                onChange={(e) => setEditDesignation(e.target.value)}
                required
                className="w-full px-4 py-2 bg-muted/50 rounded-xl border border-border/40 focus:border-primary/50 text-sm outline-none transition-all text-foreground font-medium"
              />
            </div>

            {/* Projects Assignment */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <FolderIcon className="size-3.5 text-primary" />
                Assign to Projects
              </label>
              {projectsList.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-1">No projects available</p>
              ) : (
                <div className="max-h-[140px] overflow-y-auto border border-border/40 rounded-xl p-2.5 space-y-1.5 bg-muted/20">
                  {projectsList.map((project: any) => {
                    const isChecked = editProjectIds.includes(project.id)
                    return (
                      <label
                        key={project.id}
                        className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted/60 cursor-pointer transition-colors text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          className="size-3.5 rounded border-border/60 text-primary focus:ring-primary accent-primary"
                          onChange={() => {
                            if (isChecked) {
                              setEditProjectIds(editProjectIds.filter(id => id !== project.id))
                            } else {
                              setEditProjectIds([...editProjectIds, project.id])
                            }
                          }}
                        />
                        <span className="font-semibold truncate">{project.title}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            <DialogFooter className="pt-3 border-t border-border/40 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2 border border-border rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isEditSubmitting || !editName.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 font-medium rounded-xl text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isEditSubmitting ? (
                  <>
                    <Loader2Icon className="size-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
