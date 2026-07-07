
import { FilterIcon, SearchIcon, MessageSquareIcon, Loader2Icon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns"
import { PROBLEM_TYPES, Feedback, Project, getStatusBadge } from "./types"

interface FeedbackListProps {
  searchQuery: string
  onSearchQueryChange: (val: string) => void
  selectedTypeFilter: string
  onTypeFilterChange: (val: string) => void
  selectedStatusFilter: string
  onStatusFilterChange: (val: string) => void
  selectedProjectFilter: string
  onProjectFilterChange: (val: string) => void
  projects: Project[]
  filteredFeedbacks: Feedback[]
  onSelectFeedback: (item: Feedback) => void
  isAdminOrOwner: boolean
  isLoading: boolean
  activeTab: "active" | "resolved" | "appreciation"
  onActiveTabChange: (tab: "active" | "resolved" | "appreciation") => void
  feedbacks: Feedback[]
  ratingFilter: "all" | "high" | "low"
  onRatingFilterChange: (filter: "all" | "high" | "low") => void
}

export function FeedbackList({
  searchQuery,
  onSearchQueryChange,
  selectedTypeFilter,
  onTypeFilterChange,
  selectedStatusFilter,
  onStatusFilterChange,
  selectedProjectFilter,
  onProjectFilterChange,
  projects,
  filteredFeedbacks,
  onSelectFeedback,
  isAdminOrOwner,
  isLoading,
  activeTab,
  onActiveTabChange,
  feedbacks,
  ratingFilter,
  onRatingFilterChange,
}: FeedbackListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Queue Segmented Tabs */}
      <div className="flex border border-border/40 mb-6 select-none bg-muted/15 p-1 rounded-2xl gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onActiveTabChange("active")}
          className={`flex-grow py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer text-center ${
            activeTab === "active"
              ? "bg-card text-foreground shadow-xs border border-border/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/10 border border-transparent"
          }`}
        >
          Active Requests ({feedbacks.filter(f => f.type !== "appreciation" && (f.status === "pending" || f.status === "in_progress")).length})
        </button>
        <button
          type="button"
          onClick={() => onActiveTabChange("resolved")}
          className={`flex-grow py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer text-center ${
            activeTab === "resolved"
              ? "bg-card text-foreground shadow-xs border border-border/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/10 border border-transparent"
          }`}
        >
          Resolved Archive ({feedbacks.filter(f => f.type !== "appreciation" && (f.status === "resolved" || f.status === "rejected")).length})
        </button>
        <button
          type="button"
          onClick={() => onActiveTabChange("appreciation")}
          className={`flex-grow py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer text-center ${
            activeTab === "appreciation"
              ? "bg-card text-foreground shadow-xs border border-pink-500/25 text-pink-500"
              : "text-muted-foreground hover:text-foreground hover:bg-pink-500/5 border border-transparent"
          }`}
        >
          Appreciations ({feedbacks.filter(f => f.type === "appreciation").length})
        </button>
      </div>

      {/* Filtering Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-border/40 pb-5">
        <div className="flex items-center gap-2 select-none">
          <FilterIcon className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Queue Filter</h3>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-48">
            <SearchIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search query..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border bg-muted/20 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          {/* Type Filter */}
          {activeTab !== "appreciation" && (
            <Select value={selectedTypeFilter} onValueChange={onTypeFilterChange}>
              <SelectTrigger className="w-[120px] h-8 text-xs rounded-xl bg-muted/20 border-border">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="text-xs rounded-lg cursor-pointer">All Types</SelectItem>
                {PROBLEM_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-xs rounded-lg cursor-pointer">{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Status Filter */}
          {activeTab !== "appreciation" && (
            <Select value={selectedStatusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-[120px] h-8 text-xs rounded-xl bg-muted/20 border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {activeTab === "active" ? (
                  <>
                    <SelectItem value="all" className="text-xs rounded-lg cursor-pointer">All Active</SelectItem>
                    <SelectItem value="pending" className="text-xs rounded-lg cursor-pointer">Pending</SelectItem>
                    <SelectItem value="in_progress" className="text-xs rounded-lg cursor-pointer">In Progress</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="all" className="text-xs rounded-lg cursor-pointer">All Resolved</SelectItem>
                    <SelectItem value="resolved" className="text-xs rounded-lg cursor-pointer">Resolved</SelectItem>
                    <SelectItem value="rejected" className="text-xs rounded-lg cursor-pointer">Rejected</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          )}

          {/* Rating Filters (Only for Appreciation Tab) */}
          {activeTab === "appreciation" && (
            <div className="flex border border-pink-500/10 select-none bg-pink-500/5 p-0.5 rounded-xl gap-0.5 shrink-0 h-8 items-center">
              <button
                type="button"
                onClick={() => onRatingFilterChange("all")}
                className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer text-center ${
                  ratingFilter === "all"
                    ? "bg-card text-pink-500 shadow-xs border border-pink-500/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-pink-500/5 border border-transparent"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => onRatingFilterChange("high")}
                className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer text-center ${
                  ratingFilter === "high"
                    ? "bg-card text-emerald-500 shadow-xs border border-emerald-500/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-emerald-500/5 border border-transparent"
                }`}
              >
                9+ Rating
              </button>
              <button
                type="button"
                onClick={() => onRatingFilterChange("low")}
                className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer text-center ${
                  ratingFilter === "low"
                    ? "bg-card text-amber-500 shadow-xs border border-pink-500/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-pink-500/5 border border-transparent"
                }`}
              >
                Under 7
              </button>
            </div>
          )}

          {/* Project Filter */}
          <Select value={selectedProjectFilter} onValueChange={onProjectFilterChange}>
            <SelectTrigger className="w-[140px] h-8 text-xs rounded-xl bg-muted/20 border-border">
              <SelectValue placeholder="Project Relation" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="text-xs rounded-lg cursor-pointer">All Projects</SelectItem>
              <SelectItem value="none" className="text-xs rounded-lg cursor-pointer">Unassociated</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs rounded-lg cursor-pointer">{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>



      {/* Main List Area */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-20 select-none">
          <div className="flex flex-col items-center gap-2.5">
            <Loader2Icon className="size-6 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Loading feedback queue...</p>
          </div>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 border border-dashed border-border/60 rounded-3xl bg-muted/5 select-none">
          <div className="size-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <FilterIcon className="size-6 text-muted-foreground/60" />
          </div>
          <p className="text-sm font-black text-foreground">No matching feedback found</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[280px] leading-relaxed">
            Try adjusting your search query, status tabs, or project filters to find results.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
          {filteredFeedbacks.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectFeedback(item)}
              className={`group flex flex-col gap-3 p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                item.type === "appreciation"
                  ? "border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/10 hover:border-pink-500/40 hover:shadow-xs"
                  : "border-border/40 bg-muted/5 hover:bg-card hover:border-primary/25 hover:shadow-xs"
              }`}
            >
              {/* Top Row: User & Date & Status */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 select-none">
                  {isAdminOrOwner && (
                    <>
                      <Avatar className="size-6 border border-border">
                        <AvatarImage src={item.user.imageUrl || ""} />
                        <AvatarFallback className="text-[9px] font-black uppercase bg-primary/10 text-primary">
                          {item.user.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-bold text-foreground truncate max-w-[120px]">{item.user.name}</span>
                      <Badge variant="outline" className="text-[8px] uppercase font-black text-muted-foreground py-0.5 px-1 rounded bg-muted/40 leading-none">
                        {item.user.role}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground/60">•</span>
                    </>
                  )}
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <div>
                  {getStatusBadge(item.status)}
                </div>
              </div>

              {/* Subject and Description */}
              <div>
                <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {item.subject}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Bottom Metadata row */}
              <div className="flex items-center justify-between gap-3 border-t border-border/20 pt-2.5 mt-0.5 text-[10px] text-muted-foreground select-none">
                <div className="flex items-center gap-2">
                  <span className={`font-bold uppercase text-[8px] tracking-wide px-1.5 py-0.5 rounded ${
                    item.type === "appreciation" 
                      ? "text-pink-600 bg-pink-500/10 border border-pink-500/20" 
                      : "text-foreground bg-muted"
                  }`}>
                    {item.type}
                  </span>
                  {item.type === "appreciation" && item.satisfactionLevel && (
                    <span className="font-bold text-pink-500 bg-pink-500/10 px-1.5 py-0.5 rounded text-[8.5px] border border-pink-500/25 flex items-center gap-1">
                      ❤️ {item.satisfactionLevel}/10
                    </span>
                  )}
                  {item.project && (
                    <>
                      <span>in</span>
                      <span className="font-bold text-primary truncate max-w-[150px]">{item.project.title}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquareIcon className="size-3 text-muted-foreground/65" />
                  <span>{item._count?.comments || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
