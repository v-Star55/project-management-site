"use client"

import React from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import axios from "axios"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ActivityIcon, RefreshCw } from "lucide-react"

interface ProjectActivityCardProps {
  projectId: string
}

export default function ProjectActivityCard({ projectId }: ProjectActivityCardProps) {
  const {
    data: activityData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch
  } = useInfiniteQuery({
    queryKey: ["project-activity-logs", projectId],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await axios.get(
        `/api/projects/${projectId}/activity?page=${pageParam}&limit=8`
      )
      return res.data
    },
    getNextPageParam: (lastPage: any) => lastPage.nextPage ?? undefined,
    initialPageParam: 1,
    enabled: !!projectId,
  })

  const allActivityLogs = React.useMemo(() => {
    return activityData?.pages.flatMap((page: any) => page.activityLogs) || []
  }, [activityData])

  const defaultAvatar = "https://github.com/shadcn.png"

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
          <span className="size-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-[10px] font-semibold">Loading activities...</span>
        </div>
      )
    }

    if (isError) {
      return (
        <div className="text-center py-8 text-xs text-muted-foreground italic">
          Failed to load activity log.
        </div>
      )
    }

    if (allActivityLogs.length > 0) {
      return (
        <div className="space-y-4">
          <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
            {allActivityLogs.map((log: any, index: number) => {
              const userInitials = log.user?.name
                ? log.user.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "U"

              return (
                <div key={log.id} className="flex gap-3 relative group">
                  <Avatar className="size-7.5 border border-border bg-background z-10 relative shrink-0">
                    <AvatarImage src={log.user?.imageUrl || defaultAvatar} />
                    <AvatarFallback className="text-[10px] font-bold">{userInitials}</AvatarFallback>
                  </Avatar>

                  {/* Connecting Line */}
                  {index < allActivityLogs.length - 1 && (
                    <div className="absolute left-[14px] top-7.5 bottom-[-16px] w-[1px] bg-border/60" />
                  )}

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-foreground truncate">
                        {log.user?.name || "System"}
                      </span>
                      <span className="text-[9px] text-muted-foreground whitespace-nowrap shrink-0">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed bg-muted/10 border border-border/20 p-2.5 rounded-xl">
                      {log.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {hasNextPage && (
            <div className="pt-2 border-t border-border/30 mt-2 flex justify-center shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-[10px] font-bold text-primary hover:text-primary/80 transition-colors py-1.5 h-auto rounded-xl border border-border/20 bg-muted/10"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Loading..." : "Load More Activity"}
              </Button>
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="text-center py-10 bg-muted/10 border border-dashed border-border/30 rounded-2xl">
        <ActivityIcon className="size-6 text-muted-foreground/30 mx-auto mb-1.5" />
        <p className="text-xs text-muted-foreground italic">No activities logged yet</p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div className="border-b border-border/30 pb-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ActivityIcon className="size-4.5 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Recent Activity Logs</h3>
        </div>
        <button
          onClick={() => refetch()}
          className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Refresh activities"
        >
          <RefreshCw className="size-3.5" />
        </button>
      </div>

      {renderContent()}
    </div>
  )
}
