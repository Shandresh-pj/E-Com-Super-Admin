import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, TextInput, Switch,
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
import {
  Users, Activity, Clock, CheckCircle, AlertCircle, TrendingUp, Bell,
  MapPin, BarChart2, X, Search, FileText,
} from "lucide-react-native";

interface LiveEmployee {
  id: number | string;
  name: string;
  status: "CHECKED_IN" | "CHECKED_OUT" | "ON_BREAK" | "ABSENT" | string;
  branch_name?: string;
  check_in_time?: string;
  latitude?: number;
  longitude?: number;
  current_task?: string;
}

interface WorkforceNotification {
  id: number | string;
  message: string;
  type?: string;
  is_read: boolean;
  created_at?: string;
}

interface DailyReport {
  date?: string;
  total_employees?: number;
  present?: number;
  absent?: number;
  on_leave?: number;
  avg_check_in?: string;
  avg_check_out?: string;
}

type WorkforceTab = "live" | "reports" | "notifications";

export const WorkforceConsoleScreen: React.FC = () => {
  const theme = useTheme();
  const c = theme.colors;
  const [activeTab, setActiveTab] = useState<WorkforceTab>("live");
  const [liveData, setLiveData] = useState<LiveEmployee[]>([]);
  const [notifications, setNotifications] = useState<WorkforceNotification[]>([]);
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<LiveEmployee | null>(null);

  const presentCount = liveData.filter(e => e.status === "CHECKED_IN").length;
  const absentCount = liveData.filter(e => e.status === "ABSENT").length;
  const onBreakCount = liveData.filter(e => e.status === "ON_BREAK").length;
  const unreadNotifs = notifications.filter(n => !n.is_read).length;

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const [liveRes, notifsRes, reportRes] = await Promise.allSettled([
        axiosClient.get(ENDPOINTS.WORKFORCE_LIVE),
        axiosClient.get(ENDPOINTS.WORKFORCE_NOTIFICATIONS),
        axiosClient.get(ENDPOINTS.WORKFORCE_REPORT_DAILY),
      ]);
      if (liveRes.status === "fulfilled") {
        const d = normalizeApiResponse<LiveEmployee[]>(liveRes.value.data);
        setLiveData(Array.isArray(d.data) ? d.data : []);
      }
      if (notifsRes.status === "fulfilled") {
        const d = normalizeApiResponse<WorkforceNotification[]>(notifsRes.value.data);
        setNotifications(Array.isArray(d.data) ? d.data : []);
      }
      if (reportRes.status === "fulfilled") {
        const d = normalizeApiResponse<DailyReport>(reportRes.value.data);
        setDailyReport(d.data || null);
      }
    } catch (e: any) { setError(e.message || "Failed to load workforce data"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const markNotificationRead = async (id: number | string) => {
    try {
      await axiosClient.patch(ENDPOINTS.WORKFORCE_NOTIF_READ(id));
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* silent */ }
  };

  const getStatusColor = (status: string) => {
    if (status === "CHECKED_IN") return c.success;
    if (status === "ON_BREAK") return c.warning;
    if (status === "ABSENT") return c.error;
    return c.textMuted;
  };

  const getStatusVariant = (s: string): "success" | "warning" | "error" | "primary" => {
    if (s === "CHECKED_IN") return "success";
    if (s === "ON_BREAK") return "warning";
    if (s === "ABSENT") return "error";
    return "primary";
  };

  const TABS: { key: WorkforceTab; label: string; badge?: number }[] = [
    { key: "live", label: "Live" },
    { key: "reports", label: "Daily Report" },
    { key: "notifications", label: "Alerts", badge: unreadNotifs },
  ];

  const filtered = liveData.filter(e =>
    !search.trim() || String(e.name || "").toLowerCase().includes(search.toLowerCase()) ||
    String(e.branch_name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading && !refreshing) return (
    <ScreenContainer scrollable={false}><Header title="Workforce Console" subtitle="Live Workforce" /><DashboardSkeleton /></ScreenContainer>
  );
  if (error && !liveData.length) return (
    <ScreenContainer scrollable={false}><Header title="Workforce Console" subtitle="Live Workforce" /><ErrorState message={error} onRetry={fetchData} /></ScreenContainer>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchData(true)}>
        <Header title="Workforce Console" subtitle="Live Monitoring & Reports" />

        {/* KPI Row */}
        <View style={styles.kpiRow}>
          <Card style={[styles.kpiCard, { backgroundColor: c.successLight }]}>
            <CheckCircle size={14} color={c.success} />
            <Text style={[styles.kpiLabel, { color: c.success }]}>Present</Text>
            <Text style={[styles.kpiValue, { color: c.success }]}>{presentCount}</Text>
          </Card>
          <Card style={[styles.kpiCard, { backgroundColor: "rgba(245,158,11,0.12)" }]}>
            <Clock size={14} color={c.warning} />
            <Text style={[styles.kpiLabel, { color: c.warning }]}>On Break</Text>
            <Text style={[styles.kpiValue, { color: c.warning }]}>{onBreakCount}</Text>
          </Card>
          <Card style={[styles.kpiCard, { backgroundColor: "rgba(239,68,68,0.1)" }]}>
            <AlertCircle size={14} color={c.error} />
            <Text style={[styles.kpiLabel, { color: c.error }]}>Absent</Text>
            <Text style={[styles.kpiValue, { color: c.error }]}>{absentCount}</Text>
          </Card>
          <Card style={[styles.kpiCard, { backgroundColor: c.primaryLight }]}>
            <Users size={14} color={c.primary} />
            <Text style={[styles.kpiLabel, { color: c.primary }]}>Total</Text>
            <Text style={[styles.kpiValue, { color: c.primary }]}>{liveData.length}</Text>
          </Card>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {TABS.map(t => (
            <TouchableOpacity key={t.key} style={[styles.tab, activeTab === t.key && { borderBottomColor: c.primary, borderBottomWidth: 2 }]} onPress={() => setActiveTab(t.key)}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={[styles.tabText, { color: activeTab === t.key ? c.primary : c.textMuted }]}>{t.label}</Text>
                {t.badge ? <View style={[styles.tabBadge, { backgroundColor: c.error }]}><Text style={styles.tabBadgeText}>{t.badge}</Text></View> : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Live Tab */}
        {activeTab === "live" && (
          <>
            <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : "#F1F5F9", borderColor: c.border }]}>
              <Search size={16} color={c.textMuted} />
              <TextInput placeholder="Search employees..." placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} style={[styles.searchInput, { color: c.textPrimary }]} />
              {search ? <TouchableOpacity onPress={() => setSearch("")}><X size={14} color={c.textMuted} /></TouchableOpacity> : null}
            </View>
            {filtered.length === 0 ? <EmptyState title="No Live Data" description="No employee activity at this time." /> : filtered.map(emp => (
              <TouchableOpacity key={String(emp.id)} onPress={() => setSelectedEmployee(emp)} activeOpacity={0.8}>
                <Card style={styles.empCard}>
                  <View style={styles.empRow}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(emp.status) }]} />
                    <View style={[styles.empAvatar, { backgroundColor: c.primaryLight }]}>
                      <Users size={16} color={c.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.empName, { color: c.textPrimary }]}>{emp.name}</Text>
                      {emp.branch_name && <Text style={[styles.empBranch, { color: c.textMuted }]}>{emp.branch_name}</Text>}
                      {emp.check_in_time && <Text style={[styles.empTime, { color: c.textMuted }]}>In: {emp.check_in_time}</Text>}
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 4 }}>
                      <Badge label={emp.status.replace("_", " ")} variant={getStatusVariant(emp.status)} size="sm" />
                      {emp.latitude && <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}><MapPin size={10} color={c.success} /><Text style={{ fontSize: 9, color: c.success }}>GPS</Text></View>}
                    </View>
                  </View>
                  {emp.current_task && (
                    <View style={[styles.taskChip, { backgroundColor: c.primaryLight }]}>
                      <Activity size={11} color={c.primary} />
                      <Text style={[styles.taskText, { color: c.primary }]}>{emp.current_task}</Text>
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          dailyReport ? (
            <Card style={styles.reportCard}>
              <Text style={[styles.reportTitle, { color: c.textPrimary }]}>Today's Summary</Text>
              {dailyReport.date && <Text style={[styles.reportDate, { color: c.textMuted }]}>{new Date(dailyReport.date).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</Text>}
              <View style={styles.reportGrid}>
                {[
                  { label: "Total Employees", value: String(dailyReport.total_employees || 0), color: c.primary, bg: c.primaryLight },
                  { label: "Present", value: String(dailyReport.present || 0), color: c.success, bg: c.successLight },
                  { label: "Absent", value: String(dailyReport.absent || 0), color: c.error, bg: "rgba(239,68,68,0.1)" },
                  { label: "On Leave", value: String(dailyReport.on_leave || 0), color: c.warning, bg: "rgba(245,158,11,0.12)" },
                ].map(item => (
                  <View key={item.label} style={[styles.reportItem, { backgroundColor: item.bg }]}>
                    <Text style={[styles.reportItemVal, { color: item.color }]}>{item.value}</Text>
                    <Text style={[styles.reportItemLabel, { color: item.color }]}>{item.label}</Text>
                  </View>
                ))}
              </View>
              {(dailyReport.avg_check_in || dailyReport.avg_check_out) && (
                <View style={styles.timingRow}>
                  {dailyReport.avg_check_in && <View style={styles.timingItem}><Clock size={13} color={c.success} /><Text style={[styles.timingLabel, { color: c.textMuted }]}>Avg In: <Text style={{ color: c.success, fontWeight: "700" }}>{dailyReport.avg_check_in}</Text></Text></View>}
                  {dailyReport.avg_check_out && <View style={styles.timingItem}><Clock size={13} color={c.error} /><Text style={[styles.timingLabel, { color: c.textMuted }]}>Avg Out: <Text style={{ color: c.error, fontWeight: "700" }}>{dailyReport.avg_check_out}</Text></Text></View>}
                </View>
              )}
            </Card>
          ) : <EmptyState title="No Report" description="Daily report not available yet." />
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          notifications.length === 0 ? <EmptyState title="No Alerts" description="No workforce notifications." /> : notifications.map(notif => (
            <TouchableOpacity key={String(notif.id)} onPress={() => markNotificationRead(notif.id)} activeOpacity={0.8}>
              <Card style={[styles.notifCard, !notif.is_read && { borderLeftWidth: 3, borderLeftColor: c.primary }]}>
                <View style={styles.notifRow}>
                  <View style={[styles.notifIcon, { backgroundColor: notif.is_read ? c.surfaceSecondary : c.primaryLight }]}>
                    <Bell size={16} color={notif.is_read ? c.textMuted : c.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.notifMsg, { color: c.textPrimary, fontWeight: notif.is_read ? "500" : "700" }]} numberOfLines={2}>{notif.message}</Text>
                    {notif.created_at && <Text style={[styles.notifTime, { color: c.textMuted }]}>{new Date(notif.created_at).toLocaleString("en-IN")}</Text>}
                  </View>
                  {!notif.is_read && <View style={[styles.unreadDot, { backgroundColor: c.primary }]} />}
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScreenContainer>

      <Modal visible={!!selectedEmployee} animationType="slide" transparent onRequestClose={() => setSelectedEmployee(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
            {selectedEmployee && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>{selectedEmployee.name}</Text>
                  <TouchableOpacity onPress={() => setSelectedEmployee(null)}><X size={22} color={c.textMuted} /></TouchableOpacity>
                </View>
                <Badge label={selectedEmployee.status.replace("_", " ")} variant={getStatusVariant(selectedEmployee.status)} />
                <View style={{ marginTop: 12 }}>
                  {[
                    { label: "Branch", value: selectedEmployee.branch_name || "N/A" },
                    { label: "Check-In", value: selectedEmployee.check_in_time || "N/A" },
                    { label: "Current Task", value: selectedEmployee.current_task || "N/A" },
                    { label: "GPS", value: selectedEmployee.latitude ? `${selectedEmployee.latitude.toFixed(4)}, ${selectedEmployee.longitude?.toFixed(4)}` : "N/A" },
                  ].map(row => (
                    <View key={row.label} style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: c.textMuted }]}>{row.label}:</Text>
                      <Text style={[styles.detailVal, { color: c.textPrimary }]}>{row.value}</Text>
                    </View>
                  ))}
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
  kpiRow: { flexDirection: "row", gap: 6, marginBottom: 10 },
  kpiCard: { flex: 1, padding: 10, alignItems: "center", gap: 3 },
  kpiLabel: { fontSize: 9, fontWeight: "700", textTransform: "uppercase", textAlign: "center" },
  kpiValue: { fontSize: 18, fontWeight: "800" },
  tabBar: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "rgba(148,163,184,0.2)", marginBottom: 10 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 10 },
  tabText: { fontSize: 12.5, fontWeight: "700" },
  tabBadge: { width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  tabBadgeText: { color: "#FFF", fontSize: 9, fontWeight: "800" },
  searchBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, height: 44, marginBottom: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 13 },
  empCard: { marginVertical: 4, padding: 12 },
  empRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  empAvatar: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  empName: { fontSize: 13, fontWeight: "700" },
  empBranch: { fontSize: 11, marginTop: 1 },
  empTime: { fontSize: 10, marginTop: 1 },
  taskChip: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: "flex-start" },
  taskText: { fontSize: 11, fontWeight: "600" },
  reportCard: { padding: 16 },
  reportTitle: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
  reportDate: { fontSize: 12, marginBottom: 14 },
  reportGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  reportItem: { width: "47%", padding: 14, borderRadius: 14, alignItems: "center" },
  reportItemVal: { fontSize: 24, fontWeight: "800" },
  reportItemLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", marginTop: 4, textAlign: "center" },
  timingRow: { flexDirection: "row", gap: 12 },
  timingItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 5 },
  timingLabel: { fontSize: 12 },
  notifCard: { marginVertical: 4, padding: 12 },
  notifRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  notifIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  notifMsg: { fontSize: 13, lineHeight: 18 },
  notifTime: { fontSize: 10, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, padding: 22, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(148,163,184,0.15)" },
  detailLabel: { fontSize: 13, fontWeight: "500" },
  detailVal: { fontSize: 13, fontWeight: "700" },
});