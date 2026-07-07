"use client"

/**
 * TicketBreakdownChart.tsx
 *
 * Donut (pie with innerRadius) chart that visualises how the member's
 * tickets are distributed across statuses (Completed, In Progress, etc.).
 *
 * An inline legend grid below the chart replaces recharts' built-in
 * Legend component so we have full control over spacing and typography.
 */


import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { DashboardStats } from "./types"
import { PIE_COLORS } from "./constants"

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

/** Tooltip that shows the status name and its count in the slice's colour */
const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border/60 rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-foreground">
        {payload[0].name}:{" "}
        <span style={{ color: payload[0].payload.fill }}>{payload[0].value}</span>
      </p>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TicketBreakdownChartProps {
  stats: DashboardStats
}

/**
 * Builds pie slice data from the stats object, filters out zero-value slices,
 * then renders a donut chart with an inline legend.
 */
export default function TicketBreakdownChart({ stats }: TicketBreakdownChartProps) {
  // Build the data array — filter out any status with zero tickets so the chart
  // doesn't render invisible slices with misleading padding angles.
  const pieData = [
    { name: "Completed",   value: stats.completedTickets,  fill: PIE_COLORS.completed },
    { name: "In Progress", value: stats.inProgressTickets, fill: PIE_COLORS.inProgress },
    { name: "In Review",   value: stats.inReviewTickets,   fill: PIE_COLORS.inReview },
    { name: "Blocked",     value: stats.blockedTickets,    fill: PIE_COLORS.blocked },
    {
      name: "Todo/Reopen",
      // Remaining tickets that don't fall into the named buckets above
      value:
        stats.totalTickets -
        stats.completedTickets -
        stats.inProgressTickets -
        stats.inReviewTickets -
        stats.blockedTickets,
      fill: PIE_COLORS.rest,
    },
  ].filter((d) => d.value > 0)

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm flex flex-col">
      {/* Card header */}
      <div className="mb-4">
        <h2 className="text-base font-bold text-foreground">Ticket Breakdown</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Distribution by status</p>
      </div>

      {/* Empty state — no tickets assigned yet */}
      {stats.totalTickets === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No tickets yet</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center">
          {/* Donut chart */}
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}   // Makes it a donut rather than a full pie
                outerRadius={72}
                paddingAngle={3}   // Small gap between slices for clarity
                dataKey="value"
                strokeWidth={0}    // No border on slices — cleaner look
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} opacity={0.85} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Inline legend grid — 2 columns for compact display */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full mt-2">
            {pieData.map((d, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
              >
                {/* Colour dot matching the slice */}
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: d.fill }}
                />
                <span className="truncate">{d.name}</span>
                {/* Count pushed to the right */}
                <span className="ml-auto font-semibold text-foreground">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
