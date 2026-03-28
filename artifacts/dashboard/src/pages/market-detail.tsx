import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Activity, DollarSign, Layers, AlertTriangle } from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import { useLiveMarketHistory } from "@/hooks/use-polymarket";
import { StatCard, Badge } from "@/components/ui-elements";
import { formatCurrency, formatPrice, parseNumeric, formatPercent } from "@/lib/utils";
import { format } from "date-fns";

export default function MarketDetail() {
  const [, params] = useRoute("/markets/:id");
  const marketId = params?.id || "";
  
  const { data, isLoading, isError } = useLiveMarketHistory(marketId, { limit: 168 }); // 7 days of hourly data

  if (isLoading) {
    return <div className="animate-pulse space-y-6 p-6">
      <div className="h-8 bg-muted rounded w-1/4"></div>
      <div className="h-32 bg-muted rounded w-full"></div>
      <div className="h-64 bg-muted rounded w-full"></div>
    </div>;
  }

  if (isError || !data || data.snapshots.length === 0) {
    return (
      <div className="terminal-panel p-12 text-center">
        <AlertTriangle className="mx-auto text-destructive mb-4" size={48} />
        <h2 className="text-xl font-bold mb-2">Market Data Unavailable</h2>
        <p className="text-muted-foreground font-mono mb-6">No snapshots found for ID: {marketId}</p>
        <Link href="/markets">
          <button className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors">
            Return to Markets
          </button>
        </Link>
      </div>
    );
  }

  // The snapshots are returned DESC order. For charting, we want ASC order.
  const chartData = [...data.snapshots].reverse().map(s => ({
    time: s.collectedAt ? format(new Date(s.collectedAt), "MMM dd HH:mm") : "",
    yes: parseNumeric(s.yesPrice),
    no: parseNumeric(s.noPrice),
    midpoint: parseNumeric(s.midpoint),
    spread: parseNumeric(s.spread)
  }));

  const latest = data.snapshots[0];
  const market = {
    question: latest.question,
    tags: latest.tags,
    negRisk: latest.negRisk
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6 pb-12"
    >
      <Link href="/markets" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-mono text-sm transition-colors cursor-pointer">
        <ArrowLeft size={16} /> Back to screener
      </Link>

      <div className="terminal-panel p-6 border-l-4 border-l-primary">
        <div className="flex flex-wrap gap-2 mb-3">
          {market.tags?.map(tag => (
            <Badge key={tag} className="bg-accent text-muted-foreground">{tag}</Badge>
          ))}
          {market.negRisk && (
             <Badge className="text-purple-400 bg-purple-400/10 border-purple-400/20">Negative Risk Evaluated</Badge>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight mb-2">
          {market.question || "Unknown Market Name"}
        </h1>
        <div className="flex items-center gap-4 text-sm font-mono text-muted-foreground">
          <div className="flex items-center gap-1"><Clock size={14}/> ID: {marketId.substring(0,8)}...</div>
          <div className="flex items-center gap-1"><Activity size={14}/> {data.count} snapshots collected</div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Latest Yes Price" 
          value={formatPrice(latest.yesPrice)}
          className="border-success/30 bg-success/5"
        />
        <StatCard 
          title="Latest No Price" 
          value={formatPrice(latest.noPrice)}
          className="border-destructive/30 bg-destructive/5"
        />
        <StatCard 
          title="Current Spread" 
          value={parseNumeric(latest.spread).toFixed(4)}
          subtitle="Distance between best bid/ask"
        />
        <StatCard 
          title="Open Interest" 
          value={formatCurrency(latest.openInterest)}
          subtitle="Capital locked"
        />
      </div>

      <div className="terminal-panel p-1">
        <div className="terminal-header">
          <span>Price Action History (Implied Probability)</span>
          <div className="flex gap-4">
             <span className="text-success flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-success"></div> YES</span>
             <span className="text-destructive flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-destructive"></div> NO</span>
          </div>
        </div>
        <div className="p-4 h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="#71717a" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
                minTickGap={50}
              />
              <YAxis 
                stroke="#71717a" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
                domain={[0, 1]}
                tickFormatter={(val) => val.toFixed(2)}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#27272a', color: '#f4f4f5', fontFamily: 'monospace' }}
                itemStyle={{ fontWeight: 'bold' }}
              />
              <Line 
                type="stepAfter" 
                dataKey="yes" 
                stroke="hsl(var(--success))" 
                strokeWidth={2} 
                dot={false}
                isAnimationActive={false}
              />
              <Line 
                type="stepAfter" 
                dataKey="no" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2} 
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </motion.div>
  );
}
