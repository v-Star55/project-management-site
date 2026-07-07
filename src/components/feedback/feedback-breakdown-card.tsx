
import { Bug, Sparkles, Heart, HelpCircle, ClipboardList, Layers } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"

interface FeedbackBreakdownCardProps {
  bugs: number
  features: number
  improvements: number
  appreciations: number
  others: number
  total: number
}

export function FeedbackBreakdownCard({
  bugs,
  features,
  improvements,
  appreciations,
  others,
  total,
}: FeedbackBreakdownCardProps) {
  // Helper to calculate percentages
  const getPercent = (count: number) => {
    if (total === 0) return 0
    return Math.round((count / total) * 100)
  }

  const items = [
    {
      label: "Bug Reports",
      count: bugs,
      percent: getPercent(bugs),
      icon: Bug,
      colorClass: "text-red-500 bg-red-500/10 border-red-500/20",
      barClass: "bg-red-500",
    },
    {
      label: "Feature Requests",
      count: features,
      percent: getPercent(features),
      icon: Sparkles,
      colorClass: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      barClass: "bg-blue-500",
    },
    {
      label: "Improvements",
      count: improvements,
      percent: getPercent(improvements),
      icon: ClipboardList,
      colorClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      barClass: "bg-emerald-500",
    },
    {
      label: "Client Appreciations",
      count: appreciations,
      percent: getPercent(appreciations),
      icon: Heart,
      colorClass: "text-pink-500 bg-pink-500/10 border-pink-500/20",
      barClass: "bg-pink-500",
    },
    {
      label: "Others / General",
      count: others,
      percent: getPercent(others),
      icon: HelpCircle,
      colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      barClass: "bg-amber-500",
    },
  ]

  return (
    <Card className="border-border/50 shadow-xs rounded-3xl overflow-hidden bg-card/60 backdrop-blur-xs select-none pt-0 pb-0 gap-0">
      <CardHeader className="border-b border-border/40 bg-muted/5 py-4 px-6">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
            <Layers className="size-4.5 text-primary" />
            Feedback Breakdown
          </CardTitle>
          <span className="text-[10px] font-black bg-primary/10 text-primary py-0.5 px-2 rounded-full border border-primary/20">
            {total} Total
          </span>
        </div>
        <CardDescription className="text-[10px] text-muted-foreground leading-normal mt-1">
          Distribution statistics of incoming feedback items for the selected project filter.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10 px-4">
            <div className="size-10 rounded-2xl bg-muted/40 flex items-center justify-center mb-3">
              <ClipboardList className="size-5 text-muted-foreground/40" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground">No feedback metrics to show</p>
            <p className="text-[9px] text-muted-foreground/60 mt-1 max-w-[200px]">
              Feedback item data is currently empty for this selection.
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.label} className="group space-y-2">
              {/* Row Stats Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`size-7 rounded-xl flex items-center justify-center border transition-all ${item.colorClass}`}>
                    <item.icon className="size-3.5" />
                  </div>
                  <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    {item.label}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-foreground">{item.count}</span>
                  <span className="text-[10px] text-muted-foreground font-semibold ml-1.5">
                    ({item.percent}%)
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                <div
                  style={{ width: `${item.percent}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${item.barClass}`}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
