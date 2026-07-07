"use client"

/**
 * DashboardSkeleton.tsx
 *
 * Shown while the dashboard API call is in-flight.
 * Mirrors the rough grid layout of the real dashboard so the page
 * does not jump when data arrives.
 */



export default function DashboardSkeleton() {
  return (
    <div className="flex-1 flex flex-col gap-6 p-6 md:p-8 animate-pulse">
      {/* Page title placeholder */}
      <div className="h-8 w-64 bg-muted rounded-xl" />

      {/* Stat cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-2xl" />
        ))}
      </div>

      {/* Charts row (area chart + pie) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="h-64 bg-muted rounded-2xl lg:col-span-2" />
        <div className="h-64 bg-muted rounded-2xl" />
      </div>

      {/* Due today + upcoming deadlines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-48 bg-muted rounded-2xl" />
        <div className="h-48 bg-muted rounded-2xl" />
      </div>

      {/* Projects section */}
      <div className="h-56 bg-muted rounded-2xl" />

      {/* Bar chart */}
      <div className="h-52 bg-muted rounded-2xl" />
    </div>
  )
}
