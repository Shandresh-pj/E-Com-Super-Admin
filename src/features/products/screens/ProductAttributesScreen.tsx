// ProductAttributesScreen.tsx
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
import { Sliders, Plus, X, Search, Edit3, Trash2, Tag } from "lucide-react-native";

interface ProductAttribute {
  id: number | string;
  name: string;
  type?: string;
  is_filterable?: boolean;
  values_count?: number;
  created_at?: string;
}

export const ProductAttributesScreen: React.FC = () => {
  const theme = useTheme(); const c = theme.colors;
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [name, setName] = useState(""); const [type, setType] = useState("SELECT"); const [isFilterable, setIsFilterable] = useState(true); const [submitting, setSubmitting] = useState(false);

  const fetchAttributes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.PRODUCT_ATTRIBUTES);
      const data = normalizeApiResponse<ProductAttribute[]>(res.data);
      setAttributes(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) { setError(e.message || "Failed to load product attributes"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchAttributes(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) { Alert.alert("Required", "Attribute name is required."); return; }
    setSubmitting(true);
    try {
      await axiosClient.post(ENDPOINTS.PRODUCT_ATTRIBUTES, { name, type, is_filterable: isFilterable });
      Alert.alert("Created", `Attribute "${name}" created.`);
      setAddModal(false); setName(""); fetchAttributes(true);
    } catch (e: any) { Alert.alert("Error", e.message || "Create failed."); }
    finally { setSubmitting(false); }
  };

  const handleDelete = (attr: ProductAttribute) => {
    Alert.alert("Delete Attribute", `Delete "${attr.name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { try { await axiosClient.delete(ENDPOINTS.PRODUCT_ATTRIBUTE_BY_ID(attr.id)); fetchAttributes(true); } catch (e: any) { Alert.alert("Error", e.message || "Delete failed."); } } }
    ]);
  };

  const filtered = attributes.filter(a => !search.trim() || String(a.name || "").toLowerCase().includes(search.toLowerCase()));

  if (loading && !refreshing) return <ScreenContainer scrollable={false}><Header title="Product Attributes" subtitle="Attribute Master" /><DashboardSkeleton /></ScreenContainer>;
  if (error && !attributes.length) return <ScreenContainer scrollable={false}><Header title="Product Attributes" subtitle="Attribute Master" /><ErrorState message={error} onRetry={fetchAttributes} /></ScreenContainer>;

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchAttributes(true)}>
        <Header title="Product Attributes" subtitle="Product Filter & Variant Attributes" rightAction={
          <TouchableOpacity onPress={() => setAddModal(true)} style={[styles.addBtn, { backgroundColor: c.primary }]} activeOpacity={0.8}>
            <Plus size={15} color="#FFF" strokeWidth={2.5} /><Text style={styles.addBtnText}>Add Attribute</Text>
          </TouchableOpacity>
        } />
        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : "#F1F5F9", borderColor: c.border }]}>
          <Search size={16} color={c.textMuted} /><TextInput placeholder="Search attributes..." placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} style={[styles.searchInput, { color: c.textPrimary }]} />
          {search ? <TouchableOpacity onPress={() => setSearch("")}><X size={14} color={c.textMuted} /></TouchableOpacity> : null}
        </View>
        {filtered.length === 0 ? <EmptyState title="No Attributes" description="Create product attributes like Size, Color, Material." /> : filtered.map(item => (
          <Card key={String(item.id)} style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: c.primaryLight }]}><Sliders size={18} color={c.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: c.textPrimary }]}>{item.name}</Text>
                <View style={styles.metaRow}>
                  <Tag size={10} color={c.textMuted} /><Text style={[styles.metaText, { color: c.textMuted }]}>{item.type || "SELECT"}</Text>
                  {item.values_count !== undefined && <Text style={[styles.metaText, { color: c.textMuted }]}>• {item.values_count} values</Text>}
                </View>
              </View>
              <Badge label={item.is_filterable ? "FILTERABLE" : "STANDARD"} variant={item.is_filterable ? "success" : "primary"} size="sm" />
              <TouchableOpacity onPress={() => handleDelete(item)} style={[styles.delBtn, { backgroundColor: "rgba(239,68,68,0.1)" }]}><Trash2 size={14} color={c.error} /></TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScreenContainer>

      <Modal visible={addModal} animationType="slide" transparent onRequestClose={() => setAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
            <View style={styles.modalHeader}><Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>Add Attribute</Text><TouchableOpacity onPress={() => setAddModal(false)}><X size={22} color={c.textMuted} /></TouchableOpacity></View>
            <TextField label="Attribute Name *" placeholder="e.g. Size, Color, Brand" value={name} onChangeText={setName} />
            <TextField label="Type" placeholder="SELECT / TEXT / COLOR" value={type} onChangeText={setType} />
            <View style={styles.switchRow}><Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: "600" }}>Use in Product Filters</Text><Switch value={isFilterable} onValueChange={setIsFilterable} trackColor={{ true: c.primary }} thumbColor="#FFF" /></View>
            <View style={{ marginTop: 16 }}><PrimaryButton title="Create Attribute" onPress={handleCreate} loading={submitting} /></View>
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
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  metaText: { fontSize: 11 },
  delBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginLeft: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, padding: 22, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
});