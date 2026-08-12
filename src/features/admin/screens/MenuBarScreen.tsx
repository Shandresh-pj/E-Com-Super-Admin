// MenuBarScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, TextInput, Switch } from "react-native";
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
import { Menu, Plus, X, Search, Move } from "lucide-react-native";

interface MenuItemData { id: number | string; name: string; path: string; category?: string; sort_order?: number; is_visible?: boolean; }

export const MenuBarScreen: React.FC = () => {
  const theme = useTheme(); const c = theme.colors;
  const [menus, setMenus] = useState<MenuItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [name, setName] = useState(""); const [path, setPath] = useState(""); const [category, setCategory] = useState("Main"); const [submitting, setSubmitting] = useState(false);

  const fetchMenus = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.MENU_ALL);
      const data = normalizeApiResponse<MenuItemData[]>(res.data);
      setMenus(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) { setError(e.message || "Failed to load menu configuration"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchMenus(); }, []);

  const handleCreate = async () => {
    if (!name || !path) { Alert.alert("Required", "Name and path are required."); return; }
    setSubmitting(true);
    try {
      await axiosClient.post(ENDPOINTS.MENU_ALL, { name, path, category, is_visible: true });
      Alert.alert("Created", `Menu item "${name}" created.`);
      setAddModal(false); setName(""); setPath(""); fetchMenus(true);
    } catch (e: any) { Alert.alert("Error", e.message || "Create failed."); }
    finally { setSubmitting(false); }
  };

  const filtered = menus.filter(m => !search.trim() || String(m.name || "").toLowerCase().includes(search.toLowerCase()) || String(m.path || "").toLowerCase().includes(search.toLowerCase()));

  if (loading && !refreshing) return <ScreenContainer scrollable={false}><Header title="Menu Settings" subtitle="Sidebar Menu Configuration" /><DashboardSkeleton /></ScreenContainer>;
  if (error && !menus.length) return <ScreenContainer scrollable={false}><Header title="Menu Settings" subtitle="Sidebar Menu Configuration" /><ErrorState message={error} onRetry={fetchMenus} /></ScreenContainer>;

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchMenus(true)}>
        <Header title="Menu Bar Settings" subtitle="Configure Sidebar & Navigation Items" rightAction={
          <TouchableOpacity onPress={() => setAddModal(true)} style={[styles.addBtn, { backgroundColor: c.primary }]} activeOpacity={0.8}>
            <Plus size={15} color="#FFF" strokeWidth={2.5} /><Text style={styles.addBtnText}>Add Menu</Text>
          </TouchableOpacity>
        } />
        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : "#F1F5F9", borderColor: c.border }]}>
          <Search size={16} color={c.textMuted} /><TextInput placeholder="Search menu items..." placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} style={[styles.searchInput, { color: c.textPrimary }]} />
          {search ? <TouchableOpacity onPress={() => setSearch("")}><X size={14} color={c.textMuted} /></TouchableOpacity> : null}
        </View>
        {filtered.length === 0 ? <EmptyState title="No Menu Items" description="Add menu navigation items." /> : filtered.map(item => (
          <Card key={String(item.id)} style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: c.primaryLight }]}><Menu size={18} color={c.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: c.textPrimary }]}>{item.name}</Text>
                <Text style={[styles.pathText, { color: c.textMuted }]}>{item.path}</Text>
              </View>
              {item.category && <Badge label={item.category} variant="primary" size="sm" />}
            </View>
          </Card>
        ))}
      </ScreenContainer>

      <Modal visible={addModal} animationType="slide" transparent onRequestClose={() => setAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
            <View style={styles.modalHeader}><Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>Add Navigation Item</Text><TouchableOpacity onPress={() => setAddModal(false)}><X size={22} color={c.textMuted} /></TouchableOpacity></View>
            <TextField label="Menu Label *" placeholder="e.g. Analytics" value={name} onChangeText={setName} />
            <TextField label="Route Path *" placeholder="e.g. /analytics" value={path} onChangeText={setPath} />
            <TextField label="Category" placeholder="e.g. Finance, Core, HR" value={category} onChangeText={setCategory} />
            <View style={{ marginTop: 16 }}><PrimaryButton title="Create Menu Item" onPress={handleCreate} loading={submitting} /></View>
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
  pathText: { fontSize: 11, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, padding: 22, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
});