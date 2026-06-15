"use client"

import { useEffect } from "react"
import { useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import { RootState } from "@/lib/store"
import TimeLogsView from "@/components/dashboard/timeLogsView"

export default function TimeLogsPage() {
  const user = useSelector((state: RootState) => state.user.user)
  const router = useRouter()

  useEffect(() => {
    if (user && user.role === "client") {
      router.push(`/dashboard/${user.id}`)
    }
  }, [user, router])

  if (user?.role === "client") {
    return null
  }

  return <TimeLogsView />
}
