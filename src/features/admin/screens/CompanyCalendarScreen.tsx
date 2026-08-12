// CompanyCalendarScreen.tsx
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
import { Calendar, Plus, X, Search } from "lucide-react-native";

interface CalendarEvent { id: number | string; title: string; date?: string; type?: string; description?: string; }

export const CompanyCalendarScreen: React.FC = () => {
  const theme = useTheme(); const c = theme.colors;
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [title, setTitle] = useState(""); const [eventDate, setEventDate] = useState(""); const [type, setType] = useState("HOLIDAY"); const [submitting, setSubmitting] = useState(false);

  const fetchEvents = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.COMPANY_CALENDAR);
      const data = normalizeApiResponse<CalendarEvent[]>(res.data);
      setEvents(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) { setError(e.message || "Failed to load calendar events"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchEvents(); }, []);

  const handleCreate = async () => {
    if (!title || !eventDate) { Alert.alert("Required", "Title and date are required."); return; }
    setSubmitting(true);
    try {
      await axiosClient.post(ENDPOINTS.COMPANY_CALENDAR, { title, date: eventDate, type });
      Alert.alert("Added", `Event "${title}" added.`);
      setAddModal(false); setTitle(""); setEventDate(""); fetchEvents(true);
    } catch (e: any) { Alert.alert("Error", e.message || "Action failed."); }
    finally { setSubmitting(false); }
  };

  const filtered = events.filter(e => !search.trim() || String(e.title || "").toLowerCase().includes(search.toLowerCase()));

  if (loading && !refreshing) return <ScreenContainer scrollable={false}><Header title="Company Calendar" subtitle="Holidays & Events" /><DashboardSkeleton /></ScreenContainer>;
  if (error && !events.length) return <ScreenContainer scrollable={false}><Header title="Company Calendar" subtitle="Holidays & Events" /><ErrorState message={error} onRetry={fetchEvents} /></ScreenContainer>;

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchEvents(true)}>
        <Header title="Company Calendar" subtitle="Holidays, Company Events & Workdays" rightAction={
          <TouchableOpacity onPress={() => setAddModal(true)} style={[styles.addBtn, { backgroundColor: c.primary }]} activeOpacity={0.8}>
            <Plus size={15} color="#FFF" strokeWidth={2.5} /><Text style={styles.addBtnText}>Add Event</Text>
          </TouchableOpacity>
        } />
        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : "#F1F5F9", borderColor: c.border }]}>
          <Search size={16} color={c.textMuted} /><TextInput placeholder="Search events..." placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} style={[styles.searchInput, { color: c.textPrimary }]} />
          {search ? <TouchableOpacity onPress={() => setSearch("")}><X size={14} color={c.textMuted} /></TouchableOpacity> : null}
        </View>
        {filtered.length === 0 ? <EmptyState title="No Calendar Events" description="Add official holidays and company events." /> : filtered.map(item => (
          <Card key={String(item.id)} style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: c.primaryLight }]}><Calendar size={18} color={c.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: c.textPrimary }]}>{item.title}</Text>
                {item.date && <Text style={[styles.sub, { color: c.textMuted }]}>{new Date(item.date).toLocaleDateString("en-IN")}</Text>}
              </View>
              <Badge label={item.type || "HOLIDAY"} variant={item.type === "HOLIDAY" ? "warning" : "primary"} size="sm" />
            </View>
          </Card>
        ))}
      </ScreenContainer>

      <Modal visible={addModal} animationType="slide" transparent onRequestClose={() => setAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
            <View style={styles.modalHeader}><Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>Add Calendar Event</Text><TouchableOpacity onPress={() => setAddModal(false)}><X size={22} color={c.textMuted} /></TouchableOpacity></View>
            <TextField label="Event Title *" placeholder="e.g. Independence Day Holiday" value={title} onChangeText={setTitle} />
            <TextField label="Date (YYYY-MM-DD) *" placeholder="2026-08-15" value={eventDate} onChangeText={setEventDate} />
            <TextField label="Type" placeholder="HOLIDAY / EVENT / MEETING" value={type} onChangeText={setType} />
            <View style={{ marginTop: 16 }}><PrimaryButton title="Add Event" onPress={handleCreate} loading={submitting} /></View>
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