import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, TextInput,
} from "react-native";
import { ScreenContainer } from "../../../components/common/ScreenContainer";
import { Header } from "../../../components/common/Header";
import { Card } from "../../../components/common/Card";
import { Badge } from "../../../components/common/Badge";
import { PrimaryButton } from "../../../components/buttons/PrimaryButton";
import { TextField } from "../../../components/inputs/TextField";
import { DashboardSkeleton } from "../../../components/skeletons/SkeletonLoader";
import { EmptyState, ErrorState } from "../../../components/common/States";
import { useTheme } from "../../../theme/theme";
import { axiosClient } from "../../../api/axiosClient";
import { ENDPOINTS } from "../../../api/endpoints";
import { normalizeApiResponse } from "../../../api/responseNormalizer";
import { Plane, User, Calendar, CheckCircle, XCircle, Clock, Plus, X, Search } from "lucide-react-native";

interface LeaveRecord {
  id: number | string;
  employee_id?: number | string;
  employee_name?: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  approved_by?: string;
  created_at?: string;
}

export const LeaveScreen: React.FC = () => {
  const theme = useTheme();
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [leaveType, setLeaveType] = useState("Casual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);
  const c = theme.colors;

  const totalPending = leaves.filter(l => l.status === "PENDING").length;
  const totalApproved = leaves.filter(l => l.status === "APPROVED").length;

  const fetchLeaves = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.LEAVE);
      const data = normalizeApiResponse<LeaveRecord[]>(res.data);
      setLeaves(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) {
      setError(e.message || "Failed to load leave records");
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchLeaves(); }, []);

  const handleApprove = async (id: number | string, approve: boolean) => {
    try {
      const ep = approve ? ENDPOINTS.LEAVE_APPROVE(id) : ENDPOINTS.LEAVE_REJECT(id);
      await axiosClient.patch(ep);
      Alert.alert("Done", `Leave ${approve ? "approved" : "rejected"}.`);
      fetchLeaves(true);
      setSelectedLeave(null);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Action failed.");
    }
  };

  const handleApplyLeave = async () => {
    if (!startDate || !endDate) { Alert.alert("Required", "Please fill start and end dates."); return; }
    setSubmitting(true);
    try {
      await axiosClient.post(ENDPOINTS.LEAVE_REQUEST, { leave_type: leaveType, start_date: startDate, end_date: endDate, reason });
      Alert.alert("Applied", "Leave request submitted successfully.");
      setAddModal(false);
      setStartDate(""); setEndDate(""); setReason("");
      fetchLeaves(true);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to apply leave.");
    } finally { setSubmitting(false); }
  };

  const filtered = leaves.filter(l => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(l.employee_name || "").toLowerCase().includes(q) ||
      String(l.leave_type || "").toLowerCase().includes(q) ||
      String(l.status || "").toLowerCase().includes(q)
    );
  });

  const getStatusVariant = (status: string): "success" | "warning" | "error" | "primary" => {
    if (status === "APPROVED") return "success";
    if (status === "PENDING") return "warning";
    if (status === "REJECTED") return "error";
    return "primary";
  };

  if (loading && !refreshing) return (
    <ScreenContainer scrollable={false}>
      <Header title="Leave Management" subtitle="Staff Leave Tracker" />
      <DashboardSkeleton />
    </ScreenContainer>
  );

  if (error && !leaves.length) return (
    <ScreenContainer scrollable={false}>
      <Header title="Leave Management" subtitle="Staff Leave Tracker" />
      <ErrorState message={error} onRetry={() => fetchLeaves()} />
    </ScreenContainer>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchLeaves(true)}>
        <Header
          title="Leave Management"
          subtitle="Staff Leave Applications"
          rightAction={
            <TouchableOpacity onPress={() => setAddModal(true)} style={[styles.addBtn, { backgroundColor: c.primary }]} activeOpacity={0.8}>
              <Plus size={15} color="#FFF" strokeWidth={2.5} />
              <Text style={styles.addBtnText}>Apply</Text>
            </TouchableOpacity>
          }
        />

        <View style={styles.kpiRow}>
          <Card style={[styles.kpiCard, { backgroundColor: "rgba(245,158,11,0.12)" }]}>
            <Clock size={15} color={c.warning} />
            <Text style={[styles.kpiLabel, { color: c.warning }]}>Pending</Text>
            <Text style={[styles.kpiValue, { color: c.warning }]}>{totalPending}</Text>
          </Card>
          <Card style={[styles.kpiCard, { backgroundColor: c.successLight }]}>
            <CheckCircle size={15} color={c.success} />
            <Text style={[styles.kpiLabel, { color: c.success }]}>Approved</Text>
            <Text style={[styles.kpiValue, { color: c.success }]}>{totalApproved}</Text>
          </Card>
          <Card style={[styles.kpiCard, { backgroundColor: c.primaryLight }]}>
            <Plane size={15} color={c.primary} />
            <Text style={[styles.kpiLabel, { color: c.primary }]}>Total</Text>
            <Text style={[styles.kpiValue, { color: c.primary }]}>{leaves.length}</Text>
          </Card>
        </View>

        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : "#F1F5F9", borderColor: c.border }]}>
          <Search size={16} color={c.textMuted} />
          <TextInput
            placeholder="Search by name, type, status..."
            placeholderTextColor={c.textMuted}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: c.textPrimary }]}
          />
          {search ? <TouchableOpacity onPress={() => setSearch("")}><X size={14} color={c.textMuted} /></TouchableOpacity> : null}
        </View>

        {filtered.length === 0 ? (
          <EmptyState title="No Leave Records" description="No leave applications found." />
        ) : (
          filtered.map(item => (
            <TouchableOpacity key={String(item.id)} onPress={() => setSelectedLeave(item)} activeOpacity={0.8}>
              <Card style={styles.leaveCard}>
                <View style={styles.cardRow}>
                  <View style={[styles.iconBox, { backgroundColor: c.primaryLight }]}>
                    <Plane size={16} color={c.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.empName, { color: c.textPrimary }]}>
                      {item.employee_name || `Employee #${item.employee_id || "N/A"}`}
                    </Text>
                    <Text style={[styles.leaveType, { color: c.textMuted }]}>
                      {item.leave_type} · {new Date(item.start_date).toLocaleDateString("en-IN")} – {new Date(item.end_date).toLocaleDateString("en-IN")}
                    </Text>
                  </View>
                  <Badge label={item.status} variant={getStatusVariant(item.status)} size="sm" />
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScreenContainer>

      {/* Apply Leave Modal */}
      <Modal visible={addModal} animationType="slide" transparent onRequestClose={() => setAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFFFFF", borderColor: c.border }]}>
            <View style={styles.modalHeader}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>Apply Leave</Text>
              <TouchableOpacity onPress={() => setAddModal(false)}><X size={22} color={c.textMuted} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.pickerLabel, { color: c.textSecondary }]}>Leave Type:</Text>
              <View style={styles.typesRow}>
                {["Casual", "Sick", "Earned", "Maternity", "Emergency"].map(t => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setLeaveType(t)}
                    style={[styles.typeChip, { backgroundColor: leaveType === t ? c.primary : c.surfaceSecondary, borderColor: leaveType === t ? c.primary : c.border }]}
                  >
                    <Text style={[styles.typeChipText, { color: leaveType === t ? "#FFF" : c.textSecondary }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextField label="Start Date (YYYY-MM-DD)" placeholder="e.g. 2025-01-20" value={startDate} onChangeText={setStartDate} />
              <TextField label="End Date (YYYY-MM-DD)" placeholder="e.g. 2025-01-22" value={endDate} onChangeText={setEndDate} />
              <TextField label="Reason" placeholder="Reason for leave..." value={reason} onChangeText={setReason} multiline />
            </ScrollView>
            <View style={{ marginTop: 14 }}>
              <PrimaryButton title="Submit Leave Request" onPress={handleApplyLeave} loading={submitting} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={!!selectedLeave} animationType="slide" transparent onRequestClose={() => setSelectedLeave(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFFFFF", borderColor: c.border }]}>
            {selectedLeave && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>
                      {selectedLeave.employee_name || `Employee #${selectedLeave.employee_id}`}
                    </Text>
                    <Text style={{ fontSize: 12, color: c.textMuted }}>{selectedLeave.leave_type}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedLeave(null)}><X size={22} color={c.textMuted} /></TouchableOpacity>
                </View>

                {[
                  { label: "Status", badge: true, value: selectedLeave.status },
                  { label: "Start Date", value: new Date(selectedLeave.start_date).toLocaleDateString("en-IN") },
                  { label: "End Date", value: new Date(selectedLeave.end_date).toLocaleDateString("en-IN") },
                  { label: "Reason", value: selectedLeave.reason || "N/A" },
                ].map(row => (
                  <View key={row.label} style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: c.textMuted }]}>{row.label}:</Text>
                    {row.badge
                      ? <Badge label={row.value || ""} variant={getStatusVariant(row.value || "")} />
                      : <Text style={[styles.detailVal, { color: c.textPrimary }]}>{row.value}</Text>}
                  </View>
                ))}

                {selectedLeave.status === "PENDING" && (
                  <View style={styles.approvalRow}>
                    <TouchableOpacity style={[styles.approvalBtn, { backgroundColor: c.success }]} onPress={() => handleApprove(selectedLeave.id, true)}>
                      <CheckCircle size={14} color="#FFF" />
                      <Text style={styles.approvalBtnText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.approvalBtn, { backgroundColor: c.error }]} onPress={() => handleApprove(selectedLeave.id, false)}>
                      <XCircle size={14} color="#FFF" />
                      <Text style={styles.approvalBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
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
  leaveCard: { marginVertical: 5, padding: 14 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  empName: { fontSize: 14, fontWeight: "700" },
  leaveType: { fontSize: 11, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, padding: 22, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  pickerLabel: { fontSize: 12, fontWeight: "700", marginTop: 6, marginBottom: 6 },
  typesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  typeChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  typeChipText: { fontSize: 11, fontWeight: "700" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(148,163,184,0.15)" },
  detailLabel: { fontSize: 13, fontWeight: "500" },
  detailVal: { fontSize: 13, fontWeight: "700", maxWidth: "55%", textAlign: "right" },
  approvalRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  approvalBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 12, gap: 6 },
  approvalBtnText: { color: "#FFF", fontSize: 13, fontWeight: "700" },
});