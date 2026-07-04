"use client"

import React from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useSelector } from "react-redux"
import axios from "axios"
import { formatDistanceToNow } from "date-fns"
import { RootState } from "@/lib/store"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ActivityIcon } from "lucide-react"

interface RecentActivityCardProps {
  className?: string
}

export default function RecentActivityCard({ className }: RecentActivityCardProps) {
  const { user } = useSelector((state: RootState) => state.user)
  const userId = user?.id

  const {
    data: activityData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["user-activity-logs", userId],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await axios.get(
        `/api/users/${userId}/activity?page=${pageParam}&limit=8`
      )
      return res.data
    },
    getNextPageParam: (lastPage: any) => lastPage.nextPage ?? undefined,
    initialPageParam: 1,
    enabled: !!userId,
  })

  const allActivityLogs = React.useMemo(() => {
    return activityData?.pages.flatMap((page: any) => page.activityLogs) || []
  }, [activityData])

  const defaultAvatar = "https://github.com/shadcn.png"

  return (
    <Card className={`border-border/50 shadow-xs rounded-3xl overflow-hidden flex flex-col ${className}`}>
      <CardHeader className="border-b border-border/40 bg-muted/15 flex flex-row items-center py-4 px-6 justify-between shrink-0">
        <div className="flex items-center gap-2">
          <ActivityIcon className="size-4 text-primary" />
          <CardTitle className="text-sm font-bold tracking-wide uppercase text-foreground">Recent Activity Logs</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-1 flex flex-col min-h-0">
        {allActivityLogs.length > 0 ? (
          <div className="flex-1 flex flex-col min-h-0 justify-between">
            <div className="space-y-6 flex-1 overflow-y-auto pr-1 pb-4">
              {allActivityLogs.map((log: any, index: number) => (
                <div key={log.id} className="flex gap-4 relative group">
                  <Avatar className="size-9 border border-border bg-background z-10 relative shrink-0">
                    <AvatarImage src={log.user.imageUrl || defaultAvatar} />
                    <AvatarFallback className="text-xs font-bold">{log.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>

                  {/* Vertical connecting line */}
                  {index < allActivityLogs.length - 1 && (
                    <div className="absolute left-[18px] top-9 bottom-[-24px] w-[1px] bg-border/60" />
                  )}

                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-foreground truncate">{log.user.name}</span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed break-words bg-muted/10 border border-border/20 p-3 rounded-2xl">
                      {log.description}
                    </p>
                    {log.project && (
                      <div className="mt-1.5 flex justify-start">
                        <span className="inline-flex px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-[9px] font-semibold text-primary">
                          {log.project.title}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {hasNextPage && (
              <div className="pt-2 border-t border-border/40 mt-4 flex justify-center shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full max-w-xs text-xs font-semibold text-primary hover:text-primary/80 transition-colors py-2 h-auto rounded-xl border border-border/30 bg-muted/10"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? "Loading more..." : "Load More Activity"}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10 bg-muted/10 border border-dashed border-border/30 rounded-3xl">
            <ActivityIcon className="size-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground italic">No recent log activities found</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
