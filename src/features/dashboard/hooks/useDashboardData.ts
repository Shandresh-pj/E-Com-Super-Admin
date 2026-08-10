import { useState, useEffect, useCallback } from 'react';
import { DashboardService, DashboardMetrics } from '../services/dashboardService';

export const useDashboardData = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await DashboardService.fetchAggregatedData();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard statistics from backend');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    metrics,
    loading,
    refreshing,
    error,
    refresh: () => loadData(true),
  };
};
