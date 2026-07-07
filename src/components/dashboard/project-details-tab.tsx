"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BriefcaseIcon, CalendarIcon, SearchIcon, FolderIcon } from "lucide-react";

interface Ticket {
  id: string
  title: string
  description: string
  status: string
  priority: string
  dueDate: string | null
  assignedUser: {
    id: string
    name: string
    email: string
    imageUrl: string | null
  } | null
  type: string
  groupId: string | null
  groupName: string | null
}

interface ProjectMember {
  id: string
  name: string
  email: string
  imageUrl: string | null
  role: string
}

interface ProjectGroup {
  id: string
  name: string
}

interface Project {
  id: string
  title: string
  description: string | null
  status: string
  startDate: string | null
  completedDate: string | null
  isActive: boolean
  tickets: Ticket[]
  groups: ProjectGroup[]
  admins: ProjectMember[]
  members: ProjectMember[]
}

interface ProjectDetailsTabProps {
  projects: Project[]
  formatDate: (dateStr: string | null) => string
  getInitials: (name: string) => string
}

export default function ProjectDetailsTab({
  projects,
  formatDate,
  getInitials
}: ProjectDetailsTabProps) {
  const router = useRouter()
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("")
  const [projectSearch, setProjectSearch] = React.useState<string>("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [sprintFilter, setSprintFilter] = React.useState<string>("all")
  const [typeFilter, setTypeFilter] = React.useState<string>("all")
  const [sortOrder, setSortOrder] = React.useState<string>("default")
  const [currentPage, setCurrentPage] = React.useState<number>(1)

  // Initialize selectedProjectId once projects are loaded
  React.useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      const activeProj = projects.find(p => p.status === "in_progress" && p.isActive) || projects.find(p => p.isActive) || projects[0];
      setSelectedProjectId(activeProj.id);
    }
  }, [projects, selectedProjectId]);

  // Reset pagination when selected project or any filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedProjectId, statusFilter, sprintFilter, typeFilter, sortOrder, projectSearch]);

  const selectedProject = projects?.find(p => p.id === selectedProjectId) || null;

  // Filter and sort tickets
  const ticketsToProcess = selectedProject?.tickets || []
  const filteredProjectTickets = ticketsToProcess.filter(ticket => {
    const matchesSearch = 
      ticket.title.toLowerCase().includes(projectSearch.toLowerCase()) ||
      ticket.description.toLowerCase().includes(projectSearch.toLowerCase()) ||
      ticket.status.toLowerCase().includes(projectSearch.toLowerCase()) ||
      (ticket.assignedUser?.name || "").toLowerCase().includes(projectSearch.toLowerCase())

    if (!matchesSearch) return false

    if (statusFilter !== "all") {
      const status = ticket.status.toLowerCase()
      if (statusFilter === "todo" && status !== "pending" && status !== "backlog") return false
      if (statusFilter === "in_progress" && status !== "in_progress" && status !== "reopen" && status !== "blocked") return false
      if (statusFilter === "in_review" && status !== "in_review") return false
      if (statusFilter === "completed" && status !== "completed") return false
    }

    if (sprintFilter !== "all") {
      if (sprintFilter === "none") {
        if (ticket.groupId) return false
      } else {
        if (ticket.groupId !== sprintFilter) return false
      }
    }

    if (typeFilter !== "all" && ticket.type !== typeFilter) {
      return false
    }

    return true
  })

  const priorityMap: Record<string, number> = { high: 3, medium: 2, low: 1 }
  const sortedTickets = [...filteredProjectTickets].sort((a, b) => {
    if (sortOrder === "priority_desc") {
      const aVal = priorityMap[a.priority.toLowerCase()] || 0
      const bVal = priorityMap[b.priority.toLowerCase()] || 0
      return bVal - aVal
    } else if (sortOrder === "priority_asc") {
      const aVal = priorityMap[a.priority.toLowerCase()] || 0
      const bVal = priorityMap[b.priority.toLowerCase()] || 0
      return aVal - bVal
    }
    return 0
  })

  // 15 items per page pagination
  const itemsPerPage = 15
  const totalPages = Math.max(1, Math.ceil(sortedTickets.length / itemsPerPage))
  const paginatedTickets = sortedTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleUserClick = (targetUserId: string) => {
    router.push(`/dashboard/${targetUserId}/profile`)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-stretch">
      
      {/* Project details and tickets table */}
      <div className="lg:col-span-2 flex flex-col bg-card border border-border/50 rounded-3xl shadow-xs overflow-hidden">
        <div className="border-b border-border/40 bg-muted/15 py-4 px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BriefcaseIcon className="size-4 text-primary shrink-0" />
            <span className="text-sm font-bold uppercase tracking-wide text-foreground">Project</span>
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
            >
              <SelectTrigger className="bg-muted/40 border border-border/30 rounded-xl px-3 py-1.5 text-xs text-foreground font-semibold outline-hidden focus:border-primary/50 transition-all cursor-pointer min-w-[180px] h-7 flex items-center justify-between">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border bg-popover text-popover-foreground">
                {(projects || []).map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title} {!project.isActive || project.status === "completed" ? "(Completed)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedProject && (
            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-extrabold border self-start md:self-auto ${
              selectedProject.status === "completed" || !selectedProject.isActive
                ? "bg-muted text-muted-foreground border-border"
                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/25"
            }`}>
              {selectedProject.status.replace("_", " ")}
            </span>
          )}
        </div>

        <div className="p-6 flex-1 flex flex-col gap-6">
          {selectedProject ? (
            <div className="space-y-6 flex-1 flex flex-col">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-foreground">{selectedProject.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedProject.description || "No project description provided."}
                </p>
                {selectedProject.startDate && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
                    <CalendarIcon className="size-3.5 text-primary/70" />
                    Started on {formatDate(selectedProject.startDate)}
                  </p>
                )}

                {/* Overlapping Project Admins & Members list using shadcn Avatar */}
                <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-border/40">
                  {selectedProject.admins && selectedProject.admins.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Project Admins</h4>
                      <div className="flex items-center -space-x-2">
                        {selectedProject.admins.map((admin) => (
                          <Avatar 
                            key={admin.id} 
                            onClick={() => handleUserClick(admin.id)}
                            className="size-7 border-2 border-card ring-1 ring-border shadow-xs hover:scale-110 hover:z-10 transition-all cursor-pointer" 
                            title={`${admin.name} (${admin.role}) - Click to view profile`}
                          >
                            <AvatarImage src={admin.imageUrl || "https://github.com/shadcn.png"} />
                            <AvatarFallback className="text-[9px] font-bold bg-primary/15 text-primary">
                              {getInitials(admin.name)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProject.members && selectedProject.members.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Project Members</h4>
                      <div className="flex items-center -space-x-2">
                        {selectedProject.members.map((member) => (
                          <Avatar 
                            key={member.id} 
                            onClick={() => handleUserClick(member.id)}
                            className="size-7 border-2 border-card ring-1 ring-border shadow-xs hover:scale-110 hover:z-10 transition-all cursor-pointer" 
                            title={`${member.name} (${member.role}) - Click to view profile`}
                          >
                            <AvatarImage src={member.imageUrl || "https://github.com/shadcn.png"} />
                            <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tickets filtering and sorting controls */}
              <div className="space-y-4 flex-1 flex flex-col pt-2 border-t border-border/30">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Search Input */}
                  <div className="relative w-full sm:w-48">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Filter tickets..."
                      value={projectSearch}
                      onChange={e => setProjectSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-muted/40 rounded-xl border border-border/30 text-xs text-foreground outline-hidden focus:border-primary/50 transition-all"
                    />
                  </div>

                  {/* Status dropdown filter */}
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="bg-muted/40 border border-border/30 rounded-xl px-2.5 py-1.5 text-xs text-foreground outline-hidden focus:border-primary/50 transition-all cursor-pointer font-medium h-7 flex items-center justify-between gap-1">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-border bg-popover text-popover-foreground">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="in_review">In Review</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sprint dropdown filter */}
                  <Select
                    value={sprintFilter}
                    onValueChange={setSprintFilter}
                  >
                    <SelectTrigger className="bg-muted/40 border border-border/30 rounded-xl px-2.5 py-1.5 text-xs text-foreground outline-hidden focus:border-primary/50 transition-all cursor-pointer font-medium h-7 flex items-center justify-between gap-1">
                      <SelectValue placeholder="All Sprints" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-border bg-popover text-popover-foreground">
                      <SelectItem value="all">All Sprints</SelectItem>
                      <SelectItem value="none">No Sprint</SelectItem>
                      {selectedProject && (selectedProject.groups || []).map((group) => (
                        <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Ticket type filter */}
                  <Select
                    value={typeFilter}
                    onValueChange={setTypeFilter}
                  >
                    <SelectTrigger className="bg-muted/40 border border-border/30 rounded-xl px-2.5 py-1.5 text-xs text-foreground outline-hidden focus:border-primary/50 transition-all cursor-pointer font-medium h-7 flex items-center justify-between gap-1">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-border bg-popover text-popover-foreground">
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="feature">Feature</SelectItem>
                      <SelectItem value="bug">Bug</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="improvement">Improvement</SelectItem>
                      <SelectItem value="documentation">Documentation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Priority sorting */}
                  <Select
                    value={sortOrder}
                    onValueChange={setSortOrder}
                  >
                    <SelectTrigger className="bg-muted/40 border border-border/30 rounded-xl px-2.5 py-1.5 text-xs text-foreground outline-hidden focus:border-primary/50 transition-all cursor-pointer font-medium h-7 flex items-center justify-between gap-1 sm:ml-auto">
                      <SelectValue placeholder="Sort: Default" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-border bg-popover text-popover-foreground">
                      <SelectItem value="default">Sort: Default</SelectItem>
                      <SelectItem value="priority_desc">Priority: High to Low</SelectItem>
                      <SelectItem value="priority_asc">Priority: Low to High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Paginated Tickets Table */}
                <div className="overflow-x-auto flex-1 max-h-[360px] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-muted/10 hover:bg-muted/10">
                      <TableRow className="border-border/40">
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-3">ID</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Title</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Priority</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Assignee</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right pr-3">Due Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTickets.length > 0 ? (
                        paginatedTickets.map((ticket) => (
                          <TableRow key={ticket.id} className="border-border/40">
                            <TableCell className="font-semibold text-xs text-muted-foreground pl-3">
                              {ticket.id.slice(-6).toUpperCase()}
                            </TableCell>
                            <TableCell className="font-bold text-xs text-foreground max-w-[200px] truncate" title={ticket.title}>
                              {ticket.title}
                            </TableCell>
                            <TableCell>
                              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-extrabold tracking-wider bg-muted text-muted-foreground border border-border">
                                {ticket.status.replace("_", " ")}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-extrabold tracking-wider border ${
                                ticket.priority === "high" 
                                  ? "bg-red-500/10 text-red-500 border-red-500/20" 
                                  : ticket.priority === "medium"
                                  ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                  : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                              }`}>
                                {ticket.priority}
                              </span>
                            </TableCell>
                            <TableCell>
                              {ticket.assignedUser ? (
                                <div className="flex items-center gap-2">
                                  <Avatar 
                                    onClick={() => handleUserClick(ticket.assignedUser!.id)}
                                    className="size-6 ring-1 ring-border shadow-xs shrink-0 cursor-pointer"
                                    title={`${ticket.assignedUser.name} - Click to view profile`}
                                  >
                                    <AvatarImage src={ticket.assignedUser.imageUrl || "https://github.com/shadcn.png"} />
                                    <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary">
                                      {getInitials(ticket.assignedUser.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span 
                                    onClick={() => handleUserClick(ticket.assignedUser!.id)}
                                    className="text-[11px] font-semibold text-foreground truncate max-w-[90px] cursor-pointer hover:text-primary transition-colors" 
                                    title={ticket.assignedUser.name}
                                  >
                                    {ticket.assignedUser.name}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground/60">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground pr-3">
                              {formatDate(ticket.dueDate)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground italic pl-3 pr-3">
                            No tickets found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-auto">
                    <p className="text-xs text-muted-foreground">
                      Showing page <strong className="text-foreground">{currentPage}</strong> of <strong className="text-foreground">{totalPages}</strong> ({sortedTickets.length} total tickets)
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-muted/40 hover:bg-muted/65 border border-border/30 rounded-xl text-xs font-semibold text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 bg-muted/40 hover:bg-muted/65 border border-border/30 rounded-xl text-xs font-semibold text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/10 border border-dashed border-border/30 rounded-2xl">
              <BriefcaseIcon className="size-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm font-bold text-foreground">No Current Project</p>
              <p className="text-xs text-muted-foreground mt-1">This user is not currently active on any project.</p>
            </div>
          )}
        </div>
      </div>

      {/* Previous Projects Sidebar */}
      <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
        <div className="w-full">
          <div className="flex items-center gap-2 border-b border-border/40 pb-3 mb-4">
            <FolderIcon className="size-4 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Previous Projects</h3>
          </div>
          {projects && projects.filter(p => !p.isActive || p.status === "completed").length > 0 ? (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {projects
                .filter(p => !p.isActive || p.status === "completed")
                .map((project) => (
                  <div 
                    key={project.id} 
                    className="p-3 bg-muted/30 border border-border/40 rounded-2xl flex items-center justify-between gap-3 group hover:border-border/60 transition-all"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {project.title}
                      </p>
                      {project.completedDate && (
                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                          Completed: {formatDate(project.completedDate)}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-extrabold tracking-wider bg-muted text-muted-foreground border border-border whitespace-nowrap">
                      {project.status.replace("_", " ")}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/10 border border-dashed border-border/30 rounded-2xl">
              <FolderIcon className="size-6 text-muted-foreground/30 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground italic">No previous projects listed</p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
