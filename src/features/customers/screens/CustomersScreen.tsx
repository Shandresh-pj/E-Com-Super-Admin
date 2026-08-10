import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Linking,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Header } from '../../../components/common/Header';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { TextField } from '../../../components/inputs/TextField';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { CustomerService, Customer } from '../services/customerService';
import { DashboardSkeleton } from '../../../components/skeletons/SkeletonLoader';
import { EmptyState, ErrorState } from '../../../components/common/States';
import { useTheme } from '../../../theme/theme';
import {
  Users,
  Search,
  Plus,
  X,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Award,
  PhoneCall,
} from 'lucide-react-native';

export const CustomersScreen: React.FC = () => {
  const theme = useTheme();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [addVisible, setAddVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  const fetchCustomers = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await CustomerService.getCustomers(searchQuery);
      setCustomers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [searchQuery]);

  const handleOpenDetail = (cust: Customer) => {
    setSelectedCust(cust);
    setDetailVisible(true);
  };

  const handleOpenAdd = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCity('');
    setAddVisible(true);
  };

  const handleCreateCustomer = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Required', 'Please enter customer name and contact phone.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await CustomerService.createCustomer({
        name,
        phone,
        email,
        address,
        city,
      });
      setCustomers((prev) => [created, ...prev]);
      Alert.alert('Success', `Customer ${name} registered successfully.`);
      setAddVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to register customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = (cust: Customer) => {
    Alert.alert(
      'Delete Customer',
      `Permanently remove customer "${cust.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await CustomerService.deleteCustomer(cust.id);
              setCustomers((prev) => prev.filter((c) => c.id !== cust.id));
              setDetailVisible(false);
              setSelectedCust(null);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete customer');
            }
          },
        },
      ]
    );
  };

  const c = theme.colors;

  return (
    <View style={styles.root}>
      <ScreenContainer scrollable={true} refreshing={refreshing} onRefresh={() => fetchCustomers(true)}>
        <Header
          title="Customer CRM"
          subtitle={`${customers.length} Client Records`}
          rightAction={
            <TouchableOpacity
              onPress={handleOpenAdd}
              style={[styles.addBtn, { backgroundColor: c.primary }]}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          }
        />

        {/* ── Search Bar ────────────────────────────────────────────── */}
        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : '#F1F5F9', borderColor: c.border }]}>
          <Search size={18} color={c.textMuted} />
          <TextInput
            placeholder="Search customers by name, phone, email..."
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

        {/* ── Customers List ────────────────────────────────────────── */}
        {loading && !refreshing ? (
          <DashboardSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchCustomers()} />
        ) : customers.length === 0 ? (
          <EmptyState
            title="No Customers Found"
            description={searchQuery ? `No matches for "${searchQuery}".` : 'No customer records yet. Tap Add to register a client.'}
          />
        ) : (
          customers.map((cust) => (
            <TouchableOpacity
              key={cust.id}
              activeOpacity={0.7}
              onPress={() => handleOpenDetail(cust)}
            >
              <Card style={styles.custCard}>
                <View style={styles.cardRow}>
                  <View style={[styles.avatarBox, { backgroundColor: c.primaryLight }]}>
                    <Users size={20} color={c.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.custName, { color: c.textPrimary }]}>{cust.name}</Text>
                    <Text style={[styles.custPhone, { color: c.textMuted }]}>
                      {cust.phone || cust.email || 'No phone'} {cust.city ? `· ${cust.city}` : ''}
                    </Text>
                  </View>
                  {cust.total_orders !== undefined && (
                    <Badge label={`${cust.total_orders} Orders`} variant="neutral" size="sm" />
                  )}
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScreenContainer>

      {/* ── Customer Detail Modal ───────────────────────────────────── */}
      <Modal
        visible={detailVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.detailSheet, { backgroundColor: theme.isDark ? c.surface : '#FFFFFF', borderColor: c.border }]}>
            {selectedCust && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={[theme.typography.h3, { color: c.textPrimary }]}>{selectedCust.name}</Text>
                    <Text style={[theme.typography.caption, { color: c.textMuted }]}>
                      Customer Profile & Transaction History
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setDetailVisible(false)} style={styles.closeBtn}>
                    <X size={20} color={c.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Lifetime Metrics */}
                <View style={[styles.metricsBox, { backgroundColor: c.primaryLight }]}>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, { color: c.primary }]}>Total Spent</Text>
                    <Text style={[styles.metricVal, { color: c.primary }]}>
                      ₹{parseFloat(String(selectedCust.total_spent || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={[styles.metricLabel, { color: c.primary }]}>Orders Placed</Text>
                    <Text style={[styles.metricVal, { color: c.primary }]}>
                      {selectedCust.total_orders || 0}
                    </Text>
                  </View>
                </View>

                {/* Contact Meta */}
                <View style={styles.metaRows}>
                  {selectedCust.phone && (
                    <View style={styles.metaRow}>
                      <Text style={[styles.metaLabel, { color: c.textMuted }]}>Phone Number:</Text>
                      <Text style={[styles.metaVal, { color: c.textPrimary }]}>{selectedCust.phone}</Text>
                    </View>
                  )}

                  {selectedCust.email && (
                    <View style={styles.metaRow}>
                      <Text style={[styles.metaLabel, { color: c.textMuted }]}>Email Address:</Text>
                      <Text style={[styles.metaVal, { color: c.textPrimary }]}>{selectedCust.email}</Text>
                    </View>
                  )}

                  {selectedCust.address && (
                    <View style={styles.metaRow}>
                      <Text style={[styles.metaLabel, { color: c.textMuted }]}>Address:</Text>
                      <Text style={[styles.metaVal, { color: c.textPrimary, flex: 1, textAlign: 'right' }]}>{selectedCust.address}</Text>
                    </View>
                  )}
                </View>

                <View style={{ marginTop: 14, gap: 10 }}>
                  {selectedCust.phone ? (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${selectedCust.phone}`)}
                      style={[styles.callBtn, { backgroundColor: c.primary }]}
                    >
                      <PhoneCall size={16} color="#FFFFFF" />
                      <Text style={styles.callBtnText}>Call Customer</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    onPress={() => handleDeleteCustomer(selectedCust)}
                    style={[styles.deleteCustBtn, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.deleteCustText, { color: '#DC2626' }]}>Remove Customer Record</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Add Customer Modal ──────────────────────────────────────── */}
      <Modal
        visible={addVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.formSheet, { backgroundColor: theme.isDark ? c.surface : '#FFFFFF', borderColor: c.border }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[theme.typography.h3, { color: c.textPrimary }]}>Register Client</Text>
                  <Text style={[theme.typography.caption, { color: c.textMuted }]}>
                    Customer Directory Profile
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setAddVisible(false)} style={styles.closeBtn}>
                  <X size={20} color={c.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 160 }}
              >
                <TextField label="Customer Name *" placeholder="e.g. Ananya Sharma" value={name} onChangeText={setName} />
                <TextField label="Mobile Number *" placeholder="e.g. +91 98765 43210" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                <TextField label="Email Address" placeholder="e.g. ananya@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
                <TextField label="Street Address" placeholder="e.g. Flat 402, Green Park Avenue" value={address} onChangeText={setAddress} />
                <TextField label="City" placeholder="e.g. Chennai" value={city} onChangeText={setCity} />
              </ScrollView>

              <View style={{ marginTop: 14 }}>
                <PrimaryButton
                  title="Create Customer Record"
                  onPress={handleCreateCustomer}
                  loading={submitting}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  custCard: {
    marginVertical: 4,
    padding: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  custName: {
    fontSize: 14,
    fontWeight: '700',
  },
  custPhone: {
    fontSize: 11,
    marginTop: 2,
  },

  // Modals
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
    marginBottom: 16,
  },
  closeBtn: {
    padding: 4,
  },
  metricsBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 14,
    borderRadius: 16,
    marginBottom: 14,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  metaRows: {
    gap: 10,
    marginBottom: 14,
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
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  formSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    padding: 22,
    maxHeight: '88%',
  },
  deleteCustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  deleteCustText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
