"use client"


import { useParams } from "next/navigation"
import UserProfileDetail from "@/components/dashboard/userProfileDetail"

export default function ProfilePage() {
  const params = useParams()
  const userId = params?.id as string

  if (!userId) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">User ID is missing.</p>
      </div>
    )
  }

  return <UserProfileDetail userId={userId} />
}
