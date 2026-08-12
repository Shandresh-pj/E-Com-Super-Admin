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
import { Truck, MapPin, Package, CheckCircle, Clock, XCircle, Plus, X, Search, Navigation } from "lucide-react-native";

interface DeliveryRecord {
  id: number | string;
  order_id?: number | string;
  order_number?: string;
  delivery_boy_id?: number | string;
  delivery_boy_name?: string;
  customer_name?: string;
  delivery_address?: string;
  status: "PENDING" | "IN_TRANSIT" | "DELIVERED" | "FAILED" | "CANCELLED" | string;
  started_at?: string;
  delivered_at?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
}

export const DeliveryTrackingScreen: React.FC = () => {
  const theme = useTheme();
  const c = theme.colors;
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRecord | null>(null);
  const [dispatchModal, setDispatchModal] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const statusCounts = {
    pending: deliveries.filter(d => d.status === "PENDING").length,
    inTransit: deliveries.filter(d => d.status === "IN_TRANSIT").length,
    delivered: deliveries.filter(d => d.status === "DELIVERED").length,
  };

  const fetchDeliveries = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.DELIVERY_TRACKING);
      const data = normalizeApiResponse<DeliveryRecord[]>(res.data);
      setDeliveries(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) { setError(e.message || "Failed to load deliveries"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchDeliveries(); }, []);

  const handleMarkDelivered = async (id: number | string) => {
    try {
      await axiosClient.patch(ENDPOINTS.DELIVERY_DELIVERED(id));
      Alert.alert("Done", "Delivery marked as completed.");
      fetchDeliveries(true); setSelectedDelivery(null);
    } catch (e: any) { Alert.alert("Error", e.message || "Action failed."); }
  };

  const handleDispatch = async () => {
    if (!orderId) { Alert.alert("Required", "Order ID is required."); return; }
    setSubmitting(true);
    try {
      await axiosClient.post(ENDPOINTS.DELIVERY_TRACKING_START, { order_id: parseInt(orderId, 10), notes });
      Alert.alert("Dispatched", "Delivery tracking initiated.");
      setDispatchModal(false); setOrderId(""); setNotes(""); fetchDeliveries(true);
    } catch (e: any) { Alert.alert("Error", e.message || "Dispatch failed."); }
    finally { setSubmitting(false); }
  };

  const getStatusVariant = (status: string): "success" | "warning" | "error" | "primary" => {
    if (status === "DELIVERED") return "success";
    if (status === "IN_TRANSIT") return "primary";
    if (status === "PENDING") return "warning";
    return "error";
  };

  const getStatusIcon = (status: string) => {
    if (status === "DELIVERED") return <CheckCircle size={16} color={c.success} />;
    if (status === "IN_TRANSIT") return <Navigation size={16} color={c.primary} />;
    if (status === "PENDING") return <Clock size={16} color={c.warning} />;
    return <XCircle size={16} color={c.error} />;
  };

  const STATUSES = ["ALL", "PENDING", "IN_TRANSIT", "DELIVERED", "FAILED", "CANCELLED"];

  const filtered = deliveries.filter(d => {
    const matchesFilter = filterStatus === "ALL" || d.status === filterStatus;
    const matchesSearch = !search.trim() || String(d.order_number || d.order_id || "").toLowerCase().includes(search.toLowerCase()) || String(d.customer_name || "").toLowerCase().includes(search.toLowerCase()) || String(d.delivery_boy_name || "").toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading && !refreshing) return (
    <ScreenContainer scrollable={false}><Header title="Delivery Tracking" subtitle="Logistics Control" /><DashboardSkeleton /></ScreenContainer>
  );
  if (error && !deliveries.length) return (
    <ScreenContainer scrollable={false}><Header title="Delivery Tracking" subtitle="Logistics Control" /><ErrorState message={error} onRetry={fetchDeliveries} /></ScreenContainer>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchDeliveries(true)}>
        <Header title="Delivery Tracking" subtitle="Live Logistics Management" rightAction={
          <TouchableOpacity onPress={() => setDispatchModal(true)} style={[styles.addBtn, { backgroundColor: c.primary }]} activeOpacity={0.8}>
            <Plus size={15} color="#FFF" strokeWidth={2.5} /><Text style={styles.addBtnText}>Dispatch</Text>
          </TouchableOpacity>
        } />

        <View style={styles.kpiRow}>
          <Card style={[styles.kpiCard, { backgroundColor: "rgba(245,158,11,0.12)" }]}>
            <Clock size={14} color={c.warning} />
            <Text style={[styles.kpiLabel, { color: c.warning }]}>Pending</Text>
            <Text style={[styles.kpiValue, { color: c.warning }]}>{statusCounts.pending}</Text>
          </Card>
          <Card style={[styles.kpiCard, { backgroundColor: c.primaryLight }]}>
            <Truck size={14} color={c.primary} />
            <Text style={[styles.kpiLabel, { color: c.primary }]}>In Transit</Text>
            <Text style={[styles.kpiValue, { color: c.primary }]}>{statusCounts.inTransit}</Text>
          </Card>
          <Card style={[styles.kpiCard, { backgroundColor: c.successLight }]}>
            <CheckCircle size={14} color={c.success} />
            <Text style={[styles.kpiLabel, { color: c.success }]}>Delivered</Text>
            <Text style={[styles.kpiValue, { color: c.success }]}>{statusCounts.delivered}</Text>
          </Card>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 0 }}>
          {STATUSES.map(s => (
            <TouchableOpacity key={s} style={[styles.filterChip, { backgroundColor: filterStatus === s ? c.primary : (theme.isDark ? c.surfaceSecondary : "#F1F5F9"), borderColor: filterStatus === s ? c.primary : c.border }]} onPress={() => setFilterStatus(s)}>
              <Text style={[styles.filterChipText, { color: filterStatus === s ? "#FFF" : c.textSecondary }]}>{s === "ALL" ? "All" : s.replace("_", " ")}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : "#F1F5F9", borderColor: c.border }]}>
          <Search size={16} color={c.textMuted} />
          <TextInput placeholder="Search by order, customer, rider..." placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} style={[styles.searchInput, { color: c.textPrimary }]} />
          {search ? <TouchableOpacity onPress={() => setSearch("")}><X size={14} color={c.textMuted} /></TouchableOpacity> : null}
        </View>

        {filtered.length === 0 ? (
          <EmptyState title="No Deliveries" description="No delivery records match your filter." />
        ) : filtered.map(item => (
          <TouchableOpacity key={String(item.id)} onPress={() => setSelectedDelivery(item)} activeOpacity={0.8}>
            <Card style={styles.deliveryCard}>
              <View style={styles.deliveryRow}>
                <View style={[styles.deliveryIcon, { backgroundColor: c.primaryLight }]}><Truck size={18} color={c.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.orderNum, { color: c.textPrimary }]}>
                    {item.order_number ? `Order #${item.order_number}` : `Delivery #${item.id}`}
                  </Text>
                  {item.customer_name && <Text style={[styles.detail, { color: c.textMuted }]}>{item.customer_name}</Text>}
                  {item.delivery_boy_name && <Text style={[styles.detail, { color: c.textMuted }]}>Rider: {item.delivery_boy_name}</Text>}
                </View>
                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  {getStatusIcon(item.status)}
                  <Badge label={item.status.replace("_", " ")} variant={getStatusVariant(item.status)} size="sm" />
                </View>
              </View>
              {item.delivery_address && (
                <View style={styles.addressRow}>
                  <MapPin size={12} color={c.textMuted} />
                  <Text style={[styles.address, { color: c.textMuted }]} numberOfLines={1}>{item.delivery_address}</Text>
                </View>
              )}
            </Card>
          </TouchableOpacity>
        ))}
      </ScreenContainer>

      <Modal visible={dispatchModal} animationType="slide" transparent onRequestClose={() => setDispatchModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
            <View style={styles.modalHeader}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>Dispatch Delivery</Text>
              <TouchableOpacity onPress={() => setDispatchModal(false)}><X size={22} color={c.textMuted} /></TouchableOpacity>
            </View>
            <TextField label="Order ID *" placeholder="e.g. 42" value={orderId} onChangeText={setOrderId} keyboardType="numeric" />
            <TextField label="Delivery Notes" placeholder="Instructions for rider..." value={notes} onChangeText={setNotes} multiline />
            <View style={{ marginTop: 16 }}>
              <PrimaryButton title="Launch Delivery" onPress={handleDispatch} loading={submitting} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!selectedDelivery} animationType="slide" transparent onRequestClose={() => setSelectedDelivery(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
            {selectedDelivery && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>
                    {selectedDelivery.order_number ? `Order #${selectedDelivery.order_number}` : `Delivery #${selectedDelivery.id}`}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedDelivery(null)}><X size={22} color={c.textMuted} /></TouchableOpacity>
                </View>
                <Badge label={selectedDelivery.status.replace("_", " ")} variant={getStatusVariant(selectedDelivery.status)} />
                {[
                  { label: "Customer", value: selectedDelivery.customer_name },
                  { label: "Rider", value: selectedDelivery.delivery_boy_name },
                  { label: "Address", value: selectedDelivery.delivery_address },
                  { label: "Notes", value: selectedDelivery.notes },
                  { label: "Started", value: selectedDelivery.started_at ? new Date(selectedDelivery.started_at).toLocaleString("en-IN") : undefined },
                  { label: "Delivered", value: selectedDelivery.delivered_at ? new Date(selectedDelivery.delivered_at).toLocaleString("en-IN") : undefined },
                ].filter(r => r.value).map(row => (
                  <View key={row.label} style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: c.textMuted }]}>{row.label}:</Text>
                    <Text style={[styles.detailVal, { color: c.textPrimary }]}>{row.value}</Text>
                  </View>
                ))}
                {selectedDelivery.status === "IN_TRANSIT" && (
                  <View style={{ marginTop: 16 }}>
                    <PrimaryButton title="Mark as Delivered" onPress={() => handleMarkDelivered(selectedDelivery.id)} />
                  </View>
                )}
              </ScrollView>
            )}
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
  filterRow: { marginBottom: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontSize: 11, fontWeight: "700" },
  searchBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, height: 44, marginBottom: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 13 },
  deliveryCard: { marginVertical: 4, padding: 12 },
  deliveryRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  deliveryIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  orderNum: { fontSize: 14, fontWeight: "700" },
  detail: { fontSize: 11, marginTop: 2 },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  address: { fontSize: 11, flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, padding: 22, maxHeight: "88%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(148,163,184,0.15)" },
  detailLabel: { fontSize: 13, fontWeight: "500" },
  detailVal: { fontSize: 13, fontWeight: "700", maxWidth: "60%", textAlign: "right" },
});