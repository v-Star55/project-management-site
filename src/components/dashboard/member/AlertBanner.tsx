"use client"

/**
 * AlertBanner.tsx
 *
 * Displays a premium capsule pill containing dashboard stats:
 * - Due Today
 * - Awaiting Review
 * - Blocked
 * - Reopened
 *
 * Always displayed under the dashboard header, showing '0' for items without counts.
 */

import React from "react"
import { Flame, Eye, AlertTriangle, RotateCcw } from "lucide-react"

interface AlertCounts {
  dueTodayCount: number
  awaitingReviewCount: number
  blockedCount: number
  reopenCount: number
}

interface AlertBannerProps {
  alerts: AlertCounts
}

export default function AlertBanner({ alerts }: AlertBannerProps) {
  const { dueTodayCount, awaitingReviewCount, blockedCount, reopenCount } = alerts

  const items = [
    {
      key: "dueToday",
      icon: <Flame className="size-4 text-muted-foreground" />,
      count: `${dueTodayCount || 0}`,
      label: `Due Today`,
    },
    {
      key: "awaitingReview",
      icon: <Eye className="size-4 text-muted-foreground" />,
      count: `${awaitingReviewCount || 0}`,
      label: `Awaiting Review`,
    },
    {
      key: "blocked",
      icon: <AlertTriangle className="size-4 text-muted-foreground" />,
      count: `${blockedCount || 0}`,
      label: `Blocked`,
    },
    {
      key: "reopen",
      icon: <RotateCcw className="size-4 text-muted-foreground" />,
      count: `${reopenCount || 0}`,
      label: `Reopened`,
    },
  ]

  return (
    <div className="mt-3 flex">
      <div className="inline-flex items-center gap-4 px-5 py-2.5 rounded-full bg-muted border border-border backdrop-blur-md shadow-sm">
        {items.map((item, index) => (
          <React.Fragment key={item.key}>
            {index > 0 && <div className="w-px h-4 bg-border" aria-hidden="true" />}
            <div className="flex items-center gap-2">
              {item.icon}
              <span className="text-sm font-semibold text-foreground leading-none">{item.count}</span>
              <span className="text-xs text-muted-foreground font-medium leading-none">{item.label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
