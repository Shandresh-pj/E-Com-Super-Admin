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
import { MapPin, Plus, X, Edit3, Trash2, Shield, Navigation, Circle } from "lucide-react-native";

interface Geofence {
  id: number | string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  branch_id?: number | string;
  branch_name?: string;
  is_active: boolean;
  violation_action?: string;
  created_at?: string;
}

export const GeofencingScreen: React.FC = () => {
  const theme = useTheme();
  const c = theme.colors;
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [radius, setRadius] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const activeCount = geofences.filter(g => g.is_active).length;

  const fetchGeofences = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.GPS_GEOFENCES);
      const data = normalizeApiResponse<Geofence[]>(res.data);
      setGeofences(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) { setError(e.message || "Failed to load geofences"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchGeofences(); }, []);

  const handleCreate = async () => {
    if (!name || !lat || !lng || !radius) { Alert.alert("Required", "All location fields are required."); return; }
    setSubmitting(true);
    try {
      await axiosClient.post(ENDPOINTS.GPS_GEOFENCES, { name, latitude: parseFloat(lat), longitude: parseFloat(lng), radius_meters: parseInt(radius), is_active: true });
      Alert.alert("Created", `Geofence "${name}" set.`);
      setAddModal(false); setName(""); setLat(""); setLng(""); setRadius(""); fetchGeofences(true);
    } catch (e: any) { Alert.alert("Error", e.message || "Create failed."); }
    finally { setSubmitting(false); }
  };

  const handleDelete = (g: Geofence) => {
    Alert.alert("Delete Geofence", `Delete "${g.name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => { try { await axiosClient.delete(`${ENDPOINTS.GPS_GEOFENCES}/${g.id}`); fetchGeofences(true); } catch (e: any) { Alert.alert("Error", e.message || "Delete failed."); } } },
    ]);
  };

  const toggleStatus = async (g: Geofence) => {
    try { await axiosClient.patch(`${ENDPOINTS.GPS_GEOFENCES}/${g.id}`, { is_active: !g.is_active }); fetchGeofences(true); }
    catch (e: any) { Alert.alert("Error", e.message || "Update failed."); }
  };

  if (loading && !refreshing) return <ScreenContainer scrollable={false}><Header title="GPS Geofencing" subtitle="Location Boundaries" /><DashboardSkeleton /></ScreenContainer>;
  if (error && !geofences.length) return <ScreenContainer scrollable={false}><Header title="GPS Geofencing" subtitle="Location Boundaries" /><ErrorState message={error} onRetry={fetchGeofences} /></ScreenContainer>;

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchGeofences(true)}>
        <Header title="GPS Geofencing" subtitle="Location-Based Boundary Control" rightAction={
          <TouchableOpacity onPress={() => setAddModal(true)} style={[styles.addBtn, { backgroundColor: c.primary }]} activeOpacity={0.8}>
            <Plus size={15} color="#FFF" strokeWidth={2.5} /><Text style={styles.addBtnText}>New</Text>
          </TouchableOpacity>
        } />

        <View style={styles.kpiRow}>
          <Card style={[styles.kpiCard, { backgroundColor: c.primaryLight }]}>
            <Navigation size={14} color={c.primary} />
            <Text style={[styles.kpiLabel, { color: c.primary }]}>Total Zones</Text>
            <Text style={[styles.kpiValue, { color: c.primary }]}>{geofences.length}</Text>
          </Card>
          <Card style={[styles.kpiCard, { backgroundColor: c.successLight }]}>
            <Shield size={14} color={c.success} />
            <Text style={[styles.kpiLabel, { color: c.success }]}>Active</Text>
            <Text style={[styles.kpiValue, { color: c.success }]}>{activeCount}</Text>
          </Card>
        </View>

        {geofences.length === 0 ? <EmptyState title="No Geofences" description="Define GPS boundaries for your branches." /> : geofences.map(g => (
          <Card key={String(g.id)} style={styles.geoCard}>
            <View style={styles.geoRow}>
              <View style={[styles.geoIcon, { backgroundColor: c.primaryLight }]}><MapPin size={18} color={c.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.geoName, { color: c.textPrimary }]}>{g.name}</Text>
                {g.branch_name && <Text style={[styles.geoDetail, { color: c.textMuted }]}>{g.branch_name}</Text>}
                <View style={styles.coordRow}>
                  <Navigation size={10} color={c.textMuted} />
                  <Text style={[styles.coordText, { color: c.textMuted }]}>{g.latitude.toFixed(4)}, {g.longitude.toFixed(4)}</Text>
                  <Circle size={10} color={c.accent} />
                  <Text style={[styles.coordText, { color: c.accent }]}>{g.radius_meters}m radius</Text>
                </View>
              </View>
              <Badge label={g.is_active ? "ACTIVE" : "OFF"} variant={g.is_active ? "success" : "error"} size="sm" />
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: g.is_active ? "rgba(239,68,68,0.1)" : c.successLight }]} onPress={() => toggleStatus(g)} activeOpacity={0.8}>
                <Text style={[styles.actionBtnText, { color: g.is_active ? c.error : c.success }]}>{g.is_active ? "Deactivate" : "Activate"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "rgba(239,68,68,0.1)" }]} onPress={() => handleDelete(g)} activeOpacity={0.8}>
                <Trash2 size={13} color={c.error} />
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScreenContainer>

      <Modal visible={addModal} animationType="slide" transparent onRequestClose={() => setAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
            <View style={styles.modalHeader}><Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>Create Geofence</Text><TouchableOpacity onPress={() => setAddModal(false)}><X size={22} color={c.textMuted} /></TouchableOpacity></View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 100 }}>
              <TextField label="Zone Name *" placeholder="e.g. Headquarters" value={name} onChangeText={setName} />
              <TextField label="Latitude *" placeholder="e.g. 12.9716" value={lat} onChangeText={setLat} keyboardType="decimal-pad" />
              <TextField label="Longitude *" placeholder="e.g. 77.5946" value={lng} onChangeText={setLng} keyboardType="decimal-pad" />
              <TextField label="Radius (meters) *" placeholder="e.g. 200" value={radius} onChangeText={setRadius} keyboardType="numeric" />
            </ScrollView>
            <PrimaryButton title="Create Geofence" onPress={handleCreate} loading={submitting} />
          </View>
        </View>
      </Modal>
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
  geoCard: { marginVertical: 5, padding: 14 },
  geoRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  geoIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  geoName: { fontSize: 14, fontWeight: "700" },
  geoDetail: { fontSize: 11, marginTop: 2 },
  coordRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4, flexWrap: "wrap" },
  coordText: { fontSize: 10 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: 10, gap: 5 },
  actionBtnText: { fontSize: 11, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, padding: 22, maxHeight: "88%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
});