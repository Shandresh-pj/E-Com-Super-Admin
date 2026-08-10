import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Circle,
  Path,
  Rect,
  Ellipse,
} from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextField } from '../../../components/inputs/TextField';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { useLogin } from '../hooks/useLogin';
import { useTheme } from '../../../theme/theme';
import {
  ShieldCheck,
  Mail,
  Lock,
  AlertCircle,
  Zap,
  Wifi,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// ── Premium SVG background ────────────────────────────────────────────────────
const PremiumBackground: React.FC<{ isDark: boolean; primary: string; accent: string }> = ({
  isDark,
  primary,
  accent,
}) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg
      width={width}
      height={height}
      style={StyleSheet.absoluteFill}
    >
      <Defs>
        {/* Deep background gradient */}
        <LinearGradient id="ls_bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={isDark ? '#0D0F1A' : '#F0F2FF'} stopOpacity="1" />
          <Stop offset="50%" stopColor={isDark ? '#10131F' : '#F5F3FF'} stopOpacity="1" />
          <Stop offset="100%" stopColor={isDark ? '#0B0E17' : '#EEF2FF'} stopOpacity="1" />
        </LinearGradient>
        {/* Primary glow — top left */}
        <RadialGradient id="ls_g1" cx="10%" cy="8%" r="60%">
          <Stop offset="0%" stopColor={primary} stopOpacity={isDark ? '0.22' : '0.15'} />
          <Stop offset="100%" stopColor={primary} stopOpacity="0" />
        </RadialGradient>
        {/* Accent glow — bottom right */}
        <RadialGradient id="ls_g2" cx="95%" cy="92%" r="55%">
          <Stop offset="0%" stopColor={accent} stopOpacity={isDark ? '0.18' : '0.12'} />
          <Stop offset="100%" stopColor={accent} stopOpacity="0" />
        </RadialGradient>
        {/* Centre ambient */}
        <RadialGradient id="ls_g3" cx="50%" cy="48%" r="42%">
          <Stop offset="0%" stopColor={primary} stopOpacity={isDark ? '0.05' : '0.04'} />
          <Stop offset="100%" stopColor={primary} stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* Base */}
      <Rect width={width} height={height} fill="url(#ls_bg)" />
      <Rect width={width} height={height} fill="url(#ls_g1)" />
      <Rect width={width} height={height} fill="url(#ls_g2)" />
      <Rect width={width} height={height} fill="url(#ls_g3)" />

      {/* Decorative rings — top-right */}
      <Circle cx={width * 0.88} cy={height * 0.10} r={110} stroke={primary} strokeOpacity="0.07" strokeWidth="1" fill="none" />
      <Circle cx={width * 0.88} cy={height * 0.10} r={72} stroke={primary} strokeOpacity="0.10" strokeWidth="1" fill="none" />
      <Circle cx={width * 0.88} cy={height * 0.10} r={38} stroke={primary} strokeOpacity="0.08" strokeWidth="1.5" fill="none" />

      {/* Decorative rings — bottom-left */}
      <Circle cx={width * 0.08} cy={height * 0.90} r={120} stroke={accent} strokeOpacity="0.06" strokeWidth="1" fill="none" />
      <Circle cx={width * 0.08} cy={height * 0.90} r={78} stroke={accent} strokeOpacity="0.09" strokeWidth="1" fill="none" />

      {/* Subtle grid dots */}
      {([0.15, 0.35, 0.55, 0.75, 0.90] as number[]).flatMap((xr) =>
        ([0.20, 0.38, 0.56, 0.72, 0.88] as number[]).map((yr) => (
          <Circle
            key={`d-${xr}-${yr}`}
            cx={width * xr} cy={height * yr} r={1.2}
            fill={primary} fillOpacity={isDark ? '0.07' : '0.05'}
          />
        ))
      )}

      {/* Diagonal accent line */}
      <Path
        d={`M 0,${height * 0.55} Q ${width * 0.3},${height * 0.48} ${width},${height * 0.38}`}
        stroke={primary} strokeOpacity="0.05" strokeWidth="1" fill="none"
      />
      {/* Soft ellipse blur */}
      <Ellipse cx={width * 0.5} cy={height * 0.82} rx={width * 0.45} ry={80}
        fill={accent} fillOpacity={isDark ? '0.04' : '0.03'} />
    </Svg>
  </View>
);

// ── Animated indicator dots for server wake-up hint ───────────────────────────
const WakingDots: React.FC<{ color: string }> = ({ color }) => {
  const d1 = useRef(new Animated.Value(0.3)).current;
  const d2 = useRef(new Animated.Value(0.3)).current;
  const d3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.stagger(200, [
        Animated.sequence([
          Animated.timing(d1, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(d1, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(d2, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(d2, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(d3, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(d3, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={ls.dotsRow}>
      {[d1, d2, d3].map((d, i) => (
        <Animated.View
          key={i}
          style={[ls.dot, { backgroundColor: color, opacity: d }]}
        />
      ))}
    </View>
  );
};

// ── Main Login Screen ─────────────────────────────────────────────────────────
export const LoginScreen: React.FC = () => {
  const theme = useTheme();
  const {
    email, setEmail,
    password, setPassword,
    loading, error,
    isFormValid, handleLogin,
  } = useLogin();

  const [showServerHint, setShowServerHint] = useState(false);

  // Entrance animations
  const logoAnim  = useRef(new Animated.Value(0)).current;
  const formAnim  = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef  = useRef<Animated.CompositeAnimation | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    // Staggered entrance
    Animated.stagger(120, [
      Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
      Animated.timing(logoAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(formAnim, { toValue: 1, duration: 460, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    // Logo pulse loop
    pulseRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    pulseRef.current.start();

    return () => {
      isMounted.current = false;
      pulseRef.current?.stop();
    };
  }, []);

  // Show server-wake hint if loading for > 5 seconds
  useEffect(() => {
    if (loading) {
      const t = setTimeout(() => {
        if (isMounted.current) setShowServerHint(true);
      }, 5000);
      return () => clearTimeout(t);
    } else {
      setShowServerHint(false);
    }
  }, [loading]);

  const handleForgotPassword = () => {
    Alert.alert(
      'Reset Password',
      'Please contact your SVK system administrator to reset your account credentials.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const c = theme.colors;

  return (
    <SafeAreaView style={[ls.safe, { backgroundColor: c.background }]} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      {/* Premium SVG background */}
      <PremiumBackground isDark={theme.isDark} primary={c.primary} accent={c.accent} />

      <KeyboardAvoidingView style={ls.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={ls.flex}
          contentContainerStyle={ls.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Brand Header ─────────────────────────────────── */}
          <Animated.View
            style={[ls.brand, {
              opacity: logoAnim,
              transform: [
                { translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [-32, 0] }) },
              ],
            }]}
          >
            {/* Outer glow ring */}
            <Animated.View style={[ls.logoRing, { borderColor: c.primary + '28', transform: [{ scale: pulseAnim }] }]}>
              <View style={[ls.logoBox, { backgroundColor: c.primaryLight }]}>
                <ShieldCheck size={44} color={c.primary} strokeWidth={2} />
              </View>
            </Animated.View>

            {/* Platform badge */}
            <View style={[ls.badge, { backgroundColor: c.primaryLight }]}>
              <Zap size={10} color={c.primary} />
              <Text style={[ls.badgeText, { color: c.primary }]}>  ENTERPRISE PLATFORM</Text>
            </View>

            <Text style={[ls.appTitle, { color: c.textPrimary }]}>SVK E-Com Pro</Text>
            <Text style={[ls.appSub, { color: c.textMuted }]}>
              Unified Multi-Role Commerce Management
            </Text>
          </Animated.View>

          {/* ── Error Banner ─────────────────────────────────── */}
          {error ? (
            <Animated.View
              style={[ls.errorBox, { backgroundColor: c.errorLight, borderColor: c.error, opacity: formAnim }]}
            >
              <AlertCircle size={15} color={c.error} />
              <Text style={[ls.errorText, { color: c.error }]}>{error}</Text>
            </Animated.View>
          ) : null}

          {/* ── Server-wake hint ─────────────────────────────── */}
          {showServerHint && loading ? (
            <Animated.View style={[ls.hintBox, { backgroundColor: c.primaryLight, borderColor: c.primary + '40', opacity: formAnim }]}>
              <Wifi size={13} color={c.primary} />
              <Text style={[ls.hintText, { color: c.primary }]}>  Waking up server</Text>
              <WakingDots color={c.primary} />
            </Animated.View>
          ) : null}

          {/* ── Form Card ────────────────────────────────────── */}
          <Animated.View
            style={[ls.card, {
              backgroundColor: theme.isDark ? c.surface : '#FFFFFF',
              borderColor: c.border,
              shadowColor: c.primary,
              opacity: formAnim,
              transform: [
                { translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [36, 0] }) },
              ],
            }]}
          >
            {/* Accent top bar */}
            <View style={[ls.accentBar, { backgroundColor: c.primary }]} />

            <Text style={[ls.cardTitle, { color: c.textPrimary }]}>Welcome back</Text>
            <Text style={[ls.cardHint, { color: c.textMuted }]}>Sign in to your workspace</Text>

            <View style={ls.fields}>
              <TextField
                label="Work Email"
                placeholder="you@svkcommerce.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                leftIcon={<Mail size={17} color={c.textMuted} />}
              />
              <TextField
                label="Password"
                placeholder="••••••••••"
                value={password}
                onChangeText={setPassword}
                isPassword
                leftIcon={<Lock size={17} color={c.textMuted} />}
              />
            </View>

            <TouchableOpacity onPress={handleForgotPassword} style={ls.forgotRow} activeOpacity={0.7}>
              <Text style={[ls.forgotText, { color: c.primary }]}>Forgot password?</Text>
            </TouchableOpacity>

            <PrimaryButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              disabled={!isFormValid || loading}
              style={ls.btn}
            />

            {/* Divider */}
            <View style={[ls.divider, { borderTopColor: c.border }]} />

            {/* Security note */}
            <View style={ls.secureRow}>
              <ShieldCheck size={12} color={c.textMuted} />
              <Text style={[ls.secureText, { color: c.textMuted }]}>
                {'  '}256-bit TLS encrypted · JWT secured
              </Text>
            </View>
          </Animated.View>

          {/* ── Footer ───────────────────────────────────────── */}
          <Animated.View style={[ls.footer, { opacity: formAnim }]}>
            <Text style={[ls.footerText, { color: c.textMuted }]}>
              SVK E-Com Pro  ·  v1.0.0  ·  Enterprise Grade
            </Text>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const ls = StyleSheet.create({
  safe:        { flex: 1 },
  flex:        { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 40,
    minHeight: height,
  },

  // Brand
  brand: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoRing: {
    width: 108,
    height: 108,
    borderRadius: 38,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  logoBox: {
    width: 88,
    height: 88,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 24,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.3,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  appSub: {
    fontSize: 13,
    marginTop: 5,
    textAlign: 'center',
    lineHeight: 19,
  },

  // Banners
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    marginLeft: 6,
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  // Card
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  cardTitle: {
    fontSize: 21,
    fontWeight: '700',
    marginTop: 10,
    letterSpacing: -0.3,
  },
  cardHint: {
    fontSize: 13,
    marginTop: 3,
    marginBottom: 18,
    lineHeight: 18,
  },
  fields:     { gap: 4 },
  forgotRow:  { alignSelf: 'flex-end', paddingVertical: 10, marginBottom: 2 },
  forgotText: { fontSize: 13, fontWeight: '600' },
  btn:        { marginTop: 4 },

  divider: {
    borderTopWidth: 1,
    marginTop: 20,
    marginBottom: 14,
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secureText: {
    fontSize: 11,
    letterSpacing: 0.1,
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
