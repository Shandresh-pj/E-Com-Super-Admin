import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Header } from '../../../components/common/Header';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { TextField } from '../../../components/inputs/TextField';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { DashboardSkeleton } from '../../../components/skeletons/SkeletonLoader';
import { EmptyState, ErrorState } from '../../../components/common/States';
import {
  NotificationService,
  NotificationItem,
  NotificationTone,
  NOTIFICATION_TONES,
  NotificationCategory,
} from '../services/notificationService';
import { UserRole } from '../../../security/roleResolver';
import { useAuthStore } from '../../../store/authStore';
import { useTheme } from '../../../theme/theme';
import {
  Bell,
  CheckCheck,
  ShoppingBag,
  AlertTriangle,
  Users,
  CreditCard,
  Shield,
  Volume2,
  Check,
  X,
  Sparkles,
  Send,
  Radio,
} from 'lucide-react-native';

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'ORDER', label: 'Orders' },
  { id: 'STOCK', label: 'Stock' },
  { id: 'WORKFORCE', label: 'Staff' },
  { id: 'PAYMENT', label: 'Payments' },
];

export const NotificationsScreen: React.FC = () => {
  const theme = useTheme();
  const role = useAuthStore((state) => state.role);
  const isSuperAdmin = role === UserRole.SUPER_ADMIN;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tone Settings
  const [selectedTone, setSelectedTone] = useState<NotificationTone>('chime');
  const [toneModalVisible, setToneModalVisible] = useState(false);

  // Broadcast Modal (Super Admin only)
  const [broadcastModalVisible, setBroadcastModalVisible] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastCategory, setBroadcastCategory] = useState<NotificationCategory>('SYSTEM');
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    loadData();
    NotificationService.getSelectedTone().then(setSelectedTone);
  }, []);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await NotificationService.getNotifications();
      setNotifications(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleMarkAsRead = async (id: string | number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    await NotificationService.markAsRead(id);
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await NotificationService.markAllAsRead();
  };

  const handleSelectTone = async (tone: NotificationTone) => {
    setSelectedTone(tone);
    await NotificationService.setSelectedTone(tone);
    if (isSuperAdmin) {
      Alert.alert('Global Tone Configured', `All system users will now receive alerts with "${NOTIFICATION_TONES.find((t) => t.id === tone)?.name}".`);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      Alert.alert('Required', 'Please enter a title and message.');
      return;
    }

    setBroadcasting(true);
    try {
      // Send the broadcast via the real backend API endpoint
      const newNotif = await NotificationService.sendBroadcast({
        title: broadcastTitle,
        message: broadcastMessage,
        category: broadcastCategory,
        priority: 'HIGH',
      });

      setNotifications((prev) => [newNotif, ...prev]);
      Alert.alert('Broadcast Sent', 'Notification has been dispatched to all staff and outlets.');
      setBroadcastModalVisible(false);
      setBroadcastTitle('');
      setBroadcastMessage('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send broadcast');
    } finally {
      setBroadcasting(false);
    }
  };


  const getCategoryIcon = (cat: NotificationCategory) => {
    const size = 18;
    switch (cat) {
      case 'ORDER':
        return <ShoppingBag size={size} color={theme.colors.primary} />;
      case 'STOCK':
        return <AlertTriangle size={size} color={theme.colors.warning} />;
      case 'WORKFORCE':
        return <Users size={size} color={theme.colors.accent} />;
      case 'PAYMENT':
        return <CreditCard size={size} color={theme.colors.success} />;
      default:
        return <Shield size={size} color={theme.colors.textMuted} />;
    }
  };

  const filtered = notifications.filter((item) => {
    if (activeCategory === 'ALL') return true;
    return item.category === activeCategory;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const c = theme.colors;
  const currentToneObj = NOTIFICATION_TONES.find((t) => t.id === selectedTone) || NOTIFICATION_TONES[0];

  return (
    <View style={styles.root}>
      <ScreenContainer scrollable={true} refreshing={refreshing} onRefresh={() => loadData(true)}>
        <Header
          title="Notification Center"
          subtitle={unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
          rightAction={
            isSuperAdmin ? (
              <TouchableOpacity
                onPress={() => setBroadcastModalVisible(true)}
                style={[styles.broadcastBtn, { backgroundColor: c.primary }]}
                activeOpacity={0.8}
              >
                <Radio size={14} color="#FFFFFF" />
                <Text style={styles.broadcastBtnText}>Broadcast</Text>
              </TouchableOpacity>
            ) : unreadCount > 0 ? (
              <TouchableOpacity
                onPress={handleMarkAllRead}
                style={[styles.markAllBtn, { backgroundColor: c.primaryLight }]}
                activeOpacity={0.7}
              >
                <CheckCheck size={14} color={c.primary} />
                <Text style={[styles.markAllText, { color: c.primary }]}>Read All</Text>
              </TouchableOpacity>
            ) : undefined
          }
        />

        {/* ── Global Alert Tone Card (Super Admin Sets for All) ──────── */}
        <Card style={styles.toneCard}>
          <View style={styles.toneCardLeft}>
            <View style={[styles.toneIconBox, { backgroundColor: c.primaryLight }]}>
              <Volume2 size={20} color={c.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.toneTitleRow}>
                <Text style={[styles.toneTitle, { color: c.textPrimary }]}>
                  {isSuperAdmin ? 'Global Alert Tone' : 'Alert Tone'}
                </Text>
                <Badge label={isSuperAdmin ? 'System Default' : currentToneObj.tag} variant="primary" />
              </View>
              <Text style={[styles.toneCurrent, { color: c.textMuted }]}>
                {currentToneObj.name} · {currentToneObj.description}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setToneModalVisible(true)}
            style={[styles.changeToneBtn, { backgroundColor: c.primary }]}
            activeOpacity={0.8}
          >
            <Sparkles size={12} color="#FFFFFF" />
            <Text style={styles.changeToneBtnText}>
              {isSuperAdmin ? 'Set Global' : 'Tone'}
            </Text>
          </TouchableOpacity>
        </Card>

        {/* ── Category Filter Chips ─────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setActiveCategory(cat.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? c.primary : c.surfaceSecondary,
                    borderColor: isSelected ? c.primary : c.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSelected ? '#FFFFFF' : c.textSecondary },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Notification List ─────────────────────────────────────── */}
        {loading && !refreshing ? (
          <DashboardSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={() => loadData()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No Notifications"
            description={
              activeCategory === 'ALL'
                ? 'You have no active alerts at the moment.'
                : `No notifications under "${CATEGORIES.find((c) => c.id === activeCategory)?.label}".`
            }
          />
        ) : (
          filtered.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => handleMarkAsRead(item.id)}
            >
              <Card
                style={[
                  styles.notifCard,
                  !item.is_read && [
                    styles.unreadCard,
                    { borderLeftColor: c.primary, backgroundColor: theme.isDark ? c.surface : '#FAFAFE' },
                  ],
                ]}
              >
                <View style={styles.notifRow}>
                  <View style={[styles.catIconBox, { backgroundColor: c.surfaceSecondary }]}>
                    {getCategoryIcon(item.category)}
                  </View>

                  <View style={styles.notifContent}>
                    <View style={styles.notifHeaderRow}>
                      <Text
                        style={[
                          styles.notifTitle,
                          {
                            color: c.textPrimary,
                            fontWeight: item.is_read ? '600' : '800',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      {!item.is_read && (
                        <View style={[styles.unreadDot, { backgroundColor: c.primary }]} />
                      )}
                    </View>

                    <Text style={[styles.notifMessage, { color: c.textSecondary }]}>
                      {item.message}
                    </Text>

                    <View style={styles.notifFooter}>
                      <Badge label={item.category} variant="neutral" />
                      <Text style={[styles.notifTime, { color: c.textMuted }]}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScreenContainer>

      {/* ── Broadcast Modal (Super Admin only) ──────────────────────── */}
      <Modal
        visible={broadcastModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBroadcastModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : '#FFFFFF', borderColor: c.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[theme.typography.h3, { color: c.textPrimary }]}>Broadcast Notification</Text>
                <Text style={[theme.typography.caption, { color: c.textMuted }]}>
                  Send instant alert to all workforce & branch outlets
                </Text>
              </View>
              <TouchableOpacity onPress={() => setBroadcastModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={c.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
              <TextField label="Alert Title *" placeholder="e.g. System Maintenance Window" value={broadcastTitle} onChangeText={setBroadcastTitle} />
              <TextField label="Detailed Notice *" placeholder="Enter notice content for all staff..." value={broadcastMessage} onChangeText={setBroadcastMessage} multiline />

              <Text style={[styles.catPickerLabel, { color: c.textSecondary }]}>Alert Category:</Text>
              <View style={styles.catGrid}>
                {(['SYSTEM', 'ORDER', 'STOCK', 'WORKFORCE', 'PAYMENT'] as NotificationCategory[]).map((cat) => {
                  const isSelected = broadcastCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setBroadcastCategory(cat)}
                      style={[
                        styles.catChip,
                        {
                          backgroundColor: isSelected ? c.primary : c.surfaceSecondary,
                          borderColor: isSelected ? c.primary : c.border,
                        },
                      ]}
                    >
                      <Text style={[styles.catChipText, { color: isSelected ? '#FFFFFF' : c.textSecondary }]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={{ marginTop: 14 }}>
              <PrimaryButton
                title="Send Live Broadcast"
                onPress={handleSendBroadcast}
                loading={broadcasting}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Premium Tone Selection Modal ────────────────────────────── */}
      <Modal
        visible={toneModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setToneModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : '#FFFFFF', borderColor: c.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[theme.typography.h3, { color: c.textPrimary }]}>
                  {isSuperAdmin ? 'Set Global Alert Tone' : 'Alert Tone & Sound'}
                </Text>
                <Text style={[theme.typography.caption, { color: c.textMuted }]}>
                  {isSuperAdmin ? 'Configure high-fidelity tone applied across all accounts' : 'Select personal haptic feedback melody'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setToneModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={c.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.toneList}>
              {NOTIFICATION_TONES.map((t) => {
                const isSelected = selectedTone === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => handleSelectTone(t.id)}
                    style={[
                      styles.toneOption,
                      {
                        backgroundColor: isSelected ? c.primaryLight : c.surfaceSecondary,
                        borderColor: isSelected ? c.primary : c.border,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.toneOptionTextWrap}>
                      <View style={styles.toneOptionTitleRow}>
                        <Text style={[styles.toneOptionName, { color: c.textPrimary }]}>{t.name}</Text>
                        <Badge label={t.tag} variant={isSelected ? 'primary' : 'neutral'} />
                      </View>
                      <Text style={[styles.toneOptionDesc, { color: c.textMuted }]}>{t.description}</Text>
                    </View>

                    {isSelected ? (
                      <View style={[styles.selectedCheck, { backgroundColor: c.primary }]}>
                        <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => NotificationService.previewTone(t.id)}
                        style={styles.previewBtn}
                      >
                        <Volume2 size={16} color={c.textMuted} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  broadcastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  broadcastBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  markAllText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Tone Card
  toneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    marginVertical: 6,
  },
  toneCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  toneIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toneTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toneTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  toneCurrent: {
    fontSize: 11,
    marginTop: 2,
  },
  changeToneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  changeToneBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // Filter Scroll
  filterScroll: {
    marginVertical: 8,
  },
  filterContent: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Cards
  notifCard: {
    padding: 14,
    marginVertical: 4,
  },
  unreadCard: {
    borderLeftWidth: 3.5,
  },
  notifRow: {
    flexDirection: 'row',
    gap: 12,
  },
  catIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
  },
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  notifTitle: {
    fontSize: 14,
    flex: 1,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginLeft: 6,
  },
  notifMessage: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  notifFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifTime: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    padding: 22,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  closeBtn: {
    padding: 4,
  },
  toneList: {
    gap: 8,
  },
  toneOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  toneOptionTextWrap: {
    flex: 1,
  },
  toneOptionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  toneOptionName: {
    fontSize: 13,
    fontWeight: '800',
  },
  toneOptionDesc: {
    fontSize: 11,
  },
  selectedCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  previewBtn: {
    padding: 6,
  },
  catPickerLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
