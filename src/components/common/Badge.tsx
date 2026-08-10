import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/theme';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
}) => {
  const theme = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: theme.colors.successLight, text: theme.colors.success };
      case 'warning':
        return { bg: theme.colors.warningLight, text: theme.colors.warning };
      case 'error':
        return { bg: theme.colors.errorLight, text: theme.colors.error };
      case 'neutral':
        return { bg: theme.colors.surfaceSecondary, text: theme.colors.textSecondary };
      default:
        return { bg: theme.colors.primaryLight, text: theme.colors.primary };
    }
  };

  const colors = getColors();
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          paddingHorizontal: isSmall ? 6 : 10,
          paddingVertical: isSmall ? 2 : 4,
          borderRadius: theme.radius.full,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: colors.text,
            fontSize: isSmall ? 10 : 12,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
