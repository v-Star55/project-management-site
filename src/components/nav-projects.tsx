"use client"

import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { MoreHorizontalIcon, FolderIcon, ShareIcon, Trash2Icon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export function NavProjects({
  projects,
  isLoading,
  canEdit = false,
}: {
  projects: {
    name: string
    url: string
    icon: React.ReactNode
  }[]
  isLoading?: boolean
  canEdit?: boolean
}) {
  const { isMobile } = useSidebar()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>
        {isLoading ? (
          // Render dynamic loading skeletons
          Array.from({ length: 3 }).map((_, idx) => (
            <SidebarMenuItem key={idx}>
              <div className="flex items-center gap-2 px-3 py-2">
                <Skeleton className="h-4 w-4 rounded bg-border/40" />
                <Skeleton className="h-4 w-28 rounded bg-border/40" />
              </div>
            </SidebarMenuItem>
          ))
        ) : projects.length > 0 ? (
          projects.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild>
                <Link href={item.url}>
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
              {canEdit && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction
                      showOnHover
                      className="aria-expanded:bg-muted"
                    >
                      <MoreHorizontalIcon />
                      <span className="sr-only">More</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-48"
                    side={isMobile ? "bottom" : "right"}
                    align={isMobile ? "end" : "start"}
                  >
                    <DropdownMenuItem asChild>
                      <Link href={item.url} className="flex w-full items-center gap-2 cursor-pointer">
                        <FolderIcon className="size-4 text-muted-foreground" />
                        <span>View Project</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <ShareIcon className="size-4 text-muted-foreground" />
                      <span>Share Project</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Trash2Icon className="size-4 text-muted-foreground" />
                      <span>Delete Project</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </SidebarMenuItem>
          ))
        ) : (
          <SidebarMenuItem>
            <div className="px-3 py-2 text-xs text-muted-foreground">
              No active projects
            </div>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
