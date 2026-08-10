import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useShortcutStore, ShortcutItem } from '../../store/shortcutStore';
import { ShortcutCenterModal } from './ShortcutCenterModal';
import { useTheme } from '../../theme/theme';
import {
  SlidersHorizontal,
  Box,
  ShoppingBag,
  Store,
  Users,
  Calendar,
  Contact,
  ShieldCheck,
  Bell,
  User,
  Plus,
} from 'lucide-react-native';

export const DashboardShortcutBar: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const { loadShortcuts, getPinnedAuthorizedShortcuts } = useShortcutStore();
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadShortcuts();
  }, []);

  const pinnedShortcuts = getPinnedAuthorizedShortcuts();

  const getIcon = (name: string, color: string) => {
    const size = 16;
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

  const handleShortcutPress = (route: string) => {
    try {
      navigation.navigate(route);
    } catch (err) {
      console.warn('Navigation failed for route:', route, err);
    }
  };

  const c = theme.colors;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Pinned Quick Shortcuts</Text>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={[styles.customizeBtn, { backgroundColor: theme.isDark ? c.surfaceSecondary : '#EEF2FF' }]}
          activeOpacity={0.7}
        >
          <SlidersHorizontal size={13} color={c.primary} />
          <Text style={[styles.customizeText, { color: c.primary }]}>Customize</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollWrapper}
      >
        {pinnedShortcuts.map((sc) => (
          <TouchableOpacity
            key={sc.id}
            onPress={() => handleShortcutPress(sc.route)}
            style={[
              styles.shortcutChip,
              {
                backgroundColor: theme.isDark ? c.surface : '#FFFFFF',
                borderColor: c.border,
              },
            ]}
            activeOpacity={0.75}
          >
            <View style={[styles.iconContainer, { backgroundColor: c.primaryLight }]}>
              {getIcon(sc.icon, c.primary)}
            </View>
            <Text style={[styles.shortcutLabel, { color: c.textPrimary }]}>{sc.title}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={[
            styles.addChip,
            {
              backgroundColor: theme.isDark ? c.surfaceSecondary : '#F1F5F9',
              borderColor: c.border,
            },
          ]}
          activeOpacity={0.75}
        >
          <Plus size={15} color={c.textMuted} />
          <Text style={[styles.addChipText, { color: c.textMuted }]}>Add</Text>
        </TouchableOpacity>
      </ScrollView>

      <ShortcutCenterModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  customizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  customizeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  scrollWrapper: {
    flexGrow: 0,
    height: 42,
  },
  scrollContent: {
    gap: 8,
    alignItems: 'center',
    paddingVertical: 2,
  },
  shortcutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 4,
  },
  addChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
