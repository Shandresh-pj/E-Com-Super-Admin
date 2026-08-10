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
import { ClipboardList, ShoppingBag, Box, Award } from 'lucide-react-native';
import { Badge } from '../../../components/common/Badge';

import { ExecutiveProfileCard } from '../../../components/cards/ExecutiveProfileCard';

export const EmployeeDashboard: React.FC = () => {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const { metrics, loading, refreshing, error, refresh } = useDashboardData();

  if (loading && !metrics) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Employee Portal" subtitle="Daily Task Workspace" />
        <DashboardSkeleton />
      </ScreenContainer>
    );
  }

  if (error && !metrics) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Employee Portal" />
        <ErrorState message={error} onRetry={refresh} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={true} refreshing={refreshing} onRefresh={refresh}>
      <Header
        title="Employee Workspace"
        subtitle={`Staff: ${user?.name || user?.email?.split('@')[0] || 'Employee'}`}
      />

      <ExecutiveProfileCard />

      <View style={styles.metricsGrid}>
        <MetricCard
          title="Assigned Orders"
          value={metrics?.totalOrders || 0}
          icon={<ShoppingBag size={18} color={theme.colors.primary} />}
        />
        <MetricCard
          title="Product Lookups"
          value={metrics?.totalProducts || 0}
          icon={<Box size={18} color={theme.colors.success} />}
        />
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard
          title="Pending Queue"
          value={metrics?.pendingOrders ?? 0}
          icon={<ClipboardList size={18} color={theme.colors.accent} />}
        />
        <MetricCard
          title="Total Outlets"
          value={metrics?.totalBranches ?? 0}
          icon={<Award size={18} color={theme.colors.warning} />}
        />
      </View>

      <View style={styles.section}>
        <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginBottom: 8 }]}>
          Current Assigned Queue
        </Text>
        {metrics?.recentOrders && metrics.recentOrders.length > 0 ? (
          metrics.recentOrders.map((ord) => <OrderCard key={ord.id} order={ord} />)
        ) : (
          <EmptyState title="No Assigned Orders" description="You have no pending order assignments." />
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
