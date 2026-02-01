import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export default function LeaderboardTable({ players }) {
    return (
        <div className="bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-700">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-900 border-b border-slate-700">
                            <th className="px-6 py-4 font-semibold text-slate-400 uppercase text-xs tracking-wider">Rank</th>
                            <th className="px-6 py-4 font-semibold text-slate-400 uppercase text-xs tracking-wider">Player</th>
                            <th className="px-6 py-4 font-semibold text-slate-400 uppercase text-xs tracking-wider text-right">Net Score</th>
                            <th className="px-6 py-4 font-semibold text-slate-400 uppercase text-xs tracking-wider text-right">Games</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {players.map((player, index) => (
                            <tr key={player.name} className="hover:bg-slate-750 transition-colors">
                                <td className="px-6 py-4 text-slate-400 font-mono">
                                    {index + 1}
                                </td>
                                <td className="px-6 py-4 font-medium text-white">
                                    <Link to={`/player/${encodeURIComponent(player.name)}`} className="text-blue-400 hover:text-blue-300 hover:underline decoration-blue-400/30 underline-offset-4">
                                        {player.name}
                                    </Link>
                                </td>
                                <td className={`px-6 py-4 text-right font-bold font-mono ${player.net > 0 ? 'text-green-400' : player.net < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                    {player.net > 0 && '+'}{player.net}
                                </td>
                                <td className="px-6 py-4 text-slate-400 text-right">
                                    {player.gamesPlayed}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
