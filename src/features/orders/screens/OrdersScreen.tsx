import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Header } from '../../../components/common/Header';
import { OrderCard } from '../../../components/cards/OrderCard';
import { TextField } from '../../../components/inputs/TextField';
import { Badge } from '../../../components/common/Badge';
import { Card } from '../../../components/common/Card';
import { OrderService, Order } from '../services/orderService';
import { DashboardSkeleton } from '../../../components/skeletons/SkeletonLoader';
import { EmptyState, ErrorState } from '../../../components/common/States';
import { useTheme } from '../../../theme/theme';
import {
  ShoppingBag,
  Search,
  X,
  IndianRupee,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  User,
  MapPin,
  CreditCard,
} from 'lucide-react-native';

const STATUS_FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'PROCESSING', label: 'Processing' },
  { id: 'DELIVERED', label: 'Delivered' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

export const OrdersScreen: React.FC = () => {
  const theme = useTheme();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(false);

  const fetchOrders = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await OrderService.getOrders();
      setAllOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders from backend');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOpenDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailVisible(true);
  };

  const STATUS_CYCLE = ['PENDING', 'PROCESSING', 'DELIVERED', 'COMPLETED'];

  const handleUpdateStatus = async (order: Order) => {
    const currentIdx = STATUS_CYCLE.indexOf((order.status || '').toUpperCase());
    const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];

    Alert.alert(
      'Update Order Status',
      `Change status to "${nextStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setUpdatingStatus(true);
            try {
              const updated = await OrderService.updateOrderStatus(order.id, nextStatus);
              setAllOrders((prev) =>
                prev.map((o) => (o.id === order.id ? { ...o, status: updated.status || nextStatus } : o))
              );
              setSelectedOrder((prev) => prev ? { ...prev, status: updated.status || nextStatus } : prev);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to update status');
            } finally {
              setUpdatingStatus(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteOrder = async (order: Order) => {
    Alert.alert(
      'Delete Order',
      `Permanently delete Order #${order.order_number || order.id}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingOrder(true);
            try {
              await OrderService.deleteOrder(order.id);
              setAllOrders((prev) => prev.filter((o) => o.id !== order.id));
              setDetailVisible(false);
              setSelectedOrder(null);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete order');
            } finally {
              setDeletingOrder(false);
            }
          },
        },
      ]
    );
  };


  // Filter orders by active status chip and search query
  const filteredOrders = allOrders.filter((ord) => {
    const matchesFilter =
      activeFilter === 'ALL' || (ord.status || '').toUpperCase() === activeFilter.toUpperCase();

    const matchesSearch =
      !searchQuery.trim() ||
      String(ord.id).includes(searchQuery) ||
      (ord.order_number && ord.order_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ord.customer_name && ord.customer_name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  // Calculate live counts for each filter chip
  const getFilterCount = (statusId: string) => {
    if (statusId === 'ALL') return allOrders.length;
    return allOrders.filter((o) => (o.status || '').toUpperCase() === statusId.toUpperCase()).length;
  };

  // Financial summary
  const totalVolume = allOrders.reduce((sum, o) => sum + parseFloat(String(o.total_amount || 0)), 0);
  const pendingCount = allOrders.filter((o) => (o.status || '').toUpperCase() === 'PENDING').length;

  const c = theme.colors;

  return (
    <View style={styles.root}>
      <ScreenContainer scrollable={true} refreshing={refreshing} onRefresh={() => fetchOrders(true)}>
        <Header title="Orders Register" subtitle="Real-time E-Commerce Transaction Log" />

        {/* ── Financial Metrics Summary ─────────────────────────────── */}
        <View style={styles.metricsRow}>
          <Card style={[styles.metricCard, { backgroundColor: c.primaryLight }]}>
            <Text style={[styles.metricLabel, { color: c.primary }]}>Total Volume</Text>
            <Text style={[styles.metricValue, { color: c.primary }]}>
              ₹{totalVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </Card>

          <Card style={[styles.metricCard, { backgroundColor: pendingCount > 0 ? c.warningLight : c.successLight }]}>
            <Text style={[styles.metricLabel, { color: pendingCount > 0 ? c.warning : c.success }]}>
              {pendingCount > 0 ? 'Pending Dispatch' : 'Orders Current'}
            </Text>
            <Text style={[styles.metricValue, { color: pendingCount > 0 ? c.warning : c.success }]}>
              {pendingCount} Orders
            </Text>
          </Card>
        </View>

        {/* ── Search Bar ────────────────────────────────────────────── */}
        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : '#F1F5F9', borderColor: c.border }]}>
          <Search size={18} color={c.textMuted} />
          <TextInput
            placeholder="Search by Order # or Customer Name..."
            placeholderTextColor={c.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: c.textPrimary }]}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={c.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── Status Filter Chips with Dynamic Counts ───────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {STATUS_FILTERS.map((st) => {
            const isSelected = activeFilter === st.id;
            const count = getFilterCount(st.id);
            return (
              <TouchableOpacity
                key={st.id}
                onPress={() => setActiveFilter(st.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? c.primary : c.surfaceSecondary,
                    borderColor: isSelected ? c.primary : c.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSelected ? '#FFFFFF' : c.textSecondary },
                  ]}
                >
                  {st.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Orders List ───────────────────────────────────────────── */}
        {loading && !refreshing ? (
          <DashboardSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchOrders()} />
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            title="No Orders Found"
            description={
              searchQuery
                ? `No orders matching "${searchQuery}".`
                : activeFilter === 'ALL'
                ? 'No purchase orders recorded yet.'
                : `No orders currently marked as "${activeFilter}".`
            }
          />
        ) : (
          filteredOrders.map((ord) => (
            <OrderCard key={ord.id} order={ord} onPress={() => handleOpenDetail(ord)} />
          ))
        )}
      </ScreenContainer>

      {/* ── Order Detail Modal ──────────────────────────────────────── */}
      <Modal
        visible={detailVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.detailSheet, { backgroundColor: theme.isDark ? c.surface : '#FFFFFF', borderColor: c.border }]}>
            {selectedOrder && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={[theme.typography.h3, { color: c.textPrimary }]}>
                      Order #{selectedOrder.order_number || selectedOrder.id}
                    </Text>
                    <Text style={[theme.typography.caption, { color: c.textMuted }]}>
                      Transaction Invoice & Dispatch Log
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setDetailVisible(false)} style={styles.closeBtn}>
                    <X size={20} color={c.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Total Box */}
                <View style={[styles.amountBox, { backgroundColor: c.primaryLight }]}>
                  <Text style={[styles.amountLabel, { color: c.primary }]}>Total Invoice Value</Text>
                  <Text style={[styles.amountValue, { color: c.primary }]}>
                    ₹{parseFloat(String(selectedOrder.total_amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </View>

                {/* Order Status & Metadata */}
                <View style={styles.detailRows}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: c.textMuted }]}>Order Status:</Text>
                    <Badge label={selectedOrder.status || 'PENDING'} variant="primary" />
                  </View>

                  {selectedOrder.customer_name && (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: c.textMuted }]}>Customer:</Text>
                      <Text style={[styles.detailVal, { color: c.textPrimary }]}>{selectedOrder.customer_name}</Text>
                    </View>
                  )}

                  {selectedOrder.customer_phone && (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: c.textMuted }]}>Phone Contact:</Text>
                      <Text style={[styles.detailVal, { color: c.textPrimary }]}>{selectedOrder.customer_phone}</Text>
                    </View>
                  )}

                  {selectedOrder.shipping_address && (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: c.textMuted }]}>Delivery Address:</Text>
                      <Text style={[styles.detailVal, { color: c.textPrimary, flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                        {selectedOrder.shipping_address}
                      </Text>
                    </View>
                  )}

                  {selectedOrder.created_at && (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: c.textMuted }]}>Order Placed:</Text>
                      <Text style={[styles.detailVal, { color: c.textPrimary }]}>
                        {new Date(selectedOrder.created_at).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: c.textMuted }]}>Payment:</Text>
                    <Text style={[styles.detailVal, { color: c.textPrimary }]}>
                      {selectedOrder.payment_method || 'CASH'} · {(selectedOrder.payment_status || 'PENDING').toUpperCase()}
                    </Text>
                  </View>

                  {selectedOrder.branch_name ? (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: c.textMuted }]}>Branch Outlet:</Text>
                      <Text style={[styles.detailVal, { color: c.textPrimary }]}>{selectedOrder.branch_name}</Text>
                    </View>
                  ) : null}

                  {selectedOrder.notes ? (
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: c.textMuted }]}>Instructions:</Text>
                      <Text style={[styles.detailVal, { color: c.textPrimary, flex: 1, textAlign: 'right' }]}>{selectedOrder.notes}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Items List (if available) */}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <View style={styles.itemsSection}>
                    <Text style={[styles.itemsSectionTitle, { color: c.textPrimary }]}>Purchased Items</Text>
                    {selectedOrder.items.map((it, idx) => (
                      <View key={idx} style={[styles.itemRow, { borderBottomColor: c.border }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.itemName, { color: c.textPrimary }]}>{it.product_name}</Text>
                          <Text style={[styles.itemQty, { color: c.textMuted }]}>Qty: {it.quantity}</Text>
                        </View>
                        <Text style={[styles.itemPrice, { color: c.primary }]}>
                          ₹{parseFloat(String(it.price || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}

            {/* Status Update & Delete Actions */}
            {selectedOrder && (
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => handleUpdateStatus(selectedOrder)}
                  disabled={updatingStatus}
                  style={[
                    styles.statusBtn,
                    { backgroundColor: theme.colors.primaryLight, opacity: updatingStatus ? 0.6 : 1 },
                  ]}
                  activeOpacity={0.8}
                >
                  <CheckCircle size={16} color={theme.colors.primary} />
                  <Text style={[styles.statusBtnText, { color: theme.colors.primary }]}>
                    {updatingStatus ? 'Updating...' : 'Advance Status'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDeleteOrder(selectedOrder)}
                  disabled={deletingOrder}
                  style={[
                    styles.deleteBtn,
                    { backgroundColor: '#FEE2E2', opacity: deletingOrder ? 0.6 : 1 },
                  ]}
                  activeOpacity={0.8}
                >
                  <AlertCircle size={16} color="#DC2626" />
                  <Text style={[styles.statusBtnText, { color: '#DC2626' }]}>
                    {deletingOrder ? 'Deleting...' : 'Cancel Order'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  metricCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    marginVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  filterScroll: {
    flexGrow: 0,
    height: 38,
    marginBottom: 12,
  },
  filterContent: {
    gap: 8,
    alignItems: 'center',
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  detailSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    padding: 22,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  closeBtn: {
    padding: 4,
  },
  amountBox: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
  },
  detailRows: {
    gap: 8,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  itemsSection: {
    marginTop: 10,
  },
  itemsSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
  },
  itemQty: {
    fontSize: 11,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  statusBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  statusBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
