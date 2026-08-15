import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import {
  Crown,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  User,
  Camera,
  Mail,
  Phone,
  FileText,
  Briefcase,
  BadgeCheck,
  ShieldAlert,
  Building2,
  MapPin,
  Zap,
  Clock,
  Check,
} from 'lucide-react-native';
import { useTheme } from '../../../theme/theme';
import { calculateProfileCompletion, CompletionStep } from '../utils/profileCompletion';
import { UserProfile } from '../../../store/authStore';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProfileCompletionWidgetProps {
  user: Partial<UserProfile> | null | undefined;
  onEditSection?: (sectionKey?: string) => void;
  style?: any;
}

export const ProfileCompletionWidget: React.FC<ProfileCompletionWidgetProps> = ({
  user,
  onEditSection,
  style,
}) => {
  const theme = useTheme();
  const c = theme.colors;
  const { width } = useWindowDimensions();
  const [isExpanded, setIsExpanded] = useState(true);
  const [filterTab, setFilterTab] = useState<'pending' | 'all' | 'completed'>('pending');

  const completion = calculateProfileCompletion(user);
  const { score, level, steps, completedCount, totalCount, nextStep } = completion;
  const pendingCount = totalCount - completedCount;

  // Animation values
  const animatedScore = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pendingGlow = useRef(new Animated.Value(0.4)).current;
  const [displayScore, setDisplayScore] = useState(score);

  useEffect(() => {
    // Animate progress smoothly
    Animated.timing(animatedScore, {
      toValue: score,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Pulse animation for high tiers
    if (score >= 75) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // Glowing animation for pending items
    Animated.loop(
      Animated.sequence([
        Animated.timing(pendingGlow, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pendingGlow, {
          toValue: 0.4,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Number ticker listener
    const id = animatedScore.addListener((v) => {
      setDisplayScore(Math.round(v.value));
    });

    return () => {
      animatedScore.removeListener(id);
    };
  }, [score]);

  // Filtered steps list
  const filteredSteps = useMemo(() => {
    if (filterTab === 'pending') {
      const p = steps.filter((s) => !s.isCompleted);
      return p.length > 0 ? p : steps;
    }
    if (filterTab === 'completed') {
      return steps.filter((s) => s.isCompleted);
    }
    return steps;
  }, [steps, filterTab]);

  // Circular gauge dimensions
  const size = 96;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = animatedScore.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  const getStepIcon = (iconName: string, isDone: boolean) => {
    const iconColor = isDone ? c.success : c.textMuted;
    const iconSize = 15;
    switch (iconName) {
      case 'User': return <User size={iconSize} color={iconColor} />;
      case 'Camera': return <Camera size={iconSize} color={iconColor} />;
      case 'Mail': return <Mail size={iconSize} color={iconColor} />;
      case 'Phone': return <Phone size={iconSize} color={iconColor} />;
      case 'FileText': return <FileText size={iconSize} color={iconColor} />;
      case 'Briefcase': return <Briefcase size={iconSize} color={iconColor} />;
      case 'BadgeCheck': return <BadgeCheck size={iconSize} color={iconColor} />;
      case 'ShieldAlert': return <ShieldAlert size={iconSize} color={isDone ? c.success : '#F59E0B'} />;
      case 'Building2': return <Building2 size={iconSize} color={iconColor} />;
      case 'MapPin': return <MapPin size={iconSize} color={iconColor} />;
      default: return <Sparkles size={iconSize} color={iconColor} />;
    }
  };

  const isComplete = score === 100;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.isDark ? '#0F172A' : '#FFFFFF',
          borderColor: isComplete
            ? 'rgba(16, 185, 129, 0.4)'
            : theme.isDark
            ? '#1E293B'
            : '#E2E8F0',
          shadowColor: isComplete ? '#10B981' : level.color,
        },
        style,
      ]}
    >
      {/* Top Header Row with Circle Meter & Tier Info */}
      <View style={styles.headerRow}>
        {/* Left: Animated Progress Circular Ring */}
        <Animated.View style={[styles.gaugeWrapper, { transform: [{ scale: isComplete ? pulseAnim : 1 }] }]}>
          <Svg width={size} height={size}>
            <Defs>
              <LinearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={level.color} />
                <Stop offset="100%" stopColor={isComplete ? '#34D399' : '#818CF8'} />
              </LinearGradient>
            </Defs>
            {/* Background Track Circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Animated Gradient Fill Circle */}
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#progressGrad)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />
          </Svg>
          {/* Centered Score Label */}
          <View style={styles.gaugeInnerContent}>
            <Text style={[styles.gaugeScoreText, { color: c.textPrimary }]}>
              {displayScore}%
            </Text>
            <Text style={[styles.gaugeSubText, { color: level.color }]}>
              {isComplete ? 'VERIFIED' : 'DONE'}
            </Text>
          </View>
        </Animated.View>

        {/* Right: Tier Badge, Info & Next Step CTA */}
        <View style={styles.headerInfoCol}>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.tierBadge,
                {
                  backgroundColor: theme.isDark
                    ? `${level.color}25`
                    : `${level.color}15`,
                  borderColor: level.color,
                },
              ]}
            >
              {isComplete ? (
                <Crown size={13} color={level.color} strokeWidth={2.5} style={{ marginRight: 4 }} />
              ) : (
                <Zap size={13} color={level.color} strokeWidth={2.5} style={{ marginRight: 4 }} />
              )}
              <Text style={[styles.tierBadgeText, { color: level.color }]}>
                {level.badge}
              </Text>
            </View>
            <Text style={[styles.stepCounterText, { color: c.textMuted }]}>
              {completedCount}/{totalCount} Done
            </Text>
          </View>

          <Text style={[styles.levelTitle, { color: c.textPrimary }]} numberOfLines={1}>
            {level.title}
          </Text>
          <Text style={[styles.levelDesc, { color: c.textMuted }]} numberOfLines={2}>
            {level.description}
          </Text>

          {/* Next Action Milestone Recommendation */}
          {!isComplete && nextStep && (
            <TouchableOpacity
              onPress={() => onEditSection?.(nextStep.key)}
              style={[styles.nextActionBtn, { backgroundColor: theme.isDark ? '#1E293B' : '#EEF2FF' }]}
              activeOpacity={0.75}
            >
              <Sparkles size={12} color={c.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.nextActionText, { color: c.primary }]}>
                +{nextStep.weight}% {nextStep.label}
              </Text>
              <ArrowRight size={12} color={c.primary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Linear Micro Bar */}
      <View style={[styles.linearBarBg, { backgroundColor: theme.isDark ? '#1E293B' : '#F1F5F9' }]}>
        <Animated.View
          style={[
            styles.linearBarFill,
            {
              backgroundColor: level.color,
              width: animatedScore.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* ── Pending Verification Alert Banner (If pending > 0) ── */}
      {!isComplete && (
        <View
          style={[
            styles.pendingAlertBanner,
            {
              backgroundColor: theme.isDark ? '#1E293B' : '#FFFBEB',
              borderColor: theme.isDark ? '#D9770640' : '#FDE68A',
            },
          ]}
        >
          <Animated.View style={{ opacity: pendingGlow }}>
            <Clock size={16} color="#F59E0B" style={{ marginRight: 8 }} />
          </Animated.View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pendingAlertTitle, { color: theme.isDark ? '#FBBF24' : '#92400E' }]}>
              {pendingCount} Action Items Pending
            </Text>
            <Text style={[styles.pendingAlertDesc, { color: theme.isDark ? '#CBD5E1' : '#B45309' }]}>
              Complete remaining details to achieve 100% Master Executive status.
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => onEditSection?.(nextStep?.key)}
            style={[styles.completeNowPill, { backgroundColor: '#F59E0B' }]}
            activeOpacity={0.8}
          >
            <Text style={styles.completeNowText}>Complete</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Segmented Control Tabs */}
      <View style={styles.filterTabsRow}>
        {[
          { id: 'pending', label: `Pending (${pendingCount})` },
          { id: 'all', label: `All (${totalCount})` },
          { id: 'completed', label: `Verified (${completedCount})` },
        ].map((tab) => {
          const isActive = filterTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setFilterTab(tab.id as any)}
              style={[
                styles.filterTabBtn,
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
                  styles.filterTabBtnText,
                  {
                    color: isActive ? '#FFFFFF' : c.textSecondary,
                    fontWeight: isActive ? '800' : '600',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Expand/Collapse Checklist Toggle */}
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        style={[styles.toggleBtn, { borderTopColor: theme.isDark ? '#1E293B' : '#F1F5F9' }]}
        activeOpacity={0.7}
      >
        <Text style={[styles.toggleBtnText, { color: c.textSecondary }]}>
          {isExpanded ? 'Hide Detailed Roadmap' : 'Show Detailed Roadmap'}
        </Text>
        {isExpanded ? (
          <ChevronUp size={16} color={c.textSecondary} />
        ) : (
          <ChevronDown size={16} color={c.textSecondary} />
        )}
      </TouchableOpacity>

      {/* Expandable Checklist Details */}
      {isExpanded && (
        <View style={styles.checklistContainer}>
          {filteredSteps.map((step) => {
            return (
              <TouchableOpacity
                key={step.key}
                onPress={() => !step.isCompleted && onEditSection?.(step.key)}
                style={[
                  styles.checklistItemRow,
                  {
                    backgroundColor: step.isCompleted
                      ? theme.isDark
                        ? '#132035'
                        : '#F0FDF4'
                      : theme.isDark
                      ? '#1E293B'
                      : '#FFFBEB',
                    borderColor: step.isCompleted
                      ? theme.isDark
                        ? '#10B98130'
                        : '#BBF7D0'
                      : theme.isDark
                      ? '#F59E0B40'
                      : '#FDE68A',
                  },
                ]}
                activeOpacity={step.isCompleted ? 1 : 0.75}
              >
                <View style={styles.checklistLeftCol}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: step.isCompleted
                          ? theme.isDark
                            ? '#064E3B'
                            : '#DCFCE7'
                          : theme.isDark
                          ? '#0F172A'
                          : '#FEF3C7',
                      },
                    ]}
                  >
                    {getStepIcon(step.iconName, step.isCompleted)}
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={styles.stepTitleRow}>
                      <Text
                        style={[
                          styles.stepLabelText,
                          {
                            color: step.isCompleted ? c.textPrimary : c.textPrimary,
                            textDecorationLine: step.isCompleted ? 'line-through' : 'none',
                            opacity: step.isCompleted ? 0.75 : 1,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {step.label}
                      </Text>
                      {!step.isCompleted && (
                        <View style={styles.pendingMiniTag}>
                          <Text style={styles.pendingMiniTagText}>PENDING</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.stepHintText, { color: c.textMuted }]} numberOfLines={1}>
                      {step.isCompleted ? 'Verified in active session' : step.actionHint}
                    </Text>
                  </View>
                </View>

                {/* Right: Status Pill or Weight Tag */}
                {step.isCompleted ? (
                  <View style={[styles.donePill, { backgroundColor: '#10B98115' }]}>
                    <CheckCircle2 size={12} color="#10B981" style={{ marginRight: 3 }} />
                    <Text style={styles.donePillText}>Done</Text>
                  </View>
                ) : (
                  <View style={[styles.addPill, { backgroundColor: c.primaryLight, borderColor: c.primary }]}>
                    <Text style={[styles.addPillText, { color: c.primary }]}>+{step.weight}% Add</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gaugeWrapper: {
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gaugeInnerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugeScoreText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  gaugeSubText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: -2,
  },
  headerInfoCol: {
    flex: 1,
    marginLeft: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  stepCounterText: {
    fontSize: 11,
    fontWeight: '600',
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  levelDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  nextActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  nextActionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  linearBarBg: {
    height: 4,
    borderRadius: 2,
    marginTop: 14,
    overflow: 'hidden',
  },
  linearBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  pendingAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
  },
  pendingAlertTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  pendingAlertDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  completeNowPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 8,
  },
  completeNowText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  filterTabBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  filterTabBtnText: {
    fontSize: 11,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  checklistContainer: {
    marginTop: 12,
    gap: 8,
  },
  checklistItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  checklistLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepLabelText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pendingMiniTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: '#F59E0B25',
  },
  pendingMiniTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#D97706',
  },
  stepHintText: {
    fontSize: 11,
    marginTop: 1,
  },
  donePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  donePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  addPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  addPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
