"use client"

import React, { useState } from "react"
import axios from "axios"
import { toast } from "sonner"
import { EyeIcon, EyeOffIcon, Loader2Icon, UserPlusIcon, FolderOpenIcon } from "lucide-react"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import { useQuery } from "@tanstack/react-query"

interface InviteClientFormProps {
  companyId: string
  onSuccess: () => void
}

export default function InviteClientForm({ companyId, onSuccess }: InviteClientFormProps) {
  const { user } = useSelector((state: RootState) => state.user)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [designation, setDesignation] = useState("Client Representative")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])

  // Fetch projects to allow direct assignment
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects", user?.id],
    queryFn: async () => {
      const response = await axios.get("/api/projects")
      return response.data.projects
    },
    enabled: !!user?.id,
  })

  const projectsList = projectsData || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Please enter a name or company name")
      return
    }
    if (!email.trim()) {
      toast.error("Please enter an email address")
      return
    }
    if (!password.trim() || password.length < 6) {
      toast.error("Password must be at least 6 characters long")
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Create client user
      const response = await axios.post(`/api/teams/${companyId}`, {
        name,
        email,
        password,
        role: "client",
        designation: designation.trim() || "Client Representative",
      })

      const clientUser = response.data.user

      // 2. Assign selected projects if any
      if (clientUser && selectedProjectIds.length > 0) {
        await axios.patch(`/api/teams/${companyId}`, {
          memberId: clientUser.id,
          projectIds: selectedProjectIds,
        })
      }

      toast.success("Client invited successfully!")
      
      // Reset form fields
      setName("")
      setEmail("")
      setPassword("")
      setDesignation("Client Representative")
      setSelectedProjectIds([])
      
      onSuccess()
    } catch (error: any) {
      console.error("Invite error:", error)
      const errorMsg = error.response?.data?.error || error.response?.data?.message || "Failed to invite client"
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleProject = (projectId: string) => {
    if (selectedProjectIds.includes(projectId)) {
      setSelectedProjectIds(selectedProjectIds.filter(id => id !== projectId))
    } else {
      setSelectedProjectIds([...selectedProjectIds, projectId])
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-2 w-full text-foreground">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Client / Company Name
        </label>
        <input
          type="text"
          placeholder="e.g. Acme Corporation"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          className="w-full px-4 py-2.5 bg-muted/50 rounded-xl border border-border/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-sm outline-none transition-all text-foreground font-medium"
        />
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Email Address
        </label>
        <input
          type="email"
          placeholder="e.g. contact@acme.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          className="w-full px-4 py-2.5 bg-muted/50 rounded-xl border border-border/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-sm outline-none transition-all text-foreground font-medium"
        />
      </div>

      {/* Temporary Password */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Temporary Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Min. 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            className="w-full pl-4 pr-10 py-2.5 bg-muted/50 rounded-xl border border-border/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-sm outline-none transition-all text-foreground font-medium"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none"
          >
            {showPassword ? (
              <EyeOffIcon className="size-4" />
            ) : (
              <EyeIcon className="size-4" />
            )}
          </button>
        </div>
      </div>

      {/* Designation */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Designation / Role Description
        </label>
        <input
          type="text"
          placeholder="e.g. CEO or Client Representative"
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
          disabled={isSubmitting}
          className="w-full px-4 py-2.5 bg-muted/50 rounded-xl border border-border/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-sm outline-none transition-all text-foreground font-medium"
        />
      </div>

      {/* Projects Assignment */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <FolderOpenIcon className="size-3.5 text-primary" />
          Assign to Projects
        </label>
        {isLoadingProjects ? (
          <div className="text-xs text-muted-foreground py-2 flex items-center gap-2">
            <Loader2Icon className="size-3 animate-spin text-primary" />
            Loading projects...
          </div>
        ) : projectsList.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-1">No projects available</p>
        ) : (
          <div className="max-h-[140px] overflow-y-auto border border-border/40 rounded-xl p-2.5 space-y-1.5 bg-muted/20">
            {projectsList.map((project: any) => {
              const isChecked = selectedProjectIds.includes(project.id)
              return (
                <label
                  key={project.id}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted/60 cursor-pointer transition-colors text-xs"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    className="size-3.5 rounded border-border/60 text-primary focus:ring-primary accent-primary"
                    onChange={() => toggleProject(project.id)}
                  />
                  <span className="font-semibold truncate">{project.title}</span>
                </label>
              )
            })}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/95 font-bold rounded-xl shadow-sm hover:shadow transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2"
      >
        {isSubmitting ? (
          <>
            <Loader2Icon className="size-4 animate-spin" />
            Inviting Client...
          </>
        ) : (
          <>
            <UserPlusIcon className="size-4" />
            Add Client
          </>
        )}
      </button>
    </form>
  )
}
