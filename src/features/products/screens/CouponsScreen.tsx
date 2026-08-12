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
import { Ticket, Percent, Calendar, Plus, X, Search, Copy, CheckCircle, XCircle, Tag } from "lucide-react-native";

interface Coupon {
  id: number | string;
  code: string;
  discount_type: "PERCENTAGE" | "FIXED" | string;
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  used_count?: number;
  expiry_date?: string;
  is_active: boolean;
  description?: string;
  created_at?: string;
}

export const CouponsScreen: React.FC = () => {
  const theme = useTheme();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const c = theme.colors;

  const activeCoupons = coupons.filter(c => c.is_active).length;

  const fetchCoupons = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.COUPONS);
      const data = normalizeApiResponse<Coupon[]>(res.data);
      setCoupons(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) {
      setError(e.message || "Failed to load coupons");
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchCoupons(); }, []);

  const handleCreateCoupon = async () => {
    if (!code.trim() || !discountValue) { Alert.alert("Required", "Please fill code and discount value."); return; }
    setSubmitting(true);
    try {
      await axiosClient.post(ENDPOINTS.COUPONS, {
        code: code.toUpperCase(),
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        min_order_amount: minOrder ? parseFloat(minOrder) : undefined,
        max_discount_amount: maxDiscount ? parseFloat(maxDiscount) : undefined,
        usage_limit: usageLimit ? parseInt(usageLimit, 10) : undefined,
        expiry_date: expiryDate || undefined,
        description,
        is_active: true,
      });
      Alert.alert("Created", `Coupon "${code.toUpperCase()}" created successfully.`);
      setAddModal(false);
      setCode(""); setDiscountValue(""); setMinOrder(""); setMaxDiscount(""); setUsageLimit(""); setExpiryDate(""); setDescription("");
      fetchCoupons(true);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to create coupon.");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number | string, couponCode: string) => {
    Alert.alert("Delete Coupon", `Delete coupon "${couponCode}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await axiosClient.delete(ENDPOINTS.COUPON_BY_ID(id));
            fetchCoupons(true);
            setSelectedCoupon(null);
          } catch (e: any) { Alert.alert("Error", e.message || "Delete failed."); }
        },
      },
    ]);
  };

  const filtered = coupons.filter(cp => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(cp.code || "").toLowerCase().includes(q) ||
      String(cp.discount_type || "").toLowerCase().includes(q) ||
      String(cp.description || "").toLowerCase().includes(q)
    );
  });

  const isExpired = (expiry?: string) => expiry && new Date(expiry) < new Date();

  if (loading && !refreshing) return (
    <ScreenContainer scrollable={false}>
      <Header title="Discount Coupons" subtitle="Coupon Management" />
      <DashboardSkeleton />
    </ScreenContainer>
  );

  if (error && !coupons.length) return (
    <ScreenContainer scrollable={false}>
      <Header title="Discount Coupons" subtitle="Coupon Management" />
      <ErrorState message={error} onRetry={() => fetchCoupons()} />
    </ScreenContainer>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchCoupons(true)}>
        <Header
          title="Discount Coupons"
          subtitle="Promotional Code Management"
          rightAction={
            <TouchableOpacity onPress={() => setAddModal(true)} style={[styles.addBtn, { backgroundColor: c.primary }]} activeOpacity={0.8}>
              <Plus size={15} color="#FFF" strokeWidth={2.5} />
              <Text style={styles.addBtnText}>New</Text>
            </TouchableOpacity>
          }
        />

        <View style={styles.kpiRow}>
          <Card style={[styles.kpiCard, { backgroundColor: c.successLight }]}>
            <CheckCircle size={15} color={c.success} />
            <Text style={[styles.kpiLabel, { color: c.success }]}>Active</Text>
            <Text style={[styles.kpiValue, { color: c.success }]}>{activeCoupons}</Text>
          </Card>
          <Card style={[styles.kpiCard, { backgroundColor: c.primaryLight }]}>
            <Ticket size={15} color={c.primary} />
            <Text style={[styles.kpiLabel, { color: c.primary }]}>Total</Text>
            <Text style={[styles.kpiValue, { color: c.primary }]}>{coupons.length}</Text>
          </Card>
          <Card style={[styles.kpiCard, { backgroundColor: "rgba(239,68,68,0.1)" }]}>
            <XCircle size={15} color={c.error} />
            <Text style={[styles.kpiLabel, { color: c.error }]}>Inactive</Text>
            <Text style={[styles.kpiValue, { color: c.error }]}>{coupons.length - activeCoupons}</Text>
          </Card>
        </View>

        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : "#F1F5F9", borderColor: c.border }]}>
          <Search size={16} color={c.textMuted} />
          <TextInput
            placeholder="Search coupons..."
            placeholderTextColor={c.textMuted}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: c.textPrimary }]}
          />
          {search ? <TouchableOpacity onPress={() => setSearch("")}><X size={14} color={c.textMuted} /></TouchableOpacity> : null}
        </View>

        {filtered.length === 0 ? (
          <EmptyState title="No Coupons Found" description="Create your first coupon to start offering discounts." />
        ) : (
          filtered.map(item => (
            <TouchableOpacity key={String(item.id)} onPress={() => setSelectedCoupon(item)} activeOpacity={0.8}>
              <Card style={styles.couponCard}>
                <View style={styles.couponHeader}>
                  <View style={[styles.codeBox, { backgroundColor: c.primaryLight, borderColor: c.primary + "40" }]}>
                    <Tag size={13} color={c.primary} />
                    <Text style={[styles.codeText, { color: c.primary }]}>{item.code}</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                    {isExpired(item.expiry_date) && <Badge label="EXPIRED" variant="error" size="sm" />}
                    <Badge label={item.is_active ? "ACTIVE" : "INACTIVE"} variant={item.is_active ? "success" : "error"} size="sm" />
                  </View>
                </View>

                <View style={styles.discountRow}>
                  <View style={[styles.discountBadge, { backgroundColor: c.accentLight || c.primaryLight }]}>
                    <Percent size={13} color={c.accent} />
                    <Text style={[styles.discountText, { color: c.accent }]}>
                      {item.discount_type === "PERCENTAGE" ? `${item.discount_value}% OFF` : `\u20B9${item.discount_value} OFF`}
                    </Text>
                  </View>
                  {item.min_order_amount !== undefined && (
                    <Text style={[styles.minOrder, { color: c.textMuted }]}>
                      Min. Order: {`\u20B9${item.min_order_amount}`}
                    </Text>
                  )}
                </View>

                {item.expiry_date && (
                  <Text style={[styles.expiry, { color: isExpired(item.expiry_date) ? c.error : c.textMuted }]}>
                    Expires: {new Date(item.expiry_date).toLocaleDateString("en-IN")}
                  </Text>
                )}

                {item.usage_limit !== undefined && (
                  <Text style={[styles.usage, { color: c.textMuted }]}>
                    Used: {item.used_count || 0} / {item.usage_limit}
                  </Text>
                )}
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScreenContainer>

      {/* Create Coupon Modal */}
      <Modal visible={addModal} animationType="slide" transparent onRequestClose={() => setAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFFFFF", borderColor: c.border }]}>
            <View style={styles.modalHeader}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>Create Coupon</Text>
              <TouchableOpacity onPress={() => setAddModal(false)}><X size={22} color={c.textMuted} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 160 }}>
              <TextField label="Coupon Code *" placeholder="e.g. SUMMER20" value={code} onChangeText={v => setCode(v.toUpperCase())} autoCapitalize="characters" />
              <Text style={[styles.pickerLabel, { color: c.textSecondary }]}>Discount Type:</Text>
              <View style={styles.typesRow}>
                {(["PERCENTAGE", "FIXED"] as const).map(t => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setDiscountType(t)}
                    style={[styles.typeChip, { backgroundColor: discountType === t ? c.primary : c.surfaceSecondary, borderColor: discountType === t ? c.primary : c.border }]}
                  >
                    <Text style={[styles.typeChipText, { color: discountType === t ? "#FFF" : c.textSecondary }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextField label={discountType === "PERCENTAGE" ? "Discount % *" : "Discount Amount (INR) *"} placeholder={discountType === "PERCENTAGE" ? "e.g. 15" : "e.g. 100"} value={discountValue} onChangeText={setDiscountValue} keyboardType="numeric" />
              <TextField label="Minimum Order Amount (INR)" placeholder="e.g. 500" value={minOrder} onChangeText={setMinOrder} keyboardType="numeric" />
              <TextField label="Max Discount Cap (INR)" placeholder="e.g. 200" value={maxDiscount} onChangeText={setMaxDiscount} keyboardType="numeric" />
              <TextField label="Usage Limit" placeholder="e.g. 100" value={usageLimit} onChangeText={setUsageLimit} keyboardType="numeric" />
              <TextField label="Expiry Date (YYYY-MM-DD)" placeholder="e.g. 2025-12-31" value={expiryDate} onChangeText={setExpiryDate} />
              <TextField label="Description" placeholder="Brief coupon description..." value={description} onChangeText={setDescription} multiline />
            </ScrollView>
            <PrimaryButton title="Create Coupon" onPress={handleCreateCoupon} loading={submitting} />
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={!!selectedCoupon} animationType="slide" transparent onRequestClose={() => setSelectedCoupon(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFFFFF", borderColor: c.border }]}>
            {selectedCoupon && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={{ fontSize: 18, fontWeight: "800", color: c.primary }}>{selectedCoupon.code}</Text>
                  <TouchableOpacity onPress={() => setSelectedCoupon(null)}><X size={22} color={c.textMuted} /></TouchableOpacity>
                </View>
                {[
                  { label: "Discount Type", value: selectedCoupon.discount_type },
                  { label: "Discount Value", value: selectedCoupon.discount_type === "PERCENTAGE" ? `${selectedCoupon.discount_value}%` : `\u20B9${selectedCoupon.discount_value}` },
                  { label: "Min Order", value: selectedCoupon.min_order_amount !== undefined ? `\u20B9${selectedCoupon.min_order_amount}` : "N/A" },
                  { label: "Max Discount", value: selectedCoupon.max_discount_amount !== undefined ? `\u20B9${selectedCoupon.max_discount_amount}` : "N/A" },
                  { label: "Usage", value: `${selectedCoupon.used_count || 0} / ${selectedCoupon.usage_limit || "Unlimited"}` },
                  { label: "Expiry", value: selectedCoupon.expiry_date ? new Date(selectedCoupon.expiry_date).toLocaleDateString("en-IN") : "No expiry" },
                  { label: "Description", value: selectedCoupon.description || "N/A" },
                ].map(row => (
                  <View key={row.label} style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: c.textMuted }]}>{row.label}:</Text>
                    <Text style={[styles.detailVal, { color: c.textPrimary }]}>{row.value}</Text>
                  </View>
                ))}
                <View style={{ marginTop: 16 }}>
                  <TouchableOpacity
                    style={[styles.deleteBtn, { backgroundColor: "rgba(239,68,68,0.1)", borderColor: c.error + "40" }]}
                    onPress={() => handleDelete(selectedCoupon.id, selectedCoupon.code)}
                    activeOpacity={0.8}
                  >
                    <XCircle size={15} color={c.error} />
                    <Text style={[styles.deleteBtnText, { color: c.error }]}>Delete Coupon</Text>
                  </TouchableOpacity>
                </View>
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
  searchBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, height: 44, marginBottom: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 13 },
  couponCard: { marginVertical: 5, padding: 14 },
  couponHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  codeBox: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  codeText: { fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  discountRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  discountBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  discountText: { fontSize: 12, fontWeight: "800" },
  minOrder: { fontSize: 11 },
  expiry: { fontSize: 11, marginTop: 2 },
  usage: { fontSize: 11, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, padding: 22, maxHeight: "88%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  pickerLabel: { fontSize: 12, fontWeight: "700", marginTop: 6, marginBottom: 6 },
  typesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  typeChipText: { fontSize: 11, fontWeight: "700" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(148,163,184,0.15)" },
  detailLabel: { fontSize: 13, fontWeight: "500" },
  detailVal: { fontSize: 13, fontWeight: "700", maxWidth: "55%", textAlign: "right" },
  deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 12, borderWidth: 1, gap: 6 },
  deleteBtnText: { fontSize: 13, fontWeight: "700" },
});