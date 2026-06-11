"use client"

import React, { useState } from "react"
import { UsersIcon, UserPlusIcon, MailIcon, ShieldCheckIcon, MoreVerticalIcon, SearchIcon, BriefcaseIcon } from "lucide-react"
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
}

export default function ClientsPage() {
  const router = useRouter()
  const [search, setSearch] = useState<string>("")
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

  const clientList: TeamMember[] = (data?.teams || []).filter(
    (member: TeamMember) => member.role === "Client"
  )

  const filteredClients = clientList.filter(
    (client) =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.email.toLowerCase().includes(search.toLowerCase())
  )

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

  const getStatusColor = (status: TeamMember["status"]) => {
    switch (status) {
      case "Online":
        return "bg-emerald-500 ring-emerald-500/20"
      case "Away":
        return "bg-amber-500 ring-amber-500/20"
      case "Offline":
        return "bg-stone-400 ring-stone-400/20"
    }
  }

  return (
    <div className="flex-1 flex flex-col gap-6 p-6 md:p-8 max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">clients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage, add, and review clients of your company.
          </p>
        </div>
        {(user?.role === "owner" || user?.role === "admin") && (
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 font-medium rounded-xl shadow-sm hover:shadow transition-all duration-200 cursor-pointer">
            <UserPlusIcon className="size-4" />
            Invite Client
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Clients", value: clientList.length, desc: "Across company" },
          { label: "Online Now", value: clientList.filter((c) => c.status === "Online").length, desc: "Active right now" },
          { label: "Offline Now", value: clientList.filter((c) => c.status === "Offline").length, desc: "Inactive clients" },
          { label: "Pending Invites", value: 0, desc: "Awaiting registration" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-card border border-border/60 p-4 rounded-2xl shadow-2xs">
            <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1.5">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/65 backdrop-blur-md p-4 rounded-2xl border border-border/60">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-muted/50 rounded-xl border border-border/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-sm outline-none transition-all"
          />
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <div
              key={client.id}
              id={client.id}
              className="group bg-card hover:bg-accent/5 hover:border-primary/30 border border-border/60 p-5 rounded-2xl shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between gap-4"
            >
              {/* Client Card Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="size-10 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-xs font-bold text-stone-700 dark:text-stone-300 border border-border/40">
                      {client.initials}
                    </div>
                    {/* Status Dot */}
                    <span className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-card ring-4 ${getStatusColor(client.status)}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors duration-200">
                      {client.name}
                    </h3>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {client.lastActive}
                    </span>
                  </div>
                </div>

                <button className="p-1 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                  <MoreVerticalIcon className="size-4" />
                </button>
              </div>

              {/* Client Info */}
              <div className="space-y-2 text-xs border-t border-border/40 pt-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MailIcon className="size-3.5" />
                  <span className="text-foreground/80 truncate">{client.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheckIcon className="size-3.5" />
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md border bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25">
                    {client.role}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => router.push(`/dashboard/${client.id}/profile`)}
                  className="flex-1 text-center py-1.5 border border-border bg-transparent hover:bg-muted text-foreground/90 font-medium text-xs rounded-lg transition-colors cursor-pointer"
                >
                  View Profile
                </button>
                <button className="flex-1 text-center py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs rounded-lg transition-colors cursor-pointer">
                  Message
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 flex flex-col items-center justify-center bg-card/40 rounded-2xl border border-dashed border-border/80 text-center">
            <UsersIcon className="size-10 text-muted-foreground/60 mb-3" />
            <p className="font-semibold text-foreground">No clients found</p>
            <p className="text-sm text-muted-foreground mt-1">No clients match your search term.</p>
          </div>
        )}
      </div>
    </div>
  )
}
