import React, { useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, StyleProp, Animated } from 'react-native';
import { useTheme } from '../../theme/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'outlined' | 'flat';
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = 'default',
}) => {
  const theme = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 80,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: theme.colors.card,
          borderWidth: 1,
          borderColor: theme.colors.border,
        };
      case 'flat':
        return {
          backgroundColor: theme.colors.surfaceSecondary,
        };
      default:
        return {
          backgroundColor: theme.colors.card,
          borderWidth: 1,
          borderColor: theme.colors.border,
          elevation: 3,
          shadowColor: theme.colors.shadowColor,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.07,
          shadowRadius: 12,
        };
    }
  };

  const innerStyle = [
    styles.card,
    { borderRadius: 20 },
    getVariantStyles(),
  ];

  if (onPress) {
    return (
      // style (e.g. flex:1, margin) goes on Animated.View to affect layout correctly
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        <TouchableOpacity
          style={innerStyle}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Non-pressable: apply style directly to outer View
  return <View style={[innerStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginVertical: 6,
  },
});
