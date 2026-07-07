"use client"

import { useState } from "react";
import { Pin, X, ChevronDown, FileText } from "lucide-react"
import { OwnerNote } from "./types"

interface NotesReminderBannerProps {
  notes: OwnerNote[]
  onScrollToNotes?: () => void
}

export default function NotesReminderBanner({ notes, onScrollToNotes }: NotesReminderBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  const pendingNotes = notes.filter((n) => !n.isCompleted)
  const pendingCount = pendingNotes.length

  // Don't show if no pending notes or if dismissed
  if (pendingCount === 0 || isDismissed) return null

  const firstNote = pendingNotes[0]
  const remainingCount = pendingCount - 1

  return (
    <div className="relative w-full animate-in slide-in-from-top-2 fade-in duration-500">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/[0.06] via-blue-500/[0.04] to-indigo-500/[0.06] backdrop-blur-sm shadow-sm">
        {/* Subtle animated shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.04] to-transparent animate-shimmer pointer-events-none" />

        <div className="relative flex items-center justify-between gap-4 px-4 py-3 md:px-5">
          {/* Left: Icon + message */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Pulsing pin icon */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-xl bg-primary/20 animate-ping-slow" />
              <div className="relative flex items-center justify-center size-9 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/15 border border-primary/25">
                <Pin className="size-4 text-primary rotate-45" />
              </div>
            </div>

            {/* Text content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-primary">
                  {pendingCount} pending {pendingCount === 1 ? "note" : "notes"}
                </span>
                <span className="hidden md:inline-block text-[10px] text-muted-foreground/60">•</span>
                <span className="hidden md:inline-block text-[11px] text-muted-foreground truncate max-w-[280px]">
                  &ldquo;{firstNote.title}&rdquo;
                  {remainingCount > 0 && (
                    <span className="text-muted-foreground/50">
                      {" "}and {remainingCount} more
                    </span>
                  )}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5 md:hidden truncate">
                &ldquo;{firstNote.title}&rdquo;
                {remainingCount > 0 && ` +${remainingCount} more`}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View notes button */}
            <button
              onClick={onScrollToNotes}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg
                bg-primary/10 hover:bg-primary/20 text-primary
                border border-primary/20 hover:border-primary/30
                transition-all duration-200 cursor-pointer group"
            >
              <FileText className="size-3" />
              <span>View Notes</span>
              <ChevronDown className="size-3 group-hover:translate-y-0.5 transition-transform" />
            </button>

            {/* Dismiss button */}
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-background/50 transition-all duration-200 cursor-pointer"
              title="Dismiss for now"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
