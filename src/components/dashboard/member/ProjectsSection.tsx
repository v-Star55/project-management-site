"use client"

/**
 * ProjectsSection.tsx
 *
 * Tabbed card listing the member's projects.
 *
 * Two tabs — "Active" and "Completed" — filter the project list without
 * a network round-trip since all projects are already in the API response.
 *
 * Each project card shows:
 *  • Initial avatar + title + start date
 *  • Status pill (Not Started / Active / Completed)
 *  • Ticket progress bar with percentage
 *  • Three-column mini stats (Total / Done / Active tickets)
 */

import { useState } from "react";
import { Briefcase, Layers } from "lucide-react"
import { DashboardProject } from "./types"
import { PROJECT_STATUS_COLOR, PROJECT_STATUS_LABEL } from "./constants"
import { formatDate } from "./utils"

interface ProjectsSectionProps {
  projects: DashboardProject[]
}

export default function ProjectsSection({ projects }: ProjectsSectionProps) {
  // Controls which tab is active: "active" or "completed"
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active")

  // Filter projects client-side based on the selected tab
  const filteredProjects = projects.filter((p) =>
    activeTab === "active" ? p.status !== "completed" : p.status === "completed"
  )

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm">
      {/* ── Section header with tab switcher ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Layers className="size-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">My Projects</h2>
            <p className="text-[11px] text-muted-foreground">
              {projects.length} total project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Segmented tab control */}
        <div className="flex items-center gap-1 bg-muted/60 rounded-xl p-1">
          {(["active", "completed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg capitalize transition-all duration-200 ${
                activeTab === tab
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Empty state ── */}
      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Briefcase className="size-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            No {activeTab} projects
          </p>
        </div>
      ) : (
        /* ── Project grid ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Private sub-component ────────────────────────────────────────────────────

interface ProjectCardProps {
  project: DashboardProject
}

/**
 * Individual project card with avatar, progress bar, and ticket count stats.
 * Kept as a private component — only ProjectsSection renders it.
 */
function ProjectCard({ project }: ProjectCardProps) {
  // Compute completion percentage — guard against division by zero
  const progress =
    project.totalTickets > 0
      ? Math.round((project.completedTickets / project.totalTickets) * 100)
      : 0

  return (
    <div className="group flex flex-col gap-3 p-4 rounded-xl border border-border/40 bg-muted/20 hover:bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200">
      {/* ── Header: avatar + title + status pill ── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Letter avatar using the project's first character */}
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-sm font-extrabold text-primary">
            {project.title.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{project.title}</p>
            {project.startDate && (
              <p className="text-[11px] text-muted-foreground">
                Started {formatDate(project.startDate)}
              </p>
            )}
          </div>
        </div>

        {/* Status pill */}
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${
            PROJECT_STATUS_COLOR[project.status] ?? ""
          }`}
        >
          {PROJECT_STATUS_LABEL[project.status] ?? project.status}
        </span>
      </div>

      {/* ── Progress bar ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-muted-foreground font-medium">Progress</span>
          <span className="text-[11px] font-bold text-foreground">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ── Ticket count stats ── */}
      <div className="flex items-center gap-3 pt-1 border-t border-border/30">
        <StatPill label="Total" value={project.totalTickets} color="text-foreground" />
        <div className="w-px h-6 bg-border/50" />
        <StatPill label="Done" value={project.completedTickets} color="text-emerald-500" />
        <div className="w-px h-6 bg-border/50" />
        <StatPill label="Active" value={project.inProgressTickets} color="text-blue-500" />
      </div>
    </div>
  )
}

/** Tiny vertical stat column used inside ProjectCard */
function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`text-sm font-extrabold ${color}`}>{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}
