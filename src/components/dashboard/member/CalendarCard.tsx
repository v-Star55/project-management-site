import React, { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Calendar, MoreHorizontal, Video, FileText, CheckSquare, Loader2, AlertCircle, Plus, Link2 } from "lucide-react"
import { CalendarEvent } from "./types"
import { STATUS_COLORS, STATUS_LABEL } from "./constants"
import CreateCalendarEvent from "./CreateCalendarEvent"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

function getDaysOfWeek(anchorDate: Date) {
  const currentDay = anchorDate.getDay() // 0 = Sunday, 1 = Monday, etc.
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay
  const monday = new Date(anchorDate)
  monday.setDate(anchorDate.getDate() + distanceToMonday)

  const days = []
  const dayLabels = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    days.push({
      dayName: dayLabels[i],
      dayNum: day.getDate(),
      dateStr: day.toISOString().split("T")[0],
      dateObj: day,
    })
  }
  return days
}

function formatEventTime(start: string, end?: string | null): string {
  const formatTime12 = (t: string) => {
    const [h, m] = t.split(":")
    const hrs = parseInt(h, 10)
    const mins = parseInt(m, 10)
    const ampm = hrs >= 12 ? "PM" : "AM"
    const hr12 = hrs % 12 || 12
    const minStr = mins.toString().padStart(2, "0")
    return `${hr12}:${minStr} ${ampm}`
  }
  
  if (!start) return ""
  try {
    const startStr = formatTime12(start)
    if (!end) return startStr
    
    const endStr = formatTime12(end)
    return `${startStr} - ${endStr}`
  } catch (e) {
    return start
  }
}

export default function CalendarCard() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date())
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  
  const selectedDateStr = useMemo(() => selectedDate.toISOString().split("T")[0], [selectedDate])
  
  const weekDays = useMemo(() => getDaysOfWeek(new Date()), [])

  const { data, isLoading, isError } = useQuery<{ events: CalendarEvent[] }>({
    queryKey: ["calendar", selectedDateStr],
    queryFn: async () => {
      const res = await fetch(`/api/users/me/calendar?date=${selectedDateStr}`)
      if (!res.ok) throw new Error("Failed to fetch calendar events")
      return res.json()
    },
    staleTime: 1000 * 60, // 1 minute
  })

  // Priority border styling helper
  const getBorderAccent = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "border-l-amber-500"
      case "medium":
        return "border-l-purple-500"
      default:
        return "border-l-emerald-500"
    }
  }

  // Get event type icon
  const getEventIcon = (type: string, title: string) => {
    const lowerType = type?.toLowerCase()
    if (lowerType === "meeting" || lowerType === "call") {
      return <Video className="size-4 text-purple-400" />
    }
    if (lowerType === "reminder") {
      return <AlertCircle className="size-4 text-amber-400" />
    }
    if (lowerType === "sprint") {
      return <CheckSquare className="size-4 text-indigo-400" />
    }
    const lowerTitle = title?.toLowerCase() || ""
    if (lowerTitle.includes("meet") || lowerTitle.includes("call") || lowerTitle.includes("discuss")) {
      return <Video className="size-4 text-muted-foreground" />
    }
    return <FileText className="size-4 text-muted-foreground" />
  }

  const events = data?.events || []

  return (
    <div className="rounded-2xl border border-border/40 bg-card p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-2">
          <Calendar className="size-5 text-foreground" />
          <h2 className="text-base font-bold text-foreground">Calendar</h2>
        </div>
        
        {/* Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/50 cursor-pointer outline-hidden">
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 border border-border/60">
            <DropdownMenuItem
              onClick={() => setIsCreateOpen(true)}
              className="cursor-pointer gap-2"
            >
              <Plus className="size-3.5 text-purple-500" />
              <span>Create Event</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Week strip */}
      <div className="grid grid-cols-7 gap-1 text-center mb-6">
        {weekDays.map((day) => {
          const isSelected = day.dateStr === selectedDateStr
          return (
            <button
              key={day.dateStr}
              onClick={() => setSelectedDate(day.dateObj)}
              className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all duration-200 ${
                isSelected
                  ? "bg-purple-500 text-white font-bold shadow-md shadow-purple-500/20 scale-105"
                  : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-[10px] uppercase font-semibold opacity-80">{day.dayName}</span>
              <span className="text-sm mt-0.5">{day.dayNum}</span>
            </button>
          )
        })}
      </div>

      {/* Event List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 text-purple-500 animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex items-center gap-2 justify-center py-6 text-red-400">
            <AlertCircle className="size-4" />
            <span className="text-xs font-medium">Failed to load calendar</span>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-xs font-medium">No events scheduled for this day</p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className={`flex items-center justify-between p-3 rounded-xl bg-muted/30 border-l-4 ${getBorderAccent(
                event.priority
              )} hover:bg-muted/50 transition-colors duration-200`}
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <div className="mt-0.5 shrink-0">
                  {getEventIcon(event.type, event.title)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-semibold text-foreground truncate">
                    {event.title}
                  </h3>
                  
                  {/* Related project label */}
                  {event.project && (
                    <p className="text-[9px] font-medium text-purple-500 truncate mt-0.5">
                      📁 {event.project.title}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <p className="text-[10px] text-muted-foreground shrink-0">
                      {formatEventTime(event.startTime, event.endTime)}
                    </p>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full border font-medium ${
                        STATUS_COLORS[event.status] ?? "text-muted-foreground bg-muted border-border"
                      }`}
                    >
                      {STATUS_LABEL[event.status] ?? event.status}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground bg-muted/60 px-1 rounded-sm">
                      {event.type}
                    </span>
                  </div>

                  {/* Meeting URL Link */}
                  {event.link && (
                    <a
                      href={event.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[9px] text-purple-500 hover:text-purple-600 font-semibold inline-flex items-center gap-0.5 mt-1 hover:underline cursor-pointer"
                    >
                      <Link2 className="size-2.5" /> Join Meeting
                    </a>
                  )}
                </div>
              </div>

              {/* User Avatar Stack */}
              <div className="flex items-center gap-2 shrink-0 pl-2">
                <div className="flex -space-x-1.5 overflow-hidden">
                  {event.assignedTo && event.assignedTo.length > 0 ? (
                    event.assignedTo.slice(0, 3).map((u) => (
                      u.imageUrl ? (
                        <img
                          key={u.id}
                          className="inline-block size-5.5 rounded-full ring-2 ring-card object-cover"
                          src={u.imageUrl}
                          alt={u.name}
                          title={u.name}
                        />
                      ) : (
                        <div
                          key={u.id}
                          className="inline-block size-5.5 rounded-full bg-purple-500/20 text-purple-400 text-[8px] font-bold flex items-center justify-center ring-2 ring-card"
                          title={u.name}
                        >
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                      )
                    ))
                  ) : (
                    <div className="inline-block size-5.5 rounded-full bg-stone-500/20 text-stone-400 text-[9px] font-bold flex items-center justify-center ring-2 ring-card">
                      —
                    </div>
                  )}
                  {event.assignedTo && event.assignedTo.length > 3 && (
                    <div className="inline-block size-5.5 rounded-full bg-muted border border-border flex items-center justify-center text-[8px] font-bold text-muted-foreground ring-2 ring-card">
                      +{event.assignedTo.length - 3}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Calendar Event Creation Modal */}
      <CreateCalendarEvent
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        selectedDate={selectedDate}
      />
    </div>
  )
}
