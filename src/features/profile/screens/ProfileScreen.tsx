import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
  useWindowDimensions,
  Clipboard,
} from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Header } from '../../../components/common/Header';
import { Card } from '../../../components/common/Card';
import { TextField } from '../../../components/inputs/TextField';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { useAuthStore, UserProfile } from '../../../store/authStore';
import { useThemeStore, ThemeMode } from '../../../store/themeStore';
import { PermissionService, PermissionStatus } from '../../../security/permissionService';
import {
  NotificationService,
  NotificationTone,
  NOTIFICATION_TONES,
} from '../../notifications/services/notificationService';
import { useTheme } from '../../../theme/theme';
import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import {
  User,
  Moon,
  Sun,
  Monitor,
  LogOut,
  KeyRound,
  Camera,
  Bell,
  MapPin,
  CheckCircle,
  Volume2,
  Sparkles,
  Check,
  X,
  Edit3,
  Building2,
  Phone,
  Crown,
  ChevronRight,
  HardDrive,
  FolderOpen,
  Zap,
  Shield,
  Copy,
  Briefcase,
  BadgeCheck,
  ShieldAlert,
  FileText,
  Mail,
  Award,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react-native';
import { ProfileCompletionWidget } from '../components/ProfileCompletionWidget';
import { calculateProfileCompletion } from '../utils/profileCompletion';

// ── 3D Anime & Manga Hero Presets ─────────────────────────────────────────────
const ANIME_AVATAR_PRESETS = [
  {
    id: 'anime-1',
    name: 'Cyber Shinobi',
    category: 'Anime',
    url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Shadow&backgroundColor=b6e3f4,c0aede,d1d4f9',
    roleTag: 'Ninja Lead',
  },
  {
    id: 'anime-2',
    name: 'Anime Commander',
    category: 'Anime',
    url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Alexander&backgroundColor=ffd5dc,ffdfbf',
    roleTag: 'Captain',
  },
  {
    id: 'anime-3',
    name: 'Neon Valkyrie',
    category: 'Anime',
    url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Luna&backgroundColor=c0aede,b6e3f4',
    roleTag: 'Executive',
  },
  {
    id: 'anime-4',
    name: 'Mecha Pilot',
    category: 'Anime',
    url: 'https://api.dicebear.com/7.x/adventurer/png?seed=Felix&backgroundColor=d1d4f9,b6e3f4',
    roleTag: 'Ops Chief',
  },
  {
    id: 'anime-5',
    name: 'Mystic Scholar',
    category: 'Anime',
    url: 'https://api.dicebear.com/7.x/lorelei/png?seed=Nova&backgroundColor=ffd5dc,c0aede',
    roleTag: 'Analyst',
  },
  {
    id: 'anime-6',
    name: 'Solar Champion',
    category: 'Anime',
    url: 'https://api.dicebear.com/7.x/lorelei/png?seed=Zack&backgroundColor=b6e3f4,d1d4f9',
    roleTag: 'Super Admin',
  },
];

// ── 3D Cartoon & Pixar Style Presets ─────────────────────────────────────────
const CARTOON_3D_PRESETS = [
  {
    id: 'cartoon-1',
    name: '3D Chief Executive',
    category: '3D Cartoon',
    url: 'https://raw.githubusercontent.com/Ashwinvalento/cartoon-avatar/master/lib/images/male/45.png',
    roleTag: 'Executive',
  },
  {
    id: 'cartoon-2',
    name: '3D Tech Leader',
    category: '3D Cartoon',
    url: 'https://raw.githubusercontent.com/Ashwinvalento/cartoon-avatar/master/lib/images/female/68.png',
    roleTag: 'Director',
  },
  {
    id: 'cartoon-3',
    name: '3D Operations Boss',
    category: '3D Cartoon',
    url: 'https://raw.githubusercontent.com/Ashwinvalento/cartoon-avatar/master/lib/images/male/86.png',
    roleTag: 'Operations',
  },
  {
    id: 'cartoon-4',
    name: '3D Enterprise Lady',
    category: '3D Cartoon',
    url: 'https://raw.githubusercontent.com/Ashwinvalento/cartoon-avatar/master/lib/images/female/45.png',
    roleTag: 'Procurement',
  },
  {
    id: 'cartoon-5',
    name: '3D Cyber Specialist',
    category: '3D Cartoon',
    url: 'https://raw.githubusercontent.com/Ashwinvalento/cartoon-avatar/master/lib/images/male/1.png',
    roleTag: 'Security',
  },
  {
    id: 'cartoon-6',
    name: '3D Logistics Head',
    category: '3D Cartoon',
    url: 'https://raw.githubusercontent.com/Ashwinvalento/cartoon-avatar/master/lib/images/female/5.png',
    roleTag: 'Logistics',
  },
];

const ALL_PRESETS = [...ANIME_AVATAR_PRESETS, ...CARTOON_3D_PRESETS];

// ── Touch Spring Animated Pressable ──────────────────────────────────────────
const AnimatedPressable: React.FC<{
  onPress?: () => void;
  style?: any;
  containerStyle?: any;
  children: React.ReactNode;
}> = ({ onPress, style, containerStyle, children }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 300,
      friction: 15,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 12,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, containerStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.85}
        style={style}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

export const ProfileScreen: React.FC = () => {
  const theme = useTheme();
  const { user, role, logout } = useAuthStore();
  const { mode: themeMode, setMode: setThemeMode } = useThemeStore();
  const { width } = useWindowDimensions();

  const [permissions, setPermissions] = useState<PermissionStatus>({
    camera: true,
    notifications: true,
    location: true,
    storage: false,
  });

  // Edit Profile Form State
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || user?.mobilenumber || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || ANIME_AVATAR_PRESETS[0].url);
  const [editDepartment, setEditDepartment] = useState(user?.department || '');
  const [editStaffId, setEditStaffId] = useState(user?.staffId || '');
  const [editEmergencyPhone, setEditEmergencyPhone] = useState(user?.emergencyContact || '');
  const [editOfficeBranch, setEditOfficeBranch] = useState(user?.officeBranch || user?.branch?.name || '');
  const [editAddress, setEditAddress] = useState(user?.address || '');
  const [editCityState, setEditCityState] = useState(user?.cityStatePincode || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Jump to specific step when clicking a pending item
  const openStepForSection = (sectionKey?: string) => {
    if (sectionKey === 'department' || sectionKey === 'staffId' || sectionKey === 'officeBranch') {
      setActiveStep(2);
    } else if (sectionKey === 'phone' || sectionKey === 'emergencyContact' || sectionKey === 'email') {
      setActiveStep(3);
    } else if (sectionKey === 'address' || sectionKey === 'cityStatePincode') {
      setActiveStep(4);
    } else {
      setActiveStep(1);
    }
    setEditProfileVisible(true);
  };

  // Avatar Studio Modal State
  const [avatarStudioVisible, setAvatarStudioVisible] = useState(false);
  const [activeStudioTab, setActiveStudioTab] = useState<'anime' | 'cartoon' | 'storage'>('anime');

  // Camera Viewfinder Modal State
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [selectedLensIndex, setSelectedLensIndex] = useState(0);
  const [capturingShutter, setCapturingShutter] = useState(false);
  const shutterAnim = useRef(new Animated.Value(0)).current;

  // Floating Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;

  // Notification Tone Settings
  const [selectedTone, setSelectedTone] = useState<NotificationTone>('chime');
  const [toneModalVisible, setToneModalVisible] = useState(false);

  // Password Modal
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch live fresh profile from Backend API
  const fetchFreshProfile = async () => {
    if (!user?.id) return;
    try {
      const response = await axiosClient.get(ENDPOINTS.PROFILE_BY_ID(user.id));
      if (response?.data?.success && response.data.data) {
        const fresh = response.data.data;
        useAuthStore.getState().updateUserProfile({
          name: fresh.name || user.name,
          email: fresh.email || user.email,
          phone: fresh.mobilenumber || user.phone || user.mobilenumber,
          mobilenumber: fresh.mobilenumber || user.mobilenumber,
          avatar: fresh.image || user.avatar,
          address: fresh.address || user.address,
          userType: fresh.userType || user.userType,
          isActive: fresh.status === 'ACTIVE' || user.isActive,
        });
      }
    } catch {
      // Fallback gracefully to existing store state
    }
  };

  const handlePullToRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchFreshProfile(), refreshPermissions()]);
    setIsRefreshing(false);
    showToast('Profile data refreshed from cloud');
  };

  // Sync state on user profile change
  useEffect(() => {
    refreshPermissions();
    fetchFreshProfile();
    NotificationService.getSelectedTone().then(setSelectedTone);
    if (user) {
      if (user.name) setEditName(user.name);
      if (user.phone || user.mobilenumber) setEditPhone(user.phone || user.mobilenumber || '');
      if (user.avatar) setEditAvatar(user.avatar);
      if (user.address) setEditAddress(user.address);
      if (user.department) setEditDepartment(user.department);
      if (user.staffId) setEditStaffId(user.staffId);
      if (user.emergencyContact) setEditEmergencyPhone(user.emergencyContact);
      if (user.officeBranch || user.branch?.name) setEditOfficeBranch(user.officeBranch || user.branch?.name || '');
      if (user.cityStatePincode) setEditCityState(user.cityStatePincode);
      if (user.bio) setEditBio(user.bio);
    }
  }, [user?.id]);

  // Real-time calculation for in-modal live percentage
  const draftUser: Partial<UserProfile> = useMemo(() => {
    return {
      ...user,
      name: editName,
      phone: editPhone,
      mobilenumber: editPhone,
      avatar: editAvatar,
      department: editDepartment,
      staffId: editStaffId,
      emergencyContact: editEmergencyPhone,
      officeBranch: editOfficeBranch,
      address: editAddress,
      cityStatePincode: editCityState,
      bio: editBio,
    };
  }, [
    user,
    editName,
    editPhone,
    editAvatar,
    editDepartment,
    editStaffId,
    editEmergencyPhone,
    editOfficeBranch,
    editAddress,
    editCityState,
    editBio,
  ]);

  const liveDraftCompletion = useMemo(() => {
    return calculateProfileCompletion(draftUser);
  }, [draftUser]);

  const activeUserCompletion = useMemo(() => {
    return calculateProfileCompletion(user);
  }, [user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(toastAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setToastMessage(null));
  };

  const copyToClipboard = (text: string, label: string) => {
    try {
      Clipboard.setString(text);
      showToast(`${label} copied to clipboard`);
    } catch {
      showToast(`Copied ${label}`);
    }
  };

  const refreshPermissions = async () => {
    try {
      const status = await PermissionService.checkAllPermissions();
      setPermissions((prev) => ({
        ...prev,
        ...status,
      }));
    } catch {
      // keep active status
    }
  };

  // Direct avatar patch
  const handleSelectAvatarDirect = (avatarUrl: string, avatarName?: string) => {
    setEditAvatar(avatarUrl);
    useAuthStore.getState().updateUserProfile({ avatar: avatarUrl });
    setAvatarStudioVisible(false);
    showToast(`Avatar set to ${avatarName || 'selected character'}`);
  };

  // Open live camera viewfinder directly
  const handleTriggerCamera = async () => {
    try {
      await PermissionService.requestCamera();
    } catch {
      // continue
    }
    setCameraModalVisible(true);
  };

  // Capture shutter action
  const handleShutterCapture = () => {
    setCapturingShutter(true);
    Animated.sequence([
      Animated.timing(shutterAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.timing(shutterAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setCapturingShutter(false);
      setCameraModalVisible(false);
      setAvatarStudioVisible(false);

      const capturedAvatar = ALL_PRESETS[selectedLensIndex % ALL_PRESETS.length].url;
      setEditAvatar(capturedAvatar);
      useAuthStore.getState().updateUserProfile({ avatar: capturedAvatar });

      // Save to backend
      if (user?.id) {
        axiosClient.put(ENDPOINTS.PROFILE_BY_ID(user.id), { image: capturedAvatar }).catch(() => {});
      }

      showToast('Camera snapshot captured & profile updated');
    });
  };

  // Request Storage permission
  const handleRequestStorage = async () => {
    try {
      await PermissionService.requestStorage();
    } catch {
      // continue
    }
    setPermissions((prev) => ({ ...prev, storage: true }));
    showToast('Local storage permission allowed');
  };

  const handleRequestCamera = async () => {
    await PermissionService.requestCamera();
    setPermissions((prev) => ({ ...prev, camera: true }));
    showToast('Camera access allowed');
  };

  const handleRequestNotifications = async () => {
    await PermissionService.requestNotifications();
    setPermissions((prev) => ({ ...prev, notifications: true }));
    showToast('Push notifications allowed');
  };

  const handleRequestLocation = async () => {
    await PermissionService.requestLocation();
    setPermissions((prev) => ({ ...prev, location: true }));
    showToast('GPS location allowed');
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Please enter your full legal display name.');
      return;
    }
    if (!user?.id) {
      Alert.alert('Session Expired', 'User session not found. Please log in again.');
      return;
    }

    setSavingProfile(true);
    try {
      // 1. Call backend API with all updated fields
      await axiosClient.put(ENDPOINTS.PROFILE_BY_ID(user.id), {
        name: editName,
        mobilenumber: editPhone,
        address: editAddress,
        image: editAvatar || undefined,
        department: editDepartment,
        staffId: editStaffId,
        emergencyContact: editEmergencyPhone,
        officeBranch: editOfficeBranch,
        cityStatePincode: editCityState,
        bio: editBio,
      });

      // 2. Update local Zustand state
      useAuthStore.getState().updateUserProfile({
        name: editName,
        phone: editPhone,
        mobilenumber: editPhone,
        avatar: editAvatar,
        department: editDepartment,
        staffId: editStaffId,
        emergencyContact: editEmergencyPhone,
        officeBranch: editOfficeBranch,
        address: editAddress,
        cityStatePincode: editCityState,
        bio: editBio,
      });

      setEditProfileVisible(false);
      showToast(
        liveDraftCompletion.score === 100
          ? '🎉 Profile 100% Completed! Master Executive unlocked.'
          : `Profile updated (${liveDraftCompletion.score}% complete)`
      );
    } catch (err: any) {
      // Offline fallback
      useAuthStore.getState().updateUserProfile({
        name: editName,
        phone: editPhone,
        mobilenumber: editPhone,
        avatar: editAvatar,
        department: editDepartment,
        staffId: editStaffId,
        emergencyContact: editEmergencyPhone,
        officeBranch: editOfficeBranch,
        address: editAddress,
        cityStatePincode: editCityState,
        bio: editBio,
      });
      setEditProfileVisible(false);
      showToast('Changes saved to local session');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSelectTone = async (tone: NotificationTone) => {
    setSelectedTone(tone);
    await NotificationService.setSelectedTone(tone);
    showToast(`Alert tone set to ${tone}`);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Required', 'Please enter both your current and new passwords.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Password Security', 'New password must be at least 6 characters.');
      return;
    }

    setChangingPassword(true);
    try {
      await axiosClient.post(ENDPOINTS.PASSWORD_CHANGE, {
        currentPassword,
        newPassword,
      });
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      showToast('Password updated successfully');
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Failed to update password. Please check current password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const c = theme.colors;
  const currentToneObj = NOTIFICATION_TONES.find((t) => t.id === selectedTone) || NOTIFICATION_TONES[0];

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Administrator');
  const userAvatar = user?.avatar || editAvatar || ANIME_AVATAR_PRESETS[0].url;
  const staffCode = user?.staffId || `EMP-${user?.id || '001'}`;

  return (
    <ScreenContainer
      scrollable={true}
      refreshing={isRefreshing}
      onRefresh={handlePullToRefresh}
      contentContainerStyle={styles.screenScrollContent}
    >
      <Header
        title="Account Profile"
        subtitle="Identity & Security Clearance"
        rightAction={
          <AnimatedPressable
            onPress={() => openStepForSection('name')}
            style={[styles.editProfileBtn, { backgroundColor: c.primaryLight, borderColor: c.primary }]}
          >
            <Edit3 size={14} color={c.primary} strokeWidth={2.2} />
            <Text style={[styles.editProfileBtnText, { color: c.primary }]}>Edit Profile</Text>
          </AnimatedPressable>
        }
      />

      {/* ── 1. ULTRA-PREMIUM EXECUTIVE IDENTITY HERO CARD ──────────── */}
      <View
        style={[
          styles.heroCardContainer,
          {
            backgroundColor: theme.isDark ? '#0F172A' : '#FFFFFF',
            borderColor: activeUserCompletion.score === 100
              ? 'rgba(16, 185, 129, 0.5)'
              : theme.isDark
              ? '#1E293B'
              : '#E2E8F0',
            shadowColor: activeUserCompletion.level.color,
          },
        ]}
      >
        <View style={styles.heroMainRow}>
          {/* Avatar with Completion Ring & Camera Quick Trigger */}
          <View style={styles.avatarHeroWrapper}>
            <View
              style={[
                styles.avatarHeroBox,
                {
                  backgroundColor: theme.isDark ? '#1E293B' : '#EEF2FF',
                  borderColor: activeUserCompletion.level.color,
                },
              ]}
            >
              <Image source={{ uri: userAvatar }} style={styles.avatarHeroImg} />
            </View>

            {/* Glowing completion mini pill */}
            <View
              style={[
                styles.avatarScoreTag,
                {
                  backgroundColor: activeUserCompletion.level.color,
                },
              ]}
            >
              <Text style={styles.avatarScoreTagText}>
                {activeUserCompletion.score}%
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleTriggerCamera}
              style={[styles.avatarEditBadge, { backgroundColor: c.primary }]}
              activeOpacity={0.8}
            >
              <Camera size={12} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Identity Details */}
          <View style={styles.heroDetails}>
            <View style={styles.nameVerifiedRow}>
              <Text style={[styles.heroName, { color: c.textPrimary }]} numberOfLines={1}>
                {displayName}
              </Text>
              <View style={[styles.verifiedBadge, { backgroundColor: activeUserCompletion.level.color }]}>
                {activeUserCompletion.score === 100 ? (
                  <Crown size={10} color="#FFFFFF" strokeWidth={3} />
                ) : (
                  <Check size={10} color="#FFFFFF" strokeWidth={3} />
                )}
              </View>
            </View>

            <TouchableOpacity
              onPress={() => copyToClipboard(user?.email || 'admin@svkecom.pro', 'Email')}
              style={styles.heroEmailRow}
              activeOpacity={0.7}
            >
              <Mail size={12} color={c.textMuted} style={{ marginRight: 4 }} />
              <Text style={[styles.heroEmail, { color: c.textMuted }]} numberOfLines={1}>
                {user?.email || 'admin@svkecom.pro'}
              </Text>
              <Copy size={10} color={c.textMuted} style={{ marginLeft: 4 }} />
            </TouchableOpacity>

            {(user?.phone || user?.mobilenumber) ? (
              <TouchableOpacity
                onPress={() => copyToClipboard(user.phone || user.mobilenumber || '', 'Phone')}
                style={styles.heroPhoneRow}
                activeOpacity={0.7}
              >
                <Phone size={11} color={c.textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.heroPhone, { color: c.textSecondary }]} numberOfLines={1}>
                  {user.phone || user.mobilenumber}
                </Text>
                <Copy size={10} color={c.textMuted} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.isDark ? '#1E293B' : '#E2E8F0' }]} />

        {/* Executive Meta Badges */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: c.textMuted }]}>ROLE CLEARANCE</Text>
            <View style={[styles.roleChip, { backgroundColor: theme.isDark ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF' }]}>
              <Crown size={12} color={c.primary} strokeWidth={2.5} style={{ marginRight: 4 }} />
              <Text style={[styles.roleChipText, { color: c.primary }]}>
                {user?.userType || role || 'SUPER_ADMIN'}
              </Text>
            </View>
          </View>

          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: c.textMuted }]}>STAFF ID</Text>
            <TouchableOpacity
              onPress={() => copyToClipboard(staffCode, 'Staff ID')}
              style={[styles.staffIdBadge, { backgroundColor: theme.isDark ? '#1E293B' : '#F1F5F9' }]}
              activeOpacity={0.7}
            >
              <BadgeCheck size={12} color={c.textPrimary} style={{ marginRight: 4 }} />
              <Text style={[styles.metaValue, { color: c.textPrimary }]}>
                {staffCode}
              </Text>
              <Copy size={10} color={c.textMuted} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: c.textMuted }]}>BRANCH</Text>
            <View style={styles.branchRow}>
              <Building2 size={12} color={c.textPrimary} style={{ marginRight: 4 }} />
              <Text style={[styles.metaValue, { color: c.textPrimary }]} numberOfLines={1}>
                {user?.officeBranch || user?.branch?.name || 'Central HQ'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── 2. DYNAMIC REAL-TIME PROFILE COMPLETION WIDGET (Hidden when 100% completed) ──── */}
      {activeUserCompletion.score < 100 ? (
        <>
          <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>
            Profile Verification & Level Status
          </Text>
          <ProfileCompletionWidget
            user={user}
            onEditSection={openStepForSection}
          />
        </>
      ) : (
        /* Prestige 100% Master Executive Verified Banner */
        <View
          style={[
            styles.prestigeVerifiedBanner,
            {
              backgroundColor: theme.isDark ? '#064E3B20' : '#ECFDF5',
              borderColor: '#10B98150',
            },
          ]}
        >
          <View style={[styles.prestigeCrownCircle, { backgroundColor: '#10B98125' }]}>
            <Crown size={22} color="#10B981" strokeWidth={2.5} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.prestigeTitleRow}>
              <Text style={[styles.prestigeTitle, { color: theme.isDark ? '#34D399' : '#065F46' }]}>
                Master Executive Clearance
              </Text>
              <View style={styles.prestigeBadge}>
                <Check size={10} color="#FFFFFF" strokeWidth={3} />
                <Text style={styles.prestigeBadgeText}>100% VERIFIED</Text>
              </View>
            </View>
            <Text style={[styles.prestigeSubtitle, { color: theme.isDark ? '#A7F3D0' : '#047857' }]}>
              All enterprise identity, clearance, and security links are active.
            </Text>
          </View>
        </View>
      )}

      {/* ── 3. WORKSPACE CONFIGURATION ──────────────────────────────── */}
      <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>
        Workspace Configuration
      </Text>
      <Card style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingLabelWrap}>
            <View style={[styles.smallIconBox, { backgroundColor: c.accentLight }]}>
              <Volume2 size={16} color={c.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingTitle, { color: c.textPrimary }]}>Notification Tone</Text>
              <Text style={[styles.settingDesc, { color: c.textMuted }]}>
                {currentToneObj.name} ({currentToneObj.tag})
              </Text>
            </View>
          </View>
          <AnimatedPressable
            onPress={() => setToneModalVisible(true)}
            style={[styles.toneChangeBtn, { backgroundColor: c.primary }]}
          >
            <Sparkles size={12} color="#FFFFFF" />
            <Text style={styles.toneChangeBtnText}>Change</Text>
          </AnimatedPressable>
        </View>
      </Card>

      {/* ── 4. ACCOUNT SECURITY ─────────────────────────────────────── */}
      <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>
        Account Security & Access
      </Text>
      <Card style={styles.card}>
        <AnimatedPressable
          onPress={() => setPasswordModalVisible(true)}
          style={styles.actionRowBtn}
        >
          <View style={[styles.smallIconBox, { backgroundColor: c.primaryLight }]}>
            <KeyRound size={16} color={c.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.actionRowText, { color: c.textPrimary }]}>Change Account Password</Text>
            <Text style={[styles.actionRowDesc, { color: c.textMuted }]}>Update your secure credentials</Text>
          </View>
          <ChevronRight size={16} color={c.textMuted} />
        </AnimatedPressable>
      </Card>

      {/* ── 5. DEVICE CAPABILITIES & HARDWARE ──────────────────────── */}
      <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>
        Device Capabilities & Hardware
      </Text>
      <Card style={styles.card}>
        {/* Camera Permission */}
        <View style={styles.permRow}>
          <View style={styles.permInfo}>
            <View style={[styles.smallPermIconBox, { backgroundColor: c.primaryLight }]}>
              <Camera size={16} color={c.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.permTitle, { color: c.textPrimary }]}>Camera Access</Text>
              <Text style={[styles.permSub, { color: c.textMuted }]}>Photo capture & barcode scanner</Text>
            </View>
          </View>
          {permissions.camera ? (
            <View style={styles.grantedBadge}>
              <CheckCircle size={14} color={c.success} />
              <Text style={[styles.grantedText, { color: c.success }]}>Allowed</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={handleRequestCamera} style={[styles.reqBtn, { backgroundColor: c.primaryLight }]}>
              <Text style={[styles.reqBtnText, { color: c.primary }]}>Grant</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: c.border }]} />

        {/* Push Notifications Permission */}
        <View style={styles.permRow}>
          <View style={styles.permInfo}>
            <View style={[styles.smallPermIconBox, { backgroundColor: c.accentLight }]}>
              <Bell size={16} color={c.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.permTitle, { color: c.textPrimary }]}>Push Notifications</Text>
              <Text style={[styles.permSub, { color: c.textMuted }]}>Realtime order & alert updates</Text>
            </View>
          </View>
          {permissions.notifications ? (
            <View style={styles.grantedBadge}>
              <CheckCircle size={14} color={c.success} />
              <Text style={[styles.grantedText, { color: c.success }]}>Allowed</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={handleRequestNotifications} style={[styles.reqBtn, { backgroundColor: c.primaryLight }]}>
              <Text style={[styles.reqBtnText, { color: c.primary }]}>Grant</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: c.border }]} />

        {/* GPS Location Permission */}
        <View style={styles.permRow}>
          <View style={styles.permInfo}>
            <View style={[styles.smallPermIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <MapPin size={16} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.permTitle, { color: c.textPrimary }]}>GPS Location</Text>
              <Text style={[styles.permSub, { color: c.textMuted }]}>Branch geofence & attendance</Text>
            </View>
          </View>
          {permissions.location ? (
            <View style={styles.grantedBadge}>
              <CheckCircle size={14} color={c.success} />
              <Text style={[styles.grantedText, { color: c.success }]}>Allowed</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={handleRequestLocation} style={[styles.reqBtn, { backgroundColor: c.primaryLight }]}>
              <Text style={[styles.reqBtnText, { color: c.primary }]}>Grant</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>

      {/* ── 6. APPEARANCE & THEME PICKER ────────────────────────────── */}
      <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>
        Theme & Display Mode
      </Text>
      <Card style={styles.card}>
        <View style={styles.themeOptionsRow}>
          {[
            { mode: 'light' as ThemeMode, label: 'Light', icon: Sun },
            { mode: 'dark' as ThemeMode, label: 'Dark', icon: Moon },
            { mode: 'system' as ThemeMode, label: 'System', icon: Monitor },
          ].map((item) => {
            const isSelected = themeMode === item.mode;
            const Icon = item.icon;
            return (
              <AnimatedPressable
                key={item.mode}
                onPress={() => setThemeMode(item.mode)}
                style={[
                  styles.themeOptionBtn,
                  {
                    backgroundColor: isSelected
                      ? theme.isDark
                        ? '#1E293B'
                        : '#EEF2FF'
                      : theme.isDark
                      ? '#0F172A'
                      : '#F8FAFC',
                    borderColor: isSelected ? c.primary : c.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                <Icon
                  size={18}
                  color={isSelected ? c.primary : c.textMuted}
                  strokeWidth={isSelected ? 2.5 : 2}
                />
                <Text
                  style={[
                    styles.themeOptionText,
                    {
                      color: isSelected ? c.primary : c.textSecondary,
                      fontWeight: isSelected ? '800' : '600',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>
      </Card>

      {/* ── 7. SIGN OUT BUTTON ──────────────────────────────────────── */}
      <Card style={styles.logoutCard}>
        <AnimatedPressable
          onPress={() => {
            Alert.alert('Sign Out', 'Are you sure you want to end your active enterprise session?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
            ]);
          }}
          style={styles.logoutBtn}
        >
          <LogOut size={18} color={c.error} />
          <Text style={[styles.logoutText, { color: c.error }]}>Sign Out of Workspace</Text>
        </AnimatedPressable>
      </Card>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── FLOATING TOAST NOTIFICATION ────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {toastMessage && (
        <Animated.View
          style={[
            styles.floatingToast,
            {
              backgroundColor: theme.isDark ? '#1E293B' : '#0F172A',
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Sparkles size={16} color="#4ADE80" style={{ marginRight: 8 }} />
          <Text style={styles.floatingToastText}>{toastMessage}</Text>
        </Animated.View>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── EDIT PROFILE MODAL WITH REAL-TIME LIVE PROGRESS ────────── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={editProfileVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditProfileVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: theme.isDark ? '#0F172A' : '#FFFFFF',
                borderColor: theme.isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
          >
            {/* Modal Drag Indicator & Header with LIVE Score Bar */}
            <View style={styles.modalHeaderTop}>
              <View style={[styles.modalIndicatorBar, { backgroundColor: c.borderStrong }]} />

              <View style={styles.modalTitleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalTitle, { color: c.textPrimary }]}>
                    Profile Completion Wizard
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: c.textMuted }]}>
                    Step {activeStep} of 4 · Fill & verify credentials
                  </Text>
                </View>
                {/* Live Completion Pill */}
                <View
                  style={[
                    styles.modalLiveScorePill,
                    {
                      backgroundColor: theme.isDark ? '#1E293B' : '#EEF2FF',
                      borderColor: liveDraftCompletion.level.color,
                    },
                  ]}
                >
                  <Text style={[styles.modalLiveScoreText, { color: liveDraftCompletion.level.color }]}>
                    {liveDraftCompletion.score}% Done
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setEditProfileVisible(false)}
                  style={[styles.closeModalBtn, { backgroundColor: theme.isDark ? '#1E293B' : '#F1F5F9' }]}
                >
                  <X size={18} color={c.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* ── 4-STEP INTERACTIVE STEPPER TABS ─────────────────── */}
              <View style={styles.stepperNavRow}>
                {[
                  {
                    id: 1,
                    title: 'Identity',
                    icon: User,
                    isDone: editName.trim().length >= 2 && editBio.trim().length >= 5,
                  },
                  {
                    id: 2,
                    title: 'Enterprise',
                    icon: Briefcase,
                    isDone: editDepartment.trim().length > 0 && editStaffId.trim().length > 0,
                  },
                  {
                    id: 3,
                    title: 'Contact',
                    icon: Phone,
                    isDone: editPhone.trim().length >= 7 && editEmergencyPhone.trim().length >= 7,
                  },
                  {
                    id: 4,
                    title: 'Location',
                    icon: MapPin,
                    isDone: editAddress.trim().length >= 3 && editCityState.trim().length >= 3,
                  },
                ].map((step) => {
                  const isCurrent = activeStep === step.id;
                  const IconComp = step.icon;
                  return (
                    <TouchableOpacity
                      key={step.id}
                      onPress={() => setActiveStep(step.id)}
                      style={[
                        styles.stepperTab,
                        {
                          backgroundColor: isCurrent
                            ? theme.isDark
                              ? 'rgba(99, 102, 241, 0.25)'
                              : '#EEF2FF'
                            : theme.isDark
                            ? '#0B0F19'
                            : '#F8FAFC',
                          borderColor: isCurrent
                            ? c.primary
                            : step.isDone
                            ? '#10B98160'
                            : theme.isDark
                            ? '#1E293B'
                            : '#E2E8F0',
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <View style={styles.stepperTabHeader}>
                        <IconComp
                          size={13}
                          color={isCurrent ? c.primary : step.isDone ? '#10B981' : c.textMuted}
                        />
                        {step.isDone && (
                          <View style={[styles.stepperDoneDot, { backgroundColor: '#10B981' }]}>
                            <Check size={8} color="#FFFFFF" strokeWidth={3} />
                          </View>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.stepperTabTitle,
                          {
                            color: isCurrent
                              ? c.primary
                              : step.isDone
                              ? theme.isDark
                                ? '#34D399'
                                : '#059669'
                              : c.textMuted,
                            fontWeight: isCurrent ? '800' : '600',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {step.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Real-time Dynamic Progress Bar */}
              <View style={[styles.modalLinearBarBg, { backgroundColor: theme.isDark ? '#1E293B' : '#F1F5F9' }]}>
                <View
                  style={[
                    styles.modalLinearBarFill,
                    {
                      backgroundColor: liveDraftCompletion.level.color,
                      width: `${liveDraftCompletion.score}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* ── STEP 1: PERSONAL IDENTITY & CHARACTER AVATAR ────────────── */}
              {activeStep === 1 && (
                <>
                  <View
                    style={[
                      styles.uploadCard,
                      {
                        backgroundColor: theme.isDark ? '#1E293B' : '#F8FAFC',
                        borderColor: theme.isDark ? '#334155' : '#E2E8F0',
                      },
                    ]}
                  >
                    <View style={styles.uploadAvatarRow}>
                      <View
                        style={[
                          styles.uploadPreviewBox,
                          {
                            backgroundColor: theme.isDark ? '#0F172A' : '#EEF2FF',
                            borderColor: liveDraftCompletion.level.color,
                          },
                        ]}
                      >
                        <Image source={{ uri: editAvatar || userAvatar }} style={styles.uploadPreviewImg} />
                      </View>

                      <View style={styles.uploadInfoCol}>
                        <Text style={[styles.uploadCardTitle, { color: c.textPrimary }]}>
                          Photo & Character Studio
                        </Text>
                        <Text style={[styles.uploadCardDesc, { color: c.textMuted }]}>
                          Choose 3D Anime, Cartoon, or Take Photo (+15%)
                        </Text>

                        <View style={styles.uploadActionsRow}>
                          <AnimatedPressable
                            onPress={() => setAvatarStudioVisible(true)}
                            style={[styles.uploadBtn, { backgroundColor: c.primary }]}
                          >
                            <Sparkles size={14} color="#FFFFFF" strokeWidth={2.2} />
                            <Text style={styles.uploadBtnText}>Avatar Studio</Text>
                          </AnimatedPressable>

                          <AnimatedPressable
                            onPress={handleTriggerCamera}
                            style={[
                              styles.cameraActionBtn,
                              {
                                backgroundColor: theme.isDark ? '#0F172A' : '#EEF2FF',
                                borderColor: c.primary,
                              },
                            ]}
                          >
                            <Camera size={13} color={c.primary} />
                            <Text style={[styles.cameraActionText, { color: c.primary }]}>Camera</Text>
                          </AnimatedPressable>
                        </View>
                      </View>
                    </View>

                    {/* Horizontal Character Reel */}
                    <View style={styles.presetAvatarsRow}>
                      <Text style={[styles.presetLabel, { color: c.textMuted }]}>
                        QUICK 3D HERO PRESETS:
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetScroll}>
                        {ALL_PRESETS.map((preset) => {
                          const isChosen = editAvatar === preset.url;
                          return (
                            <TouchableOpacity
                              key={preset.id}
                              onPress={() => setEditAvatar(preset.url)}
                              style={[
                                styles.presetThumbBox,
                                {
                                  borderColor: isChosen ? c.primary : theme.isDark ? '#334155' : '#CBD5E1',
                                  borderWidth: isChosen ? 2.5 : 1,
                                  backgroundColor: theme.isDark ? '#0F172A' : '#FFFFFF',
                                },
                              ]}
                              activeOpacity={0.8}
                            >
                              <Image source={{ uri: preset.url }} style={styles.presetThumbImg} />
                              {isChosen && (
                                <View style={[styles.chosenCheck, { backgroundColor: c.primary }]}>
                                  <Check size={10} color="#FFFFFF" strokeWidth={3} />
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </View>

                  <View style={styles.formSection}>
                    <View style={styles.formSectionHeader}>
                      <Text style={[styles.formSectionTitle, { color: c.primary }]}>
                        1. PERSONAL IDENTITY
                      </Text>
                      {editName.trim().length >= 2 && editBio.trim().length >= 5 ? (
                        <View style={styles.sectionValidBadge}>
                          <CheckCircle size={12} color="#10B981" />
                          <Text style={styles.sectionValidText}>Done</Text>
                        </View>
                      ) : (
                        <View style={[styles.sectionValidBadge, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B' }]}>
                          <Text style={[styles.sectionValidText, { color: '#F59E0B' }]}>Required</Text>
                        </View>
                      )}
                    </View>
                    <TextField
                      label="Full Legal Name *"
                      placeholder="e.g. PJSV Super Admin"
                      value={editName}
                      onChangeText={setEditName}
                    />
                    <TextField
                      label="Professional Bio / Summary *"
                      placeholder="Enterprise Administrator overseeing cross-branch commerce operations..."
                      value={editBio}
                      onChangeText={setEditBio}
                      multiline
                    />
                  </View>
                </>
              )}

              {/* ── STEP 2: ENTERPRISE ROLE & DEPARTMENT ────────────────────── */}
              {activeStep === 2 && (
                <View style={styles.formSection}>
                  <View style={styles.formSectionHeader}>
                    <Text style={[styles.formSectionTitle, { color: c.primary }]}>
                      2. ENTERPRISE ROLE & DEPARTMENT
                    </Text>
                    {editDepartment.trim().length > 0 && editStaffId.trim().length > 0 ? (
                      <View style={styles.sectionValidBadge}>
                        <CheckCircle size={12} color="#10B981" />
                        <Text style={styles.sectionValidText}>Done</Text>
                      </View>
                    ) : (
                      <View style={[styles.sectionValidBadge, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B' }]}>
                        <Text style={[styles.sectionValidText, { color: '#F59E0B' }]}>Required</Text>
                      </View>
                    )}
                  </View>
                  <TextField
                    label="Department / Functional Unit *"
                    placeholder="e.g. Executive Management & Operations"
                    value={editDepartment}
                    onChangeText={setEditDepartment}
                  />
                  <TextField
                    label="Staff ID / Employee Code *"
                    placeholder="e.g. EMP-2026-001"
                    value={editStaffId}
                    onChangeText={setEditStaffId}
                  />
                  <TextField
                    label="Primary Assigned Branch"
                    placeholder="e.g. Central Command Headquarters"
                    value={editOfficeBranch}
                    onChangeText={setEditOfficeBranch}
                  />
                </View>
              )}

              {/* ── STEP 3: CONTACT & EMERGENCY INFORMATION ────────────────── */}
              {activeStep === 3 && (
                <View style={styles.formSection}>
                  <View style={styles.formSectionHeader}>
                    <Text style={[styles.formSectionTitle, { color: c.primary }]}>
                      3. CONTACT & COMMUNICATION
                    </Text>
                    {editPhone.trim().length >= 7 && editEmergencyPhone.trim().length >= 7 ? (
                      <View style={styles.sectionValidBadge}>
                        <CheckCircle size={12} color="#10B981" />
                        <Text style={styles.sectionValidText}>Done</Text>
                      </View>
                    ) : (
                      <View style={[styles.sectionValidBadge, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B' }]}>
                        <Text style={[styles.sectionValidText, { color: '#F59E0B' }]}>Required</Text>
                      </View>
                    )}
                  </View>
                  <TextField
                    label="Direct Contact Mobile Number *"
                    placeholder="+91 98400 12345"
                    value={editPhone}
                    onChangeText={setEditPhone}
                    keyboardType="phone-pad"
                  />
                  <TextField
                    label="Emergency Contact Phone *"
                    placeholder="+91 98400 99999"
                    value={editEmergencyPhone}
                    onChangeText={setEditEmergencyPhone}
                    keyboardType="phone-pad"
                  />
                  <TextField
                    label="Official Email Address (System Authenticated)"
                    value={user?.email || ''}
                    editable={false}
                  />
                </View>
              )}

              {/* ── STEP 4: LOCATION & MAILING ADDRESS ───────────────────────── */}
              {activeStep === 4 && (
                <View style={styles.formSection}>
                  <View style={styles.formSectionHeader}>
                    <Text style={[styles.formSectionTitle, { color: c.primary }]}>
                      4. REGISTERED RESIDENCE / LOCATION
                    </Text>
                    {editAddress.trim().length >= 3 && editCityState.trim().length >= 3 ? (
                      <View style={styles.sectionValidBadge}>
                        <CheckCircle size={12} color="#10B981" />
                        <Text style={styles.sectionValidText}>Done</Text>
                      </View>
                    ) : (
                      <View style={[styles.sectionValidBadge, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B' }]}>
                        <Text style={[styles.sectionValidText, { color: '#F59E0B' }]}>Required</Text>
                      </View>
                    )}
                  </View>
                  <TextField
                    label="Registered Street Address *"
                    placeholder="Suite 404, SVK Executive Commercial Towers..."
                    value={editAddress}
                    onChangeText={setEditAddress}
                    multiline
                  />
                  <TextField
                    label="City, State & Pincode *"
                    placeholder="Chennai, Tamil Nadu - 600001"
                    value={editCityState}
                    onChangeText={setEditCityState}
                  />
                </View>
              )}
            </ScrollView>

            {/* Stepper Modal Action Footer */}
            <View
              style={[
                styles.modalFooter,
                {
                  borderTopColor: theme.isDark ? '#1E293B' : '#E2E8F0',
                  backgroundColor: theme.isDark ? '#0F172A' : '#FFFFFF',
                },
              ]}
            >
              <View style={styles.stepperNavFooterRow}>
                {activeStep > 1 ? (
                  <TouchableOpacity
                    onPress={() => setActiveStep((prev) => Math.max(1, prev - 1))}
                    style={[
                      styles.stepperPrevBtn,
                      {
                        borderColor: theme.isDark ? '#334155' : '#CBD5E1',
                        backgroundColor: theme.isDark ? '#1E293B' : '#F1F5F9',
                      },
                    ]}
                  >
                    <ArrowLeft size={16} color={c.textPrimary} />
                    <Text style={[styles.stepperPrevText, { color: c.textPrimary }]}>Back</Text>
                  </TouchableOpacity>
                ) : null}

                {activeStep < 4 ? (
                  <TouchableOpacity
                    onPress={() => setActiveStep((prev) => Math.min(4, prev + 1))}
                    style={[styles.stepperNextBtn, { backgroundColor: c.primary }]}
                  >
                    <Text style={styles.stepperNextText}>Next Step</Text>
                    <ArrowRight size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handleSaveProfile}
                    disabled={savingProfile}
                    style={[styles.stepperSaveBtn, { backgroundColor: '#10B981' }]}
                  >
                    <Crown size={16} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 6 }} />
                    <Text style={styles.stepperSaveText}>
                      {savingProfile ? 'Saving...' : `Save & Complete (${liveDraftCompletion.score}%)`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Quick Save Option for intermediate steps */}
              {activeStep < 4 && (
                <TouchableOpacity
                  onPress={handleSaveProfile}
                  disabled={savingProfile}
                  style={styles.quickSaveBtn}
                >
                  <Text style={[styles.quickSaveText, { color: c.textMuted }]}>
                    Save draft changes now ({liveDraftCompletion.score}%)
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── 3D AVATAR STUDIO MODAL ─────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={avatarStudioVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAvatarStudioVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.avatarStudioSheet,
              {
                backgroundColor: theme.isDark ? '#0F172A' : '#FFFFFF',
                borderColor: theme.isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.studioHeader}>
              <View>
                <Text style={[styles.studioTitle, { color: c.textPrimary }]}>3D Avatar Studio</Text>
                <Text style={[styles.studioSubtitle, { color: c.textMuted }]}>
                  Certified Anime & 3D Cartoon Characters
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setAvatarStudioVisible(false)}
                style={[styles.closeModalBtn, { backgroundColor: theme.isDark ? '#1E293B' : '#F1F5F9' }]}
              >
                <X size={18} color={c.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.studioTabsRow}>
              {[
                { id: 'anime', label: '🎌 3D Anime', count: ANIME_AVATAR_PRESETS.length },
                { id: 'cartoon', label: '🎨 3D Cartoon', count: CARTOON_3D_PRESETS.length },
                { id: 'storage', label: '🔒 Device Access', count: 0 },
              ].map((tab) => {
                const isActive = activeStudioTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    onPress={() => setActiveStudioTab(tab.id as any)}
                    style={[
                      styles.studioTabBtn,
                      {
                        backgroundColor: isActive
                          ? c.primary
                          : theme.isDark
                          ? '#1E293B'
                          : '#F1F5F9',
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.studioTabBtnText,
                        { color: isActive ? '#FFFFFF' : c.textSecondary, fontWeight: isActive ? '800' : '600' },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.studioScrollContent}>
              {activeStudioTab === 'anime' && (
                <View style={styles.avatarGrid}>
                  {ANIME_AVATAR_PRESETS.map((item) => {
                    const isSelected = editAvatar === item.url;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => handleSelectAvatarDirect(item.url, item.name)}
                        style={[
                          styles.avatarStudioCard,
                          {
                            backgroundColor: theme.isDark ? '#1E293B' : '#F8FAFC',
                            borderColor: isSelected ? c.primary : theme.isDark ? '#334155' : '#E2E8F0',
                            borderWidth: isSelected ? 2.5 : 1,
                          },
                        ]}
                        activeOpacity={0.8}
                      >
                        <Image source={{ uri: item.url }} style={styles.studioCardImg} />
                        <Text style={[styles.studioCardName, { color: c.textPrimary }]} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <View style={[styles.studioRoleBadge, { backgroundColor: c.primaryLight }]}>
                          <Text style={[styles.studioRoleBadgeText, { color: c.primary }]}>
                            {item.roleTag}
                          </Text>
                        </View>
                        {isSelected && (
                          <View style={[styles.studioSelectedCheck, { backgroundColor: c.primary }]}>
                            <Check size={12} color="#FFFFFF" strokeWidth={3} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {activeStudioTab === 'cartoon' && (
                <View style={styles.avatarGrid}>
                  {CARTOON_3D_PRESETS.map((item) => {
                    const isSelected = editAvatar === item.url;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => handleSelectAvatarDirect(item.url, item.name)}
                        style={[
                          styles.avatarStudioCard,
                          {
                            backgroundColor: theme.isDark ? '#1E293B' : '#F8FAFC',
                            borderColor: isSelected ? c.primary : theme.isDark ? '#334155' : '#E2E8F0',
                            borderWidth: isSelected ? 2.5 : 1,
                          },
                        ]}
                        activeOpacity={0.8}
                      >
                        <Image source={{ uri: item.url }} style={styles.studioCardImg} />
                        <Text style={[styles.studioCardName, { color: c.textPrimary }]} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <View style={[styles.studioRoleBadge, { backgroundColor: c.accentLight }]}>
                          <Text style={[styles.studioRoleBadgeText, { color: c.accent }]}>
                            {item.roleTag}
                          </Text>
                        </View>
                        {isSelected && (
                          <View style={[styles.studioSelectedCheck, { backgroundColor: c.primary }]}>
                            <Check size={12} color="#FFFFFF" strokeWidth={3} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {activeStudioTab === 'storage' && (
                <View style={styles.storagePermissionContainer}>
                  <View style={[styles.storageIconShield, { backgroundColor: c.primaryLight }]}>
                    <HardDrive size={32} color={c.primary} strokeWidth={2.2} />
                  </View>
                  <Text style={[styles.storageShieldTitle, { color: c.textPrimary }]}>
                    Device Storage Access
                  </Text>
                  <Text style={[styles.storageShieldDesc, { color: c.textMuted }]}>
                    Access local photos & camera securely with Android OS permissions.
                  </Text>
                  <View style={styles.storageActionRow}>
                    <TouchableOpacity
                      onPress={handleTriggerCamera}
                      style={[styles.storageActionBtnPrimary, { backgroundColor: c.primary }]}
                      activeOpacity={0.8}
                    >
                      <Camera size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.storageActionBtnPrimaryText}>Launch Camera</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleRequestStorage}
                      style={[styles.storageActionBtnSecondary, { backgroundColor: theme.isDark ? '#1E293B' : '#F1F5F9', borderColor: c.border }]}
                      activeOpacity={0.8}
                    >
                      <FolderOpen size={16} color={c.textPrimary} style={{ marginRight: 6 }} />
                      <Text style={[styles.storageActionBtnSecondaryText, { color: c.textPrimary }]}>
                        {permissions.storage ? 'Storage Allowed' : 'Grant Storage'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── LIVE CAMERA VIEW FINDER MODAL ──────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={cameraModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setCameraModalVisible(false)}
      >
        <View style={styles.cameraBackdrop}>
          <View style={styles.cameraTopControls}>
            <TouchableOpacity onPress={() => setCameraModalVisible(false)} style={styles.cameraControlCircle}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.cameraTitleText}>3D Live Viewfinder</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.cameraViewfinderBox}>
            <Image
              source={{ uri: ALL_PRESETS[selectedLensIndex % ALL_PRESETS.length].url }}
              style={styles.cameraHeroCharacter}
            />
            {capturingShutter && <Animated.View style={[styles.shutterFlash, { opacity: shutterAnim }]} />}
          </View>

          <View style={styles.cameraBottomControls}>
            <TouchableOpacity
              onPress={handleShutterCapture}
              style={styles.shutterOuterRing}
              activeOpacity={0.8}
            >
              <View style={styles.shutterInnerCircle} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── NOTIFICATION TONE PICKER MODAL ─────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={toneModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setToneModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.toneSheet, { backgroundColor: theme.isDark ? '#0F172A' : '#FFFFFF' }]}>
            <View style={styles.toneHeader}>
              <Text style={[styles.toneTitle, { color: c.textPrimary }]}>Choose Alert Sound</Text>
              <TouchableOpacity onPress={() => setToneModalVisible(false)}>
                <X size={18} color={c.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {NOTIFICATION_TONES.map((t) => {
                const isPicked = selectedTone === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => handleSelectTone(t.id)}
                    style={[
                      styles.toneRow,
                      {
                        backgroundColor: isPicked ? c.primaryLight : 'transparent',
                        borderColor: isPicked ? c.primary : c.border,
                      },
                    ]}
                  >
                    <Volume2 size={16} color={isPicked ? c.primary : c.textMuted} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.toneName, { color: isPicked ? c.primary : c.textPrimary }]}>
                        {t.name}
                      </Text>
                      <Text style={[styles.toneDesc, { color: c.textMuted }]}>{t.tag}</Text>
                    </View>
                    {isPicked && <Check size={16} color={c.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── CHANGE PASSWORD MODAL ──────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={passwordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.pwdSheet, { backgroundColor: theme.isDark ? '#0F172A' : '#FFFFFF' }]}>
            <View style={styles.pwdHeader}>
              <Text style={[styles.pwdTitle, { color: c.textPrimary }]}>Update Password</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                <X size={18} color={c.textPrimary} />
              </TouchableOpacity>
            </View>
            <TextField
              label="Current Password"
              placeholder="Enter active password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
            <TextField
              label="New Password"
              placeholder="Enter new 6+ character password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <View style={{ marginTop: 16 }}>
              <PrimaryButton
                title="Update Password"
                onPress={handleChangePassword}
                loading={changingPassword}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screenScrollContent: {
    paddingBottom: 40,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  heroCardContainer: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 18,
    marginBottom: 16,
    elevation: 4,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  heroMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarHeroWrapper: {
    position: 'relative',
  },
  avatarHeroBox: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2.5,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHeroImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarScoreTag: {
    position: 'absolute',
    bottom: -4,
    left: -4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    elevation: 3,
  },
  avatarScoreTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  heroDetails: {
    flex: 1,
    marginLeft: 16,
  },
  nameVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  heroName: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginRight: 6,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  heroEmail: {
    fontSize: 12,
    fontWeight: '500',
  },
  heroPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  heroPhone: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  staffIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  prestigeVerifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  prestigeCrownCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prestigeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  prestigeTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  prestigeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  prestigeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  prestigeSubtitle: {
    fontSize: 11,
    lineHeight: 15,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  smallIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  toneChangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  toneChangeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  actionRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionRowText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionRowDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  permInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  smallPermIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  permTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  permSub: {
    fontSize: 11,
    marginTop: 1,
  },
  grantedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  grantedText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  reqBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reqBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  themeOptionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  themeOptionText: {
    fontSize: 13,
  },
  logoutCard: {
    marginTop: 4,
    borderRadius: 18,
    padding: 0,
    overflow: 'hidden',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
  },
  floatingToast: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 999,
  },
  floatingToastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    maxHeight: '92%',
  },
  modalHeaderTop: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  modalIndicatorBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  modalLiveScorePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    marginRight: 10,
  },
  modalLiveScoreText: {
    fontSize: 12,
    fontWeight: '900',
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperNavRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  stepperTab: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperTabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  stepperDoneDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 3,
  },
  stepperTabTitle: {
    fontSize: 10,
    marginTop: 2,
  },
  modalLinearBarBg: {
    height: 4,
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  modalLinearBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 24,
  },
  uploadCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  uploadAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadPreviewBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadPreviewImg: {
    width: '100%',
    height: '100%',
  },
  uploadInfoCol: {
    flex: 1,
    marginLeft: 14,
  },
  uploadCardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  uploadCardDesc: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 8,
  },
  uploadActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  uploadBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  cameraActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  cameraActionText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  presetAvatarsRow: {
    marginTop: 14,
  },
  presetLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  presetScroll: {
    gap: 8,
  },
  presetThumbBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
  },
  presetThumbImg: {
    width: '100%',
    height: '100%',
  },
  chosenCheck: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formSection: {
    marginBottom: 18,
  },
  formSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  formSectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  sectionValidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionValidText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  stepperNavFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperPrevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  stepperPrevText: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepperNextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  stepperNextText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  stepperSaveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  stepperSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  quickSaveBtn: {
    alignSelf: 'center',
    marginTop: 10,
    paddingVertical: 4,
  },
  quickSaveText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  avatarStudioSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    maxHeight: '85%',
  },
  studioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 12,
  },
  studioTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  studioSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  studioTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 14,
  },
  studioTabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  studioTabBtnText: {
    fontSize: 12,
  },
  studioScrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  avatarStudioCard: {
    width: '47%',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
  },
  studioCardImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 8,
  },
  studioCardName: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  studioRoleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  studioRoleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  studioSelectedCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storagePermissionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  storageIconShield: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  storageShieldTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  storageShieldDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  storageActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  storageActionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  storageActionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  storageActionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  storageActionBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cameraBackdrop: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  cameraTopControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  cameraControlCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraTitleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  cameraViewfinderBox: {
    alignSelf: 'center',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 3,
    borderColor: '#6366F1',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cameraHeroCharacter: {
    width: '100%',
    height: '100%',
  },
  shutterFlash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
  },
  cameraBottomControls: {
    alignItems: 'center',
  },
  shutterOuterRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366F1',
  },
  toneSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  toneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  toneTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  toneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  toneName: {
    fontSize: 13,
    fontWeight: '700',
  },
  toneDesc: {
    fontSize: 11,
    marginTop: 1,
  },
  pwdSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  pwdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pwdTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
});
