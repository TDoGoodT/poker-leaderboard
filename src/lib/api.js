export async function fetchData() {
    try {
        const response = await fetch(`${import.meta.env.BASE_URL}data.json`);
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
            history: [] // { date, net, total }
        };
    });

    const sortedGames = [...games].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Process games chronologically to build history
    sortedGames.forEach(game => {
        const { date, results } = game;

        // Results might be an array or player map based on store implementation
        // My store.js implementation:
        // results object: { player: net, ... } (Wait, let's verify store.js)

        // Checking store.js:
        // `results[payer] = (results[payer] || 0) - amount;`
        // So results is an object { "Player": number }

        if (game.results) {
            Object.entries(game.results).forEach(([player, net]) => {
                if (!playerStats[player]) return; // Should not happen if players list is up to date

                const currentTotal = playerStats[player].net + net;
                playerStats[player].net = currentTotal;
                playerStats[player].gamesPlayed += 1;
                if (net > 0) playerStats[player].wins += 1;
                if (net < 0) playerStats[player].losses += 1;

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

    return {
        games: sortedGames,
        players: Object.values(playerStats).sort((a, b) => b.net - a.net)
    };
}
