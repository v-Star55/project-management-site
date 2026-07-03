"use client"

import { Ticket } from "../dashboard/ticketsView"
import { AlertCircleIcon, RotateCcwIcon } from "lucide-react"
import Image from "next/image"

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

interface TicketReasonHistoryProps {
  ticket: Ticket
}

export default function TicketReasonHistory({ ticket }: TicketReasonHistoryProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="size-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <RotateCcwIcon className="size-3.5 text-amber-500" />
        </div>
        <h3 className="text-xs font-bold uppercase text-foreground tracking-widest">Reason History</h3>
      </div>
      
      <div className="flex flex-col gap-3 bg-muted/10 border border-border/40 rounded-2xl p-5 max-h-[500px] overflow-y-auto no-scrollbar">
        {ticket.reasons && ticket.reasons.length > 0 ? (
          ticket.reasons.map((r: any) => (
            <div
              key={r.id}
              className={`flex gap-3 text-sm items-start p-3.5 rounded-xl border ${
                r.type === "BLOCKED"
                  ? "bg-red-500/5 dark:bg-red-500/10 border-red-500/15"
                  : "bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/15"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {r.type === "BLOCKED" ? (
                  <div className="p-1 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
                    <AlertCircleIcon className="size-3.5" />
                  </div>
                ) : (
                  <div className="p-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <RotateCcwIcon className="size-3.5" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    r.type === "BLOCKED" ? "text-red-500" : "text-amber-500"
                  }`}>
                    {r.type}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDateTime(r.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground/95 mt-1 font-medium leading-relaxed whitespace-pre-wrap">{r.reason}</p>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
                  <Image
                    src={r.user?.imageUrl || "https://github.com/shadcn.png"}
                    alt={r.user?.name || "User"}
                    width={14}
                    height={14}
                    className="size-3.5 rounded-full object-cover shrink-0"
                    unoptimized
                  />
                  <span>by <strong className="text-foreground/80 font-medium">{r.user?.name || "Unknown"}</strong></span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-xs text-muted-foreground italic text-center py-6">
            No block or reopen reasons recorded.
          </div>
        )}
      </div>
    </section>
  )
}
