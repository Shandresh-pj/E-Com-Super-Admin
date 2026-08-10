import { StatusBarStyle } from 'react-native';

export const lightColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  surfaceTertiary: '#E2E8F0',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',

  primary: '#4338CA',        // Indigo Supreme
  primaryDark: '#3730A3',
  primaryLight: '#EEF2FF',

  accent: '#7C3AED',         // Electric Violet
  accentLight: '#F5F3FF',

  gold: '#D97706',           // Luxury Gold
  goldLight: '#FFFBEB',

  cyan: '#0891B2',           // Electric Cyan
  cyanLight: '#ECFEFF',

  success: '#059669',        // Emerald Green
  successLight: '#ECFDF5',

  warning: '#D97706',        // Amber
  warningLight: '#FFFBEB',

  error: '#DC2626',          // Crimson Red
  errorLight: '#FEF2F2',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  card: '#FFFFFF',
  cardHover: '#F8FAFC',
  shadowColor: '#0F172A',
  statusBarStyle: 'dark-content' as StatusBarStyle,
};

export const darkColors: typeof lightColors = {
  background: '#07090E',
  surface: '#0F172A',
  surfaceSecondary: '#1E293B',
  surfaceTertiary: '#334155',
  border: '#1E293B',
  borderStrong: '#334155',

  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: 'rgba(99, 102, 241, 0.15)',

  accent: '#A855F7',
  accentLight: 'rgba(168, 85, 247, 0.15)',

  gold: '#F59E0B',
  goldLight: 'rgba(245, 158, 11, 0.15)',

  cyan: '#06B6D4',
  cyanLight: 'rgba(6, 182, 212, 0.15)',

  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.15)',

  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.15)',

  error: '#EF4444',
  errorLight: 'rgba(239, 68, 68, 0.15)',

  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0F172A',

  card: '#0F172A',
  cardHover: '#1E293B',
  shadowColor: '#000000',
  statusBarStyle: 'light-content' as StatusBarStyle,
};

export type ThemeColors = typeof lightColors;
