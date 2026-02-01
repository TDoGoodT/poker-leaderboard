import { Link, useLocation } from 'react-router-dom';
import { Trophy, History, LayoutDashboard } from 'lucide-react';

export default function Layout({ children }) {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
            <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-amber-500" />
                        Poker Board
                    </Link>

                    <nav className="flex items-center gap-6">
                        <NavLink to="/" current={location.pathname} icon={<LayoutDashboard w={18} />}>Leaderboard</NavLink>
                        <NavLink to="/history" current={location.pathname} icon={<History w={18} />}>History</NavLink>
                    </nav>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 flex-1">
                {children}
            </main>

            <footer className="border-t border-slate-700 py-6 text-center text-slate-500 text-sm">
                &copy; {new Date().getFullYear()} Poker Leaderboard
            </footer>
        </div>
    );
}

function NavLink({ to, current, children, icon }) {
    const isActive = current === to;
    return (
        <Link
            to={to}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 ${isActive ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
            {icon}
            <span className="hidden sm:inline">{children}</span>
        </Link>
    );
}
