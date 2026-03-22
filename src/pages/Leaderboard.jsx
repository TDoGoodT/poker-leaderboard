import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Crown, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import LeaderboardTable from '../components/LeaderboardTable';
import PlayerAvatar from '../components/PlayerAvatar';
import { LeaderboardSkeleton } from '../components/SkeletonLoader';
import useAppData from '../hooks/useAppData';
import { formatSessionDate, formatSignedAmount } from '../lib/format';

export default function Leaderboard() {
    const { players, summary, loading } = useAppData();

    if (loading) {
        return <LeaderboardSkeleton />;
    }

    const topPlayers = players.slice(0, 3);
    const chartPlayers = players.slice(0, 8);

    return (
        <div className="flex w-full flex-col gap-4 pb-28 sm:gap-6">
            <section className="glass-panel p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="section-kicker">Leaderboard</div>
                        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">Session Pulse</h1>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4 lg:min-w-[560px]">
                        <StatChip label="Sessions" value={summary?.totalSessions ?? 0} />
                        <StatChip label="Active Players" value={summary?.activePlayers ?? 0} />
                        <StatChip label="In Profit" value={summary?.profitablePlayers ?? 0} />
                        <StatChip
                            label="Last Game"
                            value={summary?.latestSession ? formatSessionDate(summary.latestSession.date) : 'None'}
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
                <div className="glass-panel p-5 sm:p-6">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <div className="section-kicker">Top 3</div>
                            <h2 className="mt-2 font-display text-2xl font-bold text-white">Podium</h2>
                        </div>
                        <div className="rounded-full border border-amber-300/20 bg-amber-300/10 p-3 text-amber-200">
                            <Crown className="h-5 w-5" aria-hidden="true" />
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 md:items-end">
                        {topPlayers.map((player) => (
                            <Link
                                key={player.name}
                                to={`/player/${encodeURIComponent(player.name)}`}
                                className={`relative overflow-hidden rounded-[24px] border p-4 sm:p-5 md:rounded-[28px] transition-all duration-150 active:scale-[0.97] active:opacity-80 ${player.rank === 1 ? 'border-amber-300/25 bg-gradient-to-b from-amber-300/14 to-white/[0.04] md:min-h-[260px]' : 'border-white/10 bg-white/[0.04] md:min-h-[220px]'}`}
                            >
                                <div className="absolute right-4 top-4 rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs font-semibold tracking-[0.22em] text-slate-300 uppercase">
                                    #{player.rank}
                                </div>
                                <div className="mt-5 flex justify-center sm:mt-8 md:justify-center">
                                    <PlayerAvatar name={player.name} size={player.rank === 1 ? 'xl' : 'lg'} />
                                </div>
                                <div className="mt-5 text-center md:text-center">
                                    <h3 className="text-lg font-bold text-white sm:text-xl">{player.name}</h3>
                                    <div className={`mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl ${player.net >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                                        {formatSignedAmount(player.net)}
                                    </div>
                                    <p className="mt-2 text-xs text-slate-400 sm:text-sm">{player.gamesPlayed} sessions tracked</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="glass-panel p-5 sm:p-6">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <div className="section-kicker">Quick Stats</div>
                            <h2 className="mt-2 font-display text-2xl font-bold text-white">Table Pulse</h2>
                        </div>
                        <Sparkles className="h-5 w-5 text-emerald-300" aria-hidden="true" />
                    </div>

                    <div className="space-y-3">
                        <InsightRow
                            icon={<TrendingUp className="h-4 w-4 text-emerald-300" aria-hidden="true" />}
                            label="Leader"
                            playerName={players[0]?.name}
                            value={players[0] ? formatSignedAmount(players[0].net) : 'No data'}
                        />
                        <InsightRow
                            icon={<TrendingDown className="h-4 w-4 text-rose-300" aria-hidden="true" />}
                            label="Toughest stretch"
                            playerName={players[players.length - 1]?.name}
                            value={players[players.length - 1] ? formatSignedAmount(players[players.length - 1].net) : 'No data'}
                        />
                        <InsightRow
                            icon={<Sparkles className="h-4 w-4 text-cyan-300" aria-hidden="true" />}
                            label="Most active"
                            playerName={summary?.mostActivePlayer?.name}
                            value={summary?.mostActivePlayer ? `${summary.mostActivePlayer.gamesPlayed} games` : 'No data'}
                        />
                        <InsightRow
                            icon={<Crown className="h-4 w-4 text-amber-200" aria-hidden="true" />}
                            label="Biggest swing"
                            value={summary?.biggestSwing ? `${formatSignedAmount(summary.biggestSwing.totalPot)} on ${formatSessionDate(summary.biggestSwing.date)}` : 'No data'}
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <LeaderboardTable players={players} />

                <div className="glass-panel p-5 sm:p-6">
                    <div className="mb-4">
                        <div className="section-kicker">Performance Chart</div>
                        <h2 className="mt-2 font-display text-2xl font-bold text-white">Net Snapshot</h2>
                    </div>
                    <div className="h-64 w-full sm:h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartPlayers} barCategoryGap={18}>
                                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 10 }} />
                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#020817', borderColor: 'rgba(148,163,184,0.14)', borderRadius: 18 }}
                                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                    formatter={(value) => formatSignedAmount(value)}
                                />
                                <Bar dataKey="net" radius={[12, 12, 0, 0]}>
                                    {chartPlayers.map((entry) => (
                                        <Cell key={entry.name} fill={entry.net >= 0 ? '#34d399' : '#fb7185'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>
        </div>
    );
}

function StatChip({ label, value }) {
    return (
        <div className="rounded-[18px] border border-white/10 bg-white/[0.06] px-3 py-2.5 sm:rounded-[20px] sm:px-4 sm:py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</div>
            <div className="mt-1.5 font-display text-lg font-bold text-white sm:mt-2 sm:text-xl">{value}</div>
        </div>
    );
}

function InsightRow({ icon, label, value, playerName }) {
    return (
        <div className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-[20px] border border-white/8 bg-white/[0.04] px-3 py-3 sm:rounded-[22px] sm:px-4 sm:py-4">
            <div className="min-w-0 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950/70">{icon}</div>
                <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-200">{value}</div>
                </div>
            </div>
            {playerName ? (
                <Link
                    to={`/player/${encodeURIComponent(playerName)}`}
                    className="flex min-w-0 max-w-[52vw] items-center gap-2 rounded-full border border-white/8 bg-slate-950/45 px-2 py-1.5 transition-colors hover:border-emerald-300/35 hover:bg-slate-900 sm:max-w-none sm:gap-3"
                >
                    <PlayerAvatar name={playerName} size="sm" />
                    <span className="truncate pr-2 text-sm font-semibold text-white">{playerName}</span>
                </Link>
            ) : null}
        </div>
    );
}
