import { useState, useEffect, useCallback } from 'react';
import { stationService } from '@/services/stationService';
import { REFRESH_INTERVALS } from '@/utils/constants';

/**
 * Hook to fetch and manage dashboard data.
 * Auto-refreshes every 60 seconds.
 */
export function useDashboard() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await stationService.getDashboard();
      // Backend returns { success: true, data: [...] }
      const list = res.data || res.stations || res || [];
      setStations(Array.isArray(list) ? list : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, REFRESH_INTERVALS.DASHBOARD);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  return { stations, loading, error, refetch: fetchDashboard };
}
