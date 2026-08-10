import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect, Circle, Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useDrawerStore } from '../../store/drawerStore';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useTheme } from '../../theme/theme';
import { useRealtimeSocket } from '../../hooks/useRealtimeSocket';
import { MenuService, MenuItem, BACKEND_MENUS_CATALOG } from '../../features/menu/services/menuService';
import {
  LayoutDashboard,
  Box,
  ShoppingBag,
  Store,
  Users,
  UserCheck,
  ShieldCheck,
  Bell,
  User,
  X,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  Shield,
  Search,
  Tag,
  ListFilter,
  Database,
  GitMerge,
  Receipt,
  FileText,
  Ticket,
  CreditCard,
  Plane,
  FileCheck,
  Coffee,
  Fingerprint,
  MapPin,
  Car,
  Truck,
  Compass,
  Key,
  Bus,
  PieChart,
  Gem,
  MessageSquare,
  Video,
  Calendar,
  ClipboardList,
  CheckSquare,
  Activity,
  Printer,
  Globe,
  Sliders,
  Layers,
  Sparkles,
  Zap,
  Crown,
  Briefcase,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.86, 360);

// ── Interactive Animated Pressable ──────────────────────────────────────────

const DrawerPressable: React.FC<{
  onPress?: () => void;
  style?: any;
  containerStyle?: any;
  children: React.ReactNode;
}> = ({ onPress, style, containerStyle, children }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 300,
      friction: 15,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 12,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, containerStyle]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.85}
        style={style}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Hero Background Art ──────────────────────────────────────────────────────

const DrawerHeroArt: React.FC<{ isDark: boolean; primaryColor: string; accentColor: string }> = ({
  isDark,
  primaryColor,
  accentColor,
}) => (
  <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
    <Defs>
      <RadialGradient id="drawer_g1" cx="80%" cy="15%" r="70%">
        <Stop offset="0%" stopColor={accentColor} stopOpacity={isDark ? '0.35' : '0.15'} />
        <Stop offset="100%" stopColor={accentColor} stopOpacity="0" />
      </RadialGradient>
      <RadialGradient id="drawer_g2" cx="10%" cy="90%" r="60%">
        <Stop offset="0%" stopColor={primaryColor} stopOpacity={isDark ? '0.30' : '0.12'} />
        <Stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
      </RadialGradient>
    </Defs>
    <Rect width="100%" height="100%" fill="url(#drawer_g1)" />
    <Rect width="100%" height="100%" fill="url(#drawer_g2)" />
    <Circle cx="85%" cy="30%" r="80" stroke={primaryColor} strokeOpacity={isDark ? '0.1' : '0.04'} strokeWidth="1" fill="none" />
    <Circle cx="85%" cy="30%" r="120" stroke={accentColor} strokeOpacity={isDark ? '0.06' : '0.03'} strokeWidth="1" fill="none" />
  </Svg>
);

// ── Sidebar Drawer ───────────────────────────────────────────────────────────

export const SidebarDrawer: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const { isOpen, closeDrawer } = useDrawerStore();
  const { user, role, logout } = useAuthStore();
  const { setMode } = useThemeStore();
  const { isConnected } = useRealtimeSocket();

  const [menus, setMenus] = useState<MenuItem[]>(BACKEND_MENUS_CATALOG);
  const [searchQuery, setSearchQuery] = useState('');

  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    MenuService.getMenus().then((data) => {
      const authorized = MenuService.getAuthorizedMenus(data, role);
      setMenus(authorized);
    });
  }, [role]);

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 2,
          speed: 18,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  if (!isOpen && (slideAnim as any)._value === -DRAWER_WIDTH) {
    return null;
  }

  const handleMenuPress = (menu: MenuItem) => {
    closeDrawer();
    setTimeout(() => {
      try {
        switch (menu.path) {
          case '/admin':
          case '/dashboard':
            navigation.navigate('Dashboard');
            break;
          case '/product':
            navigation.navigate('Products');
            break;
          case '/orders':
            navigation.navigate('Orders');
            break;
          case '/branch':
            navigation.navigate('Branches');
            break;
          case '/employees':
            navigation.navigate('Employees');
            break;
          case '/attendance':
            navigation.navigate('Attendance');
            break;
          case '/role-access':
            navigation.navigate('RoleAccess');
            break;
          case '/alerts':
          case '/notifications':
            navigation.navigate('Notifications');
            break;
          case '/profile':
            navigation.navigate('Profile');
            break;
          default:
            navigation.navigate('DynamicModule', {
              title: menu.name,
              path: menu.path,
              category: menu.category,
            });
            break;
        }
      } catch (err) {
        console.warn('Navigation error:', err);
      }
    }, 160);
  };

  const handleLogout = () => {
    closeDrawer();
    setTimeout(() => {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to end your active enterprise session?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
        ]
      );
    }, 200);
  };

  const toggleTheme = () => {
    const next = theme.isDark ? 'light' : 'dark';
    setMode(next);
  };

  // Role Meta
  const getRoleMeta = (r?: string) => {
    if (!r) return { label: 'STAFF', color: theme.colors.primary, bg: theme.colors.primaryLight, Icon: Shield };
    const upper = r.toUpperCase();
    if (upper.includes('SUPER_ADMIN')) {
      return { label: 'SUPER ADMIN', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.2)', Icon: Crown };
    }
    if (upper.includes('ADMIN')) {
      return { label: 'ADMIN', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.2)', Icon: Sparkles };
    }
    if (upper.includes('BRANCH_MANAGER') || upper.includes('MANAGER')) {
      return { label: 'BRANCH MANAGER', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.2)', Icon: Briefcase };
    }
    if (upper.includes('SHOPKEEPER')) {
      return { label: 'SHOPKEEPER POS', color: '#10B981', bg: 'rgba(16, 185, 129, 0.2)', Icon: Store };
    }
    if (upper.includes('DELIVERY')) {
      return { label: 'DELIVERY RIDER', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.2)', Icon: Truck };
    }
    return { label: r.replace(/_/g, ' '), color: theme.colors.primary, bg: theme.colors.primaryLight, Icon: UserCheck };
  };

  const roleMeta = getRoleMeta(role);
  const RoleIcon = roleMeta.Icon;

  // Icon Resolver
  const getMenuIcon = (iconName: string, color: string) => {
    const size = 18;
    switch (iconName.toLowerCase()) {
      case 'box': return <Box size={size} color={color} />;
      case 'tag': return <Tag size={size} color={color} />;
      case 'list-details': return <ListFilter size={size} color={color} />;
      case 'category': return <Layers size={size} color={color} />;
      case 'database': return <Database size={size} color={color} />;
      case 'git-merge': return <GitMerge size={size} color={color} />;
      case 'shopping-cart': return <ShoppingBag size={size} color={color} />;
      case 'receipt-2': return <Receipt size={size} color={color} />;
      case 'file-text': return <FileText size={size} color={color} />;
      case 'ticket': return <Ticket size={size} color={color} />;
      case 'credit-card': return <CreditCard size={size} color={color} />;
      case 'store': return <Store size={size} color={color} />;
      case 'users': return <Users size={size} color={color} />;
      case 'calendar': return <Calendar size={size} color={color} />;
      case 'schedule': return <Sliders size={size} color={color} />;
      case 'plane-departure': return <Plane size={size} color={color} />;
      case 'file-check': return <FileCheck size={size} color={color} />;
      case 'free_breakfast':
      case 'coffee': return <Coffee size={size} color={color} />;
      case 'fingerprint': return <Fingerprint size={size} color={color} />;
      case 'location_on':
      case 'map-pin': return <MapPin size={size} color={color} />;
      case 'bi-car-front-fill':
      case 'car': return <Car size={size} color={color} />;
      case 'bi-truck-front-fill':
      case 'truck': return <Truck size={size} color={color} />;
      case 'bi-radar':
      case 'radar': return <Compass size={size} color={color} />;
      case 'bi-key-fill':
      case 'key': return <Key size={size} color={color} />;
      case 'bi-building-fill-gear':
      case 'bus': return <Bus size={size} color={color} />;
      case 'chart-pie': return <PieChart size={size} color={color} />;
      case 'diamond': return <Gem size={size} color={color} />;
      case 'bi-chat-dots-fill':
      case 'message-square': return <MessageSquare size={size} color={color} />;
      case 'bi-camera-video-fill':
      case 'video': return <Video size={size} color={color} />;
      case 'calendar-event': return <Calendar size={size} color={color} />;
      case 'bell': return <Bell size={size} color={color} />;
      case 'shield':
      case 'shield-check': return <ShieldCheck size={size} color={color} />;
      case 'clipboard-list': return <ClipboardList size={size} color={color} />;
      case 'checkbox':
      case 'check-square': return <CheckSquare size={size} color={color} />;
      case 'list-check':
      case 'activity': return <Activity size={size} color={color} />;
      case 'devices':
      case 'printer': return <Printer size={size} color={color} />;
      case 'language':
      case 'globe': return <Globe size={size} color={color} />;
      default: return <LayoutDashboard size={size} color={color} />;
    }
  };

  const filteredMenus = menus.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return m.name.toLowerCase().includes(q) || (m.category && m.category.toLowerCase().includes(q));
  });

  const categories = Array.from(new Set(filteredMenus.map((m) => m.category || 'General Operations')));

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Administrator');
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const c = theme.colors;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isOpen ? 'auto' : 'none'}>
      {/* ── Backdrop Overlay ─────────────────────────────────────────── */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeDrawer} />
      </Animated.View>

      {/* ── Sliding Drawer Shell ─────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.drawerSurface,
          {
            width: DRAWER_WIDTH,
            backgroundColor: theme.isDark ? '#0A0E17' : '#FFFFFF',
            borderRightColor: theme.isDark ? '#1E293B' : '#E2E8F0',
            transform: [{ translateX: slideAnim }],
            shadowColor: '#000000',
          },
        ]}
      >
        {/* ── Ultra-Premium Drawer Hero Header ───────────────────────── */}
        <View
          style={[
            styles.drawerHeaderHero,
            {
              backgroundColor: theme.isDark ? '#0F172A' : '#1E1B4B',
              borderBottomColor: theme.isDark ? '#1E293B' : 'rgba(255,255,255,0.1)',
            },
          ]}
        >
          {/* Background Ambient Art */}
          <DrawerHeroArt isDark={theme.isDark} primaryColor={c.primary} accentColor={c.accent} />

          {/* Top Row: Avatar & Close Button */}
          <View style={styles.heroTopRow}>
            <View style={styles.avatarWrapper}>
              <View
                style={[
                  styles.avatarBox,
                  {
                    backgroundColor: theme.isDark ? '#1E293B' : 'rgba(255,255,255,0.18)',
                    borderColor: theme.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.3)',
                  },
                ]}
              >
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarInitialsText}>{initials}</Text>
                )}
              </View>
              {isConnected && (
                <View style={styles.onlineBadge}>
                  <View style={styles.onlineDot} />
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={closeDrawer}
              style={[
                styles.closeHeroBtn,
                { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)' },
              ]}
              activeOpacity={0.7}
            >
              <X size={18} color="#FFFFFF" strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          {/* User Name & Email */}
          <View style={styles.userMetaHero}>
            <Text style={styles.userNameHero} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.userEmailHero} numberOfLines={1}>
              {user?.email || 'admin@svkecom.pro'}
            </Text>

            {/* Badges Row */}
            <View style={styles.heroBadgesRow}>
              <View style={[styles.heroRoleChip, { backgroundColor: roleMeta.bg }]}>
                <RoleIcon size={11} color={roleMeta.color} strokeWidth={2.5} style={{ marginRight: 4 }} />
                <Text style={[styles.heroRoleText, { color: roleMeta.color }]}>
                  {roleMeta.label}
                </Text>
              </View>

              <View
                style={[
                  styles.heroLiveChip,
                  {
                    backgroundColor: isConnected
                      ? 'rgba(74, 222, 128, 0.18)'
                      : 'rgba(239, 68, 68, 0.18)',
                  },
                ]}
              >
                <Zap
                  size={10}
                  color={isConnected ? '#4ADE80' : '#EF4444'}
                  strokeWidth={2.5}
                  style={{ marginRight: 3 }}
                />
                <Text
                  style={[
                    styles.heroLiveText,
                    { color: isConnected ? '#4ADE80' : '#EF4444' },
                  ]}
                >
                  {isConnected ? 'REAL-TIME' : 'OFFLINE'}
                </Text>
              </View>
            </View>
          </View>

          {/* Search Input Box */}
          <View
            style={[
              styles.searchHeroBox,
              {
                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.14)',
                borderColor: theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.22)',
              },
            ]}
          >
            <Search size={15} color="#94A3B8" />
            <TextInput
              placeholder="Search 50+ modules..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchHeroInput}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={14} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* ── Categorized Modules Navigation List ───────────────────── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {categories.map((cat) => {
            const catMenus = filteredMenus.filter((m) => (m.category || 'General Operations') === cat);
            if (catMenus.length === 0) return null;

            return (
              <View key={cat} style={styles.categoryCard}>
                <View style={styles.categoryHeaderRow}>
                  <View style={styles.categoryTitleGroup}>
                    <View style={[styles.categoryIndicator, { backgroundColor: c.primary }]} />
                    <Text style={[styles.categoryTitle, { color: c.textSecondary }]}>
                      {cat.toUpperCase()}
                    </Text>
                  </View>
                  <View style={[styles.countPill, { backgroundColor: theme.isDark ? '#1E293B' : '#EEF2FF' }]}>
                    <Text style={[styles.countPillText, { color: c.primary }]}>
                      {catMenus.length}
                    </Text>
                  </View>
                </View>

                {catMenus.map((menu) => (
                  <DrawerPressable
                    key={menu.id}
                    onPress={() => handleMenuPress(menu)}
                    style={[
                      styles.menuItemRow,
                      {
                        backgroundColor: theme.isDark ? '#0F172A' : '#FFFFFF',
                        borderColor: theme.isDark ? '#1E293B' : '#E2E8F0',
                      },
                    ]}
                  >
                    <View style={styles.itemLeftGroup}>
                      <View
                        style={[
                          styles.menuIconContainer,
                          {
                            backgroundColor: theme.isDark ? 'rgba(99, 102, 241, 0.15)' : '#EEF2FF',
                            borderColor: theme.isDark ? 'rgba(99, 102, 241, 0.25)' : '#E0E7FF',
                          },
                        ]}
                      >
                        {getMenuIcon(menu.icon || 'box', c.primary)}
                      </View>
                      <Text
                        style={[styles.menuItemLabel, { color: c.textPrimary }]}
                        numberOfLines={1}
                      >
                        {menu.name}
                      </Text>
                    </View>
                    <ChevronRight size={15} color={c.textMuted} />
                  </DrawerPressable>
                ))}
              </View>
            );
          })}
        </ScrollView>

        {/* ── Ultra-Premium Drawer Footer (Equal Width Symmetrical Buttons) ─ */}
        <View
          style={[
            styles.drawerFooter,
            {
              borderTopColor: theme.isDark ? '#1E293B' : '#E2E8F0',
              backgroundColor: theme.isDark ? '#0F172A' : '#FFFFFF',
            },
          ]}
        >
          <View style={styles.footerActionRow}>
            {/* Theme Toggle Card */}
            <DrawerPressable
              containerStyle={styles.footerBtnWrapper}
              onPress={toggleTheme}
              style={[
                styles.footerCardBtn,
                {
                  backgroundColor: theme.isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: theme.isDark ? '#334155' : '#CBD5E1',
                },
              ]}
            >
              {theme.isDark ? (
                <Sun size={16} color="#F59E0B" strokeWidth={2.2} />
              ) : (
                <Moon size={16} color={c.primary} strokeWidth={2.2} />
              )}
              <Text style={[styles.footerBtnText, { color: c.textPrimary }]}>
                {theme.isDark ? 'Light' : 'Dark'}
              </Text>
            </DrawerPressable>

            {/* Logout Card */}
            <DrawerPressable
              containerStyle={styles.footerBtnWrapper}
              onPress={handleLogout}
              style={[
                styles.footerLogoutCardBtn,
                {
                  backgroundColor: theme.isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
                  borderColor: theme.isDark ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
                },
              ]}
            >
              <LogOut size={16} color={c.error} strokeWidth={2.2} />
              <Text style={[styles.footerLogoutText, { color: c.error }]}>Sign Out</Text>
            </DrawerPressable>
          </View>

          <Text style={[styles.brandFootprint, { color: c.textMuted }]}>
            SVK Enterprise Suite · Secured with 256-bit RBAC
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    zIndex: 9998,
  },
  drawerSurface: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 9999,
    borderRightWidth: 1.2,
    elevation: 28,
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    display: 'flex',
    flexDirection: 'column',
  },
  drawerHeaderHero: {
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitialsText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4ADE80',
    borderWidth: 2.5,
    borderColor: '#0F172A',
  },
  onlineDot: {
    width: '100%',
    height: '100%',
    borderRadius: 7,
  },
  closeHeroBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMetaHero: {
    marginBottom: 14,
  },
  userNameHero: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  userEmailHero: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 10,
    fontWeight: '500',
  },
  heroBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroRoleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  heroRoleText: {
    fontSize: 9.5,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroLiveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  heroLiveText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  searchHeroBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchHeroInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#FFFFFF',
    paddingVertical: 0,
    fontWeight: '500',
  },
  scrollContent: {
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  categoryCard: {
    marginBottom: 16,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  categoryTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryIndicator: {
    width: 4,
    height: 12,
    borderRadius: 2,
  },
  categoryTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countPillText: {
    fontSize: 9.5,
    fontWeight: '900',
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 3,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  itemLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
  },
  drawerFooter: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1.2,
  },
  footerActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
    width: '100%',
  },
  footerBtnWrapper: {
    flex: 1,
  },
  footerCardBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  footerBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  footerLogoutCardBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  footerLogoutText: {
    fontSize: 13,
    fontWeight: '800',
  },
  brandFootprint: {
    fontSize: 9.5,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.2,
  },
});
