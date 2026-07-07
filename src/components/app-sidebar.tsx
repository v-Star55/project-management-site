"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { TerminalSquareIcon, BookOpenIcon, Settings2Icon, LifeBuoyIcon, SendIcon, FrameIcon, PieChartIcon, MapIcon, TerminalIcon, User2Icon, ClockIcon } from "lucide-react";
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"


import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { OwnerNote } from "./dashboard/owner/types"

const data = {

  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: (
        <TerminalSquareIcon
        />
      ),
      isActive: true,
      role: ["owner", "admin", "member", "qa", "client"]
    },
    {
      title: "Feedback",
      url: "#",
      icon: (
        <SendIcon
        />
      ),
      role: ["owner", "admin", "client"]
    },
    {
      title: "Tickets",
      url: "#",
      icon: (
        <BookOpenIcon
        />
      ),
      role: ["owner", "admin", "member", "qa"]
    },
    {
      title: "Teams",
      url: "#",
      icon: (
        <User2Icon/>
      ),
      role: ["owner", "admin", "member", "qa"]
    },
    {
      title: "Time Logs",
      url: "#",
      icon: (
        <ClockIcon />
      ),
      role: ["owner", "admin", "member", "qa"]
    },
        {
      title: "Clients",
      url: "#",
      icon: (
        <BookOpenIcon
        />
      ),
      role: ["owner", "admin"]
    },
  ],
  navSecondary: [
        {
      title: "Settings",
      url: "#",
      icon: (
        <Settings2Icon
        />
      ),
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
      role: ["owner", "admin"]
    },
    {
      title: "Support",
      url: "#",
      icon: (
        <LifeBuoyIcon
        />
      ),
      role: ["owner", "admin", "member", "client"]
    },
  ],
  projects: {
    items: [
      {
        name: "Design Engineering",
        url: "#",
        icon: (
          <FrameIcon
          />
        ),
      },
      {
        name: "Sales & Marketing",
        url: "#",
        icon: (
          <PieChartIcon
          />
        ),
      },
      {
        name: "Travel",
        url: "#",
        icon: (
          <MapIcon
          />
        ),
      },
    ],
    role: ["owner", "admin", "member", "client"]
  },
}

interface User {
  name: string;
  email: string;
  imageUrl?: string;
  role?: string;
  id?: string;
  company?: {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
  };
}


export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const reduxUser = useSelector((state: RootState) => state.user.user);
  const pathname = usePathname() || "";
  
  // Parse active tab from URL path
  const segments = pathname.split("/");
  const activeTab = segments[3] || "dashboard";

  const user: User | null = reduxUser ? {
    name: reduxUser.name,
    email: reduxUser.email,
    imageUrl: reduxUser.imageUrl,
    role: reduxUser.role,
    id: reduxUser.id,
    company: reduxUser.company ? {
      id: reduxUser.company.id,
      name: reduxUser.company.name,
      description: reduxUser.company.description,
      imageUrl: reduxUser.company.imageUrl,
    } : undefined
  } : null;

  // Build navMain with dynamic routes using the user's ID
  const dynamicNavMain = data.navMain.map((item) => {
    let url = "#"
    if (user?.id) {
      if (item.title === "Dashboard") {
        url = `/dashboard/${user.id}`
      } else {
        const path = item.title.toLowerCase().replace(/\s+/g, "")
        url = `/dashboard/${user.id}/${path}`
      }
    }
    return { ...item, url }
  });

  const filteredNavMain = dynamicNavMain.filter((item) =>
    item.role ? item.role.includes(user?.role || "") : true
  );

  const filteredNavSecondary = data.navSecondary.filter((item) =>
    item.role ? item.role.includes(user?.role || "") : true
  );

  const showProjects = data.projects.role ? data.projects.role.includes(user?.role || "") : true;

  // Fetch projects list using React Query
  const { data: projectsData, isLoading: isProjectsLoading } = useQuery({
    queryKey: ["projects", user?.id],
    queryFn: async () => {
      const response = await axios.get("/api/projects")
      return response.data.projects
    },
    enabled: !!user?.id && !!user?.company?.id,
  })

  // Transform projects data to match NavProjects requirements
  const projectsList = (projectsData || []).map((project: any) => ({
    name: project.title,
    url: `/dashboard/${user?.id}/projects/${project.id}`,
    icon: <FrameIcon />,
  }))

  // Fetch pending notes count for the sidebar badge (owner only)
  const { data: notesData } = useQuery<{ notes: OwnerNote[] }>({
    queryKey: ["sidebarNotesBadge", user?.id],
    queryFn: async () => {
      const response = await axios.get("/api/users/me/notes")
      return response.data
    },
    enabled: !!user?.id && user?.role === "owner",
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  })

  const pendingNotesCount = (notesData?.notes || []).filter((n) => !n.isCompleted).length

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {user?.company?.id ? (
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <TerminalIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.company?.name}</span>
                  <span className="truncate text-xs">{user?.role}</span>
                </div>
              </a>
            </SidebarMenuButton>
            ) : (
              <div className="p-2 w-full">
                <p className="font-medium text-sm">Create Your WorkSpace</p>
              </div>
            )}
        </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain 
          items={filteredNavMain} 
          activeTab={activeTab}
          badges={{ Dashboard: pendingNotesCount }}
        />
        {showProjects && (
          <NavProjects 
            projects={projectsList} 
            isLoading={isProjectsLoading} 
            canEdit={user?.role === "owner" || user?.role === "admin"}
          />
        )}
        <NavSecondary items={filteredNavSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
