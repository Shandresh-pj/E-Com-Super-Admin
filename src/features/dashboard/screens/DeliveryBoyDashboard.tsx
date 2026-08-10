import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Header } from '../../../components/common/Header';
import { MetricCard } from '../../../components/cards/MetricCard';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { DashboardSkeleton } from '../../../components/skeletons/SkeletonLoader';
import { ErrorState, EmptyState } from '../../../components/common/States';
import { useDashboardData } from '../hooks/useDashboardData';
import { useTheme } from '../../../theme/theme';
import { useAuthStore } from '../../../store/authStore';
import { OrderService } from '../../orders/services/orderService';
import { Truck, MapPin, Phone, CheckCircle, Navigation } from 'lucide-react-native';
import { ExecutiveProfileCard } from '../../../components/cards/ExecutiveProfileCard';

export const DeliveryBoyDashboard: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuthStore();
  const { metrics, loading, refreshing, error, refresh } = useDashboardData();

  const orders = metrics?.recentOrders || [];
  const pendingDeliveries = orders.filter((o) => o.status !== 'COMPLETED' && o.status !== 'DELIVERED');
  const completedDeliveries = orders.filter((o) => o.status === 'COMPLETED' || o.status === 'DELIVERED');

  const handleUpdateStatus = (orderId: string | number) => {
    Alert.alert('Update Delivery Status', 'Mark this delivery order as Completed/Delivered?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Delivered',
        onPress: async () => {
          try {
            await OrderService.updateOrderStatus(orderId, 'DELIVERED');
            Alert.alert('Success', 'Order marked as DELIVERED in live system.');
            refresh();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to update order status');
          }
        },
      },
    ]);
  };

  if (loading && !metrics) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Delivery Portal" subtitle="Rider Logistics" />
        <DashboardSkeleton />
      </ScreenContainer>
    );
  }

  if (error && !metrics) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Delivery Portal" />
        <ErrorState message={error} onRetry={refresh} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={true} refreshing={refreshing} onRefresh={refresh}>
      <Header
        title="Rider Deliveries"
        subtitle={`Driver: ${user?.name || user?.email?.split('@')[0] || 'Driver'}`}
      />

      <ExecutiveProfileCard />

      <View style={styles.metricsGrid}>
        <MetricCard
          title="Assigned Queue"
          value={pendingDeliveries.length}
          icon={<Truck size={18} color={theme.colors.warning} />}
        />
        <MetricCard
          title="Completed Today"
          value={completedDeliveries.length}
          icon={<CheckCircle size={18} color={theme.colors.success} />}
        />
      </View>

      <View style={styles.section}>
        <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginBottom: 8 }]}>
          Pending Customer Deliveries
        </Text>
        {pendingDeliveries.length > 0 ? (
          pendingDeliveries.map((ord) => (
            <Card key={ord.id} style={styles.deliveryCard}>
              <View style={styles.cardHeader}>
                <Text style={[theme.typography.subtitle1, { color: theme.colors.textPrimary }]}>
                  Order #{ord.order_number || ord.id}
                </Text>
                <Badge label={ord.status || 'PENDING'} variant="warning" size="sm" />
              </View>

              <View style={styles.detailRow}>
                <MapPin size={16} color={theme.colors.primary} style={styles.icon} />
                <Text style={[theme.typography.body2, { color: theme.colors.textSecondary, flex: 1 }]}>
                  {ord.customer_name ? `Customer: ${ord.customer_name}` : 'Main Outlet Address'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Navigation size={16} color={theme.colors.accent} style={styles.icon} />
                <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>
                  Amount COD: ₹{parseFloat(String(ord.total_amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleUpdateStatus(ord.id)}
                style={[styles.statusBtn, { backgroundColor: theme.colors.success }]}
                activeOpacity={0.8}
              >
                <CheckCircle size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={[theme.typography.button, { color: '#FFFFFF' }]}>Mark Delivered</Text>
              </TouchableOpacity>
            </Card>
          ))
        ) : (
          <EmptyState title="No Pending Deliveries" description="All assigned deliveries have been fulfilled." />
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
  deliveryCard: {
    marginVertical: 6,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  icon: {
    marginRight: 8,
  },
  statusBtn: {
    height: 40,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
});
