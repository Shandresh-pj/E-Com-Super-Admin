import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../common/Card';
import { useTheme } from '../../theme/theme';
import { Product } from '../../features/products/services/productService';
import { getApiBaseUrl } from '../../config/environment';
import { Edit2, Trash2, Eye, Box, Video, Layers } from 'lucide-react-native';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onEdit,
  onDelete,
}) => {
  const theme = useTheme();
  const [imageError, setImageError] = useState(false);

  const getImageUrl = () => {
    const raw =
      (product.images && product.images.length > 0 ? product.images[0] : null) ||
      product.image_url ||
      product.image;

    if (!raw) return null;
    if (raw.startsWith('http')) return raw;
    const base = getApiBaseUrl().replace('/api', '');
    return `${base}${raw.startsWith('/') ? '' : '/'}${raw}`;
  };

  const imgUrl = getImageUrl();
  const priceNum = parseFloat(String(product.price || 0));
  const mrpNum = product.compare_at_price ? parseFloat(String(product.compare_at_price)) : null;
  const stockNum = product.stock !== undefined ? product.stock : product.stock_in_hand;
  const hasMultipleImages = product.images && product.images.length > 1;
  const hasVideo = Boolean(product.video_url);

  const c = theme.colors;

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.content}>
        {/* Product Media Box */}
        <View style={[styles.imageBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : '#F1F5F9' }]}>
          {imgUrl && !imageError ? (
            <Image
              source={{ uri: imgUrl }}
              style={styles.image}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.placeholderBox}>
              <Box size={26} color={c.primary} />
            </View>
          )}

          {/* Multi-Image Badge */}
          {hasMultipleImages && (
            <View style={styles.multiBadge}>
              <Layers size={9} color="#FFFFFF" />
              <Text style={styles.multiBadgeText}>{product.images?.length}</Text>
            </View>
          )}

          {/* Video Badge */}
          {hasVideo && (
            <View style={[styles.videoBadge, { backgroundColor: c.accent }]}>
              <Video size={9} color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Product Details */}
        <View style={styles.details}>
          <View style={styles.titleRow}>
            <Text
              style={[theme.typography.subtitle1, { color: c.textPrimary, fontWeight: '700', flex: 1 }]}
              numberOfLines={1}
            >
              {product.name}
            </Text>

            {stockNum !== undefined && (
              <View
                style={[
                  styles.stockBadge,
                  {
                    backgroundColor: stockNum > 5 ? c.successLight : stockNum > 0 ? c.warningLight : c.errorLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.stockText,
                    {
                      color: stockNum > 5 ? c.success : stockNum > 0 ? c.warning : c.error,
                    },
                  ]}
                >
                  {stockNum > 0 ? `${stockNum} ${product.unit || 'in stock'}` : 'Out of stock'}
                </Text>
              </View>
            )}
          </View>

          {/* Category / SKU Tag */}
          <Text
            style={[theme.typography.caption, { color: c.textMuted, marginVertical: 2 }]}
            numberOfLines={1}
          >
            {product.category || (product.barcode ? `Barcode: ${product.barcode}` : product.sku ? `SKU: ${product.sku}` : 'Catalog Item')}
          </Text>

          {/* Pricing & Actions */}
          <View style={styles.bottomRow}>
            <View style={styles.priceColumn}>
              <View style={styles.priceRow}>
                <Text style={[styles.priceText, { color: c.primary }]}>
                  ₹{priceNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                {mrpNum && mrpNum > priceNum && (
                  <Text style={[styles.mrpText, { color: c.textMuted }]}>
                    ₹{mrpNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                )}
              </View>
            </View>

            {/* Quick Action Buttons */}
            <View style={styles.actionsRow}>
              {onPress && (
                <TouchableOpacity
                  onPress={onPress}
                  style={[styles.actionBtn, { backgroundColor: c.primaryLight }]}
                  activeOpacity={0.7}
                >
                  <Eye size={15} color={c.primary} />
                </TouchableOpacity>
              )}
              {onEdit && (
                <TouchableOpacity
                  onPress={onEdit}
                  style={[styles.actionBtn, { backgroundColor: c.primaryLight }]}
                  activeOpacity={0.7}
                >
                  <Edit2 size={15} color={c.primary} />
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity
                  onPress={onDelete}
                  style={[styles.actionBtn, { backgroundColor: c.errorLight }]}
                  activeOpacity={0.7}
                >
                  <Trash2 size={15} color={c.error} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 5,
    padding: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageBox: {
    width: 68,
    height: 68,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiBadge: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  multiBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
  videoBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    borderRadius: 6,
    padding: 3,
  },
  details: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  priceColumn: {
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
  },
  mrpText: {
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
