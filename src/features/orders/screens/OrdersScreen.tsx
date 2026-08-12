import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Header } from '../../../components/common/Header';
import { OrderCard } from '../../../components/cards/OrderCard';
import { TextField } from '../../../components/inputs/TextField';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { Badge } from '../../../components/common/Badge';
import { Card } from '../../../components/common/Card';
import { OrderService, Order, OrderItem } from '../services/orderService';
import { DashboardSkeleton } from '../../../components/skeletons/SkeletonLoader';
import { EmptyState, ErrorState } from '../../../components/common/States';
import { useTheme } from '../../../theme/theme';
import { resolveMediaUrl } from '../../../utils/mediaUrl';
import {
  ShoppingBag,
  Search,
  X,
  Plus,
  IndianRupee,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  User,
  MapPin,
  CreditCard,
  FileText,
  ExternalLink,
  ChevronRight,
  Trash2,
  Edit3,
  Phone,
  Mail,
  ShieldAlert,
  ArrowRight,
  Package,
} from 'lucide-react-native';

const STATUS_FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'PROCESSING', label: 'Processing' },
  { id: 'DELIVERED', label: 'Delivered' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

const VALID_STATUSES: { id: string; label: string; icon: any; color: string; desc: string }[] = [
  { id: 'PENDING', label: 'Pending', icon: Clock, color: '#F59E0B', desc: 'Order received & pending verification' },
  { id: 'PROCESSING', label: 'Processing', icon: Package, color: '#3B82F6', desc: 'Order being packed & prepared' },
  { id: 'DELIVERED', label: 'Delivered', icon: Truck, color: '#10B981', desc: 'Order shipped & out for delivery' },
  { id: 'COMPLETED', label: 'Completed', icon: CheckCircle, color: '#059669', desc: 'Order fulfilled & customer verified' },
  { id: 'CANCELLED', label: 'Cancelled', icon: AlertCircle, color: '#EF4444', desc: 'Order voided or returned' },
];

export const OrdersScreen: React.FC = () => {
  const theme = useTheme();
  const c = theme.colors;

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  // Advanced Status Update Modal State
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Create Order Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [shippingAddr, setShippingAddr] = useState('');
  const [orderAmount, setOrderAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(false);

  const fetchOrders = useCallback(async (isRefresh = false) => {
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
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleOpenDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailVisible(true);
  };

  const handleOpenStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setTargetStatus((order.status || 'PENDING').toUpperCase());
    setStatusError(null);
    setStatusModalVisible(true);
  };

  const handleApplyStatusChange = async (newStatus: string) => {
    if (!selectedOrder) return;
    setTargetStatus(newStatus);
    setUpdatingStatus(true);
    setStatusError(null);

    try {
      const updated = await OrderService.updateOrderStatus(selectedOrder.id, newStatus);
      const finalStatus = updated.status || newStatus;

      setAllOrders((prev) =>
        prev.map((o) => (o.id === selectedOrder.id ? { ...o, status: finalStatus } : o))
      );
      setSelectedOrder((prev) => (prev ? { ...prev, status: finalStatus } : prev));
      setStatusModalVisible(false);
      Alert.alert('Status Updated', `Order #${selectedOrder.order_number || selectedOrder.id} is now ${finalStatus}.`);
    } catch (err: any) {
      const errMsg = err.message || 'Failed to update order status';
      setStatusError(`Status update failed: ${errMsg}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!custName.trim() || !orderAmount.trim()) {
      Alert.alert('Required', 'Please enter customer name and total amount.');
      return;
    }

    setCreatingOrder(true);
    try {
      const created = await OrderService.createOrder({
        customer_name: custName,
        customer_phone: custPhone,
        customer_email: custEmail,
        shipping_address: shippingAddr,
        total_amount: parseFloat(orderAmount),
        payment_method: payMethod,
        payment_status: 'PAID',
        status: 'PENDING',
      });
      setAllOrders((prev) => [created, ...prev]);
      Alert.alert('Success', `Order #${created.order_number || created.id} created successfully.`);
      setAddModalVisible(false);
      setCustName('');
      setCustPhone('');
      setCustEmail('');
      setShippingAddr('');
      setOrderAmount('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create order');
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    Alert.alert(
      'Delete Order',
      `Permanently delete Order #${order.order_number || order.id}? This action cannot be undone.`,
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

  const handleOpenPdf = (id: number | string) => {
    const pdfUrl = OrderService.getInvoicePdfUrl(id);
    Linking.openURL(pdfUrl).catch(() => {
      Alert.alert('Invoice PDF', `Downloading invoice PDF for Order #${id}...`);
    });
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

  const getFilterCount = (statusId: string) => {
    if (statusId === 'ALL') return allOrders.length;
    return allOrders.filter((o) => (o.status || '').toUpperCase() === statusId.toUpperCase()).length;
  };

  const getStatusVariant = (s?: string): 'success' | 'warning' | 'error' | 'primary' => {
    const upper = (s || '').toUpperCase();
    if (upper === 'COMPLETED' || upper === 'DELIVERED') return 'success';
    if (upper === 'PENDING') return 'warning';
    if (upper === 'CANCELLED') return 'error';
    return 'primary';
  };

  // Financial summary
  const totalVolume = allOrders.reduce((sum, o) => sum + parseFloat(String(o.total_amount || 0)), 0);
  const pendingCount = allOrders.filter((o) => (o.status || '').toUpperCase() === 'PENDING').length;
  const processingCount = allOrders.filter((o) => (o.status || '').toUpperCase() === 'PROCESSING').length;
  const completedCount = allOrders.filter((o) => ['COMPLETED', 'DELIVERED'].includes((o.status || '').toUpperCase())).length;

  if (loading && !refreshing) {
    return (
      <View style={styles.root}>
        <ScreenContainer scrollable={false}>
          <Header title="Orders Register" subtitle="Enterprise Order Management" />
          <DashboardSkeleton />
        </ScreenContainer>
      </View>
    );
  }

  if (error && !allOrders.length) {
    return (
      <View style={styles.root}>
        <ScreenContainer scrollable={false}>
          <Header title="Orders Register" subtitle="Enterprise Order Management" />
          <ErrorState message={error} onRetry={() => fetchOrders(true)} />
        </ScreenContainer>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenContainer scrollable={true} refreshing={refreshing} onRefresh={() => fetchOrders(true)}>
        <Header
          title="Orders Register"
          subtitle="Real-time E-Commerce Transaction Log"
          rightAction={
            <TouchableOpacity
              onPress={() => setAddModalVisible(true)}
              style={[styles.addBtn, { backgroundColor: c.primary }]}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.addBtnText}>New Order</Text>
            </TouchableOpacity>
          }
        />

        {/* ── Financial Metrics Summary ─────────────────────────────── */}
        <View style={styles.metricsRow}>
          <Card style={[styles.metricCard, { backgroundColor: c.primaryLight }]}>
            <Text style={[styles.metricLabel, { color: c.primary }]}>Total Volume</Text>
            <Text style={[styles.metricValue, { color: c.primary }]}>
              ₹{totalVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </Card>

          <Card style={[styles.metricCard, { backgroundColor: pendingCount > 0 ? 'rgba(245,158,11,0.12)' : c.successLight }]}>
            <Text style={[styles.metricLabel, { color: pendingCount > 0 ? c.warning : c.success }]}>
              {pendingCount > 0 ? 'Pending' : 'Orders Current'}
            </Text>
            <Text style={[styles.metricValue, { color: pendingCount > 0 ? c.warning : c.success }]}>
              {pendingCount} Orders
            </Text>
          </Card>

          <Card style={[styles.metricCard, { backgroundColor: c.successLight }]}>
            <Text style={[styles.metricLabel, { color: c.success }]}>Fulfilled</Text>
            <Text style={[styles.metricValue, { color: c.success }]}>
              {completedCount} Orders
            </Text>
          </Card>
        </View>

        {/* ── Search Input ─────────────────────────────────────────── */}
        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : '#F1F5F9', borderColor: c.border }]}>
          <Search size={16} color={c.textMuted} />
          <TextInput
            placeholder="Search orders by ID, Order # or Customer..."
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

        {/* ── Horizontal Status Filter Chips ───────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {STATUS_FILTERS.map((chip) => {
            const active = activeFilter === chip.id;
            const count = getFilterCount(chip.id);
            return (
              <TouchableOpacity
                key={chip.id}
                onPress={() => setActiveFilter(chip.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? c.primary : theme.isDark ? c.surfaceSecondary : '#F1F5F9',
                    borderColor: active ? c.primary : c.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, { color: active ? '#FFFFFF' : c.textSecondary }]}>
                  {chip.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Orders Feed List ─────────────────────────────────────── */}
        {filteredOrders.length === 0 ? (
          <EmptyState
            title="No Orders Found"
            description={
              searchQuery
                ? `No orders matching "${searchQuery}"`
                : activeFilter !== 'ALL'
                ? `No orders with status "${activeFilter}"`
                : 'Your store has no orders yet. Tap "New Order" to create one.'
            }
          />
        ) : (
          filteredOrders.map((order) => (
            <TouchableOpacity
              key={String(order.id)}
              onPress={() => handleOpenDetail(order)}
              activeOpacity={0.85}
            >
              <Card style={styles.orderCardItem}>
                <View style={styles.orderCardHeader}>
                  <View style={styles.orderNumberGroup}>
                    <View style={[styles.orderIconBg, { backgroundColor: c.primaryLight }]}>
                      <ShoppingBag size={18} color={c.primary} />
                    </View>
                    <View>
                      <Text style={[styles.orderNumberText, { color: c.textPrimary }]}>
                        {order.order_number || `ORD-${order.id}`}
                      </Text>
                      {order.created_at && (
                        <Text style={[styles.orderDateText, { color: c.textMuted }]}>
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.orderCardRight}>
                    <Text style={[styles.orderAmountText, { color: c.primary }]}>
                      ₹{parseFloat(String(order.total_amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                    <Badge label={order.status || 'PENDING'} variant={getStatusVariant(order.status)} size="sm" />
                  </View>
                </View>

                <View style={[styles.cardDivider, { backgroundColor: c.border }]} />

                <View style={styles.orderCardFooter}>
                  <View style={styles.customerInfoGroup}>
                    <User size={13} color={c.textMuted} />
                    <Text style={[styles.customerNameText, { color: c.textSecondary }]} numberOfLines={1}>
                      {order.customer_name || 'Guest Customer'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleOpenStatusModal(order)}
                    style={[styles.updateStatusBtn, { backgroundColor: c.primaryLight }]}
                  >
                    <Edit3 size={12} color={c.primary} />
                    <Text style={[styles.updateStatusBtnText, { color: c.primary }]}>Update Status</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScreenContainer>

      {/* ── 1. Order Detail Modal ────────────────────────────────────── */}
      <Modal visible={detailVisible} animationType="slide" transparent onRequestClose={() => setDetailVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : '#FFFFFF', borderColor: c.border }]}>
            {selectedOrder && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.modalHeaderRow}>
                  <View>
                    <Text style={[styles.modalTitle, { color: c.textPrimary }]}>
                      {selectedOrder.order_number || `ORD-${selectedOrder.id}`}
                    </Text>
                    <Text style={[styles.modalSub, { color: c.textMuted }]}>
                      Placed on {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString('en-IN') : 'N/A'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setDetailVisible(false)} style={styles.closeBtn}>
                    <X size={22} color={c.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Amount Banner */}
                <View style={[styles.amountBanner, { backgroundColor: c.primaryLight }]}>
                  <View>
                    <Text style={[styles.amountBannerLabel, { color: c.primary }]}>Total Amount</Text>
                    <Text style={[styles.amountBannerVal, { color: c.primary }]}>
                      ₹{parseFloat(String(selectedOrder.total_amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                  <Badge label={selectedOrder.status} variant={getStatusVariant(selectedOrder.status)} />
                </View>

                {/* Quick Action Bar */}
                <View style={styles.quickBar}>
                  <TouchableOpacity
                    style={[styles.quickBarBtn, { backgroundColor: c.primary }]}
                    onPress={() => handleOpenStatusModal(selectedOrder)}
                    activeOpacity={0.8}
                  >
                    <Edit3 size={14} color="#FFF" />
                    <Text style={styles.quickBarBtnText}>Change Status</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.quickBarBtn, { backgroundColor: c.surfaceSecondary, borderColor: c.border, borderWidth: 1 }]}
                    onPress={() => handleOpenPdf(selectedOrder.id)}
                    activeOpacity={0.8}
                  >
                    <FileText size={14} color={c.textPrimary} />
                    <Text style={[styles.quickBarBtnText, { color: c.textPrimary }]}>PDF Invoice</Text>
                  </TouchableOpacity>
                </View>

                {/* Customer Details */}
                <Card style={styles.detailSection}>
                  <Text style={[styles.sectionHeading, { color: c.textPrimary }]}>Customer Details</Text>
                  {selectedOrder.customer_name ? (
                    <View style={styles.detailItemRow}>
                      <User size={14} color={c.textMuted} />
                      <Text style={[styles.detailItemVal, { color: c.textPrimary }]}>{selectedOrder.customer_name}</Text>
                    </View>
                  ) : null}
                  {selectedOrder.customer_phone ? (
                    <View style={styles.detailItemRow}>
                      <Phone size={14} color={c.textMuted} />
                      <Text style={[styles.detailItemVal, { color: c.textPrimary }]}>{selectedOrder.customer_phone}</Text>
                    </View>
                  ) : null}
                  {selectedOrder.customer_email ? (
                    <View style={styles.detailItemRow}>
                      <Mail size={14} color={c.textMuted} />
                      <Text style={[styles.detailItemVal, { color: c.textPrimary }]}>{selectedOrder.customer_email}</Text>
                    </View>
                  ) : null}
                  {selectedOrder.shipping_address ? (
                    <View style={styles.detailItemRow}>
                      <MapPin size={14} color={c.textMuted} />
                      <Text style={[styles.detailItemVal, { color: c.textPrimary, flex: 1 }]}>{selectedOrder.shipping_address}</Text>
                    </View>
                  ) : null}
                </Card>

                {/* Order Items List */}
                <Card style={styles.detailSection}>
                  <Text style={[styles.sectionHeading, { color: c.textPrimary }]}>Order Items ({selectedOrder.items?.length || selectedOrder.items_count || 0})</Text>
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, idx) => (
                      <View key={String(item.id || idx)} style={styles.orderItemRow}>
                        <View style={[styles.orderItemBullet, { backgroundColor: c.primary }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.orderItemName, { color: c.textPrimary }]}>{item.product_name}</Text>
                          <Text style={[styles.orderItemQty, { color: c.textMuted }]}>
                            Qty: {item.quantity} × ₹{parseFloat(String(item.price || 0)).toLocaleString('en-IN')}
                          </Text>
                        </View>
                        <Text style={[styles.orderItemTotal, { color: c.textPrimary }]}>
                          ₹{parseFloat(String(item.total || item.quantity * Number(item.price || 0))).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={{ fontSize: 13, color: c.textMuted, fontStyle: 'italic' }}>No item details available for this order.</Text>
                  )}
                </Card>

                {/* Payment & Logistics */}
                <Card style={styles.detailSection}>
                  <Text style={[styles.sectionHeading, { color: c.textPrimary }]}>Payment & Delivery</Text>
                  <View style={styles.metaPairRow}>
                    <Text style={[styles.metaPairLabel, { color: c.textMuted }]}>Payment Method:</Text>
                    <Text style={[styles.metaPairVal, { color: c.textPrimary }]}>{selectedOrder.payment_method || 'CASH'}</Text>
                  </View>
                  <View style={styles.metaPairRow}>
                    <Text style={[styles.metaPairLabel, { color: c.textMuted }]}>Payment Status:</Text>
                    <Badge label={selectedOrder.payment_status || 'PAID'} variant={selectedOrder.payment_status === 'PAID' ? 'success' : 'warning'} size="sm" />
                  </View>
                  {selectedOrder.branch_name ? (
                    <View style={styles.metaPairRow}>
                      <Text style={[styles.metaPairLabel, { color: c.textMuted }]}>Branch:</Text>
                      <Text style={[styles.metaPairVal, { color: c.textPrimary }]}>{selectedOrder.branch_name}</Text>
                    </View>
                  ) : null}
                </Card>

                {/* Delete Order Button */}
                <TouchableOpacity
                  style={[styles.deleteBtn, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: c.error + '44' }]}
                  onPress={() => handleDeleteOrder(selectedOrder)}
                  activeOpacity={0.8}
                >
                  <Trash2 size={15} color={c.error} />
                  <Text style={[styles.deleteBtnText, { color: c.error }]}>Delete Order</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── 2. Advanced Status Update Sheet Modal ────────────────────────────── */}
      <Modal visible={statusModalVisible} animationType="slide" transparent onRequestClose={() => setStatusModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : '#FFFFFF', borderColor: c.border }]}>
            {selectedOrder && (
              <>
                <View style={styles.modalHeaderRow}>
                  <View>
                    <Text style={[styles.modalTitle, { color: c.textPrimary }]}>Update Order Status</Text>
                    <Text style={[styles.modalSub, { color: c.textMuted }]}>Order #{selectedOrder.order_number || selectedOrder.id}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setStatusModalVisible(false)} style={styles.closeBtn}>
                    <X size={22} color={c.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Status Diagnostic Error Alert Banner */}
                {statusError && (
                  <View style={[styles.errorBanner, { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: c.error }]}>
                    <ShieldAlert size={18} color={c.error} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.errorBannerTitle, { color: c.error }]}>Status Transition Error</Text>
                      <Text style={[styles.errorBannerMsg, { color: c.error }]}>{statusError}</Text>
                    </View>
                  </View>
                )}

                <Text style={[styles.selectStatusLabel, { color: c.textSecondary }]}>Select New Status:</Text>

                <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                  {VALID_STATUSES.map((st) => {
                    const isCurrent = (selectedOrder.status || '').toUpperCase() === st.id;
                    const isTarget = targetStatus === st.id;
                    const Icon = st.icon;
                    return (
                      <TouchableOpacity
                        key={st.id}
                        onPress={() => handleApplyStatusChange(st.id)}
                        disabled={updatingStatus}
                        style={[
                          styles.statusOptionCard,
                          {
                            backgroundColor: isCurrent ? st.color + '18' : isTarget ? c.primaryLight : theme.isDark ? c.surfaceSecondary : '#F8FAFC',
                            borderColor: isCurrent ? st.color : isTarget ? c.primary : c.border,
                            borderWidth: isCurrent || isTarget ? 2 : 1,
                          },
                        ]}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.statusOptionIcon, { backgroundColor: st.color + '22' }]}>
                          <Icon size={18} color={st.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.statusOptionTitle, { color: c.textPrimary }]}>{st.label}</Text>
                            {isCurrent && <Badge label="CURRENT" variant="primary" size="sm" />}
                          </View>
                          <Text style={[styles.statusOptionDesc, { color: c.textMuted }]}>{st.desc}</Text>
                        </View>
                        {isTarget ? <CheckCircle size={18} color={c.primary} /> : <ChevronRight size={16} color={c.textMuted} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── 3. Create Order Modal ───────────────────────────────────────── */}
      <Modal visible={addModalVisible} animationType="slide" transparent onRequestClose={() => setAddModalVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : '#FFFFFF', borderColor: c.border }]}>
              <View style={styles.modalHeaderRow}>
                <Text style={[styles.modalTitle, { color: c.textPrimary }]}>Create Manual Order</Text>
                <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.closeBtn}>
                  <X size={22} color={c.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 100 }}>
                <TextField label="Customer Name *" placeholder="e.g. Rahul Sharma" value={custName} onChangeText={setCustName} />
                <TextField label="Customer Phone" placeholder="e.g. +91 98765 43210" value={custPhone} onChangeText={setCustPhone} keyboardType="phone-pad" />
                <TextField label="Customer Email" placeholder="e.g. rahul@example.com" value={custEmail} onChangeText={setCustEmail} keyboardType="email-address" />
                <TextField label="Shipping Address" placeholder="Door No, Street, City, Pincode" value={shippingAddr} onChangeText={setShippingAddr} multiline />
                <TextField label="Total Amount (₹) *" placeholder="e.g. 1250.00" value={orderAmount} onChangeText={setOrderAmount} keyboardType="decimal-pad" />

                <Text style={[styles.selectStatusLabel, { color: c.textSecondary, marginTop: 12 }]}>Payment Method:</Text>
                <View style={styles.payMethodRow}>
                  {(['CASH', 'UPI', 'CARD'] as const).map((m) => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setPayMethod(m)}
                      style={[
                        styles.payMethodChip,
                        {
                          backgroundColor: payMethod === m ? c.primary : theme.isDark ? c.surfaceSecondary : '#F1F5F9',
                          borderColor: payMethod === m ? c.primary : c.border,
                        },
                      ]}
                    >
                      <Text style={[styles.payMethodText, { color: payMethod === m ? '#FFF' : c.textSecondary }]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <PrimaryButton title="Create & Issue Order" onPress={handleCreateOrder} loading={creatingOrder} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, gap: 4 },
  addBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  metricsRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  metricCard: { flex: 1, padding: 10, alignItems: 'center', gap: 2 },
  metricLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', textAlign: 'center' },
  metricValue: { fontSize: 13, fontWeight: '800' },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, height: 44, marginBottom: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 13 },
  filterScroll: { marginBottom: 8 },
  filterContent: { gap: 6 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontSize: 11, fontWeight: '700' },
  orderCardItem: { marginVertical: 4, padding: 12 },
  orderCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumberGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderIconBg: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  orderNumberText: { fontSize: 13, fontWeight: '700' },
  orderDateText: { fontSize: 10, marginTop: 1 },
  orderCardRight: { alignItems: 'flex-end', gap: 3 },
  orderAmountText: { fontSize: 14, fontWeight: '800' },
  cardDivider: { height: StyleSheet.hairlineWidth, marginVertical: 10 },
  orderCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  customerInfoGroup: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  customerNameText: { fontSize: 12, fontWeight: '500' },
  updateStatusBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 4 },
  updateStatusBtnText: { fontSize: 10, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, padding: 20, maxHeight: '88%' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalSub: { fontSize: 11, marginTop: 2 },
  closeBtn: { padding: 4 },
  amountBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 12 },
  amountBannerLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  amountBannerVal: { fontSize: 24, fontWeight: '800' },
  quickBar: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  quickBarBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, gap: 6 },
  quickBarBtnText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  detailSection: { padding: 12, marginVertical: 4 },
  sectionHeading: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  detailItemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  detailItemVal: { fontSize: 12, fontWeight: '600' },
  orderItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(148,163,184,0.15)', gap: 8 },
  orderItemBullet: { width: 6, height: 6, borderRadius: 3 },
  orderItemName: { fontSize: 12, fontWeight: '700' },
  orderItemQty: { fontSize: 10, marginTop: 1 },
  orderItemTotal: { fontSize: 12, fontWeight: '700' },
  metaPairRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  metaPairLabel: { fontSize: 12, fontWeight: '500' },
  metaPairVal: { fontSize: 12, fontWeight: '700' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginTop: 14, gap: 6 },
  deleteBtnText: { fontSize: 13, fontWeight: '700' },
  errorBanner: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12, gap: 8 },
  errorBannerTitle: { fontSize: 12, fontWeight: '700' },
  errorBannerMsg: { fontSize: 11, marginTop: 2, lineHeight: 16 },
  selectStatusLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 },
  statusOptionCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, marginVertical: 4, gap: 10 },
  statusOptionIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  statusOptionTitle: { fontSize: 13, fontWeight: '700' },
  statusOptionDesc: { fontSize: 10, marginTop: 1 },
  payMethodRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  payMethodChip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  payMethodText: { fontSize: 12, fontWeight: '700' },
});
