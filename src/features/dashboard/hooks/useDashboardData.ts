import { useState, useEffect, useCallback } from 'react';
import { DashboardService, DashboardMetrics } from '../services/dashboardService';
import { SocketService } from '../../../api/socketService';

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

    // Subscribe to live backend WebSocket events for instantaneous re-render
    const unsubProduct = SocketService.on('product-updated', () => loadData(true));
    const unsubProductCreated = SocketService.on('product-created', () => loadData(true));
    const unsubProductDeleted = SocketService.on('product-deleted', () => loadData(true));
    const unsubOrder = SocketService.on('order-created', () => loadData(true));
    const unsubOrderCreated = SocketService.on('ORDER_CREATED', () => loadData(true));
    const unsubStock = SocketService.on('stock.changed', () => loadData(true));
    const unsubMetrics = SocketService.on('dashboard.metrics.update', () => loadData(true));

    return () => {
      unsubProduct();
      unsubProductCreated();
      unsubProductDeleted();
      unsubOrder();
      unsubOrderCreated();
      unsubStock();
      unsubMetrics();
    };
  }, [loadData]);

  return {
    metrics,
    loading,
    refreshing,
    error,
    refresh: () => loadData(true),
  };
};

