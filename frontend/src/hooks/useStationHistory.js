import { useState, useEffect } from 'react';
import { stationService } from '@/services/stationService';

/**
 * Hook to fetch station history data.
 */
export function useStationHistory(stationId, options = {}) {
  const { mode = 'hourly', from, to } = options;
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!stationId) {
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const data = await stationService.getHistory(stationId, { mode, from, to });
        setHistory(data.history || data.data || []);
        setError(null);
      } catch (err) {
        setError(err.message);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [stationId, mode, from, to]);

  return { history, loading, error };
}
