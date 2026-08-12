import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, TextInput, Switch } from "react-native";
import { ScreenContainer } from "../../../components/common/ScreenContainer";
import { Header } from "../../../components/common/Header";
import { Card } from "../../../components/common/Card";
import { Badge } from "../../../components/common/Badge";
import { TextField } from "../../../components/inputs/TextField";
import { PrimaryButton } from "../../../components/buttons/PrimaryButton";
import { DashboardSkeleton } from "../../../components/skeletons/SkeletonLoader";
import { EmptyState, ErrorState } from "../../../components/common/States";
import { useTheme } from "../../../theme/theme";
import { axiosClient } from "../../../api/axiosClient";
import { ENDPOINTS } from "../../../api/endpoints";
import { normalizeApiResponse } from "../../../api/responseNormalizer";
import { Coffee, Plus, X, Edit3, Trash2, Clock, IndianRupee } from "lucide-react-native";

interface BreakPolicy {
  id: number | string;
  name: string;
  max_break_minutes: number;
  deduction_per_minute?: number;
  grace_minutes?: number;
  is_paid_break?: boolean;
  is_active: boolean;
  branch_id?: number | string;
  branch_name?: string;
}

export const BreakPoliciesScreen: React.FC = () => {
  const theme = useTheme();
  const c = theme.colors;
  const [policies, setPolicies] = useState<BreakPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selected, setSelected] = useState<BreakPolicy | null>(null);
  const [name, setName] = useState("");
  const [maxBreak, setMaxBreak] = useState("");
  const [deductionRate, setDeductionRate] = useState("");
  const [grace, setGrace] = useState("");
  const [isPaidBreak, setIsPaidBreak] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchPolicies = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.BREAK_POLICIES);
      const data = normalizeApiResponse<BreakPolicy[]>(res.data);
      setPolicies(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) { setError(e.message || "Failed to load break policies"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchPolicies(); }, []);

  const openAdd = () => { setName(""); setMaxBreak(""); setDeductionRate(""); setGrace(""); setIsPaidBreak(false); setIsActive(true); setAddModal(true); };
  const openEdit = (p: BreakPolicy) => { setSelected(p); setName(p.name); setMaxBreak(String(p.max_break_minutes)); setDeductionRate(String(p.deduction_per_minute || "")); setGrace(String(p.grace_minutes || "")); setIsPaidBreak(p.is_paid_break || false); setIsActive(p.is_active); setEditModal(true); };

  const handleCreate = async () => {
    if (!name || !maxBreak) { Alert.alert("Required", "Name and max break minutes are required."); return; }
    setSubmitting(true);
    try {
      await axiosClient.post(ENDPOINTS.BREAK_POLICIES, { name, max_break_minutes: parseInt(maxBreak), deduction_per_minute: deductionRate ? parseFloat(deductionRate) : undefined, grace_minutes: grace ? parseInt(grace) : 0, is_paid_break: isPaidBreak, is_active: isActive });
      Alert.alert("Created", "Break policy created.");
      setAddModal(false); fetchPolicies(true);
    } catch (e: any) { Alert.alert("Error", e.message || "Create failed."); }
    finally { setSubmitting(false); }
  };

  const handleUpdate = async () => {
    if (!selected || !name || !maxBreak) { Alert.alert("Required", "Name and max break minutes are required."); return; }
    setSubmitting(true);
    try {
      await axiosClient.put(`${ENDPOINTS.BREAK_POLICIES}/${selected.id}`, { name, max_break_minutes: parseInt(maxBreak), deduction_per_minute: deductionRate ? parseFloat(deductionRate) : undefined, grace_minutes: grace ? parseInt(grace) : 0, is_paid_break: isPaidBreak, is_active: isActive });
      Alert.alert("Updated", "Break policy updated.");
      setEditModal(false); fetchPolicies(true);
    } catch (e: any) { Alert.alert("Error", e.message || "Update failed."); }
    finally { setSubmitting(false); }
  };

  const handleDelete = (p: BreakPolicy) => {
    Alert.alert("Delete Policy", `Delete "${p.name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { try { await axiosClient.delete(`${ENDPOINTS.BREAK_POLICIES}/${p.id}`); fetchPolicies(true); } catch (e: any) { Alert.alert("Error", e.message || "Delete failed."); } } },
    ]);
  };

  const PolicyForm = ({ visible, title, onClose, onSubmit }: any) => (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
          <View style={styles.modalHeader}><Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>{title}</Text><TouchableOpacity onPress={onClose}><X size={22} color={c.textMuted} /></TouchableOpacity></View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 100 }}>
            <TextField label="Policy Name *" placeholder="e.g. Standard Break" value={name} onChangeText={setName} />
            <TextField label="Max Break (minutes) *" placeholder="e.g. 60" value={maxBreak} onChangeText={setMaxBreak} keyboardType="numeric" />
            <TextField label="Deduction Rate (₹/minute)" placeholder="e.g. 2.50" value={deductionRate} onChangeText={setDeductionRate} keyboardType="decimal-pad" />
            <TextField label="Grace Period (minutes)" placeholder="e.g. 5" value={grace} onChangeText={setGrace} keyboardType="numeric" />
            <View style={styles.switchRow}><Text style={[styles.switchLabel, { color: c.textSecondary }]}>Paid Break</Text><Switch value={isPaidBreak} onValueChange={setIsPaidBreak} trackColor={{ true: c.success }} thumbColor="#FFF" /></View>
            <View style={styles.switchRow}><Text style={[styles.switchLabel, { color: c.textSecondary }]}>Active</Text><Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: c.primary }} thumbColor="#FFF" /></View>
          </ScrollView>
          <PrimaryButton title={title.includes("Create") ? "Create Policy" : "Update Policy"} onPress={onSubmit} loading={submitting} />
        </View>
      </View>
    </Modal>
  );

  if (loading && !refreshing) return <ScreenContainer scrollable={false}><Header title="Break Policies" subtitle="Break Deduction Rules" /><DashboardSkeleton /></ScreenContainer>;
  if (error && !policies.length) return <ScreenContainer scrollable={false}><Header title="Break Policies" subtitle="Break Deduction Rules" /><ErrorState message={error} onRetry={fetchPolicies} /></ScreenContainer>;

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchPolicies(true)}>
        <Header title="Break Policies" subtitle="Break Deduction Rules Management" rightAction={
          <TouchableOpacity onPress={openAdd} style={[styles.addBtn, { backgroundColor: c.primary }]} activeOpacity={0.8}>
            <Plus size={15} color="#FFF" strokeWidth={2.5} /><Text style={styles.addBtnText}>New</Text>
          </TouchableOpacity>
        } />
        {policies.length === 0 ? <EmptyState title="No Break Policies" description="Create your first break deduction rule." /> : policies.map(p => (
          <Card key={String(p.id)} style={styles.policyCard}>
            <View style={styles.policyRow}>
              <View style={[styles.policyIcon, { backgroundColor: "rgba(245,158,11,0.12)" }]}><Coffee size={18} color={c.warning} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.policyName, { color: c.textPrimary }]}>{p.name}</Text>
                <View style={styles.metaRow}>
                  <Clock size={11} color={c.textMuted} />
                  <Text style={[styles.metaText, { color: c.textMuted }]}>Max {p.max_break_minutes}min</Text>
                  {p.grace_minutes ? <><Text style={{ color: c.textMuted, fontSize: 10 }}>•</Text><Text style={[styles.metaText, { color: c.textMuted }]}>Grace {p.grace_minutes}min</Text></> : null}
                  {p.is_paid_break ? <Badge label="PAID" variant="success" size="sm" /> : <Badge label="UNPAID" variant="warning" size="sm" />}
                </View>
                {p.deduction_per_minute !== undefined && p.deduction_per_minute > 0 && (
                  <View style={styles.deductRow}>
                    <IndianRupee size={11} color={c.error} />
                    <Text style={[styles.deductText, { color: c.error }]}>{p.deduction_per_minute}/min over-break deduction</Text>
                  </View>
                )}
              </View>
              <Badge label={p.is_active ? "ACTIVE" : "OFF"} variant={p.is_active ? "success" : "error"} size="sm" />
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: c.primaryLight }]} onPress={() => openEdit(p)} activeOpacity={0.8}><Edit3 size={13} color={c.primary} /><Text style={[styles.actionBtnText, { color: c.primary }]}>Edit</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "rgba(239,68,68,0.1)" }]} onPress={() => handleDelete(p)} activeOpacity={0.8}><Trash2 size={13} color={c.error} /></TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScreenContainer>
      <PolicyForm visible={addModal} title="Create Break Policy" onClose={() => setAddModal(false)} onSubmit={handleCreate} />
      <PolicyForm visible={editModal} title="Edit Break Policy" onClose={() => setEditModal(false)} onSubmit={handleUpdate} />
    </View>
  );
};

const styles = StyleSheet.create({
  addBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, gap: 4 },
  addBtnText: { color: "#FFF", fontSize: 12, fontWeight: "800" },
  policyCard: { marginVertical: 5, padding: 14 },
  policyRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  policyIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  policyName: { fontSize: 14, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" },
  metaText: { fontSize: 11 },
  deductRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  deductText: { fontSize: 11, fontWeight: "600" },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: 10, gap: 5 },
  actionBtnText: { fontSize: 11, fontWeight: "700" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  switchLabel: { fontSize: 13, fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, padding: 22, maxHeight: "88%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
});