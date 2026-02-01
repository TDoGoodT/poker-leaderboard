import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchData, processData } from '../lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, Calendar } from 'lucide-react';
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
            setPlayers(player);
            setLoading(false);
        });
    }, [decodedName]);

    // Correction: setPlayers should be named setPlayerStats or simply use stats
    // Re-writing the useEffect slightly to match state
    function setPlayers(player) {
        setStats(player);
    }

    if (loading) return <div className="p-8 text-center text-slate-400">Loading profile...</div>;

    if (!stats) return (
        <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-slate-300">Player not found</h2>
            <Link to="/" className="text-blue-400 hover:underline mt-4 inline-block">Back to Leaderboard</Link>
        </div>
    );

    const bestWin = Math.max(...stats.history.map(h => h.net));
    const worstLoss = Math.min(...stats.history.map(h => h.net));

    // Prepare chart data: Cumulative net over time
    // history array has { date, net, total }
    // We want to format date for XAxis
    const chartData = stats.history.map((h, i) => ({
        ...h,
        dateFormatted: format(new Date(h.date), 'MMM d'),
        gameIndex: i + 1
    }));

    // Add start point
    if (chartData.length > 0) {
        // Optional: Add a zero point at start if needed? 
        // Or just let it start from first game.
    }

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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={<Activity className="text-blue-400" />} label="Games Played" value={stats.gamesPlayed} />
                <StatCard icon={<TrendingUp className="text-green-400" />} label="Best Win" value={bestWin > -Infinity ? `+${bestWin}` : '-'} subValue="Best Session" />
                <StatCard icon={<TrendingDown className="text-red-400" />} label="Worst Loss" value={worstLoss < Infinity ? worstLoss : '-'} subValue="Worst Session" />
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
        </div>
    );
}

function StatCard({ icon, label, value, subValue }) {
    return (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex items-start gap-4">
            <div className="p-3 bg-slate-700/50 rounded-lg">
                {icon}
            </div>
            <div>
                <div className="text-slate-400 text-sm font-medium">{label}</div>
                <div className="text-2xl font-bold text-white mt-1">{value}</div>
                {subValue && <div className="text-xs text-slate-500 mt-1">{subValue}</div>}
            </div>
        </div>
    );
}
