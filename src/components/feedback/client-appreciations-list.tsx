
import { HeartIcon, MessageSquareIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { Feedback } from "./types"

interface ClientAppreciationsListProps {
  appreciations: Feedback[]
  onSelectFeedback: (item: Feedback) => void
}

export function ClientAppreciationsList({
  appreciations,
  onSelectFeedback,
}: ClientAppreciationsListProps) {
  return (
    <Card className="border-pink-500/20 shadow-xs rounded-3xl overflow-hidden bg-card/60 backdrop-blur-xs select-none pt-0 pb-0 gap-0">
      <CardHeader className="border-b border-pink-500/10 bg-pink-500/5 py-4 px-6">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm font-black uppercase tracking-wider text-pink-500 flex items-center gap-2">
            <HeartIcon className="size-4 text-pink-500 fill-pink-500 animate-pulse" />
            Client Appreciations
          </CardTitle>
          <span className="text-[10px] font-black bg-pink-500/10 text-pink-500 py-0.5 px-2 rounded-full border border-pink-500/20">
            {appreciations.length}
          </span>
        </div>
        <CardDescription className="text-[10px] text-muted-foreground leading-normal mt-1">
          Recent shoutouts, rating scores, and positive feedback left by clients.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-3 max-h-[500px] overflow-y-auto pr-1.5 animate-in fade-in duration-300">
        {appreciations.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10 px-4">
            <div className="size-10 rounded-2xl bg-muted/40 flex items-center justify-center mb-3">
              <HeartIcon className="size-5 text-muted-foreground/40" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground">No client appreciations yet</p>
            <p className="text-[9px] text-muted-foreground/60 mt-1 max-w-[200px]">
              When clients leave positive feedback, it will appear here.
            </p>
          </div>
        ) : (
          appreciations.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectFeedback(item)}
              className="group flex flex-col gap-2.5 p-3 rounded-2xl border border-pink-500/10 bg-pink-500/5 hover:bg-pink-500/10 hover:border-pink-500/30 transition-all duration-200 cursor-pointer"
            >
              {/* User Metadata */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Avatar className="size-5 border border-pink-500/20">
                    <AvatarImage src={item.user.imageUrl || ""} />
                    <AvatarFallback className="text-[8px] font-black uppercase bg-pink-500/20 text-pink-600">
                      {item.user.name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[11px] font-black text-foreground truncate max-w-[100px]">
                    {item.user.name}
                  </span>
                </div>
                <span className="text-[9px] text-muted-foreground/80 font-medium">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-0.5">
                <h4 className="text-[11px] font-bold text-foreground group-hover:text-pink-500 transition-colors line-clamp-1">
                  {item.subject}
                </h4>
                <p className="text-[10px] text-muted-foreground/90 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Footer Rating */}
              <div className="flex items-center justify-between border-t border-pink-500/10 pt-2 text-[9px] text-muted-foreground border-dashed">
                <div className="flex items-center gap-1.5">
                  {item.satisfactionLevel && (
                    <span className="font-extrabold text-pink-500 bg-pink-500/10 px-1.5 py-0.5 rounded border border-pink-500/25">
                      ❤️ {item.satisfactionLevel}/10
                    </span>
                  )}
                  {item.project && (
                    <span className="font-semibold text-muted-foreground/70 truncate max-w-[100px]">
                      in {item.project.title}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <MessageSquareIcon className="size-3 text-pink-500" />
                  <span>{item._count?.comments || 0}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
