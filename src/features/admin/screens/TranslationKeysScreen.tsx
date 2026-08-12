// TranslationKeysScreen.tsx
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
import { Languages, Plus, X, Search } from "lucide-react-native";

interface TranslationItem { id: number | string; key_name: string; value_en?: string; value_hi?: string; value_ta?: string; }

export const TranslationKeysScreen: React.FC = () => {
  const theme = useTheme(); const c = theme.colors;
  const [keys, setKeys] = useState<TranslationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [keyName, setKeyName] = useState(""); const [valEn, setValEn] = useState(""); const [submitting, setSubmitting] = useState(false);

  const fetchKeys = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.TRANSLATION_KEYS);
      const data = normalizeApiResponse<TranslationItem[]>(res.data);
      setKeys(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) { setError(e.message || "Failed to load translation keys"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchKeys(); }, []);

  const handleCreate = async () => {
    if (!keyName) { Alert.alert("Required", "Key name is required."); return; }
    setSubmitting(true);
    try {
      await axiosClient.post(ENDPOINTS.TRANSLATION_KEYS, { key_name: keyName, value_en: valEn });
      Alert.alert("Added", `Key "${keyName}" added.`);
      setAddModal(false); setKeyName(""); setValEn(""); fetchKeys(true);
    } catch (e: any) { Alert.alert("Error", e.message || "Action failed."); }
    finally { setSubmitting(false); }
  };

  const filtered = keys.filter(k => !search.trim() || String(k.key_name || "").toLowerCase().includes(search.toLowerCase()));

  if (loading && !refreshing) return <ScreenContainer scrollable={false}><Header title="Translation Console" subtitle="Multi-Language Dictionary" /><DashboardSkeleton /></ScreenContainer>;
  if (error && !keys.length) return <ScreenContainer scrollable={false}><Header title="Translation Console" subtitle="Multi-Language Dictionary" /><ErrorState message={error} onRetry={fetchKeys} /></ScreenContainer>;

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchKeys(true)}>
        <Header title="Translation Keys" subtitle="Localization & Dictionary Keys" rightAction={
          <TouchableOpacity onPress={() => setAddModal(true)} style={[styles.addBtn, { backgroundColor: c.primary }]} activeOpacity={0.8}>
            <Plus size={15} color="#FFF" strokeWidth={2.5} /><Text style={styles.addBtnText}>Add Key</Text>
          </TouchableOpacity>
        } />
        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : "#F1F5F9", borderColor: c.border }]}>
          <Search size={16} color={c.textMuted} /><TextInput placeholder="Search translation keys..." placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} style={[styles.searchInput, { color: c.textPrimary }]} />
          {search ? <TouchableOpacity onPress={() => setSearch("")}><X size={14} color={c.textMuted} /></TouchableOpacity> : null}
        </View>
        {filtered.length === 0 ? <EmptyState title="No Translation Keys" description="Add localization keys." /> : filtered.map(item => (
          <Card key={String(item.id)} style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: c.primaryLight }]}><Languages size={18} color={c.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: c.textPrimary }]}>{item.key_name}</Text>
                {item.value_en && <Text style={[styles.sub, { color: c.textMuted }]}>EN: {item.value_en}</Text>}
              </View>
            </View>
          </Card>
        ))}
      </ScreenContainer>

      <Modal visible={addModal} animationType="slide" transparent onRequestClose={() => setAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
            <View style={styles.modalHeader}><Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>Add Translation Key</Text><TouchableOpacity onPress={() => setAddModal(false)}><X size={22} color={c.textMuted} /></TouchableOpacity></View>
            <TextField label="Key Name *" placeholder="e.g. welcome_message" value={keyName} onChangeText={setKeyName} />
            <TextField label="English Value" placeholder="e.g. Welcome to SVK World" value={valEn} onChangeText={setValEn} />
            <View style={{ marginTop: 16 }}><PrimaryButton title="Add Translation" onPress={handleCreate} loading={submitting} /></View>
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
  sub: { fontSize: 11, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, padding: 22, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
});