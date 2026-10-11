import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { LayoutDashboard, Plus, LogOut, Crosshair, Radar, Crown, Globe, Brain, Infinity as InfinityIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/', label: 'Dossiers', icon: LayoutDashboard },
  { to: '/new', label: 'New Analysis', icon: Plus },
  { to: '/ip-factory', label: 'IP Factory', icon: Radar },
  { to: '/command', label: 'Command', icon: Crown },
  { to: '/sovereign', label: 'Sovereign OS', icon: Globe },
  { to: '/vault', label: 'Hegemony Vault', icon: Brain },
  { to: '/omega', label: 'Omega Dashboard', icon: InfinityIcon }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 bg-slate-950 text-slate-300 border-r border-slate-800">
        <div className="px-6 py-7 flex items-center gap-2.5 border-b border-slate-800/80">
          <div className="size-8 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <Crosshair className="size-4 text-slate-950" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-white">ARCHITECT OMNI</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Investment Intelligence</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-5 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.to;
            return (
              <Link key={item.to} to={item.to} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition", active ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white hover:bg-slate-900")}>
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-slate-800/80">
          <div className="text-xs text-slate-500 truncate mb-2 px-1">{user?.email || 'Signed in'}</div>
          <button onClick={() => logout()} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white px-1">
            <LogOut className="size-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 bg-slate-950 text-white px-4 h-14 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <Crosshair className="size-4 text-slate-950" />
          </div>
          <span className="text-sm font-semibold tracking-tight">ARCHITECT OMNI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/" className="text-slate-300"><LayoutDashboard className="size-5" /></Link>
          <Link to="/new" className="text-slate-300"><Plus className="size-5" /></Link>
          <Link to="/ip-factory" className="text-slate-300"><Radar className="size-5" /></Link>
          <Link to="/command" className="text-slate-300"><Crown className="size-5" /></Link>
          <Link to="/sovereign" className="text-slate-300"><Globe className="size-5" /></Link>
          <Link to="/vault" className="text-slate-300"><Brain className="size-5" /></Link>
          <Link to="/omega" className="text-slate-300"><InfinityIcon className="size-5" /></Link>
          <button onClick={() => logout()} className="text-slate-400"><LogOut className="size-5" /></button>
        </div>
      </div>

      <main className="flex-1 md:ml-64 pt-14 md:pt-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}