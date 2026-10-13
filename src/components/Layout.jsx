import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { LayoutDashboard, Plus, LogOut, Radar, FlaskConical, Radio, TrendingUp, History, Archive, BookOpen, Vault, FileText, ClipboardList, Users, Compass, HeartHandshake, Settings, ShieldCheck, Network, PenLine, Timer, Coins, KanbanSquare, LineChart, Landmark, Waves, Zap, CalendarRange, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_GROUPS = [
  { label: null, items: [
    { to: '/command-center', label: 'Command Center', icon: Gauge },
    { to: '/', label: 'Dossiers', icon: LayoutDashboard },
    { to: '/new', label: 'New Analysis', icon: Plus }
  ]},
  { label: 'Intelligence', items: [
    { to: '/signal-monitoring', label: 'Signal Monitoring', icon: Radio },
    { to: '/market-intel', label: 'Market Intel', icon: TrendingUp },
    { to: '/market-resonance', label: 'Market Resonance', icon: Waves },
    { to: '/synthesis-logs', label: 'Synthesis Logs', icon: History },
    { to: '/synthesis-archive', label: 'Synthesis Archive', icon: Archive },
    { to: '/simulation-archive', label: 'Simulation Archive', icon: Timer },
    { to: '/strategy-vault', label: 'Strategy Vault', icon: BookOpen }
  ]},
  { label: 'Assets', items: [
    { to: '/asset-management', label: 'Asset Management', icon: Vault },
    { to: '/intellectual-assets', label: 'Intellectual Assets', icon: Coins },
    { to: '/prospectus-manager', label: 'Prospectus Manager', icon: FileText },
    { to: '/execution-orders', label: 'Execution Orders', icon: ClipboardList },
    { to: '/ip-factory', label: 'IP Factory', icon: Radar },
    { to: '/persona-manager', label: 'Persona Manager', icon: Users }
  ]},
  { label: 'Capital', items: [
    { to: '/strategy-blueprint', label: 'Strategy Blueprint', icon: Compass },
    { to: '/investor-matchmaker', label: 'Investor Matchmaker', icon: HeartHandshake },
    { to: '/investor-pipeline', label: 'Investor Pipeline', icon: KanbanSquare },
    { to: '/capital-readiness', label: 'Capital Readiness', icon: Landmark },
    { to: '/simulator', label: 'Precision Simulator', icon: FlaskConical }
  ]},
  { label: 'Workshop', items: [
    { to: '/dossier-workshop', label: 'Dossier Workshop', icon: PenLine },
    { to: '/execution-timeline', label: 'Execution Timeline', icon: CalendarRange },
    { to: '/entity-nexus', label: 'Entity Nexus', icon: Network },
    { to: '/disruption-log', label: 'Disruption Log', icon: Zap }
  ]},
  { label: 'Operations', items: [
    { to: '/compliance-audit', label: 'Compliance Audit', icon: ShieldCheck },
    { to: '/synthesis-metrics', label: 'Synthesis Metrics', icon: LineChart },
    { to: '/account-settings', label: 'Account Settings', icon: Settings }
  ]}
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-paper">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 bg-bottle text-bottle-foreground">
        <div className="px-6 py-7 border-b border-white/10">
          <div className="font-heading text-xl tracking-tight">InvestArch</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/50 mt-1">Wealth &amp; Business Dossiers</div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-5 overflow-y-auto">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className="space-y-0.5">
              {group.label && <div className="px-3 pb-1 text-[10px] uppercase tracking-[0.18em] text-white/40">{group.label}</div>}
              {group.items.map((item) => {
                const active = pathname === item.to;
                return (
                  <Link key={item.to} to={item.to} className={cn("flex items-center gap-3 px-3 py-2 text-xs uppercase tracking-[0.12em] transition", active ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5")}>
                    <item.icon className="size-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10">
          <div className="text-xs text-white/50 truncate mb-2 px-1">{user?.email || 'Signed in'}</div>
          <button onClick={() => logout()} className="flex items-center gap-2 text-xs text-white/60 hover:text-white px-1">
            <LogOut className="size-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-bottle text-bottle-foreground px-4 h-14 flex items-center justify-between border-b border-white/10">
        <span className="font-heading text-lg tracking-tight">InvestArch</span>
        <div className="flex items-center gap-4">
          <Link to="/command-center" className="text-white/70"><Gauge className="size-5" /></Link>
          <Link to="/" className="text-white/70"><LayoutDashboard className="size-5" /></Link>
          <Link to="/new" className="text-white/70"><Plus className="size-5" /></Link>
          <Link to="/ip-factory" className="text-white/70"><Radar className="size-5" /></Link>
          <Link to="/simulator" className="text-white/70"><FlaskConical className="size-5" /></Link>
          <Link to="/account-settings" className="text-white/70"><Settings className="size-5" /></Link>
          <button onClick={() => logout()} className="text-white/50"><LogOut className="size-5" /></button>
        </div>
      </div>

      <main className="flex-1 md:ml-64 pt-14 md:pt-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}