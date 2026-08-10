import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Header } from '../../../components/common/Header';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import {
  AttendanceService,
  AttendanceRecord,
  WorkforceLiveStatus,
} from '../services/attendanceService';
import { DashboardSkeleton } from '../../../components/skeletons/SkeletonLoader';
import { EmptyState, ErrorState } from '../../../components/common/States';
import { useTheme } from '../../../theme/theme';
import {
  Clock,
  UserCheck,
  UserX,
  Users,
  Store,
  CheckCircle,
  LogIn,
  LogOut,
  Calendar,
} from 'lucide-react-native';

export const AttendanceScreen: React.FC = () => {
  const theme = useTheme();
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [liveStatus, setLiveStatus] = useState<WorkforceLiveStatus>({
    totalActive: 0,
    onDuty: 0,
    onBreak: 0,
    offDuty: 0,
    recentLogs: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [activeCheckInId, setActiveCheckInId] = useState<string | number | null>(null);
  const [clockActionLoading, setClockActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    fetchAttendance();
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAttendance = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [todayLogs, workforce] = await Promise.all([
        AttendanceService.getTodayAttendance(),
        AttendanceService.getWorkforceLive(),
      ]);
      setLogs(todayLogs);
      setLiveStatus(workforce);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleClock = async () => {
    setClockActionLoading(true);
    try {
      if (!isCheckedIn) {
        const record = await AttendanceService.checkIn();
        setIsCheckedIn(true);
        setActiveCheckInId(record.id);
        setLogs((prev) => [record, ...prev]);
        Alert.alert('Checked In', 'Attendance shift logged successfully.');
      } else if (activeCheckInId) {
        await AttendanceService.checkOut(activeCheckInId);
        setIsCheckedIn(false);
        setActiveCheckInId(null);
        Alert.alert('Checked Out', 'Shift completed and clocked out.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update attendance');
    } finally {
      setClockActionLoading(false);
    }
  };

  const c = theme.colors;

  return (
    <View style={styles.root}>
      <ScreenContainer scrollable={true} refreshing={refreshing} onRefresh={() => fetchAttendance(true)}>
        <Header title="Workforce Attendance" subtitle="Real-time Staff Shift Tracker" />

        {/* ── Live Workforce Status Cards ───────────────────────────── */}
        <View style={styles.statsRow}>
          <Card style={[styles.statCard, { backgroundColor: c.primaryLight }]}>
            <Users size={18} color={c.primary} />
            <Text style={[styles.statVal, { color: c.primary }]}>{liveStatus.onDuty ?? 0}</Text>
            <Text style={[styles.statLabel, { color: c.primary }]}>On Duty</Text>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: c.warningLight }]}>
            <Clock size={18} color={c.warning} />
            <Text style={[styles.statVal, { color: c.warning }]}>{liveStatus.onBreak ?? 0}</Text>
            <Text style={[styles.statLabel, { color: c.warning }]}>On Break</Text>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: c.successLight }]}>
            <UserCheck size={18} color={c.success} />
            <Text style={[styles.statVal, { color: c.success }]}>{liveStatus.totalActive ?? 0}</Text>
            <Text style={[styles.statLabel, { color: c.success }]}>Total Active</Text>
          </Card>
        </View>

        {/* ── Personal Shift Terminal ───────────────────────────────── */}
        <Card style={styles.clockCard}>
          <View style={styles.clockHeader}>
            <View>
              <Text style={[styles.clockTitle, { color: c.textPrimary }]}>Self Shift Punch</Text>
              <Text style={[styles.clockDate, { color: c.textMuted }]}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
              </Text>
            </View>
            <Text style={[styles.clockLiveTime, { color: c.primary }]}>{currentTime}</Text>
          </View>

          <TouchableOpacity
            onPress={handleToggleClock}
            disabled={clockActionLoading}
            style={[
              styles.punchBtn,
              {
                backgroundColor: isCheckedIn ? c.error : c.primary,
              },
            ]}
            activeOpacity={0.8}
          >
            {isCheckedIn ? <LogOut size={18} color="#FFFFFF" /> : <LogIn size={18} color="#FFFFFF" />}
            <Text style={styles.punchBtnText}>
              {isCheckedIn ? 'Clock Out (End Shift)' : 'Clock In (Start Shift)'}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* ── Today's Attendance Register ───────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>
          Today's Check-In Register
        </Text>

        {loading && !refreshing ? (
          <DashboardSkeleton />
        ) : logs.length === 0 ? (
          <EmptyState title="No Shifts Clocked" description="No employee attendance records logged yet today." />
        ) : (
          logs.map((log) => (
            <Card key={log.id} style={styles.logCard}>
              <View style={styles.logRow}>
                <View style={[styles.avatarBox, { backgroundColor: c.primaryLight }]}>
                  <UserCheck size={18} color={c.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.logName, { color: c.textPrimary }]}>
                    {log.user_name || log.user_email || `Staff #${log.user_id}`}
                  </Text>
                  <Text style={[styles.logTime, { color: c.textMuted }]}>
                    In: {new Date(log.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {log.check_out ? ` · Out: ${new Date(log.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ' · Active'}
                  </Text>
                </View>
                <Badge
                  label={log.status || 'PRESENT'}
                  variant={log.status === 'LATE' ? 'warning' : 'success'}
                  size="sm"
                />
              </View>
            </Card>
          ))
        )}
      </ScreenContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 6,
  },
  statCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  clockCard: {
    padding: 16,
    marginVertical: 6,
  },
  clockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  clockTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  clockDate: {
    fontSize: 11,
    marginTop: 1,
  },
  clockLiveTime: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  punchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  punchBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 14,
    marginBottom: 6,
  },
  logCard: {
    marginVertical: 4,
    padding: 12,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logName: {
    fontSize: 13,
    fontWeight: '700',
  },
  logTime: {
    fontSize: 11,
    marginTop: 2,
  },
});
