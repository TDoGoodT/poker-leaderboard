import { useEffect, useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { createGame, updateGame, deleteGame } from '../lib/api';
import { customConfirm, customPrompt } from '../lib/dialogs';

function getInitialDateValue(initialGame) {
    return initialGame?.date
        ? new Date(initialGame.date).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16);
}

function getInitialEntries(initialGame) {
    if (!initialGame) {
        return [];
    }

    let rawEntriesByPlayer = new Map();

    if (initialGame.rawMessage) {
        try {
            const parsed = JSON.parse(initialGame.rawMessage);
            if (parsed && Array.isArray(parsed.entries)) {
                rawEntriesByPlayer = new Map(
                    parsed.entries.map((entry) => [entry.player, entry])
                );
            }
        } catch {
            rawEntriesByPlayer = new Map();
        }
    }

    return (initialGame.entries ?? []).map((entry) => {
        const rawEntry = rawEntriesByPlayer.get(entry.player);

        return {
            player: entry.player,
            buyIn: rawEntry?.buyIn ?? entry.buyIn ?? 0,
            cashOut: rawEntry?.cashOut ?? entry.cashOut ?? entry.net ?? 0,
        };
    });
}

function settleDebts(balances) {
    const debtors = balances.filter(b => b.net < -0.009).map(b => ({ ...b })).sort((a, b) => a.net - b.net);
    const creditors = balances.filter(b => b.net > 0.009).map(b => ({ ...b })).sort((a, b) => b.net - a.net);

    const transactions = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        const amount = Math.min(-debtor.net, creditor.net);
        if (amount > 0.009) {
            transactions.push({
                payer: debtor.player,
                receiver: creditor.player,
                amount: Number(amount.toFixed(2))
            });
        }

        debtor.net += amount;
        creditor.net -= amount;

        if (Math.abs(debtor.net) < 0.01) i++;
        if (Math.abs(creditor.net) < 0.01) j++;
    }

    return transactions;
}

const PRESET_AMOUNTS = [0, 50, 100, 150, 200, 300, 400, 500, 1000];

function AmountSelector({ label, value, onChange }) {
    return (
        <div className="flex flex-col gap-2 w-full pt-1">
            <span className="text-[10px] text-slate-500 uppercase font-medium tracking-wider">{label}</span>
            <div className="flex gap-2 relative">
                <input 
                    type="number" 
                    step="1" 
                    min="0"
                    value={value} 
                    onChange={e => onChange(e.target.value)} 
                    className="w-20 shrink-0 bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm text-center focus:outline-none focus:border-indigo-500 transition-colors [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                />
                <div className="flex-1 flex gap-2 overflow-x-auto pb-1 snap-x scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {PRESET_AMOUNTS.map(amount => (
                        <button
                            key={amount}
                            type="button"
                            onClick={() => onChange(amount)}
                            className={`snap-start shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${Number(value) === amount ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                        >
                            {amount}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function GameForm({ initialGame, allPlayers, onSaved, onCancel }) {
    const [date, setDate] = useState(() => getInitialDateValue(initialGame));
    const [entries, setEntries] = useState(() => getInitialEntries(initialGame));
    const [customPlayers, setCustomPlayers] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activePlayer, setActivePlayer] = useState(null);

    useEffect(() => {
        setDate(getInitialDateValue(initialGame));
        setEntries(getInitialEntries(initialGame));
        setCustomPlayers([]);
        setError(null);
        setLoading(false);
        setActivePlayer(null);
    }, [initialGame]);

    const availablePlayers = useMemo(() => {
        const existing = entries.map(e => e.player);
        return [...allPlayers, ...customPlayers].filter(p => !existing.includes(p));
    }, [allPlayers, customPlayers, entries]);

    const addEntry = (player) => {
        setEntries([...entries, { player, buyIn: '', cashOut: '' }]);
        setActivePlayer(player);
    };

    const updateEntry = (index, field, value) => {
        const newEntries = [...entries];
        const val = value === '' ? '' : Math.max(0, Number(value) || 0);
        newEntries[index][field] = val;
        setEntries(newEntries);
    };

    const removeEntry = (index) => {
        setEntries(entries.filter((_, i) => i !== index));
    };

    const handleCreatePlayer = async () => {
        const name = await customPrompt("Enter new player name:");
        if (name && name.trim()) {
            if (!customPlayers.includes(name.trim())) {
                setCustomPlayers([...customPlayers, name.trim()]);
            }
            addEntry(name.trim());
        }
    };

    const balances = entries.map(e => ({
        player: e.player,
        net: (Number(e.cashOut) || 0) - (Number(e.buyIn) || 0)
    }));
    const totalNet = balances.reduce((s, e) => s + e.net, 0);
    const isBalanced = Math.abs(totalNet) < 0.01;

    const handleDelete = async () => {
        if (!initialGame?.id) return;
        const isConfirmed = await customConfirm('Are you sure you want to delete this game?');
        if (!isConfirmed) return;
        
        setError(null);
        setLoading(true);
        try {
            await deleteGame(initialGame.id);
            onSaved();
        } catch (err) {
            if (err.message === 'Unauthorized' || err.status === 401) {
                localStorage.removeItem('adminToken');
                setError('Session expired. Please log in again.');
            } else {
                setError(err.message || 'Failed to delete game');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!isBalanced) {
            setError(`Total net must be 0 (Currently: ${totalNet > 0 ? '+' : ''}${totalNet})`);
            return;
        }

        const transactions = settleDebts(balances);
        // Sometimes people might play and break even, but if total entries > 1 and it balanced out, but no one lost/won, it's fine.
        
        setLoading(true);

        const payload = {
            date: new Date(date).toISOString(),
            entries: entries.map(e => ({ player: e.player, buyIn: Number(e.buyIn) || 0, cashOut: Number(e.cashOut) || 0 })),
            rawMessage: JSON.stringify({ entries: entries.map(e => ({ player: e.player, buyIn: Number(e.buyIn) || 0, cashOut: Number(e.cashOut) || 0 })) }),
            sender: 'manual-web',
            transactions
        };

        try {
            if (initialGame?.id) {
                await updateGame(initialGame.id, payload);
            } else {
                await createGame(payload);
            }
            onSaved();
        } catch (err) {
            if (err.message === 'Unauthorized' || err.status === 401) {
                localStorage.removeItem('adminToken');
                setError('Session expired. Please log in again.');
            } else {
                setError(err.message || 'Failed to save game');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-white">
            {error && (
                <div className="bg-red-500/20 text-red-200 p-3 rounded-xl border border-red-500/50 text-sm">
                    {error}
                </div>
            )}
            
            <label className="flex flex-col gap-1">
                <span className="text-sm text-slate-400">Date</span>
                <input 
                    type="datetime-local" 
                    className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                />
            </label>

            <div className="flex flex-col gap-4 mt-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-slate-300">Players ({entries.length})</h3>
                    <div className="text-xs text-slate-400">
                        Total Net: <span className={isBalanced ? 'text-emerald-400' : 'text-rose-400'}>{totalNet > 0 ? '+' : ''}{totalNet}</span>
                    </div>
                </div>

                {entries.map((entry, idx) => {
                    const isExpanded = activePlayer === entry.player || (activePlayer === null && idx === entries.length - 1);
                    return (
                        <div 
                            key={idx} 
                            className={`flex flex-col gap-3 p-4 rounded-2xl border transition-all duration-300 shadow-sm cursor-pointer ${isExpanded ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-900/30 border-transparent hover:bg-slate-800/20'}`}
                            onClick={() => !isExpanded && setActivePlayer(entry.player)}
                        >
                            <div className="flex justify-between items-center text-slate-100">
                                <div className="font-semibold text-base">{entry.player}</div>
                                {!isExpanded && (
                                    <div className="flex-1 flex justify-end gap-3 mr-4 text-sm opacity-70">
                                        <div className="flex flex-col text-right">
                                            <span className="text-[10px] text-slate-500 uppercase leading-none mb-1">Buy-in</span>
                                            <span>{entry.buyIn || 0}</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[10px] text-slate-500 uppercase leading-none mb-1">Cash-out</span>
                                            <span>{entry.cashOut || 0}</span>
                                        </div>
                                        <div className="flex flex-col text-right min-w-[50px]">
                                            <span className="text-[10px] text-slate-500 uppercase leading-none mb-1">Net</span>
                                            <span className={`font-bold ${((Number(entry.cashOut) || 0) - (Number(entry.buyIn) || 0)) > 0 ? 'text-emerald-400' : ((Number(entry.cashOut) || 0) - (Number(entry.buyIn) || 0)) < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                                                {((Number(entry.cashOut) || 0) - (Number(entry.buyIn) || 0)) > 0 ? '+' : ''}{((Number(entry.cashOut) || 0) - (Number(entry.buyIn) || 0))}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <button type="button" onClick={(e) => { e.stopPropagation(); removeEntry(idx); }} className="p-1.5 -mr-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            {isExpanded && (
                                <>
                                    <div className="flex flex-col gap-3">
                                        <AmountSelector 
                                            label="Buy-in" 
                                            value={entry.buyIn} 
                                            onChange={(val) => updateEntry(idx, 'buyIn', val)} 
                                        />
                                        <AmountSelector 
                                            label="Cash-out" 
                                            value={entry.cashOut} 
                                            onChange={(val) => updateEntry(idx, 'cashOut', val)} 
                                        />
                                    </div>

                                    <div className="w-full mt-2 pt-3 border-t border-slate-700/50 flex justify-between items-center px-1">
                                        <span className="text-sm text-slate-400 font-medium">Net Profit</span>
                                        <span className={`font-bold text-lg ${((Number(entry.cashOut) || 0) - (Number(entry.buyIn) || 0)) > 0 ? 'text-emerald-400' : ((Number(entry.cashOut) || 0) - (Number(entry.buyIn) || 0)) < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                                            {((Number(entry.cashOut) || 0) - (Number(entry.buyIn) || 0)) > 0 ? '+' : ''}{((Number(entry.cashOut) || 0) - (Number(entry.buyIn) || 0))}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
                {availablePlayers.slice(0, 8).map(p => (
                    <button key={p} type="button" onClick={() => addEntry(p)} className="px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 hover:text-white transition-colors">
                        + {p}
                    </button>
                ))}
                {availablePlayers.length > 8 && (
                    <select 
                        onChange={(e) => { if(e.target.value) addEntry(e.target.value); e.target.value=''; }}
                        className="px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 hover:text-white transition-colors focus:outline-none max-w-[120px]"
                    >
                        <option value="">More...</option>
                        {availablePlayers.slice(8).map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                )}
                <button type="button" onClick={handleCreatePlayer} className="px-3 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-sm hover:bg-indigo-500/30 transition-colors">
                    New Player
                </button>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/80 backdrop-blur-md border-t border-slate-800 flex justify-end gap-3 rounded-none sm:relative sm:bg-transparent sm:border-0 sm:p-0 mt-8 z-50">
                {initialGame?.id && (
                    <button type="button" onClick={handleDelete} disabled={loading} className="px-5 py-2.5 rounded-xl bg-rose-500/10 text-rose-400 font-medium hover:bg-rose-500/20 transition mr-auto">
                        Delete
                    </button>
                )}
                <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 transition">
                    Cancel
                </button>
                <button 
                    type="submit" 
                    disabled={loading || !isBalanced || entries.length < 2}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition flex gap-2 items-center"
                >
                    {loading ? 'Saving...' : initialGame ? 'Update Game' : 'Save Game'}
                </button>
            </div>
            <div className="h-16 sm:hidden"></div>
        </form>
    );
}