import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useTheme } from '../../theme/theme';

interface OfflineBannerProps {
  isOffline: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOffline }) => {
  const theme = useTheme();

  if (!isOffline) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.error }]}>
      <WifiOff size={16} color="#FFFFFF" style={styles.icon} />
      <Text style={styles.text}>You are currently offline. Displaying cached data.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
