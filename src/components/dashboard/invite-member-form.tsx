"use client"

import React, { useState } from "react"
import axios from "axios"
import { toast } from "sonner"
import { EyeIcon, EyeOffIcon, Loader2Icon, UserPlusIcon } from "lucide-react"
import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"

import { Select, SelectContent, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";

const DESIGNATIONS = [
  {
    category: "Software",
    options: [
      "Software Engineer",
      "Frontend Developer",
      "Backend Developer",
      "Full Stack Developer",
      "Mobile Developer",
      "Tech Lead",
      "Software Architect",
      "QA Engineer",
      "QA Automation Engineer",
      "DevOps Engineer",
      "Cloud Engineer",
      "Database Administrator",
      "UI/UX Designer",
      "Product Designer",
      "Business Analyst",
      "Product Owner",
      "Scrum Master",
      "Project Manager",
      "Engineering Manager",
      "Intern"
    ]
  },
  {
    category: "Marketing",
    options: [
      "Marketing Manager",
      "Digital Marketing Specialist",
      "SEO Specialist",
      "SEM Specialist",
      "Content Writer",
      "Content Strategist",
      "Social Media Manager",
      "Social Media Executive",
      "Graphic Designer",
      "Brand Manager",
      "Marketing Coordinator",
      "Email Marketing Specialist",
      "Growth Marketer",
      "Performance Marketing Specialist",
      "Marketing Analyst",
      "PR Manager",
      "Copywriter",
      "Creative Director"
    ]
  },
  {
    category: "Interior Design",
    options: [
      "Interior Designer",
      "Senior Interior Designer",
      "Junior Interior Designer",
      "Architect",
      "3D Visualizer",
      "CAD Designer",
      "Project Coordinator",
      "Project Manager",
      "Site Supervisor",
      "Procurement Manager",
      "Furniture Designer",
      "Lighting Designer",
      "Space Planner",
      "Material Consultant",
      "Client Relationship Manager",
      "Design Consultant"
    ]
  },
  {
    category: "High post",
    options: [
      "Co-Founder",
      "CEO",
      "COO",
      "CTO",
      "Director"
    ]
  }
]

interface InviteMemberFormProps {
  companyId: string
  onSuccess: () => void
}

export default function InviteMemberForm({ companyId, onSuccess }: InviteMemberFormProps) {
  const { user } = useSelector((state: RootState) => state.user)
  const isSystemAdmin = user?.role === "admin"

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [designation, setDesignation] = useState("")
  const [designationSearch, setDesignationSearch] = useState("")

  const categoryGroup = DESIGNATIONS.find(g => g.category === selectedCategory)
  const filteredOptions = categoryGroup
    ? categoryGroup.options.filter(opt => opt.toLowerCase().includes(designationSearch.toLowerCase()))
    : []

  const [role, setRole] = useState("member")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Please enter a name")
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
      const response = await axios.post(`/api/teams/${companyId}`, {
        name,
        email,
        password,
        role,
        designation: designation && designation !== "none" ? designation.trim() : null,
      })

      toast.success(response.data.message || "Team member invited successfully!")
      
      // Reset form fields
      setName("")
      setEmail("")
      setPassword("")
      setSelectedCategory("")
      setDesignation("")
      setRole("member")
      
      // Trigger callback
      onSuccess()
    } catch (error: any) {
      console.error("Invite error:", error)
      const errorMsg = error.response?.data?.error || error.response?.data?.message || "Failed to invite member"
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-4 w-full">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Full Name
        </label>
        <input
          type="text"
          placeholder="e.g. Jane Doe"
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
          placeholder="e.g. jane.doe@company.com"
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

      {/* Designation Category / Department */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Department / Category
        </label>
        <Select
          value={selectedCategory}
          onValueChange={(val) => {
            setSelectedCategory(val)
            setDesignation("")
            setDesignationSearch("")
          }}
          disabled={isSubmitting}
        >
          <SelectTrigger className="w-full px-3 py-2.5 bg-muted/50 rounded-xl border border-border/40 text-sm cursor-pointer text-foreground font-medium flex items-center justify-between">
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border border-border bg-popover text-popover-foreground">
            <SelectItem value="none">None / No Department</SelectItem>
            {DESIGNATIONS.map((group) => {
              if (group.category === "High post" && user?.role !== "owner") {
                return null
              }
              return (
                <SelectItem key={group.category} value={group.category}>
                  {group.category}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Designation */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Designation
        </label>
        <Select
          value={designation}
          onValueChange={setDesignation}
          disabled={isSubmitting || !selectedCategory || selectedCategory === "none"}
        >
          <SelectTrigger className="w-full px-3 py-2.5 bg-muted/50 rounded-xl border border-border/40 text-sm cursor-pointer text-foreground font-medium flex items-center justify-between disabled:opacity-50">
            <SelectValue placeholder={(!selectedCategory || selectedCategory === "none") ? "Select a department first" : "Select designation"} />
          </SelectTrigger>
          <SelectContent className="max-h-[250px] overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground">
            {/* Search Input */}
            <div className="p-2 border-b border-border/40 sticky top-0 bg-popover z-10">
              <input
                type="text"
                placeholder="Search designation..."
                value={designationSearch}
                onChange={(e) => setDesignationSearch(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-2.5 py-1.5 bg-muted/40 rounded-lg border border-border/30 text-xs outline-none focus:border-primary/50 transition-all text-foreground font-medium"
              />
            </div>
            <SelectItem value="none">None / No Designation</SelectItem>
            {selectedCategory && selectedCategory !== "none" && (
              <>
                <SelectSeparator />
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-muted-foreground italic">
                    No matching designations
                  </div>
                )}
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Role Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Role
        </label>
        <Select
          value={role}
          onValueChange={setRole}
          disabled={isSubmitting}
        >
          <SelectTrigger className="w-full px-3 py-2.5 bg-muted/50 rounded-xl border border-border/40 text-sm cursor-pointer text-foreground font-medium flex items-center justify-between">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border border-border bg-popover text-popover-foreground">
            <SelectItem value="member">Member</SelectItem>
            {!isSystemAdmin && <SelectItem value="admin">Admin</SelectItem>}
            {!isSystemAdmin && <SelectItem value="owner">Owner</SelectItem>}
            <SelectItem value="qa">QA</SelectItem>
          </SelectContent>
        </Select>
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
            Inviting...
          </>
        ) : (
          <>
            <UserPlusIcon className="size-4" />
            Add Team Member
          </>
        )}
      </button>
    </form>
  )
}
