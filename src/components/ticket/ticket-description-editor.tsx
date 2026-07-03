"use client"

import { Ticket } from "../dashboard/ticketsView"
import { CalendarIcon, Loader2Icon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TicketDescriptionEditorProps {
  ticket: Ticket
  isEditing: boolean
  setIsEditing: (editing: boolean) => void
  editDescription: string
  setEditDescription: (desc: string) => void
  editGroupId: string
  setEditGroupId: (groupId: string) => void
  editDueDate: string | undefined
  setEditDueDate: (date: string | undefined) => void
  editEstimatedHours: string
  setEditEstimatedHours: (hours: string) => void
  projectGroups: any[]
  isSaving: boolean
  handleSave: () => Promise<void>
}

export default function TicketDescriptionEditor({
  ticket,
  isEditing,
  setIsEditing,
  editDescription,
  setEditDescription,
  editGroupId,
  setEditGroupId,
  editDueDate,
  setEditDueDate,
  editEstimatedHours,
  setEditEstimatedHours,
  projectGroups,
  isSaving,
  handleSave,
}: TicketDescriptionEditorProps) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">Description</h3>
      {isEditing ? (
        <div className="flex flex-col gap-4 bg-muted/15 border border-border/40 rounded-2xl p-5">
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="w-full min-h-[120px] bg-transparent border-0 focus:outline-none text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap resize-y focus:ring-0"
            placeholder="Provide a detailed description of the ticket..."
          />
          
          {/* Group, Due Date & Estimated Hours Selectors in Edit Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border/30">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">Project Group</label>
              <Select value={editGroupId} onValueChange={setEditGroupId}>
                <SelectTrigger className="w-full bg-card border border-border/50 rounded-xl h-9 px-3 text-xs cursor-pointer">
                  <SelectValue placeholder="Select Group" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border/50 rounded-2xl shadow-xl z-[200] max-h-60 overflow-y-auto">
                  <SelectItem value="none" className="rounded-xl cursor-pointer">None</SelectItem>
                  {projectGroups.map((g: any) => (
                    <SelectItem key={g.id} value={g.id} className="rounded-xl cursor-pointer">
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">Due Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-start text-left font-normal bg-card border border-border/50 hover:bg-muted/20 text-foreground rounded-xl h-9 px-3 text-xs cursor-pointer"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                    {editDueDate ? new Date(editDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : <span className="text-muted-foreground">Pick a date</span>}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl border border-border/50 z-[200] bg-popover shadow-xl" align="start">
                  <Calendar
                    mode="single"
                    selected={editDueDate ? new Date(editDueDate) : undefined}
                    onSelect={(date) => setEditDueDate(date ? date.toISOString() : undefined)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">Est. Hours</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 4.5"
                value={editEstimatedHours}
                onChange={(e) => setEditEstimatedHours(e.target.value)}
                className="w-full bg-card border border-border/50 rounded-xl h-9 px-3 text-xs focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 text-foreground font-medium"
              />
            </div>
          </div>

          {/* Save & Cancel Buttons */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-border/30">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-bold rounded-xl border border-border/40 transition-all cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isSaving && <Loader2Icon className="size-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 bg-muted/20 border border-border/40 rounded-2xl p-5">
          <div className="relative min-h-[80px] text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {ticket.description ? (
              ticket.description
            ) : (
              <span className="text-muted-foreground italic">No description provided for this ticket.</span>
            )}
          </div>
          
          {/* Display Group inline if present */}
          {ticket.group && (
            <div className="flex flex-wrap gap-4 pt-3 border-t border-border/20 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="font-bold text-[9px] uppercase tracking-wider text-muted-foreground/80">Group:</span>
                <span className="text-foreground/90 font-medium">{ticket.group.name}</span>
              </span>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
