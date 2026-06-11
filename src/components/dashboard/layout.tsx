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
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Spinner } from "@/components/ui/spinner"
import { useQuery } from "@tanstack/react-query"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useSelector((state: RootState) => state.user.user)
  const pathname = usePathname() || ""
  const { resolvedTheme, setTheme } = useTheme()

  // Parse active tab from pathname: e.g. /dashboard/[id]/tasks -> tasks
  const segments = pathname.split("/").filter(Boolean)
  const activeTab = segments[2] || "dashboard"
  const targetUserId = segments[1]
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

  // Fetch projects list to lookup active project title for breadcrumbs
  const { data: projectsData } = useQuery({
    queryKey: ["projects", user?.id],
    queryFn: async () => {
      const response = await axios.get("/api/projects")
      return response.data.projects
    },
    enabled: !!user?.id && !!user?.company?.id,
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

  const tab = searchParams?.get("tab") || "overview"

  const breadcrumbs = useMemo(() => {
    const items = []
    
    // Always start with Dashboard/Home
    if (user?.id) {
      items.push({
        label: "Dashboard",
        url: `/dashboard/${user.id}`,
        isPage: false,
      })
    } else {
      items.push({
        label: "Dashboard",
        url: "#",
        isPage: false,
      })
    }

    // Parse path starting after the user ID: e.g. /dashboard/[userId]/[section]/[sub...]
    if (segments.length > 2) {
      const section = segments[2] // e.g. "projects", "tickets", "teams", "clients", "profile"

      if (section === "projects") {
        const projectId = segments[3]
        if (projectId && projectId !== "create") {
          const project = projectsData?.find((p: any) => p.id === projectId)
          const projectTitle = project?.title || "Project"
          
          items.push({
            label: "Projects",
            url: `/dashboard/${user?.id}/projects`,
            isPage: false,
          })
          
          items.push({
            label: projectTitle,
            url: `/dashboard/${user?.id}/projects/${projectId}?tab=overview`,
            isPage: false,
          })

          const tabLabels: Record<string, string> = {
            overview: "Overview",
            groups: "Groups",
            board: "Board",
            team: "Team",
            messages: "Discussions",
          }
          items.push({
            label: tabLabels[tab] || "Overview",
            url: `/dashboard/${user?.id}/projects/${projectId}?tab=${tab}`,
            isPage: true,
          })
        } else if (projectId === "create") {
          items.push({
            label: "Projects",
            url: `/dashboard/${user?.id}/projects`,
            isPage: false,
          })
          items.push({
            label: "Create Project",
            url: `/dashboard/${user?.id}/projects/create`,
            isPage: true,
          })
        } else {
          items.push({
            label: "Projects",
            url: `/dashboard/${user?.id}/projects`,
            isPage: true,
          })
        }
      } else if (section) {
        const capitalized = section.charAt(0).toUpperCase() + section.slice(1)
        const detailId = segments[3]
        
        if (detailId) {
          items.push({
            label: capitalized,
            url: `/dashboard/${user?.id}/${section}`,
            isPage: false,
          })
          if (section === "profile" && profileData?.user) {
            items.push({
              label: profileData.user.name || "User Profile",
              url: `/dashboard/${user?.id}/profile/${detailId}`,
              isPage: true,
            })
          } else {
            items.push({
              label: detailId,
              url: `/dashboard/${user?.id}/${section}/${detailId}`,
              isPage: true,
            })
          }
        } else {
          items.push({
            label: capitalized,
            url: `/dashboard/${user?.id}/${section}`,
            isPage: true,
          })
        }
      }
    } else {
      if (items.length > 0) {
        items[0].isPage = true
      }
    }

    return items
  }, [segments, user?.id, projectsData, tab, profileData])

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
          {/* Left: sidebar trigger + breadcrumbs */}
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-1 data-vertical:h-4 data-vertical:self-auto"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((item, index) => (
                  <React.Fragment key={item.label + index}>
                    <BreadcrumbItem>
                      <BreadcrumbPage className={index === breadcrumbs.length - 1 ? "font-semibold text-foreground" : "text-muted-foreground"}>
                        {item.label}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
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