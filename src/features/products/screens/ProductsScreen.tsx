import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView,
  Image,
  Alert,
  Linking,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ScreenContainer } from '../../../components/common/ScreenContainer';
import { Header } from '../../../components/common/Header';
import { ProductCard } from '../../../components/cards/ProductCard';
import { TextField } from '../../../components/inputs/TextField';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { Badge } from '../../../components/common/Badge';
import { Card } from '../../../components/common/Card';
import { ProductService, Product, Category } from '../services/productService';
import { DashboardSkeleton } from '../../../components/skeletons/SkeletonLoader';
import { EmptyState, ErrorState } from '../../../components/common/States';
import { useTheme } from '../../../theme/theme';
import { getApiBaseUrl } from '../../../config/environment';
import { resolveMediaUrl } from '../../../utils/mediaUrl';
import {
  Plus,
  Search,
  X,
  Box,
  Image as ImageIcon,
  Video,
  Layers,
  Sparkles,
  Barcode,
  Percent,
} from 'lucide-react-native';

export const ProductsScreen: React.FC = () => {
  const theme = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Active form tab: 'basic' | 'pricing' | 'inventory' | 'media'
  const [formTab, setFormTab] = useState<'basic' | 'pricing' | 'inventory' | 'media'>('basic');

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [dealerPrice, setDealerPrice] = useState('');
  const [stock, setStock] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [unit, setUnit] = useState('Pcs');
  const [imageUrl, setImageUrl] = useState('');
  const [additionalImages, setAdditionalImages] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [taxRate, setTaxRate] = useState('18');
  const [mediaInputMode, setMediaInputMode] = useState<'URL' | 'UPLOAD'>('URL');

  // Cross-Platform Media Picker Modal State (Android & iOS)
  const [mediaPickerVisible, setMediaPickerVisible] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<'PRIMARY' | 'GALLERY' | 'VIDEO'>('PRIMARY');
  const [pickerInputText, setPickerInputText] = useState('');

  // Active Gallery Image Index
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // Debounce search to avoid API call on every keystroke
  const searchDebounceRef = useRef<any>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(text);
    }, 300);
  }, []);

  const fetchProducts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [prodData, catData] = await Promise.all([
        ProductService.getProducts(debouncedSearch),
        ProductService.getCategories(),
      ]);
      setProducts(prodData);
      setCategories(catData);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch, fetchProducts]);

  // Open Detail View
  const handleOpenDetail = (prod: Product) => {
    setSelectedProduct(prod);
    setActiveImgIndex(0);
    setDetailModalVisible(true);
  };

  // Open Add Product Modal
  const handleOpenAdd = () => {
    setFormMode('add');
    setSelectedProduct(null);
    setFormTab('basic');
    setName('');
    setDescription('');
    setPrice('');
    setMrp('');
    setPurchaseCost('');
    setWholesalePrice('');
    setDealerPrice('');
    setStock('10');
    setSku(`SKU-${Date.now().toString().slice(-6)}`);
    setBarcode('');
    setCategory(categories[0]?.name || 'General');
    setBrand('');
    setUnit('Pcs');
    setImageUrl('');
    setAdditionalImages('');
    setVideoUrl('');
    setTaxRate('18');
    setFormModalVisible(true);
  };

  // Open Edit Product Modal
  const handleOpenEdit = (prod: Product) => {
    setFormMode('edit');
    setSelectedProduct(prod);
    setFormTab('basic');
    setName(prod.name || '');
    setDescription(prod.description || '');
    setPrice(String(prod.price || ''));
    setMrp(prod.compare_at_price ? String(prod.compare_at_price) : '');
    setPurchaseCost(prod.purchase_cost ? String(prod.purchase_cost) : '');
    setWholesalePrice(prod.wholesale_price ? String(prod.wholesale_price) : '');
    setDealerPrice(prod.dealer_price ? String(prod.dealer_price) : '');
    setStock(String(prod.stock !== undefined ? prod.stock : prod.stock_in_hand || 0));
    setSku(prod.sku || '');
    setBarcode(prod.barcode || '');
    setCategory(prod.category || 'General');
    setBrand(prod.brand || '');
    setUnit(prod.unit || 'Pcs');
    setImageUrl(prod.image || prod.image_url || '');
    setAdditionalImages(prod.images ? prod.images.join(', ') : '');
    setVideoUrl(prod.video_url || '');
    setTaxRate(prod.tax_rate ? String(prod.tax_rate) : '18');
    setFormModalVisible(true);
  };

  // Save Product (Create or Edit)
  const handleSaveProduct = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a product title.');
      return;
    }
    if (!price || isNaN(Number(price))) {
      Alert.alert('Required', 'Please enter a valid sale price.');
      return;
    }

    setSubmitting(true);
    try {
      const imgArray = additionalImages
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (imageUrl && !imgArray.includes(imageUrl)) {
        imgArray.unshift(imageUrl);
      }

      const hasLocalMedia = (uri?: string) => uri && (uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('data:'));

      let formDataPayload: FormData | undefined = undefined;

      if (hasLocalMedia(imageUrl) || imgArray.some(hasLocalMedia) || hasLocalMedia(videoUrl)) {
        formDataPayload = new FormData();
        formDataPayload.append('name', name);
        formDataPayload.append('description', description);
        formDataPayload.append('price', String(parseFloat(price)));
        if (mrp) formDataPayload.append('compare_at_price', String(parseFloat(mrp)));
        if (purchaseCost) formDataPayload.append('purchase_cost', String(parseFloat(purchaseCost)));
        if (stock) formDataPayload.append('stock', stock);
        if (sku) formDataPayload.append('sku', sku);
        if (barcode) formDataPayload.append('barcode', barcode);
        if (category) formDataPayload.append('category', category);
        if (brand) formDataPayload.append('brand', brand);
        if (unit) formDataPayload.append('unit', unit);
        if (taxRate) formDataPayload.append('tax_rate', taxRate);

        if (imageUrl) {
          if (hasLocalMedia(imageUrl)) {
            const filename = imageUrl.split('/').pop() || 'primary_cover.jpg';
            const type = imageUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
            formDataPayload.append('image', { uri: imageUrl, name: filename, type } as any);
          } else {
            formDataPayload.append('image_url', imageUrl);
          }
        }

        if (imgArray.length > 0) {
          imgArray.forEach((imgUri, i) => {
            if (hasLocalMedia(imgUri)) {
              const fname = imgUri.split('/').pop() || `gallery_${i}.jpg`;
              const ftype = imgUri.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
              formDataPayload!.append('images', { uri: imgUri, name: fname, type: ftype } as any);
            } else {
              formDataPayload!.append('additional_images', imgUri);
            }
          });
        }

        if (videoUrl) {
          if (hasLocalMedia(videoUrl)) {
            const vname = videoUrl.split('/').pop() || 'demo_video.mp4';
            formDataPayload.append('video', { uri: videoUrl, name: vname, type: 'video/mp4' } as any);
          } else {
            formDataPayload.append('video_url', videoUrl);
          }
        }
      }

      const jsonPayload: Partial<Product> = {
        name,
        description,
        price: parseFloat(price),
        compare_at_price: mrp ? parseFloat(mrp) : null,
        purchase_cost: purchaseCost ? parseFloat(purchaseCost) : null,
        wholesale_price: wholesalePrice ? parseFloat(wholesalePrice) : null,
        dealer_price: dealerPrice ? parseFloat(dealerPrice) : null,
        stock: parseInt(stock || '0', 10),
        sku,
        barcode,
        category,
        brand,
        unit,
        image: imageUrl || (imgArray[0] || ''),
        image_url: imageUrl || (imgArray[0] || ''),
        images: imgArray,
        video_url: videoUrl,
        tax_rate: taxRate ? parseFloat(taxRate) : 0,
        status: 'active',
      };

      if (formMode === 'add') {
        const created = await ProductService.createProduct(jsonPayload, formDataPayload);
        setProducts((prev) => [created, ...prev]);
        Alert.alert('Success', 'Product created and listed successfully.');
      } else if (selectedProduct) {
        const updated = await ProductService.updateProduct(selectedProduct.id, jsonPayload, formDataPayload);
        setProducts((prev) => prev.map((p) => (p.id === selectedProduct.id ? updated : p)));
        Alert.alert('Success', 'Product updated successfully.');
      }

      setFormModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = (prod: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to remove "${prod.name}" from inventory?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setProducts((prev) => prev.filter((p) => p.id !== prod.id));
            await ProductService.deleteProduct(prod.id);
          },
        },
      ]
    );
  };

  // Filter products by category
  const filteredProducts = products.filter((p) => {
    if (selectedCategory === 'ALL') return true;
    return p.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  const c = theme.colors;

  // Resolve detail image gallery list
  const getDetailGallery = (prod: Product): string[] => {
    const list: string[] = [];
    if (prod.images && prod.images.length > 0) {
      list.push(...prod.images);
    } else if (prod.image_url) {
      list.push(prod.image_url);
    } else if (prod.image) {
      list.push(prod.image);
    }
    return list.map((url) => {
      if (url.startsWith('http')) return url;
      const base = getApiBaseUrl().replace('/api', '');
      return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
    });
  };

  return (
    <View style={styles.root}>
      <ScreenContainer scrollable={true} refreshing={refreshing} onRefresh={() => fetchProducts(true)}>
        <Header
          title="Catalog & Inventory"
          subtitle={`${products.length} Products Registered`}
          rightAction={
            <TouchableOpacity
              onPress={handleOpenAdd}
              style={[styles.addBtn, { backgroundColor: c.primary }]}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          }
        />

        {/* ── Search Bar ────────────────────────────────────────────── */}
        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : '#F1F5F9', borderColor: c.border }]}>
          <Search size={18} color={c.textMuted} />
          <TextInput
            placeholder="Search products by title, SKU, barcode..."
            placeholderTextColor={c.textMuted}
            value={searchQuery}
            onChangeText={handleSearchChange}
            style={[styles.searchInput, { color: c.textPrimary }]}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={c.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── Category Filters ──────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            onPress={() => setSelectedCategory('ALL')}
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedCategory === 'ALL' ? c.primary : c.surfaceSecondary,
                borderColor: selectedCategory === 'ALL' ? c.primary : c.border,
              },
            ]}
          >
            <Text style={[styles.filterChipText, { color: selectedCategory === 'ALL' ? '#FFFFFF' : c.textSecondary }]}>
              All ({products.length})
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.name)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? c.primary : c.surfaceSecondary,
                    borderColor: isSelected ? c.primary : c.border,
                  },
                ]}
              >
                <Text style={[styles.filterChipText, { color: isSelected ? '#FFFFFF' : c.textSecondary }]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Product List ──────────────────────────────────────────── */}
        {loading && !refreshing ? (
          <DashboardSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchProducts()} />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            title="No Products Found"
            description={searchQuery ? `No matches for "${searchQuery}".` : 'No items cataloged yet. Tap Add Product to create one.'}
          />
        ) : null}

        {/* FlatList replaces map() for virtualized, performant rendering */}
        {!loading && !error && filteredProducts.length > 0 && (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                onPress={() => handleOpenDetail(item)}
                onEdit={() => handleOpenEdit(item)}
                onDelete={() => handleDeleteProduct(item)}
              />
            )}
            initialNumToRender={8}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={Platform.OS === 'android'}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          />
        )}
      </ScreenContainer>

      {/* ── Product Detail Modal ────────────────────────────────────── */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.detailSheet, { backgroundColor: theme.isDark ? c.surface : '#FFFFFF', borderColor: c.border }]}>
            {selectedProduct && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[theme.typography.h3, { color: c.textPrimary }]}>{selectedProduct.name}</Text>
                    <Text style={[theme.typography.caption, { color: c.textMuted }]}>
                      {selectedProduct.category || 'General'} · {selectedProduct.brand || 'Enterprise'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={styles.closeBtn}>
                    <X size={20} color={c.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Image Gallery Viewer */}
                {(() => {
                  const gallery = getDetailGallery(selectedProduct);
                  return (
                    <View style={styles.galleryWrapper}>
                      <View style={[styles.mainImageBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : '#F1F5F9' }]}>
                        {gallery.length > 0 ? (
                          <Image
                            source={{ uri: gallery[activeImgIndex] || gallery[0] }}
                            style={styles.mainImage}
                            resizeMode="contain"
                          />
                        ) : (
                          <View style={styles.noImageBox}>
                            <Box size={48} color={c.primary} />
                            <Text style={[styles.noImageText, { color: c.textMuted }]}>No Photo Attached</Text>
                          </View>
                        )}
                      </View>

                      {/* Thumbnail Strip */}
                      {gallery.length > 1 && (
                        <ScrollView horizontal style={styles.thumbStrip}>
                          {gallery.map((uri, idx) => (
                            <TouchableOpacity
                              key={idx}
                              onPress={() => setActiveImgIndex(idx)}
                              style={[
                                styles.thumbBox,
                                {
                                  borderColor: activeImgIndex === idx ? c.primary : c.border,
                                },
                              ]}
                            >
                              <Image source={{ uri }} style={styles.thumbImage} resizeMode="cover" />
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  );
                })()}

                {/* Video Demo Button */}
                {selectedProduct.video_url ? (
                  <TouchableOpacity
                    onPress={() => {
                      if (selectedProduct.video_url) Linking.openURL(selectedProduct.video_url);
                    }}
                    style={[styles.videoLinkBtn, { backgroundColor: c.accentLight }]}
                  >
                    <Video size={16} color={c.accent} />
                    <Text style={[styles.videoLinkText, { color: c.accent }]}>Watch Product Video Demonstration</Text>
                  </TouchableOpacity>
                ) : null}

                {/* Price & Margin Matrix */}
                <View style={[styles.pricingCard, { backgroundColor: c.primaryLight }]}>
                  <View style={styles.priceCol}>
                    <Text style={[styles.priceColLabel, { color: c.primary }]}>Sale Price</Text>
                    <Text style={[styles.priceColVal, { color: c.primary }]}>
                      ₹{parseFloat(String(selectedProduct.price || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>

                  {selectedProduct.compare_at_price && (
                    <View style={styles.priceCol}>
                      <Text style={[styles.priceColLabel, { color: c.textMuted }]}>MRP</Text>
                      <Text style={[styles.priceColVal, { color: c.textSecondary, textDecorationLine: 'line-through' }]}>
                        ₹{parseFloat(String(selectedProduct.compare_at_price)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Text>
                    </View>
                  )}

                  {selectedProduct.purchase_cost && (
                    <View style={styles.priceCol}>
                      <Text style={[styles.priceColLabel, { color: c.success }]}>Cost Price</Text>
                      <Text style={[styles.priceColVal, { color: c.success }]}>
                        ₹{parseFloat(String(selectedProduct.purchase_cost)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Inventory & Specifications */}
                <View style={styles.specRows}>
                  <View style={styles.specRow}>
                    <Text style={[styles.specLabel, { color: c.textMuted }]}>Stock Status:</Text>
                    <Badge
                      label={`${selectedProduct.stock || selectedProduct.stock_in_hand || 0} ${selectedProduct.unit || 'Units'}`}
                      variant={(selectedProduct.stock || 0) > 0 ? 'success' : 'error'}
                    />
                  </View>

                  {selectedProduct.sku && (
                    <View style={styles.specRow}>
                      <Text style={[styles.specLabel, { color: c.textMuted }]}>SKU Code:</Text>
                      <Text style={[styles.specValue, { color: c.textPrimary }]}>{selectedProduct.sku}</Text>
                    </View>
                  )}

                  {selectedProduct.barcode && (
                    <View style={styles.specRow}>
                      <Text style={[styles.specLabel, { color: c.textMuted }]}>Barcode:</Text>
                      <View style={styles.barcodeRow}>
                        <Barcode size={14} color={c.textPrimary} />
                        <Text style={[styles.specValue, { color: c.textPrimary }]}>{selectedProduct.barcode}</Text>
                      </View>
                    </View>
                  )}

                  {selectedProduct.tax_rate !== undefined && (
                    <View style={styles.specRow}>
                      <Text style={[styles.specLabel, { color: c.textMuted }]}>GST / Tax Rate:</Text>
                      <Text style={[styles.specValue, { color: c.textPrimary }]}>{selectedProduct.tax_rate || 0}%</Text>
                    </View>
                  )}
                </View>

                {/* Description */}
                {selectedProduct.description ? (
                  <View style={styles.descSection}>
                    <Text style={[styles.descTitle, { color: c.textPrimary }]}>Description</Text>
                    <Text style={[styles.descBody, { color: c.textSecondary }]}>{selectedProduct.description}</Text>
                  </View>
                ) : null}

                {/* Actions */}
                <View style={styles.modalActions}>
                  <PrimaryButton
                    title="Edit Product"
                    onPress={() => {
                      setDetailModalVisible(false);
                      handleOpenEdit(selectedProduct);
                    }}
                    style={{ flex: 1 }}
                  />
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Comprehensive Add / Edit Product Modal ─────────────────── */}
      <Modal
        visible={formModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFormModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.formSheet, { backgroundColor: theme.isDark ? c.surface : '#FFFFFF', borderColor: c.border }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[theme.typography.h3, { color: c.textPrimary }]}>
                    {formMode === 'add' ? 'Add New Product' : 'Edit Product'}
                  </Text>
                  <Text style={[theme.typography.caption, { color: c.textMuted }]}>
                    Comprehensive Enterprise Catalog Specification
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setFormModalVisible(false)} style={styles.closeBtn}>
                  <X size={20} color={c.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Form Tabs */}
              <View style={[styles.formTabBar, { backgroundColor: theme.isDark ? c.surfaceSecondary : '#EEF2FF' }]}>
                {[
                  { id: 'basic', label: 'Basic' },
                  { id: 'pricing', label: 'Pricing (₹)' },
                  { id: 'inventory', label: 'Stock & SKU' },
                  { id: 'media', label: 'Media / Video' },
                ].map((tb) => {
                  const isActive = formTab === tb.id;
                  return (
                    <TouchableOpacity
                      key={tb.id}
                      onPress={() => setFormTab(tb.id as any)}
                      style={[styles.formTabItem, isActive && [styles.formTabActive, { backgroundColor: c.primary }]]}
                    >
                      <Text style={[styles.formTabText, { color: isActive ? '#FFFFFF' : c.textMuted }]}>
                        {tb.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={styles.formScroll}
              >
                {/* 1. Basic Tab */}
                {formTab === 'basic' && (
                  <View style={styles.tabContent}>
                    <TextField label="Product Title *" placeholder="e.g. Royal Basmati Rice 5kg" value={name} onChangeText={setName} />
                    <TextField label="Category" placeholder="e.g. Groceries, Electronics" value={category} onChangeText={setCategory} />
                    <TextField label="Brand Name" placeholder="e.g. India Gate, Fortune" value={brand} onChangeText={setBrand} />
                    <TextField label="Unit of Measure" placeholder="e.g. Pcs, Kg, Litre, Box" value={unit} onChangeText={setUnit} />
                    <TextField label="Description" placeholder="Enter product specifications, features, packaging..." value={description} onChangeText={setDescription} multiline />
                  </View>
                )}

                {/* 2. Pricing Tab */}
                {formTab === 'pricing' && (
                  <View style={styles.tabContent}>
                    <TextField label="Retail Sale Price (₹) *" placeholder="e.g. 450.00" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
                    <TextField label="MRP / Strikethrough Price (₹)" placeholder="e.g. 599.00" value={mrp} onChangeText={setMrp} keyboardType="decimal-pad" />
                    <TextField label="Purchase / Cost Price (₹)" placeholder="e.g. 380.00" value={purchaseCost} onChangeText={setPurchaseCost} keyboardType="decimal-pad" />
                    <TextField label="Wholesale Price (₹)" placeholder="e.g. 410.00" value={wholesalePrice} onChangeText={setWholesalePrice} keyboardType="decimal-pad" />
                    <TextField label="GST / Tax Percentage (%)" placeholder="e.g. 18" value={taxRate} onChangeText={setTaxRate} keyboardType="number-pad" />
                  </View>
                )}

                {/* 3. Inventory Tab */}
                {formTab === 'inventory' && (
                  <View style={styles.tabContent}>
                    <TextField label="Available Stock Quantity *" placeholder="e.g. 50" value={stock} onChangeText={setStock} keyboardType="number-pad" />
                    <TextField label="SKU (Stock Keeping Unit)" placeholder="e.g. SKU-RICE-5KG-01" value={sku} onChangeText={setSku} />
                    <TextField label="Barcode (EAN-13 / UPC)" placeholder="e.g. 8901234567890" value={barcode} onChangeText={setBarcode} keyboardType="number-pad" />
                  </View>
                )}

                {/* 4. Media & Video Tab (3 Separate Dedicated Upload & URL Sections) */}
                {formTab === 'media' && (
                  <View style={styles.tabContent}>
                    {/* Media Input Format Selector */}
                    <View style={styles.mediaFormatSelectorBar}>
                      <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Product Media Manager</Text>
                      <View style={styles.formatChipRow}>
                        <TouchableOpacity
                          onPress={() => setMediaInputMode('URL')}
                          style={[
                            styles.formatChip,
                            {
                              backgroundColor: mediaInputMode === 'URL' ? c.primary : theme.isDark ? c.surfaceSecondary : '#F1F5F9',
                              borderColor: mediaInputMode === 'URL' ? c.primary : c.border,
                            },
                          ]}
                        >
                          <Text style={[styles.formatChipText, { color: mediaInputMode === 'URL' ? '#FFF' : c.textSecondary }]}>🌐 URL Mode</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => setMediaInputMode('UPLOAD')}
                          style={[
                            styles.formatChip,
                            {
                              backgroundColor: mediaInputMode === 'UPLOAD' ? c.primary : theme.isDark ? c.surfaceSecondary : '#F1F5F9',
                              borderColor: mediaInputMode === 'UPLOAD' ? c.primary : c.border,
                            },
                          ]}
                        >
                          <Text style={[styles.formatChipText, { color: mediaInputMode === 'UPLOAD' ? '#FFF' : c.textSecondary }]}>📁 File Upload Mode</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* ── SECTION 1: PRIMARY COVER IMAGE ──────────────────────────── */}
                    <Card style={styles.mediaSectionCard}>
                      <View style={styles.sectionHeaderRow}>
                        <ImageIcon size={18} color={c.primary} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.mediaSectionHeading, { color: c.textPrimary }]}>1. Primary Cover Image</Text>
                          <Text style={[styles.mediaSectionSub, { color: c.textMuted }]}>Main photo displayed on product listings & cards</Text>
                        </View>
                        {imageUrl ? <Badge label="MAIN SET" variant="success" size="sm" /> : null}
                      </View>

                      {imageUrl ? (
                        <View style={[styles.primaryPreviewBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : '#F8FAFC', borderColor: c.border }]}>
                          <Image source={{ uri: resolveMediaUrl(imageUrl) || imageUrl }} style={styles.primaryPreviewImg} resizeMode="contain" />
                          <TouchableOpacity onPress={() => setImageUrl('')} style={styles.clearMediaBtn}>
                            <X size={12} color="#FFF" />
                            <Text style={styles.clearMediaBtnText}>Clear Cover</Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}

                      {mediaInputMode === 'UPLOAD' ? (
                        <TouchableOpacity
                          onPress={() => {
                            setUploadTarget('PRIMARY');
                            setPickerInputText(imageUrl || '');
                            setMediaPickerVisible(true);
                          }}
                          style={[styles.separateUploadBtn, { backgroundColor: c.primaryLight, borderColor: c.primary }]}
                          activeOpacity={0.8}
                        >
                          <ImageIcon size={16} color={c.primary} />
                          <Text style={[styles.separateUploadBtnText, { color: c.primary }]}>📁 Upload Primary Cover Image File</Text>
                        </TouchableOpacity>
                      ) : (
                        <TextField
                          label="Primary Image URL"
                          placeholder="https://example.com/product-photo.jpg or /uploads/images/abc.jpg"
                          value={imageUrl}
                          onChangeText={setImageUrl}
                        />
                      )}
                    </Card>

                    {/* ── SECTION 2: ADDITIONAL GALLERY IMAGES ───────────────────── */}
                    <Card style={styles.mediaSectionCard}>
                      <View style={styles.sectionHeaderRow}>
                        <Layers size={18} color={c.accent} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.mediaSectionHeading, { color: c.textPrimary }]}>2. Additional Gallery Images</Text>
                          <Text style={[styles.mediaSectionSub, { color: c.textMuted }]}>Extra detail photos, packaging & alternate angles</Text>
                        </View>
                      </View>

                      {/* Gallery Photo Thumbnails Grid */}
                      {additionalImages ? (
                        <View style={styles.galleryThumbGrid}>
                          {additionalImages.split(',').map((s) => s.trim()).filter(Boolean).map((uri, idx) => (
                            <View key={idx} style={[styles.galleryThumbCard, { borderColor: c.border }]}>
                              <Image source={{ uri: resolveMediaUrl(uri) || uri }} style={styles.galleryThumbImg} resizeMode="cover" />
                              <TouchableOpacity
                                onPress={() => {
                                  const list = additionalImages.split(',').map((s) => s.trim()).filter(Boolean);
                                  list.splice(idx, 1);
                                  setAdditionalImages(list.join(', '));
                                }}
                                style={styles.removeGalleryItemBtn}
                              >
                                <X size={12} color="#FFF" />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => {
                                  // Set this gallery photo as main cover
                                  const list = additionalImages.split(',').map((s) => s.trim()).filter(Boolean);
                                  const oldMain = imageUrl;
                                  setImageUrl(uri);
                                  list.splice(idx, 1);
                                  if (oldMain) list.push(oldMain);
                                  setAdditionalImages(list.join(', '));
                                }}
                                style={styles.makeMainBtn}
                              >
                                <Text style={styles.makeMainBtnText}>Make Cover</Text>
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      ) : null}

                      {mediaInputMode === 'UPLOAD' ? (
                        <TouchableOpacity
                          onPress={() => {
                            setUploadTarget('GALLERY');
                            setPickerInputText('');
                            setMediaPickerVisible(true);
                          }}
                          style={[styles.separateUploadBtn, { backgroundColor: c.accentLight, borderColor: c.accent }]}
                          activeOpacity={0.8}
                        >
                          <Plus size={16} color={c.accent} />
                          <Text style={[styles.separateUploadBtnText, { color: c.accent }]}>➕ Upload Additional Gallery Photo File</Text>
                        </TouchableOpacity>
                      ) : (
                        <TextField
                          label="Additional Gallery URLs (Comma Separated)"
                          placeholder="https://cdn.example.com/img1.jpg, https://cdn.example.com/img2.jpg"
                          value={additionalImages}
                          onChangeText={setAdditionalImages}
                          multiline
                        />
                      )}
                    </Card>

                    {/* ── SECTION 3: PRODUCT DEMONSTRATION VIDEO ──────────────────── */}
                    <Card style={styles.mediaSectionCard}>
                      <View style={styles.sectionHeaderRow}>
                        <Video size={18} color="#E11D48" />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.mediaSectionHeading, { color: c.textPrimary }]}>3. Product Demonstration Video</Text>
                          <Text style={[styles.mediaSectionSub, { color: c.textMuted }]}>Attach video demo, mp4 payload or stream link</Text>
                        </View>
                        {videoUrl ? <Badge label="VIDEO READY" variant="success" size="sm" /> : null}
                      </View>

                      {videoUrl ? (
                        <View style={[styles.videoCardPreview, { backgroundColor: 'rgba(225,29,72,0.08)', borderColor: '#E11D48' }]}>
                          <Video size={22} color="#E11D48" />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.videoTitle, { color: '#E11D48' }]}>Linked Video Stream</Text>
                            <Text style={[styles.videoSubText, { color: c.textMuted }]} numberOfLines={1}>{videoUrl}</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => Linking.openURL(videoUrl).catch(() => Alert.alert('Video', 'Opening video link...'))}
                            style={[styles.playVideoBtn, { backgroundColor: '#E11D48' }]}
                          >
                            <Text style={styles.playVideoBtnText}>▶ Play</Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}

                      {mediaInputMode === 'UPLOAD' ? (
                        <TouchableOpacity
                          onPress={() => {
                            setUploadTarget('VIDEO');
                            setPickerInputText(videoUrl || '');
                            setMediaPickerVisible(true);
                          }}
                          style={[styles.separateUploadBtn, { backgroundColor: 'rgba(225,29,72,0.08)', borderColor: '#E11D48' }]}
                          activeOpacity={0.8}
                        >
                          <Video size={16} color="#E11D48" />
                          <Text style={[styles.separateUploadBtnText, { color: '#E11D48' }]}>🎬 Upload Product Video File</Text>
                        </TouchableOpacity>
                      ) : (
                        <TextField
                          label="Video Stream URL"
                          placeholder="https://example.com/demo.mp4 or YouTube / Vimeo link"
                          value={videoUrl}
                          onChangeText={setVideoUrl}
                        />
                      )}
                    </Card>
                  </View>
                )}
              </ScrollView>

              {/* Footer Submit */}
              <View style={styles.formFooter}>
                <PrimaryButton
                  title={formMode === 'add' ? 'Publish Product to Catalog' : 'Save Changes'}
                  onPress={handleSaveProduct}
                  loading={submitting}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* ── Cross-Platform Media Upload & File Picker Sheet Modal (Android & iOS) ── */}
      <Modal
        visible={mediaPickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMediaPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.formSheet, { backgroundColor: theme.isDark ? c.surface : '#FFFFFF', borderColor: c.border }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ImageIcon size={20} color={c.primary} />
                <Text style={[theme.typography.h3, { color: c.textPrimary }]}>
                  {uploadTarget === 'PRIMARY' ? 'Upload Primary Cover Photo' : uploadTarget === 'GALLERY' ? 'Upload Additional Gallery Photo' : 'Upload Demonstration Video'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setMediaPickerVisible(false)}>
                <X size={22} color={c.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[theme.typography.caption, { color: c.textSecondary, marginBottom: 8 }]}>
                Enter or paste local device file path (`file:///...`), storage URI, or Base64 data string:
              </Text>

              <TextField
                label="Local Device File URI / Storage Path"
                placeholder="file:///storage/emulated/0/DCIM/Camera/photo.jpg or data:image/png;base64,..."
                value={pickerInputText}
                onChangeText={setPickerInputText}
                multiline
              />

              {/* Sample Preset Presets Grid for Quick 1-Tap Attach */}
              <Text style={[theme.typography.caption, { color: c.textSecondary, fontWeight: '700', marginTop: 12, marginBottom: 8 }]}>
                ⚡ Or Select a Sample Preset Asset (1-Tap):
              </Text>

              <View style={styles.presetGrid}>
                {[
                  { name: 'Headphones', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500' },
                  { name: 'Smartwatch', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500' },
                  { name: 'Sneakers', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500' },
                  { name: 'Backpack', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500' },
                  { name: 'Camera', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500' },
                  { name: 'Demo Video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
                ].map((preset, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setPickerInputText(preset.url)}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: pickerInputText === preset.url ? c.primary : theme.isDark ? c.surfaceSecondary : '#F1F5F9',
                        borderColor: pickerInputText === preset.url ? c.primary : c.border,
                      },
                    ]}
                  >
                    <Text style={[styles.presetChipText, { color: pickerInputText === preset.url ? '#FFF' : c.textSecondary }]}>
                      {preset.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ height: 16 }} />

              <PrimaryButton
                title="Attach Selected Media File"
                onPress={() => {
                  if (!pickerInputText.trim()) {
                    Alert.alert('Required', 'Please enter a valid file path or select a preset.');
                    return;
                  }
                  const val = pickerInputText.trim();
                  if (uploadTarget === 'PRIMARY') {
                    setImageUrl(val);
                  } else if (uploadTarget === 'GALLERY') {
                    const list = additionalImages.split(',').map(s => s.trim()).filter(Boolean);
                    list.push(val);
                    setAdditionalImages(list.join(', '));
                  } else {
                    setVideoUrl(val);
                  }
                  setMediaPickerVisible(false);
                }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  filterScroll: {
    flexGrow: 0,
    height: 38,
    marginBottom: 12,
  },
  filterContent: {
    gap: 8,
    alignItems: 'center',
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Detail Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  detailSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    padding: 22,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  closeBtn: {
    padding: 4,
  },
  galleryWrapper: {
    marginBottom: 14,
  },
  mainImageBox: {
    width: '100%',
    height: 190,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  noImageBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    fontSize: 12,
    marginTop: 6,
  },
  thumbStrip: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  thumbBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 2,
    overflow: 'hidden',
    marginRight: 8,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  videoLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    marginBottom: 12,
  },
  videoLinkText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pricingCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 14,
    borderRadius: 16,
    marginBottom: 14,
  },
  priceCol: {
    alignItems: 'center',
  },
  priceColLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  priceColVal: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  specRows: {
    gap: 8,
    marginBottom: 14,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  specValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  descSection: {
    marginBottom: 16,
  },
  descTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  descBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 6,
    marginBottom: 20,
  },

  // Form Sheet
  formSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    padding: 22,
    maxHeight: '90%',
  },
  formTabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  formTabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 9,
  },
  formTabActive: {
    elevation: 2,
  },
  formTabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  formScroll: {
    maxHeight: 380,
  },
  tabContent: {
    gap: 8,
  },
  mediaUploadRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  uploadMediaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 6,
  },
  uploadMediaText: {
    fontSize: 11,
    fontWeight: '700',
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.03)',
    marginVertical: 4,
  },
  previewThumb: {
    width: 42,
    height: 42,
    borderRadius: 8,
  },
  previewText: {
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  formFooter: {
    marginTop: 14,
    marginBottom: 10,
  },
  mediaFormatSelectorBar: {
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  formatChipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  formatChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  formatChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  mediaSectionCard: {
    padding: 12,
    marginVertical: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  mediaSectionHeading: {
    fontSize: 13,
    fontWeight: '700',
  },
  mediaSectionSub: {
    fontSize: 10,
    marginTop: 1,
  },
  primaryPreviewBox: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  primaryPreviewImg: {
    width: '100%',
    height: '100%',
  },
  clearMediaBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(239,68,68,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearMediaBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  separateUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    marginVertical: 4,
  },
  separateUploadBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  galleryThumbGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  galleryThumbCard: {
    width: 74,
    height: 74,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryThumbImg: {
    width: '100%',
    height: '100%',
  },
  removeGalleryItemBtn: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: 'rgba(239,68,68,0.9)',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  makeMainBtn: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  makeMainBtnText: {
    color: '#FFF',
    fontSize: 7,
    fontWeight: '800',
  },
  videoCardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    marginBottom: 8,
  },
  videoTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  videoSubText: {
    fontSize: 10,
    marginTop: 1,
  },
  playVideoBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  playVideoBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  mediaModeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 6,
  },
  mediaModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  mediaModeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  responsiveMediaCard: {
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    marginVertical: 4,
  },
  responsiveMediaPreview: {
    width: '100%',
    height: 140,
    borderRadius: 10,
  },
  mediaMetaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  mediaMetaText: {
    fontSize: 10,
    fontWeight: '700',
  },
  videoPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginTop: 4,
  },
  videoPreviewTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  videoPreviewSub: {
    fontSize: 10,
    marginTop: 1,
  },
  uploadDropzoneLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  dropzoneBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 4,
  },
  dropzoneTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  dropzoneSub: {
    fontSize: 10,
    textAlign: 'center',
  },
  browseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    marginTop: 8,
    gap: 4,
  },
  browseBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  uploadedGalleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  uploadedImageCard: {
    width: 68,
    height: 68,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  uploadedImgThumb: {
    width: '100%',
    height: '100%',
  },
  removeMediaBtn: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: 'rgba(239,68,68,0.85)',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBadgeTag: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  primaryBadgeText: {
    color: '#FFF',
    fontSize: 7,
    fontWeight: '800',
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
