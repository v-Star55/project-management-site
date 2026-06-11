"use client"

import React, { useState } from "react"
import axios from "axios"
import { toast } from "sonner"
import { EyeIcon, EyeOffIcon, Loader2Icon, UserPlusIcon } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface InviteMemberFormProps {
  companyId: string
  onSuccess: () => void
}

export default function InviteMemberForm({ companyId, onSuccess }: InviteMemberFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [designation, setDesignation] = useState("")
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
        designation: designation.trim() || null,
      })

      toast.success(response.data.message || "Team member invited successfully!")
      
      // Reset form fields
      setName("")
      setEmail("")
      setPassword("")
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

      {/* Designation */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Designation
        </label>
        <input
          type="text"
          placeholder="e.g. Frontend Developer (Optional)"
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
          disabled={isSubmitting}
          className="w-full px-4 py-2.5 bg-muted/50 rounded-xl border border-border/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-sm outline-none transition-all text-foreground font-medium"
        />
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
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
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
