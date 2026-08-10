import React from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/theme';
import { OfflineBanner } from './OfflineBanner';

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  isOffline?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = true,
  refreshing = false,
  onRefresh,
  isOffline = false,
  style,
  contentContainerStyle,
}) => {
  const theme = useTheme();

  const containerStyle = [
    styles.container,
    { backgroundColor: theme.colors.background },
    style,
  ];

  return (
    <SafeAreaView style={containerStyle} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar
        barStyle={theme.colors.statusBarStyle}
        backgroundColor={theme.colors.background}
        translucent={false}
      />
      <OfflineBanner isOffline={isOffline} />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scrollable ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            overScrollMode="never"
            decelerationRate="normal"
            removeClippedSubviews={Platform.OS === 'android'}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={theme.colors.primary}
                  colors={[theme.colors.primary]}
                />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.nonScrollContent, contentContainerStyle]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 115,
  },
  nonScrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
});
