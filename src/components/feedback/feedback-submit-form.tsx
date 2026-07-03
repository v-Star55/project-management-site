import React from "react"
import { SendIcon, Loader2Icon } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PROBLEM_TYPES, PRIORITY_LEVELS, Project } from "./types"

interface FeedbackSubmitFormProps {
  isAdminOrOwner: boolean
  formData: {
    subject: string
    description: string
    type: string
    priority: string
    projectId: string
  }
  onFormChange: (field: string, value: string) => void
  onSubmit: (e: React.FormEvent) => void
  projects: Project[]
  isPending: boolean
}

export function FeedbackSubmitForm({
  isAdminOrOwner,
  formData,
  onFormChange,
  onSubmit,
  projects,
  isPending,
}: FeedbackSubmitFormProps) {
  if (isAdminOrOwner) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="border-border/50 shadow-xs rounded-3xl overflow-hidden bg-card">
          <CardHeader className="border-b border-border/40 bg-muted/15 py-4 px-6">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground">
              Management Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-xs text-muted-foreground space-y-3 leading-relaxed">
            <p>
              • Submissions categorized as <strong>Bug Report</strong> should be reviewed by engineering team members.
            </p>
            <p>
              • <strong>Ask to Add/Remove</strong> requests represents request scope updates. Coordinate with product manager.
            </p>
            <p>
              • Update feedback status to <strong>In Progress</strong> when actively analyzing or implementing the request.
            </p>
            <p>
              • Resolve requests by clicking <strong>Resolve</strong> and leave a comment explaining changes.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card className="border-border/50 shadow-sm rounded-3xl overflow-hidden bg-card">
      <CardHeader className="border-b border-border/40 bg-muted/15 py-4 px-6">
        <CardTitle className="text-sm font-black uppercase tracking-wider text-foreground">
          Submit New Request
        </CardTitle>
        <CardDescription className="text-[10px] text-muted-foreground leading-normal mt-0.5 select-none">
          Report bugs, suggest features, or ask design questions directly to the product workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Project Relational Select (Optional) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Associate with Project (Optional)</Label>
            <Select
              value={formData.projectId}
              onValueChange={(val) => onFormChange("projectId", val)}
            >
              <SelectTrigger className="text-xs h-9 bg-muted/10 border-border rounded-xl">
                <SelectValue placeholder="Select project relation" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="none" className="text-xs rounded-lg">No project relation</SelectItem>
                {projects.map((proj) => (
                  <SelectItem key={proj.id} value={proj.id} className="text-xs rounded-lg cursor-pointer">
                    {proj.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Type Category</Label>
              <Select
                value={formData.type}
                onValueChange={(val) => onFormChange("type", val)}
              >
                <SelectTrigger className="text-xs h-9 bg-muted/10 border-border rounded-xl">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {PROBLEM_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-xs rounded-lg cursor-pointer">
                      <div className="flex items-center gap-2">
                        {t.icon}
                        <span>{t.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority Select */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Priority Level</Label>
              <Select
                value={formData.priority}
                onValueChange={(val) => onFormChange("priority", val)}
              >
                <SelectTrigger className="text-xs h-9 bg-muted/10 border-border rounded-xl">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {PRIORITY_LEVELS.map((p) => (
                    <SelectItem key={p.value} value={p.value} className="text-xs rounded-lg cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${p.color}`} />
                        <span>{p.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subject Field */}
          <div className="space-y-1.5">
            <Label htmlFor="subject" className="text-xs font-semibold text-foreground">Subject / Title</Label>
            <Input
              id="subject"
              type="text"
              placeholder="e.g. Navigation bar overlaps main page content"
              value={formData.subject}
              onChange={(e) => onFormChange("subject", e.target.value)}
              className="text-xs bg-muted/10 border-border rounded-xl h-9"
            />
          </div>

          {/* Description Field */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold text-foreground">Description</Label>
            <Textarea
              id="description"
              placeholder="Provide specific details, repro steps, or description..."
              value={formData.description}
              onChange={(e) => onFormChange("description", e.target.value)}
              className="min-h-[100px] text-xs rounded-xl border-border bg-muted/10 leading-relaxed"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl gap-2 mt-2 cursor-pointer text-xs font-bold"
          >
            {isPending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <SendIcon className="size-3.5" />
                Submit Request
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
