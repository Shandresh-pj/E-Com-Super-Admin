import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { ScreenContainer } from "../../../components/common/ScreenContainer";
import { Header } from "../../../components/common/Header";
import { Card } from "../../../components/common/Card";
import { DashboardSkeleton } from "../../../components/skeletons/SkeletonLoader";
import { ErrorState } from "../../../components/common/States";
import { useTheme } from "../../../theme/theme";
import { axiosClient } from "../../../api/axiosClient";
import { ENDPOINTS } from "../../../api/endpoints";
import { normalizeApiResponse } from "../../../api/responseNormalizer";
import { TrendingUp, TrendingDown, IndianRupee, PieChart, RefreshCw, Activity } from "lucide-react-native";

interface ProfitLossData {
  total_revenue?: number;
  total_cost?: number;
  gross_profit?: number;
  net_profit?: number;
  profit_margin?: number;
  total_orders?: number;
  total_expenses?: number;
  period?: string;
  monthly?: Array<{ month: string; revenue: number; cost: number; profit: number }>;
}

export const ProfitLossScreen: React.FC = () => {
  const theme = useTheme();
  const c = theme.colors;
  const [data, setData] = useState<ProfitLossData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.PROFIT_LOSS);
      const resp = normalizeApiResponse<ProfitLossData>(res.data);
      setData(resp.data || null);
    } catch (e: any) { setError(e.message || "Failed to load P&L data"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const formatCurrency = (val?: number) => val !== undefined ? `\u20B9${(val).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "N/A";
  const formatPct = (val?: number) => val !== undefined ? `${val.toFixed(2)}%` : "N/A";
  const isProfit = (data?.gross_profit || 0) >= 0;

  if (loading && !refreshing) return (
    <ScreenContainer scrollable={false}><Header title="Profit & Loss" subtitle="Financial Performance" /><DashboardSkeleton /></ScreenContainer>
  );
  if (error) return (
    <ScreenContainer scrollable={false}><Header title="Profit & Loss" subtitle="Financial Performance" /><ErrorState message={error} onRetry={fetchData} /></ScreenContainer>
  );

  return (
    <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchData(true)}>
      <Header title="Profit & Loss" subtitle="Executive Financial Overview" />

      <View style={[styles.heroCard, { backgroundColor: isProfit ? c.successLight : "rgba(239,68,68,0.1)" }]}>
        <View style={styles.heroIcon}>
          {isProfit ? <TrendingUp size={28} color={c.success} /> : <TrendingDown size={28} color={c.error} />}
        </View>
        <Text style={[styles.heroLabel, { color: isProfit ? c.success : c.error }]}>
          {isProfit ? "Profitable" : "Net Loss"}
        </Text>
        <Text style={[styles.heroAmount, { color: isProfit ? c.success : c.error }]}>
          {formatCurrency(data?.gross_profit)}
        </Text>
        {data?.profit_margin !== undefined && (
          <Text style={[styles.heroMargin, { color: isProfit ? c.success : c.error }]}>
            {formatPct(data.profit_margin)} margin
          </Text>
        )}
      </View>

      <View style={styles.kpiGrid}>
        {[
          { label: "Total Revenue", value: formatCurrency(data?.total_revenue), icon: <IndianRupee size={16} color={c.primary} />, bg: c.primaryLight, color: c.primary },
          { label: "Total Cost (COGS)", value: formatCurrency(data?.total_cost), icon: <TrendingDown size={16} color={c.error} />, bg: "rgba(239,68,68,0.1)", color: c.error },
          { label: "Gross Profit", value: formatCurrency(data?.gross_profit), icon: <TrendingUp size={16} color={c.success} />, bg: c.successLight, color: c.success },
          { label: "Net Profit", value: formatCurrency(data?.net_profit), icon: <Activity size={16} color={c.accent} />, bg: c.accentLight || c.primaryLight, color: c.accent },
          { label: "Total Orders", value: String(data?.total_orders || 0), icon: <PieChart size={16} color={c.primary} />, bg: c.primaryLight, color: c.primary },
          { label: "Expenses", value: formatCurrency(data?.total_expenses), icon: <IndianRupee size={16} color={c.warning} />, bg: "rgba(245,158,11,0.12)", color: c.warning },
        ].map(item => (
          <Card key={item.label} style={[styles.kpiCard, { backgroundColor: item.bg }]}>
            {item.icon}
            <Text style={[styles.kpiLabel, { color: item.color }]}>{item.label}</Text>
            <Text style={[styles.kpiValue, { color: item.color }]}>{item.value}</Text>
          </Card>
        ))}
      </View>

      {data?.monthly && data.monthly.length > 0 && (
        <Card style={styles.monthlyCard}>
          <Text style={[styles.monthlyTitle, { color: c.textPrimary }]}>Monthly Breakdown</Text>
          {data.monthly.map((m, idx) => (
            <View key={idx} style={styles.monthRow}>
              <Text style={[styles.monthName, { color: c.textSecondary }]}>{m.month}</Text>
              <Text style={[styles.monthRevenue, { color: c.primary }]}>{`\u20B9${m.revenue.toLocaleString("en-IN")}`}</Text>
              <Text style={[styles.monthProfit, { color: m.profit >= 0 ? c.success : c.error }]}>
                {m.profit >= 0 ? "+" : ""}{`\u20B9${m.profit.toLocaleString("en-IN")}`}
              </Text>
            </View>
          ))}
        </Card>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  heroCard: { borderRadius: 20, padding: 24, alignItems: "center", marginBottom: 16 },
  heroIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.5)", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  heroLabel: { fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  heroAmount: { fontSize: 32, fontWeight: "800", marginTop: 4 },
  heroMargin: { fontSize: 13, fontWeight: "600", marginTop: 4, opacity: 0.8 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  kpiCard: { width: "48%", padding: 14, gap: 6 },
  kpiLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  kpiValue: { fontSize: 15, fontWeight: "800" },
  monthlyCard: { padding: 16 },
  monthlyTitle: { fontSize: 15, fontWeight: "800", marginBottom: 12 },
  monthRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(148,163,184,0.15)" },
  monthName: { fontSize: 12, fontWeight: "600", width: 80 },
  monthRevenue: { fontSize: 12, fontWeight: "700" },
  monthProfit: { fontSize: 12, fontWeight: "800" },
});