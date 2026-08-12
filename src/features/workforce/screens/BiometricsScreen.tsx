// BiometricsScreen.tsx
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
import { Fingerprint, Plus, X, Search, Cpu } from "lucide-react-native";

interface BiometricDevice { id: number | string; device_name: string; ip_address?: string; branch_name?: string; status: string; last_sync?: string; }

export const BiometricsScreen: React.FC = () => {
  const theme = useTheme(); const c = theme.colors;
  const [devices, setDevices] = useState<BiometricDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [deviceName, setDeviceName] = useState(""); const [ipAddress, setIpAddress] = useState(""); const [submitting, setSubmitting] = useState(false);

  const fetchDevices = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.BIOMETRIC_TERMINALS);
      const data = normalizeApiResponse<BiometricDevice[]>(res.data);
      setDevices(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) { setError(e.message || "Failed to load biometric terminals"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchDevices(); }, []);

  const handleCreate = async () => {
    if (!deviceName) { Alert.alert("Required", "Device name is required."); return; }
    setSubmitting(true);
    try {
      await axiosClient.post(ENDPOINTS.BIOMETRIC_TERMINALS, { device_name: deviceName, ip_address: ipAddress });
      Alert.alert("Registered", `Terminal "${deviceName}" registered.`);
      setAddModal(false); setDeviceName(""); setIpAddress(""); fetchDevices(true);
    } catch (e: any) { Alert.alert("Error", e.message || "Registration failed."); }
    finally { setSubmitting(false); }
  };

  const filtered = devices.filter(d => !search.trim() || String(d.device_name || "").toLowerCase().includes(search.toLowerCase()));

  if (loading && !refreshing) return <ScreenContainer scrollable={false}><Header title="Biometric Terminals" subtitle="Attendance Hardware" /><DashboardSkeleton /></ScreenContainer>;
  if (error && !devices.length) return <ScreenContainer scrollable={false}><Header title="Biometric Terminals" subtitle="Attendance Hardware" /><ErrorState message={error} onRetry={fetchDevices} /></ScreenContainer>;

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchDevices(true)}>
        <Header title="Biometric Terminals" subtitle="Fingerprint & Face Recognition Devices" rightAction={
          <TouchableOpacity onPress={() => setAddModal(true)} style={[styles.addBtn, { backgroundColor: c.primary }]} activeOpacity={0.8}>
            <Plus size={15} color="#FFF" strokeWidth={2.5} /><Text style={styles.addBtnText}>Add Device</Text>
          </TouchableOpacity>
        } />
        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : "#F1F5F9", borderColor: c.border }]}>
          <Search size={16} color={c.textMuted} /><TextInput placeholder="Search devices..." placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} style={[styles.searchInput, { color: c.textPrimary }]} />
          {search ? <TouchableOpacity onPress={() => setSearch("")}><X size={14} color={c.textMuted} /></TouchableOpacity> : null}
        </View>
        {filtered.length === 0 ? <EmptyState title="No Terminals" description="Register your branch attendance biometric hardware." /> : filtered.map(item => (
          <Card key={String(item.id)} style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: c.primaryLight }]}><Fingerprint size={20} color={c.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: c.textPrimary }]}>{item.device_name}</Text>
                {item.ip_address && <Text style={[styles.sub, { color: c.textMuted }]}>IP: {item.ip_address}</Text>}
              </View>
              <Badge label={item.status || "ONLINE"} variant={item.status === "OFFLINE" ? "error" : "success"} size="sm" />
            </View>
          </Card>
        ))}
      </ScreenContainer>

      <Modal visible={addModal} animationType="slide" transparent onRequestClose={() => setAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
            <View style={styles.modalHeader}><Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>Register Biometric Terminal</Text><TouchableOpacity onPress={() => setAddModal(false)}><X size={22} color={c.textMuted} /></TouchableOpacity></View>
            <TextField label="Device Name *" placeholder="e.g. Main Gate Scanner" value={deviceName} onChangeText={setDeviceName} />
            <TextField label="IP Address" placeholder="e.g. 192.168.1.100" value={ipAddress} onChangeText={setIpAddress} />
            <View style={{ marginTop: 16 }}><PrimaryButton title="Register Terminal" onPress={handleCreate} loading={submitting} /></View>
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