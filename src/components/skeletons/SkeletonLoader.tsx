import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/theme';

interface SkeletonLoaderProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.surfaceTertiary,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        <SkeletonLoader height={100} style={styles.card} />
        <SkeletonLoader height={100} style={styles.card} />
      </View>
      <View style={styles.grid}>
        <SkeletonLoader height={100} style={styles.card} />
        <SkeletonLoader height={100} style={styles.card} />
      </View>
      <SkeletonLoader height={180} style={{ marginVertical: 12 }} />
      <SkeletonLoader height={60} style={{ marginVertical: 6 }} />
      <SkeletonLoader height={60} style={{ marginVertical: 6 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    marginVertical: 4,
  },
  container: {
    paddingVertical: 12,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  card: {
    flex: 1,
    marginHorizontal: 4,
    marginVertical: 6,
  },
});
