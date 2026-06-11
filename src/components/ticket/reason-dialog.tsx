"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertCircleIcon, RotateCcwIcon, XIcon } from "lucide-react"

interface ReasonDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (reason: string) => void
  actionType: "blocked" | "reopen"
}

export default function ReasonDialog({ open, onClose, onSubmit, actionType }: ReasonDialogProps) {
  const [reason, setReason] = useState("")
  const overlayRef = useRef<HTMLDivElement>(null)

  // Reset reason when dialog opens/closes
  useEffect(() => {
    if (open) {
      setReason("")
    }
  }, [open])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, onClose])

  // Prevent background scrolling when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  const isBlocked = actionType === "blocked"
  const themeColor = isBlocked ? "text-red-500 bg-red-500/10 border-red-500/20" : "text-amber-500 bg-amber-500/10 border-amber-500/20"
  const buttonColorClass = isBlocked
    ? "bg-red-600 hover:bg-red-700 text-white shadow-red-600/15"
    : "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/15"

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) return
    onSubmit(reason.trim())
  }

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        ref={overlayRef}
        className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6 transition-all duration-300 animate-in zoom-in-95"
      >
        <div
          className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border/80 overflow-hidden flex flex-col p-6 gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center size-10 rounded-xl border ${themeColor}`}>
                {isBlocked ? (
                  <AlertCircleIcon className="size-5" />
                ) : (
                  <RotateCcwIcon className="size-5" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground leading-tight">
                  {isBlocked ? "Block Ticket" : "Reopen Ticket"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Explain the reason for this status change.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer"
            >
              <XIcon className="size-4.5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="status-reason" className="text-xs font-bold text-foreground/80">
                Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="status-reason"
                placeholder={isBlocked ? "e.g., Waiting for client feedback on design..." : "e.g., QA team found bugs in the login flow..."}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[100px] bg-muted/20 border-border/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                required
                autoFocus
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-2 border-t border-border/30">
              <Button type="button" variant="outline" onClick={onClose} className="px-4 py-2 text-sm rounded-xl">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!reason.trim()}
                className={`px-4 py-2 text-sm rounded-xl font-semibold shadow-sm transition-all duration-200 cursor-pointer ${buttonColorClass}`}
              >
                Submit
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
