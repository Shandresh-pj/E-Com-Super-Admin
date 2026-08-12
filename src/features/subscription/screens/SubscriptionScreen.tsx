import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert } from "react-native";
import { ScreenContainer } from "../../../components/common/ScreenContainer";
import { Header } from "../../../components/common/Header";
import { Card } from "../../../components/common/Card";
import { Badge } from "../../../components/common/Badge";
import { PrimaryButton } from "../../../components/buttons/PrimaryButton";
import { TextField } from "../../../components/inputs/TextField";
import { DashboardSkeleton } from "../../../components/skeletons/SkeletonLoader";
import { EmptyState, ErrorState } from "../../../components/common/States";
import { useTheme } from "../../../theme/theme";
import { axiosClient } from "../../../api/axiosClient";
import { ENDPOINTS } from "../../../api/endpoints";
import { normalizeApiResponse } from "../../../api/responseNormalizer";
import { Star, CheckCircle, X, ArrowUpRight, CreditCard, History, Tag } from "lucide-react-native";

interface SubscriptionPlan { id: number | string; name: string; price: number; duration_days?: number; features?: string[]; is_popular?: boolean; max_users?: number; }
interface BillingRecord { id: number | string; plan_name?: string; amount: number; status: string; paid_at?: string; }

type TabType = "plans" | "history" | "coupons";

export const SubscriptionScreen: React.FC = () => {
  const theme = useTheme();
  const c = theme.colors;
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [history, setHistory] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("plans");
  const [upgradeModal, setUpgradeModal] = useState<SubscriptionPlan | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const [plansRes, historyRes] = await Promise.allSettled([
        axiosClient.get(ENDPOINTS.SUBSCRIPTION_PLANS),
        axiosClient.get(ENDPOINTS.SUBSCRIPTION_HISTORY),
      ]);
      if (plansRes.status === "fulfilled") { const d = normalizeApiResponse<SubscriptionPlan[]>(plansRes.value.data); setPlans(Array.isArray(d.data) ? d.data : []); }
      if (historyRes.status === "fulfilled") { const d = normalizeApiResponse<BillingRecord[]>(historyRes.value.data); setHistory(Array.isArray(d.data) ? d.data : []); }
    } catch (e: any) { setError(e.message || "Failed to load subscription data"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const handleUpgrade = async () => {
    if (!upgradeModal) return;
    setSubmitting(true);
    try {
      await axiosClient.post(ENDPOINTS.SUBSCRIPTION_UPGRADE, { plan_id: upgradeModal.id, coupon_code: couponCode || undefined });
      Alert.alert("Upgraded!", `You are now on the ${upgradeModal.name} plan.`);
      setUpgradeModal(null); setCouponCode(""); fetchData(true);
    } catch (e: any) { Alert.alert("Error", e.message || "Upgrade failed."); }
    finally { setSubmitting(false); }
  };

  const TABS: { key: TabType; label: string }[] = [{ key: "plans", label: "Plans" }, { key: "history", label: "Billing History" }];

  if (loading && !refreshing) return <ScreenContainer scrollable={false}><Header title="Subscriptions" subtitle="Plan Management" /><DashboardSkeleton /></ScreenContainer>;
  if (error) return <ScreenContainer scrollable={false}><Header title="Subscriptions" subtitle="Plan Management" /><ErrorState message={error} onRetry={fetchData} /></ScreenContainer>;

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchData(true)}>
        <Header title="Subscriptions" subtitle="Plan & Billing Management" />
        <View style={styles.tabBar}>
          {TABS.map(t => <TouchableOpacity key={t.key} style={[styles.tab, activeTab === t.key && { borderBottomColor: c.primary, borderBottomWidth: 2 }]} onPress={() => setActiveTab(t.key)}><Text style={[styles.tabText, { color: activeTab === t.key ? c.primary : c.textMuted }]}>{t.label}</Text></TouchableOpacity>)}
        </View>

        {activeTab === "plans" && (
          plans.length === 0 ? <EmptyState title="No Plans" description="No subscription plans available." /> :
          plans.map(plan => (
            <Card key={String(plan.id)} style={[styles.planCard, plan.is_popular && { borderColor: c.primary, borderWidth: 2 }]}>
              {plan.is_popular && <View style={[styles.popularBadge, { backgroundColor: c.primary }]}><Text style={styles.popularText}>POPULAR</Text></View>}
              <View style={styles.planHeader}>
                <Star size={20} color={c.warning} fill={c.warning} />
                <Text style={[styles.planName, { color: c.textPrimary }]}>{plan.name}</Text>
              </View>
              <Text style={[styles.planPrice, { color: c.primary }]}>{`\u20B9${plan.price.toLocaleString("en-IN")}`}<Text style={[styles.planPer, { color: c.textMuted }]}>/{plan.duration_days || 30}d</Text></Text>
              {plan.features?.map((f, i) => <View key={i} style={styles.featureRow}><CheckCircle size={13} color={c.success} /><Text style={[styles.featureText, { color: c.textSecondary }]}>{f}</Text></View>)}
              <TouchableOpacity style={[styles.upgradeBtn, { backgroundColor: c.primary }]} onPress={() => setUpgradeModal(plan)} activeOpacity={0.8}>
                <ArrowUpRight size={14} color="#FFF" /><Text style={styles.upgradeBtnText}>Upgrade to {plan.name}</Text>
              </TouchableOpacity>
            </Card>
          ))
        )}

        {activeTab === "history" && (
          history.length === 0 ? <EmptyState title="No Billing History" description="No past transactions found." /> :
          history.map(record => (
            <Card key={String(record.id)} style={styles.historyCard}>
              <View style={styles.historyRow}>
                <View style={[styles.historyIcon, { backgroundColor: c.primaryLight }]}><History size={16} color={c.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.historyPlan, { color: c.textPrimary }]}>{record.plan_name || "Subscription"}</Text>
                  {record.paid_at && <Text style={[styles.historyDate, { color: c.textMuted }]}>{new Date(record.paid_at).toLocaleDateString("en-IN")}</Text>}
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={[styles.historyAmount, { color: c.primary }]}>{`\u20B9${(record.amount || 0).toLocaleString("en-IN")}`}</Text>
                  <Badge label={record.status} variant={record.status === "PAID" ? "success" : "warning"} size="sm" />
                </View>
              </View>
            </Card>
          ))
        )}
      </ScreenContainer>

      <Modal visible={!!upgradeModal} animationType="slide" transparent onRequestClose={() => setUpgradeModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
            {upgradeModal && (
              <>
                <View style={styles.modalHeader}><Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>Upgrade to {upgradeModal.name}</Text><TouchableOpacity onPress={() => setUpgradeModal(null)}><X size={22} color={c.textMuted} /></TouchableOpacity></View>
                <View style={[styles.priceBox, { backgroundColor: c.primaryLight }]}>
                  <Text style={[styles.priceLabel, { color: c.primary }]}>Plan Price</Text>
                  <Text style={[styles.priceValue, { color: c.primary }]}>{`\u20B9${upgradeModal.price.toLocaleString("en-IN")}`}</Text>
                </View>
                <TextField label="Coupon Code (optional)" placeholder="Enter promo code..." value={couponCode} onChangeText={setCouponCode} autoCapitalize="characters" />
                <View style={{ marginTop: 16 }}>
                  <PrimaryButton title={`Confirm Upgrade — \u20B9${upgradeModal.price.toLocaleString("en-IN")}`} onPress={handleUpgrade} loading={submitting} />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "rgba(148,163,184,0.2)", marginBottom: 12 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10 },
  tabText: { fontSize: 13, fontWeight: "700" },
  planCard: { marginVertical: 8, padding: 18, position: "relative", overflow: "hidden" },
  popularBadge: { position: "absolute", top: 0, right: 0, paddingHorizontal: 10, paddingVertical: 4, borderBottomLeftRadius: 12 },
  popularText: { color: "#FFF", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  planHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  planName: { fontSize: 18, fontWeight: "800" },
  planPrice: { fontSize: 28, fontWeight: "800", marginBottom: 12 },
  planPer: { fontSize: 14, fontWeight: "500" },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  featureText: { fontSize: 13, fontWeight: "500" },
  upgradeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 14, paddingVertical: 13, borderRadius: 14, gap: 6 },
  upgradeBtnText: { color: "#FFF", fontSize: 14, fontWeight: "800" },
  historyCard: { marginVertical: 4, padding: 12 },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  historyIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  historyPlan: { fontSize: 13, fontWeight: "700" },
  historyDate: { fontSize: 11, marginTop: 2 },
  historyAmount: { fontSize: 14, fontWeight: "800" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, padding: 22, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  priceBox: { padding: 16, borderRadius: 14, alignItems: "center", marginBottom: 14 },
  priceLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  priceValue: { fontSize: 26, fontWeight: "800", marginTop: 4 },
});