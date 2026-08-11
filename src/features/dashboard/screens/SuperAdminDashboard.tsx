import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect, Circle } from 'react-native-svg';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Header } from '../../../components/common/Header';
import { MetricCard } from '../../../components/cards/MetricCard';
import { MiniChart } from '../../../components/charts/MiniChart';
import { OrderCard } from '../../../components/cards/OrderCard';
import { ProductCard } from '../../../components/cards/ProductCard';
import { DashboardSkeleton } from '../../../components/skeletons/SkeletonLoader';
import { ErrorState, EmptyState } from '../../../components/common/States';
import { useDashboardData } from '../hooks/useDashboardData';
import { useTheme } from '../../../theme/theme';
import { useAuthStore } from '../../../store/authStore';
import { useSocket } from '../../../api/SocketProvider';
import { IndianRupee, ShoppingBag, Box, Users, Store, TrendingUp, Wifi, WifiOff } from 'lucide-react-native';
import { Badge } from '../../../components/common/Badge';
import { DashboardShortcutBar } from '../../../components/navigation/DashboardShortcutBar';
import { ExecutiveProfileCard } from '../../../components/cards/ExecutiveProfileCard';

const { width } = Dimensions.get('window');

const DashboardBanner: React.FC<{ primary: string; accent: string; isDark: boolean }> = ({
  primary, accent, isDark,
}) => (
  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
    <Svg width={width - 32} height={72} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Defs>
        <RadialGradient id="dash_b1" cx="15%" cy="50%" r="60%">
          <Stop offset="0%" stopColor={primary} stopOpacity={isDark ? '0.22' : '0.14'} />
          <Stop offset="100%" stopColor={primary} stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="dash_b2" cx="85%" cy="50%" r="55%">
          <Stop offset="0%" stopColor={accent} stopOpacity={isDark ? '0.16' : '0.10'} />
          <Stop offset="100%" stopColor={accent} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect width={width - 32} height={72} fill="url(#dash_b1)" />
      <Rect width={width - 32} height={72} fill="url(#dash_b2)" />
      <Circle cx={width - 52} cy={36} r={40} stroke={accent} strokeOpacity="0.09" strokeWidth="1" fill="none" />
      <Circle cx={width - 52} cy={36} r={24} stroke={accent} strokeOpacity="0.12" strokeWidth="1" fill="none" />
      <Circle cx={28} cy={36} r={28} stroke={primary} strokeOpacity="0.08" strokeWidth="1" fill="none" />
    </Svg>
  </View>
);

export const SuperAdminDashboard: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuthStore();
  const { metrics, loading, refreshing, error, refresh } = useDashboardData();
  const { isConnected } = useSocket();

  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const bannerSlide = useRef(new Animated.Value(-12)).current;

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(bannerOpacity, { toValue: 1, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(bannerSlide, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  if (loading && !metrics) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Command Center" subtitle="Enterprise Overview" />
        <DashboardSkeleton />
      </ScreenContainer>
    );
  }

  if (error && !metrics) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Command Center" />
        <ErrorState message={error} onRetry={refresh} />
      </ScreenContainer>
    );
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScreenContainer scrollable={true} refreshing={refreshing} onRefresh={refresh}>
      <Header
        title="Command Center"
        subtitle={`${greeting()}, ${user?.name || user?.email?.split('@')[0] || 'Executive'}`}
      />

      {/* Ultra-Premium Executive Profile & Command Card */}
      <ExecutiveProfileCard />

      {/* Pinned Quick Shortcuts Bar */}
      <DashboardShortcutBar />

      {/* Metric cards — staggered entrance */}
      <View style={styles.metricsGrid}>
        <MetricCard
          title="Total Revenue"
          value={`₹${(metrics?.totalRevenue || 0).toLocaleString('en-IN')}`}
          icon={<IndianRupee size={18} color={theme.colors.primary} />}
          delay={0}
        />
        <MetricCard
          title="Total Orders"
          value={metrics?.totalOrders || 0}
          icon={<ShoppingBag size={18} color={theme.colors.accent} />}
          delay={60}
        />
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard
          title="Products"
          value={metrics?.totalProducts || 0}
          icon={<Box size={18} color={theme.colors.success} />}
          delay={120}
        />
        <MetricCard
          title="Branches"
          value={metrics?.totalBranches || 0}
          icon={<Store size={18} color={theme.colors.warning} />}
          delay={180}
        />
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard
          title="Total Staff"
          value={metrics?.totalEmployees || 0}
          icon={<Users size={18} color={theme.colors.cyan} />}
          delay={240}
        />
        <MetricCard
          title="Categories"
          value={metrics?.totalCategories || 0}
          icon={<TrendingUp size={18} color={theme.colors.gold} />}
          delay={300}
        />
      </View>

        {/* Revenue chart */}
        <View
          style={[
            styles.chartCard,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          ]}
        >
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartTitle, { color: theme.colors.textPrimary }]}>
                Revenue Analytics
              </Text>
              <Text style={[styles.chartSub, { color: theme.colors.textMuted }]}>
                {isConnected ? 'Live backend data' : 'Offline — last synced data'}
              </Text>
            </View>
            {/* BUG-015 fix: LIVE indicator only shown when socket is actually connected */}
            {isConnected && (
              <View style={[styles.liveDot, { backgroundColor: theme.colors.successLight }]}>
                <View style={[styles.liveDotInner, { backgroundColor: theme.colors.success }]} />
                <Text style={[styles.liveText, { color: theme.colors.success }]}>LIVE</Text>
              </View>
            )}
            {!isConnected && (
              <View style={[styles.liveDot, { backgroundColor: theme.colors.errorLight || 'rgba(239,68,68,0.1)' }]}>
                <View style={[styles.liveDotInner, { backgroundColor: theme.colors.error }]} />
                <Text style={[styles.liveText, { color: theme.colors.textMuted }]}>OFFLINE</Text>
              </View>
            )}
          </View>
          <MiniChart
            height={96}
            data={
              metrics?.recentOrders && metrics.recentOrders.length > 0
                ? metrics.recentOrders.map((o) => parseFloat(String(o.total_amount || 0))).reverse()
                : [0, metrics?.totalRevenue || 0]
            }
          />
        </View>

      {/* Recent Orders */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Recent Orders
        </Text>
        {metrics?.recentOrders && metrics.recentOrders.length > 0 ? (
          metrics.recentOrders.map((ord) => <OrderCard key={ord.id} order={ord} />)
        ) : (
          <EmptyState title="No Orders" description="No orders registered in the system yet." />
        )}
      </View>

      {/* Top Products */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Top Products
        </Text>
        {metrics?.productsList && metrics.productsList.length > 0 ? (
          metrics.productsList
            .slice(0, 3)
            .map((prod) => <ProductCard key={prod.id} product={prod} />)
        ) : (
          <EmptyState title="No Products" description="No products available in backend." />
        )}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  welcomeBanner: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
    height: 72,
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  bannerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    marginHorizontal: -5,
    marginVertical: 2,
  },
  chartCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  chartSub: {
    fontSize: 11,
    marginTop: 2,
  },
  liveDot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  liveDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  section: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 10,
  },
});
