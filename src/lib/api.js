const STORAGE_KEY = 'pokerpal.local-sessions.v1';

function readLocalSessions() {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const rawValue = window.localStorage.getItem(STORAGE_KEY);
        return rawValue ? JSON.parse(rawValue) : [];
    } catch (error) {
        console.error('Error reading local sessions:', error);
        return [];
    }
}

function writeLocalSessions(games) {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
    window.dispatchEvent(new CustomEvent('pokerpal:data-updated'));
}

function mergeData(baseData, localGames) {
    const uniqueGames = new Map();

    (baseData.games || []).forEach((game) => {
        uniqueGames.set(game.id, { ...game, isLocal: false });
    });

    localGames.forEach((game) => {
        uniqueGames.set(game.id, { ...game, isLocal: true });
    });

    const allGames = Array.from(uniqueGames.values());
    const playerSet = new Set(baseData.players || []);

    allGames.forEach((game) => {
        Object.keys(game.results || {}).forEach((player) => playerSet.add(player));
    });

    return {
        games: allGames,
        players: Array.from(playerSet),
    };
}

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

export async function fetchData() {
    try {
        const url = `${import.meta.env.BASE_URL}data.json?ts=${Date.now()}`;
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        const baseData = await response.json();
        return mergeData(baseData, readLocalSessions());
    } catch (error) {
        console.error('Error fetching data:', error);
        return mergeData({ games: [], players: [] }, readLocalSessions());
    }
}

export function processData(data) {
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

    const chronologicalGames = [...(data.games || [])]
        .map(enrichGame)
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

export function saveSession({ date, participants, notes }) {
    const cleanedParticipants = participants
        .map((participant) => ({
            name: participant.name.trim(),
            buyIn: Number(participant.buyIn || 0),
            cashOut: Number(participant.cashOut || 0),
        }))
        .filter((participant) => participant.name);

    const results = cleanedParticipants.reduce((accumulator, participant) => {
        accumulator[participant.name] = participant.cashOut - participant.buyIn;
        return accumulator;
    }, {});

    const transactions = cleanedParticipants.map((participant) => ({
        player: participant.name,
        buyIn: participant.buyIn,
        cashOut: participant.cashOut,
        net: participant.cashOut - participant.buyIn,
    }));

    const rawMessage = notes?.trim()
        ? notes.trim()
        : transactions
              .map((transaction) => `${transaction.player}: buy-in ${transaction.buyIn}, cash-out ${transaction.cashOut}, net ${transaction.net}`)
              .join('\n');

    const game = {
        id: `LOCAL_${Date.now()}`,
        date: new Date(date).toISOString(),
        rawMessage,
        results,
        transactions,
        sender: 'manual@local',
        notes: notes?.trim() || '',
    };

    const sessions = readLocalSessions();
    writeLocalSessions([game, ...sessions]);
    return game;
}

export function clearLocalSessions() {
    writeLocalSessions([]);
}

/**
 * Delete a single locally-saved session by id.
 * Dispatches pokerpal:data-updated so useAppData reloads automatically.
 */
export function deleteLocalSession(id) {
    const sessions = readLocalSessions();
    writeLocalSessions(sessions.filter((session) => session.id !== id));
}
