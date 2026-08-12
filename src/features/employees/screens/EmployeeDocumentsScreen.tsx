// EmployeeDocumentsScreen.tsx
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
import { FileCheck, Plus, X, Search, CheckCircle, ShieldAlert } from "lucide-react-native";

interface EmployeeDocument { id: number | string; employee_name?: string; doc_type: string; file_name?: string; is_verified?: boolean; created_at?: string; }

export const EmployeeDocumentsScreen: React.FC = () => {
  const theme = useTheme(); const c = theme.colors;
  const [docs, setDocs] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchDocs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.EMPLOYEE_DOCUMENTS);
      const data = normalizeApiResponse<EmployeeDocument[]>(res.data);
      setDocs(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) { setError(e.message || "Failed to load employee documents"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchDocs(); }, []);

  const handleVerify = async (doc: EmployeeDocument) => {
    try {
      await axiosClient.post(ENDPOINTS.EMPLOYEE_DOC_VERIFY(doc.id));
      Alert.alert("Verified", `Document "${doc.doc_type}" verified.`);
      fetchDocs(true);
    } catch (e: any) { Alert.alert("Error", e.message || "Verification failed."); }
  };

  const filtered = docs.filter(d => !search.trim() || String(d.doc_type || "").toLowerCase().includes(search.toLowerCase()) || String(d.employee_name || "").toLowerCase().includes(search.toLowerCase()));

  if (loading && !refreshing) return <ScreenContainer scrollable={false}><Header title="Employee Documents" subtitle="KYC & Verification" /><DashboardSkeleton /></ScreenContainer>;
  if (error && !docs.length) return <ScreenContainer scrollable={false}><Header title="Employee Documents" subtitle="KYC & Verification" /><ErrorState message={error} onRetry={fetchDocs} /></ScreenContainer>;

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchDocs(true)}>
        <Header title="Employee Documents" subtitle="KYC, ID Verification & Compliance" />
        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : "#F1F5F9", borderColor: c.border }]}>
          <Search size={16} color={c.textMuted} /><TextInput placeholder="Search documents..." placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} style={[styles.searchInput, { color: c.textPrimary }]} />
          {search ? <TouchableOpacity onPress={() => setSearch("")}><X size={14} color={c.textMuted} /></TouchableOpacity> : null}
        </View>
        {filtered.length === 0 ? <EmptyState title="No Documents" description="Uploaded employee IDs & contracts will appear here." /> : filtered.map(item => (
          <Card key={String(item.id)} style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: item.is_verified ? c.successLight : c.primaryLight }]}>
                <FileCheck size={18} color={item.is_verified ? c.success : c.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: c.textPrimary }]}>{item.doc_type}</Text>
                {item.employee_name && <Text style={[styles.sub, { color: c.textMuted }]}>{item.employee_name}</Text>}
              </View>
              <Badge label={item.is_verified ? "VERIFIED" : "PENDING"} variant={item.is_verified ? "success" : "warning"} size="sm" />
              {!item.is_verified && (
                <TouchableOpacity onPress={() => handleVerify(item)} style={[styles.vBtn, { backgroundColor: c.successLight }]}>
                  <CheckCircle size={14} color={c.success} />
                </TouchableOpacity>
              )}
            </View>
          </Card>
        ))}
      </ScreenContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  searchBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, height: 44, marginBottom: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 13 },
  card: { marginVertical: 4, padding: 12 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 14, fontWeight: "700" },
  sub: { fontSize: 11, marginTop: 2 },
  vBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginLeft: 4 },
});