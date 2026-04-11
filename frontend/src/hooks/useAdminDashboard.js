import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '@/services/adminService';
import { REFRESH_INTERVALS } from '@/utils/constants';

/**
 * Hook to fetch and manage admin dashboard statistics.
 * Auto-refreshes every 30 seconds.
 */
export function useAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await dashboardService.getStats();
      setStats(res.data || null);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch admin dashboard stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, REFRESH_INTERVALS.ADMIN_DEVICES);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
