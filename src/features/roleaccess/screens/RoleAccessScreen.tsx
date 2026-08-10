import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  Alert,
} from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Header } from '../../../components/common/Header';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { TextField } from '../../../components/inputs/TextField';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import {
  RoleAccessService,
  PermissionModule,
  UserAccessItem,
} from '../services/roleAccessService';
import { UserRole } from '../../../security/roleResolver';
import { useAuthStore } from '../../../store/authStore';
import { useTheme } from '../../../theme/theme';
import {
  ShieldCheck,
  Users,
  KeyRound,
  Box,
  ShoppingBag,
  Store,
  CreditCard,
  Bell,
  Lock,
  UserPlus,
  Check,
  X,
  Sparkles,
} from 'lucide-react-native';

const ROLES_LIST: { id: UserRole; label: string }[] = [
  { id: UserRole.SUPER_ADMIN, label: 'Super Admin' },
  { id: UserRole.ADMIN, label: 'Admin' },
  { id: UserRole.BRANCH_MANAGER, label: 'Branch Manager' },
  { id: UserRole.BRANCH, label: 'Branch Outlet' },
  { id: UserRole.SHOPKEEPER, label: 'Shopkeeper' },
  { id: UserRole.DELIVERY_BOY, label: 'Delivery Staff' },
  { id: UserRole.EMPLOYEE, label: 'Employee' },
];

export const RoleAccessScreen: React.FC = () => {
  const theme = useTheme();
  const currentRole = useAuthStore((state) => state.role);

  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.ADMIN);
  const [roleMatrix, setRoleMatrix] = useState<{ [key: string]: PermissionModule[] }>({});
  const [users, setUsers] = useState<UserAccessItem[]>([]);
  const [assignModalVisible, setAssignModalVisible] = useState(false);

  // Assignment Modal States
  const [selectedUser, setSelectedUser] = useState<UserAccessItem | null>(null);
  const [assignRoleType, setAssignRoleType] = useState('Admin');
  const [assigning, setAssigning] = useState(false);
  const [loadingMatrix, setLoadingMatrix] = useState(true);

  useEffect(() => {
    // Fetch menu/permissions from backend then build role matrix
    RoleAccessService.getMenuPermissions()
      .then((modules) => {
        const matrix = RoleAccessService.buildRoleMatrix(modules);
        setRoleMatrix(matrix);
      })
      .catch(() => {
        // Fallback to local default modules
        const matrix = RoleAccessService.buildRoleMatrix(RoleAccessService.getDefaultModules());
        setRoleMatrix(matrix);
      })
      .finally(() => setLoadingMatrix(false));

    RoleAccessService.getUsersList().then(setUsers);
  }, []);

  // Guard: Only Super Admin can view/access this screen
  if (currentRole !== UserRole.SUPER_ADMIN) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Access Restricted" />
        <View style={styles.restrictedBox}>
          <Lock size={48} color={theme.colors.error} />
          <Text style={[styles.restrictedTitle, { color: theme.colors.textPrimary }]}>
            Super Admin Clearance Required
          </Text>
          <Text style={[styles.restrictedDesc, { color: theme.colors.textMuted }]}>
            This control center is restricted exclusively to executive Super Administrators.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const handleToggleAction = (moduleIdx: number, actionKey: string, currentVal: boolean) => {
    setRoleMatrix((prev) => {
      const currentList = prev[selectedRole] || [];
      const updatedList = currentList.map((m, idx) => {
        if (idx !== moduleIdx) return m;
        return {
          ...m,
          actions: m.actions.map((a) => (a.key === actionKey ? { ...a, enabled: !currentVal } : a)),
        };
      });
      return { ...prev, [selectedRole]: updatedList };
    });
  };

  const handleAssignRole = async () => {
    if (!selectedUser) {
      Alert.alert('Required', 'Please select a user.');
      return;
    }

    setAssigning(true);
    try {
      await RoleAccessService.assignUserRole(selectedUser.id, assignRoleType);
      Alert.alert('Success', `Role ${assignRoleType} assigned to ${selectedUser.name || selectedUser.email}.`);
      setAssignModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to assign role');
    } finally {
      setAssigning(false);
    }
  };

  const activeModules = roleMatrix[selectedRole] || [];
  const c = theme.colors;

  const getModuleIcon = (id: string) => {
    const size = 18;
    switch (id) {
      case 'products':
        return <Box size={size} color={c.primary} />;
      case 'orders':
        return <ShoppingBag size={size} color={c.success} />;
      case 'branches':
        return <Store size={size} color={c.accent} />;
      case 'workforce':
        return <Users size={size} color={c.warning} />;
      case 'pos':
        return <CreditCard size={size} color={c.primary} />;
      default:
        return <Bell size={size} color={c.textMuted} />;
    }
  };

  return (
    <View style={styles.root}>
      <ScreenContainer scrollable={true}>
        <Header
          title="Role Access Control"
          subtitle="Super Admin Permission Engine"
          rightAction={
            <TouchableOpacity
              onPress={() => setAssignModalVisible(true)}
              style={[styles.assignBtn, { backgroundColor: c.primary }]}
              activeOpacity={0.8}
            >
              <UserPlus size={14} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.assignBtnText}>Assign</Text>
            </TouchableOpacity>
          }
        />

        {/* ── Executive Banner ─────────────────────────────────────── */}
        <Card style={styles.bannerCard}>
          <View style={styles.bannerRow}>
            <View style={[styles.shieldBox, { backgroundColor: c.primaryLight }]}>
              <ShieldCheck size={26} color={c.primary} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: c.textPrimary }]}>Executive Authority Mode</Text>
              <Text style={[styles.bannerSub, { color: c.textMuted }]}>
                Real-time granular module permission matrix for all system roles.
              </Text>
            </View>
          </View>
        </Card>

        {/* ── Role Selector Tabs ───────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.rolesScroll}
          contentContainerStyle={styles.rolesContent}
        >
          {ROLES_LIST.map((r) => {
            const isSelected = selectedRole === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                onPress={() => setSelectedRole(r.id)}
                style={[
                  styles.roleChip,
                  {
                    backgroundColor: isSelected ? c.primary : c.surfaceSecondary,
                    borderColor: isSelected ? c.primary : c.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.roleChipText,
                    { color: isSelected ? '#FFFFFF' : c.textSecondary },
                  ]}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Permission Modules List ──────────────────────────────── */}
        <View style={styles.moduleList}>
          {activeModules.map((module, mIdx) => (
            <Card key={module.id} style={styles.moduleCard}>
              <View style={styles.moduleHeader}>
                <View style={styles.moduleTitleRow}>
                  <View style={[styles.moduleIconBox, { backgroundColor: c.surfaceSecondary }]}>
                    {getModuleIcon(module.id)}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.moduleName, { color: c.textPrimary }]}>{module.name}</Text>
                    <Text style={[styles.moduleDesc, { color: c.textMuted }]}>{module.description}</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: c.border }]} />

              <View style={styles.actionToggles}>
                {module.actions.map((act) => (
                  <View key={act.key} style={styles.actionRow}>
                    <Text style={[styles.actionLabel, { color: c.textSecondary }]}>{act.label}</Text>
                    <Switch
                      value={act.enabled}
                      onValueChange={() => handleToggleAction(mIdx, act.key, act.enabled)}
                      trackColor={{ false: c.border, true: c.primary }}
                    />
                  </View>
                ))}
              </View>
            </Card>
          ))}
        </View>
      </ScreenContainer>

      {/* ── Assign Role to User Modal ───────────────────────────────── */}
      <Modal
        visible={assignModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : '#FFFFFF', borderColor: c.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[theme.typography.h3, { color: c.textPrimary }]}>Assign Role to Staff</Text>
                <Text style={[theme.typography.caption, { color: c.textMuted }]}>
                  Authorize user role clearance & branch context
                </Text>
              </View>
              <TouchableOpacity onPress={() => setAssignModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={c.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 340 }}>
              <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Select Staff Member:</Text>
              <View style={styles.usersList}>
                {users.map((u) => {
                  const isChosen = selectedUser?.id === u.id;
                  return (
                    <TouchableOpacity
                      key={u.id}
                      onPress={() => setSelectedUser(u)}
                      style={[
                        styles.userItem,
                        {
                          backgroundColor: isChosen ? c.primaryLight : c.surfaceSecondary,
                          borderColor: isChosen ? c.primary : c.border,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.userName, { color: c.textPrimary }]}>{u.name || u.email}</Text>
                        <Text style={[styles.userEmail, { color: c.textMuted }]}>{u.email}</Text>
                      </View>
                      <Badge label={u.userType} variant="primary" />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { color: c.textSecondary, marginTop: 14 }]}>Target Role Clearance:</Text>
              <View style={styles.rolesGrid}>
                {ROLES_LIST.map((r) => {
                  const isSelected = assignRoleType === r.id;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      onPress={() => setAssignRoleType(r.id)}
                      style={[
                        styles.roleSelectChip,
                        {
                          backgroundColor: isSelected ? c.primary : c.surfaceSecondary,
                          borderColor: isSelected ? c.primary : c.border,
                        },
                      ]}
                    >
                      <Text style={[styles.roleSelectText, { color: isSelected ? '#FFFFFF' : c.textSecondary }]}>
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <PrimaryButton
                title="Confirm & Assign Role"
                onPress={handleAssignRole}
                loading={assigning}
              />
            </View>
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
  restrictedBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  restrictedTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  restrictedDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 4,
  },
  assignBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  bannerCard: {
    padding: 14,
    marginVertical: 6,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shieldBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  bannerSub: {
    fontSize: 11,
    marginTop: 2,
  },

  // Roles Scroll
  rolesScroll: {
    marginVertical: 8,
  },
  rolesContent: {
    gap: 8,
    paddingVertical: 2,
  },
  roleChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Modules
  moduleList: {
    gap: 10,
    marginTop: 6,
  },
  moduleCard: {
    padding: 14,
  },
  moduleHeader: {
    marginBottom: 8,
  },
  moduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  moduleIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleName: {
    fontSize: 14,
    fontWeight: '800',
  },
  moduleDesc: {
    fontSize: 11,
    marginTop: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
  actionToggles: {
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  closeBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  usersList: {
    gap: 6,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 11,
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleSelectChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  roleSelectText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalActions: {
    marginTop: 16,
    marginBottom: 10,
  },
});
