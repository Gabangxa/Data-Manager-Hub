import { Link, useLocation } from "wouter";
import { 
  Activity, 
  BarChart2, 
  Database, 
  LayoutDashboard, 
  Terminal,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLiveHealth } from "@/hooks/use-polymarket";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/markets", label: "Markets", icon: BarChart2 },
  { href: "/signals", label: "Signals", icon: Activity },
  { href: "/snapshots", label: "Data Feed", icon: Database },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: health, isError } = useLiveHealth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-border bg-card/50 flex flex-col backdrop-blur-sm z-10 shrink-0">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-md border border-primary/30 text-primary">
            <Terminal size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight">PolyBot</h1>
            <p className="text-xs text-muted-foreground font-mono">v1.0.0-beta</p>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            
            return (
              <Link key={item.href} href={item.href} className="block">
                <div className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 font-medium group cursor-pointer",
                  isActive 
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent"
                )}>
                  <Icon size={18} className={cn(
                    "transition-transform duration-200", 
                    isActive ? "scale-110" : "group-hover:scale-110"
                  )} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <div className="terminal-panel p-3">
            <div className="flex items-center gap-2 text-xs font-mono mb-2">
              <div className={cn("w-2 h-2 rounded-full animate-pulse", isError ? "bg-destructive" : "bg-success")} />
              <span className="text-muted-foreground">SYSTEM STATUS</span>
            </div>
            {health ? (
              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Markets:</span>
                  <span className="text-foreground">{health.markets}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Signals:</span>
                  <span className="text-foreground">{health.signals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data Points:</span>
                  <span className="text-foreground">{health.snapshots}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground animate-pulse">Connecting to core...</div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
            <Clock size={14} />
            <span>{new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span className="text-xs font-mono text-success">LIVE FEED</span>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
