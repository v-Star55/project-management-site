"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useEffect, useMemo } from "react"
import { useSelector, useDispatch } from "react-redux"
import { RootState } from "@/lib/store"
import axios from "axios"
import { setUser } from "@/lib/redux/userSlice"
import OnBoarding from "@/components/dashboard/onBoarding"
import { usePathname, useRouter } from "next/navigation"
import { Spinner } from "@/components/ui/spinner"
import { useQuery } from "@tanstack/react-query"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good Morning"
  if (hour < 17) return "Good Afternoon"
  return "Good Evening"
}

function getFormattedDate(): string {
  const now = new Date()
  const weekday = now.toLocaleDateString("en-US", { weekday: "long" })
  const day = now.getDate()
  const month = now.toLocaleDateString("en-US", { month: "long" })

  // Ordinal suffix
  const suffix =
    day % 100 >= 11 && day % 100 <= 13
      ? "th"
      : day % 10 === 1
      ? "st"
      : day % 10 === 2
      ? "nd"
      : day % 10 === 3
      ? "rd"
      : "th"

  return `${weekday}, ${day}${suffix} ${month}`
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch()
  const router = useRouter()
  const user = useSelector((state: RootState) => state.user.user)
  const pathname = usePathname() || ""
  const { resolvedTheme, setTheme } = useTheme()

  // Parse active tab from pathname: e.g. /dashboard/[id]/tasks -> tasks
  const segments = pathname.split("/")
  const activeTab = segments[3] || "dashboard"
  const targetUserId = segments[2]
  const isProfilePage = activeTab === "profile"

  // Fetch target profile user data if we are on the profile page
  const { data: profileData } = useQuery({
    queryKey: ["userProfile", targetUserId],
    queryFn: async () => {
      const response = await axios.get(`/api/users/${targetUserId}/profile`)
      return response.data
    },
    enabled: isProfilePage && !!targetUserId,
  })

  // Fetch the logged-in user profile with React Query to ensure robust state and caching
  const { data: userData, isLoading, isError, error } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const response = await axios.get("/api/users/me")
      return response.data.user
    },
    retry: false, // Redirect to login quickly on auth failure
  })

  // Synchronize dynamic query data with Redux store for backward compatibility
  useEffect(() => {
    if (userData) {
      dispatch(setUser(userData))
    }
  }, [userData, dispatch])

  // Redirect to login if user is unauthenticated (401 status)
  useEffect(() => {
    if (isError) {
      const status = (error as any)?.response?.status
      if (status === 401) {
        router.push("/login")
      }
    }
  }, [isError, error, router])

  const greeting = useMemo(() => getGreeting(), [])
  const formattedDate = useMemo(() => getFormattedDate(), [])
  const firstName = user?.name?.split(" ")[0] || ""

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="size-8 text-primary animate-spin" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Loading workspace...
          </p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-border/40 bg-background/80 backdrop-blur-sm">
          {/* Left: sidebar trigger + greeting */}
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-1 data-vertical:h-4 data-vertical:self-auto"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-medium text-muted-foreground tracking-wide">
                {formattedDate}
              </span>
              <span className="text-base font-bold text-foreground tracking-tight">
                {greeting}! {firstName || "there"},
              </span>
            </div>
          </div>

          {/* Right: dark / light mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="rounded-full w-9 h-9 hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4 transition-all" />
            ) : (
              <Moon className="h-4 w-4 transition-all" />
            )}
          </Button>
        </header>

        {user?.company?.id ? (
          children
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-6 md:p-10">
            <OnBoarding />
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}