import { startTransition, useDeferredValue, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Plus, Search, Trash2 } from 'lucide-react';
import useAppData from '../hooks/useAppData';
import { saveSession } from '../lib/api';
import { NewSessionSkeleton } from '../components/SkeletonLoader';
import { formatSignedAmount } from '../lib/format';

function createParticipant(name) {
    return {
        id: `${name}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        buyIn: '',
        cashOut: '',
    };
}

export default function NewSession() {
    const navigate = useNavigate();
    const { players, loading } = useAppData();
    const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
    const [query, setQuery] = useState('');
    const [notes, setNotes] = useState('');
    const [participants, setParticipants] = useState([]);
    const [error, setError] = useState('');
    const deferredQuery = useDeferredValue(query);

    const participantNames = useMemo(() => new Set(participants.map((participant) => participant.name)), [participants]);
    const filteredPlayers = players.filter((player) => {
        if (participantNames.has(player.name)) {
            return false;
        }

        if (!deferredQuery.trim()) {
            return true;
        }

        return player.name.toLowerCase().includes(deferredQuery.trim().toLowerCase());
    }).slice(0, 8);

    const totals = participants.reduce((summary, participant) => {
        const buyIn = Number(participant.buyIn || 0);
        const cashOut = Number(participant.cashOut || 0);
        const net = cashOut - buyIn;

        return {
            buyIn: summary.buyIn + buyIn,
            cashOut: summary.cashOut + cashOut,
            balance: summary.balance + net,
        };
    }, { buyIn: 0, cashOut: 0, balance: 0 });

    function addParticipant(name) {
        const trimmedName = name.trim();
        if (!trimmedName || participantNames.has(trimmedName)) {
            return;
        }

        setParticipants((currentParticipants) => [...currentParticipants, createParticipant(trimmedName)]);
        setQuery('');
    }

    function updateParticipant(id, field, value) {
        setParticipants((currentParticipants) => currentParticipants.map((participant) => (
            participant.id === id ? { ...participant, [field]: value } : participant
        )));
    }

    function removeParticipant(id) {
        setParticipants((currentParticipants) => currentParticipants.filter((participant) => participant.id !== id));
    }

    function handleSubmit(event) {
        event.preventDefault();

        if (participants.length < 2) {
            setError('Add at least two players to log a session.');
            return;
        }

        if (totals.balance !== 0) {
            setError('Session is unbalanced. Buy-ins and cash-outs must net to zero.');
            return;
        }

        setError('');

        // Haptic confirmation on supported devices
        if (navigator.vibrate) {
            navigator.vibrate([50]);
        }

        saveSession({
            date: sessionDate,
            participants,
            notes,
        });

        startTransition(() => {
            navigate('/history');
        });
    }

    if (loading) {
        return <NewSessionSkeleton />;
    }

    return (
        <div className="flex w-full flex-col gap-6 pb-28">
            <section className="hero-panel p-6 sm:p-8">
                <div className="section-kicker">Log New Session</div>
                <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-white">Enter a game without spreadsheet cleanup.</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                    Pick the date, add players, type buy-ins and cash-outs, and the balance check will stop bad entries before they land.
                </p>
            </section>

            <form className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]" onSubmit={handleSubmit}>
                <section className="glass-panel p-5 sm:p-6">
                    <div className="section-kicker">Setup</div>

                    <label className="mt-4 block text-sm font-semibold text-slate-200">
                        <span className="mb-2 flex items-center gap-2 text-slate-300"><CalendarDays className="h-4 w-4" aria-hidden="true" /> Session date</span>
                        <input className="app-input" type="date" value={sessionDate} onChange={(event) => setSessionDate(event.target.value)} />
                    </label>

                    <div className="mt-6">
                        <label className="text-sm font-semibold text-slate-200">Add players</label>
                        <div className="mt-2 flex items-center gap-3 rounded-[24px] border border-white/10 bg-slate-950/60 px-4 py-3">
                            <Search className="h-4 w-4 text-slate-500" aria-hidden="true" />
                            <input
                                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search or type a new player"
                            />
                            <button
                                type="button"
                                className="rounded-full border border-emerald-400/20 bg-emerald-400/10 p-2 text-emerald-300 transition-colors hover:bg-emerald-400/16"
                                onClick={() => addParticipant(query)}
                            >
                                <Plus className="h-4 w-4" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                            {filteredPlayers.map((player) => (
                                <button
                                    key={player.name}
                                    type="button"
                                    className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/[0.09]"
                                    onClick={() => addParticipant(player.name)}
                                >
                                    {player.name}
                                </button>
                            ))}
                            {query.trim() && !participantNames.has(query.trim()) ? (
                                <button type="button" className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-200" onClick={() => addParticipant(query)}>
                                    Create “{query.trim()}”
                                </button>
                            ) : null}
                        </div>
                    </div>

                    <label className="mt-6 block text-sm font-semibold text-slate-200">
                        <span className="mb-2 block text-slate-300">Internal notes</span>
                        <textarea
                            className="app-input min-h-36 resize-y"
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            placeholder="Optional message text or settlement notes"
                        />
                    </label>
                </section>

                <section className="glass-panel p-5 sm:p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <div className="section-kicker">Participants</div>
                            <h2 className="mt-2 font-display text-2xl font-bold text-white">Buy-in and cash-out ledger</h2>
                        </div>
                        <div className={`rounded-[24px] border px-4 py-3 text-right ${totals.balance === 0 ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-rose-400/20 bg-rose-400/10 text-rose-300'}`}>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.22em]">Balance</div>
                            <div className="mt-1 font-display text-2xl font-bold">{formatSignedAmount(totals.balance)}</div>
                        </div>
                    </div>

                    <div className="mt-5 space-y-3">
                        {participants.length ? participants.map((participant) => {
                            const buyIn = Number(participant.buyIn || 0);
                            const cashOut = Number(participant.cashOut || 0);
                            const net = cashOut - buyIn;

                            return (
                                <div key={participant.id} className="grid gap-3 rounded-[28px] border border-white/8 bg-white/[0.04] p-4 lg:grid-cols-[1fr_150px_150px_120px_44px] lg:items-center">
                                    <div>
                                        <Link
                                            to={`/player/${encodeURIComponent(participant.name)}`}
                                            className="text-sm font-bold text-white decoration-emerald-300/40 underline-offset-4 transition-colors hover:text-emerald-200 hover:underline"
                                        >
                                            {participant.name}
                                        </Link>
                                        <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">Net auto-calculated</div>
                                    </div>

                                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                        Buy-in
                                        <input className="app-input mt-2" inputMode="numeric" value={participant.buyIn} onChange={(event) => updateParticipant(participant.id, 'buyIn', event.target.value)} placeholder="0" />
                                    </label>

                                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                        Cash-out
                                        <input className="app-input mt-2" inputMode="numeric" value={participant.cashOut} onChange={(event) => updateParticipant(participant.id, 'cashOut', event.target.value)} placeholder="0" />
                                    </label>

                                    <div className="rounded-[22px] border border-white/8 bg-slate-950/60 px-4 py-3 text-center">
                                        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Net</div>
                                        <div className={`mt-1 text-xl font-extrabold ${net >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{formatSignedAmount(net)}</div>
                                    </div>

                                    <button type="button" className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400 transition-all duration-150 hover:bg-rose-400/10 hover:text-rose-200 active:scale-90 active:opacity-70" onClick={() => removeParticipant(participant.id)} aria-label={`Remove ${participant.name}`}>
                                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                </div>
                            );
                        }) : (
                            <div className="rounded-[28px] border border-dashed border-white/12 bg-white/[0.03] px-5 py-10 text-center text-slate-500">
                                Add players from the search field to begin building the session.
                            </div>
                        )}
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <SummaryBox label="Total buy-ins" value={formatSignedAmount(totals.buyIn)} />
                        <SummaryBox label="Total cash-outs" value={formatSignedAmount(totals.cashOut)} />
                        <SummaryBox label="Net balance" value={formatSignedAmount(totals.balance)} accent={totals.balance === 0} />
                    </div>

                    {error ? <div role="alert" aria-live="assertive" className="mt-5 rounded-[20px] border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <button type="button" className="app-button-secondary" onClick={() => setParticipants([])}>Clear players</button>
                        <button type="submit" className="app-button">Save session</button>
                    </div>
                </section>
            </form>
        </div>
    );
}

function SummaryBox({ label, value, accent = false }) {
    return (
        <div className={`rounded-[24px] border px-4 py-4 ${accent ? 'border-emerald-400/20 bg-emerald-400/10' : 'border-white/10 bg-white/[0.05]'}`}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</div>
            <div className="mt-2 font-display text-2xl font-bold text-white">{value}</div>
        </div>
    );
}