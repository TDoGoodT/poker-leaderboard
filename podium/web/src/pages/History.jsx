import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Trophy, Plus, Edit2, Copy, Check } from 'lucide-react';
import PlayerAvatar from '../components/PlayerAvatar';
import SwipeableItem from '../components/SwipeableItem';
import PullToRefresh from '../components/PullToRefresh';
import { HistorySkeleton } from '../components/SkeletonLoader';
import useAppData from '../hooks/useAppData';
import { formatSessionDate, formatSessionDateTime, formatSignedAmount } from '../lib/format';

import { deleteGame, login } from '../lib/api';
import BottomSheet from '../components/BottomSheet';
import GameForm from '../components/GameForm';
import { customAlert, customConfirm, customPrompt } from '../lib/dialogs';

export default function History() {
    const { games, players, loading, reload } = useAppData();
    const [expandedId, setExpandedId] = useState(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingGame, setEditingGame] = useState(null);

    const requireAuth = async () => {
        let token = localStorage.getItem('adminToken');
        if (!token) {
            let password = await customPrompt("Enter Admin Password:", "password");
            if (password) {
                try {
                    token = await login(password);
                    localStorage.setItem('adminToken', token);
                } catch (e) {
                    await customAlert(e.message);
                    return false;
                }
            }
        }
        return !!token;
    };

    const handleAddClick = async () => {
        if (await requireAuth()) {
            setIsAddOpen(true);
        }
    };

    const handleEditClick = async (game, e) => {
        e.stopPropagation();
        if (await requireAuth()) {
            setEditingGame(game);
        }
    };

    const handleDeleteClick = async (game) => {
        if (!(await requireAuth())) return;
        const isConfirmed = await customConfirm(`Are you sure you want to delete the game from ${formatSessionDate(game.date)}?`);
        if (isConfirmed) {
            try {
                await deleteGame(game.id);
                reload();
            } catch(e) {
                await customAlert("Could not delete: " + e.message);
                if (e.message.toLowerCase().includes('unauthorized') || e.message.toLowerCase().includes('token')) {
                    localStorage.removeItem('adminToken');
                }
            }
        }
    };

    const handleGameSaved = () => {
        setIsAddOpen(false);
        setEditingGame(null);
        reload();
    };

    if (loading) {
        return <HistorySkeleton />;
    }

    const allPlayerNames = players.map(p => p.name);

    return (
        <PullToRefresh onRefresh={reload}>
            <div className="flex w-full flex-col gap-4 pb-28 sm:gap-6">
                <section className="glass-panel p-6 sm:p-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <div className="section-kicker">History</div>
                        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">Visual session archive</h1>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                            Review and manage your game sessions here.
                        </p>
                    </div>
                    <button 
                        onClick={handleAddClick}
                        className="self-start sm:self-center px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add Game
                    </button>
                </section>

                <BottomSheet 
                    isOpen={isAddOpen || !!editingGame} 
                    onClose={() => { setIsAddOpen(false); setEditingGame(null); }}
                    title={editingGame ? "Edit Game" : "Add New Game"}
                >
                    <GameForm 
                        initialGame={editingGame} 
                        allPlayers={allPlayerNames}
                        onSaved={handleGameSaved}
                        onCancel={() => { setIsAddOpen(false); setEditingGame(null); }}
                    />
                </BottomSheet>

                <div className="space-y-4" aria-live="polite">
                    {games.map((game) => {
                        const isExpanded = expandedId === game.id;

                        return (
                            <SwipeableItem
                                key={game.id}
                                deleteLabel="Delete"
                                onDelete={() => handleDeleteClick(game)}
                            >
                                <article className="glass-panel overflow-hidden p-4 sm:p-6">
                            <div className="flex flex-col gap-4 lg:gap-5 lg:flex-row lg:items-start lg:justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-500 leading-tight">
                                        <span className="whitespace-nowrap">{formatSessionDate(game.date)}</span>
                                        <span className="rounded-full border border-white/10 bg-white/[0.05] px-1.5 py-0.5 whitespace-nowrap">{game.participantsCount}p</span>
                                        <span className={`rounded-full border px-1.5 py-0.5 whitespace-nowrap ${game.balance === 0 ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-rose-400/20 bg-rose-400/10 text-rose-300'}`}>
                                            {formatSignedAmount(game.balance)}
                                        </span>
                                    </div>
                                    <h2 className="mt-2 sm:mt-3 font-display text-xl sm:text-2xl font-bold text-white tracking-tight">{formatSessionDateTime(game.date)}</h2>
                                </div>

                                <div className="hidden lg:grid gap-2 sm:gap-3 grid-cols-2 flex-shrink-0">
                                    <ResultSummary title="Winner" iconClass="text-amber-200" icon={<Trophy className="h-4 w-4" aria-hidden="true" />} entries={game.winners} emptyLabel="No winners" positive />
                                    <ResultSummary title="Loser" entries={game.losers} emptyLabel="No losses" />
                                </div>
                            </div>

                            <div className="mt-3 sm:mt-4 grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                                {game.entries.map((entry) => (
                                    <Link
                                        key={entry.player}
                                        to={`/player/${encodeURIComponent(entry.player)}`}
                                        className="rounded-[18px] border border-white/8 bg-white/[0.04] px-3 py-2 sm:px-4 sm:py-3 transition-all duration-150 hover:border-emerald-300/30 hover:bg-white/[0.07] active:scale-95 active:opacity-80"
                                    >
                                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                            <PlayerAvatar name={entry.player} size="sm" />
                                            <div className="text-xs sm:text-sm font-semibold text-slate-200 truncate">{entry.player}</div>
                                        </div>
                                        <div className={`mt-1.5 sm:mt-2 text-lg sm:text-xl font-extrabold ${entry.net >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                                            {formatSignedAmount(entry.net)}
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    className="mt-3 sm:mt-4 flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2.5 text-xs sm:text-sm font-semibold text-emerald-300 transition-all duration-150 hover:border-emerald-400/50 hover:bg-emerald-400/15 active:scale-95 active:opacity-80 min-h-[44px]"
                                    aria-label={isExpanded ? 'Hide session details' : 'Show session details'}
                                    onClick={() => setExpandedId(isExpanded ? null : game.id)}
                                >
                                    {isExpanded ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
                                    <span>{isExpanded ? 'Hide details' : 'Details'}</span>
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 sm:mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-600/50 bg-slate-800/50 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-300 transition-all duration-150 hover:border-slate-500 hover:bg-slate-700/50 active:scale-95 active:opacity-80 min-h-[44px]"
                                    onClick={(e) => handleEditClick(game, e)}
                                    aria-label="Edit game"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </button>
                            </div>

                            {isExpanded ? (
                                <div className="mt-4 sm:mt-5 border-t border-white/8 pt-4 sm:pt-5">
                                    {/* Winners/Losers summary on mobile only */}
                                    <div className="lg:hidden grid gap-2 grid-cols-2 mb-4 sm:mb-5">
                                        <ResultSummary title="Winner" iconClass="text-amber-200" icon={<Trophy className="h-4 w-4" aria-hidden="true" />} entries={game.winners} emptyLabel="—" positive />
                                        <ResultSummary title="Loser" entries={game.losers} emptyLabel="—" />
                                    </div>

                                    <div className="min-w-0">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">Detailed transactions</div>
                                            <CopyWhatsAppButton game={game} />
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                            </SwipeableItem>
                        );
                    })}
                </div>
            </div>
        </PullToRefresh>
    );
}

function ResultSummary({ title, entries, emptyLabel, icon, iconClass = 'text-rose-300', positive = false }) {
    return (
        <div className="rounded-[18px] sm:rounded-[24px] border border-white/8 bg-white/[0.04] p-2.5 sm:p-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-500">
                <span className={iconClass}>{icon}</span>
                <span className="truncate">{title}</span>
            </div>
            <div className="mt-2 space-y-1.5">
                {entries.length ? entries.map((entry) => (
                    <div key={entry.player} className="flex flex-col gap-1 text-xs sm:text-sm">
                        <Link to={`/player/${encodeURIComponent(entry.player)}`} className="group flex items-center gap-1 rounded-full border border-white/8 bg-slate-950/45 px-1.5 py-0.5 transition-colors hover:border-emerald-300/35 hover:bg-slate-900 min-h-0">
                            <PlayerAvatar name={entry.player} size="sm" />
                            <span className="font-semibold text-white transition-colors group-hover:text-emerald-200 truncate">{entry.player}</span>
                        </Link>
                        <span className={`text-xs font-bold ${positive ? 'text-emerald-300' : 'text-rose-300'}`}>{formatSignedAmount(entry.net)}</span>
                    </div>
                )) : <div className="text-xs text-slate-500">{emptyLabel}</div>}
            </div>
        </div>
    );
}

function CopyWhatsAppButton({ game }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e) => {
        e.stopPropagation();
        const dateStr = formatSessionDateTime(game.date);
        let text = `*Game Session - ${dateStr}*\nParticipants: ${game.participantsCount}\nBalance: ${formatSignedAmount(game.balance)}\n\n*Settlements:*\n`;

        const txs = game.transactions || [];
        if (txs.length === 0) {
            text += 'No transactions.\n';
        } else {
            txs.forEach(tx => {
                if ('player' in tx) {
                    const amount = tx.net >= 0 ? `+${tx.net}` : `${tx.net}`;
                    text += `• ${tx.player}: ${amount}\n`;
                } else {
                    text += `• ${tx.payer} ➡️ ${tx.receiver}: ${tx.amount}\n`;
                }
            });
        }

        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
            // Fallback for browsers that don't support writeText
            alert("Clipboard copy failed. Please select text manually.");
        });
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-bold text-indigo-300 transition-all duration-150 hover:bg-indigo-500/20 hover:border-indigo-500/50 active:scale-95"
            aria-label="Copy settlements for WhatsApp"
        >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Tx'}</span>
        </button>
    );
}
