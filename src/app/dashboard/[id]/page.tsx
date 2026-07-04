"use client"

import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import AdminDashboard from "@/components/dashboard/adminDashboard"
import ClientDashboard from "@/components/dashboard/clientDashboard"
import MemberDashboard from "@/components/dashboard/memberDashboard"

export default function Page() {
  const user = useSelector((state: RootState) => state.user.user)

  if (user?.role === "admin" || user?.role === "owner") {
    return <AdminDashboard />
  } else if (user?.role === "member") {
    return <MemberDashboard />
  } else if (user?.role === "client") {
    return <ClientDashboard />
  }

  return null
}
