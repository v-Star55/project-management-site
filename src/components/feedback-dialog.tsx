"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  SendIcon,
  SparklesIcon,
  BugIcon,
  LightbulbIcon,
  HelpCircleIcon,
  CheckCircle2Icon,
  Loader2Icon,
} from "lucide-react"

const DEPARTMENTS = [
  { value: "engineering", label: "Engineering", icon: <BugIcon className="size-4" /> },
  { value: "design", label: "Design", icon: <SparklesIcon className="size-4" /> },
  { value: "product", label: "Product", icon: <LightbulbIcon className="size-4" /> },
  { value: "support", label: "Support", icon: <HelpCircleIcon className="size-4" /> },
  { value: "billing", label: "Billing", icon: <HelpCircleIcon className="size-4" /> },
  { value: "other", label: "Other", icon: <HelpCircleIcon className="size-4" /> },
]

const PROBLEM_TYPES = [
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "improvement", label: "Improvement" },
  { value: "question", label: "Question" },
  { value: "other", label: "Other" },
]

const PRIORITY_LEVELS = [
  { value: "low", label: "Low", color: "bg-emerald-500" },
  { value: "medium", label: "Medium", color: "bg-amber-500" },
  { value: "high", label: "High", color: "bg-orange-500" },
  { value: "critical", label: "Critical", color: "bg-red-500" },
]

interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const [formData, setFormData] = React.useState({
    department: "",
    problemType: "",
    priority: "",
    subject: "",
    description: "",
  })
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent">("idle")

  const isValid =
    formData.department &&
    formData.problemType &&
    formData.priority &&
    formData.subject.trim() &&
    formData.description.trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    setStatus("sending")

    // Simulate API call — replace with your actual endpoint
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setStatus("sent")

    // Reset after showing success
    setTimeout(() => {
      setFormData({
        department: "",
        problemType: "",
        priority: "",
        subject: "",
        description: "",
      })
      setStatus("idle")
      onOpenChange(false)
    }, 2000)
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        {status === "sent" ? (
          /* ── Success State ── */
          <div className="flex flex-col items-center justify-center h-full gap-4 animate-in fade-in-0 zoom-in-95 duration-300">
            <div className="flex items-center justify-center size-16 rounded-full bg-primary/10">
              <CheckCircle2Icon className="size-8 text-primary" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-semibold text-foreground">
                Feedback Sent!
              </h3>
              <p className="text-sm text-muted-foreground max-w-[260px]">
                Thank you for your feedback. We&apos;ll review it and get back to you
                soon.
              </p>
            </div>
          </div>
        ) : (
          /* ── Form State ── */
          <>
            <SheetHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10">
                  <SendIcon className="size-5 text-primary" />
                </div>
                <div>
                  <SheetTitle>Send Feedback</SheetTitle>
                  <SheetDescription>
                    Help us improve by sharing your experience
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 pb-6 pt-2">
              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="feedback-department">Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={(v) => handleChange("department", v)}
                >
                  <SelectTrigger id="feedback-department" className="w-full">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept.value} value={dept.value}>
                        <span className="flex items-center gap-2">
                          {dept.icon}
                          {dept.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Problem Type */}
              <div className="space-y-2">
                <Label htmlFor="feedback-type">Problem Type</Label>
                <Select
                  value={formData.problemType}
                  onValueChange={(v) => handleChange("problemType", v)}
                >
                  <SelectTrigger id="feedback-type" className="w-full">
                    <SelectValue placeholder="What kind of feedback?" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROBLEM_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label>Priority</Label>
                <div className="flex gap-2">
                  {PRIORITY_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => handleChange("priority", level.value)}
                      className={`
                        flex-1 flex items-center justify-center gap-1.5 px-3 py-2
                        rounded-xl text-xs font-medium transition-all duration-200
                        border cursor-pointer
                        ${
                          formData.priority === level.value
                            ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/10"
                            : "border-transparent bg-input/50 text-muted-foreground hover:bg-input/80"
                        }
                      `}
                    >
                      <span
                        className={`size-2 rounded-full ${level.color} ${
                          formData.priority === level.value ? "animate-pulse" : ""
                        }`}
                      />
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="feedback-subject">Subject</Label>
                <Input
                  id="feedback-subject"
                  placeholder="Brief summary of your feedback"
                  value={formData.subject}
                  onChange={(e) => handleChange("subject", e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="feedback-description">Description</Label>
                <Textarea
                  id="feedback-description"
                  placeholder="Describe the issue or suggestion in detail…"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="min-h-[140px]"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.description.length} / 1000
                </p>
              </div>

              {/* Actions */}
              <SheetFooter className="flex-row gap-3 p-0 pt-2">
                <SheetClose asChild>
                  <Button type="button" variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </SheetClose>
                <Button
                  type="submit"
                  disabled={!isValid || status === "sending"}
                  className="flex-1 gap-2"
                >
                  {status === "sending" ? (
                    <>
                      <Loader2Icon className="size-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <SendIcon className="size-4" />
                      Send Feedback
                    </>
                  )}
                </Button>
              </SheetFooter>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
