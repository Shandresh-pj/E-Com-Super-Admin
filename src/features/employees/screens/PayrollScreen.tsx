import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
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
import {
  IndianRupee,
  User,
  Download,
  Search,
  X,
  Clock,
  CheckCircle,
} from "lucide-react-native";

interface PayrollRecord {
  id: number | string;
  employee_id: number | string;
  employee_name?: string;
  month: string;
  year: number;
  basic_salary: number;
  hra?: number;
  allowances?: number;
  deductions?: number;
  net_salary: number;
  gross_salary?: number;
  status: "PENDING" | "PAID" | "PROCESSING" | string;
  payment_date?: string;
}

export const PayrollScreen: React.FC = () => {
  const theme = useTheme();
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const c = theme.colors;

  const totalPaid = payrolls.filter(p => p.status === "PAID").reduce((s, p) => s + (p.net_salary || 0), 0);
  const totalPending = payrolls.filter(p => p.status !== "PAID").length;

  const fetchPayrolls = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.PAYROLL);
      const data = normalizeApiResponse<PayrollRecord[]>(res.data);
      setPayrolls(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) {
      setError(e.message || "Failed to load payroll records");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPayrolls(); }, []);

  const handleViewSlip = async (id: number | string) => {
    try {
      await axiosClient.get(ENDPOINTS.PAYROLL_SLIP(id));
      Alert.alert("Salary Slip", `Slip loaded for payroll #${id}.`);
    } catch {
      Alert.alert("Info", "Salary slip is available via the web portal.");
    }
  };

  const filtered = payrolls.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(p.employee_name || "").toLowerCase().includes(q) ||
      String(p.month || "").toLowerCase().includes(q) ||
      String(p.status || "").toLowerCase().includes(q)
    );
  });

  const getStatusVariant = (status: string): "success" | "warning" | "error" | "primary" => {
    if (status === "PAID") return "success";
    if (status === "PENDING") return "warning";
    if (status === "PROCESSING") return "primary";
    return "error";
  };

  if (loading && !refreshing) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Staff Payroll" subtitle="Salary Management" />
        <DashboardSkeleton />
      </ScreenContainer>
    );
  }

  if (error && !payrolls.length) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Staff Payroll" subtitle="Salary Management" />
        <ErrorState message={error} onRetry={() => fetchPayrolls()} />
      </ScreenContainer>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchPayrolls(true)}>
        <Header title="Staff Payroll" subtitle="Salary & Compensation Management" />

        <View style={styles.kpiRow}>
          <Card style={[styles.kpiCard, { backgroundColor: c.primaryLight }]}>
            <IndianRupee size={16} color={c.primary} />
            <Text style={[styles.kpiLabel, { color: c.primary }]}>Total Disbursed</Text>
            <Text style={[styles.kpiValue, { color: c.primary }]}>
              {`\u20B9${totalPaid.toLocaleString("en-IN")}`}
            </Text>
          </Card>
          <Card style={[styles.kpiCard, { backgroundColor: "rgba(245,158,11,0.12)" }]}>
            <Clock size={16} color={c.warning} />
            <Text style={[styles.kpiLabel, { color: c.warning }]}>Pending</Text>
            <Text style={[styles.kpiValue, { color: c.warning }]}>{totalPending}</Text>
          </Card>
          <Card style={[styles.kpiCard, { backgroundColor: c.successLight }]}>
            <CheckCircle size={16} color={c.success} />
            <Text style={[styles.kpiLabel, { color: c.success }]}>Total Records</Text>
            <Text style={[styles.kpiValue, { color: c.success }]}>{payrolls.length}</Text>
          </Card>
        </View>

        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : "#F1F5F9", borderColor: c.border }]}>
          <Search size={16} color={c.textMuted} />
          <TextInput
            placeholder="Search by name, month, status..."
            placeholderTextColor={c.textMuted}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: c.textPrimary }]}
          />
          {search ? <TouchableOpacity onPress={() => setSearch("")}><X size={14} color={c.textMuted} /></TouchableOpacity> : null}
        </View>

        {filtered.length === 0 ? (
          <EmptyState title="No Payroll Records" description="No payroll data found in the system." />
        ) : (
          filtered.map(item => (
            <TouchableOpacity key={String(item.id)} onPress={() => setSelectedPayroll(item)} activeOpacity={0.8}>
              <Card style={styles.payrollCard}>
                <View style={styles.cardRow}>
                  <View style={[styles.avatarBox, { backgroundColor: c.primaryLight }]}>
                    <User size={18} color={c.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.empName, { color: c.textPrimary }]}>
                      {item.employee_name || `Employee #${item.employee_id}`}
                    </Text>
                    <Text style={[styles.period, { color: c.textMuted }]}>
                      {item.month} {item.year}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <Text style={[styles.salary, { color: c.primary }]}>
                      {`\u20B9${(item.net_salary || 0).toLocaleString("en-IN")}`}
                    </Text>
                    <Badge label={item.status} variant={getStatusVariant(item.status)} size="sm" />
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.slipBtn, { backgroundColor: c.primaryLight }]}
                  onPress={() => handleViewSlip(item.id)}
                  activeOpacity={0.8}
                >
                  <Download size={13} color={c.primary} />
                  <Text style={[styles.slipBtnText, { color: c.primary }]}>View Salary Slip</Text>
                </TouchableOpacity>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScreenContainer>

      <Modal visible={!!selectedPayroll} animationType="slide" transparent onRequestClose={() => setSelectedPayroll(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFFFFF", borderColor: c.border }]}>
            {selectedPayroll && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: "700", color: c.textPrimary }}>
                      {selectedPayroll.employee_name || `Employee #${selectedPayroll.employee_id}`}
                    </Text>
                    <Text style={{ fontSize: 12, color: c.textMuted }}>
                      Payroll {selectedPayroll.month} {selectedPayroll.year}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedPayroll(null)}>
                    <X size={22} color={c.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.breakdownCard, { backgroundColor: c.primaryLight }]}>
                  <Text style={[styles.breakdownTitle, { color: c.primary }]}>Net Salary</Text>
                  <Text style={[styles.breakdownAmount, { color: c.primary }]}>
                    {`\u20B9${(selectedPayroll.net_salary || 0).toLocaleString("en-IN")}`}
                  </Text>
                </View>

                {[
                  { label: "Basic Salary", value: selectedPayroll.basic_salary },
                  { label: "HRA", value: selectedPayroll.hra },
                  { label: "Allowances", value: selectedPayroll.allowances },
                  { label: "Deductions", value: selectedPayroll.deductions },
                  { label: "Gross Salary", value: selectedPayroll.gross_salary },
                ].filter(r => r.value !== undefined).map(row => (
                  <View key={row.label} style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: c.textMuted }]}>{row.label}:</Text>
                    <Text style={[styles.detailVal, { color: c.textPrimary }]}>
                      {`\u20B9${(row.value || 0).toLocaleString("en-IN")}`}
                    </Text>
                  </View>
                ))}

                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: c.textMuted }]}>Status:</Text>
                  <Badge label={selectedPayroll.status} variant={getStatusVariant(selectedPayroll.status)} />
                </View>

                {selectedPayroll.payment_date && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: c.textMuted }]}>Payment Date:</Text>
                    <Text style={[styles.detailVal, { color: c.textPrimary }]}>
                      {new Date(selectedPayroll.payment_date).toLocaleDateString("en-IN")}
                    </Text>
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
  kpiRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  kpiCard: { flex: 1, padding: 12, alignItems: "center", gap: 4 },
  kpiLabel: { fontSize: 9.5, fontWeight: "700", textTransform: "uppercase", textAlign: "center" },
  kpiValue: { fontSize: 16, fontWeight: "800" },
  searchBox: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, borderRadius: 14, borderWidth: 1,
    height: 44, marginBottom: 8, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13 },
  payrollCard: { marginVertical: 5, padding: 14 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarBox: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  empName: { fontSize: 14, fontWeight: "700" },
  period: { fontSize: 11, marginTop: 2 },
  salary: { fontSize: 15, fontWeight: "800" },
  slipBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 8, borderRadius: 10, marginTop: 10, gap: 6,
  },
  slipBtnText: { fontSize: 12, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1,
    padding: 22, maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 16,
  },
  breakdownCard: { padding: 16, borderRadius: 14, alignItems: "center", marginBottom: 14 },
  breakdownTitle: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  breakdownAmount: { fontSize: 28, fontWeight: "800", marginTop: 4 },
  detailRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(148,163,184,0.15)",
  },
  detailLabel: { fontSize: 13, fontWeight: "500" },
  detailVal: { fontSize: 13, fontWeight: "700" },
});