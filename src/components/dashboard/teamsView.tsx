"use client"

import React, { useState } from "react"
import { UsersIcon, UserPlusIcon, MoreVerticalIcon, SearchIcon, FilterIcon, BriefcaseIcon, CheckIcon, PlusIcon, ShieldIcon, CrownIcon, FolderOpenIcon, UserCheckIcon, SparklesIcon, CircleDotIcon, MailIcon, CalendarIcon } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { Spinner } from "@/components/ui/spinner"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import InviteMemberForm from "@/components/dashboard/invite-member-form"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"

interface TeamMember {
  id: string
  name: string
  email: string
  role: "Owner" | "Admin" | "Member" | "Client"
  status: "Online" | "Away" | "Offline"
  lastActive: string
  initials: string
  projects?: { id: string; title: string }[]
  designation?: string | null
  createdAt?: string
  imageUrl?: string | null
  assignedTicketsCount?: number
  completedTicketsCount?: number
}

export default function TeamsView() {
  const router = useRouter()
  const [search, setSearch] = useState<string>("")
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all")
  const [isInviteOpen, setIsInviteOpen] = useState<boolean>(false)
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null)
  const [isAlertOpen, setIsAlertOpen] = useState<boolean>(false)
  
  // New States for Project Assignments
  const [isAssignOpen, setIsAssignOpen] = useState<boolean>(false)
  const [assignTargetMember, setAssignTargetMember] = useState<TeamMember | null>(null)
  const [selectedProjectIdsToAssign, setSelectedProjectIdsToAssign] = useState<string[]>([])

  const [isAssignToProjectOpen, setIsAssignToProjectOpen] = useState<boolean>(false)
  const [unassignedTargetMember, setUnassignedTargetMember] = useState<TeamMember | null>(null)
  const [selectedSingleProjectId, setSelectedSingleProjectId] = useState<string>("")
  
  const { user } = useSelector((state: RootState) => state.user)
  const companyId = user?.company?.id

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["teams", companyId],
    queryFn: async () => {
      if (!companyId) return { teams: [] }
      const response = await axios.get(`/api/teams/${companyId}`)
      return response.data
    },
    enabled: !!companyId,
  })

  const { data: projectsData } = useQuery({
    queryKey: ["projects", user?.id],
    queryFn: async () => {
      const response = await axios.get("/api/projects")
      return response.data.projects
    },
    enabled: !!user?.id,
  })

  const queryClient = useQueryClient()
  const projectsList = projectsData || []
  const currentUserRole = user?.role || ""
  const isOwner = currentUserRole === "owner"
  const isSystemAdmin = currentUserRole === "admin"

  // Allowed projects: projectsList returned from `/api/projects` is already role-filtered by the API:
  // - Owner: all company projects.
  // - Admin/Member: projects they are member of or admin of.
  const allowedProjects = projectsList;

  const adminManagedProjectIds = allowedProjects.map((p: any) => p.id)

  // Filter teamList: for admin, only show members in their projects
  const rawTeamList: TeamMember[] = data?.teams || []
  const teamList = rawTeamList.filter((member: TeamMember) => {
    if (member.role === "Client") return false
    if (isOwner) return true
    if (isSystemAdmin) {
      if (member.id === user?.id) return true
      return member.projects?.some((p: any) => adminManagedProjectIds.includes(p.id))
    }
    return true
  })

  // Stats Calculations
  const totalCompanyMembers = rawTeamList.filter(m => m.role !== "Client").length

  const totalMembersUnderMe = isOwner
    ? rawTeamList.filter(m => m.role !== "Client" && m.id !== user?.id).length
    : rawTeamList.filter(m => m.role !== "Client" && m.id !== user?.id && m.projects?.some(p => adminManagedProjectIds.includes(p.id))).length

  const totalClientsCount = isOwner
    ? rawTeamList.filter(m => m.role === "Client").length
    : rawTeamList.filter(m => m.role === "Client" && m.projects?.some(p => adminManagedProjectIds.includes(p.id))).length

  // Unassigned members: not part of any project
  const unassignedMembers = rawTeamList.filter(member => {
    if (member.role === "Owner") return false
    return !member.projects || member.projects.length === 0
  })

  const onlineCount = teamList.filter(m => m.status === "Online").length
  const adminCount = teamList.filter(m => m.role === "Admin" || m.role === "Owner").length
  const totalProjectsManaged = allowedProjects.length

  // Mutations
  const assignProjectsMutation = useMutation({
    mutationFn: async ({ memberId, projectIds }: { memberId: string; projectIds: string[] }) => {
      const response = await axios.patch(`/api/teams/${companyId}`, { memberId, projectIds })
      return response.data
    },
    onSuccess: () => {
      toast.success("Project assignments updated successfully")
      queryClient.invalidateQueries({ queryKey: ["teams", companyId] })
      setIsAssignOpen(false)
      setAssignTargetMember(null)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update assignments")
    }
  })

  const assignSingleProjectMutation = useMutation({
    mutationFn: async ({ memberId, projectId }: { memberId: string; projectId: string }) => {
      const response = await axios.patch(`/api/teams/${companyId}`, { memberId, addMemberToProjectId: projectId })
      return response.data
    },
    onSuccess: () => {
      toast.success("Member assigned to project successfully")
      queryClient.invalidateQueries({ queryKey: ["teams", companyId] })
      setIsAssignToProjectOpen(false)
      setUnassignedTargetMember(null)
      setSelectedSingleProjectId("")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to assign to project")
    }
  })

  const canRemove = (memberId: string, memberRole: string) => {
    if (memberId === user?.id) return false
    if (isOwner) return true
    return false
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    setMemberToRemove({ id: memberId, name: memberName })
    setIsAlertOpen(true)
  }

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return
    const { id: memberId, name: memberName } = memberToRemove
    try {
      await axios.delete(`/api/teams/${companyId}?memberId=${memberId}`)
      toast.success(`${memberName} has been removed successfully.`)
      refetch()
    } catch (error: any) {
      console.error(error)
      const errorMsg = error.response?.data?.error || error.response?.data?.message || "Failed to remove member"
      toast.error(errorMsg)
    } finally {
      setIsAlertOpen(false)
      setMemberToRemove(null)
    }
  }

  const filteredTeam = teamList.filter(member => {
    const matchesSearch =
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.email.toLowerCase().includes(search.toLowerCase()) ||
      member.role.toLowerCase().includes(search.toLowerCase())

    const matchesProject =
      selectedProjectId === "all" ||
      (member.projects && member.projects.some(p => p.id === selectedProjectId))

    return matchesSearch && matchesProject
  })

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="size-8 text-primary animate-spin" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading team members...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-center p-6">
        <UsersIcon className="size-10 text-destructive mb-3 animate-bounce" />
        <p className="font-semibold text-foreground">Failed to load team members</p>
        <p className="text-sm text-muted-foreground mt-1">Please try again later.</p>
      </div>
    )
  }

  const getStatusColor = (status: TeamMember["status"]) => {
    switch (status) {
      case "Online":  return "bg-emerald-500"
      case "Away":    return "bg-amber-500"
      case "Offline": return "bg-stone-400"
    }
  }

  const getRoleBadge = (role: TeamMember["role"]) => {
    switch (role) {
      case "Owner":  return "bg-purple-500/10 text-purple-500 border-purple-500/30"
      case "Admin":  return "bg-rose-500/10 text-rose-500 border-rose-500/30"
      case "Member": return "bg-primary/10 text-primary border-primary/30"
      case "Client": return "bg-blue-500/10 text-blue-500 border-blue-500/30"
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const hasResults = filteredTeam.length > 0

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 md:p-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-300">

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card via-card to-primary/[0.03] p-6 md:p-8 shadow-sm">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-blue-500/5 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">Team Management</h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-lg">Manage roles, assign projects, and review members across your workspace.</p>
          </div>
          {(user?.role === "owner" || user?.role === "admin") && (
            <button
              onClick={() => setIsInviteOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer text-sm"
            >
              <UserPlusIcon className="size-4" />
              Invite Member
            </button>
          )}
        </div>

        {/* Inline Stats Row */}
        <div className="relative z-10 mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "Total Members", value: totalCompanyMembers, icon: UsersIcon, color: "text-primary", bg: "bg-primary/10" },
            { label: "Under You", value: totalMembersUnderMe, icon: UserCheckIcon, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Projects", value: totalProjectsManaged, icon: FolderOpenIcon, color: "text-violet-500", bg: "bg-violet-500/10" },
            { label: "Clients", value: totalClientsCount, icon: BriefcaseIcon, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Online Now", value: onlineCount, icon: CircleDotIcon, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 p-3 rounded-xl bg-background/60 backdrop-blur border border-border/40">
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} shrink-0`}>
                <stat.icon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-black text-foreground leading-none">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5 truncate">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs Layout Container */}
      <Tabs defaultValue="all-members" className="w-full space-y-6">
        
        {/* Navigation & Controls Row */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-2 border-b border-border/40">
          <TabsList className="bg-muted/40 p-1 rounded-xl border border-border/30 h-10 shrink-0">
            <TabsTrigger 
              value="all-members" 
              className="rounded-lg px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all cursor-pointer"
            >
              Active Team ({filteredTeam.length})
            </TabsTrigger>
            <TabsTrigger 
              value="unassigned" 
              className="rounded-lg px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all cursor-pointer"
            >
              Unassigned ({unassignedMembers.length})
            </TabsTrigger>
          </TabsList>

          {/* Search & Project Filters */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, email, or role..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 h-9 bg-muted/30 hover:bg-muted/50 rounded-xl border border-border/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-xs outline-none transition-all text-foreground"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
              >
                <SelectTrigger className="w-full bg-muted/30 hover:bg-muted/50 rounded-xl border border-border/40 text-xs cursor-pointer text-foreground h-9 flex items-center justify-between">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border bg-popover text-popover-foreground">
                  <SelectItem value="all">All Projects</SelectItem>
                  {allowedProjects.map((project: { id: string; title: string }) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Tab 1: All Team Members */}
        <TabsContent value="all-members" className="outline-none space-y-4">
          {hasResults ? (
            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="font-semibold text-muted-foreground py-3.5 pl-6 text-xs uppercase tracking-wider">Basic Detail</TableHead>
                    <TableHead className="font-semibold text-muted-foreground py-3.5 text-xs uppercase tracking-wider">Role & Designation</TableHead>
                    <TableHead className="font-semibold text-muted-foreground py-3.5 text-xs uppercase tracking-wider">Tickets</TableHead>
                    <TableHead className="font-semibold text-muted-foreground py-3.5 text-xs uppercase tracking-wider">Projects</TableHead>
                    <TableHead className="font-semibold text-muted-foreground py-3.5 text-xs uppercase tracking-wider">Joined Date</TableHead>
                    <TableHead className="w-[50px] py-3.5 pr-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeam.map((member) => (
                    <TableRow
                      key={member.id}
                      onClick={() => router.push(`/dashboard/${member.id}/profile`)}
                      className="border-border/30 hover:bg-muted/10 cursor-pointer transition-colors duration-200"
                    >
                      <TableCell className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <Avatar className="size-10 border border-border/40">
                              <AvatarImage src={member.imageUrl || "https://github.com/shadcn.png"} alt={member.name} />
                              <AvatarFallback className="font-bold text-stone-700 dark:text-stone-300 text-xs bg-stone-200 dark:bg-stone-800 rounded-full flex items-center justify-center size-full">
                                {member.initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className={`absolute bottom-0 right-0 rounded-full border-2 border-card size-2.5 ${getStatusColor(member.status)}`} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-sm text-foreground hover:text-primary transition-colors truncate">
                              {member.name}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">{member.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getRoleBadge(member.role)}`}>
                            {member.role}
                          </span>
                          {member.designation ? (
                            <span className="text-xs text-muted-foreground font-medium">
                              {member.designation}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/60 font-medium">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground">
                              {member.assignedTicketsCount ?? 0}
                            </span>
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                              Assigned
                            </span>
                          </div>
                          <div className="h-6 w-px bg-border/60" />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500">
                              {member.completedTicketsCount ?? 0}
                            </span>
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">
                              Completed
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        {member.projects && member.projects.length > 0 ? (
                          <div className="flex flex-wrap gap-1 items-center max-w-[200px]">
                            {member.projects.slice(0, 2).map((proj) => (
                              <span
                                key={proj.id}
                                title={proj.title}
                                className="text-[9px] px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-border/40 truncate max-w-[100px]"
                              >
                                {proj.title}
                              </span>
                            ))}
                            {member.projects.length > 2 && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-semibold">
                                +{member.projects.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/60 italic">No projects</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 text-xs text-muted-foreground">
                        {formatDate(member.createdAt)}
                      </TableCell>
                      <TableCell className="py-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer">
                              <MoreVerticalIcon className="size-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 bg-popover border border-border text-popover-foreground rounded-xl">
                            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/dashboard/${member.id}/profile`)}>
                              View Profile
                            </DropdownMenuItem>
                            {isOwner && (
                              <DropdownMenuItem
                                className="cursor-pointer font-semibold text-primary"
                                onClick={() => {
                                  setAssignTargetMember(member)
                                  const initialIds = member.projects?.map(p => p.id) || []
                                  setSelectedProjectIdsToAssign(initialIds)
                                  setIsAssignOpen(true)
                                }}
                              >
                                Assign Projects
                              </DropdownMenuItem>
                            )}
                            {canRemove(member.id, member.role) && (
                              <DropdownMenuItem
                                className="text-destructive font-semibold cursor-pointer"
                                onClick={() => handleRemoveMember(member.id, member.name)}
                              >
                                Remove Member
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-16 flex flex-col items-center justify-center bg-card/40 rounded-2xl border border-dashed border-border/80 text-center">
              <UsersIcon className="size-10 text-muted-foreground/60 mb-3" />
              <p className="font-semibold text-foreground">No members found</p>
              <p className="text-sm text-muted-foreground mt-1">No team members match your search or filter.</p>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Unassigned Members */}
        <TabsContent value="unassigned" className="outline-none space-y-4">
          {unassignedMembers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {unassignedMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-4 bg-card hover:bg-card/85 border border-border/50 hover:border-primary/20 rounded-2xl flex flex-col justify-between gap-4 transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-11 border border-border">
                        {member.imageUrl ? (
                          <AvatarImage src={member.imageUrl} alt={member.name} />
                        ) : null}
                        <AvatarFallback className="text-xs font-semibold bg-primary/5 text-primary">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-foreground block truncate">{member.name}</span>
                        {member.designation && (
                          <span className="text-[11px] font-semibold text-primary block truncate mt-0.5">
                            {member.designation}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground block truncate mt-0.5">{member.email}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getRoleBadge(member.role)}`}>
                      {member.role}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/40 pt-3 mt-1">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <CalendarIcon className="size-3" />
                      Joined {formatDate(member.createdAt)}
                    </span>

                    {(isOwner || (isSystemAdmin && allowedProjects.length > 0)) && (
                      <button
                        onClick={() => {
                          setUnassignedTargetMember(member)
                          setSelectedSingleProjectId("")
                          setIsAssignToProjectOpen(true)
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 font-bold rounded-xl text-xs transition-all cursor-pointer"
                      >
                        <PlusIcon className="size-3.5" />
                        Assign Project
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 flex flex-col items-center justify-center bg-card/40 rounded-2xl border border-dashed border-border/80 text-center">
              <SparklesIcon className="size-10 text-primary/60 mb-3 animate-pulse" />
              <p className="font-semibold text-foreground">All members are assigned</p>
              <p className="text-sm text-muted-foreground mt-1">Every active user is assigned to at least one project.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Side Details Drawer (Sheet) */}
      <Sheet open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-6 overflow-y-auto flex flex-col gap-6">
          <SheetHeader className="pb-4 border-b border-border/40">
            <SheetTitle className="text-xl font-bold text-foreground">Invite New Team Member</SheetTitle>
          </SheetHeader>
          {companyId && (
            <InviteMemberForm
              companyId={companyId}
              onSuccess={() => {
                setIsInviteOpen(false)
                refetch()
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="bg-popover border border-border max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Remove Member?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-xs">
              Are you sure you want to remove <strong className="text-foreground">{memberToRemove?.name}</strong> from the company? This will remove them from all projects and revoke access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
            <AlertDialogCancel className="rounded-xl border-border/50 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl text-xs"
              onClick={confirmRemoveMember}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Owner Bulk Project Assignment Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="bg-popover border border-border max-w-md rounded-3xl p-6">
          <DialogHeader className="pb-3 border-b border-border/40">
            <DialogTitle className="text-foreground font-bold text-lg">Manage Project Assignments</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Assign or remove <strong className="text-foreground">{assignTargetMember?.name}</strong> from projects.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[300px] overflow-y-auto py-2 space-y-2">
            {projectsList.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No projects available in this company.</p>
            ) : (
              projectsList.map((project: any) => {
                const isChecked = selectedProjectIdsToAssign.includes(project.id)
                return (
                  <label
                    key={project.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-border/40 hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      className="size-4 rounded border-border/60 text-primary focus:ring-primary accent-primary"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProjectIdsToAssign([...selectedProjectIdsToAssign, project.id])
                        } else {
                          setSelectedProjectIdsToAssign(selectedProjectIdsToAssign.filter(id => id !== project.id))
                        }
                      }}
                    />
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-foreground">{project.title}</p>
                      {project.category && (
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{project.category}</p>
                      )}
                    </div>
                  </label>
                )
              })
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-border/40 flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setIsAssignOpen(false)
                setAssignTargetMember(null)
              }}
              className="px-4 py-2 border border-border rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={assignProjectsMutation.isPending}
              onClick={() => {
                if (!assignTargetMember) return
                assignProjectsMutation.mutate({
                  memberId: assignTargetMember.id,
                  projectIds: selectedProjectIdsToAssign
                })
              }}
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 font-medium rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {assignProjectsMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Member to Single Project Dialog */}
      <Dialog open={isAssignToProjectOpen} onOpenChange={setIsAssignToProjectOpen}>
        <DialogContent className="bg-popover border border-border max-w-sm rounded-3xl p-6">
          <DialogHeader className="pb-3 border-b border-border/40">
            <DialogTitle className="text-foreground font-bold text-base">Assign to Project</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Assign <strong className="text-foreground">{unassignedTargetMember?.name}</strong> to one of your projects.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <label className="text-xs font-medium text-muted-foreground">Select Project</label>
            <Select
              value={selectedSingleProjectId}
              onValueChange={setSelectedSingleProjectId}
            >
              <SelectTrigger className="w-full bg-muted/30 border border-border/50 text-foreground cursor-pointer rounded-xl h-10">
                <SelectValue placeholder="Choose a project" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border text-popover-foreground rounded-xl">
                {allowedProjects.map((project: any) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-3 border-t border-border/40 flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setIsAssignToProjectOpen(false)
                setUnassignedTargetMember(null)
                setSelectedSingleProjectId("")
              }}
              className="px-4 py-2 border border-border rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={!selectedSingleProjectId || assignSingleProjectMutation.isPending}
              onClick={() => {
                if (!unassignedTargetMember || !selectedSingleProjectId) return
                assignSingleProjectMutation.mutate({
                  memberId: unassignedTargetMember.id,
                  projectId: selectedSingleProjectId
                })
              }}
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 font-medium rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {assignSingleProjectMutation.isPending ? "Assigning..." : "Assign"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
