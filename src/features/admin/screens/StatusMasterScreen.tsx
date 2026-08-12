// StatusMasterScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, TextInput } from "react-native";
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
import { CheckCircle2, Plus, X, Search, Tag } from "lucide-react-native";

interface StatusItem {
  id: number | string;
  name: string;
  module?: string;
  color_code?: string;
  description?: string;
}

export const StatusMasterScreen: React.FC = () => {
  const theme = useTheme(); const c = theme.colors;
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [name, setName] = useState(""); const [module, setModule] = useState("ORDERS"); const [colorCode, setColorCode] = useState("#3B82F6"); const [submitting, setSubmitting] = useState(false);

  const fetchStatuses = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.STATUS_MASTER);
      const data = normalizeApiResponse<StatusItem[]>(res.data);
      setStatuses(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) { setError(e.message || "Failed to load statuses"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchStatuses(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) { Alert.alert("Required", "Status name is required."); return; }
    setSubmitting(true);
    try {
      await axiosClient.post(ENDPOINTS.STATUS_MASTER, { name, module, color_code: colorCode });
      Alert.alert("Created", `Status "${name}" created.`);
      setAddModal(false); setName(""); fetchStatuses(true);
    } catch (e: any) { Alert.alert("Error", e.message || "Create failed."); }
    finally { setSubmitting(false); }
  };

  const filtered = statuses.filter(s => !search.trim() || String(s.name || "").toLowerCase().includes(search.toLowerCase()) || String(s.module || "").toLowerCase().includes(search.toLowerCase()));

  if (loading && !refreshing) return <ScreenContainer scrollable={false}><Header title="Status Master" subtitle="Global Status Definitions" /><DashboardSkeleton /></ScreenContainer>;
  if (error && !statuses.length) return <ScreenContainer scrollable={false}><Header title="Status Master" subtitle="Global Status Definitions" /><ErrorState message={error} onRetry={fetchStatuses} /></ScreenContainer>;

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchStatuses(true)}>
        <Header title="Status Master" subtitle="System-wide Order & Delivery Status Codes" rightAction={
          <TouchableOpacity onPress={() => setAddModal(true)} style={[styles.addBtn, { backgroundColor: c.primary }]} activeOpacity={0.8}>
            <Plus size={15} color="#FFF" strokeWidth={2.5} /><Text style={styles.addBtnText}>Add Status</Text>
          </TouchableOpacity>
        } />
        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : "#F1F5F9", borderColor: c.border }]}>
          <Search size={16} color={c.textMuted} /><TextInput placeholder="Search status codes..." placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} style={[styles.searchInput, { color: c.textPrimary }]} />
          {search ? <TouchableOpacity onPress={() => setSearch("")}><X size={14} color={c.textMuted} /></TouchableOpacity> : null}
        </View>
        {filtered.length === 0 ? <EmptyState title="No Status Codes" description="Define custom status codes." /> : filtered.map(item => (
          <Card key={String(item.id)} style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: (item.color_code || c.primary) + "22" }]}>
                <CheckCircle2 size={18} color={item.color_code || c.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: c.textPrimary }]}>{item.name}</Text>
                {item.module && <Text style={[styles.modText, { color: c.textMuted }]}>Module: {item.module}</Text>}
              </View>
              <Badge label={item.name} variant="primary" size="sm" />
            </View>
          </Card>
        ))}
      </ScreenContainer>

      <Modal visible={addModal} animationType="slide" transparent onRequestClose={() => setAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
            <View style={styles.modalHeader}><Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>Add Status Code</Text><TouchableOpacity onPress={() => setAddModal(false)}><X size={22} color={c.textMuted} /></TouchableOpacity></View>
            <TextField label="Status Name *" placeholder="e.g. READY_FOR_DISPATCH" value={name} onChangeText={setName} />
            <TextField label="Module" placeholder="ORDERS / DELIVERY / PAYMENTS" value={module} onChangeText={setModule} />
            <TextField label="Color Hex Code" placeholder="#3B82F6" value={colorCode} onChangeText={setColorCode} />
            <View style={{ marginTop: 16 }}><PrimaryButton title="Create Status" onPress={handleCreate} loading={submitting} /></View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  addBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, gap: 4 },
  addBtnText: { color: "#FFF", fontSize: 12, fontWeight: "800" },
  searchBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, height: 44, marginBottom: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 13 },
  card: { marginVertical: 4, padding: 12 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 14, fontWeight: "700" },
  modText: { fontSize: 11, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, padding: 22, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
});