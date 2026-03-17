import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchData, processData } from '../lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, Calendar, Target, Percent, Flame, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export default function Player() {
    const { name } = useParams();
    const decodedName = decodeURIComponent(name);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData().then(data => {
            const { players } = processData(data);
            const player = players.find(p => p.name === decodedName);
            setStats(player);
            setLoading(false);
        });
    }, [decodedName]);

    if (loading) return <div className="p-8 text-center text-slate-400">Loading profile...</div>;

    if (!stats) return (
        <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-slate-300">Player not found</h2>
            <Link to="/" className="text-blue-400 hover:underline mt-4 inline-block">Back to Leaderboard</Link>
        </div>
    );

    // Prepare chart data: Cumulative net over time
    const chartData = stats.history.map((h, i) => ({
        ...h,
        dateFormatted: format(new Date(h.date), 'MMM d'),
        gameIndex: i + 1
    }));

    const streakLabel = stats.streak.count > 0
        ? `${stats.streak.count} ${stats.streak.type === 'win' ? 'Win' : 'Loss'} Streak`
        : '—';
    const streakColor = stats.streak.type === 'win' ? 'text-green-400' : stats.streak.type === 'loss' ? 'text-red-400' : 'text-slate-400';

    const recentGames = [...stats.history].reverse().slice(0, 10);

    return (
        <div className="space-y-8">
            <Link to="/" className="inline-flex items-center text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Leaderboard
            </Link>

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">{stats.name}</h1>
                    <div className={`text-2xl font-mono font-bold ${stats.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {stats.net > 0 && '+'}{stats.net} <span className="text-base text-slate-500 font-sans font-normal ml-2">Total Net</span>
                    </div>
                </div>
            </header>

            {/* Primary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<Activity className="text-blue-400" />} label="Games Played" value={stats.gamesPlayed} />
                <StatCard icon={<Percent className="text-purple-400" />} label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} />
                <StatCard icon={<Target className="text-yellow-400" />} label="Avg per Game" value={`${stats.avgNet >= 0 ? '+' : ''}${stats.avgNet.toFixed(1)}`} />
                <StatCard icon={<Flame className={streakColor} />} label="Current Streak" value={streakLabel} valueClassName={streakColor} />
            </div>

            {/* Wins / Losses session counts */}
            <div className="grid grid-cols-2 gap-4">
                <StatCard icon={<TrendingUp className="text-green-400" />} label="Winning Sessions" value={stats.wins} subValue="Games with profit" valueClassName="text-green-400" />
                <StatCard icon={<TrendingDown className="text-red-400" />} label="Losing Sessions" value={stats.losses} subValue="Games with a loss" valueClassName="text-red-400" />
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<TrendingUp className="text-green-400" />} label="Best Win" value={stats.biggestWin !== null ? `+${stats.biggestWin}` : '—'} subValue="Single session" />
                <StatCard icon={<TrendingDown className="text-red-400" />} label="Worst Loss" value={stats.biggestLoss !== null ? `${stats.biggestLoss}` : '—'} subValue="Single session" />
                <StatCard icon={<DollarSign className="text-green-400" />} label="Total Won" value={`${stats.totalWinnings > 0 ? '+' : ''}${stats.totalWinnings}`} subValue="Across all sessions" />
                <StatCard icon={<DollarSign className="text-red-400" />} label="Total Lost" value={`-${stats.totalLosses}`} subValue="Across all sessions" />
            </div>

            <section className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                <h3 className="text-lg font-semibold text-slate-300 mb-6 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    Performance History
                </h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="dateFormatted" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                labelStyle={{ color: '#94a3b8' }}
                            />
                            <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorNet)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {recentGames.length > 0 && (
                <section className="bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
                    <h3 className="text-lg font-semibold text-slate-300 p-6 pb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-slate-400" />
                        Recent Sessions
                    </h3>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-700 text-slate-400 text-left">
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium text-right">Result</th>
                                <th className="px-6 py-3 font-medium text-right">Cumulative</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentGames.map((game, i) => (
                                <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-3 text-slate-300">{format(new Date(game.date), 'MMM d, yyyy')}</td>
                                    <td className={`px-6 py-3 text-right font-mono font-semibold ${game.net > 0 ? 'text-green-400' : game.net < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                        {game.net > 0 ? '+' : ''}{game.net}
                                    </td>
                                    <td className={`px-6 py-3 text-right font-mono ${game.total >= 0 ? 'text-slate-300' : 'text-slate-400'}`}>
                                        {game.total > 0 ? '+' : ''}{game.total}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, subValue, valueClassName }) {
    return (
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex items-start gap-4">
            <div className="p-2.5 bg-slate-700/50 rounded-lg shrink-0">
                {icon}
            </div>
            <div className="min-w-0">
                <div className="text-slate-400 text-xs font-medium uppercase tracking-wide">{label}</div>
                <div className={`text-xl font-bold mt-1 truncate ${valueClassName || 'text-white'}`}>{value}</div>
                {subValue && <div className="text-xs text-slate-500 mt-0.5">{subValue}</div>}
            </div>
        </div>
    );
}

