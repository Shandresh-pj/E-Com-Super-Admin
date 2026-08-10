import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../common/Card';
import { Badge, BadgeVariant } from '../common/Badge';
import { useTheme } from '../../theme/theme';
import { Order } from '../../features/orders/services/orderService';
import { ShoppingBag, Calendar, User, CreditCard, Box } from 'lucide-react-native';

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, onPress }) => {
  const theme = useTheme();

  const getStatusVariant = (status: string): BadgeVariant => {
    switch ((status || '').toUpperCase()) {
      case 'COMPLETED':
      case 'DELIVERED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'PROCESSING':
        return 'primary';
      case 'CANCELLED':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const formattedDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  const totalAmt = parseFloat(String(order.total_amount || 0));
  const itemsCount = order.items_count || (order.items ? order.items.length : 0);

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.idContainer}>
          <View style={[styles.iconBox, { backgroundColor: theme.colors.primaryLight }]}>
            <ShoppingBag size={15} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={[styles.orderNumber, { color: theme.colors.textPrimary }]}>
              #{order.order_number || order.id}
            </Text>
            {formattedDate ? (
              <View style={styles.dateRow}>
                <Calendar size={11} color={theme.colors.textMuted} />
                <Text style={[styles.dateText, { color: theme.colors.textMuted }]}>
                  {' '}{formattedDate}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <Badge
          label={order.status || 'PENDING'}
          variant={getStatusVariant(order.status || '')}
          size="sm"
        />
      </View>

      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      <View style={styles.body}>
        <View style={styles.metaCol}>
          <View style={styles.metaRow}>
            <User size={13} color={theme.colors.textMuted} />
            <Text style={[styles.customerText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {' '}{order.customer_name || 'Direct Customer'}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <CreditCard size={13} color={theme.colors.textMuted} />
            <Text style={[styles.paymentText, { color: theme.colors.textMuted }]}>
              {' '}{order.payment_method || 'CASH'} · {(order.payment_status || 'PENDING').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.priceCol}>
          {itemsCount > 0 && (
            <Text style={[styles.itemsText, { color: theme.colors.textMuted }]}>
              {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
            </Text>
          )}
          <Text style={[styles.priceText, { color: theme.colors.primary }]}>
            ₹{totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 5,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaCol: {
    flex: 1,
    gap: 4,
    marginRight: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentText: {
    fontSize: 11,
    fontWeight: '500',
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  itemsText: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
