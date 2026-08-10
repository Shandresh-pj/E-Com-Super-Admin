import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useTheme } from '../theme/theme';
import { SplashScreen } from './SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { RoleNavigator } from './RoleNavigator';

export const RootNavigator: React.FC = () => {
  const theme = useTheme();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  // Single authoritative initialization — runs ONCE on mount
  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      try {
        await useThemeStore.getState().loadSavedTheme();
        await useAuthStore.getState().initializeSession();
      } catch (err) {
        console.warn('[RootNavigator] init error:', err);
        useAuthStore.setState({ isLoading: false });
      } finally {
        if (!cancelled) {
          setIsInitialized(true);
        }
      }
    };

    initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  // Build navigation theme from design tokens
  const navTheme = {
    ...(theme.isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.textPrimary,
      border: theme.colors.border,
      primary: theme.colors.primary,
    },
  };

  // Still bootstrapping — show splash outside NavigationContainer
  if (!isInitialized || isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      {isAuthenticated ? <RoleNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
