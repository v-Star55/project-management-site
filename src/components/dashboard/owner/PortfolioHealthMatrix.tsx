"use client"

import { useState } from "react";
import { Search, ShieldAlert, CheckCircle, AlertTriangle, ChevronRight, Folder } from "lucide-react"
import { OwnerProject } from "./types"
import { useRouter } from "next/navigation"

interface PortfolioHealthMatrixProps {
  projects: OwnerProject[]
  userId: string
}

export default function PortfolioHealthMatrix({ projects, userId }: PortfolioHealthMatrixProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  const getHealthBadge = (health: OwnerProject["health"]) => {
    switch (health) {
      case "on_track":
        return {
          bg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
          label: "On Track",
          icon: <CheckCircle className="size-3 text-emerald-500" />,
        }
      case "at_risk":
        return {
          bg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
          label: "At Risk",
          icon: <AlertTriangle className="size-3 text-amber-500" />,
        }
      case "off_track":
        return {
          bg: "bg-rose-500/10 text-rose-500 border-rose-500/20",
          label: "Off Track",
          icon: <ShieldAlert className="size-3 text-rose-500" />,
        }
    }
  }

  return (
    <div className="bg-card/45 backdrop-blur-md border border-border/50 rounded-3xl p-5 shadow-xs flex flex-col gap-4 max-h-[450px] overflow-hidden w-full">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <Folder className="size-4.5 text-primary" />
            Project Portfolio Health
          </h2>
          <p className="text-xs text-muted-foreground">Portfolio velocity and blockage health audits</p>
        </div>

        {/* Search bar */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-background/50 border border-border/40 hover:border-border/80 focus:border-primary rounded-xl text-xs outline-none transition-all placeholder:text-muted-foreground/60 text-foreground"
          />
        </div>
      </div>

      {/* Projects list */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-2 border border-dashed border-border/40 rounded-2xl">
            <p className="text-xs font-bold text-foreground">No projects found</p>
            <p className="text-[11px] text-muted-foreground">Create projects to populate your health matrix.</p>
          </div>
        ) : (
          filteredProjects.map((project) => {
            const progress =
              project.totalTickets > 0
                ? Math.round((project.completedTickets / project.totalTickets) * 100)
                : 0
            const badge = getHealthBadge(project.health)

            return (
              <div
                key={project.id}
                onClick={() => router.push(`/dashboard/${userId}/projects/${project.id}?tab=overview`)}
                className="p-4 bg-background/40 hover:bg-background/85 border border-border/40 hover:border-primary/20 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col md:flex-row items-stretch justify-between gap-4 group hover:shadow-xs"
              >
                {/* Info block */}
                <div className="flex-1 min-w-0 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5 shadow-inner">
                    <Folder className="size-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-extrabold text-foreground group-hover:text-primary transition-colors truncate">
                        {project.title}
                      </span>
                      <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border flex items-center gap-1 shrink-0 ${badge.bg}`}>
                        {badge.icon}
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground/80 mt-1 capitalize leading-none font-semibold">
                      Phase: <span className="text-foreground">{project.phase.replace("_", " ")}</span> &bull; Team: <span className="text-foreground">{project.members.length + project.admins.length}</span>
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-6 shrink-0 justify-between md:justify-end">
                  <div className="flex flex-col gap-1 w-32">
                    <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden border border-border/10">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          project.health === "off_track" ? "bg-rose-500" : project.health === "at_risk" ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Hours tracked */}
                  <div className="text-right flex flex-col min-w-[70px]">
                    <span className="text-[10px] font-black text-foreground">
                      {project.loggedHours}h / {project.estimatedHours}h
                    </span>
                    <span className="text-[9px] text-muted-foreground font-semibold mt-0.5">
                      Hrs Logged
                    </span>
                  </div>

                  <ChevronRight className="size-4 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all self-center hidden md:block" />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
