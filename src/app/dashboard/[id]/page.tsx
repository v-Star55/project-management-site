"use client"

import { useSelector } from "react-redux"
import { RootState } from "@/lib/store"
import AdminDashboard from "@/components/dashboard/adminDashboard"
import ClientDashboard from "@/components/dashboard/clientDashboard"
import MemberDashboard from "@/components/dashboard/memberDashboard"
import OwnerDashboard from "@/components/dashboard/ownerDashboard"

export default function Page() {
  const user = useSelector((state: RootState) => state.user.user)

  if (user?.role === "owner") {
    return <OwnerDashboard />
  } else if (user?.role === "admin") {
    return <AdminDashboard />
  } else if (user?.role === "member") {
    return <MemberDashboard />
  } else if (user?.role === "client") {
    return <ClientDashboard />
  }

  return null
}
