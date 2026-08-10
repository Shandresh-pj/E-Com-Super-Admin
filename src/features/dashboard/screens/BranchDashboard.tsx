import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Header } from '../../../components/common/Header';
import { MetricCard } from '../../../components/cards/MetricCard';
import { OrderCard } from '../../../components/cards/OrderCard';
import { ProductCard } from '../../../components/cards/ProductCard';
import { DashboardSkeleton } from '../../../components/skeletons/SkeletonLoader';
import { ErrorState, EmptyState } from '../../../components/common/States';
import { useDashboardData } from '../hooks/useDashboardData';
import { useTheme } from '../../../theme/theme';
import { useAuthStore } from '../../../store/authStore';
import { Store, ShoppingBag, Box, Clock } from 'lucide-react-native';
import { Badge } from '../../../components/common/Badge';

import { ExecutiveProfileCard } from '../../../components/cards/ExecutiveProfileCard';

export const BranchDashboard: React.FC = () => {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const branchName = user?.branch?.name || user?.officeBranch || (user?.branchId ? `Branch #${user.branchId}` : 'Main Branch');
  const { metrics, loading, refreshing, error, refresh } = useDashboardData();

  if (loading && !metrics) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Branch Dashboard" subtitle={branchName} />
        <DashboardSkeleton />
      </ScreenContainer>
    );
  }

  if (error && !metrics) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Branch Dashboard" />
        <ErrorState message={error} onRetry={refresh} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={true} refreshing={refreshing} onRefresh={refresh}>
      <Header
        title="Branch Outlet"
        subtitle={branchName}
      />

      <ExecutiveProfileCard />

      <View style={styles.metricsGrid}>
        <MetricCard
          title="Branch Revenue"
          value={`₹${(metrics?.totalRevenue || 0).toLocaleString('en-IN')}`}
          icon={<Store size={18} color={theme.colors.primary} />}
        />
        <MetricCard
          title="Branch Orders"
          value={metrics?.totalOrders || 0}
          icon={<ShoppingBag size={18} color={theme.colors.accent} />}
        />
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard
          title="Available Products"
          value={metrics?.totalProducts || 0}
          icon={<Box size={18} color={theme.colors.success} />}
        />
        <MetricCard
          title="Pending Fulfillment"
          value={metrics?.recentOrders?.filter((o) => o.status === 'PENDING').length || 0}
          icon={<Clock size={18} color={theme.colors.warning} />}
        />
      </View>

      <View style={styles.section}>
        <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginBottom: 8 }]}>
          Branch Active Orders
        </Text>
        {metrics?.recentOrders && metrics.recentOrders.length > 0 ? (
          metrics.recentOrders.map((ord) => <OrderCard key={ord.id} order={ord} />)
        ) : (
          <EmptyState title="No Branch Orders" description="No orders placed at this branch yet." />
        )}
      </View>

      <View style={styles.section}>
        <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginBottom: 8 }]}>
          Branch Stock Availability
        </Text>
        {metrics?.productsList && metrics.productsList.length > 0 ? (
          metrics.productsList.slice(0, 3).map((prod) => <ProductCard key={prod.id} product={prod} />)
        ) : (
          <EmptyState title="No Stock Records" description="Branch stock is empty." />
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
  section: {
    marginVertical: 12,
  },
});
