import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop, Path } from 'react-native-svg';
import { useTheme } from '../theme/theme';

const { width, height } = Dimensions.get('window');

// Animated SVG orbital rings background
const OrbitRings: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
    <Defs>
      <RadialGradient id="splash_bg" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor={color} stopOpacity="0.18" />
        <Stop offset="100%" stopColor={color} stopOpacity="0" />
      </RadialGradient>
    </Defs>
    {/* Concentric pulsing rings */}
    <Circle cx={width / 2} cy={height / 2} r={220} stroke={color} strokeOpacity="0.06" strokeWidth="1" fill="none" />
    <Circle cx={width / 2} cy={height / 2} r={160} stroke={color} strokeOpacity="0.1" strokeWidth="1" fill="none" />
    <Circle cx={width / 2} cy={height / 2} r={100} stroke={color} strokeOpacity="0.14" strokeWidth="1.5" fill="none" />
    <Circle cx={width / 2} cy={height / 2} r={200} fill="url(#splash_bg)" />
    {/* Decorative arcs */}
    <Path
      d={`M ${width * 0.1},${height * 0.25} Q ${width * 0.3},${height * 0.1} ${width * 0.5},${height * 0.22}`}
      stroke={color} strokeOpacity="0.07" strokeWidth="1" fill="none"
    />
    <Path
      d={`M ${width * 0.5},${height * 0.78} Q ${width * 0.7},${height * 0.88} ${width * 0.9},${height * 0.72}`}
      stroke={color} strokeOpacity="0.07" strokeWidth="1" fill="none"
    />
  </Svg>
);

/**
 * SplashScreen — pure presentational component shown while the app initializes.
 * No navigation, no side effects, no async calls.
 */
export const SplashScreen: React.FC = () => {
  const theme = useTheme();

  // Animations
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.8)).current;
  const spinnerOpacity = useRef(new Animated.Value(0)).current;
  const dotOpacity1 = useRef(new Animated.Value(0.3)).current;
  const dotOpacity2 = useRef(new Animated.Value(0.3)).current;
  const dotOpacity3 = useRef(new Animated.Value(0.3)).current;

  // Track animations so we can stop them on unmount
  const dotAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Logo entrance
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(ringScale, {
        toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start(() => {
      if (!isMountedRef.current) return;
      // Title entrance
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(titleTranslate, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start(() => {
        if (!isMountedRef.current) return;
        // Subtitle and spinner
        Animated.parallel([
          Animated.timing(subtitleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(spinnerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
      });
    });

    // Dot pulse animation loop — use Animated.loop so it can be stopped on unmount
    const buildDotLoop = () =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotOpacity1, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dotOpacity2, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dotOpacity3, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(dotOpacity1, { toValue: 0.3, duration: 400, useNativeDriver: true }),
            Animated.timing(dotOpacity2, { toValue: 0.3, duration: 400, useNativeDriver: true }),
            Animated.timing(dotOpacity3, { toValue: 0.3, duration: 400, useNativeDriver: true }),
          ]),
        ])
      );

    const dotTimer = setTimeout(() => {
      if (!isMountedRef.current) return;
      dotAnimRef.current = buildDotLoop();
      dotAnimRef.current.start();
    }, 1200);

    return () => {
      isMountedRef.current = false;
      clearTimeout(dotTimer);
      // Stop the dot loop animation to prevent memory leak
      if (dotAnimRef.current) {
        dotAnimRef.current.stop();
        dotAnimRef.current = null;
      }
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Animated SVG background */}
      <OrbitRings color={theme.colors.primary} />

      {/* Animated ring halo behind logo */}
      <Animated.View
        style={[
          styles.ringHalo,
          {
            borderColor: theme.colors.primary,
            transform: [{ scale: ringScale }],
            opacity: logoOpacity,
          },
        ]}
      />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoBox,
          { transform: [{ scale: logoScale }], opacity: logoOpacity },
        ]}
      >
        <Image
          source={require('../assets/app_icon.png')}
          style={styles.logoImage}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Title */}
      <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleTranslate }], alignItems: 'center' }}>
        <View style={[styles.badge, { backgroundColor: theme.colors.cyanLight }]}>
          <Text style={[styles.badgeText, { color: theme.colors.cyan }]}>
            ENTERPRISE COMMAND CENTER
          </Text>
        </View>
        <Text style={[styles.appName, { color: theme.colors.textPrimary }]}>
          SVK E-Com Pro
        </Text>
      </Animated.View>

      {/* Subtitle */}
      <Animated.Text style={[styles.tagline, { color: theme.colors.textMuted, opacity: subtitleOpacity }]}>
        COMMERCE · WORKFORCE · COMMAND
      </Animated.Text>

      {/* Animated dots loader */}
      <Animated.View style={[styles.dotsRow, { opacity: spinnerOpacity }]}>
        <Animated.View style={[styles.dot, { backgroundColor: theme.colors.primary, opacity: dotOpacity1 }]} />
        <Animated.View style={[styles.dot, { backgroundColor: theme.colors.primary, opacity: dotOpacity2 }]} />
        <Animated.View style={[styles.dot, { backgroundColor: theme.colors.primary, opacity: dotOpacity3 }]} />
      </Animated.View>

      <Animated.Text style={[styles.hint, { color: theme.colors.textMuted, opacity: subtitleOpacity }]}>
        Initializing secure environment...
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  ringHalo: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 1,
    opacity: 0.25,
  },
  logoBox: {
    width: 112,
    height: 112,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    elevation: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 24,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: 6,
  },
  dotsRow: {
    flexDirection: 'row',
    marginTop: 48,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  hint: {
    fontSize: 12,
    marginTop: 14,
    opacity: 0.5,
  },
});
