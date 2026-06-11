"use client"

import React, { useState } from "react"
import { UsersIcon, UserPlusIcon, MoreVerticalIcon, SearchIcon, FilterIcon } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { Spinner } from "@/components/ui/spinner"
import { useRouter } from "next/navigation"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
}

export default function TeamsView() {
  const router = useRouter()
  const [search, setSearch] = useState<string>("")
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all")
  const [isInviteOpen, setIsInviteOpen] = useState<boolean>(false)
  
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

  const projectsList = projectsData || []
  const teamList: TeamMember[] = (data?.teams || []).filter((member: TeamMember) => member.role !== "Client")

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
    <div className="flex-1 flex flex-col gap-6 p-6 md:p-8 max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-300">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">my team</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage, add, and review roles of members in your workspace.</p>
        </div>
        {(user?.role === "owner" || user?.role === "admin") && (
          <button 
            onClick={() => setIsInviteOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 font-medium rounded-xl shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
          >
            <UserPlusIcon className="size-4" />
            Invite Member
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Members", value: teamList.length, desc: "Across workspace" },
          { label: "Active Admins", value: teamList.filter(m => m.role === "Admin" || m.role === "Owner").length, desc: "Management team" },
          { label: "Online Now", value: teamList.filter(m => m.status === "Online").length, desc: "Ready to collaborate" },
          { label: "Pending Invites", value: 0, desc: "Awaiting response" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-card border border-border/60 p-4 rounded-2xl shadow-2xs">
            <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1.5">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 bg-card/65 backdrop-blur-md p-4 rounded-2xl border border-border/60">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-muted/50 rounded-xl border border-border/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-sm outline-none transition-all"
          />
        </div>
        <div className="w-full sm:w-52">
          <Select
            value={selectedProjectId}
            onValueChange={setSelectedProjectId}
          >
            <SelectTrigger className="w-full bg-muted/50 rounded-xl border border-border/40 text-sm cursor-pointer text-foreground py-2 h-9 flex items-center justify-between">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-border bg-popover text-popover-foreground">
              <SelectItem value="all">All Projects</SelectItem>
              {projectsList.map((project: { id: string; title: string }) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Team Table */}
      {hasResults ? (
        <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="font-semibold text-muted-foreground py-3.5 pl-6">Basic Detail</TableHead>
                <TableHead className="font-semibold text-muted-foreground py-3.5">Role</TableHead>
                <TableHead className="font-semibold text-muted-foreground py-3.5">Designation</TableHead>
                <TableHead className="font-semibold text-muted-foreground py-3.5">Projects</TableHead>
                <TableHead className="font-semibold text-muted-foreground py-3.5">Joined Date</TableHead>
                <TableHead className="w-[50px] py-3.5 pr-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeam.map((member) => (
                <TableRow
                  key={member.id}
                  onClick={() => router.push(`/dashboard/${member.id}/profile`)}
                  className="border-border/40 hover:bg-muted/15 cursor-pointer transition-colors duration-200"
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
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getRoleBadge(member.role)}`}>
                      {member.role}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 text-xs font-medium text-foreground/80">
                    {member.designation || <span className="text-muted-foreground/60">—</span>}
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
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/${member.id}/profile`)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/${member.id}/profile`)}>
                          View Full Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Message
                        </DropdownMenuItem>
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

    </div>
  )
}
