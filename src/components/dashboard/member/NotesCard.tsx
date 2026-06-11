import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ClipboardList, Check, Plus, Trash2, Loader2, AlertCircle, MoreHorizontal } from "lucide-react"
import { Note } from "./types"
import axios from "axios"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

export default function NotesCard() {
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")

  // Fetch Notes
  const { data, isLoading, isError } = useQuery<{ notes: Note[] }>({
    queryKey: ["notes"],
    queryFn: async () => {
      const res = await fetch("/api/users/me/notes")
      if (!res.ok) throw new Error("Failed to fetch notes")
      return res.json()
    },
  })

  // Create Note Mutation
  const createMutation = useMutation({
    mutationFn: async (noteData: { title: string; description: string }) => {
      const res = await axios.post("/api/users/me/notes", noteData)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] })
      setNewTitle("")
      setNewDescription("")
      setIsAdding(false)
    },
  })

  // Toggle Completion Mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      const res = await axios.patch(`/api/users/me/notes/${id}`, { isCompleted })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] })
    },
  })

  // Delete Note Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`/api/users/me/notes/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] })
    },
  })

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    createMutation.mutate({
      title: newTitle.trim(),
      description: newDescription.trim(),
    })
  }

  const notes = data?.notes || []

  return (
    <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-border/20 pb-3 relative">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-5 text-foreground" />
          <h2 className="text-base font-bold text-foreground">Notes</h2>
        </div>

        {/* Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/50 cursor-pointer outline-hidden">
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 border border-border/60">
            <DropdownMenuItem
              onClick={() => setIsAdding(true)}
              className="cursor-pointer gap-2"
            >
              <Plus className="size-3.5 text-purple-500" />
              <span>Add Note</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Notes List */}
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 text-purple-500 animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex items-center gap-2 justify-center py-6 text-red-400">
            <AlertCircle className="size-4" />
            <span className="text-xs font-medium">Failed to load notes</span>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-xs">No notes found. Create one to get started!</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="group flex items-start justify-between gap-3 p-1 rounded-xl transition-all duration-200"
            >
              {/* Checkbox circle & Content */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <button
                  onClick={() =>
                    toggleMutation.mutate({ id: note.id, isCompleted: !note.isCompleted })
                  }
                  className={`mt-1 shrink-0 flex items-center justify-center size-5.5 rounded-full border transition-all duration-200 ${
                    note.isCompleted
                      ? "bg-purple-500 border-purple-500 text-white"
                      : "border-muted-foreground/40 hover:border-purple-500 bg-transparent"
                  }`}
                >
                  {note.isCompleted && <Check className="size-3" />}
                </button>
                <div className="min-w-0 flex-1">
                  <h3
                    className={`text-xs font-semibold text-foreground transition-all duration-200 ${
                      note.isCompleted ? "line-through text-muted-foreground/60" : ""
                    }`}
                  >
                    {note.title}
                  </h3>
                  {note.description && (
                    <p
                      className={`text-[10px] text-muted-foreground mt-0.5 whitespace-pre-wrap leading-relaxed ${
                        note.isCompleted ? "line-through opacity-50" : ""
                      }`}
                    >
                      {note.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Trash Action */}
              <button
                onClick={() => deleteMutation.mutate(note.id)}
                className="text-muted-foreground hover:text-red-400 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Inline Form */}
      {isAdding && (
        <div className="mt-4 pt-3 border-t border-border/20">
          <form onSubmit={handleAddNote} className="space-y-3 p-3 bg-muted/20 rounded-xl border border-border/40">
            <input
              type="text"
              placeholder="Note title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full text-xs font-semibold bg-transparent border-0 p-0 focus:ring-0 text-foreground placeholder:text-muted-foreground/60"
              required
              autoFocus
            />
            <textarea
              placeholder="Add details / description..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
              className="w-full text-[10px] bg-transparent border-0 p-0 focus:ring-0 text-muted-foreground placeholder:text-muted-foreground/60 resize-none"
            />
            <div className="flex justify-end gap-2 text-[10px] font-semibold pt-1 border-t border-border/10">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-2.5 py-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || !newTitle.trim()}
                className="px-2.5 py-1.5 rounded-md bg-purple-500 hover:bg-purple-600 text-white font-bold transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? "Saving..." : "Save Note"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
