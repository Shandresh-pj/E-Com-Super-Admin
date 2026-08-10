import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { PermissionService, PermissionStatus } from '../../security/permissionService';
import { useTheme } from '../../theme/theme';
import { ShieldCheck, Camera, Bell, MapPin, CheckCircle2, ArrowRight } from 'lucide-react-native';

interface PermissionsOnboardingModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export const PermissionsOnboardingModal: React.FC<PermissionsOnboardingModalProps> = ({
  visible,
  onDismiss,
}) => {
  const theme = useTheme();
  const [status, setStatus] = useState<PermissionStatus>({
    camera: false,
    notifications: false,
    location: false,
  });
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (visible) {
      checkCurrentStatus();
    }
  }, [visible]);

  const checkCurrentStatus = async () => {
    const curr = await PermissionService.checkAllPermissions();
    setStatus(curr);
  };

  const handleGrantAll = async () => {
    setRequesting(true);
    try {
      const updated = await PermissionService.requestAllEssentialPermissions();
      setStatus(updated);

      if (updated.camera && updated.notifications && updated.location) {
        Alert.alert('Permissions Granted', 'All essential system permissions have been authorized.');
        onDismiss();
      } else {
        Alert.alert(
          'Partial Permissions Granted',
          'Some permissions were declined. You can grant remaining permissions anytime from Profile settings.'
        );
        onDismiss();
      }
    } catch (err) {
      console.warn('Grant all permissions error:', err);
    } finally {
      setRequesting(false);
    }
  };

  const c = theme.colors;
  const isAllGranted = status.camera && status.notifications && status.location;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onDismiss}>
      <View style={styles.modalOverlay}>
        <View style={[styles.sheetSurface, { backgroundColor: theme.isDark ? c.surface : '#FFFFFF', borderColor: c.border }]}>
          <View style={styles.headerBox}>
            <View style={[styles.iconRing, { backgroundColor: c.primaryLight }]}>
              <ShieldCheck size={32} color={c.primary} />
            </View>
            <Text style={[styles.title, { color: c.textPrimary }]}>Device Permissions Required</Text>
            <Text style={[styles.subtitle, { color: c.textMuted }]}>
              To enable barcode scanning, real-time alerts, and GPS tracking, please allow device permissions.
            </Text>
          </View>

          <View style={styles.itemsList}>
            {/* 1. Camera */}
            <View style={[styles.itemRow, { backgroundColor: theme.isDark ? c.surfaceSecondary : '#F8FAFC', borderColor: c.border }]}>
              <View style={[styles.itemIcon, { backgroundColor: c.primaryLight }]}>
                <Camera size={18} color={c.primary} />
              </View>
              <View style={styles.itemMeta}>
                <Text style={[styles.itemTitle, { color: c.textPrimary }]}>Camera Access</Text>
                <Text style={[styles.itemDesc, { color: c.textMuted }]}>Barcode scanning & product media photo uploads</Text>
              </View>
              {status.camera ? (
                <CheckCircle2 size={20} color={c.success} />
              ) : (
                <TouchableOpacity onPress={() => PermissionService.requestCamera().then(checkCurrentStatus)}>
                  <Text style={[styles.allowText, { color: c.primary }]}>Allow</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 2. Notifications */}
            <View style={[styles.itemRow, { backgroundColor: theme.isDark ? c.surfaceSecondary : '#F8FAFC', borderColor: c.border }]}>
              <View style={[styles.itemIcon, { backgroundColor: c.accentLight }]}>
                <Bell size={18} color={c.accent} />
              </View>
              <View style={styles.itemMeta}>
                <Text style={[styles.itemTitle, { color: c.textPrimary }]}>Notification Alerts</Text>
                <Text style={[styles.itemDesc, { color: c.textMuted }]}>Real-time order dispatch, inventory & audio tone alerts</Text>
              </View>
              {status.notifications ? (
                <CheckCircle2 size={20} color={c.success} />
              ) : (
                <TouchableOpacity onPress={() => PermissionService.requestNotifications().then(checkCurrentStatus)}>
                  <Text style={[styles.allowText, { color: c.accent }]}>Allow</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 3. Location */}
            <View style={[styles.itemRow, { backgroundColor: theme.isDark ? c.surfaceSecondary : '#F8FAFC', borderColor: c.border }]}>
              <View style={[styles.itemIcon, { backgroundColor: c.successLight }]}>
                <MapPin size={18} color={c.success} />
              </View>
              <View style={styles.itemMeta}>
                <Text style={[styles.itemTitle, { color: c.textPrimary }]}>GPS Location</Text>
                <Text style={[styles.itemDesc, { color: c.textMuted }]}>Live delivery telemetry & attendance geofencing</Text>
              </View>
              {status.location ? (
                <CheckCircle2 size={20} color={c.success} />
              ) : (
                <TouchableOpacity onPress={() => PermissionService.requestLocation().then(checkCurrentStatus)}>
                  <Text style={[styles.allowText, { color: c.success }]}>Allow</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.footerBox}>
            <TouchableOpacity
              onPress={handleGrantAll}
              disabled={requesting}
              style={[styles.grantAllBtn, { backgroundColor: c.primary }]}
              activeOpacity={0.8}
            >
              <Text style={styles.grantAllText}>
                {isAllGranted ? 'All Permissions Granted · Continue' : 'Allow All Required Permissions'}
              </Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity onPress={onDismiss} style={styles.skipBtn}>
              <Text style={[styles.skipText, { color: c.textMuted }]}>Skip for Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheetSurface: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    padding: 22,
    maxHeight: '88%',
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconRing: {
    width: 60,
    height: 60,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  itemsList: {
    gap: 10,
    marginBottom: 18,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemMeta: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemDesc: {
    fontSize: 10,
    marginTop: 1,
  },
  allowText: {
    fontSize: 12,
    fontWeight: '800',
  },
  footerBox: {
    gap: 10,
  },
  grantAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  grantAllText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
