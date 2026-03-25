import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import PlayerAvatar from './PlayerAvatar';
import { formatSignedAmount, formatWholeNumber } from '../lib/format';

export default function LeaderboardTable({ players }) {
    return (
        <div className="glass-panel overflow-hidden p-2 sm:p-3">
            <div className="mb-2 flex items-center justify-between px-3 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                <span>Current Standings</span>
                <span>{formatWholeNumber(players.length)} players</span>
            </div>

            <div className="space-y-2">
                {players.map((player) => (
                    <Link
                        key={player.name}
                        to={`/player/${encodeURIComponent(player.name)}`}
                        className="group flex items-center gap-3 rounded-[24px] border border-white/6 bg-white/[0.03] px-4 py-4 transition-all duration-150 hover:border-emerald-400/20 hover:bg-white/[0.06] active:scale-[0.98] active:opacity-80"
                    >
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/60 text-sm font-bold text-white">
                            {player.rank}
                        </div>

                        <PlayerAvatar name={player.name} />

                        <div className="min-w-0 flex-1 text-left">
                            <div className="truncate text-sm font-bold text-white sm:text-base">{player.name}</div>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                                <span className="stat-pill">{player.gamesPlayed} games</span>
                                <span className="stat-pill">{Math.round(player.winRate)}% win rate</span>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className={`text-lg font-extrabold tracking-tight ${player.net > 0 ? 'text-emerald-300' : player.net < 0 ? 'text-rose-300' : 'text-slate-200'}`}>
                                {formatSignedAmount(player.net)}
                            </div>
                            <div className="text-xs text-slate-500">Avg {formatSignedAmount(player.averageNet)}</div>
                        </div>

                        <ChevronRight className="h-4 w-4 text-slate-600 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-slate-300" aria-hidden="true" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
