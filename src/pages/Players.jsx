import { useDeferredValue, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Trophy } from 'lucide-react';
import PlayerAvatar from '../components/PlayerAvatar';
import useAppData from '../hooks/useAppData';
import { formatSignedAmount } from '../lib/format';

export default function Players() {
    const { players, loading } = useAppData();
    const [query, setQuery] = useState('');
    const deferredQuery = useDeferredValue(query);

    const filteredPlayers = players.filter((player) => {
        if (!deferredQuery.trim()) {
            return true;
        }

        return player.name.toLowerCase().includes(deferredQuery.trim().toLowerCase());
    });

    if (loading) {
        return <div className="glass-panel flex min-h-[50vh] w-full items-center justify-center text-slate-400">Loading players...</div>;
    }

    return (
        <div className="flex w-full flex-col gap-6 pb-28">
            <section className="hero-panel p-6 sm:p-8">
                <div className="section-kicker">Players</div>
                <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-white">Find any player and open their analytics.</h1>
                <div className="mt-5 flex items-center gap-3 rounded-[24px] border border-white/10 bg-slate-950/60 px-4 py-3">
                    <Search className="h-4 w-4 text-slate-500" />
                    <input
                        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search players"
                    />
                </div>
            </section>

            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredPlayers.map((player) => (
                    <Link key={player.name} to={`/player/${encodeURIComponent(player.name)}`} className="glass-panel group flex items-center gap-4 p-5 transition-colors duration-200 hover:border-emerald-400/18">
                        <PlayerAvatar name={player.name} />
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-lg font-bold text-white">{player.name}</div>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                                <span className="stat-pill">#{player.rank}</span>
                                <span className="stat-pill">{player.gamesPlayed} games</span>
                                <span className="stat-pill">{Math.round(player.winRate)}% wins</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`text-xl font-extrabold ${player.net >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{formatSignedAmount(player.net)}</div>
                            <div className="mt-1 inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                                <Trophy className="h-3.5 w-3.5" /> Rank {player.rank}
                            </div>
                        </div>
                    </Link>
                ))}
            </section>
        </div>
    );
}