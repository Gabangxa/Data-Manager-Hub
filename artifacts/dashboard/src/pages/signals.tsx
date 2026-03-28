import { useState } from "react";
import { motion } from "framer-motion";
import { Filter, Zap } from "lucide-react";
import { useLiveSignals } from "@/hooks/use-polymarket";
import { TableSkeleton, Badge } from "@/components/ui-elements";
import { formatRelativeTime, getStrategyColor, parseNumeric, formatPrice } from "@/lib/utils";
import { Link } from "wouter";

export default function Signals() {
  const [strategyFilter, setStrategyFilter] = useState<string>("");
  const { data, isLoading } = useLiveSignals({ 
    limit: 200,
    strategy: strategyFilter || undefined 
  });

  const strategies = ["", "spread_engine", "neg_risk_engine", "reversion_engine"];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="text-primary" /> Strategy Signals
          </h2>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            Algorithmic trade opportunities from the last 24 hours
          </p>
        </div>
        
        <div className="flex bg-card border border-border p-1 rounded-md">
          {strategies.map(strat => (
            <button
              key={strat}
              onClick={() => setStrategyFilter(strat)}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                strategyFilter === strat 
                  ? "bg-primary text-primary-foreground font-bold" 
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {strat === "" ? "ALL" : strat.replace("_engine", "").toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="terminal-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs font-mono text-muted-foreground uppercase bg-muted/30 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Strategy</th>
                <th className="px-4 py-3 font-medium">Target Market</th>
                <th className="px-4 py-3 font-medium text-right">Score</th>
                <th className="px-4 py-3 font-medium text-right">Entry Price</th>
                <th className="px-4 py-3 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr><td colSpan={6} className="p-4"><TableSkeleton /></td></tr>
              ) : !data || data.signals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground font-mono">
                    <div className="flex flex-col items-center gap-2">
                      <Filter size={24} className="opacity-20" />
                      No signals match the current filter.
                    </div>
                  </td>
                </tr>
              ) : (
                data.signals.map((signal) => (
                  <tr key={signal.id} className="data-row">
                    <td className="px-4 py-4 font-mono text-muted-foreground text-xs" title={signal.emittedAt || ""}>
                      {formatRelativeTime(signal.emittedAt)}
                    </td>
                    <td className="px-4 py-4">
                      <Badge className={getStrategyColor(signal.strategy)}>
                        {signal.strategy}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 font-medium text-foreground max-w-[300px] truncate">
                      {signal.marketId ? (
                         <Link href={`/markets/${signal.marketId}`} className="hover:text-primary transition-colors cursor-pointer">
                           {signal.question || signal.eventSlug || signal.marketId}
                         </Link>
                      ) : (
                        signal.eventSlug || "Unknown"
                      )}
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-primary font-bold">
                      {signal.signalScore ? parseNumeric(signal.signalScore).toFixed(2) : "-"}
                    </td>
                    <td className="px-4 py-4 text-right font-mono text-foreground">
                       {signal.entryPrice ? formatPrice(signal.entryPrice) : "-"}
                    </td>
                    <td className="px-4 py-4 text-center">
                       {signal.resolved ? (
                         <Badge className="bg-muted text-muted-foreground border-border">Resolved</Badge>
                       ) : (
                         <Badge className="bg-primary/20 text-primary border-primary/30 animate-pulse">Active</Badge>
                       )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
