"use client"

import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { toast } from "sonner"
import axios from "axios"
import Image from "next/image"
import {
  ClockIcon,
  Trash2Icon,
  PlusIcon,
  Loader2Icon
} from "lucide-react"
import { Ticket } from "../dashboard/ticketsView"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

interface TicketTimeLogsProps {
  ticket: Ticket
}

interface DateTimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  label: string
}

function DateTimePicker({ date, setDate, label }: DateTimePickerProps) {
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return
    const newDate = new Date(selectedDate)
    if (date) {
      newDate.setHours(date.getHours())
      newDate.setMinutes(date.getMinutes())
      newDate.setSeconds(0)
      newDate.setMilliseconds(0)
    } else {
      newDate.setHours(12)
      newDate.setMinutes(0)
      newDate.setSeconds(0)
      newDate.setMilliseconds(0)
    }
    setDate(newDate)
  }

  const handleTimeChange = (type: "hour" | "minute", value: string) => {
    if (!date) return
    const newDate = new Date(date)
    const intVal = parseInt(value, 10)
    if (type === "hour") {
      newDate.setHours(intVal)
    } else {
      newDate.setMinutes(intVal)
    }
    setDate(newDate)
  }

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))

  const currentHour = date ? String(date.getHours()).padStart(2, "0") : "12"
  const currentMinute = date ? String(date.getMinutes()).padStart(2, "0") : "00"

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "w-full flex items-center justify-start text-left font-normal px-3 py-1.5 bg-muted/30 border border-border/40 rounded-xl text-xs hover:bg-muted/40 text-foreground h-9 cursor-pointer transition-all outline-none",
              !date && "text-muted-foreground"
            )}
          >
            <ClockIcon className="mr-2 size-3.5 text-muted-foreground shrink-0" />
            <span className="truncate flex-1">
              {date ? (
                `${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}`
              ) : (
                "Pick a date & time"
              )}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex flex-col gap-2 rounded-2xl border border-border/60 shadow-xl bg-popover" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
          />
          <div className="flex items-center gap-2 p-3 border-t border-border/20 bg-muted/20">
            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider shrink-0">Time:</span>
            <div className="flex items-center gap-1 flex-1">
              <select
                value={currentHour}
                onChange={(e) => handleTimeChange("hour", e.target.value)}
                className="px-2 py-1 bg-card border border-border/40 rounded-md text-xs outline-none focus:border-primary/50 text-foreground flex-1"
              >
                {hours.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              <span className="text-muted-foreground font-bold">:</span>
              <select
                value={currentMinute}
                onChange={(e) => handleTimeChange("minute", e.target.value)}
                className="px-2 py-1 bg-card border border-border/40 rounded-md text-xs outline-none focus:border-primary/50 text-foreground flex-1"
              >
                {minutes.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

const formatTimeRange = (startStr: string, endStr: string): string => {
  if (!startStr) return "-"
  const start = new Date(startStr)
  const datePart = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  })
  
  const startTimePart = start.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  })

  if (!endStr) {
    return `${datePart} • ${startTimePart}`
  }

  const end = new Date(endStr)
  const endTimePart = end.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  })

  const isSameDay = start.toDateString() === end.toDateString()
  if (isSameDay) {
    return `${datePart} • ${startTimePart} - ${endTimePart}`
  } else {
    const endDatePart = end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
    return `${datePart} ${startTimePart} - ${endDatePart} ${endTimePart}`
  }
}

const formatTotalTime = (minutes: number) => {
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hrs === 0) return `${mins}m`
  if (mins === 0) return `${hrs}h`
  return `${hrs}h ${mins}m`
}

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function TicketTimeLogs({ ticket }: TicketTimeLogsProps) {
  const queryClient = useQueryClient()
  const user = useSelector((state: RootState) => state.user.user)

  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  const [showTimeForm, setShowTimeForm] = useState(false)
  const [startTime, setStartTime] = useState<Date | undefined>(oneHourAgo)
  const [endTime, setEndTime] = useState<Date | undefined>(now)
  const [logDesc, setLogDesc] = useState("")
  const [loggingTime, setLoggingTime] = useState(false)
  const [deletingTimeLogId, setDeletingTimeLogId] = useState<string | null>(null)

  // Permission check: only assigned user, owner, admin can log hours
  const canLogHours = 
    user && 
    (user.role === "owner" || 
     user.role === "admin" || 
     ticket.assignedUserId === user.id)

  const totalLogMinutes = ticket.timeLogs?.reduce((acc, log) => acc + log.duration, 0) || 0

  const getDuration = () => {
    if (!startTime || !endTime) return 0
    const diffMins = Math.round((endTime.getTime() - startTime.getTime()) / 60000)
    return diffMins > 0 ? diffMins : 0
  }

  const totalMinutes = getDuration()

  const handleLogTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const computedMinutes = getDuration()

    if (computedMinutes <= 0 || !startTime || !endTime) {
      toast.error("Please select an end time that is after the start time")
      return
    }

    setLoggingTime(true)
    try {
      const response = await axios.post("/api/tickets/time-logs", {
        ticketId: ticket.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: computedMinutes,
        description: logDesc.trim() || null
      })
      if (response.status === 201) {
        toast.success("Time logged successfully")
        const freshNow = new Date()
        const freshOneHourAgo = new Date(freshNow.getTime() - 60 * 60 * 1000)
        setStartTime(freshOneHourAgo)
        setEndTime(freshNow)
        setLogDesc("")
        setShowTimeForm(false)
        queryClient.invalidateQueries({ queryKey: ["tickets"] })
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error || "Failed to log hours")
    } finally {
      setLoggingTime(false)
    }
  }

  const handleDeleteTimeLog = async (id: string) => {
    setDeletingTimeLogId(id)
    try {
      const response = await axios.delete(`/api/tickets/time-logs?id=${id}`)
      if (response.status === 200) {
        toast.success("Time log entry deleted")
        queryClient.invalidateQueries({ queryKey: ["tickets"] })
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error || "Failed to delete time log")
    } finally {
      setDeletingTimeLogId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <ClockIcon className="size-3.5 text-blue-500" />
          </div>
          <h3 className="text-xs font-bold uppercase text-foreground tracking-widest">Time Logs</h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 font-bold bg-primary/10 text-primary border border-primary/20 rounded-full">
          Total: {formatTotalTime(totalLogMinutes)}
        </span>
      </div>

      {/* Log time form */}
      {canLogHours ? (
        showTimeForm ? (
          <form onSubmit={handleLogTimeSubmit} className="p-3.5 bg-card/60 border border-border/30 rounded-xl flex flex-col gap-3 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DateTimePicker
                date={startTime}
                setDate={setStartTime}
                label="Start Date & Time"
              />
              <DateTimePicker
                date={endTime}
                setDate={setEndTime}
                label="End Date & Time"
              />
            </div>

            {/* Calculated Duration */}
            <div className="flex items-center justify-between px-3 py-2 bg-primary/5 border border-primary/10 rounded-lg">
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Calculated Duration</span>
              <span className="text-xs font-bold text-primary">
                {totalMinutes > 0 ? formatTotalTime(totalMinutes) : "Invalid time range"}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold uppercase text-muted-foreground tracking-wider">Work Description</label>
              <input
                type="text"
                placeholder="Briefly describe what you accomplished"
                value={logDesc}
                onChange={(e) => setLogDesc(e.target.value)}
                className="w-full px-3 py-1.5 bg-muted/30 border border-border/40 rounded-lg text-xs outline-none focus:border-primary/50 transition-all text-foreground"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-border/20 pt-2.5 mt-1">
              <button
                type="button"
                onClick={() => {
                  setShowTimeForm(false);
                  const freshNow = new Date()
                  const freshOneHourAgo = new Date(freshNow.getTime() - 60 * 60 * 1000)
                  setStartTime(freshOneHourAgo)
                  setEndTime(freshNow)
                  setLogDesc("");
                }}
                className="px-3 py-1.5 border border-border/40 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted/65 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loggingTime || totalMinutes <= 0}
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {loggingTime && <Loader2Icon className="size-3 animate-spin" />}
                Log Hours
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowTimeForm(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-border/50 hover:border-primary/40 text-muted-foreground hover:text-primary bg-muted/20 hover:bg-primary/5 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <PlusIcon className="size-3.5" /> Log Hours
          </button>
        )
      ) : (
        <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-center">
          <p className="text-[10.5px] font-medium text-red-500/80">Only the assigned member, admin, or owner can log hours on this ticket.</p>
        </div>
      )}

      {/* Logged List */}
      <div className="flex flex-col gap-1.5">
        {ticket.timeLogs && ticket.timeLogs.length > 0 ? (
          ticket.timeLogs.map((log) => (
            <div
              key={log.id}
              className="flex flex-col gap-2 p-3.5 bg-muted/20 border border-border/30 rounded-xl group/log hover:border-border/50 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5 min-w-0">
                    <Image
                      src={log.user.imageUrl || "https://github.com/shadcn.png"}
                      alt={log.user.name}
                      width={28}
                      height={28}
                      className="size-7 rounded-full object-cover border border-border"
                      unoptimized
                    />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-foreground truncate">
                      {log.user.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {formatTimeRange(log.startTime, log.endTime)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground bg-muted border border-border/40 px-2 py-0.5 rounded-md whitespace-nowrap">
                    {formatTotalTime(log.duration)}
                  </span>
                  
                  {/* Only show delete if user matches log owner, or is owner/admin */}
                  {user && (log.userId === user.id || user.role === "owner" || user.role === "admin") && (
                    <button
                      onClick={() => handleDeleteTimeLog(log.id)}
                      disabled={deletingTimeLogId === log.id}
                      className="opacity-0 group-hover/log:opacity-100 p-1.5 hover:text-red-500 rounded-lg hover:bg-red-500/5 transition-all text-muted-foreground cursor-pointer disabled:opacity-50"
                    >
                      {deletingTimeLogId === log.id ? (
                        <Loader2Icon className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2Icon className="size-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {log.description && (
                <p className="text-xs text-muted-foreground pl-9.5 leading-relaxed break-words border-l border-border/40 mt-0.5">
                  {log.description}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="py-6 text-center border border-dashed border-border/30 rounded-xl bg-muted/10">
            <ClockIcon className="size-5 text-muted-foreground/40 mx-auto mb-1.5" />
            <p className="text-xs text-muted-foreground italic">No hours logged yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
