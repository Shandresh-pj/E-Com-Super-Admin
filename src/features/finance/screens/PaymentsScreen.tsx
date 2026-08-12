import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput, Alert } from "react-native";
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
import { CreditCard, IndianRupee, CheckCircle, XCircle, Clock, Search, X, Smartphone, Banknote } from "lucide-react-native";

interface Payment {
  id: number | string;
  order_id?: number | string;
  order_number?: string;
  customer_name?: string;
  amount: number;
  method: "CASH" | "CARD" | "UPI" | "NETBANKING" | "RAZORPAY" | string;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | string;
  transaction_id?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const PaymentsScreen: React.FC = () => {
  const theme = useTheme();
  const c = theme.colors;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const totalRevenue = payments.filter(p => p.status === "PAID").reduce((s, p) => s + (p.amount || 0), 0);
  const totalPending = payments.filter(p => p.status === "PENDING").reduce((s, p) => s + (p.amount || 0), 0);

  const fetchPayments = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.PAYMENTS);
      const data = normalizeApiResponse<Payment[]>(res.data);
      setPayments(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) { setError(e.message || "Failed to load payments"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchPayments(); }, []);

  const getStatusVariant = (s: string): "success" | "warning" | "error" | "primary" => {
    if (s === "PAID") return "success";
    if (s === "PENDING") return "warning";
    if (s === "FAILED") return "error";
    return "primary";
  };

  const getMethodIcon = (method: string) => {
    if (method === "CASH" || method === "Banknote") return <Banknote size={14} color={c.success} />;
    if (method === "UPI" || method === "Smartphone") return <Smartphone size={14} color={c.primary} />;
    return <CreditCard size={14} color={c.accent} />;
  };

  const STATUSES = ["ALL", "PAID", "PENDING", "FAILED", "REFUNDED"];

  const filtered = payments.filter(p => {
    const matchStatus = filterStatus === "ALL" || p.status === filterStatus;
    const matchSearch = !search.trim() || String(p.order_number || p.order_id || "").toLowerCase().includes(search.toLowerCase()) || String(p.customer_name || "").toLowerCase().includes(search.toLowerCase()) || String(p.transaction_id || "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  if (loading && !refreshing) return (
    <ScreenContainer scrollable={false}><Header title="Payments Ledger" subtitle="Financial Transactions" /><DashboardSkeleton /></ScreenContainer>
  );
  if (error && !payments.length) return (
    <ScreenContainer scrollable={false}><Header title="Payments Ledger" subtitle="Financial Transactions" /><ErrorState message={error} onRetry={fetchPayments} /></ScreenContainer>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchPayments(true)}>
        <Header title="Payments Ledger" subtitle="Transaction & Revenue Management" />

        <View style={styles.kpiRow}>
          <Card style={[styles.kpiCard, { backgroundColor: c.successLight }]}>
            <IndianRupee size={14} color={c.success} />
            <Text style={[styles.kpiLabel, { color: c.success }]}>Collected</Text>
            <Text style={[styles.kpiValue, { color: c.success }]}>{`\u20B9${totalRevenue.toLocaleString("en-IN")}`}</Text>
          </Card>
          <Card style={[styles.kpiCard, { backgroundColor: "rgba(245,158,11,0.12)" }]}>
            <Clock size={14} color={c.warning} />
            <Text style={[styles.kpiLabel, { color: c.warning }]}>Pending</Text>
            <Text style={[styles.kpiValue, { color: c.warning }]}>{`\u20B9${totalPending.toLocaleString("en-IN")}`}</Text>
          </Card>
          <Card style={[styles.kpiCard, { backgroundColor: c.primaryLight }]}>
            <CreditCard size={14} color={c.primary} />
            <Text style={[styles.kpiLabel, { color: c.primary }]}>Total Txns</Text>
            <Text style={[styles.kpiValue, { color: c.primary }]}>{payments.length}</Text>
          </Card>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 8 }}>
          {STATUSES.map(s => (
            <TouchableOpacity key={s} style={[styles.filterChip, { backgroundColor: filterStatus === s ? c.primary : (theme.isDark ? c.surfaceSecondary : "#F1F5F9"), borderColor: filterStatus === s ? c.primary : c.border }]} onPress={() => setFilterStatus(s)}>
              <Text style={[styles.filterChipText, { color: filterStatus === s ? "#FFF" : c.textSecondary }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : "#F1F5F9", borderColor: c.border }]}>
          <Search size={16} color={c.textMuted} />
          <TextInput placeholder="Search by order, customer, txn ID..." placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} style={[styles.searchInput, { color: c.textPrimary }]} />
          {search ? <TouchableOpacity onPress={() => setSearch("")}><X size={14} color={c.textMuted} /></TouchableOpacity> : null}
        </View>

        {filtered.length === 0 ? (
          <EmptyState title="No Payments" description="No transactions match your filter." />
        ) : filtered.map(item => (
          <TouchableOpacity key={String(item.id)} onPress={() => setSelectedPayment(item)} activeOpacity={0.8}>
            <Card style={styles.payCard}>
              <View style={styles.payRow}>
                <View style={[styles.payIcon, { backgroundColor: c.primaryLight }]}><CreditCard size={18} color={c.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.txnTitle, { color: c.textPrimary }]}>
                    {item.order_number ? `Order #${item.order_number}` : item.transaction_id ? `TXN: ${item.transaction_id}` : `Payment #${item.id}`}
                  </Text>
                  {item.customer_name && <Text style={[styles.subText, { color: c.textMuted }]}>{item.customer_name}</Text>}
                  <View style={styles.methodRow}>
                    {getMethodIcon(item.method)}
                    <Text style={[styles.method, { color: c.textMuted }]}>{item.method}</Text>
                  </View>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={[styles.amount, { color: item.status === "PAID" ? c.success : c.primary }]}>
                    {`\u20B9${(item.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                  </Text>
                  <Badge label={item.status} variant={getStatusVariant(item.status)} size="sm" />
                </View>
              </View>
              {item.created_at && (
                <Text style={[styles.date, { color: c.textMuted }]}>{new Date(item.created_at).toLocaleString("en-IN")}</Text>
              )}
            </Card>
          </TouchableOpacity>
        ))}
      </ScreenContainer>

      <Modal visible={!!selectedPayment} animationType="slide" transparent onRequestClose={() => setSelectedPayment(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
            {selectedPayment && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>Payment Details</Text>
                  <TouchableOpacity onPress={() => setSelectedPayment(null)}><X size={22} color={c.textMuted} /></TouchableOpacity>
                </View>

                <View style={[styles.amountBox, { backgroundColor: c.primaryLight }]}>
                  <Text style={[styles.amountLabel, { color: c.primary }]}>Amount</Text>
                  <Text style={[styles.amountValue, { color: c.primary }]}>
                    {`\u20B9${parseFloat(String(selectedPayment.amount || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                  </Text>
                </View>

                {[
                  { label: "Status", badge: true, value: selectedPayment.status },
                  { label: "Method", value: selectedPayment.method },
                  { label: "Transaction ID", value: selectedPayment.transaction_id || "N/A" },
                  { label: "Order Number", value: selectedPayment.order_number ? `#${selectedPayment.order_number}` : `#${selectedPayment.order_id || "N/A"}` },
                  { label: "Customer", value: selectedPayment.customer_name || "Guest Customer" },
                  { label: "Notes", value: selectedPayment.notes || "N/A" },
                  { label: "Date", value: selectedPayment.created_at ? new Date(selectedPayment.created_at).toLocaleString("en-IN") : "N/A" },
                ].map(row => (
                  <View key={row.label} style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: c.textMuted }]}>{row.label}:</Text>
                    {row.badge ? <Badge label={row.value || ""} variant={getStatusVariant(row.value || "")} /> : <Text style={[styles.detailVal, { color: c.textPrimary }]}>{row.value}</Text>}
                  </View>
                ))}

                {/* Quick Action Buttons for Payment Verification / Refund */}
                {selectedPayment.status === "PENDING" && (
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        await axiosClient.post(`${ENDPOINTS.PAYMENTS}/${selectedPayment.id}/verify`);
                        Alert.alert("Verified", `Payment #${selectedPayment.id} verified successfully.`);
                        setSelectedPayment(prev => prev ? { ...prev, status: "PAID" } : null);
                        fetchPayments(true);
                      } catch (e: any) {
                        Alert.alert("Error", e.message || "Verification failed.");
                      }
                    }}
                    style={[styles.actionBtnModal, { backgroundColor: c.success }]}
                  >
                    <CheckCircle size={15} color="#FFF" />
                    <Text style={styles.actionBtnModalText}>Verify & Mark Paid</Text>
                  </TouchableOpacity>
                )}

                {selectedPayment.status === "PAID" && (
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert("Issue Refund", `Process refund for \u20B9${selectedPayment.amount}?`, [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Refund",
                          style: "destructive",
                          onPress: async () => {
                            try {
                              await axiosClient.post(`${ENDPOINTS.PAYMENTS}/${selectedPayment.id}/refund`);
                              Alert.alert("Refunded", `Payment #${selectedPayment.id} marked as REFUNDED.`);
                              setSelectedPayment(prev => prev ? { ...prev, status: "REFUNDED" } : null);
                              fetchPayments(true);
                            } catch (e: any) {
                              Alert.alert("Error", e.message || "Refund failed.");
                            }
                          },
                        },
                      ]);
                    }}
                    style={[styles.actionBtnModal, { backgroundColor: "rgba(239,68,68,0.1)", borderColor: c.error, borderWidth: 1 }]}
                  >
                    <XCircle size={15} color={c.error} />
                    <Text style={[styles.actionBtnModalText, { color: c.error }]}>Process Refund</Text>
                  </TouchableOpacity>
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
  kpiRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  kpiCard: { flex: 1, padding: 12, alignItems: "center", gap: 4 },
  kpiLabel: { fontSize: 9.5, fontWeight: "700", textTransform: "uppercase", textAlign: "center" },
  kpiValue: { fontSize: 13, fontWeight: "800" },
  filterRow: { marginBottom: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontSize: 11, fontWeight: "700" },
  searchBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, height: 44, marginBottom: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 13 },
  payCard: { marginVertical: 4, padding: 12 },
  payRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  payIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  txnTitle: { fontSize: 13, fontWeight: "700" },
  subText: { fontSize: 11, marginTop: 1 },
  methodRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  method: { fontSize: 11 },
  amount: { fontSize: 15, fontWeight: "800" },
  date: { fontSize: 10, marginTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, padding: 22, maxHeight: "88%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  amountBox: { padding: 16, borderRadius: 14, alignItems: "center", marginBottom: 14 },
  amountLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  amountValue: { fontSize: 28, fontWeight: "800", marginTop: 4 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(148,163,184,0.15)" },
  detailLabel: { fontSize: 13, fontWeight: "500" },
  detailVal: { fontSize: 13, fontWeight: "700", maxWidth: "55%", textAlign: "right" },
  actionBtnModal: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 12, marginTop: 14, gap: 6 },
  actionBtnModalText: { color: "#FFF", fontSize: 13, fontWeight: "700" },
});