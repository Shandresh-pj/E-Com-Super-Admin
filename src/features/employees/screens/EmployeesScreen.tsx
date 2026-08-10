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
import { EmployeeService, Employee } from '../services/employeeService';
import { DashboardSkeleton } from '../../../components/skeletons/SkeletonLoader';
import { EmptyState, ErrorState } from '../../../components/common/States';
import { useTheme } from '../../../theme/theme';
import {
  User,
  Users,
  Search,
  Plus,
  X,
  Mail,
  Phone,
  Store,
  Shield,
  PhoneCall,
  MailCheck,
} from 'lucide-react-native';

const ROLE_FILTERS = [
  { id: 'ALL', label: 'All Staff' },
  { id: 'ADMIN', label: 'Admins' },
  { id: 'BRANCH_MANAGER', label: 'Managers' },
  { id: 'SHOPKEEPER', label: 'Shopkeepers' },
  { id: 'DELIVERY_BOY', label: 'Delivery' },
  { id: 'EMPLOYEE', label: 'Staff' },
];

export const EmployeesScreen: React.FC = () => {
  const theme = useTheme();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeRole, setActiveRole] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Add Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState('Employee');

  const fetchEmployees = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await EmployeeService.getEmployees(searchQuery);
      setEmployees(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load employees');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [searchQuery]);

  const handleOpenDetail = (emp: Employee) => {
    setSelectedEmp(emp);
    setDetailVisible(true);
  };

  const handleOpenAdd = () => {
    setName('');
    setEmail('');
    setPassword('Pass@1234');
    setPhone('');
    setUserType('Employee');
    setAddModalVisible(true);
  };

  const handleCreateEmployee = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Required', 'Please enter staff name and email.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await EmployeeService.createEmployee({
        name,
        email,
        password,
        phone,
        userType,
      });
      setEmployees((prev) => [created, ...prev]);
      Alert.alert('Success', `Employee ${name} registered successfully.`);
      setAddModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create employee');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const roleMatch =
      activeRole === 'ALL' ||
      (emp.userType || emp.role || '').toUpperCase() === activeRole.toUpperCase();

    const searchMatch =
      !searchQuery.trim() ||
      (emp.name && emp.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (emp.email && emp.email.toLowerCase().includes(searchQuery.toLowerCase()));

    return roleMatch && searchMatch;
  });

  const handleDeleteEmployee = (emp: Employee) => {
    Alert.alert(
      'Remove Staff',
      `Remove "${emp.name}" from the system? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await EmployeeService.deleteEmployee(emp.id);
              setEmployees((prev) => prev.filter((e) => e.id !== emp.id));
              setDetailVisible(false);
              setSelectedEmp(null);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove employee');
            }
          },
        },
      ]
    );
  };

  const c = theme.colors;

  return (
    <View style={styles.root}>
      <ScreenContainer scrollable={true} refreshing={refreshing} onRefresh={() => fetchEmployees(true)}>
        <Header
          title="Staff & Workforce"
          subtitle={`${employees.length} Personnel Registered`}
          rightAction={
            <TouchableOpacity
              onPress={handleOpenAdd}
              style={[styles.addBtn, { backgroundColor: c.primary }]}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.addBtnText}>Add Staff</Text>
            </TouchableOpacity>
          }
        />

        {/* ── Search Bar ────────────────────────────────────────────── */}
        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : '#F1F5F9', borderColor: c.border }]}>
          <Search size={18} color={c.textMuted} />
          <TextInput
            placeholder="Search by name, email, or role..."
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

        {/* ── Role Filter Chips ─────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {ROLE_FILTERS.map((rf) => {
            const isSelected = activeRole === rf.id;
            return (
              <TouchableOpacity
                key={rf.id}
                onPress={() => setActiveRole(rf.id)}
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
                  {rf.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Staff List ────────────────────────────────────────────── */}
        {loading && !refreshing ? (
          <DashboardSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchEmployees()} />
        ) : filteredEmployees.length === 0 ? (
          <EmptyState
            title="No Staff Found"
            description={
              searchQuery
                ? `No staff members matching "${searchQuery}".`
                : activeRole === 'ALL'
                ? 'No employees listed in backend.'
                : `No personnel found with role "${activeRole}".`
            }
          />
        ) : (
          filteredEmployees.map((emp) => (
            <TouchableOpacity
              key={emp.id}
              activeOpacity={0.7}
              onPress={() => handleOpenDetail(emp)}
            >
              <Card style={styles.empCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatarRow}>
                    <View style={[styles.avatar, { backgroundColor: c.primaryLight }]}>
                      <User size={18} color={c.primary} />
                    </View>
                    <View style={styles.empInfo}>
                      <Text style={[styles.empName, { color: c.textPrimary }]}>
                        {emp.name || emp.email.split('@')[0]}
                      </Text>
                      <Text style={[styles.empEmail, { color: c.textMuted }]}>
                        {emp.email}
                      </Text>
                    </View>
                  </View>
                  <Badge label={emp.userType || emp.role || 'Staff'} variant="primary" size="sm" />
                </View>

                {emp.branch?.name || emp.branch_name ? (
                  <View style={styles.branchRow}>
                    <Store size={14} color={c.textMuted} />
                    <Text style={[styles.branchText, { color: c.textSecondary }]}>
                      {emp.branch?.name || emp.branch_name}
                    </Text>
                  </View>
                ) : null}
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScreenContainer>

      {/* ── Staff Detail Modal ──────────────────────────────────────── */}
      <Modal
        visible={detailVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.detailSheet, { backgroundColor: theme.isDark ? c.surface : '#FFFFFF', borderColor: c.border }]}>
            {selectedEmp && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <View style={styles.detailAvatarRow}>
                    <View style={[styles.largeAvatar, { backgroundColor: c.primaryLight }]}>
                      <User size={28} color={c.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[theme.typography.h3, { color: c.textPrimary }]}>
                        {selectedEmp.name || selectedEmp.email}
                      </Text>
                      <Text style={[theme.typography.caption, { color: c.textMuted }]}>
                        {selectedEmp.email}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setDetailVisible(false)} style={styles.closeBtn}>
                    <X size={20} color={c.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Details Table */}
                <View style={styles.metaRows}>
                  <View style={styles.metaRow}>
                    <Text style={[styles.metaLabel, { color: c.textMuted }]}>Role Clearance:</Text>
                    <Badge label={selectedEmp.userType || selectedEmp.role || 'Staff'} variant="primary" />
                  </View>

                  {selectedEmp.phone && (
                    <View style={styles.metaRow}>
                      <Text style={[styles.metaLabel, { color: c.textMuted }]}>Phone Number:</Text>
                      <Text style={[styles.metaVal, { color: c.textPrimary }]}>{selectedEmp.phone}</Text>
                    </View>
                  )}

                  {(selectedEmp.branch?.name || selectedEmp.branch_name) && (
                    <View style={styles.metaRow}>
                      <Text style={[styles.metaLabel, { color: c.textMuted }]}>Assigned Branch:</Text>
                      <Text style={[styles.metaVal, { color: c.textPrimary }]}>
                        {selectedEmp.branch?.name || selectedEmp.branch_name}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Contact Actions */}
                <View style={styles.actionGrid}>
                  {selectedEmp.phone ? (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${selectedEmp.phone}`)}
                      style={[styles.actionGridBtn, { backgroundColor: c.primaryLight }]}
                    >
                      <PhoneCall size={16} color={c.primary} />
                      <Text style={[styles.actionGridText, { color: c.primary }]}>Call Staff</Text>
                    </TouchableOpacity>
                  ) : null}

                  {selectedEmp.email ? (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`mailto:${selectedEmp.email}`)}
                      style={[styles.actionGridBtn, { backgroundColor: c.accentLight }]}
                    >
                      <MailCheck size={16} color={c.accent} />
                      <Text style={[styles.actionGridText, { color: c.accent }]}>Send Email</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Remove Staff Action */}
                <TouchableOpacity
                  onPress={() => handleDeleteEmployee(selectedEmp)}
                  style={[styles.removeEmpBtn, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.removeEmpText, { color: '#DC2626' }]}>Remove Staff Member</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Add Employee Modal ──────────────────────────────────────── */}
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
            <View style={[styles.formSheet, { backgroundColor: theme.isDark ? c.surface : '#FFFFFF', borderColor: c.border }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[theme.typography.h3, { color: c.textPrimary }]}>Onboard New Staff</Text>
                  <Text style={[theme.typography.caption, { color: c.textMuted }]}>
                    Create account credentials & assign role
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
                <TextField label="Full Name *" placeholder="e.g. Ramesh Krishnan" value={name} onChangeText={setName} />
                <TextField label="Email Address *" placeholder="e.g. ramesh@svk.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
                <TextField label="Initial Password" placeholder="••••••••" value={password} onChangeText={setPassword} isPassword />
                <TextField label="Contact Phone" placeholder="e.g. +91 98765 43210" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

                <Text style={[styles.rolePickerLabel, { color: c.textSecondary }]}>Role Assignment:</Text>
                <View style={styles.rolesGrid}>
                  {['Admin', 'Branch_Manager', 'Shopkeeper', 'Delivery_Boy', 'Employee'].map((r) => {
                    const isSelected = userType === r;
                    return (
                      <TouchableOpacity
                        key={r}
                        onPress={() => setUserType(r)}
                        style={[
                          styles.roleChip,
                          {
                            backgroundColor: isSelected ? c.primary : c.surfaceSecondary,
                            borderColor: isSelected ? c.primary : c.border,
                          },
                        ]}
                      >
                        <Text style={[styles.roleChipText, { color: isSelected ? '#FFFFFF' : c.textSecondary }]}>
                          {r.replace('_', ' ')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <View style={{ marginTop: 14 }}>
                <PrimaryButton
                  title="Create Staff Profile"
                  onPress={handleCreateEmployee}
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
  empCard: {
    marginVertical: 4,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empInfo: {
    flex: 1,
  },
  empName: {
    fontSize: 14,
    fontWeight: '700',
  },
  empEmail: {
    fontSize: 11,
    marginTop: 1,
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  branchText: {
    fontSize: 11,
    fontWeight: '600',
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
  detailAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  largeAvatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 6,
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
  rolePickerLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  removeEmpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
    marginHorizontal: 2,
  },
  removeEmpText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
