import { useEffect, useState } from 'react';
import { fetchData, processData } from '../lib/api';

const initialState = {
    games: [],
    players: [],
    playerMap: {},
    summary: null,
};

export default function useAppData() {
    const [state, setState] = useState(initialState);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    async function reload() {
        setLoading(true);
        setError(null);

        try {
            const data = await fetchData();
            setState(processData(data));
        } catch (loadError) {
            setError(loadError);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        reload();

        function handleDataUpdate() {
            reload();
        }

        window.addEventListener('pokerpal:data-updated', handleDataUpdate);
        return () => window.removeEventListener('pokerpal:data-updated', handleDataUpdate);
    }, []);

    return {
        ...state,
        loading,
        error,
        reload,
    };
}