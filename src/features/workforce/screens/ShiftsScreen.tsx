import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, TextInput } from "react-native";
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
import { Clock, Calendar, Plus, X, Search, Users, Edit3 } from "lucide-react-native";

interface Shift {
  id: number | string;
  name: string;
  start_time: string;
  end_time: string;
  duration_hours?: number;
  branch_id?: number | string;
  branch_name?: string;
  employee_count?: number;
  is_active: boolean;
  created_at?: string;
}

export const ShiftsScreen: React.FC = () => {
  const theme = useTheme();
  const c = theme.colors;
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  const activeShifts = shifts.filter(s => s.is_active).length;

  const fetchShifts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.SHIFTS);
      const data = normalizeApiResponse<Shift[]>(res.data);
      setShifts(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) { setError(e.message || "Failed to load shifts"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchShifts(); }, []);

  const handleCreate = async () => {
    if (!name.trim() || !startTime || !endTime) { Alert.alert("Required", "Name, start and end time are required."); return; }
    setSubmitting(true);
    try {
      await axiosClient.post(ENDPOINTS.SHIFTS, { name, start_time: startTime, end_time: endTime, is_active: true });
      Alert.alert("Created", `Shift "${name}" created.`);
      setAddModal(false); setName(""); setStartTime(""); setEndTime("");
      fetchShifts(true);
    } catch (e: any) { Alert.alert("Error", e.message || "Create failed."); }
    finally { setSubmitting(false); }
  };

  const filtered = shifts.filter(s => !search.trim() || String(s.name || "").toLowerCase().includes(search.toLowerCase()) || String(s.branch_name || "").toLowerCase().includes(search.toLowerCase()));

  if (loading && !refreshing) return (
    <ScreenContainer scrollable={false}><Header title="Shifts & Schedules" subtitle="Workforce Shifts" /><DashboardSkeleton /></ScreenContainer>
  );
  if (error && !shifts.length) return (
    <ScreenContainer scrollable={false}><Header title="Shifts & Schedules" subtitle="Workforce Shifts" /><ErrorState message={error} onRetry={fetchShifts} /></ScreenContainer>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchShifts(true)}>
        <Header title="Shifts & Schedules" subtitle="Workforce Schedule Management" rightAction={
          <TouchableOpacity onPress={() => setAddModal(true)} style={[styles.addBtn, { backgroundColor: c.primary }]} activeOpacity={0.8}>
            <Plus size={15} color="#FFF" strokeWidth={2.5} /><Text style={styles.addBtnText}>New</Text>
          </TouchableOpacity>
        } />

        <View style={styles.kpiRow}>
          <Card style={[styles.kpiCard, { backgroundColor: c.primaryLight }]}>
            <Clock size={14} color={c.primary} />
            <Text style={[styles.kpiLabel, { color: c.primary }]}>Total Shifts</Text>
            <Text style={[styles.kpiValue, { color: c.primary }]}>{shifts.length}</Text>
          </Card>
          <Card style={[styles.kpiCard, { backgroundColor: c.successLight }]}>
            <Calendar size={14} color={c.success} />
            <Text style={[styles.kpiLabel, { color: c.success }]}>Active</Text>
            <Text style={[styles.kpiValue, { color: c.success }]}>{activeShifts}</Text>
          </Card>
        </View>

        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : "#F1F5F9", borderColor: c.border }]}>
          <Search size={16} color={c.textMuted} />
          <TextInput placeholder="Search shifts..." placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} style={[styles.searchInput, { color: c.textPrimary }]} />
          {search ? <TouchableOpacity onPress={() => setSearch("")}><X size={14} color={c.textMuted} /></TouchableOpacity> : null}
        </View>

        {filtered.length === 0 ? (
          <EmptyState title="No Shifts" description="Create shift schedules for your workforce." />
        ) : filtered.map(shift => (
          <TouchableOpacity key={String(shift.id)} onPress={() => setSelectedShift(shift)} activeOpacity={0.8}>
            <Card style={styles.shiftCard}>
              <View style={styles.shiftRow}>
                <View style={[styles.shiftIcon, { backgroundColor: c.primaryLight }]}><Clock size={18} color={c.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.shiftName, { color: c.textPrimary }]}>{shift.name}</Text>
                  <Text style={[styles.shiftTime, { color: c.textMuted }]}>{shift.start_time} — {shift.end_time}</Text>
                  {shift.branch_name && <Text style={[styles.branchLabel, { color: c.textMuted }]}>Branch: {shift.branch_name}</Text>}
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Badge label={shift.is_active ? "ACTIVE" : "INACTIVE"} variant={shift.is_active ? "success" : "error"} size="sm" />
                  {shift.employee_count !== undefined && (
                    <View style={styles.empCount}>
                      <Users size={11} color={c.textMuted} />
                      <Text style={[styles.empCountText, { color: c.textMuted }]}>{shift.employee_count}</Text>
                    </View>
                  )}
                </View>
              </View>
              {shift.duration_hours !== undefined && (
                <View style={[styles.durationBadge, { backgroundColor: c.primaryLight }]}>
                  <Text style={[styles.durationText, { color: c.primary }]}>{shift.duration_hours}h shift</Text>
                </View>
              )}
            </Card>
          </TouchableOpacity>
        ))}
      </ScreenContainer>

      <Modal visible={addModal} animationType="slide" transparent onRequestClose={() => setAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
            <View style={styles.modalHeader}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>Create Shift</Text>
              <TouchableOpacity onPress={() => setAddModal(false)}><X size={22} color={c.textMuted} /></TouchableOpacity>
            </View>
            <TextField label="Shift Name *" placeholder="e.g. Morning Shift" value={name} onChangeText={setName} />
            <TextField label="Start Time *" placeholder="e.g. 09:00" value={startTime} onChangeText={setStartTime} />
            <TextField label="End Time *" placeholder="e.g. 17:00" value={endTime} onChangeText={setEndTime} />
            <View style={{ marginTop: 16 }}>
              <PrimaryButton title="Create Shift" onPress={handleCreate} loading={submitting} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!selectedShift} animationType="slide" transparent onRequestClose={() => setSelectedShift(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
            {selectedShift && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>{selectedShift.name}</Text>
                  <TouchableOpacity onPress={() => setSelectedShift(null)}><X size={22} color={c.textMuted} /></TouchableOpacity>
                </View>
                {[
                  { label: "Timing", value: `${selectedShift.start_time} — ${selectedShift.end_time}` },
                  { label: "Duration", value: selectedShift.duration_hours ? `${selectedShift.duration_hours} hours` : "N/A" },
                  { label: "Branch", value: selectedShift.branch_name || "All Branches" },
                  { label: "Staff Count", value: String(selectedShift.employee_count || 0) },
                  { label: "Status", value: selectedShift.is_active ? "Active" : "Inactive" },
                ].map(row => (
                  <View key={row.label} style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: c.textMuted }]}>{row.label}:</Text>
                    <Text style={[styles.detailVal, { color: c.textPrimary }]}>{row.value}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  addBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, gap: 4 },
  addBtnText: { color: "#FFF", fontSize: 12, fontWeight: "800" },
  kpiRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  kpiCard: { flex: 1, padding: 12, alignItems: "center", gap: 4 },
  kpiLabel: { fontSize: 9.5, fontWeight: "700", textTransform: "uppercase", textAlign: "center" },
  kpiValue: { fontSize: 16, fontWeight: "800" },
  searchBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, height: 44, marginBottom: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 13 },
  shiftCard: { marginVertical: 4, padding: 12 },
  shiftRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  shiftIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  shiftName: { fontSize: 14, fontWeight: "700" },
  shiftTime: { fontSize: 12, marginTop: 2 },
  branchLabel: { fontSize: 11, marginTop: 2 },
  empCount: { flexDirection: "row", alignItems: "center", gap: 3 },
  empCountText: { fontSize: 11 },
  durationBadge: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start" },
  durationText: { fontSize: 11, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, padding: 22, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(148,163,184,0.15)" },
  detailLabel: { fontSize: 13, fontWeight: "500" },
  detailVal: { fontSize: 13, fontWeight: "700" },
});