import { motion } from "framer-motion";
import { Link } from "wouter";
import { Activity, ArrowRight, TrendingUp } from "lucide-react";
import { useLiveHealth, useLiveSignalCounts, useLiveSignals } from "@/hooks/use-polymarket";
import { StatCard, Badge, TableSkeleton } from "@/components/ui-elements";
import { formatRelativeTime, getStrategyColor, parseNumeric, formatPrice } from "@/lib/utils";

export default function Overview() {
  const { data: health, isLoading: healthLoading } = useLiveHealth();
  const { data: signalCounts, isLoading: countsLoading } = useLiveSignalCounts();
  const { data: recentSignals, isLoading: signalsLoading } = useLiveSignals({ limit: 8 });

  const totalSignals24h = Object.values(signalCounts?.counts || {}).reduce((a, b) => a + b, 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">System Overview</h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Monitored Markets" 
          value={healthLoading ? "..." : health?.markets || 0}
          subtitle="Active watchlists"
          tooltip="Markets currently on the bot's watchlist. Refreshed hourly by scanning 6,000+ active Polymarket markets and selecting the top 20 by volume and liquidity."
        />
        <StatCard 
          title="Data Snapshots" 
          value={healthLoading ? "..." : (health?.snapshots || 0).toLocaleString()}
          subtitle="Time-series data points"
          tooltip="Total price snapshots collected across all markets. Each snapshot captures bid/ask spread, 7-day price history, open interest, holders, and recent trades. New snapshots are collected every 5 minutes."
        />
        <StatCard 
          title="Signals Generated" 
          value={healthLoading ? "..." : (health?.signals || 0).toLocaleString()}
          subtitle="All-time engine outputs"
          tooltip="All-time count of trading signals emitted by the three strategy engines: spread harvesting (wide bid/ask gaps), neg-risk arbitrage (overround on mutually exclusive outcomes), and mean reversion (price shocks on thin liquidity)."
        />
        <StatCard 
          title="24H Activity" 
          value={countsLoading ? "..." : totalSignals24h}
          trend="up"
          subtitle="Signals in last 24h"
          tooltip="Signals fired in the last 24 hours across all strategy engines. Higher activity means more pricing inefficiencies were detected in the current market environment."
          className="border-primary/30 bg-primary/5"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Strategy Breakdown */}
        <div className="lg:col-span-1 terminal-panel flex flex-col">
          <div className="terminal-header">
            <span>Strategy Engine Status</span>
            <Activity size={14} />
          </div>
          <div className="p-4 flex-1 flex flex-col justify-center space-y-6">
            {countsLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-muted/20 rounded"></div>
                <div className="h-8 bg-muted/20 rounded"></div>
                <div className="h-8 bg-muted/20 rounded"></div>
              </div>
            ) : Object.entries(signalCounts?.counts || {}).length === 0 ? (
              <div className="text-center text-muted-foreground text-sm font-mono py-8">
                No signals generated in the last 24h.
              </div>
            ) : (
              Object.entries(signalCounts?.counts || {}).map(([strategy, count]) => {
                const percentage = totalSignals24h > 0 ? (count / totalSignals24h) * 100 : 0;
                return (
                  <div key={strategy} className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-mono">
                      <span className="text-foreground">{strategy}</span>
                      <span className="text-primary font-bold">{count}</span>
                    </div>
                    <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full ${getStrategyColor(strategy).split(' ')[0].replace('text-', 'bg-')}`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Signals Feed */}
        <div className="lg:col-span-2 terminal-panel flex flex-col">
          <div className="terminal-header">
            <span>Live Action Feed</span>
            <Link href="/signals" className="text-primary hover:text-primary-foreground flex items-center gap-1 cursor-pointer">
              View All <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex-1 overflow-auto p-0">
            {signalsLoading ? (
              <div className="p-4"><TableSkeleton /></div>
            ) : recentSignals?.signals.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground font-mono text-sm">
                Awaiting first signal...
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentSignals?.signals.map((signal) => (
                  <Link key={signal.id} href={signal.marketId ? `/markets/${signal.marketId}` : "/signals"}>
                    <div className="data-row p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getStrategyColor(signal.strategy)}>
                            {signal.strategy}
                          </Badge>
                          <span className="text-xs font-mono text-muted-foreground">
                            {formatRelativeTime(signal.emittedAt)}
                          </span>
                        </div>
                        <p className="text-sm font-medium truncate text-foreground group-hover:text-primary transition-colors">
                          {signal.question || signal.eventSlug || "Unknown Market"}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-6 shrink-0">
                        {signal.signalScore && (
                          <div className="text-right">
                            <div className="text-[10px] text-muted-foreground font-mono mb-1 uppercase">Score</div>
                            <div className="text-sm font-mono font-bold text-primary">
                              {parseNumeric(signal.signalScore).toFixed(2)}
                            </div>
                          </div>
                        )}
                        {signal.entryPrice && (
                          <div className="text-right">
                            <div className="text-[10px] text-muted-foreground font-mono mb-1 uppercase">Target</div>
                            <div className="text-sm font-mono font-bold text-success flex items-center gap-1">
                              {formatPrice(signal.entryPrice)}
                              <TrendingUp size={12} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
