"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { toast } from "sonner"
import axios from "axios"
import {
  PaperclipIcon,
  Trash2Icon,
  UploadIcon,
  FileIcon,
  FileTextIcon,
  ImageIcon,
  VideoIcon,
  FileArchiveIcon,
  PlusIcon,
  Loader2Icon,
  ExternalLinkIcon
} from "lucide-react"
import { Ticket } from "../dashboard/ticketsView"

interface TicketAttachmentsProps {
  ticket: Ticket
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "-"
  const date = new Date(dateStr)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
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

export default function TicketAttachments({ ticket }: TicketAttachmentsProps) {
  const queryClient = useQueryClient()
  const user = useSelector((state: RootState) => state.user.user)

  const [showAttachmentForm, setShowAttachmentForm] = useState(false)
  const [attachmentType, setAttachmentType] = useState<"file" | "link">("file")
  const [file, setFile] = useState<File | null>(null)
  const [linkName, setLinkName] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [attaching, setAttaching] = useState(false)
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleAttachSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAttaching(true)
    try {
      if (attachmentType === "file") {
        if (!file) {
          toast.error("Please choose a file first")
          setAttaching(false)
          return
        }
        const formData = new FormData()
        formData.append("file", file)
        formData.append("ticketId", ticket.id)

        const response = await axios.post("/api/tickets/attachments", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        })
        if (response.status === 201) {
          toast.success("Attachment uploaded successfully")
          setFile(null)
          setShowAttachmentForm(false)
          queryClient.invalidateQueries({ queryKey: ["tickets"] })
        }
      } else {
        if (!linkName.trim() || !linkUrl.trim()) {
          toast.error("File name and URL are required")
          setAttaching(false)
          return
        }
        const response = await axios.post("/api/tickets/attachments", {
          ticketId: ticket.id,
          fileName: linkName,
          fileUrl: linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`
        })
        if (response.status === 201) {
          toast.success("Link attached successfully")
          setLinkName("")
          setLinkUrl("")
          setShowAttachmentForm(false)
          queryClient.invalidateQueries({ queryKey: ["tickets"] })
        }
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error || "Failed to add attachment")
    } finally {
      setAttaching(false)
    }
  }

  const handleDeleteAttachment = async (id: string) => {
    setDeletingAttachmentId(id)
    try {
      const response = await axios.delete(`/api/tickets/attachments?id=${id}`)
      if (response.status === 200) {
        toast.success("Attachment removed")
        queryClient.invalidateQueries({ queryKey: ["tickets"] })
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error || "Failed to delete attachment")
    } finally {
      setDeletingAttachmentId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <PaperclipIcon className="size-3.5 text-primary" />
          </div>
          <h3 className="text-xs font-bold uppercase text-foreground tracking-widest">Attachments</h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 font-bold bg-muted text-muted-foreground rounded-full border border-border/40">
          {ticket.attachments?.length || 0} files
        </span>
      </div>

      {/* Attachment Form */}
      {showAttachmentForm ? (
        <form onSubmit={handleAttachSubmit} className="p-3.5 bg-card/60 border border-border/30 rounded-xl flex flex-col gap-3.5 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 bg-muted/65 p-1 rounded-lg self-start">
            <button
              type="button"
              onClick={() => { setAttachmentType("file"); setFile(null); }}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                attachmentType === "file" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Upload File
            </button>
            <button
              type="button"
              onClick={() => { setAttachmentType("link"); setLinkName(""); setLinkUrl(""); }}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                attachmentType === "link" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Attach Link
            </button>
          </div>

          {attachmentType === "file" ? (
            <div className="flex flex-col gap-2">
              <input
                type="file"
                id="ticket-file-picker"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="ticket-file-picker"
                className="flex flex-col items-center justify-center border border-dashed border-border/70 rounded-xl p-5 cursor-pointer hover:bg-muted/15 transition-all text-center"
              >
                <UploadIcon className="size-6 text-muted-foreground/70 mb-1.5" />
                <span className="text-xs font-semibold text-foreground truncate max-w-full px-4">
                  {file ? file.name : "Select from computer"}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : "Click to select a local file"}
                </span>
              </label>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider">Link Name</label>
                <input
                  type="text"
                  placeholder="e.g. Design Guidelines"
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-muted/30 border border-border/40 rounded-lg text-xs outline-none focus:border-primary/50 transition-all text-foreground"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider">URL</label>
                <input
                  type="text"
                  placeholder="e.g. docs.google.com/..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-1.5 bg-muted/30 border border-border/40 rounded-lg text-xs outline-none focus:border-primary/50 transition-all text-foreground"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-border/20 pt-2.5">
            <button
              type="button"
              onClick={() => { setShowAttachmentForm(false); setFile(null); }}
              className="px-3 py-1.5 border border-border/40 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted/65 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={attaching}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {attaching && <Loader2Icon className="size-3 animate-spin" />}
              {attachmentType === "file" ? "Upload" : "Save Link"}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowAttachmentForm(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-border/50 hover:border-primary/40 text-muted-foreground hover:text-primary bg-muted/20 hover:bg-primary/5 text-xs font-semibold rounded-xl transition-all cursor-pointer"
        >
          <PlusIcon className="size-3.5" /> Add Attachment
        </button>
      )}

      {/* Attachments List */}
      <div className="flex flex-col gap-1.5">
        {ticket.attachments && ticket.attachments.length > 0 ? (
          ticket.attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center justify-between p-3 bg-muted/20 border border-border/30 rounded-xl group hover:border-border/60 hover:bg-muted/40 transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                {getFileIcon(att.fileName)}
                <div className="flex flex-col min-w-0">
                  <a
                    href={att.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-foreground hover:text-primary hover:underline truncate flex items-center gap-1 pr-2"
                  >
                    {att.fileName}
                    <ExternalLinkIcon className="size-3 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                  </a>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDate(att.createdAt)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleDeleteAttachment(att.id)}
                disabled={deletingAttachmentId === att.id}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-500 rounded-lg hover:bg-red-500/5 transition-all text-muted-foreground cursor-pointer disabled:opacity-50"
              >
                {deletingAttachmentId === att.id ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  <Trash2Icon className="size-3.5" />
                )}
              </button>
            </div>
          ))
        ) : (
          <div className="py-6 text-center border border-dashed border-border/30 rounded-xl bg-muted/10">
            <PaperclipIcon className="size-5 text-muted-foreground/40 mx-auto mb-1.5" />
            <p className="text-xs text-muted-foreground italic">No attachments yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
