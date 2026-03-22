import { Link, NavLink, useLocation } from 'react-router-dom';
import {
    Activity,
    History,
    Trophy,
    Users,
} from 'lucide-react';

export default function Layout({ children }) {
    const location = useLocation();
    const isLeaderboard = location.pathname === '/';

    return (
        <div className="app-shell text-slate-100">
            <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-2xl">
                <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:h-[4.5rem] sm:gap-4 sm:px-6 sm:py-4">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300 shadow-[0_0_28px_rgba(16,185,129,0.18)]">
                            <Trophy className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="section-kicker">PokerPal</div>
                            <div className="font-display text-lg font-bold tracking-tight text-white">Group Ledger</div>
                        </div>
                    </Link>

                    <div className="hidden items-center gap-2 md:flex">
                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold tracking-[0.24em] text-slate-300 uppercase">
                            {isLeaderboard ? 'Live Standings' : 'Session Intelligence'}
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.12)]">
                            <Activity className="h-4 w-4" />
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-6xl flex-1 px-3 py-4 sm:px-6 sm:py-8">
                {children}
            </main>

            <nav className="mobile-nav fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-slate-950/85 px-2 backdrop-blur-2xl">
                <div className="mx-auto grid max-w-3xl grid-cols-3 gap-1 py-2">
                    <BottomNavItem to="/" icon={Trophy} label="Leaderboard" />
                    <BottomNavItem to="/history" icon={History} label="History" />
                    <BottomNavItem to="/players" icon={Users} label="Players" />
                </div>
            </nav>
        </div>
    );
}

function BottomNavItem({ to, icon, label, accent = false }) {
    const IconComponent = icon;

    return (
        <NavLink
            to={to}
            end={to === '/'}
            className={({ isActive }) => `flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-semibold tracking-wide transition-all duration-200 sm:text-[11px] ${isActive ? accent ? 'bg-emerald-400 text-slate-950 shadow-[0_0_28px_rgba(52,211,153,0.3)]' : 'bg-white/10 text-white' : accent ? 'bg-emerald-400/12 text-emerald-300 hover:bg-emerald-400/18' : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'}`}
        >
            <IconComponent className="h-4 w-4" />
            <span>{label}</span>
        </NavLink>
    );
}
