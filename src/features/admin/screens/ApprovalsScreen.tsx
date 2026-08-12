import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, TextInput } from "react-native";
import { ScreenContainer } from "../../../components/common/ScreenContainer";
import { Header } from "../../../components/common/Header";
import { Card } from "../../../components/common/Card";
import { Badge } from "../../../components/common/Badge";
import { TextField } from "../../../components/inputs/TextField";
import { DashboardSkeleton } from "../../../components/skeletons/SkeletonLoader";
import { EmptyState, ErrorState } from "../../../components/common/States";
import { useTheme } from "../../../theme/theme";
import { axiosClient } from "../../../api/axiosClient";
import { ENDPOINTS } from "../../../api/endpoints";
import { normalizeApiResponse } from "../../../api/responseNormalizer";
import { CheckSquare, CheckCircle, XCircle, Clock, Search, X, FileText } from "lucide-react-native";

interface ApprovalItem {
  id: number | string;
  type?: string;
  entity?: string;
  entity_id?: number | string;
  title?: string;
  description?: string;
  requested_by?: string;
  requested_by_name?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  reviewed_by?: string;
  rejection_reason?: string;
  created_at?: string;
  updated_at?: string;
}

export const ApprovalsScreen: React.FC = () => {
  const theme = useTheme();
  const c = theme.colors;
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("PENDING");
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const pendingCount = approvals.filter(a => a.status === "PENDING").length;

  const fetchApprovals = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.APPROVALS);
      const data = normalizeApiResponse<ApprovalItem[]>(res.data);
      setApprovals(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) { setError(e.message || "Failed to load approvals"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchApprovals(); }, []);

  const handleAction = async (id: number | string, action: "APPROVED" | "REJECTED") => {
    if (action === "REJECTED" && !rejectReason.trim()) {
      Alert.alert("Required", "Please provide a rejection reason.");
      return;
    }
    setActionLoading(true);
    try {
      await axiosClient.post(ENDPOINTS.APPROVAL_ACTION(id), {
        action,
        rejection_reason: action === "REJECTED" ? rejectReason : undefined,
      });
      Alert.alert("Done", `Request ${action === "APPROVED" ? "approved" : "rejected"} successfully.`);
      setSelectedItem(null); setRejectReason("");
      fetchApprovals(true);
    } catch (e: any) { Alert.alert("Error", e.message || "Action failed."); }
    finally { setActionLoading(false); }
  };

  const getStatusVariant = (s: string): "success" | "warning" | "error" | "primary" => {
    if (s === "APPROVED") return "success";
    if (s === "PENDING") return "warning";
    if (s === "REJECTED") return "error";
    return "primary";
  };

  const STATUSES = ["ALL", "PENDING", "APPROVED", "REJECTED"];

  const filtered = approvals.filter(a => {
    const matchStatus = filterStatus === "ALL" || a.status === filterStatus;
    const matchSearch = !search.trim() || String(a.title || a.entity || "").toLowerCase().includes(search.toLowerCase()) || String(a.requested_by_name || "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  if (loading && !refreshing) return (
    <ScreenContainer scrollable={false}><Header title="Approvals" subtitle="Workflow Approvals" /><DashboardSkeleton /></ScreenContainer>
  );
  if (error && !approvals.length) return (
    <ScreenContainer scrollable={false}><Header title="Approvals" subtitle="Workflow Approvals" /><ErrorState message={error} onRetry={fetchApprovals} /></ScreenContainer>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchApprovals(true)}>
        <Header title="Approvals" subtitle="Workflow Approval Engine" />

        <View style={styles.kpiRow}>
          <Card style={[styles.kpiCard, { backgroundColor: "rgba(245,158,11,0.12)" }]}>
            <Clock size={14} color={c.warning} />
            <Text style={[styles.kpiLabel, { color: c.warning }]}>Pending</Text>
            <Text style={[styles.kpiValue, { color: c.warning }]}>{pendingCount}</Text>
          </Card>
          <Card style={[styles.kpiCard, { backgroundColor: c.successLight }]}>
            <CheckCircle size={14} color={c.success} />
            <Text style={[styles.kpiLabel, { color: c.success }]}>Approved</Text>
            <Text style={[styles.kpiValue, { color: c.success }]}>{approvals.filter(a => a.status === "APPROVED").length}</Text>
          </Card>
          <Card style={[styles.kpiCard, { backgroundColor: "rgba(239,68,68,0.1)" }]}>
            <XCircle size={14} color={c.error} />
            <Text style={[styles.kpiLabel, { color: c.error }]}>Rejected</Text>
            <Text style={[styles.kpiValue, { color: c.error }]}>{approvals.filter(a => a.status === "REJECTED").length}</Text>
          </Card>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 8 }}>
          {STATUSES.map(s => (
            <TouchableOpacity key={s} style={[styles.filterChip, { backgroundColor: filterStatus === s ? c.primary : (theme.isDark ? c.surfaceSecondary : "#F1F5F9"), borderColor: filterStatus === s ? c.primary : c.border }]} onPress={() => setFilterStatus(s)}>
              <Text style={[styles.filterChipText, { color: filterStatus === s ? "#FFF" : c.textSecondary }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : "#F1F5F9", borderColor: c.border }]}>
          <Search size={16} color={c.textMuted} />
          <TextInput placeholder="Search approvals..." placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} style={[styles.searchInput, { color: c.textPrimary }]} />
          {search ? <TouchableOpacity onPress={() => setSearch("")}><X size={14} color={c.textMuted} /></TouchableOpacity> : null}
        </View>

        {filtered.length === 0 ? (
          <EmptyState title="No Approvals" description={filterStatus === "PENDING" ? "No pending approvals. All caught up!" : "No approval records match your filter."} />
        ) : filtered.map(item => (
          <TouchableOpacity key={String(item.id)} onPress={() => { setSelectedItem(item); setRejectReason(""); }} activeOpacity={0.8}>
            <Card style={styles.approvalCard}>
              <View style={styles.approvalRow}>
                <View style={[styles.approvalIcon, { backgroundColor: c.primaryLight }]}><CheckSquare size={18} color={c.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: c.textPrimary }]}>{item.title || `${item.entity || "Request"} #${item.entity_id || item.id}`}</Text>
                  <Text style={[styles.subText, { color: c.textMuted }]}>{item.type || "General"} • {item.requested_by_name || `User #${item.requested_by}`}</Text>
                  {item.description && <Text style={[styles.desc, { color: c.textMuted }]} numberOfLines={1}>{item.description}</Text>}
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Badge label={item.status} variant={getStatusVariant(item.status)} size="sm" />
                  {item.created_at && <Text style={[styles.date, { color: c.textMuted }]}>{new Date(item.created_at).toLocaleDateString("en-IN")}</Text>}
                </View>
              </View>
              {item.status === "PENDING" && (
                <View style={styles.quickActions}>
                  <TouchableOpacity style={[styles.qaBtn, { backgroundColor: c.successLight }]} onPress={() => handleAction(item.id, "APPROVED")}>
                    <CheckCircle size={13} color={c.success} /><Text style={[styles.qaBtnText, { color: c.success }]}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.qaBtn, { backgroundColor: "rgba(239,68,68,0.1)" }]} onPress={() => { setSelectedItem(item); setRejectReason(""); }}>
                    <XCircle size={13} color={c.error} /><Text style={[styles.qaBtnText, { color: c.error }]}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Card>
          </TouchableOpacity>
        ))}
      </ScreenContainer>

      <Modal visible={!!selectedItem} animationType="slide" transparent onRequestClose={() => setSelectedItem(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
            {selectedItem && (
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.modalHeader}>
                  <Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>Review Request</Text>
                  <TouchableOpacity onPress={() => setSelectedItem(null)}><X size={22} color={c.textMuted} /></TouchableOpacity>
                </View>
                {[
                  { label: "Title", value: selectedItem.title || `${selectedItem.entity} #${selectedItem.entity_id}` },
                  { label: "Type", value: selectedItem.type || "General" },
                  { label: "Requested By", value: selectedItem.requested_by_name || `User #${selectedItem.requested_by}` },
                  { label: "Description", value: selectedItem.description || "N/A" },
                  { label: "Date", value: selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleString("en-IN") : "N/A" },
                ].map(row => (
                  <View key={row.label} style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: c.textMuted }]}>{row.label}:</Text>
                    <Text style={[styles.detailVal, { color: c.textPrimary }]}>{row.value}</Text>
                  </View>
                ))}
                {selectedItem.status === "PENDING" && (
                  <>
                    <TextField label="Rejection Reason (if rejecting)" placeholder="Enter reason for rejection..." value={rejectReason} onChangeText={setRejectReason} multiline />
                    <View style={styles.actionBtns}>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: c.success }]} onPress={() => handleAction(selectedItem.id, "APPROVED")}>
                        <CheckCircle size={15} color="#FFF" /><Text style={styles.actionBtnText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: c.error }]} onPress={() => handleAction(selectedItem.id, "REJECTED")}>
                        <XCircle size={15} color="#FFF" /><Text style={styles.actionBtnText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
                {selectedItem.rejection_reason && (
                  <View style={[styles.rejectionBox, { backgroundColor: "rgba(239,68,68,0.1)" }]}>
                    <Text style={[styles.rejectionLabel, { color: c.error }]}>Rejection Reason:</Text>
                    <Text style={[styles.rejectionText, { color: c.error }]}>{selectedItem.rejection_reason}</Text>
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
  kpiRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  kpiCard: { flex: 1, padding: 12, alignItems: "center", gap: 4 },
  kpiLabel: { fontSize: 9.5, fontWeight: "700", textTransform: "uppercase", textAlign: "center" },
  kpiValue: { fontSize: 16, fontWeight: "800" },
  filterRow: { marginBottom: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontSize: 11, fontWeight: "700" },
  searchBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, height: 44, marginBottom: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 13 },
  approvalCard: { marginVertical: 4, padding: 12 },
  approvalRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  approvalIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 13, fontWeight: "700" },
  subText: { fontSize: 11, marginTop: 2 },
  desc: { fontSize: 11, marginTop: 2 },
  date: { fontSize: 10 },
  quickActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  qaBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 7, borderRadius: 10, gap: 5 },
  qaBtnText: { fontSize: 11, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, padding: 22, maxHeight: "88%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(148,163,184,0.15)" },
  detailLabel: { fontSize: 13, fontWeight: "500" },
  detailVal: { fontSize: 13, fontWeight: "700", maxWidth: "60%", textAlign: "right" },
  actionBtns: { flexDirection: "row", gap: 10, marginTop: 16 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 12, gap: 6 },
  actionBtnText: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  rejectionBox: { padding: 12, borderRadius: 12, marginTop: 12 },
  rejectionLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  rejectionText: { fontSize: 12, marginTop: 4, fontWeight: "600" },
});