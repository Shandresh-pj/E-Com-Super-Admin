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
import { ClipboardList, CheckCircle, XCircle, Clock, Plus, X, Search, User } from "lucide-react-native";

interface WorkforceRequest {
  id: number | string;
  type: string;
  employee_id?: number | string;
  employee_name?: string;
  description?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  from_date?: string;
  to_date?: string;
  rejection_reason?: string;
  created_at?: string;
}

export const WorkforceRequestsScreen: React.FC = () => {
  const theme = useTheme();
  const c = theme.colors;
  const [requests, setRequests] = useState<WorkforceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("PENDING");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<WorkforceRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const pendingCount = requests.filter(r => r.status === "PENDING").length;

  const fetchRequests = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.WORKFORCE_REQUESTS);
      const data = normalizeApiResponse<WorkforceRequest[]>(res.data);
      setRequests(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) { setError(e.message || "Failed to load workforce requests"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async (id: number | string, action: "APPROVED" | "REJECTED") => {
    if (action === "REJECTED" && !rejectReason.trim()) { Alert.alert("Required", "Please enter a rejection reason."); return; }
    setActionLoading(true);
    try {
      await axiosClient.post(`${ENDPOINTS.WORKFORCE_REQUESTS}/${id}/action`, { action, rejection_reason: action === "REJECTED" ? rejectReason : undefined });
      Alert.alert("Done", `Request ${action === "APPROVED" ? "approved" : "rejected"}.`);
      setSelectedRequest(null); setRejectReason(""); fetchRequests(true);
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
  const filtered = requests.filter(r => {
    const matchStatus = filterStatus === "ALL" || r.status === filterStatus;
    const matchSearch = !search.trim() || String(r.type || "").toLowerCase().includes(search.toLowerCase()) || String(r.employee_name || "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  if (loading && !refreshing) return <ScreenContainer scrollable={false}><Header title="Workforce Requests" subtitle="Employee Requests" /><DashboardSkeleton /></ScreenContainer>;
  if (error && !requests.length) return <ScreenContainer scrollable={false}><Header title="Workforce Requests" subtitle="Employee Requests" /><ErrorState message={error} onRetry={fetchRequests} /></ScreenContainer>;

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchRequests(true)}>
        <Header title="Workforce Requests" subtitle="Employee Request Management" />

        <View style={styles.kpiRow}>
          <Card style={[styles.kpiCard, { backgroundColor: "rgba(245,158,11,0.12)" }]}>
            <Clock size={14} color={c.warning} />
            <Text style={[styles.kpiLabel, { color: c.warning }]}>Pending</Text>
            <Text style={[styles.kpiValue, { color: c.warning }]}>{pendingCount}</Text>
          </Card>
          <Card style={[styles.kpiCard, { backgroundColor: c.successLight }]}>
            <CheckCircle size={14} color={c.success} />
            <Text style={[styles.kpiLabel, { color: c.success }]}>Approved</Text>
            <Text style={[styles.kpiValue, { color: c.success }]}>{requests.filter(r => r.status === "APPROVED").length}</Text>
          </Card>
          <Card style={[styles.kpiCard, { backgroundColor: "rgba(239,68,68,0.1)" }]}>
            <XCircle size={14} color={c.error} />
            <Text style={[styles.kpiLabel, { color: c.error }]}>Rejected</Text>
            <Text style={[styles.kpiValue, { color: c.error }]}>{requests.filter(r => r.status === "REJECTED").length}</Text>
          </Card>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 8 }}>
          {STATUSES.map(s => <TouchableOpacity key={s} style={[styles.filterChip, { backgroundColor: filterStatus === s ? c.primary : (theme.isDark ? c.surfaceSecondary : "#F1F5F9"), borderColor: filterStatus === s ? c.primary : c.border }]} onPress={() => setFilterStatus(s)}><Text style={[styles.filterChipText, { color: filterStatus === s ? "#FFF" : c.textSecondary }]}>{s}</Text></TouchableOpacity>)}
        </ScrollView>

        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : "#F1F5F9", borderColor: c.border }]}>
          <Search size={16} color={c.textMuted} /><TextInput placeholder="Search requests..." placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} style={[styles.searchInput, { color: c.textPrimary }]} />
          {search ? <TouchableOpacity onPress={() => setSearch("")}><X size={14} color={c.textMuted} /></TouchableOpacity> : null}
        </View>

        {filtered.length === 0 ? <EmptyState title="No Requests" description={filterStatus === "PENDING" ? "No pending requests!" : "No requests match your filter."} /> : filtered.map(req => (
          <TouchableOpacity key={String(req.id)} onPress={() => { setSelectedRequest(req); setRejectReason(""); }} activeOpacity={0.8}>
            <Card style={styles.reqCard}>
              <View style={styles.reqRow}>
                <View style={[styles.reqIcon, { backgroundColor: c.primaryLight }]}><ClipboardList size={18} color={c.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.reqType, { color: c.textPrimary }]}>{req.type}</Text>
                  <Text style={[styles.reqEmp, { color: c.textMuted }]}>{req.employee_name || `Employee #${req.employee_id}`}</Text>
                  {req.from_date && <Text style={[styles.reqDate, { color: c.textMuted }]}>{new Date(req.from_date).toLocaleDateString("en-IN")}{req.to_date ? ` — ${new Date(req.to_date).toLocaleDateString("en-IN")}` : ""}</Text>}
                </View>
                <Badge label={req.status} variant={getStatusVariant(req.status)} size="sm" />
              </View>
              {req.status === "PENDING" && (
                <View style={styles.quickActions}>
                  <TouchableOpacity style={[styles.qaBtn, { backgroundColor: c.successLight }]} onPress={() => handleAction(req.id, "APPROVED")}><CheckCircle size={13} color={c.success} /><Text style={[styles.qaBtnText, { color: c.success }]}>Approve</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.qaBtn, { backgroundColor: "rgba(239,68,68,0.1)" }]} onPress={() => { setSelectedRequest(req); setRejectReason(""); }}><XCircle size={13} color={c.error} /><Text style={[styles.qaBtnText, { color: c.error }]}>Reject</Text></TouchableOpacity>
                </View>
              )}
            </Card>
          </TouchableOpacity>
        ))}
      </ScreenContainer>

      <Modal visible={!!selectedRequest} animationType="slide" transparent onRequestClose={() => setSelectedRequest(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
            {selectedRequest && (
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.modalHeader}><Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>Request Detail</Text><TouchableOpacity onPress={() => setSelectedRequest(null)}><X size={22} color={c.textMuted} /></TouchableOpacity></View>
                <Badge label={selectedRequest.status} variant={getStatusVariant(selectedRequest.status)} />
                <View style={{ marginTop: 12 }}>
                  {[
                    { label: "Type", value: selectedRequest.type },
                    { label: "Employee", value: selectedRequest.employee_name || `Employee #${selectedRequest.employee_id}` },
                    { label: "From", value: selectedRequest.from_date ? new Date(selectedRequest.from_date).toLocaleDateString("en-IN") : "N/A" },
                    { label: "To", value: selectedRequest.to_date ? new Date(selectedRequest.to_date).toLocaleDateString("en-IN") : "N/A" },
                    { label: "Description", value: selectedRequest.description || "N/A" },
                    { label: "Submitted", value: selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleString("en-IN") : "N/A" },
                  ].map(row => (
                    <View key={row.label} style={styles.detailRow}><Text style={[styles.detailLabel, { color: c.textMuted }]}>{row.label}:</Text><Text style={[styles.detailVal, { color: c.textPrimary }]}>{row.value}</Text></View>
                  ))}
                </View>
                {selectedRequest.status === "PENDING" && (
                  <>
                    <TextField label="Rejection Reason (if rejecting)" placeholder="Enter reason..." value={rejectReason} onChangeText={setRejectReason} multiline />
                    <View style={styles.actionBtns}>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: c.success }]} onPress={() => handleAction(selectedRequest.id, "APPROVED")}><CheckCircle size={15} color="#FFF" /><Text style={styles.actionBtnText}>Approve</Text></TouchableOpacity>
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: c.error }]} onPress={() => handleAction(selectedRequest.id, "REJECTED")}><XCircle size={15} color="#FFF" /><Text style={styles.actionBtnText}>Reject</Text></TouchableOpacity>
                    </View>
                  </>
                )}
                {selectedRequest.rejection_reason && <View style={[styles.rejectionBox, { backgroundColor: "rgba(239,68,68,0.1)" }]}><Text style={[styles.rejectionLabel, { color: c.error }]}>Rejection Reason:</Text><Text style={[styles.rejectionText, { color: c.error }]}>{selectedRequest.rejection_reason}</Text></View>}
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
  reqCard: { marginVertical: 4, padding: 12 },
  reqRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  reqIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  reqType: { fontSize: 13, fontWeight: "700" },
  reqEmp: { fontSize: 11, marginTop: 2 },
  reqDate: { fontSize: 10, marginTop: 2 },
  quickActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  qaBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 7, borderRadius: 10, gap: 5 },
  qaBtnText: { fontSize: 11, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, padding: 22, maxHeight: "88%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(148,163,184,0.15)" },
  detailLabel: { fontSize: 13, fontWeight: "500" },
  detailVal: { fontSize: 13, fontWeight: "700", maxWidth: "60%", textAlign: "right" },
  actionBtns: { flexDirection: "row", gap: 10, marginTop: 14 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 12, gap: 6 },
  actionBtnText: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  rejectionBox: { padding: 12, borderRadius: 12, marginTop: 10 },
  rejectionLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  rejectionText: { fontSize: 12, marginTop: 4, fontWeight: "600" },
});