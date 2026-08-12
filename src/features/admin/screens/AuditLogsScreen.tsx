import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput } from "react-native";
import { ScreenContainer } from "../../../components/common/ScreenContainer";
import { Header } from "../../../components/common/Header";
import { Card } from "../../../components/common/Card";
import { Badge } from "../../../components/common/Badge";
import { DashboardSkeleton } from "../../../components/skeletons/SkeletonLoader";
import { EmptyState, ErrorState } from "../../../components/common/States";
import { useTheme } from "../../../theme/theme";
import { axiosClient } from "../../../api/axiosClient";
import { ENDPOINTS } from "../../../api/endpoints";
import { normalizeApiResponse } from "../../../api/responseNormalizer";
import { ClipboardList, User, Search, X, Shield, Calendar } from "lucide-react-native";

interface AuditLog {
  id: number | string;
  user_id?: number | string;
  user_name?: string;
  action: string;
  entity?: string;
  entity_id?: number | string;
  details?: string;
  ip_address?: string;
  status?: string;
  created_at?: string;
}

export const AuditLogsScreen: React.FC = () => {
  const theme = useTheme();
  const c = theme.colors;
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.AUDIT_LOGS);
      const data = normalizeApiResponse<AuditLog[]>(res.data);
      setLogs(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) { setError(e.message || "Failed to load audit logs"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchLogs(); }, []);

  const getActionColor = (action: string) => {
    const a = action.toUpperCase();
    if (a.includes("DELETE") || a.includes("REMOVE")) return c.error;
    if (a.includes("CREATE") || a.includes("ADD")) return c.success;
    if (a.includes("UPDATE") || a.includes("EDIT")) return c.warning;
    if (a.includes("LOGIN") || a.includes("LOGOUT")) return c.primary;
    return c.textMuted;
  };

  const filtered = logs.filter(l => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return String(l.action || "").toLowerCase().includes(q) || String(l.user_name || "").toLowerCase().includes(q) || String(l.entity || "").toLowerCase().includes(q);
  });

  if (loading && !refreshing) return (
    <ScreenContainer scrollable={false}><Header title="Audit Logs" subtitle="System Activity" /><DashboardSkeleton /></ScreenContainer>
  );
  if (error && !logs.length) return (
    <ScreenContainer scrollable={false}><Header title="Audit Logs" subtitle="System Activity" /><ErrorState message={error} onRetry={fetchLogs} /></ScreenContainer>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchLogs(true)}>
        <Header title="Audit Logs" subtitle="System Activity & Security Audit" />

        <View style={styles.kpiRow}>
          <Card style={[styles.kpiCard, { backgroundColor: c.primaryLight }]}>
            <ClipboardList size={14} color={c.primary} />
            <Text style={[styles.kpiLabel, { color: c.primary }]}>Total Logs</Text>
            <Text style={[styles.kpiValue, { color: c.primary }]}>{logs.length}</Text>
          </Card>
          <Card style={[styles.kpiCard, { backgroundColor: "rgba(239,68,68,0.1)" }]}>
            <Shield size={14} color={c.error} />
            <Text style={[styles.kpiLabel, { color: c.error }]}>DELETE Actions</Text>
            <Text style={[styles.kpiValue, { color: c.error }]}>{logs.filter(l => l.action?.toUpperCase().includes("DELETE")).length}</Text>
          </Card>
        </View>

        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : "#F1F5F9", borderColor: c.border }]}>
          <Search size={16} color={c.textMuted} />
          <TextInput placeholder="Search by action, user, entity..." placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} style={[styles.searchInput, { color: c.textPrimary }]} />
          {search ? <TouchableOpacity onPress={() => setSearch("")}><X size={14} color={c.textMuted} /></TouchableOpacity> : null}
        </View>

        {filtered.length === 0 ? (
          <EmptyState title="No Audit Logs" description="No system activity recorded." />
        ) : filtered.map(log => (
          <TouchableOpacity key={String(log.id)} onPress={() => setSelectedLog(log)} activeOpacity={0.8}>
            <Card style={styles.logCard}>
              <View style={styles.logRow}>
                <View style={[styles.logIcon, { backgroundColor: `${getActionColor(log.action)}22` }]}>
                  <Shield size={16} color={getActionColor(log.action)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.action, { color: c.textPrimary }]}>{log.action}</Text>
                  <Text style={[styles.entity, { color: c.textMuted }]}>{log.entity || "System"}{log.entity_id ? ` #${log.entity_id}` : ""}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  {log.user_name && <Text style={[styles.userName, { color: c.textSecondary }]}>{log.user_name}</Text>}
                  {log.created_at && <Text style={[styles.time, { color: c.textMuted }]}>{new Date(log.created_at).toLocaleDateString("en-IN")}</Text>}
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScreenContainer>

      <Modal visible={!!selectedLog} animationType="slide" transparent onRequestClose={() => setSelectedLog(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
            {selectedLog && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>Audit Detail</Text>
                  <TouchableOpacity onPress={() => setSelectedLog(null)}><X size={22} color={c.textMuted} /></TouchableOpacity>
                </View>
                {[
                  { label: "Action", value: selectedLog.action },
                  { label: "Entity", value: `${selectedLog.entity || "System"}${selectedLog.entity_id ? ` #${selectedLog.entity_id}` : ""}` },
                  { label: "User", value: selectedLog.user_name || `User #${selectedLog.user_id}` },
                  { label: "Details", value: selectedLog.details || "N/A" },
                  { label: "IP Address", value: selectedLog.ip_address || "N/A" },
                  { label: "Status", value: selectedLog.status || "N/A" },
                  { label: "Timestamp", value: selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString("en-IN") : "N/A" },
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
  kpiRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  kpiCard: { flex: 1, padding: 12, alignItems: "center", gap: 4 },
  kpiLabel: { fontSize: 9.5, fontWeight: "700", textTransform: "uppercase", textAlign: "center" },
  kpiValue: { fontSize: 16, fontWeight: "800" },
  searchBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, height: 44, marginBottom: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 13 },
  logCard: { marginVertical: 4, padding: 12 },
  logRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  logIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  action: { fontSize: 13, fontWeight: "700" },
  entity: { fontSize: 11, marginTop: 2 },
  userName: { fontSize: 11, fontWeight: "600" },
  time: { fontSize: 10, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, padding: 22, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(148,163,184,0.15)" },
  detailLabel: { fontSize: 13, fontWeight: "500" },
  detailVal: { fontSize: 13, fontWeight: "700", maxWidth: "60%", textAlign: "right" },
});