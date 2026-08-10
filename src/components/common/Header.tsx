import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Bell,
  Menu,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '../../theme/theme';
import { useAuthStore } from '../../store/authStore';
import { useDrawerStore } from '../../store/drawerStore';

// ─── Header Props ─────────────────────────────────────────────────────────────

export interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  showNotification?: boolean;
  unreadCount?: number;
}

// ─── Interactive Animated Pressable ──────────────────────────────────────────

const AnimatedPressable: React.FC<{
  onPress?: () => void;
  style?: any;
  children: React.ReactNode;
  activeScale?: number;
}> = ({ onPress, style, children, activeScale = 0.92 }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: activeScale,
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
    <Animated.View style={[{ transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        style={style}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Header Component ────────────────────────────────────────────────────────

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  rightAction,
  showNotification = true,
  unreadCount = 1,
}) => {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { user } = useAuthStore();
  const { openDrawer } = useDrawerStore();

  const isTablet = width >= 768;

  // Bell subtle notification wave animation
  const bellJingle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (unreadCount > 0) {
      const jingleLoop = Animated.loop(
        Animated.sequence([
          Animated.delay(4500),
          Animated.timing(bellJingle, { toValue: 1, duration: 90, useNativeDriver: true }),
          Animated.timing(bellJingle, { toValue: -1, duration: 90, useNativeDriver: true }),
          Animated.timing(bellJingle, { toValue: 0.7, duration: 70, useNativeDriver: true }),
          Animated.timing(bellJingle, { toValue: -0.7, duration: 70, useNativeDriver: true }),
          Animated.timing(bellJingle, { toValue: 0, duration: 70, useNativeDriver: true }),
        ])
      );
      jingleLoop.start();
      return () => jingleLoop.stop();
    }
  }, [unreadCount]);

  const handleNotificationPress = () => {
    try {
      navigation.navigate('Notifications');
    } catch {
      // Fallback
    }
  };

  const bellRotate = bellJingle.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-16deg', '0deg', '16deg'],
  });

  const c = theme.colors;

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: theme.isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: theme.isDark ? 'rgba(51, 65, 85, 0.7)' : 'rgba(226, 232, 240, 0.9)',
          shadowColor: theme.isDark ? '#000000' : c.primary,
        },
      ]}
    >
      {/* ── Left Block: Menu/Back Button + Title & Subtitle ─────── */}
      <View style={styles.leftContainer}>
        {showBack ? (
          <AnimatedPressable
            onPress={onBackPress ?? (() => navigation.goBack())}
            style={[
              styles.navButton,
              {
                backgroundColor: theme.isDark ? c.surfaceSecondary : '#F1F5F9',
                borderColor: theme.isDark ? c.borderStrong : c.border,
              },
            ]}
          >
            <ArrowLeft size={18} color={c.textPrimary} strokeWidth={2.2} />
          </AnimatedPressable>
        ) : (
          <AnimatedPressable
            onPress={openDrawer}
            style={[
              styles.navButton,
              {
                backgroundColor: theme.isDark ? c.surfaceSecondary : '#F1F5F9',
                borderColor: theme.isDark ? c.borderStrong : c.border,
              },
            ]}
          >
            <Menu size={19} color={c.textPrimary} strokeWidth={2.2} />
          </AnimatedPressable>
        )}

        {/* Title and Subtitle Block */}
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              { color: c.textPrimary },
              isTablet && { fontSize: 20 },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>

          {subtitle ? (
            <View style={styles.subtitleRow}>
              <View style={[styles.subtitleBullet, { backgroundColor: c.primary }]} />
              <Text
                style={[styles.subtitle, { color: c.textMuted }]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* ── Right Block: Only Notifications or Custom Screen Action ─ */}
      <View style={styles.rightContainer}>
        {rightAction ? (
          rightAction
        ) : showNotification && user ? (
          <AnimatedPressable
            onPress={handleNotificationPress}
            style={[
              styles.notificationBtn,
              {
                backgroundColor: theme.isDark ? c.surfaceSecondary : '#F1F5F9',
                borderColor: theme.isDark ? c.borderStrong : c.border,
              },
            ]}
          >
            <Animated.View style={{ transform: [{ rotate: bellRotate }] }}>
              <Bell size={18} color={c.textPrimary} strokeWidth={2.2} />
            </Animated.View>
            {unreadCount > 0 && (
              <View style={[styles.badgePill, { backgroundColor: c.primary }]}>
                <View style={styles.badgePulseDot} />
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </AnimatedPressable>
        ) : null}
      </View>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 12,
    marginTop: 4,
    elevation: 4,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
    marginRight: 10,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  subtitleBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgePill: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgePulseDot: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#6366F1',
    opacity: 0.3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8.5,
    fontWeight: '900',
  },
});
