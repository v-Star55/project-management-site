import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  UsersIcon,
  Trash2Icon,
  Search,
  Mail,
  Briefcase,
  X,
  ChevronRight,
  UserPlusIcon,
  CheckIcon,
  ShieldAlertIcon,
  Loader2Icon,
  FilterIcon,
  Trophy,
  Crown,
  Sparkles,
  Clock,
  TrendingUp,
  ThumbsUp,
  Award
} from "lucide-react"
import { ProjectDetail, getInitials } from "./utils"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

interface ProjectTeamProps {
  projectData: ProjectDetail
  userId: string
  companyId?: string
  userRole?: string
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
        <Avatar className={`size-16 rounded-full border-2 ${role === "admin"
            ? "border-rose-500/30 group-hover:border-rose-500/60"
            : "border-blue-500/30 group-hover:border-blue-500/60"
          } group-hover:scale-105 transition-all duration-300 shadow-sm`}>
          <AvatarImage
            src={member.imageUrl || undefined}
            alt={member.name}
            className="object-cover"
          />
          <AvatarFallback className={`size-full flex items-center justify-center text-lg font-black tracking-wider rounded-full bg-gradient-to-br ${role === "admin"
              ? "from-rose-500/20 to-amber-500/20 text-rose-500"
              : "from-blue-500/20 to-primary/20 text-blue-500"
            }`}>
            {getInitials(member.name)}
          </AvatarFallback>
        </Avatar>

        {/* Glowing aura inside card on hover */}
        <div className={`absolute -inset-1 rounded-full blur-xs opacity-0 group-hover:opacity-20 transition-opacity duration-300 -z-10 ${role === "admin" ? "bg-rose-500" : "bg-blue-500"
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
      <span className={`px-2.5 py-0.5 text-[9px] font-black rounded-full border capitalize tracking-wider ${role === "admin"
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
                className={`h-full rounded-full transition-all duration-500 ${activeTicketsCount >= 5 ? "bg-red-500" : "bg-primary"
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

export default function ProjectTeam({ projectData, userId, companyId, userRole }: ProjectTeamProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useSelector((state: RootState) => state.user)
  const activeUserRole = userRole || user?.role || ""
  const activeCompanyId = companyId || user?.company?.id
  const isOwner = activeUserRole === "owner"
  const isProjectAdmin = projectData.admins?.some((a) => a.id === user?.id)
  const canManageTeam = activeUserRole === "owner" || activeUserRole === "admin" || isProjectAdmin

  const [memberToRemove, setMemberToRemove] = useState<any | null>(null)
  const [isAlertOpen, setIsAlertOpen] = useState(false)
  const [isManageOpen, setIsManageOpen] = useState(false)

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "member">("all")
  const [workloadFilter, setWorkloadFilter] = useState<"all" | "none" | "under-2" | "under-5" | "over-5">("all")

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Reset pagination to page 1 when search or filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, roleFilter, workloadFilter])

  // Dialog Specific State
  const [dialogSearch, setDialogSearch] = useState("")
  const [selectedAdminIds, setSelectedAdminIds] = useState<string[]>([])
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])

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

  // Query Company Users for Team Management Modal
  const { data: companyUsersData, isLoading: isCompanyUsersLoading } = useQuery({
    queryKey: ["teams", activeCompanyId],
    queryFn: async () => {
      if (!activeCompanyId) return { teams: [] }
      const response = await axios.get(`/api/teams/${activeCompanyId}`)
      return response.data
    },
    enabled: !!activeCompanyId && isManageOpen,
  })

  const companyUsers = companyUsersData?.teams || []

  // Helper to check if a user is selected in the project
  const getIsSelected = (userId: string, role: string) => {
    if (role === "Admin" || role === "Owner") {
      return selectedAdminIds.includes(userId)
    }
    return selectedMemberIds.includes(userId)
  }

  // Helper to toggle selection
  const toggleSelection = (userId: string, role: string) => {
    if (role === "Admin" || role === "Owner") {
      toggleAdminSelection(userId)
    } else {
      toggleMemberSelection(userId)
    }
  }

  // Filter company users into project members and rest of company
  const currentProjectUsers = companyUsers.filter((u: any) => {
    if (u.role === "Client") return false
    return getIsSelected(u.id, u.role)
  })

  const otherCompanyUsers = companyUsers.filter((u: any) => {
    if (u.role === "Client") return false
    return !getIsSelected(u.id, u.role)
  })

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
    if (activeUserRole === "admin" && isProjectAdmin) {
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

  // Mutation to update project membership via Dialog
  const updateMembershipMutation = useMutation({
    mutationFn: async (payload: { memberIds: string[]; adminIds: string[] }) => {
      const response = await axios.patch(`/api/projects/${projectData.id}`, payload)
      return response.data.project
    },
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(["project", projectData.id], updatedProject)
      queryClient.invalidateQueries({ queryKey: ["project", projectData.id] })
      toast.success("Project team updated successfully!")
      setIsManageOpen(false)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update project team")
    }
  })

  const handleOpenManage = () => {
    setSelectedAdminIds(admins.map(a => a.id))
    setSelectedMemberIds(members.map(m => m.id))
    setDialogSearch("")
    setIsManageOpen(true)
  }

  const handleSaveMembership = () => {
    updateMembershipMutation.mutate({
      memberIds: selectedMemberIds,
      adminIds: selectedAdminIds,
    })
  }

  const toggleAdminSelection = (adminId: string) => {
    setSelectedAdminIds(prev =>
      prev.includes(adminId) ? prev.filter(id => id !== adminId) : [...prev, adminId]
    )
  }

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    )
  }

  // Filter helper for main view
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

  const filteredAdmins = roleFilter === "member" ? [] : admins
  const filteredMembers = roleFilter === "admin" ? [] : filterMembersList(members)

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage)
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Dialog Search filtering
  const searchLower = dialogSearch.toLowerCase().trim()
  const filteredCurrentUsers = currentProjectUsers.filter((u: any) =>
    !searchLower ||
    u.name.toLowerCase().includes(searchLower) ||
    u.email.toLowerCase().includes(searchLower) ||
    (u.designation && u.designation.toLowerCase().includes(searchLower))
  )

  const filteredOtherUsers = otherCompanyUsers.filter((u: any) =>
    !searchLower ||
    u.name.toLowerCase().includes(searchLower) ||
    u.email.toLowerCase().includes(searchLower) ||
    (u.designation && u.designation.toLowerCase().includes(searchLower))
  )

  // Top Performers calculation
  const performers = React.useMemo(() => {
    return uniqueCollaborators
      .map(c => {
        const total = projectData.tickets?.filter(t => t.assignedUserId === c.id).length || 0
        const active = projectData.tickets?.filter(t => t.assignedUserId === c.id && t.status.toLowerCase() !== "completed").length || 0
        const completed = total - active
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
        return {
          ...c,
          completedTicketsCount: completed,
          totalTicketsCount: total,
          completionRate
        }
      })
      .filter(p => p.completedTicketsCount > 0)
      .sort((a, b) => {
        if (b.completedTicketsCount !== a.completedTicketsCount) {
          return b.completedTicketsCount - a.completedTicketsCount
        }
        return b.completionRate - a.completionRate
      })
      .slice(0, 5)
  }, [uniqueCollaborators, projectData.tickets])

  // Team workload distribution stats
  const workloadStats = React.useMemo(() => {
    let highLoad = 0
    let onTrack = 0
    let lightLoad = 0
    let available = 0

    const roster = uniqueCollaborators.map(c => {
      const active = projectData.tickets?.filter(t => t.assignedUserId === c.id && t.status.toLowerCase() !== "completed").length || 0
      const total = projectData.tickets?.filter(t => t.assignedUserId === c.id).length || 0

      let label = "Available"
      if (active > 0) {
        if (active < 2) {
          label = "Light Load"
          lightLoad++
        } else if (active < 5) {
          label = "On Track"
          onTrack++
        } else {
          label = "High Workload"
          highLoad++
        }
      } else {
        available++
      }

      return {
        ...c,
        activeTicketsCount: active,
        totalTicketsCount: total,
        workloadLabel: label
      }
    }).sort((a, b) => b.activeTicketsCount - a.activeTicketsCount)

    return {
      highLoad,
      onTrack,
      lightLoad,
      available,
      roster
    }
  }, [uniqueCollaborators, projectData.tickets])

  return (
    <div className="flex flex-col gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Premium Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card via-card to-primary/[0.03] p-6 md:p-8 shadow-sm">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-blue-500/5 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <UsersIcon className="size-6 text-primary" />
              Project Team Workspace
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Manage collaborators, monitor workloads, and celebrate performance achievements for <span className="font-extrabold text-foreground">{projectData.title}</span>.
            </p>
          </div>
          {canManageTeam && (
            <button
              onClick={handleOpenManage}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer text-sm"
            >
              <UserPlusIcon className="size-4" />
              Manage Team Members
            </button>
          )}
        </div>

        {/* Inline Stats Row */}
        <div className={`relative z-10 mt-6 grid ${
          (activeUserRole === "owner" || activeUserRole === "admin") 
            ? "grid-cols-2 sm:grid-cols-4" 
            : "grid-cols-2"
        } gap-3`}>
          {[
            { label: "Total Team", value: totalTeamSize, icon: UsersIcon, color: "text-primary", bg: "bg-primary/10" },
            { label: "Active Tasks", value: activeTicketsCount, icon: Briefcase, color: "text-blue-500", bg: "bg-blue-500/10" },
            ...((activeUserRole === "owner" || activeUserRole === "admin") ? [
              { label: "High Workload", value: workloadStats.highLoad, icon: ShieldAlertIcon, color: "text-red-500", bg: "bg-red-500/10", className: workloadStats.highLoad > 0 ? "animate-pulse border-red-500/30" : "" },
              { 
                label: "MVP Performer", 
                value: performers[0]?.name ? `${performers[0].name.split(" ")[0]}` : "None Yet", 
                icon: Trophy, 
                color: "text-amber-500", 
                bg: "bg-amber-500/10",
                title: performers[0]?.name ? `MVP: ${performers[0].name} (${performers[0].completedTicketsCount} tasks completed)` : "No completed tasks yet"
              }
            ] : [])
          ].map((stat, idx) => (
            <div 
              key={idx} 
              className={`flex items-center gap-3 p-3 rounded-xl bg-background/60 backdrop-blur border border-border/40 ${stat.className || ""}`}
              title={stat.title}
            >
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} shrink-0`}>
                <stat.icon className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-black text-foreground leading-none truncate">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5 truncate">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dashboard Section: Top Performers & Team Workload */}
      {(activeUserRole === "owner" || activeUserRole === "admin") && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">

        {/* Card A: Top Performers */}
        <div className="bg-card/45 backdrop-blur-md border border-border/50 rounded-3xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-amber-500/[0.02] blur-2xl pointer-events-none" />
          <div className="flex justify-between items-center pb-2 border-b border-border/40">
            <div>
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Trophy className="size-4 text-amber-500" />
                Top Performers
              </h3>
              <p className="text-xs text-muted-foreground">Most completed tasks in this project</p>
            </div>
            {performers.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                <Crown className="size-3" />
                MVP Active
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[300px] pr-1 space-y-3.5">
            {performers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3 bg-muted/10 border border-dashed border-border/40 rounded-2xl">
                <div className="p-3 rounded-full bg-amber-500/5 text-amber-500 border border-amber-500/10">
                  <Sparkles className="size-6 text-amber-500/60 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">No Performance Data Yet</p>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-[240px]">
                    Complete tasks in this project to see the performance leaderboard shine!
                  </p>
                </div>
              </div>
            ) : (
              performers.map((performer, idx) => {
                let rankBadge = "bg-stone-100 text-stone-500 border-stone-200 dark:bg-stone-850 dark:text-stone-400 dark:border-stone-800"
                let rankIcon = null
                if (idx === 0) {
                  rankBadge = "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 font-black scale-105"
                  rankIcon = <Crown className="size-3.5 text-amber-500 animate-bounce" />
                } else if (idx === 1) {
                  rankBadge = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-300/40 font-bold"
                  rankIcon = <Award className="size-3.5 text-slate-400" />
                } else if (idx === 2) {
                  rankBadge = "bg-orange-100 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 border-orange-200/40 font-bold"
                  rankIcon = <Award className="size-3.5 text-orange-600" />
                }

                return (
                  <div
                    key={performer.id}
                    className="flex items-center justify-between p-3 rounded-2xl border border-border/40 bg-muted/10 hover:bg-muted/20 hover:border-primary/20 transition-all duration-300 gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`size-6 rounded-full border flex items-center justify-center text-[10px] shrink-0 ${rankBadge}`}>
                        {rankIcon ? rankIcon : idx + 1}
                      </div>

                      <Avatar className="size-9 border border-border/60 shrink-0">
                        <AvatarImage src={performer.imageUrl || undefined} />
                        <AvatarFallback className="text-xs font-black bg-primary/5 text-primary">
                          {getInitials(performer.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex flex-col">
                        <span className="text-xs font-black text-foreground group-hover:text-primary transition-colors truncate">
                          {performer.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate font-medium">
                          {performer.designation || (performer.role === "admin" ? "Project Admin" : "Project Collaborator")}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <CheckIcon className="size-3 stroke-[3]" />
                        {performer.completedTicketsCount} Done
                      </span>
                      <span className="text-[9px] text-muted-foreground mt-1 font-semibold">
                        {performer.completionRate}% completion
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Card B: Team Workload */}
        <div className="bg-card/45 backdrop-blur-md border border-border/50 rounded-3xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-blue-500/[0.02] blur-2xl pointer-events-none" />
          <div className="flex justify-between items-center pb-2 border-b border-border/40">
            <div>
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Briefcase className="size-4 text-blue-500" />
                Team Workload Allocation
              </h3>
              <p className="text-xs text-muted-foreground">Active task loads per team member</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase text-muted-foreground">Live Load</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[300px] pr-1 space-y-3">
            {workloadStats.roster.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3 bg-muted/10 border border-dashed border-border/40 rounded-2xl">
                <div className="p-3 rounded-full bg-blue-500/5 text-blue-500 border border-blue-500/10">
                  <Briefcase className="size-6 text-blue-500/60" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">No Collaborators Assigned</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Add collaborators to this project to start tracking team workload distribution.
                  </p>
                </div>
              </div>
            ) : (
              workloadStats.roster.map((member) => {
                let workloadColor = "bg-stone-500/10 text-stone-500 border-stone-500/20"
                let workloadProgressBg = "bg-stone-500"
                if (member.workloadLabel === "High Workload") {
                  workloadColor = "bg-red-500/10 text-red-500 border-red-500/20 font-extrabold animate-pulse"
                  workloadProgressBg = "bg-red-500"
                } else if (member.workloadLabel === "On Track") {
                  workloadColor = "bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold"
                  workloadProgressBg = "bg-primary"
                } else if (member.workloadLabel === "Light Load") {
                  workloadColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold"
                  workloadProgressBg = "bg-emerald-500"
                } else if (member.workloadLabel === "Available") {
                  workloadColor = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-medium"
                  workloadProgressBg = "bg-emerald-400"
                }

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/20 transition-all duration-300 gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="size-8 border border-border/60 shrink-0">
                        <AvatarImage src={member.imageUrl || undefined} />
                        <AvatarFallback className="text-xs font-extrabold">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex flex-col">
                        <span className="text-xs font-bold text-foreground truncate">{member.name}</span>
                        <span className="text-[9px] text-muted-foreground truncate capitalize">
                          {member.designation || member.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex flex-col items-end">
                        <span className={`px-2 py-0.5 rounded text-[9px] border ${workloadColor}`}>
                          {member.activeTicketsCount} Active Tasks
                        </span>
                        {member.totalTicketsCount > 0 && (
                          <div className="w-16 h-1 bg-muted/40 rounded-full overflow-hidden mt-1 border border-border/10">
                            <div
                              className={`h-full rounded-full ${workloadProgressBg}`}
                              style={{ width: `${Math.round(((member.totalTicketsCount - member.activeTicketsCount) / member.totalTicketsCount) * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>
      )}

      {/* Admins Row Section (Full width row above search/filters) */}
      {filteredAdmins.length > 0 && (
        <div className="flex flex-col gap-4 w-full">
          <div className="flex items-center gap-3 w-full">
            <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest flex items-center gap-2">
              <ShieldAlertIcon className="size-3.5 text-rose-500" />
              Project Admins ({filteredAdmins.length})
            </h3>
            <div className="h-px flex-1 bg-gradient-to-r from-rose-500/20 to-transparent" />
          </div>
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
      <div className="bg-gradient-to-r from-card/30 to-card/15 backdrop-blur-md border border-border/40 rounded-2xl p-4.5 flex flex-col lg:flex-row items-center gap-4 w-full">
        {/* Search */}
        <div className="relative w-full lg:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search team members by name, role, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background/50 border border-border/40 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all"
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
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          {/* Role Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Role:</span>
            <Select value={roleFilter} onValueChange={(val: any) => setRoleFilter(val)}>
              <SelectTrigger className="w-[140px] bg-background/50 border border-border/40 rounded-xl text-xs font-semibold h-9 focus:ring-1 focus:ring-primary/40 cursor-pointer">
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Workload:</span>
            <Select value={workloadFilter} onValueChange={(val: any) => setWorkloadFilter(val)}>
              <SelectTrigger className="w-[170px] bg-background/50 border border-border/40 rounded-xl text-xs font-semibold h-9 focus:ring-1 focus:ring-primary/40 cursor-pointer">
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
              className="px-3 py-2 border border-dashed border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/10 font-bold rounded-xl text-xs transition-colors cursor-pointer h-9 flex items-center justify-center animate-in fade-in"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table of Members */}
      <div className="space-y-4 w-full">
        {/* Render filtered members */}
        {filteredMembers.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 w-full">
              <h3 className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                <UsersIcon className="size-3.5 text-primary" />
                Project Members ({filteredMembers.length})
              </h3>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
            </div>

            <div className="bg-card/45 backdrop-blur-md border border-border/50 rounded-2xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="font-semibold text-muted-foreground py-3.5 pl-6 text-xs uppercase tracking-wider">Collaborator</TableHead>
                    <TableHead className="font-semibold text-muted-foreground py-3.5 text-xs uppercase tracking-wider">Designation</TableHead>
                    <TableHead className="font-semibold text-muted-foreground py-3.5 text-xs uppercase tracking-wider">Workload</TableHead>
                    <TableHead className="font-semibold text-muted-foreground py-3.5 text-xs uppercase tracking-wider">Task Progress</TableHead>
                    {canManageTeam && <TableHead className="w-[80px] py-3.5 pr-6"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMembers.map((member) => {
                    const activeTicketsCount = getUserActiveTicketsCount(member.id)
                    const totalTicketsCount = getUserTotalTicketsCount(member.id)
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
                      <TableRow
                        key={member.id}
                        onClick={() => router.push(`/dashboard/${userId}/profile?targetUserId=${member.id}`)}
                        className="border-border/30 hover:bg-muted/10 cursor-pointer transition-colors duration-200 group"
                      >
                        <TableCell className="py-4 pl-6">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9 border border-border/40 shrink-0">
                              <AvatarImage src={member.imageUrl || undefined} alt={member.name} />
                              <AvatarFallback className="font-bold text-xs bg-primary/5 text-primary rounded-full flex items-center justify-center size-full">
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-xs text-foreground hover:text-primary transition-colors truncate">
                                {member.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground truncate">{member.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-xs font-semibold text-muted-foreground">
                          {member.designation || "Project Collaborator"}
                        </TableCell>
                        <TableCell className="py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-1.5 w-fit ${workloadColor}`}>
                            <span className={`size-1.5 rounded-full ${workloadDot}`} />
                            {workloadLabel}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          {totalTicketsCount > 0 ? (
                            <div className="flex flex-col gap-1 w-32 shrink-0">
                              <div className="flex justify-between text-[9px] text-muted-foreground font-semibold">
                                <span>{completedTicketsCount}/{totalTicketsCount} tasks</span>
                                <span>{completionRate}%</span>
                              </div>
                              <div className="w-full h-1 bg-muted/50 rounded-full overflow-hidden border border-border/20">
                                <div 
                                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-primary transition-all duration-500"
                                  style={{ width: `${completionRate}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-[9px] font-bold text-muted-foreground/75 bg-muted/30 border border-border/40 px-2 py-0.5 rounded-md">No tasks</span>
                          )}
                        </TableCell>
                        {canManageTeam && (
                          <TableCell className="py-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                            {canRemoveMember(member) && (
                              <button
                                onClick={() => {
                                  setMemberToRemove(member)
                                  setIsAlertOpen(true)
                                }}
                                className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                                title="Remove from project"
                              >
                                <Trash2Icon className="size-4" />
                              </button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-2 px-2 bg-card/20 border border-border/40 rounded-xl p-3">
                <span className="text-xs text-muted-foreground font-medium">
                  Showing <span className="font-bold text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                  <span className="font-bold text-foreground">{Math.min(currentPage * itemsPerPage, filteredMembers.length)}</span> of{" "}
                  <span className="font-bold text-foreground">{filteredMembers.length}</span> members
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 rounded-lg border border-border/60 bg-background/50 hover:bg-muted text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all text-foreground"
                  >
                    Previous
                  </button>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1.5 rounded-lg border border-border/60 bg-background/50 hover:bg-muted text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all text-foreground"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
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

      {/* Manage Team Members Sheet */}
      <Sheet open={isManageOpen} onOpenChange={setIsManageOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-6 overflow-y-auto flex flex-col gap-6">
          <SheetHeader className="pb-4 border-b border-border/40">
            <SheetTitle className="text-foreground text-xl font-bold flex items-center gap-2">
              <UserPlusIcon className="size-5 text-primary" />
              Manage Project Team
            </SheetTitle>
            <SheetDescription className="text-muted-foreground text-xs leading-relaxed mt-1">
              Select members and administrators from the company to join this project.
            </SheetDescription>
          </SheetHeader>

          {/* Search and Content Container */}
          <div className="flex flex-col gap-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
              <input
                type="text"
                placeholder="Search company users..."
                value={dialogSearch}
                onChange={(e) => setDialogSearch(e.target.value)}
                className="w-full bg-background border border-border/60 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-foreground placeholder-muted-foreground/60 focus:outline-hidden focus:ring-1 focus:ring-primary/45 focus:border-primary/45 transition-all"
              />
              {dialogSearch && (
                <button
                  onClick={() => setDialogSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {isCompanyUsersLoading ? (
              <div className="h-[250px] flex items-center justify-center">
                <Loader2Icon className="size-6 text-primary animate-spin" />
              </div>
            ) : (
              <Tabs defaultValue="members" className="w-full">
                <TabsList className="w-full bg-muted/60 p-1 rounded-xl grid grid-cols-2">
                  <TabsTrigger value="members" className="rounded-lg text-xs font-bold py-1.5">
                    Project Members ({currentProjectUsers.length})
                  </TabsTrigger>
                  <TabsTrigger value="rest-of-company" className="rounded-lg text-xs font-bold py-1.5">
                    Rest of Company ({otherCompanyUsers.length})
                  </TabsTrigger>
                </TabsList>

                {/* Project Members Tab */}
                <TabsContent value="members" className="mt-4">
                  <div className="border border-border/60 rounded-xl overflow-hidden bg-muted/5 flex flex-col max-h-[350px]">
                    <div className="overflow-y-auto p-2 flex flex-col gap-2">
                      {filteredCurrentUsers.map((item: any) => {
                        const isSelected = getIsSelected(item.id, item.role)
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleSelection(item.id, item.role)}
                            className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${isSelected
                                ? "bg-primary/5 border-primary/45 shadow-2xs"
                                : "bg-card border-border/40 hover:bg-muted/30 hover:border-border/80"
                              }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`size-8 rounded-full ${
                                (item.role === "Admin" || item.role === "Owner")
                                  ? "bg-primary/5 dark:bg-primary/10 text-primary"
                                  : "bg-stone-200 dark:bg-stone-850 text-stone-700 dark:text-stone-300"
                                } flex items-center justify-center text-xs font-bold shrink-0`}>
                                {item.initials}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-foreground truncate">{item.name}</span>
                                <span className="text-[10px] text-muted-foreground truncate">
                                  {item.designation || item.role}
                                </span>
                              </div>
                            </div>
                            <div className={`size-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border/80 bg-transparent"
                              }`}>
                              {isSelected && <CheckIcon className="size-2.5 stroke-[3]" />}
                            </div>
                          </div>
                        )
                      })}
                      {filteredCurrentUsers.length === 0 && (
                        <div className="text-center py-8 text-xs text-muted-foreground">
                          No project members found matching your search.
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Rest of Company Tab */}
                <TabsContent value="rest-of-company" className="mt-4">
                  <div className="border border-border/60 rounded-xl overflow-hidden bg-muted/5 flex flex-col max-h-[350px]">
                    <div className="overflow-y-auto p-2 flex flex-col gap-2">
                      {filteredOtherUsers.map((item: any) => {
                        const isSelected = getIsSelected(item.id, item.role)
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleSelection(item.id, item.role)}
                            className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${isSelected
                                ? "bg-primary/5 border-primary/45 shadow-2xs"
                                : "bg-card border-border/40 hover:bg-muted/30 hover:border-border/80"
                              }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`size-8 rounded-full ${
                                (item.role === "Admin" || item.role === "Owner")
                                  ? "bg-primary/5 dark:bg-primary/10 text-primary"
                                  : "bg-stone-200 dark:bg-stone-850 text-stone-700 dark:text-stone-300"
                                } flex items-center justify-center text-xs font-bold shrink-0`}>
                                {item.initials}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-foreground truncate">{item.name}</span>
                                <span className="text-[10px] text-muted-foreground truncate">
                                  {item.designation || item.role}
                                </span>
                              </div>
                            </div>
                            <div className={`size-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border/80 bg-transparent"
                              }`}>
                              {isSelected && <CheckIcon className="size-2.5 stroke-[3]" />}
                            </div>
                          </div>
                        )
                      })}
                      {filteredOtherUsers.length === 0 && (
                        <div className="text-center py-8 text-xs text-muted-foreground">
                          No company members found matching your search.
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>

          <SheetFooter className="gap-3 mt-auto border-t border-border/30 pt-4 flex flex-row w-full justify-stretch">
            <button
              onClick={() => setIsManageOpen(false)}
              className="flex-1 py-2 border border-border bg-transparent hover:bg-muted text-foreground font-medium rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveMembership}
              disabled={updateMembershipMutation.isPending}
              className="flex-1 py-2 bg-primary text-primary-foreground hover:bg-primary/95 font-medium rounded-xl text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {updateMembershipMutation.isPending ? (
                <>
                  <Loader2Icon className="size-3 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Confirmation Modal for removing member */}
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
