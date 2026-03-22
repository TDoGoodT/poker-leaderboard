import { useParams, Link } from 'react-router-dom';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowLeft, BadgePercent, ChartNoAxesCombined, Trophy } from 'lucide-react';
import PlayerAvatar from '../components/PlayerAvatar';
import { PlayerProfileSkeleton } from '../components/SkeletonLoader';
import useAppData from '../hooks/useAppData';
import { formatSessionDate, formatSignedAmount } from '../lib/format';

export default function Player() {
    const { name } = useParams();
    const decodedName = decodeURIComponent(name);
    const { playerMap, loading } = useAppData();
    const stats = playerMap[decodedName] || null;

    if (loading) return <PlayerProfileSkeleton />;

    if (!stats) return (
        <div className="glass-panel flex w-full flex-col items-center justify-center gap-4 py-16 text-center">
            <h2 className="font-display text-3xl font-bold text-white">Player not found</h2>
            <Link to="/" className="app-button-secondary">Back to Leaderboard</Link>
        </div>
    );

    
    const chartData = [
        {
            date: null,
            net: 0,
            total: 0,
            gameId: 'start',
            label: 'Start',
            sequence: 0,
        },
        ...stats.history.map((item, index) => ({
            ...item,
            label: formatSessionDate(item.date),
            sequence: index + 1,
        })),
    ];

    return (
        <div className="flex w-full flex-col gap-4 pb-28 sm:gap-6">
            <Link to="/players" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-slate-400 transition-all duration-150 hover:text-white active:scale-95 active:opacity-70">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Back to Leaderboard
            </Link>

            <section className="hero-panel p-6 sm:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex items-start gap-4">
                        <PlayerAvatar name={stats.name} size="lg" />
                        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">{stats.name}</h1>

                    </div>
                </div>
            </section>
            <section className="glass-panel p-5 sm:p-6">
                <h3 className="text-lg font-semibold text-slate-300 mb-6 flex items-center gap-2">
                    <ChartNoAxesCombined className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    Performance History
                </h3>
                <div className="h-64 w-full sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#020817', borderColor: 'rgba(148,163,184,0.14)', borderRadius: 18 }}
                                labelStyle={{ color: '#94a3b8' }}
                                formatter={(value) => formatSignedAmount(value)}
                            />
                            <Line type="monotone" dataKey="total" stroke="#34d399" strokeWidth={3} dot={{ r: 4, fill: '#34d399' }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </section>

            <section className="hero-panel p-6 sm:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div>
                            <div className="section-kicker">Player Analytics</div>
                            <div className={`mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl ${stats.net >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                                {formatSignedAmount(stats.net)}
                            </div>
                            <p className="mt-2 text-sm text-slate-400">Overall rank #{stats.rank} across the current dataset.</p>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <AnalyticsChip label="Win rate" value={`${Math.round(stats.winRate)}%`} />
                        <AnalyticsChip label="Games played" value={stats.gamesPlayed} />
                        <AnalyticsChip label="Avg session" value={formatSignedAmount(stats.averageNet)} />
                    </div>
                </div>
            </section>

            <div className="grid gap-4 md:grid-cols-3">
                <StatCard icon={<BadgePercent className="h-5 w-5 text-emerald-300" aria-hidden="true" />} label="Win Rate" value={`${Math.round(stats.winRate)}%`} subValue={`${stats.wins} winning sessions`} />
                <StatCard icon={<Trophy className="h-5 w-5 text-amber-200" aria-hidden="true" />} label="Biggest Win" value={formatSignedAmount(stats.bestWin)} subValue="Best single session" />
                <StatCard icon={<ChartNoAxesCombined className="h-5 w-5 text-cyan-300" aria-hidden="true" />} label="Avg. Session Score" value={formatSignedAmount(stats.averageNet)} subValue="Average net per game" />
            </div>


            <section className="glass-panel p-5 sm:p-6">
                <div className="section-kicker">Recent Games</div>
                <div className="mt-4 space-y-3">
                    {stats.recentGames.map((game) => (
                        <div key={game.id} className="flex flex-col gap-2 rounded-[24px] border border-white/8 bg-white/[0.04] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="text-sm font-semibold text-white">{formatSessionDate(game.date)}</div>
                                <div className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">{game.participantsCount} players · pot {formatSignedAmount(game.totalPot)}</div>
                            </div>
                            <div className={`text-2xl font-extrabold ${game.net >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                                {formatSignedAmount(game.net)}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

function StatCard({ icon, label, value, subValue }) {
    return (
        <div className="glass-panel flex items-start gap-4 p-6">
            <div className="rounded-2xl bg-slate-950/60 p-3">
                {icon}
            </div>
            <div>
                <div className="text-slate-400 text-sm font-medium">{label}</div>
                <div className="mt-1 text-2xl font-bold text-white">{value}</div>
                {subValue && <div className="mt-1 text-xs text-slate-500">{subValue}</div>}
            </div>
        </div>
    );
}

function AnalyticsChip({ label, value }) {
    return (
        <div className="rounded-[22px] border border-white/10 bg-white/[0.06] px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</div>
            <div className="mt-2 font-display text-2xl font-bold text-white">{value}</div>
        </div>
    );
}
