"use client"

import React, { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { toast } from "sonner"
import { FileText, Plus, Trash2, X } from "lucide-react"
import { OwnerNote } from "./types"

interface ExecutiveNotesWidgetProps {
  notes: OwnerNote[]
}

export default function ExecutiveNotesWidget({ notes }: ExecutiveNotesWidgetProps) {
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  // Mutate Toggle Completed
  const toggleMutation = useMutation({
    mutationFn: async ({ noteId, isCompleted }: { noteId: string; isCompleted: boolean }) => {
      const response = await axios.patch(`/api/users/me/notes/${noteId}`, { isCompleted })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ownerDashboard"] })
      queryClient.invalidateQueries({ queryKey: ["sidebarNotesBadge"] })
    },
    onError: () => {
      toast.error("Failed to update reminder status")
    },
  })

  // Mutate Add Note
  const addMutation = useMutation({
    mutationFn: async (payload: { title: string; description?: string }) => {
      const response = await axios.post("/api/users/me/notes", payload)
      return response.data
    },
    onSuccess: () => {
      toast.success("Note added successfully")
      setTitle("")
      setDescription("")
      setShowAddForm(false)
      queryClient.invalidateQueries({ queryKey: ["ownerDashboard"] })
      queryClient.invalidateQueries({ queryKey: ["sidebarNotesBadge"] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to create note")
    },
  })

  // Mutate Delete Note
  const deleteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const response = await axios.delete(`/api/users/me/notes/${noteId}`)
      return response.data
    },
    onSuccess: () => {
      toast.success("Note deleted successfully")
      queryClient.invalidateQueries({ queryKey: ["ownerDashboard"] })
      queryClient.invalidateQueries({ queryKey: ["sidebarNotesBadge"] })
    },
    onError: () => {
      toast.error("Failed to delete note")
    },
  })

  const handleToggle = (noteId: string, currentStatus: boolean) => {
    toggleMutation.mutate({ noteId, isCompleted: !currentStatus })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }
    addMutation.mutate({ title, description })
  }

  return (
    <div className="bg-card/45 backdrop-blur-md border border-border/50 rounded-3xl p-5 shadow-xs flex flex-col gap-4 h-[320px] overflow-hidden w-full relative">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <FileText className="size-4.5 text-primary" />
            Executive Workspace Notes
          </h2>
          <p className="text-xs text-muted-foreground">Sticky notes and reminders workspace</p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer"
          title="Add Note"
        >
          {showAddForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
        </button>
      </div>

      {showAddForm ? (
        /* Form */
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-2.5 overflow-y-auto pr-1">
          <input
            type="text"
            placeholder="Reminder title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-1.5 bg-background/50 border border-border/40 hover:border-border/80 focus:border-primary rounded-xl text-xs outline-none transition-all placeholder:text-muted-foreground/60 text-foreground"
          />
          <textarea
            placeholder="Add details/description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-1.5 bg-background/50 border border-border/40 hover:border-border/80 focus:border-primary rounded-xl text-xs outline-none transition-all placeholder:text-muted-foreground/60 text-foreground resize-none"
          />
          <button
            type="submit"
            disabled={addMutation.isPending}
            className="w-full py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {addMutation.isPending ? "Adding..." : "Add Note"}
          </button>
        </form>
      ) : (
        /* List */
        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 scrollbar-thin">
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center gap-1 border border-dashed border-border/40 rounded-2xl">
              <p className="text-[11px] font-bold text-foreground">No active reminders</p>
              <p className="text-[10px] text-muted-foreground">Keep track of your quick notes here.</p>
            </div>
          ) : (
            [...notes].sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted)).map((note) => (
              <div
                key={note.id}
                className={`flex items-start justify-between p-3 bg-background/30 border border-border/40 rounded-2xl transition-all duration-200 gap-3 group ${note.isCompleted ? "opacity-60" : ""
                  }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <input
                    type="checkbox"
                    checked={note.isCompleted}
                    onChange={() => handleToggle(note.id, note.isCompleted)}
                    className="mt-1 size-3.5 accent-primary rounded-md border-border bg-background cursor-pointer"
                  />

                  <div className="min-w-0">
                    <p className={`text-xs font-bold text-foreground truncate max-w-[170px] ${note.isCompleted ? "line-through text-muted-foreground" : ""
                      }`}>
                      {note.title}
                    </p>
                    {note.description && (
                      <p className={`text-[10px] text-muted-foreground/80 line-clamp-1 mt-0.5 ${note.isCompleted ? "line-through text-muted-foreground/50" : ""
                        }`}>
                        {note.description}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => deleteMutation.mutate(note.id)}
                  disabled={deleteMutation.isPending}
                  className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0 cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
