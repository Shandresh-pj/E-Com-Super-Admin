import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, TextInput } from "react-native";
import { ScreenContainer } from "../../../components/common/ScreenContainer";
import { Header } from "../../../components/common/Header";
import { Card } from "../../../components/common/Card";
import { TextField } from "../../../components/inputs/TextField";
import { PrimaryButton } from "../../../components/buttons/PrimaryButton";
import { DashboardSkeleton } from "../../../components/skeletons/SkeletonLoader";
import { EmptyState, ErrorState } from "../../../components/common/States";
import { useTheme } from "../../../theme/theme";
import { axiosClient } from "../../../api/axiosClient";
import { ENDPOINTS } from "../../../api/endpoints";
import { normalizeApiResponse } from "../../../api/responseNormalizer";
import { List, Plus, X, Search, Trash2 } from "lucide-react-native";

interface AttributeValue {
  id: number | string;
  attribute_id?: number | string;
  attribute_name?: string;
  value: string;
  code?: string;
}

export const AttributeValuesScreen: React.FC = () => {
  const theme = useTheme(); const c = theme.colors;
  const [values, setValues] = useState<AttributeValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [valText, setValText] = useState(""); const [valCode, setValCode] = useState(""); const [submitting, setSubmitting] = useState(false);

  const fetchValues = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.ATTRIBUTE_VALUES);
      const data = normalizeApiResponse<AttributeValue[]>(res.data);
      setValues(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) { setError(e.message || "Failed to load attribute values"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchValues(); }, []);

  const handleCreate = async () => {
    if (!valText.trim()) { Alert.alert("Required", "Value text is required."); return; }
    setSubmitting(true);
    try {
      await axiosClient.post(ENDPOINTS.ATTRIBUTE_VALUES, { value: valText, code: valCode });
      Alert.alert("Created", `Value "${valText}" added.`);
      setAddModal(false); setValText(""); setValCode(""); fetchValues(true);
    } catch (e: any) { Alert.alert("Error", e.message || "Create failed."); }
    finally { setSubmitting(false); }
  };

  const handleDelete = (item: AttributeValue) => {
    Alert.alert("Delete Value", `Delete attribute value "${item.value}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await axiosClient.delete(`${ENDPOINTS.ATTRIBUTE_VALUES}/${item.id}`);
            fetchValues(true);
          } catch (e: any) {
            Alert.alert("Error", e.message || "Delete failed.");
          }
        },
      },
    ]);
  };

  const filtered = values.filter(v => !search.trim() || String(v.value || "").toLowerCase().includes(search.toLowerCase()));

  if (loading && !refreshing) return <ScreenContainer scrollable={false}><Header title="Attribute Values" subtitle="Attribute Values Master" /><DashboardSkeleton /></ScreenContainer>;
  if (error && !values.length) return <ScreenContainer scrollable={false}><Header title="Attribute Values" subtitle="Attribute Values Master" /><ErrorState message={error} onRetry={fetchValues} /></ScreenContainer>;

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchValues(true)}>
        <Header title="Attribute Values" subtitle="Values (Red, XL, Cotton, etc.)" rightAction={
          <TouchableOpacity onPress={() => setAddModal(true)} style={[styles.addBtn, { backgroundColor: c.primary }]} activeOpacity={0.8}>
            <Plus size={15} color="#FFF" strokeWidth={2.5} /><Text style={styles.addBtnText}>Add Value</Text>
          </TouchableOpacity>
        } />
        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : "#F1F5F9", borderColor: c.border }]}>
          <Search size={16} color={c.textMuted} /><TextInput placeholder="Search values..." placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} style={[styles.searchInput, { color: c.textPrimary }]} />
          {search ? <TouchableOpacity onPress={() => setSearch("")}><X size={14} color={c.textMuted} /></TouchableOpacity> : null}
        </View>
        {filtered.length === 0 ? <EmptyState title="No Attribute Values" description="Add option values for your product attributes." /> : filtered.map(item => (
          <Card key={String(item.id)} style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: c.primaryLight }]}><List size={18} color={c.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.valName, { color: c.textPrimary }]}>{item.value}</Text>
                {item.attribute_name && <Text style={[styles.attrName, { color: c.textMuted }]}>{item.attribute_name}</Text>}
              </View>
              {item.code ? <View style={[styles.codeBadge, { backgroundColor: c.surfaceSecondary }]}><Text style={[styles.codeText, { color: c.textSecondary }]}>{item.code}</Text></View> : null}
              <TouchableOpacity onPress={() => handleDelete(item)} style={[styles.delBtn, { backgroundColor: "rgba(239,68,68,0.1)" }]}>
                <Trash2 size={14} color={c.error} />
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScreenContainer>

      <Modal visible={addModal} animationType="slide" transparent onRequestClose={() => setAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
            <View style={styles.modalHeader}><Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>Add Attribute Value</Text><TouchableOpacity onPress={() => setAddModal(false)}><X size={22} color={c.textMuted} /></TouchableOpacity></View>
            <TextField label="Value *" placeholder="e.g. Extra Large, Navy Blue" value={valText} onChangeText={setValText} />
            <TextField label="Code / Hex (optional)" placeholder="e.g. XL or #000080" value={valCode} onChangeText={setValCode} />
            <View style={{ marginTop: 16 }}><PrimaryButton title="Add Value" onPress={handleCreate} loading={submitting} /></View>
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
  valName: { fontSize: 14, fontWeight: "700" },
  attrName: { fontSize: 11, marginTop: 2 },
  codeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  codeText: { fontSize: 11, fontWeight: "700" },
  delBtn: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center", marginLeft: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, padding: 22, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
});