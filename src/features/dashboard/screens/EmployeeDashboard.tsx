import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Header } from '../../../components/common/Header';
import { MetricCard } from '../../../components/cards/MetricCard';
import { OrderCard } from '../../../components/cards/OrderCard';
import { DashboardSkeleton } from '../../../components/skeletons/SkeletonLoader';
import { ErrorState, EmptyState } from '../../../components/common/States';
import { useDashboardData } from '../hooks/useDashboardData';
import { useTheme } from '../../../theme/theme';
import { useAuthStore } from '../../../store/authStore';
import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import { normalizeApiResponse } from '../../../api/responseNormalizer';
import { PermissionService } from '../../../security/permissionService';
import {
  ClipboardList,
  ShoppingBag,
  Box,
  Award,
  Clock,
  CheckCircle,
  Coffee,
  LogOut,
  MapPin,
  Sparkles,
} from 'lucide-react-native';
import { ExecutiveProfileCard } from '../../../components/cards/ExecutiveProfileCard';

export const EmployeeDashboard: React.FC = () => {
  const theme = useTheme();
  const c = theme.colors;
  const user = useAuthStore((state) => state.user);
  const { metrics, loading, refreshing, error, refresh } = useDashboardData();

  // Attendance & Punch Clock State
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceRecord, setAttendanceRecord] = useState<any>(null);
  const [isOnBreak, setIsOnBreak] = useState(false);

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const response = await axiosClient.get(ENDPOINTS.ATTENDANCE_TODAY);
      const normalized = normalizeApiResponse<any>(response.data);
      const record = normalized.data || response.data?.attendance || response.data;
      if (record && record.id) {
        setAttendanceRecord(record);
        setIsOnBreak(record.status === 'ON_BREAK');
      }
    } catch {
      // ignore
    }
  };

  const handleClockIn = async () => {
    setAttendanceLoading(true);
    try {
      // Verify location permission
      await PermissionService.requestLocation();

      const response = await axiosClient.post(ENDPOINTS.ATTENDANCE_CHECKIN, {
        notes: 'Mobile Staff App Punch Clock',
        check_in_time: new Date().toISOString(),
      });
      const normalized = normalizeApiResponse<any>(response.data);
      const record = normalized.data || response.data?.attendance || response.data;
      setAttendanceRecord(record || { id: Date.now(), status: 'CHECKED_IN' });
      Alert.alert('Checked In Successfully', 'Your duty shift punch clock has started.');
    } catch (err: any) {
      Alert.alert('Clock In Error', err.response?.data?.message || err.message || 'Failed to clock in');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!attendanceRecord?.id) return;
    setAttendanceLoading(true);
    try {
      await axiosClient.post(ENDPOINTS.ATTENDANCE_CHECKOUT(attendanceRecord.id), {
        notes: 'Mobile Staff App Clock Out',
        check_out_time: new Date().toISOString(),
      });
      setAttendanceRecord((prev: any) => ({ ...prev, status: 'CHECKED_OUT' }));
      Alert.alert('Shift Ended', 'You have successfully clocked out for today.');
    } catch (err: any) {
      Alert.alert('Clock Out Error', err.response?.data?.message || err.message || 'Failed to clock out');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleToggleBreak = async () => {
    setAttendanceLoading(true);
    try {
      if (!isOnBreak) {
        await axiosClient.post(ENDPOINTS.ATTENDANCE_BREAK_IN, {
          attendance_id: attendanceRecord?.id,
          reason: 'Tea/Lunch Break',
        });
        setIsOnBreak(true);
        Alert.alert('Break Started', 'Enjoy your break. Remember to resume when back on duty.');
      } else {
        await axiosClient.post(ENDPOINTS.ATTENDANCE_BREAK_OUT(attendanceRecord?.id || 1), {
          attendance_id: attendanceRecord?.id,
        });
        setIsOnBreak(false);
        Alert.alert('Break Ended', 'Duty resumed. Attendance timer is active.');
      }
    } catch (err: any) {
      Alert.alert('Break Action Error', err.response?.data?.message || err.message || 'Failed to record break');
    } finally {
      setAttendanceLoading(false);
    }
  };

  if (loading && !metrics) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Employee Portal" subtitle="Daily Task Workspace" />
        <DashboardSkeleton />
      </ScreenContainer>
    );
  }

  if (error && !metrics) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Employee Portal" />
        <ErrorState message={error} onRetry={refresh} />
      </ScreenContainer>
    );
  }

  const isCheckedIn = attendanceRecord && attendanceRecord.status !== 'CHECKED_OUT';

  return (
    <ScreenContainer scrollable={true} refreshing={refreshing} onRefresh={refresh}>
      <Header
        title="Employee Workspace"
        subtitle={`Staff: ${user?.name || user?.email?.split('@')[0] || 'Employee'}`}
      />

      <ExecutiveProfileCard />

      {/* ── Real-Time Workforce Punch Clock Card ──────────────────────── */}
      <View
        style={[
          styles.punchCard,
          {
            backgroundColor: theme.isDark ? '#0F172A' : '#FFFFFF',
            borderColor: isCheckedIn ? '#10B981' : theme.isDark ? '#1E293B' : '#E2E8F0',
          },
        ]}
      >
        <View style={styles.punchHeaderRow}>
          <View style={styles.punchTitleCol}>
            <View style={styles.shiftBadge}>
              <Clock size={12} color={c.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.shiftBadgeText, { color: c.primary }]}>
                SHIFT: 09:00 AM - 06:00 PM
              </Text>
            </View>
            <Text style={[styles.punchStatusTitle, { color: c.textPrimary }]}>
              {isCheckedIn
                ? isOnBreak
                  ? '☕ Currently on Break'
                  : '🟢 Active on Duty'
                : '⚪ Off Duty · Punch Required'}
            </Text>
          </View>

          {attendanceLoading && <ActivityIndicator size="small" color={c.primary} />}
        </View>

        <View style={styles.punchActionsRow}>
          {!isCheckedIn ? (
            <TouchableOpacity
              onPress={handleClockIn}
              disabled={attendanceLoading}
              style={[styles.clockInBtn, { backgroundColor: '#10B981' }]}
              activeOpacity={0.85}
            >
              <CheckCircle size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.clockInText}>Clock In for Duty</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.activeControlsRow}>
              <TouchableOpacity
                onPress={handleToggleBreak}
                disabled={attendanceLoading}
                style={[
                  styles.breakBtn,
                  {
                    backgroundColor: isOnBreak ? '#F59E0B' : theme.isDark ? '#1E293B' : '#F1F5F9',
                    borderColor: '#F59E0B',
                  },
                ]}
                activeOpacity={0.8}
              >
                <Coffee size={15} color={isOnBreak ? '#FFFFFF' : '#F59E0B'} style={{ marginRight: 6 }} />
                <Text
                  style={[
                    styles.breakBtnText,
                    { color: isOnBreak ? '#FFFFFF' : theme.isDark ? '#F8FAFC' : '#0F172A' },
                  ]}
                >
                  {isOnBreak ? 'Resume Work' : 'Take Break'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleClockOut}
                disabled={attendanceLoading}
                style={[styles.clockOutBtn, { backgroundColor: '#EF4444' }]}
                activeOpacity={0.85}
              >
                <LogOut size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.clockOutText}>Clock Out</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* ── Operational Metrics Grid ─────────────────────────────────── */}
      <View style={styles.metricsGrid}>
        <MetricCard
          title="Assigned Orders"
          value={metrics?.totalOrders || 0}
          icon={<ShoppingBag size={18} color={theme.colors.primary} />}
        />
        <MetricCard
          title="Product Lookups"
          value={metrics?.totalProducts || 0}
          icon={<Box size={18} color={theme.colors.success} />}
        />
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard
          title="Pending Queue"
          value={metrics?.pendingOrders ?? 0}
          icon={<ClipboardList size={18} color={theme.colors.accent} />}
        />
        <MetricCard
          title="Total Outlets"
          value={metrics?.totalBranches ?? 0}
          icon={<Award size={18} color={theme.colors.warning} />}
        />
      </View>

      {/* ── Assigned Queue Section ───────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginBottom: 8 }]}>
          Current Assigned Queue
        </Text>
        {metrics?.recentOrders && metrics.recentOrders.length > 0 ? (
          metrics.recentOrders.map((ord) => <OrderCard key={ord.id} order={ord} />)
        ) : (
          <EmptyState title="No Assigned Orders" description="You have no pending order assignments." />
        )}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  punchCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  punchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  punchTitleCol: {
    flex: 1,
  },
  shiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  shiftBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  punchStatusTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  punchActionsRow: {
    width: '100%',
  },
  clockInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  clockInText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  activeControlsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  breakBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  breakBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  clockOutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  clockOutText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  metricsGrid: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginVertical: 4,
  },
  section: {
    marginVertical: 12,
  },
});
