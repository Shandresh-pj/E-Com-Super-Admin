import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useShortcutStore, ShortcutItem } from '../../store/shortcutStore';
import { useTheme } from '../../theme/theme';
import { ActionPermissionResolver } from '../../security/actionPermissionResolver';
import {
  SlidersHorizontal,
  Pin,
  PinOff,
  X,
  RotateCcw,
  Box,
  ShoppingBag,
  Store,
  Users,
  Calendar,
  Contact,
  ShieldCheck,
  Bell,
  User,
} from 'lucide-react-native';

interface ShortcutCenterModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ShortcutCenterModal: React.FC<ShortcutCenterModalProps> = ({ visible, onClose }) => {
  const theme = useTheme();
  const { shortcuts, togglePin, resetDefaults, loadShortcuts } = useShortcutStore();

  useEffect(() => {
    if (visible) {
      loadShortcuts();
    }
  }, [visible]);

  const getIcon = (name: string, color: string) => {
    const size = 18;
    switch (name) {
      case 'box': return <Box size={size} color={color} />;
      case 'shopping-cart': return <ShoppingBag size={size} color={color} />;
      case 'store': return <Store size={size} color={color} />;
      case 'users': return <Users size={size} color={color} />;
      case 'calendar': return <Calendar size={size} color={color} />;
      case 'contact': return <Contact size={size} color={color} />;
      case 'shield-check': return <ShieldCheck size={size} color={color} />;
      case 'bell': return <Bell size={size} color={color} />;
      default: return <User size={size} color={color} />;
    }
  };

  const c = theme.colors;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.sheetSurface, { backgroundColor: theme.isDark ? c.surface : '#FFFFFF', borderColor: c.border }]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.title, { color: c.textPrimary }]}>Custom Shortcut Center</Text>
              <Text style={[styles.subtitle, { color: c.textMuted }]}>
                Pin or unpin shortcuts to personalize your workspace dashboard
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
            {shortcuts.map((sc) => {
              const isAllowed = !sc.permission || ActionPermissionResolver.can(sc.permission);
              if (!isAllowed) return null;

              return (
                <TouchableOpacity
                  key={sc.id}
                  onPress={() => togglePin(sc.id)}
                  style={[
                    styles.shortcutRow,
                    {
                      backgroundColor: sc.isPinned ? c.primaryLight : theme.isDark ? c.surfaceSecondary : '#F8FAFC',
                      borderColor: sc.isPinned ? c.primary : c.border,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    <View style={[styles.iconBox, { backgroundColor: theme.isDark ? c.surface : '#FFFFFF' }]}>
                      {getIcon(sc.icon, sc.isPinned ? c.primary : c.textMuted)}
                    </View>
                    <View>
                      <Text style={[styles.itemTitle, { color: c.textPrimary }]}>{sc.title}</Text>
                      <Text style={[styles.itemCat, { color: c.textMuted }]}>{sc.category}</Text>
                    </View>
                  </View>

                  <View style={[styles.pinBadge, { backgroundColor: sc.isPinned ? c.primary : 'transparent' }]}>
                    {sc.isPinned ? <Pin size={14} color="#FFFFFF" /> : <PinOff size={14} color={c.textMuted} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.footerRow}>
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Reset Shortcuts', 'Restore factory default dashboard shortcuts?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Reset', onPress: () => resetDefaults() },
                ]);
              }}
              style={[styles.resetBtn, { borderColor: c.border }]}
              activeOpacity={0.7}
            >
              <RotateCcw size={14} color={c.textSecondary} />
              <Text style={[styles.resetText, { color: c.textSecondary }]}>Restore Defaults</Text>
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
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheetSurface: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    padding: 20,
    maxHeight: '85%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    maxHeight: 380,
  },
  shortcutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 4,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemCat: {
    fontSize: 10,
    fontWeight: '600',
  },
  pinBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    marginTop: 14,
    alignItems: 'center',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  resetText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
