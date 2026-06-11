"use client"

import React, { useState } from "react"
import { UsersIcon, UserPlusIcon, MailIcon, ShieldCheckIcon, MoreVerticalIcon, SearchIcon, FilterIcon, CrownIcon } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { Spinner } from "@/components/ui/spinner"
import { useRouter } from "next/navigation"


interface TeamMember {
  id: string
  name: string
  email: string
  role: "Owner" | "Admin" | "Member" | "Client"
  status: "Online" | "Away" | "Offline"
  lastActive: string
  initials: string
  projects?: { id: string; title: string }[]
}


export default function TeamsView() {
  const router = useRouter()
  const [search, setSearch] = useState<string>("")
  const [selectedProjectId, setSelectedProjectId] = useState<string>("all")
  const { user } = useSelector((state: RootState) => state.user)
  const companyId = user?.company?.id

  const { data, isLoading, isError } = useQuery({
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

  const owners  = filteredTeam.filter(m => m.role === "Owner")
  const admins  = filteredTeam.filter(m => m.role === "Admin")
  const members = filteredTeam.filter(m => m.role === "Member")

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

  const canViewProfile = (memberId: string) =>
    user?.role === "owner" || user?.role === "admin" || memberId === user?.id

  /** Shared member card — size variant controls scale for the owner tier */
  const MemberCard = ({ member, size = "normal" }: { member: TeamMember; size?: "large" | "normal" }) => (
    <div
      id={member.id}
      className={`group bg-card border border-border/60 rounded-2xl shadow-xs hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-300 flex flex-col justify-between gap-4 ${
        size === "large" ? "p-6" : "p-5"
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center font-bold text-stone-700 dark:text-stone-300 border border-border/40 ${size === "large" ? "size-14 text-base" : "size-10 text-xs"}`}>
              {member.initials}
            </div>
            <span className={`absolute bottom-0 right-0 rounded-full border-2 border-card ${getStatusColor(member.status)} ${size === "large" ? "size-3.5" : "size-2.5"}`} />
          </div>
          <div>
            <h3 className={`font-bold text-foreground group-hover:text-primary transition-colors duration-200 ${size === "large" ? "text-base" : "text-sm"}`}>
              {member.name}
            </h3>
            <span className="text-xs text-muted-foreground">{member.lastActive}</span>
          </div>
        </div>
        <button className="p-1 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
          <MoreVerticalIcon className="size-4" />
        </button>
      </div>

      {/* Info */}
      <div className="space-y-2 text-xs border-t border-border/40 pt-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MailIcon className="size-3.5 shrink-0" />
          <span className="text-foreground/80 truncate">{member.email}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <ShieldCheckIcon className="size-3.5 shrink-0" />
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getRoleBadge(member.role)}`}>
            {member.role}
          </span>
        </div>
        {member.projects && member.projects.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {member.projects.map(proj => (
              <span
                key={proj.id}
                title={proj.title}
                className="text-[9px] px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-border/40 truncate max-w-[110px]"
              >
                {proj.title}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {canViewProfile(member.id) ? (
          <>
            <button
              onClick={() => router.push(`/dashboard/${member.id}/profile`)}
              className="flex-1 py-1.5 border border-border bg-transparent hover:bg-muted text-foreground/90 font-medium text-xs rounded-lg transition-colors cursor-pointer text-center"
            >
              View Profile
            </button>
            <button className="flex-1 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs rounded-lg transition-colors cursor-pointer text-center">
              Message
            </button>
          </>
        ) : (
          <button className="w-full py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs rounded-lg transition-colors cursor-pointer text-center">
            Message
          </button>
        )}
      </div>
    </div>
  )

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
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 font-medium rounded-xl shadow-sm hover:shadow transition-all duration-200 cursor-pointer">
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
        <div className="relative w-full sm:w-52">
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            className="w-full pl-3 pr-8 py-2 bg-muted/50 rounded-xl border border-border/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-sm outline-none appearance-none cursor-pointer text-foreground transition-all"
          >
            <option value="all" className="bg-background">All Projects</option>
            {projectsList.map((project: any) => (
              <option key={project.id} value={project.id} className="bg-background">{project.title}</option>
            ))}
          </select>
          <FilterIcon className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* ─── Hierarchy Tree ─── */}
      {hasResults ? (
        <div className="flex flex-col items-center gap-0">

          {/* ── Level 1: Owner ── */}
          {owners.length > 0 && (
            <div className="w-full flex flex-col items-center">
              {/* Label */}
              <div className="flex items-center gap-2 mb-3">
                <CrownIcon className="size-3.5 text-purple-400" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-purple-400">Owner</span>
              </div>

              {/* Owner card(s) — centered, capped width */}
              <div className="flex gap-4 justify-center flex-wrap">
                {owners.map(m => (
                  <div key={m.id} className="w-full max-w-sm">
                    <div className="ring-1 ring-purple-500/30 rounded-2xl shadow-lg shadow-purple-500/5">
                      <MemberCard member={m} size="large" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Connector down */}
              {(admins.length > 0 || members.length > 0) && (
                <div className="flex flex-col items-center mt-1">
                  <div className="w-px h-8 bg-border/60" />
                  <div className="w-2 h-2 rounded-full bg-border/80" />
                </div>
              )}
            </div>
          )}

          {/* ── Level 2: Admins ── */}
          {admins.length > 0 && (
            <div className="w-full flex flex-col items-center">
              {/* Label */}
              <div className="flex items-center gap-2 mt-2 mb-3">
                <ShieldCheckIcon className="size-3.5 text-rose-400" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-rose-400">Admins</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  {admins.length}
                </span>
              </div>

              {/* Horizontal spread line if multiple admins */}
              {admins.length > 1 && (
                <div className="relative flex justify-center w-full mb-3">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-border/60" />
                  <div className="flex justify-around w-2/3">
                    {admins.map(m => (
                      <div key={m.id} className="w-px h-4 bg-border/60" />
                    ))}
                  </div>
                </div>
              )}

              <div className={`w-full grid gap-4 ${
                admins.length === 1 ? "max-w-sm mx-auto" :
                admins.length === 2 ? "grid-cols-2 max-w-2xl mx-auto" :
                "grid-cols-2 lg:grid-cols-3"
              }`}>
                {admins.map(m => (
                  <div key={m.id} className="ring-1 ring-rose-500/20 rounded-2xl shadow-md shadow-rose-500/5">
                    <MemberCard member={m} />
                  </div>
                ))}
              </div>

              {/* Connector down */}
              {members.length > 0 && (
                <div className="flex flex-col items-center mt-1">
                  <div className="w-px h-8 bg-border/60" />
                  <div className="w-2 h-2 rounded-full bg-border/80" />
                </div>
              )}
            </div>
          )}

          {/* ── Level 3: Members ── */}
          {members.length > 0 && (
            <div className="w-full flex flex-col items-center">
              {/* Label */}
              <div className="flex items-center gap-2 mt-2 mb-3">
                <UsersIcon className="size-3.5 text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-primary">Members</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30">
                  {members.length}
                </span>
              </div>

              {/* Spread line */}
              {members.length > 1 && (
                <div className="relative flex justify-center w-full mb-3">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-border/60" />
                  <div className="flex justify-around w-full">
                    {members.map(m => (
                      <div key={m.id} className="w-px h-4 bg-border/60" />
                    ))}
                  </div>
                </div>
              )}

              <div className="w-full grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {members.map(m => (
                  <MemberCard key={m.id} member={m} />
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="py-16 flex flex-col items-center justify-center bg-card/40 rounded-2xl border border-dashed border-border/80 text-center">
          <UsersIcon className="size-10 text-muted-foreground/60 mb-3" />
          <p className="font-semibold text-foreground">No members found</p>
          <p className="text-sm text-muted-foreground mt-1">No team members match your search or filter.</p>
        </div>
      )}

    </div>
  )
}
