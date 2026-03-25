import { useMemo, useState } from 'react';
import { Database, Plus, RefreshCcw, Save, Shield, Trash2 } from 'lucide-react';
import useAppData from '../hooks/useAppData';
import { createGame } from '../lib/api';

export default function Settings() {
    const { players, reload } = useAppData();
    const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
    const [rawMessage, setRawMessage] = useState('');
    const [transactions, setTransactions] = useState([{ payer: '', receiver: '', amount: '' }]);
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState({ kind: null, message: '' });

    const playerNames = useMemo(() => players.map((player) => player.name), [players]);

    function updateTransaction(index, key, value) {
        setTransactions((current) =>
            current.map((transaction, txIndex) =>
                txIndex === index ? { ...transaction, [key]: value } : transaction,
            ),
        );
    }

    function addTransaction() {
        setTransactions((current) => [...current, { payer: '', receiver: '', amount: '' }]);
    }

    function removeTransaction(index) {
        setTransactions((current) => {
            if (current.length === 1) {
                return current;
            }

            return current.filter((_, txIndex) => txIndex !== index);
        });
    }

    async function onSubmit(event) {
        event.preventDefault();
        setSubmitting(true);
        setFeedback({ kind: null, message: '' });

        try {
            const normalizedTransactions = transactions
                .map((transaction) => ({
                    payer: transaction.payer.trim(),
                    receiver: transaction.receiver.trim(),
                    amount: Number(transaction.amount),
                }))
                .filter((transaction) => transaction.payer && transaction.receiver && Number.isFinite(transaction.amount) && transaction.amount > 0);

            if (!normalizedTransactions.length) {
                throw new Error('Add at least one valid transaction.');
            }

            await createGame({
                date: new Date(date).toISOString(),
                rawMessage,
                sender: 'web-form',
                transactions: normalizedTransactions,
            });

            setFeedback({ kind: 'success', message: 'Game registered successfully.' });
            setRawMessage('');
            setTransactions([{ payer: '', receiver: '', amount: '' }]);
            await reload();
        } catch (error) {
            setFeedback({ kind: 'error', message: error?.message ?? 'Could not save game.' });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="flex w-full flex-col gap-6 pb-28">
            <section className="hero-panel p-6 sm:p-8">
                <div className="section-kicker">Settings</div>
                <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-white">Operational controls</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                    The dashboard now reads from a Bun API and SQLite database. Register game results here and all standings update from the backend source of truth.
                </p>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
                <Panel icon={<Database className="h-5 w-5 text-cyan-300" aria-hidden="true" />} title="Data Source" description="Session data is persisted in SQLite and served through /api/data." />
                <Panel icon={<Shield className="h-5 w-5 text-emerald-300" aria-hidden="true" />} title="Consistency" description="Standings, history, and player profiles all derive from the same backend dataset." />
                <Panel icon={<RefreshCcw className="h-5 w-5 text-amber-200" aria-hidden="true" />} title="Refresh" description="Use pull-to-refresh in the main views to reload live backend data." />
            </section>

            <section className="glass-panel p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="section-kicker">Register Game</div>
                        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white">New session entry</h2>
                    </div>
                    <Save className="h-5 w-5 text-emerald-300" aria-hidden="true" />
                </div>

                <form onSubmit={onSubmit} className="mt-6 space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Date & time</span>
                            <input
                                type="datetime-local"
                                value={date}
                                onChange={(event) => setDate(event.target.value)}
                                className="app-input"
                                required
                            />
                        </label>

                        <label className="space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Existing players</span>
                            <div className="rounded-[18px] border border-white/10 bg-slate-950/65 px-4 py-3 text-sm text-slate-300">
                                {playerNames.length ? playerNames.join(', ') : 'No players yet'}
                            </div>
                        </label>
                    </div>

                    <label className="block space-y-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Raw message (optional)</span>
                        <textarea
                            value={rawMessage}
                            onChange={(event) => setRawMessage(event.target.value)}
                            placeholder="Paste the original game note..."
                            className="app-input min-h-28 resize-y"
                        />
                    </label>

                    <div className="space-y-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Transactions</div>
                        {transactions.map((transaction, index) => (
                            <div key={`tx-${index}`} className="grid gap-3 rounded-[22px] border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[1fr_1fr_0.6fr_auto]">
                                <input
                                    className="app-input"
                                    placeholder="Payer"
                                    value={transaction.payer}
                                    onChange={(event) => updateTransaction(index, 'payer', event.target.value)}
                                    required
                                />
                                <input
                                    className="app-input"
                                    placeholder="Receiver"
                                    value={transaction.receiver}
                                    onChange={(event) => updateTransaction(index, 'receiver', event.target.value)}
                                    required
                                />
                                <input
                                    className="app-input"
                                    type="number"
                                    min="1"
                                    step="1"
                                    placeholder="Amount"
                                    value={transaction.amount}
                                    onChange={(event) => updateTransaction(index, 'amount', event.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => removeTransaction(index)}
                                    className="app-button-secondary h-full"
                                    aria-label="Remove transaction"
                                >
                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={addTransaction} className="app-button-secondary inline-flex gap-2">
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            Add transaction
                        </button>
                    </div>

                    {feedback.kind ? (
                        <div className={`rounded-2xl border px-4 py-3 text-sm ${feedback.kind === 'success' ? 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200' : 'border-rose-400/35 bg-rose-400/10 text-rose-200'}`}>
                            {feedback.message}
                        </div>
                    ) : null}

                    <button type="submit" className="app-button inline-flex gap-2" disabled={submitting}>
                        <Save className="h-4 w-4" aria-hidden="true" />
                        {submitting ? 'Saving...' : 'Register game'}
                    </button>
                </form>
            </section>
        </div>
    );
}

function Panel({ icon, title, description, children }) {
    return (
        <article className="glass-panel p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950/60">{icon}</div>
            <h2 className="mt-5 font-display text-2xl font-bold text-white">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
            {children}
        </article>
    );
}