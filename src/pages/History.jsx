import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import PlayerAvatar from '../components/PlayerAvatar';
import useAppData from '../hooks/useAppData';
import { formatSessionDate, formatSessionDateTime, formatSignedAmount } from '../lib/format';

export default function History() {
    const { games, loading } = useAppData();
    const [expandedId, setExpandedId] = useState(null);

    if (loading) {
        return <div className="glass-panel flex min-h-[50vh] w-full items-center justify-center text-slate-400">Loading history...</div>;
    }

    return (
        <div className="flex w-full flex-col gap-4 pb-28 sm:gap-6">
            <section className="glass-panel p-6 sm:p-8">
                <div className="section-kicker">History</div>
                <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">Visual session archive</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                    Review each game as a compact summary card, then expand for raw notes or transaction details.
                </p>
            </section>

            <div className="space-y-4">
                {games.map((game) => {
                    const isExpanded = expandedId === game.id;

                    return (
                        <article key={game.id} className="glass-panel overflow-hidden p-4 sm:p-6">
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                        <span>{formatSessionDate(game.date)}</span>
                                        <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1">{game.participantsCount} players</span>
                                        <span className={`rounded-full border px-2 py-1 ${game.balance === 0 ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-rose-400/20 bg-rose-400/10 text-rose-300'}`}>
                                            Balance {formatSignedAmount(game.balance)}
                                        </span>
                                    </div>
                                    <h2 className="mt-3 font-display text-2xl font-bold text-white">{formatSessionDateTime(game.date)}</h2>
                                    <p className="mt-2 text-sm text-slate-400">Top winner and biggest loss highlighted for fast scanning.</p>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <ResultSummary title="Winner" iconClass="text-amber-200" icon={<Trophy className="h-4 w-4" />} entries={game.winners} emptyLabel="No winners" positive />
                                    <ResultSummary title="Loser" entries={game.losers} emptyLabel="No losses" />
                                </div>
                            </div>

                            <div className="mt-4 grid gap-2 sm:mt-5 sm:gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                {game.entries.map((entry) => (
                                    <Link
                                        key={entry.player}
                                        to={`/player/${encodeURIComponent(entry.player)}`}
                                        className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3 transition-colors hover:border-emerald-300/30 hover:bg-white/[0.07]"
                                    >
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <PlayerAvatar name={entry.player} size="sm" />
                                            <div className="text-sm font-semibold text-slate-200">{entry.player}</div>
                                        </div>
                                        <div className={`mt-2 text-xl font-extrabold ${entry.net >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                                            {formatSignedAmount(entry.net)}
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            <button
                                type="button"
                                className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.08]"
                                onClick={() => setExpandedId(isExpanded ? null : game.id)}
                            >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                {isExpanded ? 'Hide details' : 'Show internal message'}
                            </button>

                            {isExpanded ? (
                                <div className="mt-5 grid gap-4 border-t border-white/8 pt-5 lg:grid-cols-[1.1fr_0.9fr]">
                                    <div>
                                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Internal message text</div>
                                        <div className="mt-3 rounded-[22px] border border-white/8 bg-slate-950/60 p-4 text-sm leading-7 text-slate-300 whitespace-pre-wrap">
                                            {game.rawMessage || 'No message captured for this session.'}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Detailed transactions</div>
                                        <div className="mt-3 space-y-3">
                                            {(game.transactions || []).map((transaction, index) => (
                                                <div key={`${game.id}-${index}`} className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
                                                    {'player' in transaction ? (
                                                        <div className="flex items-center justify-between gap-3">
                                                            <Link
                                                                to={`/player/${encodeURIComponent(transaction.player)}`}
                                                                className="font-semibold text-white decoration-emerald-300/40 underline-offset-4 transition-colors hover:text-emerald-200 hover:underline"
                                                            >
                                                                {transaction.player}
                                                            </Link>
                                                            <span className={transaction.net >= 0 ? 'text-emerald-300' : 'text-rose-300'}>{formatSignedAmount(transaction.net)}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="font-semibold text-white">
                                                            <Link
                                                                to={`/player/${encodeURIComponent(transaction.payer)}`}
                                                                className="decoration-emerald-300/40 underline-offset-4 transition-colors hover:text-emerald-200 hover:underline"
                                                            >
                                                                {transaction.payer}
                                                            </Link>
                                                            <span className="mx-1.5 text-slate-500">→</span>
                                                            <Link
                                                                to={`/player/${encodeURIComponent(transaction.receiver)}`}
                                                                className="decoration-emerald-300/40 underline-offset-4 transition-colors hover:text-emerald-200 hover:underline"
                                                            >
                                                                {transaction.receiver}
                                                            </Link>
                                                            <div className="mt-1 text-slate-400">{formatSignedAmount(transaction.amount)}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </article>
                    );
                })}
            </div>
        </div>
    );
}

function ResultSummary({ title, entries, emptyLabel, icon, iconClass = 'text-rose-300', positive = false }) {
    return (
        <div className="rounded-[24px] border border-white/8 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                <span className={iconClass}>{icon}</span>
                {title}
            </div>
            <div className="mt-3 space-y-2">
                {entries.length ? entries.map((entry) => (
                    <div key={entry.player} className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <Link to={`/player/${encodeURIComponent(entry.player)}`} className="group flex items-center gap-2 rounded-full border border-white/8 bg-slate-950/45 px-2 py-1 transition-colors hover:border-emerald-300/35 hover:bg-slate-900">
                            <PlayerAvatar name={entry.player} size="sm" />
                            <span className="font-semibold text-white transition-colors group-hover:text-emerald-200">{entry.player}</span>
                        </Link>
                        <span className={positive ? 'text-emerald-300' : 'text-rose-300'}>{formatSignedAmount(entry.net)}</span>
                    </div>
                )) : <div className="text-sm text-slate-500">{emptyLabel}</div>}
            </div>
        </div>
    );
}
