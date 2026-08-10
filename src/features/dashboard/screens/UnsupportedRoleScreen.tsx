import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Header } from '../../../components/common/Header';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { useAuthStore } from '../../../store/authStore';
import { ShieldAlert, LogOut } from 'lucide-react-native';
import { useTheme } from '../../../theme/theme';

export const UnsupportedRoleScreen: React.FC = () => {
  const theme = useTheme();
  const { user, logout } = useAuthStore();

  return (
    <ScreenContainer scrollable={false} contentContainerStyle={styles.container}>
      <Header title="Unauthorized Access" />

      <View style={styles.content}>
        <View style={[styles.iconBox, { backgroundColor: theme.colors.errorLight }]}>
          <ShieldAlert size={48} color={theme.colors.error} />
        </View>

        <Text style={[theme.typography.h2, { color: theme.colors.textPrimary, marginTop: 16 }]}>
          Unsupported User Role
        </Text>

        <Text style={[theme.typography.body1, { color: theme.colors.textSecondary, textAlign: 'center', marginVertical: 8 }]}>
          Your authenticated user account has a role of "{user?.userType || 'Unknown'}".
        </Text>

        <Text style={[theme.typography.caption, { color: theme.colors.textMuted, textAlign: 'center', marginBottom: 24 }]}>
          This mobile application requires a valid enterprise role (Super_Admin, Admin, Branch, Branch_Manager, Employee, Shopkeeper, or Delivery_Boy).
        </Text>

        <PrimaryButton
          title="Return to Login"
          onPress={logout}
          icon={<LogOut size={18} color="#FFFFFF" />}
          variant="danger"
          style={styles.btn}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    paddingBottom: 40,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconBox: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn: {
    minWidth: 200,
  },
});
