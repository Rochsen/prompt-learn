import { scoreColor } from "@/lib/score-color";
import type { Dimension } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type DimensionBarsProps = {
  dimensions: Dimension[];
};

export function DimensionBars({ dimensions }: DimensionBarsProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-col gap-3">
        {dimensions.map((dimension) => {
          const ratio = dimension.max === 0 ? 0 : (dimension.score / dimension.max) * 100;
          return (
            <Tooltip key={dimension.name}>
              <TooltipTrigger asChild>
                <button type="button" className="w-full text-left">
                  <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                    <span>{dimension.name}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {dimension.score}/{dimension.max}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-[width]"
                      style={{
                        width: `${Math.min(100, Math.max(0, ratio))}%`,
                        backgroundColor: scoreColor(ratio),
                      }}
                    />
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-left leading-5">
                {dimension.reason}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
