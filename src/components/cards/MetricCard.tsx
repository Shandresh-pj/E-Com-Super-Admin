import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Card } from '../common/Card';
import { useTheme } from '../../theme/theme';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react-native';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
  subtitle?: string;
  delay?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  icon,
  subtitle,
  delay = 0,
}) => {
  const theme = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Card style={[styles.card, { marginVertical: 0 }]}>
        {/* Top row */}
        <View style={styles.header}>
          <Text
            style={[styles.titleText, { color: theme.colors.textMuted }]}
            numberOfLines={1}
          >
            {title.toUpperCase()}
          </Text>
          {icon && (
            <View style={[styles.iconBox, { backgroundColor: theme.colors.primaryLight }]}>
              {icon}
            </View>
          )}
        </View>

        {/* Value */}
        <Text style={[styles.valueText, { color: theme.colors.textPrimary }]}>
          {value}
        </Text>

        {/* Change badge */}
        {(change || subtitle) && (
          <View style={styles.footer}>
            {change && (
              <View
                style={[
                  styles.changeBadge,
                  {
                    backgroundColor: isPositive
                      ? theme.colors.successLight
                      : theme.colors.errorLight,
                  },
                ]}
              >
                {isPositive ? (
                  <ArrowUpRight size={12} color={theme.colors.success} />
                ) : (
                  <ArrowDownRight size={12} color={theme.colors.error} />
                )}
                <Text
                  style={[
                    styles.changeText,
                    { color: isPositive ? theme.colors.success : theme.colors.error },
                  ]}
                >
                  {change}
                </Text>
              </View>
            )}
            {subtitle && (
              <Text style={[styles.subtitleText, { color: theme.colors.textMuted }]}>
                {subtitle}
              </Text>
            )}
          </View>
        )}

        {/* Subtle bottom accent line */}
        <View
          style={[
            styles.accentLine,
            {
              backgroundColor: isPositive
                ? theme.colors.success
                : theme.colors.primary,
              opacity: 0.18,
            },
          ]}
        />
      </Card>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    minWidth: 150,
    margin: 5,
  },
  card: {
    padding: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titleText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    flex: 1,
    marginRight: 6,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 2,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subtitleText: {
    fontSize: 11,
  },
  accentLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
  },
});
