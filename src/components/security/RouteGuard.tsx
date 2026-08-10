import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ActionPermissionResolver, SystemPermissionAction } from '../../security/actionPermissionResolver';
import { useTheme } from '../../theme/theme';
import { ShieldAlert, ArrowLeft } from 'lucide-react-native';

interface RouteGuardProps {
  permission: SystemPermissionAction;
  children: React.ReactNode;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({ permission, children }) => {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const isAllowed = ActionPermissionResolver.can(permission);

  const c = theme.colors;

  if (!isAllowed) {
    return (
      <View style={[styles.forbiddenContainer, { backgroundColor: c.background }]}>
        <View style={[styles.iconBox, { backgroundColor: c.errorLight }]}>
          <ShieldAlert size={36} color={c.error} />
        </View>
        <Text style={[styles.forbiddenTitle, { color: c.textPrimary }]}>Access Denied (403)</Text>
        <Text style={[styles.forbiddenSub, { color: c.textMuted }]}>
          Your current role account does not possess authorized security clearance to access this module ({permission}).
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: c.primary }]}
          activeOpacity={0.8}
        >
          <ArrowLeft size={16} color="#FFFFFF" />
          <Text style={styles.backBtnText}>Return to Previous Screen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  forbiddenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    textAlign: 'center',
  },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  forbiddenTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  forbiddenSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 8,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
