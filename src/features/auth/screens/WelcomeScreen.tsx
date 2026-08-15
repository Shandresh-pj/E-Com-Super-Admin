import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  useWindowDimensions,
  ScrollView,
  Image,
  Modal,
  Platform,
} from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Circle,
  Path,
  Rect,
} from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../../navigation/navigationTypes';
import { useTheme } from '../../../theme/theme';
import { useAuthStore } from '../../../store/authStore';
import {
  Crown,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Building2,
  Users,
  Car,
  ShoppingBag,
  Lock,
  ChevronRight,
  X,
  Activity,
  CheckCircle2,
  Cpu,
  Layers,
  Shield,
  Radio,
  Server,
  KeyRound,
  Check,
} from 'lucide-react-native';

// ── Orbital & Cyber Grid Background ──────────────────────────────────────────
const WelcomeBackground: React.FC<{
  width: number;
  height: number;
  isDark: boolean;
  primary: string;
  accent: string;
}> = ({ width, height, isDark, primary, accent }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="w_bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={isDark ? '#060812' : '#F4F7FF'} stopOpacity="1" />
          <Stop offset="50%" stopColor={isDark ? '#0B0F22' : '#F9F8FF'} stopOpacity="1" />
          <Stop offset="100%" stopColor={isDark ? '#04060D' : '#EBF0FF'} stopOpacity="1" />
        </LinearGradient>
        <RadialGradient id="w_g1" cx="15%" cy="12%" r="65%">
          <Stop offset="0%" stopColor={primary} stopOpacity={isDark ? '0.35' : '0.18'} />
          <Stop offset="100%" stopColor={primary} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="w_g2" cx="88%" cy="75%" r="60%">
          <Stop offset="0%" stopColor={accent} stopOpacity={isDark ? '0.30' : '0.15'} />
          <Stop offset="100%" stopColor={accent} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="w_g3" cx="50%" cy="45%" r="45%">
          <Stop offset="0%" stopColor="#06B6D4" stopOpacity={isDark ? '0.15' : '0.09'} />
          <Stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      <Rect width={width} height={height} fill="url(#w_bg)" />
      <Rect width={width} height={height} fill="url(#w_g1)" />
      <Rect width={width} height={height} fill="url(#w_g2)" />
      <Rect width={width} height={height} fill="url(#w_g3)" />

      {/* Futuristic Concentric Orbital Rings */}
      <Circle cx={width * 0.5} cy={height * 0.20} r={155} stroke={primary} strokeOpacity="0.09" strokeWidth="1" fill="none" />
      <Circle cx={width * 0.5} cy={height * 0.20} r={105} stroke={accent} strokeOpacity="0.12" strokeWidth="1.5" fill="none" />
      <Circle cx={width * 0.5} cy={height * 0.20} r={65} stroke="#06B6D4" strokeOpacity="0.15" strokeWidth="1" fill="none" />

      {/* Outer corner orbital lines */}
      <Circle cx={width * 0.95} cy={height * 0.85} r={200} stroke={accent} strokeOpacity="0.08" strokeWidth="1" fill="none" />
      <Circle cx={width * 0.05} cy={height * 0.92} r={140} stroke={primary} strokeOpacity="0.08" strokeWidth="1" fill="none" />

      {/* Constellation Grid Elements */}
      {([0.12, 0.32, 0.68, 0.88] as number[]).flatMap((xr) =>
        ([0.14, 0.30, 0.46, 0.64, 0.82] as number[]).map((yr) => (
          <Circle
            key={`dot-${xr}-${yr}`}
            cx={width * xr}
            cy={height * yr}
            r={1.4}
            fill={primary}
            fillOpacity={isDark ? '0.18' : '0.08'}
          />
        ))
      )}

      {/* Dynamic Cyber Sweep Wave */}
      <Path
        d={`M -20,${height * 0.36} Q ${width * 0.45},${height * 0.28} ${width + 20},${height * 0.42}`}
        stroke={accent}
        strokeOpacity="0.10"
        strokeWidth="1.5"
        fill="none"
      />
    </Svg>
  </View>
);

// ── Ecosystem Feature Capabilities ───────────────────────────────────────────
interface FeatureItem {
  id: string;
  title: string;
  badge: string;
  desc: string;
  icon: any;
  accentColor: string;
  metrics: string;
  tag: string;
}

const ECOSYSTEM_FEATURES: FeatureItem[] = [
  {
    id: 'commerce',
    title: 'Omni-Commerce & POS Matrix',
    badge: 'Multi-Branch Sales',
    desc: 'Instant barcode POS billing, multi-warehouse stock matrix sync, dynamic discounts, and real-time revenue analytics.',
    icon: ShoppingBag,
    accentColor: '#6366F1',
    metrics: '50K+ SKU Catalog · 0.1s POS Checkout',
    tag: 'RETAIL ENGINE',
  },
  {
    id: 'workforce',
    title: 'Workforce & Biometrics Hub',
    badge: 'Smart HR Suite',
    desc: 'AI-assisted facial recognition attendance, shift rosters, automated payroll calculation, and geofence tracking.',
    icon: Users,
    accentColor: '#10B981',
    metrics: '99.9% Biometric Accuracy · Multi-Shift',
    tag: 'PEOPLE OPS',
  },
  {
    id: 'mobility',
    title: 'Mobility & Fleet Telemetry',
    badge: 'Logistics Super-App',
    desc: 'Live GPS fleet telemetry, algorithmic fare dispatch, instant rental booking, and automated parcel distribution.',
    icon: Car,
    accentColor: '#F59E0B',
    metrics: 'Sub-second GPS Ping · Auto Dispatch',
    tag: 'LOGISTICS',
  },
  {
    id: 'security',
    title: 'Enterprise E2EE Cyber Shield',
    badge: 'Security Clearance',
    desc: '256-bit AES encrypted team communication, WebRTC video meetings, multi-tenant RBAC clearance, and audit logging.',
    icon: ShieldCheck,
    accentColor: '#EC4899',
    metrics: 'TLS 1.3 · 256-Bit Cryptographic Guard',
    tag: 'ZERO-TRUST',
  },
];

// ── Quick Demo Persona Presets ────────────────────────────────────────────────
const DEMO_ROLES = [
  {
    role: 'SUPER_ADMIN',
    label: 'Super Admin',
    desc: 'Full enterprise command across all 55 modules & security governance',
    icon: Crown,
    color: '#6366F1',
    badge: 'CLEARANCE LEVEL 10',
  },
  {
    role: 'ADMIN',
    label: 'Company Admin',
    desc: 'Manage daily operations, catalog, billing registers & branch performance',
    icon: Building2,
    color: '#3B82F6',
    badge: 'EXECUTIVE CLEARANCE',
  },
  {
    role: 'BRANCH_MANAGER',
    label: 'Branch Manager',
    desc: 'Local warehouse stock, order fulfillment, staff rosters & POS registers',
    icon: Layers,
    color: '#10B981',
    badge: 'OPERATIONS LEAD',
  },
  {
    role: 'SHOPKEEPER',
    label: 'POS Shopkeeper',
    desc: 'High-speed barcode scanner checkout, cash register & receipt printing',
    icon: ShoppingBag,
    color: '#F59E0B',
    badge: 'POINT OF SALE',
  },
  {
    role: 'DELIVERY_BOY',
    label: 'Delivery Hero',
    desc: 'Turn-by-turn route navigation, OTP drop verification & parcel status',
    icon: Car,
    color: '#EC4899',
    badge: 'FIELD LOGISTICS',
  },
  {
    role: 'EMPLOYEE',
    label: 'Staff Member',
    desc: 'Facial punch clock, duty roster, salary slips & encrypted messaging',
    icon: Users,
    color: '#8B5CF6',
    badge: 'WORKFORCE',
  },
];

export const WelcomeScreen: React.FC = () => {
  const theme = useTheme();
  const c = theme.colors;
  const navigation = useNavigation<StackNavigationProp<AuthStackParamList, 'Welcome'>>();
  const { width, height } = useWindowDimensions();

  // Responsive breakpoints
  const isSmallDevice = width < 375;
  const isTablet = width >= 600;
  const horizontalPadding = isTablet ? 48 : isSmallDevice ? 16 : 22;
  const maxContentWidth = isTablet ? 560 : '100%';

  const [activeSlide, setActiveSlide] = useState(0);
  const [demoModalVisible, setDemoModalVisible] = useState(false);

  // Animation values
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroTranslate = useRef(new Animated.Value(28)).current;
  const logoScale = useRef(new Animated.Value(0.75)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const haloGlowAnim = useRef(new Animated.Value(0)).current;
  const buttonPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance cascade
    Animated.parallel([
      Animated.timing(heroFade, {
        toValue: 1,
        duration: 750,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(heroTranslate, {
        toValue: 0,
        duration: 750,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Floating Logo oscillation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Halo pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(haloGlowAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(haloGlowAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Button subtle breathing pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulse, {
          toValue: 1.02,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonPulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Automatic slide cycling
    const slideTimer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % ECOSYSTEM_FEATURES.length);
    }, 4500);

    return () => clearInterval(slideTimer);
  }, []);

  const handleSelectSlide = (idx: number) => {
    setActiveSlide(idx);
  };

  const handleQuickDemoLogin = (roleKey: string) => {
    setDemoModalVisible(false);
    navigation.navigate('Login');
  };

  const currentFeature = ECOSYSTEM_FEATURES[activeSlide];
  const FeatureIcon = currentFeature.icon;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* ── 1. Orbital Animated Ambient Background ────────────────── */}
      <WelcomeBackground
        width={width}
        height={height}
        isDark={theme.isDark}
        primary={c.primary}
        accent={c.accent}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding, maxWidth: maxContentWidth as any, alignSelf: 'center' },
        ]}
      >
        {/* ── 2. Top Status / Enterprise Clearance Bar ────────────── */}
        <Animated.View
          style={[
            styles.topStatusBar,
            {
              opacity: heroFade,
              transform: [{ translateY: heroTranslate }],
            },
          ]}
        >
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: theme.isDark ? '#0F172A' : '#EEF2FF',
                borderColor: theme.isDark ? 'rgba(99, 102, 241, 0.3)' : '#E0E7FF',
              },
            ]}
          >
            <View style={styles.liveDot} />
            <Text style={[styles.statusPillText, { color: c.primary }]}>
              ENTERPRISE GATEWAY ONLINE · v2.6.4
            </Text>
          </View>
        </Animated.View>

        {/* ── 3. Floating Hero Logo & Brand Identity ──────────────── */}
        <Animated.View
          style={[
            styles.heroBrandWrap,
            {
              opacity: heroFade,
              transform: [
                { translateY: heroTranslate },
                { translateY: floatAnim },
                { scale: logoScale },
              ],
            },
          ]}
        >
          <View
            style={[
              styles.logoHalo,
              {
                borderColor: c.primary,
                shadowColor: c.primary,
                backgroundColor: theme.isDark ? '#0B0F19' : '#FFFFFF',
              },
            ]}
          >
            <Image
              source={require('../../../assets/app_icon.png')}
              style={styles.logoImg}
              resizeMode="cover"
            />
          </View>
        </Animated.View>

        {/* ── 4. Main Headline & Tagline ──────────────────────────── */}
        <Animated.View
          style={[
            styles.heroTextWrap,
            {
              opacity: heroFade,
              transform: [{ translateY: heroTranslate }],
            },
          ]}
        >
          <Text style={[styles.brandName, { color: c.textPrimary }]}>
            SVK <Text style={{ color: c.primary }}>E-Com Pro</Text>
          </Text>
          <Text style={[styles.heroHeadline, { color: c.textPrimary }]}>
            Next-Gen Multi-Tenant Super App
          </Text>
          <Text style={[styles.heroSubheadline, { color: c.textMuted }]}>
            Unified Commerce, Intelligent Workforce, Fleet Mobility & Encrypted Workspace Command.
          </Text>
        </Animated.View>

        {/* ── 5. Interactive Ecosystem Capability Showcase Card ───── */}
        <Animated.View
          style={[
            styles.featureCardContainer,
            {
              opacity: heroFade,
              backgroundColor: theme.isDark ? '#0B0F19' : '#FFFFFF',
              borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
              shadowColor: currentFeature.accentColor,
            },
          ]}
        >
          {/* Card Header with Icon & Category Badge */}
          <View style={styles.cardHeaderRow}>
            <View
              style={[
                styles.featureIconBox,
                {
                  backgroundColor: theme.isDark
                    ? `${currentFeature.accentColor}25`
                    : `${currentFeature.accentColor}15`,
                  borderColor: currentFeature.accentColor,
                },
              ]}
            >
              <FeatureIcon size={24} color={currentFeature.accentColor} strokeWidth={2.2} />
            </View>

            <View style={styles.cardBadgeCol}>
              <View
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: theme.isDark ? '#1E293B' : '#EEF2FF',
                    borderColor: `${currentFeature.accentColor}60`,
                  },
                ]}
              >
                <Sparkles size={11} color={currentFeature.accentColor} style={{ marginRight: 4 }} />
                <Text style={[styles.categoryPillText, { color: currentFeature.accentColor }]}>
                  {currentFeature.badge}
                </Text>
              </View>
            </View>
          </View>

          {/* Feature Title & Description */}
          <Text style={[styles.featureCardTitle, { color: c.textPrimary }]}>
            {currentFeature.title}
          </Text>
          <Text style={[styles.featureCardDesc, { color: c.textMuted }]}>
            {currentFeature.desc}
          </Text>

          {/* Metric Highlight Tag */}
          <View style={[styles.metricTagRow, { backgroundColor: theme.isDark ? '#1E293B' : '#F8FAFC' }]}>
            <Activity size={13} color={currentFeature.accentColor} style={{ marginRight: 6 }} />
            <Text style={[styles.metricTagText, { color: c.textSecondary }]} numberOfLines={1}>
              {currentFeature.metrics}
            </Text>
          </View>

          {/* Pagination Indicators */}
          <View style={styles.paginationRow}>
            {ECOSYSTEM_FEATURES.map((item, idx) => {
              const isSelected = activeSlide === idx;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleSelectSlide(idx)}
                  style={[
                    styles.pageDot,
                    {
                      backgroundColor: isSelected
                        ? currentFeature.accentColor
                        : theme.isDark
                        ? '#334155'
                        : '#CBD5E1',
                      width: isSelected ? 26 : 8,
                    },
                  ]}
                  activeOpacity={0.7}
                />
              );
            })}
          </View>
        </Animated.View>

        {/* ── 6. Primary Action Buttons & Direct Entry ─────────────── */}
        <Animated.View
          style={[
            styles.actionButtonsWrap,
            {
              opacity: heroFade,
              transform: [{ scale: buttonPulse }],
            },
          ]}
        >
          {/* Main Sign In CTA */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={[styles.primaryCtaBtn, { backgroundColor: c.primary, shadowColor: c.primary }]}
            activeOpacity={0.85}
          >
            <View style={styles.primaryCtaInner}>
              <Text style={styles.primaryCtaText}>Sign In to Workspace</Text>
              <View style={styles.primaryCtaArrow}>
                <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Secondary Quick Role Demo Launcher */}
          <TouchableOpacity
            onPress={() => setDemoModalVisible(true)}
            style={[
              styles.secondaryCtaBtn,
              {
                backgroundColor: theme.isDark ? '#0F172A' : '#F8FAFC',
                borderColor: theme.isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
            activeOpacity={0.8}
          >
            <Zap size={15} color={c.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.secondaryCtaText, { color: c.textPrimary }]}>
              Explore Enterprise Roles & Quick Demo
            </Text>
            <ChevronRight size={16} color={c.textMuted} />
          </TouchableOpacity>
        </Animated.View>

        {/* ── 7. System Infrastructure Health Live Ticker ──────────── */}
        <View
          style={[
            styles.infraTickerBox,
            {
              backgroundColor: theme.isDark ? '#0F172A' : '#EEF2FF',
              borderColor: theme.isDark ? '#1E293B' : '#E0E7FF',
            },
          ]}
        >
          <View style={styles.infraRow}>
            <View style={styles.infraCol}>
              <Server size={12} color={c.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.infraText, { color: c.textSecondary }]}>55+ APIs Active</Text>
            </View>
            <View style={styles.infraDot} />
            <View style={styles.infraCol}>
              <Radio size={12} color="#10B981" style={{ marginRight: 4 }} />
              <Text style={[styles.infraText, { color: c.textSecondary }]}>Ping &lt; 12ms</Text>
            </View>
            <View style={styles.infraDot} />
            <View style={styles.infraCol}>
              <Lock size={12} color="#F59E0B" style={{ marginRight: 4 }} />
              <Text style={[styles.infraText, { color: c.textSecondary }]}>E2EE TLS 1.3</Text>
            </View>
          </View>
        </View>

        {/* ── 8. Footer Security & Compliance Assurance ────────────── */}
        <View style={styles.footerNoteWrap}>
          <ShieldCheck size={14} color={c.success} style={{ marginRight: 6 }} />
          <Text style={[styles.footerNoteText, { color: c.textMuted }]}>
            Protected by End-to-End AES 256-bit Security & RBAC Isolation
          </Text>
        </View>
      </ScrollView>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── QUICK DEMO ROLE BOTTOM SHEET MODAL ─────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={demoModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDemoModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.demoModalSheet,
              {
                backgroundColor: theme.isDark ? '#0B0F19' : '#FFFFFF',
                borderColor: theme.isDark ? '#1E293B' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.modalHeaderTop}>
              <View style={[styles.modalIndicatorBar, { backgroundColor: c.borderStrong }]} />
              <View style={styles.modalTitleRow}>
                <View>
                  <Text style={[styles.demoModalTitle, { color: c.textPrimary }]}>
                    Enterprise Role Hub
                  </Text>
                  <Text style={[styles.demoModalSubtitle, { color: c.textMuted }]}>
                    Select a persona to explore dedicated interfaces
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setDemoModalVisible(false)}
                  style={[styles.closeModalBtn, { backgroundColor: theme.isDark ? '#1E293B' : '#F1F5F9' }]}
                >
                  <X size={18} color={c.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.demoListContent}>
              {DEMO_ROLES.map((item) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={item.role}
                    onPress={() => handleQuickDemoLogin(item.role)}
                    style={[
                      styles.demoRoleCard,
                      {
                        backgroundColor: theme.isDark ? '#111827' : '#F8FAFC',
                        borderColor: theme.isDark ? '#1F2937' : '#E2E8F0',
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.demoRoleIconBox,
                        {
                          backgroundColor: `${item.color}18`,
                          borderColor: item.color,
                        },
                      ]}
                    >
                      <Icon size={20} color={item.color} strokeWidth={2.2} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={styles.roleHeaderRow}>
                        <Text style={[styles.demoRoleTitle, { color: c.textPrimary }]}>
                          {item.label}
                        </Text>
                        <View style={[styles.roleBadgeBox, { backgroundColor: `${item.color}18`, borderColor: `${item.color}40` }]}>
                          <Text style={[styles.roleBadgeText, { color: item.color }]}>
                            {item.badge}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.demoRoleDesc, { color: c.textMuted }]}>
                        {item.desc}
                      </Text>
                    </View>
                    <ArrowRight size={16} color={item.color} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 40,
    paddingBottom: 36,
    alignItems: 'center',
    width: '100%',
  },
  topStatusBar: {
    marginBottom: 16,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroBrandWrap: {
    marginBottom: 16,
  },
  logoHalo: {
    width: 88,
    height: 88,
    borderRadius: 26,
    borderWidth: 2,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  logoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  heroTextWrap: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  brandName: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  heroHeadline: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: 'center',
  },
  heroSubheadline: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 340,
  },
  featureCardContainer: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  featureIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBadgeCol: {
    alignItems: 'flex-end',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  featureCardTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  featureCardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  metricTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  metricTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pageDot: {
    height: 7,
    borderRadius: 4,
  },
  actionButtonsWrap: {
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  primaryCtaBtn: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 18,
    elevation: 6,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  primaryCtaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  primaryCtaArrow: {
    marginLeft: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryCtaBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  secondaryCtaText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  infraTickerBox: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  infraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  infraCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infraText: {
    fontSize: 11,
    fontWeight: '700',
  },
  infraDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#94A3B8',
  },
  footerNoteWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  footerNoteText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  demoModalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    maxHeight: '85%',
  },
  modalHeaderTop: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
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
  demoModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  demoModalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoListContent: {
    padding: 20,
    paddingTop: 4,
    gap: 10,
  },
  demoRoleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  demoRoleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  demoRoleTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  roleBadgeBox: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.8,
  },
  roleBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  demoRoleDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
});
