import { useEffect, useState } from 'react';
import { fetchData } from '../lib/api';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';

export default function History() {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData().then(data => {
            // Sort by date desc
            const sorted = [...data.games].sort((a, b) => new Date(b.date) - new Date(a.date));
            setGames(sorted);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-400">Loading history...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-400" />
                Game History
            </h1>

            <div className="grid gap-6">
                {games.map((game) => (
                    <div key={game.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                        <div className="bg-slate-900/50 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
                            <span className="text-slate-400 font-medium">
                                {format(new Date(game.date), 'EEEE, MMMM d, yyyy • h:mm a')}
                            </span>
                            {game.sender && (
                                <span className="text-xs text-slate-600 bg-slate-900 px-2 py-1 rounded">
                                    Reported by {game.sender.replace('@c.us', '')}
                                </span>
                            )}
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {game.results && Object.entries(game.results)
                                    .sort(([, a], [, b]) => b - a) // Sort by score
                                    .map(([player, score]) => (
                                        <div key={player} className="flex flex-col">
                                            <span className="text-slate-400 text-sm">{player}</span>
                                            <span className={`font-mono font-bold ${score > 0 ? 'text-green-400' : score < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                                {score > 0 && '+'}{score}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                            {game.rawMessage && (
                                <div className="mt-6 pt-4 border-t border-slate-700/50">
                                    <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Internal Message Text</div>
                                    <div className="text-slate-400 text-sm font-mono bg-slate-900/50 p-3 rounded border border-slate-700/50 whitespace-pre-wrap">
                                        {game.rawMessage}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
