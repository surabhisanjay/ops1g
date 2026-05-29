import { useMemo } from "react";
import { useApp } from "@/lib/store";
import { useMountedNow } from "@/hooks/use-now";
import { tourLiveStatus, TOUR_LIVE_LABEL, type TourLiveStatus } from "@/lib/engine";
import { Badge } from "@/components/ui/badge";
import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CLS: Record<TourLiveStatus, string> = {
  upcoming: "border-info/40 bg-info/10 text-info",
  live: "border-accent/50 bg-accent/15 text-accent animate-pulse",
  late: "border-destructive/40 bg-destructive/10 text-destructive",
  "needs-form": "border-warning/40 bg-warning/10 text-warning-foreground",
  done: "border-success/40 bg-success/10 text-success",
  cancelled: "bg-muted text-muted-foreground border-border",
  "no-show": "border-destructive/30 bg-destructive/5 text-destructive",
};

export function LiveTourStatusBar({ className }: { className?: string }) {
  const { tours } = useApp();
  const [now, mounted] = useMountedNow();

  const counts = useMemo(() => {
    const map: Record<TourLiveStatus, number> = {
      upcoming: 0,
      live: 0,
      late: 0,
      "needs-form": 0,
      done: 0,
      cancelled: 0,
      "no-show": 0,
    };
    for (const t of tours) {
      map[tourLiveStatus(t, now)]++;
    }
    return map;
  }, [tours, now]);

  const chips: TourLiveStatus[] = ["live", "upcoming", "late", "needs-form"];

  return (
    <div className={cn("rounded-xl border border-border bg-card p-3", className)}>
      <div className="flex items-center gap-2 mb-2">
        <Radio className="h-3.5 w-3.5 text-accent" />
        <span className="text-xs font-semibold">Live tour status</span>
        <span className="text-[10px] text-muted-foreground font-mono ml-auto">
          {mounted ? "updates every minute" : "\u00a0"}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((key) => (
          <Badge
            key={key}
            variant="outline"
            className={cn("text-[10px] font-medium gap-1", STATUS_CLS[key])}
          >
            {TOUR_LIVE_LABEL[key]}
            <span className="font-mono tabular-nums">{counts[key]}</span>
          </Badge>
        ))}
        {(counts.cancelled > 0 || counts["no-show"] > 0) && (
          <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">
            {counts.cancelled + counts["no-show"]} closed out
          </Badge>
        )}
      </div>
    </div>
  );
}
