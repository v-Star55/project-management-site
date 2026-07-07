"use client"

import React from "react"
import { ArrowUpRight, ArrowDownRight, CheckSquare, Clock, Bug, UserPlus, Sparkles } from "lucide-react"
import { WeeklyDigest } from "./types"

interface WeeklyDigestStripProps {
  digest: WeeklyDigest
}

interface DigestCardProps {
  icon: React.ReactNode
  label: string
  current: number | string
  past: number | string
  percent: number
  isNegativeBetter?: boolean
}

function DigestCard({ icon, label, current, past, percent, isNegativeBetter = false }: DigestCardProps) {
  const isUp = percent > 0
  const isNeutral = percent === 0
  
  // Decide color scheme for trend indicator
  let trendColor = "text-muted-foreground bg-muted"
  let TrendIcon = null

  if (!isNeutral) {
    const isGood = isNegativeBetter ? !isUp : isUp
    if (isGood) {
      trendColor = "text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 dark:text-emerald-400"
      TrendIcon = <ArrowUpRight className="size-3 shrink-0" />
    } else {
      trendColor = "text-rose-600 bg-rose-500/10 border border-rose-500/20 dark:text-rose-400"
      TrendIcon = <ArrowDownRight className="size-3 shrink-0" />
    }
  }

  return (
    <div className="flex-1 flex items-center justify-between p-4 bg-card/65 backdrop-blur-md rounded-2xl border border-border/40 hover:border-primary/20 hover:bg-card/90 transition-all duration-300 gap-3 shrink-0 min-w-[220px]">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none">
            {label}
          </p>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-lg font-black text-foreground leading-none">{current}</span>
            <span className="text-[10px] text-muted-foreground font-semibold">
              vs {past}
            </span>
          </div>
        </div>
      </div>

      <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5 ${trendColor}`}>
        {TrendIcon}
        {Math.abs(percent)}%
      </div>
    </div>
  )
}

export default function WeeklyDigestStrip({ digest }: WeeklyDigestStripProps) {
  return (
    <div className="w-full flex flex-col gap-3.5 bg-gradient-to-r from-primary/[0.04] via-transparent to-primary/[0.02] border border-border/30 rounded-3xl p-4.5 shadow-xs relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="flex items-center gap-2 relative z-10 px-1">
        <Sparkles className="size-4.5 text-primary" />
        <div>
          <h2 className="text-sm font-extrabold text-foreground">Weekly Performance Digest</h2>
          <p className="text-[11px] text-muted-foreground">Compare company metrics from this week vs. the previous week</p>
        </div>
      </div>

      <div className="w-full flex flex-row gap-4 overflow-x-auto pb-1 scrollbar-thin">
        <DigestCard
          icon={<CheckSquare className="size-4" />}
          label="Tasks Completed"
          current={digest.ticketsCompleted.current}
          past={digest.ticketsCompleted.past}
          percent={digest.ticketsCompleted.percent}
        />
        
        <DigestCard
          icon={<Clock className="size-4" />}
          label="Total Hours Logged"
          current={`${digest.hoursLogged.current}h`}
          past={`${digest.hoursLogged.past}h`}
          percent={digest.hoursLogged.percent}
        />

        <DigestCard
          icon={<Bug className="size-4" />}
          label="Bugs Reported"
          current={digest.bugsReported.current}
          past={digest.bugsReported.past}
          percent={digest.bugsReported.percent}
          isNegativeBetter={true}
        />

        <DigestCard
          icon={<UserPlus className="size-4" />}
          label="Clients Joined"
          current={digest.clientsOnboarded.current}
          past={digest.clientsOnboarded.past}
          percent={digest.clientsOnboarded.percent}
        />
      </div>
    </div>
  )
}
