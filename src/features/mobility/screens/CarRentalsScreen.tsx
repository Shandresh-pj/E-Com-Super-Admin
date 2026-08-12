// CarRentalsScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";
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
import { Car, Search } from "lucide-react-native";

export const CarRentalsScreen: React.FC = () => {
  const theme = useTheme(); const c = theme.colors;
  const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState<string | null>(null); const [search, setSearch] = useState("");

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true); setError(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.CAR_RENTALS);
      const data = normalizeApiResponse<any[]>(res.data);
      setItems(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) { setError(e.message || "Failed to load car rentals"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, []);
  const filtered = items.filter(v => !search.trim() || String(v.car_model || v.customer_name || "").toLowerCase().includes(search.toLowerCase()));

  if (loading && !refreshing) return <ScreenContainer scrollable={false}><Header title="Car Rentals" subtitle="Rental Fleet" /><DashboardSkeleton /></ScreenContainer>;
  if (error && !items.length) return <ScreenContainer scrollable={false}><Header title="Car Rentals" subtitle="Rental Fleet" /><ErrorState message={error} onRetry={fetchData} /></ScreenContainer>;

  return (
    <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchData(true)}>
      <Header title="Car Rentals" subtitle="Self-Drive & Enterprise Rental Fleet" />
      <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : "#F1F5F9", borderColor: c.border }]}>
        <Search size={16} color={c.textMuted} /><TextInput placeholder="Search rentals..." placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} style={[styles.searchInput, { color: c.textPrimary }]} />
      </View>
      {filtered.length === 0 ? <EmptyState title="No Rentals" description="Car rental contracts will appear here." /> : filtered.map((item, idx) => (
        <Card key={String(item.id || idx)} style={styles.card}>
          <View style={styles.cardRow}>
            <View style={[styles.iconBox, { backgroundColor: c.primaryLight }]}><Car size={18} color={c.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: c.textPrimary }]}>{item.car_model || `Rental #${item.id}`}</Text>
              {item.customer_name && <Text style={[styles.sub, { color: c.textMuted }]}>{item.customer_name}</Text>}
            </View>
            <Badge label={item.status || "RENTED"} variant="primary" size="sm" />
          </View>
        </Card>
      ))}
    </ScreenContainer>
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
});