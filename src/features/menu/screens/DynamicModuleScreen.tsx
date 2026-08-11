import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Header } from '../../../components/common/Header';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { TextField } from '../../../components/inputs/TextField';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { DashboardSkeleton } from '../../../components/skeletons/SkeletonLoader';
import { EmptyState, ErrorState } from '../../../components/common/States';
import { useTheme } from '../../../theme/theme';
import { axiosClient } from '../../../api/axiosClient';
import { normalizeApiResponse } from '../../../api/responseNormalizer';
import { getApiBaseUrl } from '../../../config/environment';

import { StockService, StockLogItem, StockChangeType } from '../../products/services/stockService';
import { DeliveryService, DeliveryTrackingRecord } from '../../orders/services/deliveryService';
import { OrderService, Order } from '../../orders/services/orderService';
import { ProductService, Product } from '../../products/services/productService';

import {
  Layers,
  Search,
  Plus,
  X,
  Activity,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  IndianRupee,
  Truck,
  FileText,
  CheckSquare,
  XCircle,
  Database,
  Tag,
  CreditCard,
  PieChart,
  MapPin,
  Calendar,
  AlertTriangle,
  Download,
} from 'lucide-react-native';

export const DynamicModuleScreen: React.FC = () => {
  const theme = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const moduleName = route.params?.title || 'System Console';
  const modulePath: string = route.params?.path || '/dashboard';
  const moduleCategory = route.params?.category || 'Enterprise Suite';

  const [records, setRecords] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add / Create Modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemValue, setItemValue] = useState('');
  const [selectedStockType, setSelectedStockType] = useState<StockChangeType>('ADDITION');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  // Determine domain mode based on modulePath
  const isStockDomain = modulePath.includes('stock');
  const isDeliveryDomain = modulePath.includes('delivery') || modulePath.includes('logistics') || modulePath.includes('tracking');
  const isInvoiceDomain = modulePath.includes('invoice');
  const isApprovalDomain = modulePath.includes('approval');
  const isProfitLossDomain = modulePath.includes('profit-loss');
  const isPaymentDomain = modulePath.includes('payment');

  const fetchModuleData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      if (isStockDomain) {
        const stockLogs = await StockService.getStockLogs();
        setRecords(stockLogs);
      } else if (isDeliveryDomain) {
        const deliveries = await DeliveryService.getAllDeliveries();
        setRecords(deliveries);
      } else if (isInvoiceDomain) {
        const orders = await OrderService.getOrders();
        setRecords(orders);
      } else if (isApprovalDomain) {
        const products = await ProductService.getProducts();
        const pending = products.filter((p) => p.approval_status === 'Pending Approval' || p.status === 'inactive');
        setRecords(pending.length > 0 ? pending : products.slice(0, 10));
      } else if (isProfitLossDomain) {
        const orders = await OrderService.getOrders();
        const products = await ProductService.getProducts();
        const totalSales = orders.reduce((sum, o) => sum + parseFloat(String(o.total_amount || 0)), 0);
        const totalCost = products.reduce((sum, p) => sum + (parseFloat(String(p.purchase_cost || 0)) * (p.stock || 1)), 0);
        const grossMargin = totalSales - totalCost;

        setRecords([
          { id: 1, title: 'Gross Revenue Volume', value: totalSales, description: 'All settled customer orders', status: 'ACTIVE' },
          { id: 2, title: 'Catalog COGS Value', value: totalCost, description: 'Total purchase expenditure', status: 'ACTIVE' },
          { id: 3, title: 'Net Operating Margin', value: grossMargin, description: 'Gross profit before overheads', status: grossMargin >= 0 ? 'PROFIT' : 'LOSS' },
        ]);
      } else if (isPaymentDomain) {
        const orders = await OrderService.getOrders();
        const payments = orders.map((o) => ({
          id: o.id,
          title: `Invoice #${o.order_number || o.id}`,
          name: o.customer_name || 'Counter Customer',
          value: o.total_amount,
          description: `Payment: ${o.payment_method || 'CASH'} · Status: ${(o.payment_status || 'PAID').toUpperCase()}`,
          status: (o.payment_status || 'PAID').toUpperCase(),
          created_at: o.created_at,
        }));
        setRecords(payments);
      } else {
        const cleanPath = modulePath.startsWith('/') ? modulePath : `/${modulePath}`;
        const response = await axiosClient.get(cleanPath);
        const normalized = normalizeApiResponse<any[]>(response.data);
        if (Array.isArray(normalized.data)) {
          setRecords(normalized.data);
        } else {
          setRecords([]);
        }
      }
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchModuleData();
  }, [modulePath]);

  const handleCreateRecord = async () => {
    if (!itemName.trim() && !selectedProductId) {
      Alert.alert('Required', 'Please fill in the record details.');
      return;
    }

    setSubmitting(true);
    try {
      if (isStockDomain) {
        await StockService.updateStock({
          productId: selectedProductId || 1,
          quantity: parseInt(itemValue || '1', 10),
          type: selectedStockType,
          reason: itemDescription || 'Console Manual Update',
        });
        Alert.alert('Success', 'Stock adjustment recorded successfully.');
      } else if (isDeliveryDomain) {
        await DeliveryService.startDelivery(selectedProductId || 1, undefined, itemDescription);
        Alert.alert('Success', 'Delivery tracking initiated.');
      } else {
        const cleanPath = modulePath.startsWith('/') ? modulePath : `/${modulePath}`;
        const payload = {
          name: itemName,
          title: itemName,
          description: itemDescription,
          value: itemValue ? parseFloat(itemValue) : 0,
          status: 'ACTIVE',
        };

        const response = await axiosClient.post(cleanPath, payload);
        const normalized = normalizeApiResponse<any>(response.data);
        const createdItem = normalized.data || {
          id: Date.now(),
          ...payload,
          created_at: new Date().toISOString(),
        };

        setRecords((prev) => [createdItem, ...prev]);
        Alert.alert('Success', `${moduleName} entry saved successfully.`);
      }

      setAddModalVisible(false);
      setItemName('');
      setItemDescription('');
      setItemValue('');
      fetchModuleData(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveProduct = async (prod: Product, isApproved: boolean) => {
    try {
      await ProductService.approveProduct(prod.id, isApproved ? 'Approved' : 'Rejected');
      Alert.alert('Action Completed', `Product marked as ${isApproved ? 'Approved' : 'Rejected'}.`);
      fetchModuleData(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update approval status');
    }
  };

  const handleOpenPdf = (orderId: string | number) => {
    const url = `${getApiBaseUrl()}/orders/invoice-pdf/${orderId}?theme=premium`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Invoice PDF', `Streaming invoice at: ${url}`);
    });
  };

  const filtered = records.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.name && String(r.name).toLowerCase().includes(q)) ||
      (r.title && String(r.title).toLowerCase().includes(q)) ||
      (r.order_number && String(r.order_number).toLowerCase().includes(q)) ||
      (r.product_name && String(r.product_name).toLowerCase().includes(q)) ||
      (r.code && String(r.code).toLowerCase().includes(q)) ||
      (r.status && String(r.status).toLowerCase().includes(q))
    );
  });

  const c = theme.colors;

  const getDomainIcon = () => {
    if (isStockDomain) return <Database size={18} color={c.primary} />;
    if (isDeliveryDomain) return <Truck size={18} color={c.accent} />;
    if (isInvoiceDomain) return <FileText size={18} color={c.gold} />;
    if (isApprovalDomain) return <CheckSquare size={18} color={c.success} />;
    if (isProfitLossDomain) return <PieChart size={18} color={c.cyan} />;
    if (isPaymentDomain) return <CreditCard size={18} color={c.primary} />;
    return <Layers size={18} color={c.primary} />;
  };

  return (
    <View style={styles.root}>
      <ScreenContainer scrollable={true} refreshing={refreshing} onRefresh={() => fetchModuleData(true)}>
        <Header
          title={moduleName}
          subtitle={`${moduleCategory} · Real-time Console`}
          showBack={true}
          onBackPress={() => navigation.goBack()}
          rightAction={
            !isProfitLossDomain ? (
              <TouchableOpacity
                onPress={() => setAddModalVisible(true)}
                style={[styles.addBtn, { backgroundColor: c.primary }]}
                activeOpacity={0.8}
              >
                <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.addBtnText}>{isStockDomain ? 'Adjust' : 'New'}</Text>
              </TouchableOpacity>
            ) : undefined
          }
        />

        {/* ── KPI Summary Cards ─────────────────────────────────────── */}
        <View style={styles.kpiRow}>
          <Card style={[styles.kpiCard, { backgroundColor: c.primaryLight }]}>
            <Text style={[styles.kpiLabel, { color: c.primary }]}>Total Entries</Text>
            <Text style={[styles.kpiValue, { color: c.primary }]}>{records.length}</Text>
          </Card>

          <Card style={[styles.kpiCard, { backgroundColor: c.successLight }]}>
            <Text style={[styles.kpiLabel, { color: c.success }]}>Active Status</Text>
            <Text style={[styles.kpiValue, { color: c.success }]}>
              {records.filter((r) => r.status === 'ACTIVE' || r.status === 'COMPLETED' || r.status === 'Approved' || r.isActive !== false).length}
            </Text>
          </Card>
        </View>

        {/* ── Search Bar ────────────────────────────────────────────── */}
        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : '#F1F5F9', borderColor: c.border }]}>
          <Search size={18} color={c.textMuted} />
          <TextInput
            placeholder={`Search ${moduleName}...`}
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

        {/* ── Records List ──────────────────────────────────────────── */}
        {loading && !refreshing ? (
          <DashboardSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchModuleData()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={`No ${moduleName} Records`}
            description="Tap the action button above to register an entry in this module."
          />
        ) : (
          filtered.map((item, idx) => (
            <TouchableOpacity
              key={item.id || idx}
              activeOpacity={0.7}
              onPress={() => setSelectedRecord(item)}
            >
              <Card style={styles.itemCard}>
                <View style={styles.itemRow}>
                  <View style={[styles.itemIconBox, { backgroundColor: c.primaryLight }]}>
                    {getDomainIcon()}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: c.textPrimary }]}>
                      {item.title || item.name || item.product_name || (item.order_number ? `Order #${item.order_number}` : `${moduleName} #${item.id}`)}
                    </Text>
                    <Text style={[styles.itemDesc, { color: c.textMuted }]}>
                      {item.description || item.reason || (item.customer_name ? `Customer: ${item.customer_name}` : `ID: ${item.id}`)}
                    </Text>
                  </View>

                  <View style={styles.itemRight}>
                    {(item.value !== undefined || item.total_amount !== undefined || item.price !== undefined) && (
                      <Text style={[styles.itemVal, { color: c.primary }]}>
                        ₹{parseFloat(String(item.value ?? item.total_amount ?? item.price ?? 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Text>
                    )}
                    <Badge
                      label={item.status || item.approval_status || (item.type || 'Active')}
                      variant={item.status === 'CANCELLED' || item.status === 'Rejected' ? 'error' : item.status === 'PENDING' ? 'warning' : 'primary'}
                      size="sm"
                    />
                  </View>
                </View>

                {/* Domain Specialized Fast Action Buttons */}
                {isInvoiceDomain && (
                  <TouchableOpacity
                    onPress={() => handleOpenPdf(item.id)}
                    style={[styles.fastActionBtn, { backgroundColor: c.primaryLight }]}
                    activeOpacity={0.8}
                  >
                    <Download size={14} color={c.primary} />
                    <Text style={[styles.fastActionText, { color: c.primary }]}>Stream PDF Invoice</Text>
                  </TouchableOpacity>
                )}

                {isApprovalDomain && item.approval_status === 'Pending Approval' && (
                  <View style={styles.approvalBtnRow}>
                    <TouchableOpacity
                      onPress={() => handleApproveProduct(item, true)}
                      style={[styles.approvalBtn, { backgroundColor: c.success }]}
                      activeOpacity={0.8}
                    >
                      <CheckCircle size={14} color="#FFFFFF" />
                      <Text style={styles.approvalBtnText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleApproveProduct(item, false)}
                      style={[styles.approvalBtn, { backgroundColor: c.error }]}
                      activeOpacity={0.8}
                    >
                      <XCircle size={14} color="#FFFFFF" />
                      <Text style={styles.approvalBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScreenContainer>

      {/* ── Add / Adjustment Modal ───────────────────────────────────── */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : '#FFFFFF', borderColor: c.border }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[theme.typography.h3, { color: c.textPrimary }]}>
                    {isStockDomain ? 'Stock Movement Adjustment' : isDeliveryDomain ? 'Start Dispatch Delivery' : `New ${moduleName}`}
                  </Text>
                  <Text style={[theme.typography.caption, { color: c.textMuted }]}>
                    {moduleCategory} Management
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.closeBtn}>
                  <X size={20} color={c.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 160 }}
              >
                {isStockDomain ? (
                  <>
                    <TextField label="Product ID *" placeholder="e.g. 1" value={selectedProductId} onChangeText={setSelectedProductId} keyboardType="numeric" />
                    <TextField label="Quantity to Adjust *" placeholder="e.g. 25" value={itemValue} onChangeText={setItemValue} keyboardType="numeric" />
                    <Text style={[styles.pickerLabel, { color: c.textSecondary }]}>Adjustment Type:</Text>
                    <View style={styles.typesRow}>
                      {(['ADDITION', 'DEDUCTION', 'AUDIT_ADJUSTMENT', 'RETURN'] as StockChangeType[]).map((t) => (
                        <TouchableOpacity
                          key={t}
                          onPress={() => setSelectedStockType(t)}
                          style={[
                            styles.typeChip,
                            {
                              backgroundColor: selectedStockType === t ? c.primary : c.surfaceSecondary,
                              borderColor: selectedStockType === t ? c.primary : c.border,
                            },
                          ]}
                        >
                          <Text style={[styles.typeChipText, { color: selectedStockType === t ? '#FFFFFF' : c.textSecondary }]}>
                            {t.replace('_', ' ')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TextField label="Audit Reason / Memo" placeholder="e.g. Supplier delivery verified" value={itemDescription} onChangeText={setItemDescription} />
                  </>
                ) : isDeliveryDomain ? (
                  <>
                    <TextField label="Order ID to Deliver *" placeholder="e.g. 10" value={selectedProductId} onChangeText={setSelectedProductId} keyboardType="numeric" />
                    <TextField label="Rider Notes / Instructions" placeholder="e.g. Fast priority delivery" value={itemDescription} onChangeText={setItemDescription} />
                  </>
                ) : (
                  <>
                    <TextField label="Entry Title / Name *" placeholder="e.g. Standard Record" value={itemName} onChangeText={setItemName} />
                    <TextField label="Description / Remarks" placeholder="Enter record details..." value={itemDescription} onChangeText={setItemDescription} multiline />
                    <TextField label="Amount / Value (₹)" placeholder="e.g. 2500" value={itemValue} onChangeText={setItemValue} keyboardType="numeric" />
                  </>
                )}
              </ScrollView>

              <View style={{ marginTop: 14 }}>
                <PrimaryButton
                  title={isStockDomain ? 'Submit Stock Update' : isDeliveryDomain ? 'Launch Delivery Dispatch' : `Save ${moduleName}`}
                  onPress={handleCreateRecord}
                  loading={submitting}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Record Detail Modal ─────────────────────────────────────── */}
      <Modal
        visible={!!selectedRecord}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedRecord(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : '#FFFFFF', borderColor: c.border }]}>
            {selectedRecord && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[theme.typography.h3, { color: c.textPrimary }]}>
                      {selectedRecord.title || selectedRecord.name || selectedRecord.product_name || `Record #${selectedRecord.id}`}
                    </Text>
                    <Text style={[theme.typography.caption, { color: c.textMuted }]}>
                      {moduleName} Details
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedRecord(null)} style={styles.closeBtn}>
                    <X size={20} color={c.textMuted} />
                  </TouchableOpacity>
                </View>

                {(selectedRecord.value !== undefined || selectedRecord.total_amount !== undefined || selectedRecord.price !== undefined) && (
                  <View style={[styles.amountBox, { backgroundColor: c.primaryLight }]}>
                    <Text style={[styles.amountLabel, { color: c.primary }]}>Valuation / Amount</Text>
                    <Text style={[styles.amountValue, { color: c.primary }]}>
                      ₹{parseFloat(String(selectedRecord.value ?? selectedRecord.total_amount ?? selectedRecord.price ?? 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                )}

                <View style={styles.metaRows}>
                  <View style={styles.metaRow}>
                    <Text style={[styles.metaLabel, { color: c.textMuted }]}>Status:</Text>
                    <Badge label={selectedRecord.status || selectedRecord.approval_status || 'Active'} variant="primary" />
                  </View>

                  {selectedRecord.description && (
                    <View style={styles.metaRow}>
                      <Text style={[styles.metaLabel, { color: c.textMuted }]}>Description:</Text>
                      <Text style={[styles.metaVal, { color: c.textPrimary, flex: 1, textAlign: 'right' }]}>
                        {selectedRecord.description}
                      </Text>
                    </View>
                  )}

                  {selectedRecord.created_at && (
                    <View style={styles.metaRow}>
                      <Text style={[styles.metaLabel, { color: c.textMuted }]}>Timestamp:</Text>
                      <Text style={[styles.metaVal, { color: c.textPrimary }]}>
                        {new Date(selectedRecord.created_at).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  kpiCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: 18,
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
  itemCard: {
    marginVertical: 4,
    padding: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  itemVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  fastActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 10,
    gap: 6,
  },
  fastActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  approvalBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  approvalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  approvalBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
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
    marginBottom: 16,
  },
  closeBtn: {
    padding: 4,
  },
  amountBox: {
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  amountValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  metaRows: {
    gap: 10,
    marginVertical: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  typesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
});

