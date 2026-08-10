import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Header } from '../../../components/common/Header';
import { SearchInput } from '../../../components/inputs/SearchInput';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { ProductCard } from '../../../components/cards/ProductCard';
import { useDashboardData } from '../hooks/useDashboardData';
import { Product } from '../../products/services/productService';
import { OrderService } from '../../orders/services/orderService';
import { useTheme } from '../../../theme/theme';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, IndianRupee } from 'lucide-react-native';
import { ExecutiveProfileCard } from '../../../components/cards/ExecutiveProfileCard';

export interface CartItem {
  product: Product;
  quantity: number;
}

export const ShopkeeperDashboard: React.FC = () => {
  const theme = useTheme();
  const { metrics, loading, refreshing, refresh } = useDashboardData();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkingOut, setCheckingOut] = useState(false);

  const products = metrics?.productsList || [];
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.includes(search))
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string | number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + parseFloat(String(item.product.price || 0)) * item.quantity,
    0
  );

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setCheckingOut(true);
    try {
      await OrderService.createOrder({
        payment: {
          method: 'CASH',
          status: 'PAID',
        },
        items: cart.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          price: parseFloat(String(i.product.price || 0)),
        })),
        notes: 'POS Counter Sale Checkout',
      });

      Alert.alert(
        'Checkout Completed',
        `Sale recorded successfully! Total: ₹${cartTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        [
          {
            text: 'Done',
            onPress: () => {
              setCart([]);
              refresh();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Checkout Error', err.message || 'Failed to complete POS order');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <ScreenContainer scrollable={true} refreshing={refreshing} onRefresh={refresh}>
      <Header
        title="Point of Sale (POS)"
        subtitle="Fast Touch Checkout Terminal"
      />

      <ExecutiveProfileCard />

      <View style={styles.topStats}>
        <View style={[styles.statBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <IndianRupee size={20} color={theme.colors.primary} />
          <View style={styles.statTextContainer}>
            <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>Today's Sales</Text>
            <Text style={[theme.typography.subtitle1, { color: theme.colors.textPrimary }]}>
              ₹{(metrics?.totalRevenue || 0).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <View style={[styles.statBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <ShoppingCart size={20} color={theme.colors.accent} />
          <View style={styles.statTextContainer}>
            <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>Active Cart</Text>
            <Text style={[theme.typography.subtitle1, { color: theme.colors.textPrimary }]}>
              {cart.reduce((sum, i) => sum + i.quantity, 0)} Items
            </Text>
          </View>
        </View>
      </View>

      <SearchInput
        placeholder="Search product name or scan barcode..."
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.posLayout}>
        <View style={styles.catalogSection}>
          <Text style={[theme.typography.subtitle1, { color: theme.colors.textPrimary, marginVertical: 8 }]}>
            Product Catalog
          </Text>
          {filteredProducts.map((prod) => (
            <TouchableOpacity key={prod.id} onPress={() => addToCart(prod)} activeOpacity={0.7}>
              <ProductCard product={prod} />
            </TouchableOpacity>
          ))}
        </View>

        <View
          style={[
            styles.cartSection,
            { backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderRadius: theme.radius.lg },
          ]}
        >
          <View style={styles.cartHeader}>
            <Text style={[theme.typography.h3, { color: theme.colors.textPrimary }]}>Current Bill</Text>
            {cart.length > 0 && (
              <TouchableOpacity onPress={() => setCart([])}>
                <Trash2 size={18} color={theme.colors.error} />
              </TouchableOpacity>
            )}
          </View>

          {cart.length === 0 ? (
            <Text style={[theme.typography.body2, { color: theme.colors.textMuted, marginVertical: 16 }]}>
              Tap products on the left to add them to the bill.
            </Text>
          ) : (
            cart.map((item) => (
              <View key={item.product.id} style={[styles.cartRow, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.cartItemInfo}>
                  <Text style={[theme.typography.subtitle2, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    {item.product.name}
                  </Text>
                  <Text style={[theme.typography.caption, { color: theme.colors.primary }]}>
                    ₹{parseFloat(String(item.product.price)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </View>

                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    onPress={() => updateQuantity(item.product.id, -1)}
                    style={[styles.qtyBtn, { backgroundColor: theme.colors.surfaceSecondary }]}
                  >
                    <Minus size={14} color={theme.colors.textPrimary} />
                  </TouchableOpacity>

                  <Text style={[theme.typography.subtitle2, { color: theme.colors.textPrimary, marginHorizontal: 8 }]}>
                    {item.quantity}
                  </Text>

                  <TouchableOpacity
                    onPress={() => updateQuantity(item.product.id, 1)}
                    style={[styles.qtyBtn, { backgroundColor: theme.colors.surfaceSecondary }]}
                  >
                    <Plus size={14} color={theme.colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <View style={[styles.totalContainer, { borderTopColor: theme.colors.border }]}>
            <Text style={[theme.typography.subtitle1, { color: theme.colors.textSecondary }]}>Total Amount</Text>
            <Text style={[theme.typography.h2, { color: theme.colors.primary }]}>₹{cartTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          </View>

          <PrimaryButton
            title="Complete Checkout"
            onPress={handleCheckout}
            disabled={cart.length === 0}
            icon={<CreditCard size={18} color="#FFFFFF" />}
            style={styles.checkoutBtn}
          />
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  topStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  statTextContainer: {
    marginLeft: 8,
  },
  posLayout: {
    marginTop: 8,
  },
  catalogSection: {
    marginBottom: 16,
  },
  cartSection: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  cartItemInfo: {
    flex: 1,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 16,
  },
  checkoutBtn: {
    marginTop: 12,
  },
});
