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
import { FileText, Plus, X, Search, Download, Eye, IndianRupee } from "lucide-react-native";

interface Invoice {
  id: number | string;
  invoice_number?: string;
  order_id?: number | string;
  customer_name?: string;
  customer_email?: string;
  total_amount: number;
  tax_amount?: number;
  discount_amount?: number;
  status: "DRAFT" | "SENT" | "PAID" | "CANCELLED" | string;
  due_date?: string;
  issued_date?: string;
  notes?: string;
  created_at?: string;
}

export const InvoicesScreen: React.FC = () => {
  const theme = useTheme();
  const c = theme.colors;
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const totalRevenue = invoices.filter(i => i.status === "PAID").reduce((s, i) => s + (i.total_amount || 0), 0);

  const fetchInvoices = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.INVOICES);
      const data = normalizeApiResponse<Invoice[]>(res.data);
      setInvoices(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) { setError(e.message || "Failed to load invoices"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchInvoices(); }, []);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      await axiosClient.post(ENDPOINTS.INVOICE_CREATE, {
        order_id: orderId ? parseInt(orderId, 10) : undefined,
        notes,
      });
      Alert.alert("Created", "Invoice generated successfully.");
      setCreateModal(false); setOrderId(""); setNotes("");
      fetchInvoices(true);
    } catch (e: any) { Alert.alert("Error", e.message || "Create failed."); }
    finally { setSubmitting(false); }
  };

  const getStatusVariant = (s: string): "success" | "warning" | "error" | "primary" => {
    if (s === "PAID") return "success";
    if (s === "SENT") return "primary";
    if (s === "DRAFT") return "warning";
    return "error";
  };

  const filtered = invoices.filter(i => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return String(i.invoice_number || "").toLowerCase().includes(q) || String(i.customer_name || "").toLowerCase().includes(q);
  });

  if (loading && !refreshing) return (
    <ScreenContainer scrollable={false}><Header title="Invoice Generator" subtitle="Invoices & Billing" /><DashboardSkeleton /></ScreenContainer>
  );
  if (error && !invoices.length) return (
    <ScreenContainer scrollable={false}><Header title="Invoice Generator" subtitle="Invoices & Billing" /><ErrorState message={error} onRetry={fetchInvoices} /></ScreenContainer>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchInvoices(true)}>
        <Header title="Invoice Generator" subtitle="Billing & Invoice Management" rightAction={
          <TouchableOpacity onPress={() => setCreateModal(true)} style={[styles.addBtn, { backgroundColor: c.primary }]} activeOpacity={0.8}>
            <Plus size={15} color="#FFF" strokeWidth={2.5} /><Text style={styles.addBtnText}>Generate</Text>
          </TouchableOpacity>
        } />

        <View style={styles.kpiRow}>
          <Card style={[styles.kpiCard, { backgroundColor: c.successLight }]}>
            <IndianRupee size={14} color={c.success} />
            <Text style={[styles.kpiLabel, { color: c.success }]}>Paid Revenue</Text>
            <Text style={[styles.kpiValue, { color: c.success }]}>{`\u20B9${totalRevenue.toLocaleString("en-IN")}`}</Text>
          </Card>
          <Card style={[styles.kpiCard, { backgroundColor: c.primaryLight }]}>
            <FileText size={14} color={c.primary} />
            <Text style={[styles.kpiLabel, { color: c.primary }]}>Total</Text>
            <Text style={[styles.kpiValue, { color: c.primary }]}>{invoices.length}</Text>
          </Card>
        </View>

        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : "#F1F5F9", borderColor: c.border }]}>
          <Search size={16} color={c.textMuted} />
          <TextInput placeholder="Search invoices..." placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} style={[styles.searchInput, { color: c.textPrimary }]} />
          {search ? <TouchableOpacity onPress={() => setSearch("")}><X size={14} color={c.textMuted} /></TouchableOpacity> : null}
        </View>

        {filtered.length === 0 ? <EmptyState title="No Invoices" description="Generate your first invoice." /> : filtered.map(item => (
          <TouchableOpacity key={String(item.id)} onPress={() => setSelectedInvoice(item)} activeOpacity={0.8}>
            <Card style={styles.invoiceCard}>
              <View style={styles.invoiceRow}>
                <View style={[styles.invoiceIcon, { backgroundColor: c.primaryLight }]}><FileText size={18} color={c.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.invoiceNum, { color: c.textPrimary }]}>{item.invoice_number || `INV-${item.id}`}</Text>
                  {item.customer_name && <Text style={[styles.detail, { color: c.textMuted }]}>{item.customer_name}</Text>}
                  {item.issued_date && <Text style={[styles.detail, { color: c.textMuted }]}>Issued: {new Date(item.issued_date).toLocaleDateString("en-IN")}</Text>}
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={[styles.amount, { color: c.primary }]}>{`\u20B9${(item.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}</Text>
                  <Badge label={item.status} variant={getStatusVariant(item.status)} size="sm" />
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScreenContainer>

      <Modal visible={createModal} animationType="slide" transparent onRequestClose={() => setCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
            <View style={styles.modalHeader}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>Generate Invoice</Text>
              <TouchableOpacity onPress={() => setCreateModal(false)}><X size={22} color={c.textMuted} /></TouchableOpacity>
            </View>
            <TextField label="Order ID (optional)" placeholder="e.g. 42" value={orderId} onChangeText={setOrderId} keyboardType="numeric" />
            <TextField label="Notes" placeholder="Invoice notes..." value={notes} onChangeText={setNotes} multiline />
            <View style={{ marginTop: 16 }}>
              <PrimaryButton title="Generate Invoice" onPress={handleCreate} loading={submitting} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!selectedInvoice} animationType="slide" transparent onRequestClose={() => setSelectedInvoice(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
            {selectedInvoice && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>{selectedInvoice.invoice_number || `INV-${selectedInvoice.id}`}</Text>
                  <TouchableOpacity onPress={() => setSelectedInvoice(null)}><X size={22} color={c.textMuted} /></TouchableOpacity>
                </View>
                <View style={[styles.amountBox, { backgroundColor: c.primaryLight }]}>
                  <Text style={[styles.amountLabel, { color: c.primary }]}>Total Amount</Text>
                  <Text style={[styles.amountValue, { color: c.primary }]}>{`\u20B9${(selectedInvoice.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}</Text>
                  <Badge label={selectedInvoice.status} variant={getStatusVariant(selectedInvoice.status)} />
                </View>
                {[
                  { label: "Customer", value: selectedInvoice.customer_name || "N/A" },
                  { label: "Order ID", value: selectedInvoice.order_id ? `#${selectedInvoice.order_id}` : "N/A" },
                  { label: "Tax", value: selectedInvoice.tax_amount !== undefined ? `\u20B9${selectedInvoice.tax_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "N/A" },
                  { label: "Discount", value: selectedInvoice.discount_amount !== undefined ? `\u20B9${selectedInvoice.discount_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "N/A" },
                  { label: "Issued", value: selectedInvoice.issued_date ? new Date(selectedInvoice.issued_date).toLocaleDateString("en-IN") : "N/A" },
                  { label: "Due Date", value: selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString("en-IN") : "N/A" },
                  { label: "Notes", value: selectedInvoice.notes || "N/A" },
                ].map(row => (
                  <View key={row.label} style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: c.textMuted }]}>{row.label}:</Text>
                    <Text style={[styles.detailVal, { color: c.textPrimary }]}>{row.value}</Text>
                  </View>
                ))}
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
  kpiValue: { fontSize: 14, fontWeight: "800" },
  searchBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, height: 44, marginBottom: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 13 },
  invoiceCard: { marginVertical: 4, padding: 12 },
  invoiceRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  invoiceIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  invoiceNum: { fontSize: 13, fontWeight: "700" },
  detail: { fontSize: 11, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: "800" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, padding: 22, maxHeight: "88%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  amountBox: { padding: 16, borderRadius: 14, alignItems: "center", marginBottom: 14, gap: 6 },
  amountLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  amountValue: { fontSize: 26, fontWeight: "800" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(148,163,184,0.15)" },
  detailLabel: { fontSize: 13, fontWeight: "500" },
  detailVal: { fontSize: 13, fontWeight: "700", maxWidth: "55%", textAlign: "right" },
});