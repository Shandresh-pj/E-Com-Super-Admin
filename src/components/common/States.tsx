import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Inbox, AlertTriangle, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../theme/theme';
import { PrimaryButton } from '../buttons/PrimaryButton';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Available',
  description = 'There are no records to display at this moment.',
  onRetry,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconBox, { backgroundColor: theme.colors.surfaceSecondary }]}>
        <Inbox size={36} color={theme.colors.textMuted} />
      </View>
      <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginTop: 12 }]}>
        {title}
      </Text>
      <Text style={[theme.typography.body2, { color: theme.colors.textMuted, textAlign: 'center', marginVertical: 6 }]}>
        {description}
      </Text>
      {onRetry && (
        <PrimaryButton
          title="Refresh Data"
          onPress={onRetry}
          variant="outline"
          icon={<RefreshCw size={16} color={theme.colors.primary} />}
          style={styles.btn}
        />
      )}
    </View>
  );
};

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something Went Wrong',
  message = 'Failed to load data from the server. Please check your network connection and try again.',
  onRetry,
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.iconBox, { backgroundColor: theme.colors.errorLight }]}>
        <AlertTriangle size={36} color={theme.colors.error} />
      </View>
      <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginTop: 12 }]}>
        {title}
      </Text>
      <Text style={[theme.typography.body2, { color: theme.colors.textSecondary, textAlign: 'center', marginVertical: 6 }]}>
        {message}
      </Text>
      <PrimaryButton
        title="Retry"
        onPress={onRetry}
        icon={<RefreshCw size={16} color="#FFFFFF" />}
        style={styles.btn}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginVertical: 24,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn: {
    marginTop: 12,
    minWidth: 140,
  },
});
