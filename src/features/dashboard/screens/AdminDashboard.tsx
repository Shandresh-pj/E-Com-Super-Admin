import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Header } from '../../../components/common/Header';
import { MetricCard } from '../../../components/cards/MetricCard';
import { MiniChart } from '../../../components/charts/MiniChart';
import { OrderCard } from '../../../components/cards/OrderCard';
import { ProductCard } from '../../../components/cards/ProductCard';
import { DashboardSkeleton } from '../../../components/skeletons/SkeletonLoader';
import { ErrorState, EmptyState } from '../../../components/common/States';
import { useDashboardData } from '../hooks/useDashboardData';
import { useTheme } from '../../../theme/theme';
import { useAuthStore } from '../../../store/authStore';
import { useSocket } from '../../../api/SocketProvider';
import { IndianRupee, ShoppingBag, Box, Users, Store, Layers } from 'lucide-react-native';
import { Badge } from '../../../components/common/Badge';
import { ExecutiveProfileCard } from '../../../components/cards/ExecutiveProfileCard';

export const AdminDashboard: React.FC = () => {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const { metrics, loading, refreshing, error, refresh } = useDashboardData();
  const { isConnected } = useSocket();

  if (loading && !refreshing) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Admin Overview" subtitle="Loading metrics..." />
        <DashboardSkeleton />
      </ScreenContainer>
    );
  }

  if (error && !metrics) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Admin Overview" subtitle="System Status" />
        <ErrorState message={error} onRetry={refresh} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={true} refreshing={refreshing} onRefresh={refresh}>
      <Header
        title="Admin Dashboard"
        subtitle={`Welcome, ${user?.name || user?.email?.split('@')[0] || 'Administrator'}`}
      />

      <ExecutiveProfileCard />

      <View style={styles.metricsGrid}>
        <MetricCard
          title="Gross Revenue"
          value={`₹${(metrics?.totalRevenue || 0).toLocaleString('en-IN')}`}
          icon={<IndianRupee size={18} color={theme.colors.primary} />}
        />
        <MetricCard
          title="Orders Processed"
          value={metrics?.totalOrders || 0}
          icon={<ShoppingBag size={18} color={theme.colors.accent} />}
        />
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard
          title="Active Products"
          value={metrics?.totalProducts || 0}
          icon={<Box size={18} color={theme.colors.success} />}
        />
        <MetricCard
          title="Staff Employees"
          value={metrics?.totalEmployees || 0}
          icon={<Users size={18} color={theme.colors.warning} />}
        />
      </View>

      <View style={[styles.chartCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.chartHeader}>
          <Text style={[theme.typography.subtitle1, { color: theme.colors.textPrimary }]}>
            Sales Overview
          </Text>
          <Badge label={isConnected ? 'Live Data' : 'Offline'} variant={isConnected ? 'success' : 'error'} size="sm" />
        </View>
        <MiniChart
          height={80}
          color={theme.colors.accent}
          data={
            metrics?.recentOrders && metrics.recentOrders.length > 0
              ? metrics.recentOrders.map((o) => parseFloat(String(o.total_amount || 0))).reverse()
              : [0, metrics?.totalRevenue || 0]
          }
        />
      </View>

      <View style={styles.section}>
        <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginBottom: 8 }]}>
          Recent Orders
        </Text>
        {metrics?.recentOrders && metrics.recentOrders.length > 0 ? (
          metrics.recentOrders.map((ord) => <OrderCard key={ord.id} order={ord} />)
        ) : (
          <EmptyState title="No Recent Orders" description="No orders registered in system." />
        )}
      </View>

      <View style={styles.section}>
        <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginBottom: 8 }]}>
          Catalog Products
        </Text>
        {metrics?.productsList && metrics.productsList.length > 0 ? (
          metrics.productsList.slice(0, 3).map((prod) => <ProductCard key={prod.id} product={prod} />)
        ) : (
          <EmptyState title="No Catalog Products" description="No products available." />
        )}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  metricsGrid: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginVertical: 4,
  },
  chartCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 12,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  section: {
    marginVertical: 12,
  },
});
