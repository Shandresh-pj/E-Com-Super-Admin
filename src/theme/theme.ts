import { useColorScheme } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { lightColors, darkColors, ThemeColors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import { shadows } from './shadows';

export interface AppTheme {
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
  isDark: boolean;
}

export const useTheme = (): AppTheme => {
  const systemColorScheme = useColorScheme();
  const themeMode = useThemeStore((state) => state.mode);

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

  const colors = isDark ? darkColors : lightColors;

  return {
    colors,
    typography,
    spacing,
    radius,
    shadows,
    isDark,
  };
};
