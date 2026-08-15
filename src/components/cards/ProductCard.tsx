import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Card } from '../common/Card';
import { useTheme } from '../../theme/theme';
import { Product } from '../../features/products/services/productService';
import { getApiBaseUrl } from '../../config/environment';
import { Edit2, Trash2, Eye, Box, Video, Layers, Sparkles, TrendingUp } from 'lucide-react-native';

interface ProductCardProps {
  product: Product;
  viewMode?: 'list' | 'grid';
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  viewMode = 'list',
  onPress,
  onEdit,
  onDelete,
}) => {
  const theme = useTheme();
  const c = theme.colors;
  const { width } = useWindowDimensions();
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
  const costNum = product.purchase_cost ? parseFloat(String(product.purchase_cost)) : null;
  const stockNum = product.stock !== undefined ? product.stock : product.stock_in_hand;
  const hasMultipleImages = product.images && product.images.length > 1;
  const hasVideo = Boolean(product.video_url);

  // Profit Margin calculation
  const marginPercent = costNum && priceNum > costNum
    ? Math.round(((priceNum - costNum) / priceNum) * 100)
    : null;

  if (viewMode === 'grid') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={[
          styles.gridCard,
          {
            backgroundColor: theme.isDark ? '#0F172A' : '#FFFFFF',
            borderColor: theme.isDark ? '#1E293B' : '#E2E8F0',
          },
        ]}
      >
        {/* Product Image Box */}
        <View style={[styles.gridImageBox, { backgroundColor: theme.isDark ? '#1E293B' : '#F8FAFC' }]}>
          {imgUrl && !imageError ? (
            <Image
              source={{ uri: imgUrl }}
              style={styles.gridImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.placeholderBox}>
              <Box size={32} color={c.primary} />
            </View>
          )}

          {/* Stock Tag Top Right */}
          {stockNum !== undefined && (
            <View
              style={[
                styles.gridStockTag,
                {
                  backgroundColor:
                    stockNum > 5
                      ? 'rgba(16, 185, 129, 0.9)'
                      : stockNum > 0
                      ? 'rgba(245, 158, 11, 0.9)'
                      : 'rgba(239, 68, 68, 0.9)',
                },
              ]}
            >
              <Text style={styles.gridStockText}>
                {stockNum > 0 ? `${stockNum} ${product.unit || 'in stock'}` : 'Out of stock'}
              </Text>
            </View>
          )}

          {/* Media Badges Top Left */}
          <View style={styles.gridMediaBadges}>
            {hasMultipleImages && (
              <View style={styles.multiBadge}>
                <Layers size={9} color="#FFFFFF" />
                <Text style={styles.multiBadgeText}>{product.images?.length}</Text>
              </View>
            )}
            {hasVideo && (
              <View style={[styles.videoBadge, { backgroundColor: c.accent }]}>
                <Video size={9} color="#FFFFFF" />
              </View>
            )}
          </View>
        </View>

        {/* Product Details Content */}
        <View style={styles.gridDetails}>
          <Text style={[styles.gridTitle, { color: c.textPrimary }]} numberOfLines={1}>
            {product.name}
          </Text>

          <Text style={[styles.gridCategory, { color: c.textMuted }]} numberOfLines={1}>
            {product.category || (product.barcode ? `Barcode: ${product.barcode}` : product.sku ? `SKU: ${product.sku}` : 'Catalog Item')}
          </Text>

          <View style={styles.gridPriceRow}>
            <Text style={[styles.gridPriceText, { color: c.primary }]}>
              ₹{priceNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            {mrpNum && mrpNum > priceNum && (
              <Text style={[styles.gridMrpText, { color: c.textMuted }]}>
                ₹{mrpNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            )}
          </View>

          {marginPercent != null && (
            <View style={[styles.marginTag, { backgroundColor: theme.isDark ? '#1E293B' : '#ECFDF5' }]}>
              <TrendingUp size={10} color="#10B981" style={{ marginRight: 3 }} />
              <Text style={styles.marginTagText}>{marginPercent}% Margin</Text>
            </View>
          )}

          {/* Quick Actions Row */}
          <View style={styles.gridActionsRow}>
            {onEdit && (
              <TouchableOpacity
                onPress={onEdit}
                style={[styles.actionBtn, { backgroundColor: theme.isDark ? '#1E293B' : c.primaryLight }]}
                activeOpacity={0.7}
              >
                <Edit2 size={13} color={c.primary} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                onPress={onDelete}
                style={[styles.actionBtn, { backgroundColor: theme.isDark ? '#1E293B' : c.errorLight }]}
                activeOpacity={0.7}
              >
                <Trash2 size={13} color={c.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Default List View Mode
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.content}>
        {/* Product Media Box */}
        <View style={[styles.imageBox, { backgroundColor: theme.isDark ? '#1E293B' : '#F1F5F9' }]}>
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
    borderRadius: 16,
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

  // Grid Styles
  gridCard: {
    flex: 1,
    margin: 5,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gridImageBox: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridStockTag: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gridStockText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  gridMediaBadges: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    gap: 4,
  },
  gridDetails: {
    padding: 10,
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  gridCategory: {
    fontSize: 10,
    marginBottom: 6,
  },
  gridPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 4,
  },
  gridPriceText: {
    fontSize: 14,
    fontWeight: '900',
  },
  gridMrpText: {
    fontSize: 10,
    textDecorationLine: 'line-through',
  },
  marginTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
  },
  marginTagText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
  },
  gridActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
  },
});
