function enrichGame(game) {
    const entries = Object.entries(game.results || {})
        .map(([player, net]) => ({ player, net: Number(net || 0) }))
        .sort((left, right) => right.net - left.net);

    const positiveEntries = entries.filter((entry) => entry.net > 0);
    const negativeEntries = [...entries]
        .filter((entry) => entry.net < 0)
        .sort((left, right) => left.net - right.net);

    return {
        ...game,
        entries,
        positiveEntries,
        negativeEntries,
        totalPot: positiveEntries.reduce((sum, entry) => sum + entry.net, 0),
        balance: entries.reduce((sum, entry) => sum + entry.net, 0),
        participantsCount: entries.length,
        topWinner: positiveEntries[0] || null,
        topLoser: negativeEntries[0] || null,
        winners: positiveEntries.slice(0, 2),
        losers: negativeEntries.slice(0, 2),
    };
}

function getRangeStartDate(timeRange) {
    const now = new Date();

    if (timeRange === 'last-year') {
        return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    }

    if (timeRange === 'last-month') {
        return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    return null;
}

export async function fetchData() {
    try {
        const url = `${import.meta.env.BASE_URL}data.json?ts=${Date.now()}`;
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching data:', error);
        return { games: [], players: [] };
    }
}

export function processData(data, options = {}) {
    const { timeRange = 'all-time' } = options;
    const playerStats = {};
    const playerNames = Array.from(new Set(data.players || [])).sort((left, right) => left.localeCompare(right));

    playerNames.forEach((player) => {
        playerStats[player] = {
            name: player,
            net: 0,
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            history: [],
            averageNet: 0,
            bestWin: 0,
            worstLoss: 0,
            winRate: 0,
            recentGames: [],
        };
    });

    const startDate = getRangeStartDate(timeRange);

    const chronologicalGames = [...(data.games || [])]
        .map(enrichGame)
        .filter((game) => {
            if (!startDate) {
                return true;
            }

            return new Date(game.date) >= startDate;
        })
        .sort((left, right) => new Date(left.date) - new Date(right.date));

    chronologicalGames.forEach((game) => {
        game.entries.forEach(({ player, net }) => {
            if (!playerStats[player]) {
                playerStats[player] = {
                    name: player,
                    net: 0,
                    gamesPlayed: 0,
                    wins: 0,
                    losses: 0,
                    history: [],
                    averageNet: 0,
                    bestWin: 0,
                    worstLoss: 0,
                    winRate: 0,
                    recentGames: [],
                };
            }

            const currentTotal = playerStats[player].net + net;
            playerStats[player].net = currentTotal;
            playerStats[player].gamesPlayed += 1;
            playerStats[player].wins += net > 0 ? 1 : 0;
            playerStats[player].losses += net < 0 ? 1 : 0;
            playerStats[player].bestWin = Math.max(playerStats[player].bestWin, net);
            playerStats[player].worstLoss = Math.min(playerStats[player].worstLoss, net);
            playerStats[player].history.push({
                date: game.date,
                net,
                total: currentTotal,
                gameId: game.id,
            });
        });
    });

    const players = Object.values(playerStats)
        .map((player) => {
            const recentGames = [...chronologicalGames]
                .reverse()
                .filter((game) => Object.prototype.hasOwnProperty.call(game.results || {}, player.name))
                .slice(0, 4)
                .map((game) => ({
                    id: game.id,
                    date: game.date,
                    net: Number(game.results[player.name] || 0),
                    totalPot: game.totalPot,
                    participantsCount: game.participantsCount,
                    topWinner: game.topWinner,
                }));

            return {
                ...player,
                averageNet: player.gamesPlayed ? player.net / player.gamesPlayed : 0,
                winRate: player.gamesPlayed ? (player.wins / player.gamesPlayed) * 100 : 0,
                bestWin: player.bestWin,
                worstLoss: player.worstLoss,
                recentGames,
            };
        })
        .sort((left, right) => {
            if (right.net !== left.net) {
                return right.net - left.net;
            }

            return right.wins - left.wins;
        })
        .map((player, index) => ({
            ...player,
            rank: index + 1,
        }));

    const playerMap = players.reduce((accumulator, player) => {
        accumulator[player.name] = player;
        return accumulator;
    }, {});

    const games = [...chronologicalGames].reverse();
    const mostActivePlayer = players.reduce((leader, player) => {
        if (!leader || player.gamesPlayed > leader.gamesPlayed) {
            return player;
        }
        return leader;
    }, null);

    const summary = {
        totalSessions: games.length,
        activePlayers: players.filter((player) => player.gamesPlayed > 0).length,
        profitablePlayers: players.filter((player) => player.net > 0).length,
        biggestSwing: games.reduce((leader, game) => {
            if (!leader || game.totalPot > leader.totalPot) {
                return game;
            }
            return leader;
        }, null),
        mostActivePlayer,
        latestSession: games[0] || null,
    };

    return {
        games,
        players,
        playerMap,
        summary,
    };
}
