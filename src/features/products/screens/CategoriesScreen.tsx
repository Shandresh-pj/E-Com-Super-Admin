import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView,
  Alert, TextInput, Switch,
} from "react-native";
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
import { Tag, Plus, X, Search, Edit3, Trash2, ChevronRight, LayoutGrid, Image } from "lucide-react-native";

interface Category {
  id: number | string;
  name: string;
  slug?: string;
  description?: string;
  parent_id?: number | string | null;
  parent_name?: string;
  image?: string;
  is_active: boolean;
  sort_order?: number;
  product_count?: number;
  children?: Category[];
  created_at?: string;
}

export const CategoriesScreen: React.FC = () => {
  const theme = useTheme();
  const c = theme.colors;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const totalActive = categories.filter(c => c.is_active).length;

  const fetchCategories = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.CATEGORIES);
      const data = normalizeApiResponse<Category[]>(res.data);
      setCategories(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) {
      setError(e.message || "Failed to load categories");
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, []);

  const openAdd = () => { setName(""); setDescription(""); setSortOrder(""); setIsActive(true); setAddModal(true); };
  const openEdit = (cat: Category) => {
    setSelectedCat(cat);
    setName(cat.name);
    setDescription(cat.description || "");
    setSortOrder(String(cat.sort_order || ""));
    setIsActive(cat.is_active);
    setEditModal(true);
  };

  const handleCreate = async () => {
    if (!name.trim()) { Alert.alert("Required", "Category name is required."); return; }
    setSubmitting(true);
    try {
      await axiosClient.post(ENDPOINTS.CATEGORY_CREATE, { name, description, sort_order: sortOrder ? parseInt(sortOrder) : 0, is_active: isActive });
      Alert.alert("Created", `Category "${name}" created successfully.`);
      setAddModal(false);
      fetchCategories(true);
    } catch (e: any) { Alert.alert("Error", e.message || "Create failed."); }
    finally { setSubmitting(false); }
  };

  const handleUpdate = async () => {
    if (!selectedCat || !name.trim()) { Alert.alert("Required", "Category name is required."); return; }
    setSubmitting(true);
    try {
      await axiosClient.put(ENDPOINTS.CATEGORY_BY_ID(selectedCat.id), { name, description, sort_order: sortOrder ? parseInt(sortOrder) : 0, is_active: isActive });
      Alert.alert("Updated", `Category "${name}" updated.`);
      setEditModal(false);
      fetchCategories(true);
    } catch (e: any) { Alert.alert("Error", e.message || "Update failed."); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (cat: Category) => {
    Alert.alert("Delete Category", `Delete "${cat.name}"? Products in this category may be affected.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await axiosClient.delete(ENDPOINTS.CATEGORY_BY_ID(cat.id));
          fetchCategories(true);
        } catch (e: any) { Alert.alert("Error", e.message || "Delete failed."); }
      }},
    ]);
  };

  const handleStatusToggle = async (cat: Category) => {
    try {
      await axiosClient.patch(ENDPOINTS.CATEGORY_STATUS(cat.id), { is_active: !cat.is_active });
      fetchCategories(true);
    } catch (e: any) { Alert.alert("Error", e.message || "Status update failed."); }
  };

  const filtered = categories.filter(cat => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return String(cat.name || "").toLowerCase().includes(q) || String(cat.slug || "").toLowerCase().includes(q);
  });

  const FormModal: React.FC<{ visible: boolean; title: string; onClose: () => void; onSubmit: () => void }> = ({ visible, title, onClose, onSubmit }) => (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
          <View style={styles.modalHeader}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>{title}</Text>
            <TouchableOpacity onPress={onClose}><X size={22} color={c.textMuted} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 120 }}>
            <TextField label="Category Name *" placeholder="e.g. Electronics" value={name} onChangeText={setName} />
            <TextField label="Description" placeholder="Brief category description..." value={description} onChangeText={setDescription} multiline />
            <TextField label="Sort Order" placeholder="e.g. 1" value={sortOrder} onChangeText={setSortOrder} keyboardType="numeric" />
            <View style={styles.switchRow}>
              <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: "600" }}>Active Status</Text>
              <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: c.primary }} thumbColor="#FFF" />
            </View>
          </ScrollView>
          <PrimaryButton title={title.includes("Create") ? "Create Category" : "Update Category"} onPress={onSubmit} loading={submitting} />
        </View>
      </View>
    </Modal>
  );

  if (loading && !refreshing) return (
    <ScreenContainer scrollable={false}><Header title="Categories" subtitle="Product Categories" /><DashboardSkeleton /></ScreenContainer>
  );
  if (error && !categories.length) return (
    <ScreenContainer scrollable={false}><Header title="Categories" subtitle="Product Categories" /><ErrorState message={error} onRetry={fetchCategories} /></ScreenContainer>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchCategories(true)}>
        <Header title="Categories" subtitle="Product Category Management" rightAction={
          <TouchableOpacity onPress={openAdd} style={[styles.addBtn, { backgroundColor: c.primary }]} activeOpacity={0.8}>
            <Plus size={15} color="#FFF" strokeWidth={2.5} /><Text style={styles.addBtnText}>New</Text>
          </TouchableOpacity>
        } />

        <View style={styles.kpiRow}>
          <Card style={[styles.kpiCard, { backgroundColor: c.primaryLight }]}>
            <LayoutGrid size={15} color={c.primary} />
            <Text style={[styles.kpiLabel, { color: c.primary }]}>Total</Text>
            <Text style={[styles.kpiValue, { color: c.primary }]}>{categories.length}</Text>
          </Card>
          <Card style={[styles.kpiCard, { backgroundColor: c.successLight }]}>
            <Tag size={15} color={c.success} />
            <Text style={[styles.kpiLabel, { color: c.success }]}>Active</Text>
            <Text style={[styles.kpiValue, { color: c.success }]}>{totalActive}</Text>
          </Card>
          <Card style={[styles.kpiCard, { backgroundColor: "rgba(239,68,68,0.1)" }]}>
            <Tag size={15} color={c.error} />
            <Text style={[styles.kpiLabel, { color: c.error }]}>Inactive</Text>
            <Text style={[styles.kpiValue, { color: c.error }]}>{categories.length - totalActive}</Text>
          </Card>
        </View>

        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : "#F1F5F9", borderColor: c.border }]}>
          <Search size={16} color={c.textMuted} />
          <TextInput placeholder="Search categories..." placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} style={[styles.searchInput, { color: c.textPrimary }]} />
          {search ? <TouchableOpacity onPress={() => setSearch("")}><X size={14} color={c.textMuted} /></TouchableOpacity> : null}
        </View>

        {filtered.length === 0 ? (
          <EmptyState title="No Categories" description="Create your first product category." />
        ) : filtered.map(cat => (
          <Card key={String(cat.id)} style={styles.catCard}>
            <View style={styles.catRow}>
              <View style={[styles.catIcon, { backgroundColor: c.primaryLight }]}><Tag size={18} color={c.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.catName, { color: c.textPrimary }]}>{cat.name}</Text>
                {cat.description ? <Text style={[styles.catDesc, { color: c.textMuted }]} numberOfLines={1}>{cat.description}</Text> : null}
                {cat.parent_name ? <Text style={[styles.parentTag, { color: c.accent }]}>Parent: {cat.parent_name}</Text> : null}
              </View>
              <View style={{ alignItems: "flex-end", gap: 6 }}>
                <Badge label={cat.is_active ? "ACTIVE" : "INACTIVE"} variant={cat.is_active ? "success" : "error"} size="sm" />
                {cat.product_count !== undefined && <Text style={[styles.prodCount, { color: c.textMuted }]}>{cat.product_count} products</Text>}
              </View>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: c.primaryLight }]} onPress={() => openEdit(cat)} activeOpacity={0.8}>
                <Edit3 size={13} color={c.primary} /><Text style={[styles.actionBtnText, { color: c.primary }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: cat.is_active ? "rgba(239,68,68,0.1)" : c.successLight }]} onPress={() => handleStatusToggle(cat)} activeOpacity={0.8}>
                <Text style={[styles.actionBtnText, { color: cat.is_active ? c.error : c.success }]}>{cat.is_active ? "Deactivate" : "Activate"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "rgba(239,68,68,0.1)" }]} onPress={() => handleDelete(cat)} activeOpacity={0.8}>
                <Trash2 size={13} color={c.error} />
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScreenContainer>

      <FormModal visible={addModal} title="Create Category" onClose={() => setAddModal(false)} onSubmit={handleCreate} />
      <FormModal visible={editModal} title="Edit Category" onClose={() => setEditModal(false)} onSubmit={handleUpdate} />
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
  catCard: { marginVertical: 5, padding: 14 },
  catRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  catIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  catName: { fontSize: 15, fontWeight: "700" },
  catDesc: { fontSize: 11, marginTop: 2 },
  parentTag: { fontSize: 10, marginTop: 2, fontWeight: "600" },
  prodCount: { fontSize: 10 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: 10, gap: 5 },
  actionBtnText: { fontSize: 11, fontWeight: "700" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, padding: 22, maxHeight: "88%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
});