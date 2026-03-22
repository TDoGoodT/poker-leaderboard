import { useEffect, useMemo, useState } from 'react';
import { fetchData, processData } from '../lib/api';

const initialState = {
    games: [],
    players: [],
    playerMap: {},
    summary: null,
};

export default function useAppData(options = {}) {
    const { timeRange = 'all-time' } = options;
    const [rawData, setRawData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    async function reload() {
        setLoading(true);
        setError(null);

        try {
            const data = await fetchData();
            setRawData(data);
        } catch (loadError) {
            setError(loadError);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        reload();
    }, []);

    const state = useMemo(() => {
        if (!rawData) {
            return initialState;
        }

        return processData(rawData, { timeRange });
    }, [rawData, timeRange]);

    return {
        ...state,
        loading,
        error,
        reload,
    };
}