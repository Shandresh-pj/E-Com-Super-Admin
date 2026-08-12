import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './navigationTypes';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../security/roleResolver';
import { PermissionResolver } from '../security/permissionResolver';
import { useTheme } from '../theme/theme';

import { SuperAdminDashboard } from '../features/dashboard/screens/SuperAdminDashboard';
import { AdminDashboard } from '../features/dashboard/screens/AdminDashboard';
import { BranchDashboard } from '../features/dashboard/screens/BranchDashboard';
import { BranchManagerDashboard } from '../features/dashboard/screens/BranchManagerDashboard';
import { EmployeeDashboard } from '../features/dashboard/screens/EmployeeDashboard';
import { ShopkeeperDashboard } from '../features/dashboard/screens/ShopkeeperDashboard';
import { DeliveryBoyDashboard } from '../features/dashboard/screens/DeliveryBoyDashboard';
import { UnsupportedRoleScreen } from '../features/dashboard/screens/UnsupportedRoleScreen';

import { ProductsScreen } from '../features/products/screens/ProductsScreen';
import { CategoriesScreen } from '../features/products/screens/CategoriesScreen';
import { CouponsScreen } from '../features/products/screens/CouponsScreen';
import { OrdersScreen } from '../features/orders/screens/OrdersScreen';
import { BranchesScreen } from '../features/branches/screens/BranchesScreen';
import { EmployeesScreen } from '../features/employees/screens/EmployeesScreen';
import { CustomersScreen } from '../features/customers/screens/CustomersScreen';
import { AttendanceScreen } from '../features/attendance/screens/AttendanceScreen';
import { PayrollScreen } from '../features/employees/screens/PayrollScreen';
import { LeaveScreen } from '../features/employees/screens/LeaveScreen';
import { ShiftsScreen } from '../features/workforce/screens/ShiftsScreen';
import { StocksScreen } from '../features/inventory/screens/StocksScreen';
import { DeliveryTrackingScreen } from '../features/delivery/screens/DeliveryTrackingScreen';
import { PaymentsScreen } from '../features/finance/screens/PaymentsScreen';
import { ProfitLossScreen } from '../features/finance/screens/ProfitLossScreen';
import { InvoicesScreen } from '../features/finance/screens/InvoicesScreen';
import { AuditLogsScreen } from '../features/admin/screens/AuditLogsScreen';
import { ApprovalsScreen } from '../features/admin/screens/ApprovalsScreen';
import { POSBillingScreen } from '../features/pos/screens/POSBillingScreen';
import { SubscriptionScreen } from '../features/subscription/screens/SubscriptionScreen';
import { CRMContactsScreen } from '../features/crm/screens/CRMContactsScreen';
import { WorkforceConsoleScreen } from '../features/workforce/screens/WorkforceConsoleScreen';
import { BreakPoliciesScreen } from '../features/workforce/screens/BreakPoliciesScreen';
import { GeofencingScreen } from '../features/workforce/screens/GeofencingScreen';
import { WorkforceRequestsScreen } from '../features/workforce/screens/WorkforceRequestsScreen';
import { SecureChatScreen } from '../features/communication/screens/SecureChatScreen';
import { TeamMeetingsScreen } from '../features/communication/screens/TeamMeetingsScreen';
import { MobilityCockpitScreen } from '../features/mobility/screens/MobilityCockpitScreen';
import { ProductAttributesScreen } from '../features/products/screens/ProductAttributesScreen';
import { AttributeValuesScreen } from '../features/products/screens/AttributeValuesScreen';
import { StatusMasterScreen } from '../features/admin/screens/StatusMasterScreen';
import { MenuBarScreen } from '../features/admin/screens/MenuBarScreen';
import { BiometricsScreen } from '../features/workforce/screens/BiometricsScreen';
import { HardwareDevicesScreen } from '../features/admin/screens/HardwareDevicesScreen';
import { TranslationKeysScreen } from '../features/admin/screens/TranslationKeysScreen';
import { CompanyCalendarScreen } from '../features/admin/screens/CompanyCalendarScreen';
import { EmployeeDocumentsScreen } from '../features/employees/screens/EmployeeDocumentsScreen';
import { VehicleNearbyScreen } from '../features/mobility/screens/VehicleNearbyScreen';
import { MobilityBookingsScreen } from '../features/mobility/screens/MobilityBookingsScreen';
import { CarRentalsScreen } from '../features/mobility/screens/CarRentalsScreen';
import { ParcelLogisticsScreen } from '../features/mobility/screens/ParcelLogisticsScreen';
import { FleetAssetsScreen } from '../features/mobility/screens/FleetAssetsScreen';
import { TransitRoutesScreen } from '../features/mobility/screens/TransitRoutesScreen';
import { GPSTelemetryScreen } from '../features/mobility/screens/GPSTelemetryScreen';
import { VehicleKYCScreen } from '../features/mobility/screens/VehicleKYCScreen';

import { RoleAccessScreen } from '../features/roleaccess/screens/RoleAccessScreen';
import { NotificationsScreen } from '../features/notifications/screens/NotificationsScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { DynamicModuleScreen } from '../features/menu/screens/DynamicModuleScreen';
import { SidebarDrawer } from '../components/navigation/SidebarDrawer';
import { PermissionsOnboardingModal } from '../components/security/PermissionsOnboardingModal';
import { PermissionService } from '../security/permissionService';

import {
  LayoutDashboard,
  Box,
  ShoppingBag,
  Store,
  Users,
  UserCheck,
  Bell,
  User,
  ShieldCheck,
  HeartHandshake,
} from 'lucide-react-native';
import { useNotificationCount } from '../hooks/useNotificationCount';

const Tab = createBottomTabNavigator<MainTabParamList>();

// The 5 primary options shown on the floating bottom dock
const PRIMARY_TABS: (keyof MainTabParamList)[] = [
  'Dashboard',
  'Products',
  'Orders',
  'Notifications',
  'Profile',
];


// ── Ultra-Responsive Tab Item with Spring Physics & Pill Capsule ────────────

const ResponsiveTabItem: React.FC<{
  label: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  icon: (color: string, size: number) => React.ReactNode;
  isSmallScreen: boolean;
  /** Number of unread notifications (0 means no badge) */
  notificationCount?: number;
}> = ({ label, isFocused, onPress, onLongPress, icon, isSmallScreen, notificationCount = 0 }) => {
  const theme = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pillOpacity = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isFocused ? 1.08 : 1,
        tension: 300,
        friction: 18,
        useNativeDriver: true,
      }),
      Animated.timing(pillOpacity, {
        toValue: isFocused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused]);

  const activeColor = theme.colors.primary;
  const inactiveColor = theme.colors.textMuted;
  const iconSize = isSmallScreen ? 19 : 21;

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabButton}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.tabItemInner,
          {
            backgroundColor: isFocused
              ? theme.isDark
                ? 'rgba(99, 102, 241, 0.18)'
                : 'rgba(67, 56, 202, 0.08)'
              : 'transparent',
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.iconWrapper}>
          {icon(isFocused ? activeColor : inactiveColor, iconSize)}
          {notificationCount > 0 && (
            <View style={[styles.tabBadgeDot, { backgroundColor: theme.colors.error }]}>
              {notificationCount <= 9 && (
                <Text style={styles.tabBadgeText}>{notificationCount}</Text>
              )}
            </View>
          )}
        </View>

        <Text
          style={[
            styles.tabLabel,
            {
              color: isFocused ? activeColor : inactiveColor,
              fontWeight: isFocused ? '800' : '600',
              fontSize: isSmallScreen ? 9.5 : 10.5,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>

        {isFocused && (
          <View style={[styles.activeIndicatorBar, { backgroundColor: activeColor }]} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ── Ultra-Premium Floating Tab Bar Dock ─────────────────────────────────────

const CustomFloatingTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { unreadCount } = useNotificationCount();
  const c = theme.colors;

  const isSmallScreen = width < 375;

  // Filter routes to render strictly the 5 high-frequency options
  const visibleRoutes = state.routes.filter((route) =>
    PRIMARY_TABS.includes(route.name as keyof MainTabParamList)
  );

  return (
    <View style={styles.floatingWrapper} pointerEvents="box-none">
      <View
        style={[
          styles.floatingDock,
          {
            backgroundColor: theme.isDark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)',
            borderColor: theme.isDark ? 'rgba(51, 65, 85, 0.7)' : 'rgba(226, 232, 240, 0.95)',
            shadowColor: theme.isDark ? '#000000' : c.primary,
          },
        ]}
      >
        {visibleRoutes.map((route) => {
          const routeIndex = state.routes.findIndex((r) => r.key === route.key);
          const isFocused = state.index === routeIndex;
          const { options } = descriptors[route.key];

          const label =
            options.tabBarLabel !== undefined
              ? String(options.tabBarLabel)
              : options.title !== undefined
              ? options.title
              : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const renderIcon = (color: string, size: number) => {
            if (options.tabBarIcon) {
              return options.tabBarIcon({ focused: isFocused, color, size });
            }
            return <LayoutDashboard color={color} size={size} />;
          };

          const isAlertsTab = route.name === 'Notifications';

          return (
            <ResponsiveTabItem
              key={route.key}
              label={label}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              icon={renderIcon}
              isSmallScreen={isSmallScreen}
              notificationCount={isAlertsTab ? unreadCount : 0}
            />
          );
        })}
      </View>
    </View>
  );
};

export const RoleNavigator: React.FC = () => {
  const role = useAuthStore((state) => state.role);

  const getDashboardComponent = () => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return SuperAdminDashboard;
      case UserRole.ADMIN:
        return AdminDashboard;
      case UserRole.BRANCH:
        return BranchDashboard;
      case UserRole.BRANCH_MANAGER:
        return BranchManagerDashboard;
      case UserRole.EMPLOYEE:
        return EmployeeDashboard;
      case UserRole.SHOPKEEPER:
        return ShopkeeperDashboard;
      case UserRole.DELIVERY_BOY:
        return DeliveryBoyDashboard;
      default:
        return UnsupportedRoleScreen;
    }
  };

  const [permissionsModalVisible, setPermissionsModalVisible] = React.useState(false);

  React.useEffect(() => {
    PermissionService.checkAllPermissions().then((status) => {
      if (!status.camera || !status.notifications || !status.location) {
        setPermissionsModalVisible(true);
      }
    });
  }, []);

  if (role === UserRole.UNSUPPORTED) {
    return <UnsupportedRoleScreen />;
  }

  return (
    <View style={styles.root}>
      <Tab.Navigator
        tabBar={(props) => <CustomFloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          lazy: true,
        }}
      >
        {/* 1. Home Dashboard */}
        <Tab.Screen
          name="Dashboard"
          component={getDashboardComponent()}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} />,
          }}
        />

        {/* 2. Products & Inventory */}
        {PermissionResolver.canView(role, 'products') && (
          <Tab.Screen
            name="Products"
            component={ProductsScreen}
            options={{
              tabBarLabel: 'Products',
              tabBarIcon: ({ color, size }) => <Box color={color} size={size} strokeWidth={2.2} />,
            }}
          />
        )}

        {/* 3. Orders */}
        {PermissionResolver.canView(role, 'orders') && (
          <Tab.Screen
            name="Orders"
            component={OrdersScreen}
            options={{
              tabBarLabel: 'Orders',
              tabBarIcon: ({ color, size }) => <ShoppingBag color={color} size={size} strokeWidth={2.2} />,
            }}
          />
        )}

        {/* 4. Notifications */}
        <Tab.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{
            tabBarLabel: 'Alerts',
            tabBarIcon: ({ color, size }) => <Bell color={color} size={size} strokeWidth={2.2} />,
          }}
        />

        {/* 5. Profile */}
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color, size }) => <User color={color} size={size} strokeWidth={2.2} />,
          }}
        />

        {/* ── Extended Screens (Accessed via Sidebar Drawer & Quick Links) ── */}
        <Tab.Screen
          name="Branches"
          component={BranchesScreen}
          options={{
            tabBarLabel: 'Branches',
            tabBarIcon: ({ color, size }) => <Store color={color} size={size} strokeWidth={2.2} />,
          }}
        />

        <Tab.Screen
          name="Employees"
          component={EmployeesScreen}
          options={{
            tabBarLabel: 'Staff',
            tabBarIcon: ({ color, size }) => <Users color={color} size={size} strokeWidth={2.2} />,
          }}
        />

        <Tab.Screen
          name="Customers"
          component={CustomersScreen}
          options={{
            tabBarLabel: 'Customers',
            tabBarIcon: ({ color, size }) => <HeartHandshake color={color} size={size} strokeWidth={2.2} />,
          }}
        />


        <Tab.Screen
          name="Attendance"
          component={AttendanceScreen}
          options={{
            tabBarLabel: 'Attendance',
            tabBarIcon: ({ color, size }) => <UserCheck color={color} size={size} strokeWidth={2.2} />,
          }}
        />

        <Tab.Screen
          name="RoleAccess"
          component={RoleAccessScreen}
          options={{
            tabBarLabel: 'Security',
            tabBarIcon: ({ color, size }) => <ShieldCheck color={color} size={size} strokeWidth={2.2} />,
          }}
        />

        {/* ── Commerce & Products ─────────────────────────────── */}
        <Tab.Screen name="Categories" component={CategoriesScreen} options={{ tabBarLabel: 'Categories', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />
        <Tab.Screen name="Coupons" component={CouponsScreen} options={{ tabBarLabel: 'Coupons', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />

        {/* ── Inventory & Stock ───────────────────────────────── */}
        <Tab.Screen name="Stocks" component={StocksScreen} options={{ tabBarLabel: 'Stocks', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />

        {/* ── Workforce & HR ──────────────────────────────────── */}
        <Tab.Screen name="Payroll" component={PayrollScreen} options={{ tabBarLabel: 'Payroll', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />
        <Tab.Screen name="Leave" component={LeaveScreen} options={{ tabBarLabel: 'Leave', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />
        <Tab.Screen name="Shifts" component={ShiftsScreen} options={{ tabBarLabel: 'Shifts', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />

        {/* ── Fulfilment & Finance ────────────────────────────── */}
        <Tab.Screen name="DeliveryTracking" component={DeliveryTrackingScreen} options={{ tabBarLabel: 'Delivery', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />
        <Tab.Screen name="Payments" component={PaymentsScreen} options={{ tabBarLabel: 'Payments', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />
        <Tab.Screen name="ProfitLoss" component={ProfitLossScreen} options={{ tabBarLabel: 'P&L', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />

        {/* ── Admin & System ──────────────────────────────────── */}
        <Tab.Screen name="AuditLogs" component={AuditLogsScreen} options={{ tabBarLabel: 'Audit', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />
        <Tab.Screen name="Approvals" component={ApprovalsScreen} options={{ tabBarLabel: 'Approvals', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />

        {/* ── POS Billing ─────────────────────────────────────── */}
        <Tab.Screen name="POSBilling" component={POSBillingScreen} options={{ tabBarLabel: 'POS', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />

        {/* ── Invoices ────────────────────────────────────────── */}
        <Tab.Screen name="Invoices" component={InvoicesScreen} options={{ tabBarLabel: 'Invoices', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />

        {/* ── Subscription ────────────────────────────────────── */}
        <Tab.Screen name="Subscription" component={SubscriptionScreen} options={{ tabBarLabel: 'Plans', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />

        {/* ── CRM Contacts ────────────────────────────────────── */}
        <Tab.Screen name="CRMContacts" component={CRMContactsScreen} options={{ tabBarLabel: 'CRM', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />

        {/* ── Workforce Extended ──────────────────────────────── */}
        <Tab.Screen name="WorkforceConsole" component={WorkforceConsoleScreen} options={{ tabBarLabel: 'Workforce', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />
        <Tab.Screen name="BreakPolicies" component={BreakPoliciesScreen} options={{ tabBarLabel: 'Breaks', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />
        <Tab.Screen name="Geofencing" component={GeofencingScreen} options={{ tabBarLabel: 'Geofencing', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />
        <Tab.Screen name="WorkforceRequests" component={WorkforceRequestsScreen} options={{ tabBarLabel: 'WF Requests', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />

        {/* ── Communication ────────────────────────────────────── */}
        <Tab.Screen name="SecureChat" component={SecureChatScreen} options={{ tabBarLabel: 'Chat', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />
        <Tab.Screen name="TeamMeetings" component={TeamMeetingsScreen} options={{ tabBarLabel: 'Meetings', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />

        {/* ── Mobility Platform ────────────────────────────────── */}
        <Tab.Screen name="MobilityCockpit" component={MobilityCockpitScreen} options={{ tabBarLabel: 'Mobility', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />

        {/* ── Products Extended ───────────────────────────────── */}
        <Tab.Screen name="ProductAttributes" component={ProductAttributesScreen} options={{ tabBarLabel: 'Attributes', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />
        <Tab.Screen name="AttributeValues" component={AttributeValuesScreen} options={{ tabBarLabel: 'Values', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />

        {/* ── Admin & System Masters ──────────────────────────── */}
        <Tab.Screen name="StatusMaster" component={StatusMasterScreen} options={{ tabBarLabel: 'Status Master', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />
        <Tab.Screen name="MenuBar" component={MenuBarScreen} options={{ tabBarLabel: 'Menu Settings', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />
        <Tab.Screen name="HardwareDevices" component={HardwareDevicesScreen} options={{ tabBarLabel: 'Hardware', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />
        <Tab.Screen name="TranslationKeys" component={TranslationKeysScreen} options={{ tabBarLabel: 'Languages', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />
        <Tab.Screen name="CompanyCalendar" component={CompanyCalendarScreen} options={{ tabBarLabel: 'Calendar', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />

        {/* ── Workforce Extended ──────────────────────────────── */}
        <Tab.Screen name="Biometrics" component={BiometricsScreen} options={{ tabBarLabel: 'Biometrics', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />
        <Tab.Screen name="EmployeeDocuments" component={EmployeeDocumentsScreen} options={{ tabBarLabel: 'Emp Docs', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />

        {/* ── Mobility Platform Extended ──────────────────────── */}
        <Tab.Screen name="VehicleNearby" component={VehicleNearbyScreen} options={{ tabBarLabel: 'Nearby', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />
        <Tab.Screen name="MobilityBookings" component={MobilityBookingsScreen} options={{ tabBarLabel: 'Bookings', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />
        <Tab.Screen name="CarRentals" component={CarRentalsScreen} options={{ tabBarLabel: 'Rentals', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />
        <Tab.Screen name="ParcelLogistics" component={ParcelLogisticsScreen} options={{ tabBarLabel: 'Parcels', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />
        <Tab.Screen name="FleetAssets" component={FleetAssetsScreen} options={{ tabBarLabel: 'Fleet', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />
        <Tab.Screen name="TransitRoutes" component={TransitRoutesScreen} options={{ tabBarLabel: 'Transit', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />
        <Tab.Screen name="GPSTelemetry" component={GPSTelemetryScreen} options={{ tabBarLabel: 'Telemetry', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />
        <Tab.Screen name="VehicleKYC" component={VehicleKYCScreen} options={{ tabBarLabel: 'Vehicle KYC', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} /> }} />

        {/* ── Dynamic Fallback ────────────────────────────────── */}
        <Tab.Screen
          name="DynamicModule"
          component={DynamicModuleScreen}
          options={{
            tabBarLabel: 'Console',
            tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} strokeWidth={2.2} />,
          }}
        />
      </Tab.Navigator>

      {/* ── Sliding Enterprise Sidebar Drawer ─────────────────────── */}
      <SidebarDrawer />

      {/* ── Native Device Permissions Onboarding Modal ───────────── */}
      <PermissionsOnboardingModal
        visible={permissionsModalVisible}
        onDismiss={() => setPermissionsModalVisible(false)}
      />
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  floatingWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 22 : 10,
    left: 12,
    right: 12,
  },
  floatingDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 28,
    borderWidth: 1.2,
    paddingVertical: 6,
    paddingHorizontal: 8,
    elevation: 18,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 20,
    position: 'relative',
    minWidth: 48,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeDot: {
    position: 'absolute',
    top: -2,
    right: -3,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    lineHeight: 12,
  },
  tabLabel: {
    marginTop: 2,
    letterSpacing: -0.2,
  },
  activeIndicatorBar: {
    width: 14,
    height: 3,
    borderRadius: 1.5,
    marginTop: 2,
  },
});
