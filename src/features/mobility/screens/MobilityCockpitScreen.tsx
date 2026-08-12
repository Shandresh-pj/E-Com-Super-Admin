import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { ScreenContainer } from "../../../components/common/ScreenContainer";
import { Header } from "../../../components/common/Header";
import { Card } from "../../../components/common/Card";
import { Badge } from "../../../components/common/Badge";
import { DashboardSkeleton } from "../../../components/skeletons/SkeletonLoader";
import { EmptyState, ErrorState } from "../../../components/common/States";
import { useTheme } from "../../../theme/theme";
import { axiosClient } from "../../../api/axiosClient";
import { ENDPOINTS } from "../../../api/endpoints";
import { normalizeApiResponse } from "../../../api/responseNormalizer";
import { Car, Navigation, Package, ShieldCheck, Activity, MapPin, Compass } from "lucide-react-native";

interface MobilityCockpitData {
  active_vehicles?: number;
  total_bookings?: number;
  live_parcels?: number;
  fleet_health?: string;
  nearby_vehicles?: any[];
  recent_bookings?: any[];
}

export const MobilityCockpitScreen: React.FC = () => {
  const theme = useTheme();
  const c = theme.colors;
  const [data, setData] = useState<MobilityCockpitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCockpit = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.MOBILITY_COCKPIT);
      const resData = normalizeApiResponse<MobilityCockpitData>(res.data);
      setData(resData.data || null);
    } catch (e: any) { setError(e.message || "Failed to load mobility cockpit"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchCockpit(); }, []);

  if (loading && !refreshing) return <ScreenContainer scrollable={false}><Header title="Mobility Cockpit" subtitle="Fleet & Transit Hub" /><DashboardSkeleton /></ScreenContainer>;
  if (error && !data) return <ScreenContainer scrollable={false}><Header title="Mobility Cockpit" subtitle="Fleet & Transit Hub" /><ErrorState message={error} onRetry={fetchCockpit} /></ScreenContainer>;

  return (
    <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchCockpit(true)}>
      <Header title="Mobility Cockpit" subtitle="Enterprise Fleet, Logistics & Transit" />

      {/* KPI Cards */}
      <View style={styles.kpiGrid}>
        {[
          { icon: Car, label: "Active Vehicles", val: data?.active_vehicles ?? 0, color: c.primary, bg: c.primaryLight },
          { icon: Navigation, label: "Bookings", val: data?.total_bookings ?? 0, color: c.success, bg: c.successLight },
          { icon: Package, label: "Live Parcels", val: data?.live_parcels ?? 0, color: c.warning, bg: "rgba(245,158,11,0.12)" },
          { icon: ShieldCheck, label: "Fleet Health", val: data?.fleet_health ?? "98%", color: c.accent, bg: "rgba(139,92,246,0.12)" },
        ].map(k => {
          const Icon = k.icon;
          return (
            <Card key={k.label} style={[styles.kpiCard, { backgroundColor: k.bg }]}>
              <Icon size={16} color={k.color} />
              <Text style={[styles.kpiVal, { color: k.color }]}>{k.val}</Text>
              <Text style={[styles.kpiLabel, { color: k.color }]}>{k.label}</Text>
            </Card>
          );
        })}
      </View>

      {/* Live Operations Section */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Activity size={16} color={c.primary} />
          <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Live Telemetry & Geofencing</Text>
        </View>
        <Text style={[styles.sectionSub, { color: c.textMuted }]}>All fleet telemetry, vehicle KYC, parcel logistics, and transit routes are monitored in real-time.</Text>
      </Card>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  kpiCard: { width: "48%", padding: 14, alignItems: "center", borderRadius: 16, gap: 4 },
  kpiVal: { fontSize: 22, fontWeight: "800" },
  kpiLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", textAlign: "center" },
  sectionCard: { padding: 16, marginVertical: 6 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  sectionTitle: { fontSize: 14, fontWeight: "700" },
  sectionSub: { fontSize: 12, lineHeight: 18 },
});