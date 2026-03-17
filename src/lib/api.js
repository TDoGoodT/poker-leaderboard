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

export function processData(data) {
    const { games, players } = data;
    const playerStats = {};

    players.forEach(player => {
        playerStats[player] = {
            name: player,
            net: 0,
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            breakEven: 0,
            totalWinnings: 0,
            totalLosses: 0,
            biggestWin: null,
            biggestLoss: null,
            history: [] // { date, net, total }
        };
    });

    const sortedGames = [...games].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Process games chronologically to build history
    sortedGames.forEach(game => {
        const { date } = game;

        if (game.results) {
            Object.entries(game.results).forEach(([player, net]) => {
                if (!playerStats[player]) return; // Should not happen if players list is up to date

                const currentTotal = playerStats[player].net + net;
                playerStats[player].net = currentTotal;
                playerStats[player].gamesPlayed += 1;
                if (net > 0) {
                    playerStats[player].wins += 1;
                    playerStats[player].totalWinnings += net;
                    if (playerStats[player].biggestWin === null || net > playerStats[player].biggestWin) playerStats[player].biggestWin = net;
                } else if (net < 0) {
                    playerStats[player].losses += 1;
                    playerStats[player].totalLosses += Math.abs(net);
                    if (playerStats[player].biggestLoss === null || net < playerStats[player].biggestLoss) playerStats[player].biggestLoss = net;
                } else {
                    playerStats[player].breakEven += 1;
                }

                playerStats[player].history.push({
                    date,
                    net,
                    total: currentTotal
                });
            });

            // For players not in this game, push their previous total so the graph is continuous?
            // Or just let the graph handle gaps. Recharts handles fine. 
            // But for "total over time", we might want a point for every game date?
            // Let's stick to simple history for now.
        }
    });

    // Compute derived stats per player
    Object.values(playerStats).forEach(p => {
        p.winRate = p.gamesPlayed > 0 ? (p.wins / p.gamesPlayed) * 100 : 0;
        p.avgNet = p.gamesPlayed > 0 ? p.net / p.gamesPlayed : 0;

        // Current streak: count consecutive same-direction results from most recent
        let streak = 0;
        let streakType = 'none';
        for (let i = p.history.length - 1; i >= 0; i--) {
            const result = p.history[i].net;
            if (i === p.history.length - 1) {
                streakType = result > 0 ? 'win' : result < 0 ? 'loss' : 'none';
                if (streakType !== 'none') streak = 1;
                else break;
            } else {
                const matches =
                    (streakType === 'win' && result > 0) ||
                    (streakType === 'loss' && result < 0);
                if (matches) streak++;
                else break;
            }
        }
        p.streak = { count: streak, type: streakType };
    });

    return {
        games: sortedGames,
        players: Object.values(playerStats).sort((a, b) => b.net - a.net)
    };
}
