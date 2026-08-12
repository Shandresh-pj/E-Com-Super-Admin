import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, TextInput,
} from "react-native";
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
import { Database, Plus, X, Search, TrendingUp, TrendingDown, Package, ArrowUpDown } from "lucide-react-native";

interface StockItem {
  id?: number | string;
  product_id: number | string;
  product_name?: string;
  sku?: string;
  quantity: number;
  reserved?: number;
  available?: number;
  min_stock?: number;
  max_stock?: number;
  branch_id?: number | string;
  branch_name?: string;
  last_updated?: string;
}

interface StockLog {
  id: number | string;
  product_id: number | string;
  product_name?: string;
  quantity: number;
  type: string;
  reason?: string;
  created_by?: string;
  created_at?: string;
}

type TabType = "stock" | "logs" | "branch";

export const StocksScreen: React.FC = () => {
  const theme = useTheme();
  const c = theme.colors;
  const [activeTab, setActiveTab] = useState<TabType>("stock");
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [branchStocks, setBranchStocks] = useState<StockItem[]>([]);
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [adjustModal, setAdjustModal] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [adjustType, setAdjustType] = useState<"ADDITION" | "DEDUCTION" | "AUDIT_ADJUSTMENT" | "RETURN">("ADDITION");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const totalLowStock = stocks.filter(s => s.min_stock !== undefined && s.quantity <= (s.min_stock || 0)).length;
  const totalStock = stocks.reduce((sum, s) => sum + (s.quantity || 0), 0);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const [stockRes, logRes, branchRes] = await Promise.allSettled([
        axiosClient.get(ENDPOINTS.STOCK),
        axiosClient.get(ENDPOINTS.STOCK_LOGS),
        axiosClient.get(ENDPOINTS.BRANCH_STOCK),
      ]);
      if (stockRes.status === "fulfilled") {
        const d = normalizeApiResponse<StockItem[]>(stockRes.value.data);
        setStocks(Array.isArray(d.data) ? d.data : []);
      }
      if (logRes.status === "fulfilled") {
        const d = normalizeApiResponse<StockLog[]>(logRes.value.data);
        setLogs(Array.isArray(d.data) ? d.data : []);
      }
      if (branchRes.status === "fulfilled") {
        const d = normalizeApiResponse<StockItem[]>(branchRes.value.data);
        setBranchStocks(Array.isArray(d.data) ? d.data : []);
      }
    } catch (e: any) { setError(e.message || "Failed to load stock data"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const handleAdjust = async () => {
    if (!productId || !quantity) { Alert.alert("Required", "Product ID and quantity are required."); return; }
    setSubmitting(true);
    try {
      await axiosClient.post(ENDPOINTS.STOCK_UPDATE, {
        product_id: parseInt(productId, 10),
        quantity: parseInt(quantity, 10),
        type: adjustType,
        reason: reason || "Manual adjustment",
      });
      Alert.alert("Success", "Stock adjusted successfully.");
      setAdjustModal(false); setProductId(""); setQuantity(""); setReason("");
      fetchData(true);
    } catch (e: any) { Alert.alert("Error", e.message || "Adjustment failed."); }
    finally { setSubmitting(false); }
  };

  const filterStocks = (list: StockItem[]) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(s => String(s.product_name || "").toLowerCase().includes(q) || String(s.sku || "").toLowerCase().includes(q) || String(s.branch_name || "").toLowerCase().includes(q));
  };

  const TABS: { key: TabType; label: string }[] = [
    { key: "stock", label: "Central" },
    { key: "branch", label: "Branch" },
    { key: "logs", label: "Logs" },
  ];

  if (loading && !refreshing) return (
    <ScreenContainer scrollable={false}><Header title="Inventory Stock" subtitle="Stock Management" /><DashboardSkeleton /></ScreenContainer>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchData(true)}>
        <Header title="Inventory Stock" subtitle="Central & Branch Stock Control" rightAction={
          <TouchableOpacity onPress={() => setAdjustModal(true)} style={[styles.addBtn, { backgroundColor: c.primary }]} activeOpacity={0.8}>
            <ArrowUpDown size={15} color="#FFF" strokeWidth={2.5} /><Text style={styles.addBtnText}>Adjust</Text>
          </TouchableOpacity>
        } />

        <View style={styles.kpiRow}>
          <Card style={[styles.kpiCard, { backgroundColor: c.primaryLight }]}>
            <Package size={14} color={c.primary} />
            <Text style={[styles.kpiLabel, { color: c.primary }]}>Total Units</Text>
            <Text style={[styles.kpiValue, { color: c.primary }]}>{totalStock.toLocaleString()}</Text>
          </Card>
          <Card style={[styles.kpiCard, { backgroundColor: c.successLight }]}>
            <Database size={14} color={c.success} />
            <Text style={[styles.kpiLabel, { color: c.success }]}>SKUs</Text>
            <Text style={[styles.kpiValue, { color: c.success }]}>{stocks.length}</Text>
          </Card>
          <Card style={[styles.kpiCard, { backgroundColor: "rgba(239,68,68,0.1)" }]}>
            <TrendingDown size={14} color={c.error} />
            <Text style={[styles.kpiLabel, { color: c.error }]}>Low Stock</Text>
            <Text style={[styles.kpiValue, { color: c.error }]}>{totalLowStock}</Text>
          </Card>
        </View>

        <View style={styles.tabBar}>
          {TABS.map(t => (
            <TouchableOpacity key={t.key} style={[styles.tab, activeTab === t.key && { borderBottomColor: c.primary, borderBottomWidth: 2 }]} onPress={() => setActiveTab(t.key)}>
              <Text style={[styles.tabText, { color: activeTab === t.key ? c.primary : c.textMuted }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : "#F1F5F9", borderColor: c.border }]}>
          <Search size={16} color={c.textMuted} />
          <TextInput placeholder="Search products..." placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} style={[styles.searchInput, { color: c.textPrimary }]} />
          {search ? <TouchableOpacity onPress={() => setSearch("")}><X size={14} color={c.textMuted} /></TouchableOpacity> : null}
        </View>

        {activeTab === "stock" && (
          filterStocks(stocks).length === 0
            ? <EmptyState title="No Stock Data" description="No inventory records found." />
            : filterStocks(stocks).map((item, idx) => (
              <Card key={String(item.product_id || idx)} style={styles.stockCard}>
                <View style={styles.stockRow}>
                  <View style={[styles.stockIcon, { backgroundColor: c.primaryLight }]}><Database size={16} color={c.primary} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.prodName, { color: c.textPrimary }]}>{item.product_name || `Product #${item.product_id}`}</Text>
                    {item.sku && <Text style={[styles.sku, { color: c.textMuted }]}>SKU: {item.sku}</Text>}
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.qty, { color: item.min_stock !== undefined && item.quantity <= (item.min_stock || 0) ? c.error : c.success }]}>{item.quantity}</Text>
                    <Text style={[styles.qtyLabel, { color: c.textMuted }]}>units</Text>
                  </View>
                </View>
                {item.min_stock !== undefined && item.quantity <= (item.min_stock || 0) && (
                  <View style={[styles.lowStockBanner, { backgroundColor: "rgba(239,68,68,0.1)" }]}>
                    <TrendingDown size={12} color={c.error} />
                    <Text style={[styles.lowStockText, { color: c.error }]}>Low Stock — Reorder needed</Text>
                  </View>
                )}
              </Card>
            ))
        )}

        {activeTab === "branch" && (
          filterStocks(branchStocks).length === 0
            ? <EmptyState title="No Branch Stock" description="No branch inventory found." />
            : filterStocks(branchStocks).map((item, idx) => (
              <Card key={String(item.product_id || idx)} style={styles.stockCard}>
                <View style={styles.stockRow}>
                  <View style={[styles.stockIcon, { backgroundColor: c.accentLight || c.primaryLight }]}><Package size={16} color={c.accent} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.prodName, { color: c.textPrimary }]}>{item.product_name || `Product #${item.product_id}`}</Text>
                    {item.branch_name && <Text style={[styles.sku, { color: c.textMuted }]}>Branch: {item.branch_name}</Text>}
                  </View>
                  <Text style={[styles.qty, { color: c.primary }]}>{item.quantity}</Text>
                </View>
              </Card>
            ))
        )}

        {activeTab === "logs" && (
          logs.length === 0
            ? <EmptyState title="No Stock Logs" description="No stock movements recorded." />
            : logs.slice(0, 50).map((log) => (
              <Card key={String(log.id)} style={styles.stockCard}>
                <View style={styles.stockRow}>
                  <View style={[styles.stockIcon, { backgroundColor: log.type === "ADDITION" || log.type === "RETURN" ? c.successLight : "rgba(239,68,68,0.1)" }]}>
                    {log.type === "ADDITION" || log.type === "RETURN" ? <TrendingUp size={16} color={c.success} /> : <TrendingDown size={16} color={c.error} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.prodName, { color: c.textPrimary }]}>{log.product_name || `Product #${log.product_id}`}</Text>
                    <Text style={[styles.sku, { color: c.textMuted }]}>{log.reason || log.type}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.qty, { color: log.type === "ADDITION" ? c.success : c.error }]}>
                      {log.type === "ADDITION" ? "+" : "-"}{log.quantity}
                    </Text>
                    <Badge label={log.type} variant={log.type === "ADDITION" ? "success" : "error"} size="sm" />
                  </View>
                </View>
              </Card>
            ))
        )}
      </ScreenContainer>

      <Modal visible={adjustModal} animationType="slide" transparent onRequestClose={() => setAdjustModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
            <View style={styles.modalHeader}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>Stock Adjustment</Text>
              <TouchableOpacity onPress={() => setAdjustModal(false)}><X size={22} color={c.textMuted} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 120 }}>
              <TextField label="Product ID *" placeholder="e.g. 101" value={productId} onChangeText={setProductId} keyboardType="numeric" />
              <TextField label="Quantity *" placeholder="e.g. 50" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
              <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: "700", marginTop: 8, marginBottom: 6 }}>Adjustment Type:</Text>
              <View style={styles.typesRow}>
                {(["ADDITION", "DEDUCTION", "AUDIT_ADJUSTMENT", "RETURN"] as const).map(t => (
                  <TouchableOpacity key={t} onPress={() => setAdjustType(t)}
                    style={[styles.typeChip, { backgroundColor: adjustType === t ? c.primary : c.surfaceSecondary, borderColor: adjustType === t ? c.primary : c.border }]}>
                    <Text style={[styles.typeChipText, { color: adjustType === t ? "#FFF" : c.textSecondary }]}>{t.replace("_", " ")}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextField label="Reason / Memo" placeholder="e.g. Supplier delivery" value={reason} onChangeText={setReason} />
            </ScrollView>
            <PrimaryButton title="Submit Adjustment" onPress={handleAdjust} loading={submitting} />
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
  tabBar: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "rgba(148,163,184,0.2)", marginBottom: 8 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10 },
  tabText: { fontSize: 13, fontWeight: "700" },
  searchBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, height: 44, marginBottom: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 13 },
  stockCard: { marginVertical: 4, padding: 12 },
  stockRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stockIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  prodName: { fontSize: 13, fontWeight: "700" },
  sku: { fontSize: 11, marginTop: 1 },
  qty: { fontSize: 18, fontWeight: "800" },
  qtyLabel: { fontSize: 10 },
  lowStockBanner: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 5, paddingHorizontal: 8, borderRadius: 8, marginTop: 8 },
  lowStockText: { fontSize: 11, fontWeight: "600" },
  typesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  typeChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  typeChipText: { fontSize: 10.5, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, padding: 22, maxHeight: "88%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
});