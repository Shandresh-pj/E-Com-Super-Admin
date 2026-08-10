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
} from 'lucide-react-native';

export const DynamicModuleScreen: React.FC = () => {
  const theme = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const moduleName = route.params?.title || 'System Console';
  const modulePath = route.params?.path || '/dashboard';
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
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  const fetchModuleData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      // Attempt to load live data from backend endpoint
      const cleanPath = modulePath.startsWith('/') ? modulePath : `/${modulePath}`;
      const response = await axiosClient.get(cleanPath);
      const normalized = normalizeApiResponse<any[]>(response.data);
      if (Array.isArray(normalized.data)) {
        setRecords(normalized.data);
      } else {
        setRecords([]);
      }
    } catch {
      // Endpoint empty or not returning list — display clean empty state
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
    if (!itemName.trim()) {
      Alert.alert('Required', 'Please enter record title/name.');
      return;
    }

    setSubmitting(true);
    try {
      const cleanPath = modulePath.startsWith('/') ? modulePath : `/${modulePath}`;
      const payload = {
        name: itemName,
        description: itemDescription,
        value: itemValue || 0,
        status: 'ACTIVE',
      };

      const response = await axiosClient.post(cleanPath, payload);
      const normalized = normalizeApiResponse<any>(response.data);
      const createdItem = normalized.data || {
        id: Date.now(),
        name: itemName,
        title: itemName,
        description: itemDescription,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
      };

      setRecords((prev) => [createdItem, ...prev]);

      Alert.alert('Created', `${moduleName} record saved successfully.`);
      setAddModalVisible(false);
      setItemName('');
      setItemDescription('');
      setItemValue('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create record');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = records.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.code && r.code.toLowerCase().includes(q)) ||
      (r.status && r.status.toLowerCase().includes(q))
    );
  });

  const c = theme.colors;

  return (
    <View style={styles.root}>
      <ScreenContainer scrollable={true} refreshing={refreshing} onRefresh={() => fetchModuleData(true)}>
        <Header
          title={moduleName}
          subtitle={`${moduleCategory} · Real-time Console`}
          showBack={true}
          onBackPress={() => navigation.goBack()}
          rightAction={
            <TouchableOpacity
              onPress={() => setAddModalVisible(true)}
              style={[styles.addBtn, { backgroundColor: c.primary }]}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.addBtnText}>New</Text>
            </TouchableOpacity>
          }
        />

        {/* ── KPI Summary Cards ─────────────────────────────────────── */}
        <View style={styles.kpiRow}>
          <Card style={[styles.kpiCard, { backgroundColor: c.primaryLight }]}>
            <Text style={[styles.kpiLabel, { color: c.primary }]}>Total Records</Text>
            <Text style={[styles.kpiValue, { color: c.primary }]}>{records.length}</Text>
          </Card>

          <Card style={[styles.kpiCard, { backgroundColor: c.successLight }]}>
            <Text style={[styles.kpiLabel, { color: c.success }]}>Active Status</Text>
            <Text style={[styles.kpiValue, { color: c.success }]}>
              {records.filter((r) => r.status === 'ACTIVE' || r.isActive !== false).length}
            </Text>
          </Card>
        </View>

        {/* ── Search Bar ────────────────────────────────────────────── */}
        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : '#F1F5F9', borderColor: c.border }]}>
          <Search size={18} color={c.textMuted} />
          <TextInput
            placeholder={`Search in ${moduleName}...`}
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
            description="Tap the + New button above to register an entry in this module."
          />
        ) : (
          filtered.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => setSelectedRecord(item)}
            >
              <Card style={styles.itemCard}>
                <View style={styles.itemRow}>
                  <View style={[styles.itemIconBox, { backgroundColor: c.primaryLight }]}>
                    <Layers size={18} color={c.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: c.textPrimary }]}>
                      {item.title || item.name || item.code || `${moduleName} #${item.id}`}
                    </Text>
                    <Text style={[styles.itemDesc, { color: c.textMuted }]}>
                      {item.description || item.category || `Record ID: ${item.id}`}
                    </Text>
                  </View>

                  <View style={styles.itemRight}>
                    {item.value !== undefined && (
                      <Text style={[styles.itemVal, { color: c.primary }]}>
                        ₹{parseFloat(String(item.value || 0)).toLocaleString('en-IN')}
                      </Text>
                    )}
                    <Badge label={item.status || 'Active'} variant="primary" size="sm" />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScreenContainer>

      {/* ── Add Entry Modal ─────────────────────────────────────────── */}
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
                  <Text style={[theme.typography.h3, { color: c.textPrimary }]}>New {moduleName}</Text>
                  <Text style={[theme.typography.caption, { color: c.textMuted }]}>
                    {moduleCategory} Entry
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
                <TextField label="Entry Title / Name *" placeholder="e.g. Standard Item Record" value={itemName} onChangeText={setItemName} />
                <TextField label="Description / Remarks" placeholder="Enter details..." value={itemDescription} onChangeText={setItemDescription} multiline />
                <TextField label="Amount / Value (₹)" placeholder="e.g. 5000" value={itemValue} onChangeText={setItemValue} keyboardType="numeric" />
              </ScrollView>

              <View style={{ marginTop: 14 }}>
                <PrimaryButton
                  title={`Save ${moduleName}`}
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
                      {selectedRecord.title || selectedRecord.name || `Entry #${selectedRecord.id}`}
                    </Text>
                    <Text style={[theme.typography.caption, { color: c.textMuted }]}>
                      {moduleName} Record Details
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedRecord(null)} style={styles.closeBtn}>
                    <X size={20} color={c.textMuted} />
                  </TouchableOpacity>
                </View>

                {selectedRecord.value !== undefined && (
                  <View style={[styles.amountBox, { backgroundColor: c.primaryLight }]}>
                    <Text style={[styles.amountLabel, { color: c.primary }]}>Record Valuation</Text>
                    <Text style={[styles.amountValue, { color: c.primary }]}>
                      ₹{parseFloat(String(selectedRecord.value || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                )}

                <View style={styles.metaRows}>
                  <View style={styles.metaRow}>
                    <Text style={[styles.metaLabel, { color: c.textMuted }]}>Status:</Text>
                    <Badge label={selectedRecord.status || 'Active'} variant="primary" />
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
                      <Text style={[styles.metaLabel, { color: c.textMuted }]}>Created Timestamp:</Text>
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
});
