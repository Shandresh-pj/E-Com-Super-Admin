import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Header } from '../../../components/common/Header';
import { MetricCard } from '../../../components/cards/MetricCard';
import { OrderCard } from '../../../components/cards/OrderCard';
import { DashboardSkeleton } from '../../../components/skeletons/SkeletonLoader';
import { ErrorState, EmptyState } from '../../../components/common/States';
import { useDashboardData } from '../hooks/useDashboardData';
import { useTheme } from '../../../theme/theme';
import { useAuthStore } from '../../../store/authStore';
import { Users, IndianRupee, ShoppingBag, CheckCircle } from 'lucide-react-native';
import { Badge } from '../../../components/common/Badge';

import { ExecutiveProfileCard } from '../../../components/cards/ExecutiveProfileCard';

export const BranchManagerDashboard: React.FC = () => {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const { metrics, loading, refreshing, error, refresh } = useDashboardData();

  if (loading && !metrics) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Manager Operations" subtitle="Branch Management" />
        <DashboardSkeleton />
      </ScreenContainer>
    );
  }

  if (error && !metrics) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Manager Operations" />
        <ErrorState message={error} onRetry={refresh} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={true} refreshing={refreshing} onRefresh={refresh}>
      <Header
        title="Manager Operations"
        subtitle={`Branch Manager: ${user?.name || user?.email?.split('@')[0] || 'Manager'}`}
      />

      <ExecutiveProfileCard />

      <View style={styles.metricsGrid}>
        <MetricCard
          title="Daily Sales"
          value={`₹${(metrics?.totalRevenue || 0).toLocaleString('en-IN')}`}
          icon={<IndianRupee size={18} color={theme.colors.primary} />}
        />
        <MetricCard
          title="Branch Staff"
          value={metrics?.totalEmployees || 0}
          icon={<Users size={18} color={theme.colors.accent} />}
        />
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard
          title="Active Orders"
          value={metrics?.totalOrders || 0}
          icon={<ShoppingBag size={18} color={theme.colors.warning} />}
        />
        <MetricCard
          title="Branch Catalog"
          value={metrics?.totalProducts || 0}
          icon={<CheckCircle size={18} color={theme.colors.success} />}
        />
      </View>

      <View style={styles.section}>
        <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginBottom: 8 }]}>
          Staff Operations & Orders
        </Text>
        {metrics?.recentOrders && metrics.recentOrders.length > 0 ? (
          metrics.recentOrders.map((ord) => <OrderCard key={ord.id} order={ord} />)
        ) : (
          <EmptyState title="No Active Tasks" description="All branch tasks are up to date." />
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
