import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle, Path, Rect } from 'react-native-svg';
import {
  Crown,
  Sparkles,
  Briefcase,
  Store,
  Truck,
  UserCheck,
  Shield,
  Zap,
  Activity,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '../../theme/theme';
import { useAuthStore } from '../../store/authStore';
import { useRealtimeSocket } from '../../hooks/useRealtimeSocket';
import { useNavigation } from '@react-navigation/native';

// ── Background SVG Orbital Art ────────────────────────────────────────────────

const CardOrbitalPattern: React.FC<{ primaryColor: string; accentColor: string; isDark: boolean }> = ({
  primaryColor,
  accentColor,
  isDark,
}) => (
  <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
    <Defs>
      <RadialGradient id="cardGlow1" cx="85%" cy="20%" r="70%">
        <Stop offset="0%" stopColor={accentColor} stopOpacity={isDark ? '0.22' : '0.12'} />
        <Stop offset="100%" stopColor={accentColor} stopOpacity="0" />
      </RadialGradient>
      <RadialGradient id="cardGlow2" cx="15%" cy="80%" r="60%">
        <Stop offset="0%" stopColor={primaryColor} stopOpacity={isDark ? '0.18' : '0.08'} />
        <Stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
      </RadialGradient>
    </Defs>
    <Rect width="100%" height="100%" fill="url(#cardGlow1)" />
    <Rect width="100%" height="100%" fill="url(#cardGlow2)" />
    <Circle cx="90%" cy="30%" r="90" stroke={primaryColor} strokeOpacity={isDark ? '0.08' : '0.04'} strokeWidth="1" fill="none" />
    <Circle cx="90%" cy="30%" r="130" stroke={accentColor} strokeOpacity={isDark ? '0.05' : '0.03'} strokeWidth="1" fill="none" />
    <Path
      d="M -20,40 Q 120,10 240,60"
      stroke={accentColor}
      strokeOpacity={isDark ? '0.08' : '0.04'}
      strokeWidth="1"
      fill="none"
    />
  </Svg>
);

// ── Executive Profile & Command Hub Hero Card ────────────────────────────────

export interface ExecutiveProfileCardProps {
  onPressProfile?: () => void;
}

export const ExecutiveProfileCard: React.FC<ExecutiveProfileCardProps> = ({ onPressProfile }) => {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const { user, role } = useAuthStore();
  const { isConnected } = useRealtimeSocket();
  const { width } = useWindowDimensions();

  const isSmallScreen = width < 375;

  // Animations
  const cardSlide = useRef(new Animated.Value(24)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;
  const livePulseAnim = useRef(new Animated.Value(1)).current;
  const liveOpacityAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(cardSlide, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle 3D logo breathing pulse
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, {
          toValue: 1.05,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(logoPulse, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // Realtime live radar animation
    const liveLoop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(livePulseAnim, {
            toValue: 2.4,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(livePulseAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(liveOpacityAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(liveOpacityAnim, {
            toValue: 0.8,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    liveLoop.start();

    return () => {
      pulseLoop.stop();
      liveLoop.stop();
    };
  }, []);

  // Role metadata resolver
  const getRoleMeta = (r?: string) => {
    if (!r) return { label: 'STAFF', color: theme.colors.primary, bg: theme.colors.primaryLight, Icon: Shield };
    const upper = r.toUpperCase();
    if (upper.includes('SUPER_ADMIN')) {
      return { label: 'SUPER ADMIN', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.35)', Icon: Crown };
    }
    if (upper.includes('ADMIN')) {
      return { label: 'ADMIN', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.35)', Icon: Sparkles };
    }
    if (upper.includes('BRANCH_MANAGER') || upper.includes('MANAGER')) {
      return { label: 'BRANCH MANAGER', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.35)', Icon: Briefcase };
    }
    if (upper.includes('SHOPKEEPER')) {
      return { label: 'SHOPKEEPER POS', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.35)', Icon: Store };
    }
    if (upper.includes('DELIVERY')) {
      return { label: 'DELIVERY RIDER', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.35)', Icon: Truck };
    }
    return { label: r.replace(/_/g, ' '), color: theme.colors.primary, bg: theme.colors.primaryLight, border: theme.colors.borderStrong, Icon: UserCheck };
  };

  const roleMeta = getRoleMeta(role);
  const RoleIcon = roleMeta.Icon;

  // Extract initials for fallback avatar
  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Administrator');
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleCardPress = () => {
    if (onPressProfile) {
      onPressProfile();
    } else {
      try {
        navigation.navigate('Profile');
      } catch {}
    }
  };

  const c = theme.colors;

  return (
    <Animated.View
      style={[
        styles.cardOuter,
        {
          opacity: cardOpacity,
          transform: [{ translateY: cardSlide }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={handleCardPress}
        activeOpacity={0.92}
        style={[
          styles.cardInner,
          {
            backgroundColor: theme.isDark ? '#0F172A' : '#FFFFFF',
            borderColor: theme.isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.15)',
            shadowColor: theme.isDark ? '#000000' : c.primary,
          },
        ]}
      >
        {/* Background Ambient SVG Art */}
        <CardOrbitalPattern
          primaryColor={c.primary}
          accentColor={c.accent}
          isDark={theme.isDark}
        />

        {/* ── Top Row: User Avatar + Name + Email + 3D Hologram Logo ── */}
        <View style={styles.topRow}>
          {/* Avatar with Status Ring */}
          <View style={styles.avatarWrapper}>
            <View
              style={[
                styles.avatarContainer,
                {
                  backgroundColor: theme.isDark ? '#1E293B' : '#EEF2FF',
                  borderColor: theme.isDark ? '#334155' : '#CBD5E1',
                },
              ]}
            >
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
              ) : (
                <Text style={[styles.avatarInitials, { color: c.primary }]}>
                  {initials}
                </Text>
              )}
            </View>

            {/* Glowing Online Pulse Indicator */}
            {isConnected && (
              <View style={styles.onlineBadge}>
                <Animated.View
                  style={[
                    styles.onlinePulseRing,
                    {
                      backgroundColor: c.success,
                      transform: [{ scale: livePulseAnim }],
                      opacity: liveOpacityAnim,
                    },
                  ]}
                />
                <View style={[styles.onlineDot, { backgroundColor: c.success }]} />
              </View>
            )}
          </View>

          {/* User Details */}
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: c.textPrimary }]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={[styles.userEmail, { color: c.textMuted }]} numberOfLines={1}>
              {user?.email || 'admin@svkecom.pro'}
            </Text>
          </View>

          {/* 3D Hologram App Emblem */}
          <Animated.View
            style={[
              styles.logoBox,
              { transform: [{ scale: logoPulse }] },
            ]}
          >
            <Image
              source={require('../../assets/app_icon.png')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </Animated.View>
        </View>

        {/* ── Bottom Strip: Role Badge + Realtime Status + Quick Access Arrow ── */}
        <View style={[styles.bottomStrip, { borderTopColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
          <View style={styles.badgesRow}>
            {/* Luxury Role Pill */}
            <View
              style={[
                styles.rolePill,
                {
                  backgroundColor: roleMeta.bg,
                  borderColor: roleMeta.border || 'transparent',
                },
              ]}
            >
              <RoleIcon size={11} color={roleMeta.color} strokeWidth={2.5} style={{ marginRight: 4 }} />
              <Text style={[styles.roleText, { color: roleMeta.color }]}>
                {roleMeta.label}
              </Text>
            </View>

            {/* Real-time Status Badge */}
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: isConnected
                    ? theme.isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5'
                    : theme.isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
                  borderColor: isConnected
                    ? theme.isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0'
                    : theme.isDark ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
                },
              ]}
            >
              <View
                style={[
                  styles.statusDotSmall,
                  { backgroundColor: isConnected ? c.success : c.error },
                ]}
              />
              <Text
                style={[
                  styles.statusPillText,
                  { color: isConnected ? c.success : c.error },
                ]}
              >
                {isConnected ? 'LIVE SYNC' : 'OFFLINE'}
              </Text>
            </View>
          </View>

          {/* Quick Profile Arrow */}
          <View style={[styles.arrowCircle, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }]}>
            <ChevronRight size={13} color={c.textSecondary} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  cardOuter: {
    width: '100%',
    marginBottom: 14,
  },
  cardInner: {
    borderRadius: 24,
    borderWidth: 1.2,
    padding: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  onlinePulseRing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  userEmail: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.1,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    elevation: 6,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  bottomStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  statusDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  arrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
