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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Header } from '../../../components/common/Header';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { TextField } from '../../../components/inputs/TextField';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { BranchService, Branch } from '../services/branchService';
import { DashboardSkeleton } from '../../../components/skeletons/SkeletonLoader';
import { EmptyState, ErrorState } from '../../../components/common/States';
import { useTheme } from '../../../theme/theme';
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Users,
  Clock,
  Plus,
  X,
  Edit2,
  PhoneCall,
  Navigation,
} from 'lucide-react-native';

export const BranchesScreen: React.FC = () => {
  const theme = useTheme();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detail & Form Modals
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [managerName, setManagerName] = useState('');
  const [openingHours, setOpeningHours] = useState('09:00 AM - 09:00 PM');

  const fetchBranches = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await BranchService.getBranches();
      setBranches(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load branches');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleOpenDetail = (b: Branch) => {
    setSelectedBranch(b);
    setDetailVisible(true);
  };

  const handleOpenAdd = () => {
    setFormMode('add');
    setSelectedBranch(null);
    setName('');
    setCode(`BR-${Date.now().toString().slice(-4)}`);
    setAddress('');
    setCity('');
    setPhone('');
    setEmail('');
    setManagerName('');
    setOpeningHours('09:00 AM - 09:00 PM');
    setFormVisible(true);
  };

  const handleOpenEdit = (b: Branch) => {
    setFormMode('edit');
    setSelectedBranch(b);
    setName(b.name || '');
    setCode(b.code || '');
    setAddress(b.address || '');
    setCity(b.city || '');
    setPhone(b.phone || '');
    setEmail(b.email || '');
    setManagerName(b.manager_name || '');
    setOpeningHours(b.opening_hours || '09:00 AM - 09:00 PM');
    setFormVisible(true);
  };

  const handleSaveBranch = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a branch name.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<Branch> = {
        name,
        code,
        address,
        city,
        phone,
        email,
        manager_name: managerName,
        opening_hours: openingHours,
      };

      if (formMode === 'add') {
        const created = await BranchService.createBranch(payload);
        setBranches((prev) => [created, ...prev]);
        Alert.alert('Success', 'Branch location created successfully.');
      } else if (selectedBranch) {
        const updated = await BranchService.updateBranch(selectedBranch.id, payload);
        setBranches((prev) => prev.map((b) => (b.id === selectedBranch.id ? updated : b)));
        Alert.alert('Success', 'Branch details updated successfully.');
      }

      setFormVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save branch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBranch = (branch: Branch) => {
    Alert.alert(
      'Delete Branch',
      `Permanently delete "${branch.name}"? All associated data will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await BranchService.deleteBranch(branch.id);
              setBranches((prev) => prev.filter((b) => b.id !== branch.id));
              setDetailVisible(false);
              setSelectedBranch(null);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete branch');
            }
          },
        },
      ]
    );
  };

  const c = theme.colors;

  return (
    <View style={styles.root}>
      <ScreenContainer scrollable={true} refreshing={refreshing} onRefresh={() => fetchBranches(true)}>
        <Header
          title="Company Outlets"
          subtitle={`${branches.length} Registered Locations`}
          rightAction={
            <TouchableOpacity
              onPress={handleOpenAdd}
              style={[styles.addBtn, { backgroundColor: c.primary }]}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.addBtnText}>Add Branch</Text>
            </TouchableOpacity>
          }
        />

        {loading && !refreshing ? (
          <DashboardSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchBranches()} />
        ) : branches.length === 0 ? (
          <EmptyState title="No Branches Found" description="No registered branch locations. Tap Add Branch to register an outlet." />
        ) : (
          branches.map((b) => (
            <TouchableOpacity
              key={b.id}
              activeOpacity={0.7}
              onPress={() => handleOpenDetail(b)}
            >
              <Card style={styles.branchCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <View style={[styles.branchIconBox, { backgroundColor: c.primaryLight }]}>
                      <Store size={20} color={c.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.branchName, { color: c.textPrimary }]}>
                        {b.name}
                      </Text>
                      <Text style={[styles.branchCode, { color: c.textMuted }]}>
                        {b.code || `Outlet #${b.id}`} {b.city ? `· ${b.city}` : ''}
                      </Text>
                    </View>
                  </View>
                  <Badge label={b.status !== false ? 'Active' : 'Inactive'} variant={b.status !== false ? 'success' : 'neutral'} size="sm" />
                </View>

                {b.address ? (
                  <View style={styles.detailRow}>
                    <MapPin size={15} color={c.textMuted} />
                    <Text style={[styles.detailText, { color: c.textSecondary }]} numberOfLines={1}>
                      {b.address}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.cardFooter}>
                  <View style={styles.detailRow}>
                    <Clock size={14} color={c.textMuted} />
                    <Text style={[styles.footerText, { color: c.textMuted }]}>
                      {b.opening_hours || '09:00 AM - 09:00 PM'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleOpenEdit(b)}
                    style={[styles.editBtn, { backgroundColor: c.primaryLight }]}
                  >
                    <Edit2 size={13} color={c.primary} />
                    <Text style={[styles.editText, { color: c.primary }]}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScreenContainer>

      {/* ── Branch Detail Modal ─────────────────────────────────────── */}
      <Modal
        visible={detailVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.detailSheet, { backgroundColor: theme.isDark ? c.surface : '#FFFFFF', borderColor: c.border }]}>
            {selectedBranch && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[theme.typography.h3, { color: c.textPrimary }]}>{selectedBranch.name}</Text>
                    <Text style={[theme.typography.caption, { color: c.textMuted }]}>
                      {selectedBranch.code || `Branch #${selectedBranch.id}`}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setDetailVisible(false)} style={styles.closeBtn}>
                    <X size={20} color={c.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Status & Manager */}
                <View style={styles.metaRows}>
                  <View style={styles.metaRow}>
                    <Text style={[styles.metaLabel, { color: c.textMuted }]}>Status:</Text>
                    <Badge label={selectedBranch.status !== false ? 'Operational' : 'Closed'} variant={selectedBranch.status !== false ? 'success' : 'neutral'} />
                  </View>

                  {selectedBranch.manager_name && (
                    <View style={styles.metaRow}>
                      <Text style={[styles.metaLabel, { color: c.textMuted }]}>Branch Manager:</Text>
                      <Text style={[styles.metaVal, { color: c.textPrimary }]}>{selectedBranch.manager_name}</Text>
                    </View>
                  )}

                  {selectedBranch.address && (
                    <View style={styles.metaRow}>
                      <Text style={[styles.metaLabel, { color: c.textMuted }]}>Address:</Text>
                      <Text style={[styles.metaVal, { color: c.textPrimary, flex: 1, textAlign: 'right' }]}>{selectedBranch.address}</Text>
                    </View>
                  )}

                  {selectedBranch.opening_hours && (
                    <View style={styles.metaRow}>
                      <Text style={[styles.metaLabel, { color: c.textMuted }]}>Working Hours:</Text>
                      <Text style={[styles.metaVal, { color: c.textPrimary }]}>{selectedBranch.opening_hours}</Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionGrid}>
                  {selectedBranch.phone ? (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${selectedBranch.phone}`)}
                      style={[styles.actionGridBtn, { backgroundColor: c.primaryLight }]}
                    >
                      <PhoneCall size={16} color={c.primary} />
                      <Text style={[styles.actionGridText, { color: c.primary }]}>Call Outlet</Text>
                    </TouchableOpacity>
                  ) : null}

                  {selectedBranch.address ? (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(selectedBranch.address || '')}`)}
                      style={[styles.actionGridBtn, { backgroundColor: c.accentLight }]}
                    >
                      <Navigation size={16} color={c.accent} />
                      <Text style={[styles.actionGridText, { color: c.accent }]}>Directions</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <View style={{ marginTop: 16, gap: 10 }}>
                  <PrimaryButton
                    title="Edit Branch Information"
                    onPress={() => {
                      setDetailVisible(false);
                      handleOpenEdit(selectedBranch);
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => handleDeleteBranch(selectedBranch)}
                    style={[styles.deleteBtn, { backgroundColor: '#FEE2E2' }]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.deleteBtnText, { color: '#DC2626' }]}>Delete Branch</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Add / Edit Branch Modal ─────────────────────────────────── */}
      <Modal
        visible={formVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFormVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.formSheet, { backgroundColor: theme.isDark ? c.surface : '#FFFFFF', borderColor: c.border }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[theme.typography.h3, { color: c.textPrimary }]}>
                    {formMode === 'add' ? 'Register New Branch' : 'Edit Branch'}
                  </Text>
                  <Text style={[theme.typography.caption, { color: c.textMuted }]}>
                    Company Outlet Profile & Operations
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setFormVisible(false)} style={styles.closeBtn}>
                  <X size={20} color={c.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 160 }}
              >
                <TextField label="Branch Name *" placeholder="e.g. Coimbatore Main Outlet" value={name} onChangeText={setName} />
                <TextField label="Branch Code" placeholder="e.g. CBE-01" value={code} onChangeText={setCode} />
                <TextField label="Manager Name" placeholder="e.g. Sundar Rajan" value={managerName} onChangeText={setManagerName} />
                <TextField label="Street Address" placeholder="e.g. 104 DB Road, RS Puram" value={address} onChangeText={setAddress} />
                <TextField label="City" placeholder="e.g. Coimbatore" value={city} onChangeText={setCity} />
                <TextField label="Contact Phone" placeholder="e.g. +91 98765 43210" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                <TextField label="Contact Email" placeholder="e.g. cbe.branch@svk.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
                <TextField label="Operating Hours" placeholder="e.g. 09:00 AM - 09:00 PM" value={openingHours} onChangeText={setOpeningHours} />
              </ScrollView>

              <View style={{ marginTop: 14 }}>
                <PrimaryButton
                  title={formMode === 'add' ? 'Create Branch Outlet' : 'Save Branch Details'}
                  onPress={handleSaveBranch}
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
  branchCard: {
    marginVertical: 5,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  branchIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchName: {
    fontSize: 15,
    fontWeight: '700',
  },
  branchCode: {
    fontSize: 11,
    marginTop: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 3,
  },
  detailText: {
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  footerText: {
    fontSize: 11,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  editText: {
    fontSize: 11,
    fontWeight: '700',
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
  metaRows: {
    gap: 10,
    marginBottom: 16,
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
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 8,
  },
  actionGridBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  actionGridText: {
    fontSize: 12,
    fontWeight: '700',
  },

  formSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    padding: 22,
    maxHeight: '88%',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
