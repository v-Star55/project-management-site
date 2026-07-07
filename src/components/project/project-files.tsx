"use client"

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { toast } from "sonner"
import { FileIcon, FileTextIcon, ImageIcon, VideoIcon, FileArchiveIcon, SearchIcon, ExternalLinkIcon, DownloadIcon, PaperclipIcon, LayersIcon, CalendarIcon, FilterIcon, UserIcon, ArrowUpDownIcon } from "lucide-react";

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import TicketDetail from "../ticket/ticket-detail"

interface ProjectFilesProps {
  projectId: string
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

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "-"
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase()
  switch (ext) {
    case "pdf":
      return <FileTextIcon className="size-4 text-red-500 shrink-0" />
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "svg":
    case "webp":
      return <ImageIcon className="size-4 text-blue-500 shrink-0" />
    case "mp4":
    case "mov":
    case "avi":
    case "mkv":
      return <VideoIcon className="size-4 text-amber-500 shrink-0" />
    case "zip":
    case "tar":
    case "gz":
    case "rar":
    case "7z":
      return <FileArchiveIcon className="size-4 text-purple-500 shrink-0" />
    default:
      return <FileIcon className="size-4 text-stone-500 shrink-0" />
  }
}

const getFileType = (fileName: string, fileUrl: string): string => {
  if (fileUrl.startsWith("http") && !fileUrl.includes("/uploads/")) {
    return "link"
  }
  const ext = fileName.split(".").pop()?.toLowerCase()
  if (!ext) return "other"
  if (["pdf", "doc", "docx", "txt", "xls", "xlsx", "ppt", "pptx"].includes(ext)) return "document"
  if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext)) return "image"
  if (["mp4", "mov", "avi", "mkv"].includes(ext)) return "video"
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "archive"
  return "other"
}

export default function ProjectFiles({ projectId }: ProjectFilesProps) {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [sortBy, setSortBy] = useState<"date" | "name">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // For TicketDetail popup integration
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null)

  // Fetch Project Files List
  const { data: filesData, isLoading: isFilesLoading, isError: isFilesError } = useQuery({
    queryKey: ["project-files", projectId],
    queryFn: async () => {
      const response = await axios.get(`/api/projects/${projectId}/files`)
      return response.data.files as FileRecord[]
    },
    enabled: !!projectId,
  })

  // Fetch Project Details (cached, resolved instantly to get complete ticket fields)
  const { data: projectData } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const response = await axios.get(`/api/projects/${projectId}`)
      return response.data.project
    },
    enabled: !!projectId,
  })

  // Mutation to update ticket status/priority inside drawer
  const updateTicketMutation = useMutation({
    mutationFn: async ({
      ticketId,
      status,
      priority,
      reasonBlocked,
      reasonReopen,
    }: {
      ticketId: string
      status?: string
      priority?: string
      reasonBlocked?: string
      reasonReopen?: string
    }) => {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: ticketId,
          status,
          priority,
          reasonBlocked,
          reasonReopen,
        }),
      })
      if (!res.ok) throw new Error("Failed to update ticket")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Ticket updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      queryClient.invalidateQueries({ queryKey: ["project-files", projectId] })
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
    },
    onError: () => {
      toast.error("Failed to update ticket")
    },
  })

  const handleTaskClick = (ticketId: string) => {
    const fullTicket = projectData?.tickets?.find((t: any) => t.id === ticketId)
    if (fullTicket) {
      setSelectedTicket({
        ...fullTicket,
        project: {
          id: projectId,
          title: projectData.title,
        },
      })
      setIsDetailOpen(true)
    } else {
      toast.error("Could not load full ticket details")
    }
  }

  const toggleSort = (field: "date" | "name") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  if (isFilesLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Spinner className="size-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading project files...</p>
      </div>
    )
  }

  if (isFilesError) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-500 font-semibold">Failed to load project files</p>
        <p className="text-xs text-muted-foreground mt-1">Please try refreshing the page.</p>
      </div>
    )
  }

  const files = filesData || []

  // Stats computation
  const totalCount = files.length
  const imageCount = files.filter(f => getFileType(f.fileName, f.fileUrl) === "image").length
  const docCount = files.filter(f => getFileType(f.fileName, f.fileUrl) === "document").length
  const linkCount = files.filter(f => getFileType(f.fileName, f.fileUrl) === "link").length

  // Filtering & Sorting
  const filteredFiles = files
    .filter(file => {
      const matchesSearch = file.fileName.toLowerCase().includes(searchTerm.toLowerCase())
      const type = getFileType(file.fileName, file.fileUrl)
      const matchesType = typeFilter === "all" || type === typeFilter
      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc"
          ? a.fileName.localeCompare(b.fileName)
          : b.fileName.localeCompare(a.fileName)
      } else {
        return sortOrder === "asc"
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

  return (
    <div className="flex flex-col gap-6">
      {/* Title Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Project Files</h2>
        <p className="text-xs text-muted-foreground">All files, resources, and attachments uploaded across tasks in this project.</p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/40 hover:border-border/80 transition-all shadow-xs">
          <CardHeader className="p-4 flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Files</span>
            <PaperclipIcon className="size-4 text-primary opacity-70" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold">{totalCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/40 hover:border-border/80 transition-all shadow-xs">
          <CardHeader className="p-4 flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Images</span>
            <ImageIcon className="size-4 text-blue-500 opacity-70" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold">{imageCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/40 hover:border-border/80 transition-all shadow-xs">
          <CardHeader className="p-4 flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Documents</span>
            <FileTextIcon className="size-4 text-red-500 opacity-70" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold">{docCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/40 hover:border-border/80 transition-all shadow-xs">
          <CardHeader className="p-4 flex flex-row items-center justify-between pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Links & Web</span>
            <ExternalLinkIcon className="size-4 text-purple-500 opacity-70" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold">{linkCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-muted/15 border border-border/30 p-3 rounded-2xl">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
          <Input
            placeholder="Search by file name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 border-border/50 text-xs rounded-xl focus-visible:ring-1 bg-card/65 text-foreground"
          />
        </div>

        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36 h-9 border-border/50 text-xs rounded-xl bg-card/65 text-foreground">
              <div className="flex items-center gap-1.5">
                <FilterIcon className="size-3 text-muted-foreground" />
                <SelectValue placeholder="All types" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border/50 rounded-xl text-xs z-50 shadow-md">
              <SelectItem value="all" className="rounded-lg cursor-pointer">All Types</SelectItem>
              <SelectItem value="image" className="rounded-lg cursor-pointer">Images</SelectItem>
              <SelectItem value="document" className="rounded-lg cursor-pointer">Documents</SelectItem>
              <SelectItem value="video" className="rounded-lg cursor-pointer">Videos</SelectItem>
              <SelectItem value="archive" className="rounded-lg cursor-pointer">Archives</SelectItem>
              <SelectItem value="link" className="rounded-lg cursor-pointer">Links</SelectItem>
              <SelectItem value="other" className="rounded-lg cursor-pointer">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabular List */}
      <Card className="border border-border/40 shadow-xs rounded-2xl overflow-hidden bg-card/40">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b border-border/30">
                <TableHead className="w-[30%]">
                  <button
                    onClick={() => toggleSort("name")}
                    className="flex items-center gap-1.5 hover:text-foreground text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none cursor-pointer"
                  >
                    File Name
                    <ArrowUpDownIcon className="size-3" />
                  </button>
                </TableHead>
                <TableHead className="w-[25%] text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Task / Deliverable</TableHead>
                <TableHead className="w-[20%] text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Uploaded By</TableHead>
                <TableHead className="w-[15%]">
                  <button
                    onClick={() => toggleSort("date")}
                    className="flex items-center gap-1.5 hover:text-foreground text-[10px] font-bold uppercase tracking-wider text-muted-foreground select-none cursor-pointer"
                  >
                    Date Attached
                    <ArrowUpDownIcon className="size-3" />
                  </button>
                </TableHead>
                <TableHead className="w-[10%] text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground pr-6">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFiles.length > 0 ? (
                filteredFiles.map((file) => {
                  const type = getFileType(file.fileName, file.fileUrl)
                  const isLinkType = type === "link"

                  return (
                    <TableRow key={file.id} className="hover:bg-muted/15 border-b border-border/25">
                      <TableCell className="font-semibold py-3.5 pl-6 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="size-8 bg-muted/30 border border-border/40 rounded-lg flex items-center justify-center shadow-inner shrink-0">
                            {getFileIcon(file.fileName)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <a
                              href={file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-foreground hover:text-primary hover:underline truncate flex items-center gap-1"
                            >
                              {file.fileName}
                              <ExternalLinkIcon className="size-3 opacity-60" />
                            </a>
                            <span className="text-[10px] text-muted-foreground capitalize mt-0.5">
                              {isLinkType ? "Web Link" : `${file.fileName.split(".").pop()?.toUpperCase() || "File"} File`}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5">
                        <button
                          onClick={() => handleTaskClick(file.ticketId)}
                          className="flex items-center gap-2 hover:text-primary hover:underline text-left text-xs font-semibold text-foreground/80 max-w-[200px] truncate"
                        >
                          <LayersIcon className="size-3 text-muted-foreground shrink-0" />
                          <span className="truncate">{file.ticket.title}</span>
                        </button>
                      </TableCell>

                      <TableCell className="py-3.5">
                        {file.uploadedBy ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="size-6 border border-border/50 shrink-0">
                              <AvatarImage src={file.uploadedBy.imageUrl || ""} alt={file.uploadedBy.name} />
                              <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary">
                                {file.uploadedBy.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-semibold text-foreground/85 truncate">{file.uploadedBy.name}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="size-6 rounded-full bg-stone-100 dark:bg-stone-500/10 border border-border/50 flex items-center justify-center shrink-0">
                              <UserIcon className="size-3 text-stone-400" />
                            </div>
                            <span className="text-xs text-muted-foreground italic">System / Unknown</span>
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="py-3.5 text-xs text-muted-foreground/90 font-medium">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="size-3.5 opacity-60" />
                          <span>{formatDate(file.createdAt)}</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5 text-right pr-6 shrink-0">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="size-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <a href={file.fileUrl} download={file.fileName} target="_blank" rel="noopener noreferrer" title="Download file">
                              <DownloadIcon className="size-3.5" />
                            </a>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-16 text-center">
                    <PaperclipIcon className="size-7 text-muted-foreground/35 mx-auto mb-3" />
                    <p className="font-bold text-foreground/80 text-sm">No files found</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                      There are no attachments uploaded matching your filters.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ticket Details Drawer */}
      <TicketDetail
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        ticket={
          selectedTicket
            ? projectData?.tickets?.find((t: any) => t.id === selectedTicket.id)
              ? {
                  ...projectData.tickets.find((t: any) => t.id === selectedTicket.id)!,
                  project: { id: projectId, title: projectData.title },
                }
              : selectedTicket
            : null
        }
        onStatusUpdate={(status, reason) => {
          if (selectedTicket) {
            const updatePayload: any = { ticketId: selectedTicket.id, status }
            if (status === "blocked") {
              updatePayload.reasonBlocked = reason
            } else if (status === "reopen") {
              updatePayload.reasonReopen = reason
            }
            updateTicketMutation.mutate(updatePayload)
          }
        }}
        onPriorityUpdate={(priority) => {
          if (selectedTicket) {
            updateTicketMutation.mutate({ ticketId: selectedTicket.id, priority })
          }
        }}
      />
    </div>
  )
}
