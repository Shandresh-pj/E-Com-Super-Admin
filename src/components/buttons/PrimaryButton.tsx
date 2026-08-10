import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
  View,
} from 'react-native';
import { useTheme } from '../../theme/theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
  variant = 'primary',
  style,
  textStyle,
}) => {
  const theme = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 0.96, tension: 120, friction: 8, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0.85, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const getVariantStyles = () => {
    if (disabled) {
      return {
        bg: theme.colors.surfaceTertiary,
        text: theme.colors.textMuted,
        border: 'transparent',
      };
    }
    switch (variant) {
      case 'secondary':
        return { bg: theme.colors.accent, text: '#FFFFFF', border: 'transparent' };
      case 'danger':
        return { bg: theme.colors.error, text: '#FFFFFF', border: 'transparent' };
      case 'outline':
        return { bg: 'transparent', text: theme.colors.primary, border: theme.colors.primary };
      default:
        return { bg: theme.colors.primary, text: '#FFFFFF', border: 'transparent' };
    }
  };

  const vColors = getVariantStyles();

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        style,
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: vColors.bg,
            borderColor: vColors.border,
            borderWidth: variant === 'outline' ? 1.5 : 0,
            borderRadius: 16,
            elevation: disabled ? 0 : 6,
            shadowColor: disabled ? 'transparent' : theme.colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: disabled ? 0 : 0.28,
            shadowRadius: 10,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
      >
        {loading ? (
          <ActivityIndicator color={vColors.text} size="small" />
        ) : (
          <View style={styles.inner}>
            {icon && <View style={styles.iconWrap}>{icon}</View>}
            <Text style={[styles.label, { color: vColors.text }, textStyle]}>{title}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    marginRight: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
