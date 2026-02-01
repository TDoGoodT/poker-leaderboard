import { useEffect, useState } from 'react';
import { fetchData, processData } from '../lib/api';
import LeaderboardTable from '../components/LeaderboardTable';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Leaderboard() {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData().then(data => {
            const { players } = processData(data);
            setPlayers(players);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="text-center p-10 text-slate-400 animate-pulse">Loading leaderboard...</div>;

    const topPlayers = players.slice(0, 5); // For chart

    return (
        <div className="space-y-8">
            <section>
                <h1 className="text-3xl font-bold mb-6 text-white">Current Standings</h1>
                <LeaderboardTable players={players} />
            </section>

            <section className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <h2 className="text-xl font-semibold mb-6 text-slate-200">Top Players Overview</h2>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={players}>
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            />
                            <Bar dataKey="net" radius={[4, 4, 0, 0]}>
                                {players.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.net >= 0 ? '#4ade80' : '#f87171'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </section>
        </div>
    );
}
