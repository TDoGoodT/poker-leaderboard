import { Link, NavLink, useLocation } from 'react-router-dom';
import {
    Activity,
    History,
    Settings,
    Trophy,
    Users,
} from 'lucide-react';

export default function Layout({ children }) {
    const location = useLocation();
    const isLeaderboard = location.pathname === '/';

    return (
        <div className="app-shell text-slate-100">
            {/* Sticky header — context + back navigation area */}
            <header className="sticky top-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
                <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:h-[4.5rem] sm:gap-4 sm:px-6 sm:py-4">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300 shadow-[0_0_28px_rgba(16,185,129,0.18)]">
                            <Trophy className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                            <div className="section-kicker">PokerPal</div>
                            <div className="font-display text-lg font-bold tracking-tight text-white">Group Ledger</div>
                        </div>
                    </Link>

                    <div className="hidden items-center gap-2 md:flex">
                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold tracking-widest text-slate-300 uppercase">
                            {isLeaderboard ? 'Live Standings' : 'Session Intelligence'}
                        </div>
                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.12)]">
                            <Activity className="h-4 w-4" aria-hidden="true" />
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto flex w-full max-w-6xl flex-1 px-3 py-4 sm:px-6 sm:py-8">
                {children}
            </main>

            {/* Bottom Navigation — glassmorphism, thumb-zone ergonomics */}
            <nav
                className="mobile-nav fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/50 px-2 backdrop-blur-md"
                aria-label="Main navigation"
            >
                <div className="mx-auto grid max-w-3xl grid-cols-4 gap-1 py-2">
                    <BottomNavItem to="/" icon={Trophy} label="Leaderboard" />
                    <BottomNavItem to="/history" icon={History} label="History" />
                    <BottomNavItem to="/players" icon={Users} label="Players" />
                    <BottomNavItem to="/settings" icon={Settings} label="Settings" />
                </div>
            </nav>
        </div>
    );
}

function BottomNavItem({ to, icon: IconComponent, label }) {
    return (
        <NavLink
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
                `flex min-h-[3.5rem] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-semibold tracking-wide transition-all duration-150 active:scale-90 active:opacity-70 sm:text-[11px] ${
                    isActive
                        ? 'bg-white/10 text-white'
                        : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
                }`
            }
        >
            <IconComponent className="h-5 w-5" aria-hidden="true" />
            <span>{label}</span>
        </NavLink>
    );
}
