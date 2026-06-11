import React from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { UsersIcon, ShieldAlertIcon } from "lucide-react"
import { ProjectDetail, getInitials } from "./utils"

interface ProjectTeamProps {
  projectData: ProjectDetail
  userId: string
}

export default function ProjectTeam({ projectData, userId }: ProjectTeamProps) {
  const router = useRouter()
  const admins = projectData.admins || []
  const members = projectData.members || []

  return (
    <div className="flex flex-col gap-8 w-full">
      <div>
        <h2 className="text-xl font-bold text-foreground">Project Team</h2>
        <p className="text-xs text-muted-foreground">Admins and members collaborating on this project.</p>
      </div>

      {/* Project Admins Section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-2">
          <ShieldAlertIcon className="size-4 text-primary" />
          Project Admins ({admins.length})
        </h3>
        {admins.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
            {admins.map((member) => (
              <div 
                key={member.id}
                className="bg-card border border-border/65 hover:border-primary/45 p-5 hover:bg-muted/15 rounded-2xl transition-all hover:shadow-xs cursor-pointer group flex flex-col items-center text-center gap-3.5 relative"
                onClick={() => router.push(`/dashboard/${userId}/profile?targetUserId=${member.id}`)}
              >
                {member.imageUrl ? (
                  <Image 
                    src={member.imageUrl}
                    alt={member.name}
                    width={64}
                    height={64}
                    className="size-16 rounded-full object-cover border-2 border-primary/30 group-hover:border-primary/50 transition-colors duration-200 shadow-2xs"
                    unoptimized
                  />
                ) : (
                  <div className="size-16 rounded-full bg-primary/5 dark:bg-primary/10 flex items-center justify-center text-lg font-bold text-primary border-2 border-primary/20 group-hover:border-primary/50 transition-colors duration-200 shadow-2xs">
                    {getInitials(member.name)}
                  </div>
                )}
                
                <div className="flex flex-col min-w-0 items-center">
                  <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate w-full max-w-[200px]">
                    {member.name}
                  </span>
                  <span className="text-xs text-muted-foreground truncate w-full max-w-[200px] mt-0.5 font-medium">
                    {member.designation || "Project Admin"}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate w-full max-w-[200px] mt-0.5">
                    {member.email}
                  </span>
                </div>

                <span className="px-2 py-0.5 text-[9px] font-bold rounded-md border bg-primary/10 text-primary border-primary/20 capitalize mt-1">
                  Project Admin
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center bg-card/25 rounded-2xl border border-dashed border-border/80 text-center w-full">
            <p className="text-xs text-muted-foreground">No project admins assigned.</p>
          </div>
        )}
      </div>

      {/* Project Members Section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-foreground/80 uppercase tracking-wider flex items-center gap-2">
          <UsersIcon className="size-4 text-muted-foreground" />
          Project Members ({members.length})
        </h3>
        {members.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
            {members.map((member) => (
              <div 
                key={member.id}
                className="bg-card border border-border/60 hover:border-primary/30 p-5 hover:bg-muted/15 rounded-2xl transition-all hover:shadow-xs cursor-pointer group flex flex-col items-center text-center gap-3.5 relative"
                onClick={() => router.push(`/dashboard/${userId}/profile?targetUserId=${member.id}`)}
              >
                {member.imageUrl ? (
                  <Image 
                    src={member.imageUrl}
                    alt={member.name}
                    width={64}
                    height={64}
                    className="size-16 rounded-full object-cover border-2 border-border group-hover:border-primary/50 transition-colors duration-200 shadow-2xs"
                    unoptimized
                  />
                ) : (
                  <div className="size-16 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-lg font-bold text-stone-700 dark:text-stone-300 border-2 border-border group-hover:border-primary/50 transition-colors duration-200 shadow-2xs">
                    {getInitials(member.name)}
                  </div>
                )}
                
                <div className="flex flex-col min-w-0 items-center">
                  <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate w-full max-w-[200px]">
                    {member.name}
                  </span>
                  <span className="text-xs text-muted-foreground truncate w-full max-w-[200px] mt-0.5 font-medium">
                    {member.designation || "Project Collaborator"}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate w-full max-w-[200px] mt-0.5">
                    {member.email}
                  </span>
                </div>

                <span className="px-2 py-0.5 text-[9px] font-bold rounded-md border bg-muted text-muted-foreground border-border/60 capitalize mt-1">
                  Project Member
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center bg-card/25 rounded-2xl border border-dashed border-border/80 text-center w-full">
            <p className="text-xs text-muted-foreground">No project members assigned.</p>
          </div>
        )}
      </div>
    </div>
  )
}
