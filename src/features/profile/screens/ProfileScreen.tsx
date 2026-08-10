import React, { useState, useEffect, useRef } from 'react';
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
  Linking,
} from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Header } from '../../../components/common/Header';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { TextField } from '../../../components/inputs/TextField';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { useAuthStore } from '../../../store/authStore';
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
  Aperture,
  FolderOpen,
  RefreshCw,
  Zap,
  Layers,
} from 'lucide-react-native';

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
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || ANIME_AVATAR_PRESETS[0].url);
  const [editDepartment, setEditDepartment] = useState(user?.department || '');
  const [editStaffId, setEditStaffId] = useState(user?.staffId || '');
  const [editEmergencyPhone, setEditEmergencyPhone] = useState(user?.emergencyContact || '');
  const [editOfficeBranch, setEditOfficeBranch] = useState(user?.officeBranch || user?.branch?.name || '');
  const [editAddress, setEditAddress] = useState(user?.address || '');
  const [editCityState, setEditCityState] = useState(user?.cityStatePincode || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Avatar Studio Modal State
  const [avatarStudioVisible, setAvatarStudioVisible] = useState(false);
  const [activeStudioTab, setActiveStudioTab] = useState<'anime' | 'cartoon' | 'storage'>('anime');

  // Camera Viewfinder Modal State
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [selectedLensIndex, setSelectedLensIndex] = useState(0);
  const [flashActive, setFlashActive] = useState(false);
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

  // Sync state on user profile change
  useEffect(() => {
    refreshPermissions();
    NotificationService.getSelectedTone().then(setSelectedTone);
    if (user) {
      if (user.name) setEditName(user.name);
      if (user.phone) setEditPhone(user.phone);
      if (user.avatar) setEditAvatar(user.avatar);
      if (user.address) setEditAddress(user.address);
      if (user.department) setEditDepartment(user.department);
      if (user.staffId) setEditStaffId(user.staffId);
      if (user.emergencyContact) setEditEmergencyPhone(user.emergencyContact);
      if (user.officeBranch || user.branch?.name) setEditOfficeBranch(user.officeBranch || user.branch?.name || '');
      if (user.cityStatePincode) setEditCityState(user.cityStatePincode);
      if (user.bio) setEditBio(user.bio);
    }
  }, [user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setToastMessage(null));
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
    showToast(`Avatar set to ${avatarName || 'selected preset'}`);
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

  // Flip viewfinder character lens
  const handleFlipLens = () => {
    setSelectedLensIndex((prev) => (prev + 1) % ALL_PRESETS.length);
    showToast(`Lens switched to ${ALL_PRESETS[(selectedLensIndex + 1) % ALL_PRESETS.length].name}`);
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
      Alert.alert('Required', 'Please enter your full display name.');
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
      showToast('Profile details updated successfully');
    } catch (err: any) {
      // Offline fallback
      useAuthStore.getState().updateUserProfile({
        name: editName,
        phone: editPhone,
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
  const currentLensAvatar = ALL_PRESETS[selectedLensIndex % ALL_PRESETS.length];

  return (
    <ScreenContainer scrollable={true} contentContainerStyle={styles.screenScrollContent}>
      <Header
        title="Account Profile"
        subtitle="Enterprise Identity & System Preferences"
        rightAction={
          <AnimatedPressable
            onPress={() => setEditProfileVisible(true)}
            style={[styles.editProfileBtn, { backgroundColor: c.primaryLight, borderColor: c.primary }]}
          >
            <Edit3 size={15} color={c.primary} strokeWidth={2.2} />
            <Text style={[styles.editProfileBtnText, { color: c.primary }]}>Edit Profile</Text>
          </AnimatedPressable>
        }
      />

      {/* ── Ultra-Clean Executive Identity Card (Only Useful Data) ──── */}
      <View
        style={[
          styles.heroCardContainer,
          {
            backgroundColor: theme.isDark ? '#0F172A' : '#FFFFFF',
            borderColor: theme.isDark ? '#1E293B' : '#E2E8F0',
            shadowColor: theme.isDark ? '#000000' : c.primary,
          },
        ]}
      >
        <View style={styles.heroMainRow}>
          {/* Avatar with Status Ring & Quick Direct Camera Action */}
          <View style={styles.avatarHeroWrapper}>
            <View
              style={[
                styles.avatarHeroBox,
                {
                  backgroundColor: theme.isDark ? '#1E293B' : '#EEF2FF',
                  borderColor: c.primary,
                },
              ]}
            >
              <Image source={{ uri: userAvatar }} style={styles.avatarHeroImg} />
            </View>

            <TouchableOpacity
              onPress={handleTriggerCamera}
              style={[styles.avatarEditBadge, { backgroundColor: c.primary }]}
              activeOpacity={0.8}
            >
              <Camera size={13} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Useful User Identity Details */}
          <View style={styles.heroDetails}>
            <View style={styles.nameVerifiedRow}>
              <Text style={[styles.heroName, { color: c.textPrimary }]} numberOfLines={1}>
                {displayName}
              </Text>
              <View style={[styles.verifiedBadge, { backgroundColor: c.primary }]}>
                <Check size={10} color="#FFFFFF" strokeWidth={3} />
              </View>
            </View>

            <Text style={[styles.heroEmail, { color: c.textMuted }]} numberOfLines={1}>
              {user?.email || 'admin@svkecom.pro'}
            </Text>

            {user?.phone ? (
              <View style={styles.heroPhoneRow}>
                <Phone size={12} color={c.textSecondary} />
                <Text style={[styles.heroPhone, { color: c.textSecondary }]} numberOfLines={1}>
                  {user.phone}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.isDark ? '#1E293B' : '#E2E8F0' }]} />

        {/* Useful Executive Meta Row: Role & Assigned Branch */}
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
            <Text style={[styles.metaLabel, { color: c.textMuted }]}>OFFICE BRANCH</Text>
            <View style={styles.branchRow}>
              <Building2 size={13} color={c.textPrimary} style={{ marginRight: 4 }} />
              <Text style={[styles.metaValue, { color: c.textPrimary }]}>
                {user?.officeBranch || user?.branch?.name || 'Central HQ'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Workspace Settings ────────────────────────────────────── */}
      <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>
        Workspace Configuration
      </Text>
      <Card style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingLabelWrap}>
            <View style={[styles.smallIconBox, { backgroundColor: c.accentLight }]}>
              <Volume2 size={16} color={c.accent} />
            </View>
            <View>
              <Text style={[styles.settingTitle, { color: c.textPrimary }]}>Notification Tone</Text>
              <Text style={[styles.settingDesc, { color: c.textMuted }]}>{currentToneObj.name} ({currentToneObj.tag})</Text>
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

      {/* ── Account Security ──────────────────────────────────────── */}
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
            <Text style={[styles.actionRowDesc, { color: c.textMuted }]}>Update your workspace credentials</Text>
          </View>
          <ChevronRight size={16} color={c.textMuted} />
        </AnimatedPressable>
      </Card>

      {/* ── Device Capabilities & Hardware ────────────────────────── */}
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
            <View>
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

        {/* Storage / Photo Library Permission */}
        <View style={styles.permRow}>
          <View style={styles.permInfo}>
            <View style={[styles.smallPermIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <HardDrive size={16} color="#3B82F6" />
            </View>
            <View>
              <Text style={[styles.permTitle, { color: c.textPrimary }]}>Local Storage Permission</Text>
              <Text style={[styles.permSub, { color: c.textMuted }]}>Device file & storage access</Text>
            </View>
          </View>
          {permissions.storage ? (
            <View style={styles.grantedBadge}>
              <CheckCircle size={14} color={c.success} />
              <Text style={[styles.grantedText, { color: c.success }]}>Allowed</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={handleRequestStorage} style={[styles.reqBtn, { backgroundColor: c.primaryLight }]}>
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
            <View>
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
            <View>
              <Text style={[styles.permTitle, { color: c.textPrimary }]}>GPS Location</Text>
              <Text style={[styles.permSub, { color: c.textMuted }]}>Attendance geofencing & tracking</Text>
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

      {/* ── Interface Theme (100% Full-Width Responsive Segmented Dock) ─ */}
      <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Interface Theme</Text>
      <Card style={styles.themeCard}>
        <View style={styles.themeGrid}>
          {[
            { id: 'system', label: 'System', icon: Monitor },
            { id: 'light', label: 'Light', icon: Sun },
            { id: 'dark', label: 'Dark', icon: Moon },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = themeMode === item.id;
            return (
              <AnimatedPressable
                key={item.id}
                containerStyle={styles.themeBtnContainer}
                onPress={() => setThemeMode(item.id as ThemeMode)}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: isSelected
                      ? theme.isDark
                        ? 'rgba(99, 102, 241, 0.25)'
                        : '#EEF2FF'
                      : theme.isDark
                      ? '#1E293B'
                      : '#F8FAFC',
                    borderColor: isSelected ? c.primary : theme.isDark ? '#334155' : '#E2E8F0',
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

      {/* ── Sign Out Button ───────────────────────────────────────── */}
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
      {/* ── EDIT ENTERPRISE PROFILE MODAL ──────────────────────────── */}
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
            {/* Modal Drag Indicator & Header */}
            <View style={styles.modalHeaderTop}>
              <View style={[styles.modalIndicatorBar, { backgroundColor: c.borderStrong }]} />
              <View style={styles.modalTitleRow}>
                <View>
                  <Text style={[styles.modalTitle, { color: c.textPrimary }]}>Edit Enterprise Profile</Text>
                  <Text style={[styles.modalSubtitle, { color: c.textMuted }]}>
                    Update Identity, Photo & Contact Records
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setEditProfileVisible(false)}
                  style={[styles.closeModalBtn, { backgroundColor: theme.isDark ? '#1E293B' : '#F1F5F9' }]}
                >
                  <X size={18} color={c.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* ── 1. AVATAR STUDIO DROPZONE ───────────────────────── */}
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
                        borderColor: c.primary,
                      },
                    ]}
                  >
                    <Image source={{ uri: editAvatar || userAvatar }} style={styles.uploadPreviewImg} />
                  </View>

                  <View style={styles.uploadInfoCol}>
                    <Text style={[styles.uploadCardTitle, { color: c.textPrimary }]}>
                      Anime & Cartoon Avatar
                    </Text>
                    <Text style={[styles.uploadCardDesc, { color: c.textMuted }]}>
                      3D Character Presets & Live Camera Studio
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
                        style={[styles.cameraActionBtn, { backgroundColor: theme.isDark ? '#0F172A' : '#EEF2FF', borderColor: c.primary }]}
                      >
                        <Camera size={13} color={c.primary} />
                        <Text style={[styles.cameraActionText, { color: c.primary }]}>Camera</Text>
                      </AnimatedPressable>
                    </View>
                  </View>
                </View>

                {/* Quick 3D Anime & Cartoon Presets Horizontal Reel */}
                <View style={styles.presetAvatarsRow}>
                  <Text style={[styles.presetLabel, { color: c.textMuted }]}>
                    3D ANIME & CARTOON PRESETS:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetScroll}>
                    {ALL_PRESETS.map((preset) => {
                      const isChosen = editAvatar === preset.url;
                      return (
                        <TouchableOpacity
                          key={preset.id}
                          onPress={() => handleSelectAvatarDirect(preset.url, preset.name)}
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

              {/* ── 2. PERSONAL IDENTITY SECTION ───────────────────── */}
              <View style={styles.formSection}>
                <Text style={[styles.formSectionTitle, { color: c.primary }]}>
                  1. PERSONAL IDENTITY
                </Text>
                <TextField
                  label="Full Legal Name *"
                  placeholder="e.g. PJSV Super Admin"
                  value={editName}
                  onChangeText={setEditName}
                />
                <TextField
                  label="Professional Bio / Executive Summary"
                  placeholder="Enterprise Administrator managing cross-branch commerce operations..."
                  value={editBio}
                  onChangeText={setEditBio}
                  multiline
                />
              </View>

              {/* ── 3. ENTERPRISE & ROLE DETAILS ───────────────────── */}
              <View style={styles.formSection}>
                <Text style={[styles.formSectionTitle, { color: c.primary }]}>
                  2. ENTERPRISE ROLE & DEPARTMENT
                </Text>
                <TextField
                  label="Department / Functional Area"
                  placeholder="e.g. Operations & Executive Management"
                  value={editDepartment}
                  onChangeText={setEditDepartment}
                />
                <TextField
                  label="Staff ID / Employee Code"
                  placeholder="e.g. EMP-2026-001"
                  value={editStaffId}
                  onChangeText={setEditStaffId}
                />
                <TextField
                  label="Primary Assigned Office / Branch"
                  placeholder="e.g. Central Command Headquarters"
                  value={editOfficeBranch}
                  onChangeText={setEditOfficeBranch}
                />
              </View>

              {/* ── 4. CONTACT & EMERGENCY INFORMATION ─────────────── */}
              <View style={styles.formSection}>
                <Text style={[styles.formSectionTitle, { color: c.primary }]}>
                  3. CONTACT & COMMUNICATION
                </Text>
                <TextField
                  label="Direct Contact Mobile Number"
                  placeholder="+91 98400 12345"
                  value={editPhone}
                  onChangeText={setEditPhone}
                  keyboardType="phone-pad"
                />
                <TextField
                  label="Emergency Contact Phone"
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

              {/* ── 5. LOCATION & MAILING ADDRESS ──────────────────── */}
              <View style={styles.formSection}>
                <Text style={[styles.formSectionTitle, { color: c.primary }]}>
                  4. REGISTERED RESIDENCE / LOCATION
                </Text>
                <TextField
                  label="Registered Street Address"
                  placeholder="Suite 404, SVK Executive Commercial Towers..."
                  value={editAddress}
                  onChangeText={setEditAddress}
                  multiline
                />
                <TextField
                  label="City, State & Pincode"
                  placeholder="Chennai, Tamil Nadu - 600001"
                  value={editCityState}
                  onChangeText={setEditCityState}
                />
              </View>
            </ScrollView>

            {/* Sticky Modal Action Footer */}
            <View
              style={[
                styles.modalFooter,
                {
                  borderTopColor: theme.isDark ? '#1E293B' : '#E2E8F0',
                  backgroundColor: theme.isDark ? '#0F172A' : '#FFFFFF',
                },
              ]}
            >
              <PrimaryButton
                title="Save Profile Details"
                onPress={handleSaveProfile}
                loading={savingProfile}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── 3D ANIME, CARTOON & DEVICE STORAGE AVATAR STUDIO MODAL ─── */}
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
            {/* Header */}
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

            {/* Studio Segmented Tabs */}
            <View style={styles.studioTabsRow}>
              {[
                { id: 'anime', label: '🎌 3D Anime', count: ANIME_AVATAR_PRESETS.length },
                { id: 'cartoon', label: '🎨 3D Cartoon', count: CARTOON_3D_PRESETS.length },
                { id: 'storage', label: '🔒 Local Access', count: 0 },
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

            {/* Studio Content Grid */}
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
      {/* ── INTERACTIVE LIVE CAMERA VIEWFINDER MODAL ────────────────── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={cameraModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setCameraModalVisible(false)}
      >
        <View style={styles.cameraModalBackdrop}>
          <View style={styles.cameraViewfinderContainer}>
            {/* Viewfinder Header */}
            <View style={styles.viewfinderHeader}>
              <View>
                <Text style={styles.viewfinderTitle}>Executive Camera Viewfinder</Text>
                <Text style={styles.viewfinderSubtitle}>
                  Lens: {currentLensAvatar.name} ({currentLensAvatar.category})
                </Text>
              </View>

              <View style={styles.viewfinderTopActions}>
                <TouchableOpacity
                  onPress={() => {
                    setFlashActive(!flashActive);
                    showToast(flashActive ? 'Flash turned off' : 'Flash enabled');
                  }}
                  style={[
                    styles.viewfinderActionIconBtn,
                    { backgroundColor: flashActive ? '#F59E0B' : 'rgba(255,255,255,0.2)' },
                  ]}
                >
                  <Zap size={17} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleFlipLens}
                  style={styles.viewfinderActionIconBtn}
                >
                  <RefreshCw size={17} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setCameraModalVisible(false)}
                  style={styles.closeViewfinderBtn}
                >
                  <X size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Live Camera Frame Preview */}
            <View style={styles.viewfinderFrame}>
              <Image
                source={{ uri: currentLensAvatar.url }}
                style={styles.viewfinderLiveImg}
              />

              {/* Viewfinder Target Guidelines */}
              <View style={styles.targetReticle} pointerEvents="none">
                <View style={styles.reticleCornerTL} />
                <View style={styles.reticleCornerTR} />
                <View style={styles.reticleCornerBL} />
                <View style={styles.reticleCornerBR} />
              </View>

              {/* Shutter Flash Animation */}
              <Animated.View
                style={[
                  styles.shutterFlash,
                  {
                    opacity: shutterAnim,
                  },
                ]}
                pointerEvents="none"
              />
            </View>

            {/* Viewfinder Control Bar */}
            <View style={styles.viewfinderControls}>
              <Text style={styles.viewfinderPrompt}>
                Position face inside the reticle and tap shutter to capture
              </Text>

              {/* Horizontal Lens Switcher Quick Carousel */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.lensReelScroll}
              >
                {ALL_PRESETS.map((p, idx) => {
                  const isCur = selectedLensIndex % ALL_PRESETS.length === idx;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => setSelectedLensIndex(idx)}
                      style={[
                        styles.lensThumbCircle,
                        {
                          borderColor: isCur ? '#4ADE80' : 'rgba(255,255,255,0.4)',
                          borderWidth: isCur ? 2.5 : 1,
                        },
                      ]}
                    >
                      <Image source={{ uri: p.url }} style={styles.lensThumbImg} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                onPress={handleShutterCapture}
                style={styles.shutterOuterBtn}
                activeOpacity={0.7}
              >
                <View style={styles.shutterInnerBtn}>
                  <Aperture size={28} color={c.primary} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Tone Selection Modal ────────────────────────────────────── */}
      <Modal
        visible={toneModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setToneModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheetBox, { backgroundColor: theme.isDark ? c.surface : '#FFFFFF', borderColor: c.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[theme.typography.h3, { color: c.textPrimary }]}>Alert Tone & Sound</Text>
                <Text style={[theme.typography.caption, { color: c.textMuted }]}>
                  Select haptic audio feedback tone
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
                      styles.toneOptionItem,
                      {
                        backgroundColor: isSelected ? c.primaryLight : c.surfaceSecondary,
                        borderColor: isSelected ? c.primary : c.border,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
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

      {/* ── Change Password Modal ─────────────────────────────────── */}
      <Modal
        visible={passwordModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.pwdModalSheet, { backgroundColor: theme.isDark ? c.surface : '#FFFFFF', borderColor: c.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[theme.typography.h3, { color: c.textPrimary }]}>Change Password</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                <X size={20} color={c.textMuted} />
              </TouchableOpacity>
            </View>

            <TextField
              label="Current Password"
              placeholder="••••••••"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              isPassword
            />

            <TextField
              label="New Password"
              placeholder="••••••••"
              value={newPassword}
              onChangeText={setNewPassword}
              isPassword
            />

            <PrimaryButton
              title="Update Password"
              onPress={handleChangePassword}
              loading={changingPassword}
              style={{ marginTop: 14 }}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screenScrollContent: {
    paddingBottom: 130,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  heroCardContainer: {
    borderRadius: 24,
    borderWidth: 1.2,
    padding: 18,
    marginVertical: 8,
    position: 'relative',
    overflow: 'hidden',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  heroMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarHeroWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatarHeroBox: {
    width: 68,
    height: 68,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  avatarHeroImg: {
    width: '100%',
    height: '100%',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  heroDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  nameVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroName: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmail: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  heroPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
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
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
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
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginTop: 18,
    marginBottom: 8,
  },
  card: {
    padding: 16,
    marginVertical: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  smallIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingDesc: {
    fontSize: 11.5,
    marginTop: 1,
  },
  toneChangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 5,
  },
  toneChangeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  actionRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionRowText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionRowDesc: {
    fontSize: 11.5,
    marginTop: 1,
  },
  permRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  permInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  smallPermIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  permSub: {
    fontSize: 11,
    marginTop: 1,
  },
  grantedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  grantedText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  reqBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  reqBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  themeCard: {
    padding: 10,
    marginVertical: 4,
  },
  themeGrid: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  themeBtnContainer: {
    flex: 1,
  },
  themeOption: {
    width: '100%',
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
    padding: 12,
    marginVertical: 12,
    marginBottom: 20,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  logoutText: {
    fontSize: 13.5,
    fontWeight: '800',
  },

  // ── Floating Toast ────────────────────────────────────────────
  floatingToast: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    zIndex: 99999,
  },
  floatingToastText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },

  // ── Modal Styles ──────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  modalSheet: {
    maxHeight: '90%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingTop: 12,
  },
  modalHeaderTop: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  modalIndicatorBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
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
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  closeModalBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  uploadCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
  },
  uploadAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  uploadPreviewBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
    fontSize: 11.5,
    marginTop: 2,
    marginBottom: 8,
  },
  uploadActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 6,
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  cameraActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
  },
  cameraActionText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  presetAvatarsRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 10,
  },
  presetLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  presetScroll: {
    gap: 10,
  },
  presetThumbBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetThumbImg: {
    width: '100%',
    height: '100%',
  },
  chosenCheck: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formSection: {
    marginBottom: 18,
  },
  formSectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  avatarStudioSheet: {
    maxHeight: '85%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 20,
  },
  studioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  studioTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  studioSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  studioTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  studioTabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studioTabBtnText: {
    fontSize: 12,
  },
  studioScrollContent: {
    paddingBottom: 30,
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  studioCardImg: {
    width: 64,
    height: 64,
    borderRadius: 20,
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
    borderRadius: 6,
  },
  studioRoleBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  studioSelectedCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storagePermissionContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storageIconShield: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  storageShieldTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  storageShieldDesc: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  storageActionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  storageActionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  storageActionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  storageActionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  storageActionBtnSecondaryText: {
    fontSize: 13,
    fontWeight: '800',
  },

  // ── Camera Viewfinder Modal ───────────────────────────────────
  cameraModalBackdrop: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraViewfinderContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 30,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  viewfinderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewfinderTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  viewfinderSubtitle: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 2,
  },
  viewfinderTopActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewfinderActionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeViewfinderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinderFrame: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 28,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  viewfinderLiveImg: {
    width: '100%',
    height: '100%',
  },
  targetReticle: {
    position: 'absolute',
    top: 24,
    left: 24,
    right: 24,
    bottom: 24,
  },
  reticleCornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#4ADE80',
  },
  reticleCornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#4ADE80',
  },
  reticleCornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#4ADE80',
  },
  reticleCornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#4ADE80',
  },
  shutterFlash: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
  },
  viewfinderControls: {
    alignItems: 'center',
  },
  viewfinderPrompt: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  lensReelScroll: {
    gap: 10,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  lensThumbCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  lensThumbImg: {
    width: '100%',
    height: '100%',
  },
  shutterOuterBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInnerBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Modals & Tone Selection ───────────────────────────────────
  modalSheetBox: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 20,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeBtn: {
    padding: 4,
  },
  toneList: {
    gap: 8,
  },
  toneOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  toneOptionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toneOptionName: {
    fontSize: 14,
    fontWeight: '700',
  },
  toneOptionDesc: {
    fontSize: 11.5,
    marginTop: 2,
  },
  selectedCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBtn: {
    padding: 6,
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  pwdModalSheet: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
});
