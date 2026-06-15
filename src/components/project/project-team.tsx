import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  UsersIcon, 
  Trash2Icon, 
  Search, 
  Mail, 
  Briefcase, 
  X, 
  ChevronRight 
} from "lucide-react"
import { ProjectDetail, getInitials } from "./utils"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import axios from "axios"
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
  SelectValue 
} from "@/components/ui/select"
import { 
  Avatar, 
  AvatarImage, 
  AvatarFallback 
} from "@/components/ui/avatar"

interface ProjectTeamProps {
  projectData: ProjectDetail
  userId: string
}

interface MemberCardProps {
  member: any
  role: "admin" | "member"
  userId: string
  canRemove: boolean
  onRemove: () => void
  activeTicketsCount: number
  totalTicketsCount: number
}

function AdminRowCard({
  member,
  userId,
  canRemove,
  onRemove,
  activeTicketsCount,
  totalTicketsCount,
}: Omit<MemberCardProps, "role">) {
  const router = useRouter()

  const completedTicketsCount = totalTicketsCount - activeTicketsCount
  const completionRate = totalTicketsCount > 0 
    ? Math.round((completedTicketsCount / totalTicketsCount) * 100) 
    : 0

  // Determine workload status
  let workloadLabel = "Available"
  let workloadColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
  let workloadDot = "bg-emerald-500"

  if (activeTicketsCount > 0) {
    if (activeTicketsCount < 2) {
      workloadLabel = "Light Load"
      workloadColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      workloadDot = "bg-emerald-500"
    } else if (activeTicketsCount < 5) {
      workloadLabel = "On Track"
      workloadColor = "bg-blue-500/10 text-blue-500 border-blue-500/20"
      workloadDot = "bg-blue-500"
    } else {
      workloadLabel = "High Workload"
      workloadColor = "bg-red-500/10 text-red-500 border-red-500/20"
      workloadDot = "bg-red-500 animate-pulse"
    }
  }

  return (
    <div 
      className="bg-card/45 backdrop-blur-md border border-border/50 hover:border-rose-500/40 p-4.5 hover:bg-card/90 rounded-2xl transition-all duration-300 hover:shadow-md cursor-pointer group flex flex-col md:flex-row items-center justify-between gap-4 relative w-full hover:-translate-y-0.5"
      onClick={() => router.push(`/dashboard/${userId}/profile?targetUserId=${member.id}`)}
    >
      {/* Left section: Avatar & Names */}
      <div className="flex items-center gap-4 min-w-0 self-start md:self-auto">
        <div className="relative shrink-0">
          <Avatar className="size-12 rounded-full border-2 border-rose-500/30 group-hover:border-rose-500/60 group-hover:scale-105 transition-all duration-300 shadow-sm">
            <AvatarImage 
              src={member.imageUrl || undefined} 
              alt={member.name}
              className="object-cover"
            />
            <AvatarFallback className="size-full flex items-center justify-center text-sm font-black tracking-wider rounded-full bg-gradient-to-br from-rose-500/20 to-amber-500/20 text-rose-500">
              {getInitials(member.name)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-foreground group-hover:text-primary transition-colors truncate">
              {member.name}
            </span>
            <span className="px-2 py-0.5 text-[9px] font-black rounded-full border bg-rose-500/10 text-rose-500 border-rose-500/20 capitalize tracking-wider">
              Admin
            </span>
          </div>
          <span className="text-xs text-muted-foreground truncate block mt-0.5 font-semibold">
            {member.designation || "Project Admin"}
          </span>
        </div>
      </div>

      {/* Middle section: Email Info */}
      <div className="flex items-center gap-1.5 md:mx-auto min-w-0 self-start md:self-auto pl-16 md:pl-0">
        <Mail className="size-3.5 text-muted-foreground/60 shrink-0" />
        <span className="text-xs text-muted-foreground/85 truncate max-w-[200px] font-medium">
          {member.email}
        </span>
        <a 
          href={`mailto:${member.email}`}
          onClick={(e) => e.stopPropagation()}
          className="p-1 rounded-md text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
          title="Send Email"
        >
          <Mail className="size-3" />
        </a>
      </div>

      {/* Right section: Workload Progress & Remove Action */}
      <div className="flex items-center gap-6 w-full md:w-auto self-start md:self-auto pl-16 md:pl-0 md:justify-end">
        {/* Workload Status */}
        <span className={`px-2 py-0.5 rounded text-[9px] font-black border flex items-center gap-1 shrink-0 ${workloadColor}`}>
          <span className={`size-1.5 rounded-full ${workloadDot}`} />
          {workloadLabel}
        </span>

        {/* Progress bar */}
        {totalTicketsCount > 0 ? (
          <div className="hidden sm:flex flex-col gap-1 w-32 shrink-0">
            <div className="flex justify-between text-[9px] text-muted-foreground font-semibold">
              <span>Progress</span>
              <span>{completedTicketsCount}/{totalTicketsCount} ({completionRate}%)</span>
            </div>
            <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden border border-border/20">
              <div 
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        ) : (
          <span className="hidden sm:inline text-[10px] text-muted-foreground/75 italic shrink-0">No tasks</span>
        )}

        {/* Remove button */}
        {canRemove ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0 cursor-pointer"
            title="Remove from project"
          >
            <Trash2Icon className="size-4" />
          </button>
        ) : (
          // Empty spacing to align with other cards
          <div className="size-8 shrink-0 hidden group-hover:block" />
        )}
      </div>
    </div>
  )
}

function MemberCard({
  member,
  role,
  userId,
  canRemove,
  onRemove,
  activeTicketsCount,
  totalTicketsCount,
}: MemberCardProps) {
  const router = useRouter()

  const completedTicketsCount = totalTicketsCount - activeTicketsCount
  const completionRate = totalTicketsCount > 0 
    ? Math.round((completedTicketsCount / totalTicketsCount) * 100) 
    : 0

  // Determine workload status
  let workloadLabel = "Available"
  let workloadColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
  let workloadDot = "bg-emerald-500"

  if (activeTicketsCount > 0) {
    if (activeTicketsCount < 2) {
      workloadLabel = "Light Load"
      workloadColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      workloadDot = "bg-emerald-500"
    } else if (activeTicketsCount < 5) {
      workloadLabel = "On Track"
      workloadColor = "bg-blue-500/10 text-blue-500 border-blue-500/20"
      workloadDot = "bg-blue-500"
    } else {
      workloadLabel = "High Workload"
      workloadColor = "bg-red-500/10 text-red-500 border-red-500/20"
      workloadDot = "bg-red-500 animate-pulse"
    }
  }

  return (
    <div 
      className="bg-card/45 backdrop-blur-md border border-border/50 hover:border-primary/45 p-5 hover:bg-card/90 rounded-3xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 cursor-pointer group flex flex-col items-center text-center gap-4 relative hover:-translate-y-1 hover:scale-[1.01]"
      onClick={() => router.push(`/dashboard/${userId}/profile?targetUserId=${member.id}`)}
    >
      {/* Delete/Remove button */}
      {canRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="absolute top-4 right-4 p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 cursor-pointer"
          title="Remove from project"
        >
          <Trash2Icon className="size-4" />
        </button>
      )}

      {/* Avatar Container using Shadcn Avatar with Glow & Role Indicator */}
      <div className="relative">
        <Avatar className={`size-16 rounded-full border-2 ${
          role === "admin" 
            ? "border-rose-500/30 group-hover:border-rose-500/60" 
            : "border-blue-500/30 group-hover:border-blue-500/60"
        } group-hover:scale-105 transition-all duration-300 shadow-sm`}>
          <AvatarImage 
            src={member.imageUrl || undefined} 
            alt={member.name}
            className="object-cover"
          />
          <AvatarFallback className={`size-full flex items-center justify-center text-lg font-black tracking-wider rounded-full bg-gradient-to-br ${
            role === "admin" 
              ? "from-rose-500/20 to-amber-500/20 text-rose-500" 
              : "from-blue-500/20 to-primary/20 text-blue-500"
          }`}>
            {getInitials(member.name)}
          </AvatarFallback>
        </Avatar>
        
        {/* Glowing aura inside card on hover */}
        <div className={`absolute -inset-1 rounded-full blur-xs opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10 ${
          role === "admin" ? "bg-rose-500" : "bg-blue-500"
        }`} />
      </div>
      
      {/* Information */}
      <div className="flex flex-col min-w-0 items-center w-full">
        <span className="text-sm font-extrabold text-foreground group-hover:text-primary transition-colors truncate w-full max-w-[200px]">
          {member.name}
        </span>
        <span className="text-xs text-muted-foreground truncate w-full max-w-[200px] mt-0.5 font-semibold">
          {member.designation || (role === "admin" ? "Project Admin" : "Project Collaborator")}
        </span>
        
        {/* Email link / copy action */}
        <div className="flex items-center justify-center gap-1.5 mt-1.5 w-full">
          <span className="text-[10px] text-muted-foreground/85 truncate max-w-[160px] block">
            {member.email}
          </span>
          <a 
            href={`mailto:${member.email}`}
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded-md text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
            title="Send Email"
          >
            <Mail className="size-3" />
          </a>
        </div>
      </div>

      {/* Role Badge */}
      <span className={`px-2.5 py-0.5 text-[9px] font-black rounded-full border capitalize tracking-wider ${
        role === "admin" 
          ? "bg-rose-500/10 text-rose-500 border-rose-500/20" 
          : "bg-blue-500/10 text-blue-500 border-blue-500/20"
      }`}>
        {role === "admin" ? "Admin" : "Member"}
      </span>

      {/* Workload Section */}
      <div className="w-full border-t border-border/40 pt-3.5 flex flex-col gap-2 mt-1">
        <div className="flex items-center justify-between text-[10px] font-bold">
          <span className="text-muted-foreground">Workload</span>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border flex items-center gap-1 shrink-0 ${workloadColor}`}>
            <span className={`size-1.5 rounded-full ${workloadDot}`} />
            {workloadLabel}
          </span>
        </div>

        {totalTicketsCount > 0 ? (
          <div className="w-full space-y-1">
            <div className="flex justify-between text-[9px] text-muted-foreground font-semibold">
              <span>Progress</span>
              <span>{completedTicketsCount}/{totalTicketsCount} tasks ({completionRate}%)</span>
            </div>
            <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden border border-border/20">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  activeTicketsCount >= 5 ? "bg-red-500" : "bg-primary"
                }`}
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground/75 italic">No tasks assigned</p>
        )}
      </div>

      {/* Hover visual cue */}
      <span className="text-[10px] font-black text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-0.5 mt-1 scale-95 group-hover:scale-100">
        View Profile <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
      </span>
    </div>
  )
}

export default function ProjectTeam({ projectData, userId }: ProjectTeamProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useSelector((state: RootState) => state.user)
  const userRole = user?.role || ""
  const isOwner = userRole === "owner"
  const isProjectAdmin = projectData.admins?.some((a) => a.id === user?.id)

  const [memberToRemove, setMemberToRemove] = useState<any | null>(null)
  const [isAlertOpen, setIsAlertOpen] = useState(false)

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "member">("all")
  const [workloadFilter, setWorkloadFilter] = useState<"all" | "none" | "under-2" | "under-5" | "over-5">("all")

  // Don't keep client in project team
  const admins = (projectData.admins || []).filter(a => a.role !== "client")
  const members = (projectData.members || []).filter(m => m.role !== "client")

  // Compute unique collaborators list
  const uniqueCollaborators = Array.from(new Set([
    ...admins.map(a => a.id),
    ...members.map(m => m.id)
  ])).map(id => {
    return admins.find(a => a.id === id) || members.find(m => m.id === id)
  }).filter((u): u is NonNullable<typeof u> => !!u)

  const totalTeamSize = uniqueCollaborators.length
  
  const activeTickets = projectData.tickets?.filter(t => 
    t.status.toLowerCase() !== "completed"
  ) || []
  const activeTicketsCount = activeTickets.length

  // Ticket counters for users
  const getUserTotalTicketsCount = (memberId: string) => {
    return projectData.tickets?.filter(t => t.assignedUserId === memberId).length || 0
  }

  const getUserActiveTicketsCount = (memberId: string) => {
    return projectData.tickets?.filter(t => 
      t.assignedUserId === memberId && t.status.toLowerCase() !== "completed"
    ).length || 0
  }

  const canRemoveMember = (member: any) => {
    if (member.id === user?.id) return false
    if (isOwner) return true
    if (userRole === "admin" && isProjectAdmin) {
      const roleLower = (member.role || "member").toLowerCase()
      return roleLower !== "owner" && roleLower !== "admin"
    }
    return false
  }

  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await axios.delete(`/api/projects/${projectData.id}?memberId=${memberId}`)
      return res.data
    },
    onSuccess: () => {
      toast.success("Member removed from project successfully")
      queryClient.invalidateQueries({ queryKey: ["project", projectData.id] })
      setIsAlertOpen(false)
      setMemberToRemove(null)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to remove member")
    }
  })

  // Filter helper
  const filterMembersList = (list: typeof admins) => {
    return list.filter(m => {
      // 1. Search Query
      const query = searchQuery.toLowerCase().trim()
      const matchesSearch = !query || 
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        (m.designation && m.designation.toLowerCase().includes(query))

      if (!matchesSearch) return false

      // 2. Workload Filter
      const activeCount = getUserActiveTicketsCount(m.id)
      if (workloadFilter === "none" && activeCount > 0) return false
      if (workloadFilter === "under-2" && activeCount >= 2) return false
      if (workloadFilter === "under-5" && activeCount >= 5) return false
      if (workloadFilter === "over-5" && activeCount < 5) return false

      return true
    })
  }

  const filteredAdmins = roleFilter === "member" ? [] : filterMembersList(admins)
  const filteredMembers = roleFilter === "admin" ? [] : filterMembersList(members)

  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Top Heading / Project Name Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/30 pb-5">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <UsersIcon className="size-6 text-primary" />
            Project Team
          </h2>
          {admins.length > 0 ? (
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
              Admin{admins.length > 1 ? "s" : ""}: <span className="text-foreground font-bold">{admins.map(a => a.name).join(", ")}</span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">Admins and members collaborating on this project.</p>
          )}
        </div>

        {/* 2 KPIs inside the heading row */}
        <div className="flex items-center gap-4 shrink-0">
          {/* KPI 1: Collaborators */}
          <div className="bg-card/45 backdrop-blur-md border border-border/50 rounded-xl px-4 py-2 hover:border-primary/25 transition-all flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/15 shrink-0">
              <UsersIcon className="size-4" />
            </div>
            <div className="leading-tight">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Collaborators</span>
              <p className="text-sm font-black text-foreground">{totalTeamSize}</p>
            </div>
          </div>

          {/* KPI 2: Active Tasks */}
          <div className="bg-card/45 backdrop-blur-md border border-border/50 rounded-xl px-4 py-2 hover:border-primary/25 transition-all flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/15 shrink-0">
              <Briefcase className="size-4" />
            </div>
            <div className="leading-tight">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Active Tasks</span>
              <p className="text-sm font-black text-foreground">{activeTicketsCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admins Row Section (Full width row above search/filters) */}
      {filteredAdmins.length > 0 && (
        <div className="flex flex-col gap-3.5 w-full">
          <h3 className="text-xs font-extrabold text-rose-500 uppercase tracking-widest flex items-center gap-2 pl-1">
            <span className="size-1.5 rounded-full bg-rose-500 animate-ping" />
            Project Admins ({filteredAdmins.length})
          </h3>
          <div className="flex flex-col gap-3 w-full">
            {filteredAdmins.map((member) => (
              <AdminRowCard 
                key={member.id}
                member={member}
                userId={userId}
                canRemove={canRemoveMember(member)}
                onRemove={() => {
                  setMemberToRemove(member)
                  setIsAlertOpen(true)
                }}
                activeTicketsCount={getUserActiveTicketsCount(member.id)}
                totalTicketsCount={getUserTotalTicketsCount(member.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Control Bar (Search & Filter) */}
      <div className="bg-card/35 backdrop-blur-md border border-border/50 rounded-2xl p-4.5 flex flex-col md:flex-row items-center gap-4 w-full">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
          <input 
            type="text" 
            placeholder="Search team members by name, role, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-border/60 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold text-foreground placeholder-muted-foreground/60 focus:outline-hidden focus:ring-1 focus:ring-primary/45 focus:border-primary/45 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Filters using Shadcn Select */}
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Role Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Role:</span>
            <Select value={roleFilter} onValueChange={(val: any) => setRoleFilter(val)}>
              <SelectTrigger className="w-[140px] bg-background border border-border/60 rounded-xl text-xs font-semibold h-9 focus:ring-1 focus:ring-primary/45">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border rounded-xl">
                <SelectItem value="all" className="text-xs font-medium cursor-pointer">All Roles</SelectItem>
                <SelectItem value="admin" className="text-xs font-medium cursor-pointer">Admins Only</SelectItem>
                <SelectItem value="member" className="text-xs font-medium cursor-pointer">Members Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Workload Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Workload:</span>
            <Select value={workloadFilter} onValueChange={(val: any) => setWorkloadFilter(val)}>
              <SelectTrigger className="w-[170px] bg-background border border-border/60 rounded-xl text-xs font-semibold h-9 focus:ring-1 focus:ring-primary/45">
                <SelectValue placeholder="All Workloads" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border rounded-xl">
                <SelectItem value="all" className="text-xs font-medium cursor-pointer">All Workloads</SelectItem>
                <SelectItem value="none" className="text-xs font-medium cursor-pointer">No tasks</SelectItem>
                <SelectItem value="under-2" className="text-xs font-medium cursor-pointer">Less than 2 tasks</SelectItem>
                <SelectItem value="under-5" className="text-xs font-medium cursor-pointer">Less than 5 tasks</SelectItem>
                <SelectItem value="over-5" className="text-xs font-medium cursor-pointer">Greater than 5 tasks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters */}
          {(searchQuery || roleFilter !== "all" || workloadFilter !== "all") && (
            <button 
              onClick={() => {
                setSearchQuery("")
                setRoleFilter("all")
                setWorkloadFilter("all")
              }}
              className="px-3 py-2 border border-dashed border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/10 font-bold rounded-xl text-xs transition-colors cursor-pointer h-9 flex items-center justify-center"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Grid of Members */}
      <div className="space-y-8 w-full">
        {/* Render filtered members */}
        {filteredMembers.length > 0 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-extrabold text-foreground/80 uppercase tracking-widest flex items-center gap-2 pl-1">
              <span className="size-1.5 rounded-full bg-blue-500" />
              Project Members ({filteredMembers.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
              {filteredMembers.map((member) => (
                <MemberCard 
                  key={member.id}
                  member={member}
                  role="member"
                  userId={userId}
                  canRemove={canRemoveMember(member)}
                  onRemove={() => {
                    setMemberToRemove(member)
                    setIsAlertOpen(true)
                  }}
                  activeTicketsCount={getUserActiveTicketsCount(member.id)}
                  totalTicketsCount={getUserTotalTicketsCount(member.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State if both lists are empty */}
        {filteredAdmins.length === 0 && filteredMembers.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center bg-card/20 rounded-3xl border border-dashed border-border/80 text-center w-full max-w-lg mx-auto gap-4 p-8 animate-in fade-in duration-300">
            <div className="p-4 rounded-full bg-muted/60 text-muted-foreground border border-border/40">
              <UsersIcon className="size-10 opacity-40" />
            </div>
            <div>
              <h4 className="font-bold text-foreground">No team members found</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                We couldn't find any team members matching your search query or filters.
              </p>
            </div>
            <button 
              onClick={() => {
                setSearchQuery("")
                setRoleFilter("all")
                setWorkloadFilter("all")
              }}
              className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="bg-popover border border-border max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Remove from Project?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-xs leading-relaxed">
              Are you sure you want to remove <strong className="text-foreground">{memberToRemove?.name}</strong> from this project? They will no longer have access to this project's boards, sprints, or files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-4">
            <AlertDialogCancel className="rounded-xl border-border/50 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl text-xs cursor-pointer font-bold"
              onClick={() => {
                if (memberToRemove) {
                  removeMutation.mutate(memberToRemove.id)
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
