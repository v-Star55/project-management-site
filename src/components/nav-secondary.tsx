"use client"

import * as React from "react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { FeedbackDialog } from "@/components/feedback-dialog"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: React.ReactNode
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const [feedbackOpen, setFeedbackOpen] = React.useState(false)

  return (
    <>
      <SidebarGroup {...props}>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                {item.title === "Feedback" ? (
                  <SidebarMenuButton
                    size="sm"
                    onClick={() => setFeedbackOpen(true)}
                    className="cursor-pointer"
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton asChild size="sm">
                    <a href={item.url}>
                      {item.icon}
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  )
}
