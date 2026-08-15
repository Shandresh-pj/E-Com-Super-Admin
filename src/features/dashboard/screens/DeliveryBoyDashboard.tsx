import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
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
import {
  Truck,
  MapPin,
  Phone,
  CheckCircle,
  Navigation,
  KeyRound,
  X,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';
import { ExecutiveProfileCard } from '../../../components/cards/ExecutiveProfileCard';

export const DeliveryBoyDashboard: React.FC = () => {
  const theme = useTheme();
  const c = theme.colors;
  const { user } = useAuthStore();
  const { metrics, loading, refreshing, error, refresh } = useDashboardData();

  // OTP Verification Modal State
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | number | null>(null);
  const [deliveryPin, setDeliveryPin] = useState('');
  const [verifying, setVerifying] = useState(false);

  const orders = metrics?.recentOrders || [];
  const pendingDeliveries = orders.filter((o) => o.status !== 'COMPLETED' && o.status !== 'DELIVERED');
  const completedDeliveries = orders.filter((o) => o.status === 'COMPLETED' || o.status === 'DELIVERED');

  const handleStartNavigation = (address?: string) => {
    if (!address) {
      Alert.alert('No Address', 'This order does not have a valid delivery destination address.');
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Navigation Error', 'Could not open maps application.');
    });
  };

  const handleCallCustomer = (phone?: string) => {
    if (!phone) {
      Alert.alert('No Phone', 'No contact phone number provided for this customer.');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Call Error', 'Could not start phone dialer.');
    });
  };

  const openOtpModal = (orderId: string | number) => {
    setSelectedOrderId(orderId);
    setDeliveryPin('');
    setOtpModalVisible(true);
  };

  const handleConfirmOtpDelivery = async () => {
    if (!selectedOrderId) return;
    setVerifying(true);
    try {
      await OrderService.updateOrderStatus(selectedOrderId, 'DELIVERED');
      setOtpModalVisible(false);
      Alert.alert('Delivery Confirmed', 'Parcel successfully marked as DELIVERED in central live system.');
      refresh();
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message || 'Failed to update order status');
    } finally {
      setVerifying(false);
    }
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
          Pending Customer Deliveries ({pendingDeliveries.length})
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
                  {ord.shipping_address || ord.customer_name ? `${ord.customer_name || ''} - ${ord.shipping_address || 'Outlet Address'}` : 'Main Outlet Address'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Navigation size={16} color={theme.colors.accent} style={styles.icon} />
                <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>
                  Amount COD: ₹{parseFloat(String(ord.total_amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>

              {/* Rider Quick Action Row */}
              <View style={styles.riderActionsRow}>
                <TouchableOpacity
                  onPress={() => handleStartNavigation(ord.shipping_address || ord.customer_name)}
                  style={[styles.actionChip, { backgroundColor: theme.isDark ? '#1E293B' : '#EEF2FF', borderColor: c.primary }]}
                  activeOpacity={0.7}
                >
                  <Navigation size={14} color={c.primary} style={{ marginRight: 4 }} />
                  <Text style={[styles.actionChipText, { color: c.primary }]}>GPS Map</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleCallCustomer(ord.customer_phone)}
                  style={[styles.actionChip, { backgroundColor: theme.isDark ? '#1E293B' : '#ECFDF5', borderColor: '#10B981' }]}
                  activeOpacity={0.7}
                >
                  <Phone size={14} color="#10B981" style={{ marginRight: 4 }} />
                  <Text style={[styles.actionChipText, { color: '#10B981' }]}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => openOtpModal(ord.id)}
                  style={[styles.deliverBtn, { backgroundColor: '#10B981' }]}
                  activeOpacity={0.85}
                >
                  <CheckCircle size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.deliverBtnText}>Verify & Drop</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        ) : (
          <EmptyState title="No Pending Deliveries" description="All assigned deliveries have been fulfilled." />
        )}
      </View>

      {/* ── OTP Delivery Verification Modal ──────────────────────────── */}
      <Modal
        visible={otpModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOtpModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: theme.isDark ? '#0F172A' : '#FFFFFF',
                borderColor: theme.isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.modalHeaderTop}>
              <View style={styles.modalTitleRow}>
                <View style={styles.modalShieldIconBox}>
                  <ShieldCheck size={20} color="#10B981" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.modalSheetTitle, { color: c.textPrimary }]}>
                    Customer Delivery Verification
                  </Text>
                  <Text style={[styles.modalSheetSubtitle, { color: c.textMuted }]}>
                    Ask customer for 4-digit drop OTP code
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setOtpModalVisible(false)}
                  style={[styles.closeBtn, { backgroundColor: theme.isDark ? '#1E293B' : '#F1F5F9' }]}
                >
                  <X size={16} color={c.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.pinLabel, { color: c.textSecondary }]}>Enter Customer OTP PIN</Text>
              <TextInput
                value={deliveryPin}
                onChangeText={setDeliveryPin}
                placeholder="e.g. 4829"
                placeholderTextColor={c.textMuted}
                keyboardType="numeric"
                maxLength={6}
                style={[
                  styles.pinInput,
                  {
                    backgroundColor: theme.isDark ? '#1E293B' : '#F8FAFC',
                    borderColor: deliveryPin.length >= 4 ? '#10B981' : c.border,
                    color: c.textPrimary,
                  },
                ]}
                autoFocus
              />

              <TouchableOpacity
                onPress={handleConfirmOtpDelivery}
                disabled={verifying}
                style={[styles.confirmDropBtn, { backgroundColor: '#10B981' }]}
                activeOpacity={0.85}
              >
                {verifying ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.confirmDropBtnText}>Complete & Record Delivery</Text>
                    <ArrowRight size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderRadius: 18,
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
    marginVertical: 3,
  },
  icon: {
    marginRight: 8,
  },
  riderActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  deliverBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  deliverBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    padding: 20,
  },
  modalHeaderTop: {
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalShieldIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSheetTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  modalSheetSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    gap: 12,
    paddingBottom: 16,
  },
  pinLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  pinInput: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
  },
  confirmDropBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 6,
  },
  confirmDropBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
