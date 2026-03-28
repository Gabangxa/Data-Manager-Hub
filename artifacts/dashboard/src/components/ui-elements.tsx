import { cn } from "@/lib/utils";

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  trend,
  className
}: { 
  title: string; 
  value: React.ReactNode; 
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}) {
  return (
    <div className={cn("terminal-panel p-5 relative overflow-hidden group", className)}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:bg-primary/10"></div>
      <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">{title}</h3>
      <div className="text-3xl font-bold tracking-tight mb-1 font-mono text-foreground">{value}</div>
      {subtitle && (
        <div className={cn(
          "text-xs font-mono flex items-center gap-1",
          trend === "up" ? "text-success" : 
          trend === "down" ? "text-destructive" : 
          "text-muted-foreground"
        )}>
          {trend === "up" && "↑"}
          {trend === "down" && "↓"}
          {subtitle}
        </div>
      )}
    </div>
  );
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border", className)}>
      {children}
    </span>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 bg-muted/20 rounded animate-pulse w-full"></div>
      ))}
    </div>
  );
}
