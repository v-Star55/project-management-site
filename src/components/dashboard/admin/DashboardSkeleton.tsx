"use client"

import React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function DashboardSkeleton() {
  return (
    <div className="flex-1 flex flex-col gap-6 p-5 md:p-7 w-full overflow-auto animate-pulse">
      {/* Title block */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-60 rounded-lg" />
        <Skeleton className="h-4 w-96 rounded-md" />
      </div>

      {/* KPI stats skeleton grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="border-border/50 bg-card/50">
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-4 w-12 rounded-full" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-7 w-16 rounded-md" />
                <Skeleton className="h-3 w-28 rounded-sm" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main dashboard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
        {/* Left column (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-6 w-full">
          {/* Weekly Performance Skeleton */}
          <Card className="border-border/50">
            <CardHeader className="py-4 px-6 border-b border-border/40">
              <Skeleton className="h-5 w-40 rounded-md" />
            </CardHeader>
            <CardContent className="p-6">
              <Skeleton className="h-[250px] w-full rounded-xl" />
            </CardContent>
          </Card>

          {/* Overdue Tasks + Upcoming Deadlines Skeleton Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="border-border/50 rounded-3xl">
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-5 w-36 rounded-md" />
                      <Skeleton className="h-3 w-48 rounded-sm" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="border border-border/40 rounded-xl p-3.5 flex flex-col gap-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-3 w-20 rounded-sm" />
                        <Skeleton className="h-4 w-14 rounded-md" />
                      </div>
                      <Skeleton className="h-4 w-44 rounded-md" />
                      <div className="flex justify-between items-center pt-2 border-t border-border/20">
                        <div className="flex items-center gap-1.5">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-3 w-16 rounded-sm" />
                        </div>
                        <Skeleton className="h-3 w-12 rounded-sm" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Projects Section Skeleton */}
          <Card className="border-border/50">
            <CardHeader className="py-4 px-6 border-b border-border/40 flex flex-row items-center justify-between">
              <Skeleton className="h-5 w-32 rounded-md" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            </CardHeader>
            <CardContent className="p-6 flex flex-col gap-5">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="border border-border/50 p-5 rounded-2xl flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <Skeleton className="h-10 w-10 rounded-2xl" />
                      <div className="flex flex-col gap-1">
                        <Skeleton className="h-5 w-44 rounded-md" />
                        <Skeleton className="h-3.5 w-60 rounded-sm" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-16 rounded-md" />
                  </div>
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-3 w-full rounded-full" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-24 rounded-md" />
                    <Skeleton className="h-8 w-28 rounded-lg" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right column (1/3 width) */}
        <div className="lg:col-span-1 flex flex-col gap-6 w-full">
          {/* Ticket Distribution Skeleton */}
          <Card className="border-border/50">
            <CardHeader className="py-4 px-6 border-b border-border/40">
              <Skeleton className="h-5 w-44 rounded-md" />
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <Skeleton className="h-40 w-40 rounded-full" />
              <div className="flex flex-col gap-2 mt-6 w-full">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-3 w-16 rounded-sm" />
                    <Skeleton className="h-3 w-8 rounded-sm" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed Skeleton */}
          <Card className="border-border/50 rounded-3xl">
            <CardHeader className="py-4 px-6 border-b border-border/40">
              <Skeleton className="h-5 w-40 rounded-md" />
            </CardHeader>
            <CardContent className="p-6 flex flex-col gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-20 rounded-sm" />
                      <Skeleton className="h-3 w-14 rounded-sm" />
                    </div>
                    <Skeleton className="h-12 w-full rounded-2xl" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Team Workload Skeleton */}
          <Card className="border-border/50">
            <CardHeader className="py-4 px-6 border-b border-border/40">
              <Skeleton className="h-5 w-36 rounded-md" />
            </CardHeader>
            <CardContent className="p-6 flex flex-col gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 flex flex-col gap-1">
                    <Skeleton className="h-3.5 w-24 rounded-sm" />
                    <Skeleton className="h-2 w-16 rounded-sm" />
                  </div>
                  <Skeleton className="h-5 w-10 rounded-md" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Blocked Tickets Skeleton */}
          <Card className="border-border/50">
            <CardHeader className="py-4 px-6 border-b border-border/40">
              <Skeleton className="h-5 w-40 rounded-md" />
            </CardHeader>
            <CardContent className="p-6 flex flex-col gap-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex flex-col gap-1.5 border-b border-border/40 pb-3 last:border-b-0">
                  <Skeleton className="h-4 w-48 rounded-md" />
                  <Skeleton className="h-3.5 w-36 rounded-sm" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
