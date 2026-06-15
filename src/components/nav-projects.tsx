"use client"

import Link from "next/link"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { usePathname, useSearchParams } from "next/navigation"
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
  SidebarGroupAction,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  MoreHorizontalIcon,
  FolderIcon,
  ShareIcon,
  Trash2Icon,
  PlusIcon,
  ChevronRightIcon,
  LayersIcon,
  CheckSquareIcon,
  UsersIcon,
  MessageSquareIcon,
  PaperclipIcon,
} from "lucide-react"
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
  const { user } = useSelector((state: RootState) => state.user)
  const pathname = usePathname() || ""
  const searchParams = useSearchParams()
  const activeTab = searchParams?.get("tab") || "overview"

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      {canEdit && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarGroupAction title="Project Options">
              <PlusIcon />
              <span className="sr-only">Project Options</span>
            </SidebarGroupAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-48"
            side={isMobile ? "bottom" : "right"}
            align={isMobile ? "end" : "start"}
          >
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/${user?.id}/projects/create`} className="flex w-full items-center gap-2 cursor-pointer">
                <PlusIcon className="size-4 text-muted-foreground" />
                <span>Create Project</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <SidebarMenu>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <SidebarMenuItem key={idx}>
              <div className="flex items-center gap-2 px-3 py-2">
                <Skeleton className="h-4 w-4 rounded bg-border/40" />
                <Skeleton className="h-4 w-28 rounded bg-border/40" />
              </div>
            </SidebarMenuItem>
          ))
        ) : projects.length > 0 ? (
          projects.map((item) => {
            const isProjectActive = pathname.startsWith(item.url)
            
            const rawSubItems = [
              {
                title: "Overview",
                url: `${item.url}?tab=overview`,
                icon: <FolderIcon className="size-4" />,
                isActive: isProjectActive && activeTab === "overview",
              },
              {
                title: "Groups",
                url: `${item.url}?tab=groups`,
                icon: <LayersIcon className="size-4" />,
                isActive: isProjectActive && activeTab === "groups",
              },
              {
                title: "Board",
                url: `${item.url}?tab=board`,
                icon: <CheckSquareIcon className="size-4" />,
                isActive: isProjectActive && activeTab === "board",
              },
              {
                title: "Team",
                url: `${item.url}?tab=team`,
                icon: <UsersIcon className="size-4" />,
                isActive: isProjectActive && activeTab === "team",
              },
              {
                title: "Discussions",
                url: `${item.url}?tab=messages`,
                icon: <MessageSquareIcon className="size-4" />,
                isActive: isProjectActive && activeTab === "messages",
              },
              {
                title: "Files",
                url: `${item.url}?tab=files`,
                icon: <PaperclipIcon className="size-4" />,
                isActive: isProjectActive && activeTab === "files",
              },
            ]

            const subItems = user?.role === "client"
              ? rawSubItems.filter(sub => sub.title === "Overview" || sub.title === "Discussions")
              : rawSubItems

            return (
              <Collapsible key={item.name} asChild defaultOpen={isProjectActive}>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isProjectActive}>
                    <Link href={`${item.url}?tab=overview`}>
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                  
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="left-auto right-8 data-[state=open]:rotate-90">
                      <ChevronRightIcon className="size-4 transition-transform duration-200" />
                      <span className="sr-only">Toggle Sub-navigation</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>

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
                          <Link href={`${item.url}?tab=overview`} className="flex w-full items-center gap-2 cursor-pointer">
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

                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {subItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={subItem.isActive}>
                            <Link href={subItem.url} className="flex items-center gap-2">
                              {subItem.icon}
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )
          })
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


