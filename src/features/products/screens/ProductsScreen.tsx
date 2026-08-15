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
  ActivityIndicator,
  useWindowDimensions,
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
  Camera,
  LayoutGrid,
  List as ListIcon,
  TrendingUp,
  AlertTriangle,
  Package,
  IndianRupee,
  Share2,
  Edit2,
  Trash2,
  CheckCircle2,
  ArrowUpDown,
  Filter,
} from 'lucide-react-native';
import { BarcodeScannerModal } from '../../../components/scanner/BarcodeScannerModal';

type SortOption = 'DEFAULT' | 'PRICE_ASC' | 'PRICE_DESC' | 'STOCK_DESC' | 'NAME_ASC';
type StockFilter = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export const ProductsScreen: React.FC = () => {
  const theme = useTheme();
  const c = theme.colors;
  const { width } = useWindowDimensions();

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStockFilter, setSelectedStockFilter] = useState<StockFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('DEFAULT');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Modals
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [scannerModalVisible, setScannerModalVisible] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'search' | 'form'>('search');

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

  // Media Picker Modal State
  const [mediaPickerVisible, setMediaPickerVisible] = useState(false);
  const [uploadTarget, setUploadTarget] = useState<'PRIMARY' | 'GALLERY' | 'VIDEO'>('PRIMARY');
  const [pickerInputText, setPickerInputText] = useState('');

  // Active Gallery Image Index in Detail View
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // Debounce search
  const searchDebounceRef = useRef<any>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(text);
    }, 300);
  }, []);

  const handleProductBarcodeScanned = useCallback((scannedCode: string, matchedProduct?: Product | null) => {
    if (scannerTarget === 'search') {
      setSearchQuery(scannedCode);
      handleSearchChange(scannedCode);
    } else {
      setBarcode(scannedCode);
      if (matchedProduct && !name) {
        setName(matchedProduct.name || '');
      }
    }
  }, [scannerTarget, handleSearchChange, name]);

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

  // Executive KPI Calculations
  const totalSkus = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + (p.stock !== undefined ? p.stock : (p.stock_in_hand || 0)), 0);
  const totalValuation = products.reduce(
    (acc, p) => acc + parseFloat(String(p.price || 0)) * (p.stock !== undefined ? p.stock : (p.stock_in_hand || 0)),
    0
  );
  const lowStockCount = products.filter(
    (p) => (p.stock !== undefined ? p.stock : (p.stock_in_hand || 0)) <= 5
  ).length;

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
        const created = await ProductService.createProduct(jsonPayload);
        setProducts((prev) => [created, ...prev]);
        Alert.alert('Success', 'Product created and listed successfully.');
      } else if (selectedProduct) {
        const updated = await ProductService.updateProduct(selectedProduct.id, jsonPayload);
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
            if (detailModalVisible) setDetailModalVisible(false);
          },
        },
      ]
    );
  };

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'ALL' && p.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      // Stock filter
      const curStock = p.stock !== undefined ? p.stock : (p.stock_in_hand || 0);
      if (selectedStockFilter === 'IN_STOCK' && curStock <= 0) return false;
      if (selectedStockFilter === 'LOW_STOCK' && (curStock > 5 || curStock <= 0)) return false;
      if (selectedStockFilter === 'OUT_OF_STOCK' && curStock > 0) return false;

      return true;
    });

    // Sorting
    switch (sortBy) {
      case 'PRICE_ASC':
        return list.sort((a, b) => parseFloat(String(a.price || 0)) - parseFloat(String(b.price || 0)));
      case 'PRICE_DESC':
        return list.sort((a, b) => parseFloat(String(b.price || 0)) - parseFloat(String(a.price || 0)));
      case 'STOCK_DESC':
        return list.sort((a, b) => (b.stock || 0) - (a.stock || 0));
      case 'NAME_ASC':
        return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      default:
        return list;
    }
  }, [products, selectedCategory, selectedStockFilter, sortBy]);

  // Gallery URL Resolver
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
              <Text style={styles.addBtnText}>Add Product</Text>
            </TouchableOpacity>
          }
        />

        {/* ── 1. Executive Portfolio KPI Metrics Strip ─────────────── */}
        <View style={styles.kpiContainer}>
          <View style={[styles.kpiBox, { backgroundColor: theme.isDark ? '#0F172A' : '#F8FAFC', borderColor: c.border }]}>
            <Package size={14} color={c.primary} style={{ marginBottom: 4 }} />
            <Text style={[styles.kpiValue, { color: c.textPrimary }]}>{totalSkus}</Text>
            <Text style={[styles.kpiLabel, { color: c.textMuted }]}>TOTAL SKUs</Text>
          </View>

          <View style={[styles.kpiBox, { backgroundColor: theme.isDark ? '#0F172A' : '#F8FAFC', borderColor: c.border }]}>
            <Box size={14} color="#10B981" style={{ marginBottom: 4 }} />
            <Text style={[styles.kpiValue, { color: '#10B981' }]}>{totalStockUnits}</Text>
            <Text style={[styles.kpiLabel, { color: c.textMuted }]}>IN STOCK</Text>
          </View>

          <View style={[styles.kpiBox, { backgroundColor: theme.isDark ? '#0F172A' : '#F8FAFC', borderColor: c.border }]}>
            <IndianRupee size={14} color={c.accent} style={{ marginBottom: 4 }} />
            <Text style={[styles.kpiValue, { color: c.textPrimary }]}>
              ₹{(totalValuation / 100000).toFixed(1)}L
            </Text>
            <Text style={[styles.kpiLabel, { color: c.textMuted }]}>VALUATION</Text>
          </View>

          <View style={[styles.kpiBox, { backgroundColor: theme.isDark ? '#0F172A' : '#F8FAFC', borderColor: c.border }]}>
            <AlertTriangle size={14} color={lowStockCount > 0 ? '#EF4444' : '#94A3B8'} style={{ marginBottom: 4 }} />
            <Text style={[styles.kpiValue, { color: lowStockCount > 0 ? '#EF4444' : c.textPrimary }]}>
              {lowStockCount}
            </Text>
            <Text style={[styles.kpiLabel, { color: c.textMuted }]}>LOW STOCK</Text>
          </View>
        </View>

        {/* ── 2. Search & Quick Barcode Scanner Bar ──────────────────── */}
        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? '#0F172A' : '#F8FAFC', borderColor: c.border }]}>
          <Search size={18} color={c.textMuted} />
          <TextInput
            placeholder="Search products by title, SKU, barcode..."
            placeholderTextColor={c.textMuted}
            value={searchQuery}
            onChangeText={handleSearchChange}
            style={[styles.searchInput, { color: c.textPrimary }]}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <X size={16} color={c.textMuted} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={() => {
              setScannerTarget('search');
              setScannerModalVisible(true);
            }}
            style={[styles.scanTriggerBtn, { backgroundColor: theme.isDark ? '#1E293B' : '#EEF2FF', borderColor: c.primary }]}
            activeOpacity={0.7}
          >
            <Barcode size={16} color={c.primary} />
          </TouchableOpacity>
        </View>

        {/* ── 3. Filters & View Mode Switcher Row ───────────────────── */}
        <View style={styles.controlsRow}>
          {/* Stock Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stockFilterScroll}>
            {(['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'] as StockFilter[]).map((stk) => {
              const isSelected = selectedStockFilter === stk;
              const label = stk === 'ALL' ? 'All Stock' : stk === 'IN_STOCK' ? 'In Stock' : stk === 'LOW_STOCK' ? 'Low Stock (≤5)' : 'Out of Stock';
              return (
                <TouchableOpacity
                  key={stk}
                  onPress={() => setSelectedStockFilter(stk)}
                  style={[
                    styles.stockChip,
                    {
                      backgroundColor: isSelected ? c.primary : theme.isDark ? '#0F172A' : '#F1F5F9',
                      borderColor: isSelected ? c.primary : c.border,
                    },
                  ]}
                >
                  <Text style={[styles.stockChipText, { color: isSelected ? '#FFFFFF' : c.textSecondary }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* View Mode Toggle */}
          <View style={[styles.viewModeToggle, { backgroundColor: theme.isDark ? '#0F172A' : '#F1F5F9', borderColor: c.border }]}>
            <TouchableOpacity
              onPress={() => setViewMode('list')}
              style={[styles.viewModeBtn, viewMode === 'list' && { backgroundColor: c.primary }]}
            >
              <ListIcon size={14} color={viewMode === 'list' ? '#FFFFFF' : c.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode('grid')}
              style={[styles.viewModeBtn, viewMode === 'grid' && { backgroundColor: c.primary }]}
            >
              <LayoutGrid size={14} color={viewMode === 'grid' ? '#FFFFFF' : c.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 4. Category Filter Chips ──────────────────────────────── */}
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
                backgroundColor: selectedCategory === 'ALL' ? c.primary : theme.isDark ? '#0F172A' : '#F8FAFC',
                borderColor: selectedCategory === 'ALL' ? c.primary : c.border,
              },
            ]}
          >
            <Text style={[styles.filterChipText, { color: selectedCategory === 'ALL' ? '#FFFFFF' : c.textSecondary }]}>
              All Categories ({products.length})
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
                    backgroundColor: isSelected ? c.primary : theme.isDark ? '#0F172A' : '#F8FAFC',
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

        {/* ── 5. Product Grid / List Showcase ──────────────────────── */}
        {loading && !refreshing ? (
          <DashboardSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchProducts()} />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            title="No Products Found"
            description="Try changing category filters or click '+ Add Product' to register items."
          />
        ) : viewMode === 'grid' ? (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                viewMode="grid"
                onPress={() => handleOpenDetail(item)}
                onEdit={() => handleOpenEdit(item)}
                onDelete={() => handleDeleteProduct(item)}
              />
            )}
          />
        ) : (
          filteredProducts.map((item) => (
            <ProductCard
              key={item.id}
              product={item}
              viewMode="list"
              onPress={() => handleOpenDetail(item)}
              onEdit={() => handleOpenEdit(item)}
              onDelete={() => handleDeleteProduct(item)}
            />
          ))
        )}
      </ScreenContainer>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── PRODUCT DETAIL PREVIEW MODAL SHEET ─────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.detailSheet, { backgroundColor: theme.isDark ? '#0B0F19' : '#FFFFFF', borderColor: c.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.detailHeading, { color: c.textPrimary }]}>Product Specification</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={c.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedProduct && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                {/* Image Gallery Showcase */}
                {(() => {
                  const gallery = getDetailGallery(selectedProduct);
                  if (gallery.length === 0) return null;
                  return (
                    <View style={styles.galleryWrapper}>
                      <Image source={{ uri: gallery[activeImgIndex] || gallery[0] }} style={styles.galleryMainImg} resizeMode="contain" />
                      {gallery.length > 1 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbScroll}>
                          {gallery.map((img, i) => (
                            <TouchableOpacity
                              key={`thumb-${i}`}
                              onPress={() => setActiveImgIndex(i)}
                              style={[
                                styles.thumbBtn,
                                { borderColor: activeImgIndex === i ? c.primary : c.border },
                              ]}
                            >
                              <Image source={{ uri: img }} style={styles.thumbImg} resizeMode="cover" />
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  );
                })()}

                {/* Product Title & Brand */}
                <Text style={[styles.detailTitle, { color: c.textPrimary }]}>{selectedProduct.name}</Text>
                {selectedProduct.brand && (
                  <Text style={[styles.detailBrand, { color: c.primary }]}>Brand: {selectedProduct.brand}</Text>
                )}

                {/* Price & Stock Matrix Grid */}
                <View style={[styles.priceMatrixCard, { backgroundColor: theme.isDark ? '#0F172A' : '#F8FAFC', borderColor: c.border }]}>
                  <View style={styles.priceMatrixRow}>
                    <View style={styles.matrixCol}>
                      <Text style={[styles.matrixLabel, { color: c.textMuted }]}>Sale Price</Text>
                      <Text style={[styles.matrixVal, { color: c.primary }]}>
                        ₹{parseFloat(String(selectedProduct.price || 0)).toFixed(2)}
                      </Text>
                    </View>
                    {selectedProduct.compare_at_price && (
                      <View style={styles.matrixCol}>
                        <Text style={[styles.matrixLabel, { color: c.textMuted }]}>MRP Price</Text>
                        <Text style={[styles.matrixVal, { color: c.textSecondary, textDecorationLine: 'line-through' }]}>
                          ₹{parseFloat(String(selectedProduct.compare_at_price)).toFixed(2)}
                        </Text>
                      </View>
                    )}
                    {selectedProduct.purchase_cost && (
                      <View style={styles.matrixCol}>
                        <Text style={[styles.matrixLabel, { color: c.textMuted }]}>Cost Price</Text>
                        <Text style={[styles.matrixVal, { color: '#F59E0B' }]}>
                          ₹{parseFloat(String(selectedProduct.purchase_cost)).toFixed(2)}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.matrixDivider} />

                  <View style={styles.priceMatrixRow}>
                    <View style={styles.matrixCol}>
                      <Text style={[styles.matrixLabel, { color: c.textMuted }]}>Available Stock</Text>
                      <Text style={[styles.matrixVal, { color: '#10B981' }]}>
                        {selectedProduct.stock || 0} {selectedProduct.unit || 'Units'}
                      </Text>
                    </View>
                    <View style={styles.matrixCol}>
                      <Text style={[styles.matrixLabel, { color: c.textMuted }]}>SKU Code</Text>
                      <Text style={[styles.matrixVal, { color: c.textSecondary }]}>
                        {selectedProduct.sku || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.matrixCol}>
                      <Text style={[styles.matrixLabel, { color: c.textMuted }]}>Barcode</Text>
                      <Text style={[styles.matrixVal, { color: c.textSecondary }]}>
                        {selectedProduct.barcode || 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Description */}
                {selectedProduct.description && (
                  <View style={styles.descSection}>
                    <Text style={[styles.descTitle, { color: c.textPrimary }]}>Description</Text>
                    <Text style={[styles.descText, { color: c.textSecondary }]}>{selectedProduct.description}</Text>
                  </View>
                )}

                {/* Quick Action Footer */}
                <View style={styles.detailActionsRow}>
                  <TouchableOpacity
                    onPress={() => {
                      setDetailModalVisible(false);
                      handleOpenEdit(selectedProduct);
                    }}
                    style={[styles.detailEditBtn, { backgroundColor: c.primary }]}
                    activeOpacity={0.85}
                  >
                    <Edit2 size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.detailEditBtnText}>Edit Product</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteProduct(selectedProduct)}
                    style={[styles.detailDeleteBtn, { backgroundColor: theme.isDark ? '#1E293B' : '#FEE2E2', borderColor: '#EF4444' }]}
                    activeOpacity={0.85}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── 4-TAB ADD / EDIT PRODUCT WIZARD MODAL ──────────────────── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={formModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFormModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.formSheet, { backgroundColor: theme.isDark ? '#0B0F19' : '#FFFFFF', borderColor: c.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.detailHeading, { color: c.textPrimary }]}>
                {formMode === 'add' ? 'Register New Product' : 'Edit Product'}
              </Text>
              <TouchableOpacity onPress={() => setFormModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={c.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Form Step Tabs */}
            <View style={styles.tabBar}>
              {(['basic', 'pricing', 'inventory', 'media'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setFormTab(tab)}
                  style={[
                    styles.tabItem,
                    {
                      borderBottomColor: formTab === tab ? c.primary : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color: formTab === tab ? c.primary : c.textMuted,
                        fontWeight: formTab === tab ? '800' : '600',
                      },
                    ]}
                  >
                    {tab.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
              {/* Tab 1: Basic */}
              {formTab === 'basic' && (
                <View style={styles.tabContent}>
                  <TextField label="Product Name *" placeholder="e.g. Basmati Rice 5kg" value={name} onChangeText={setName} />
                  <TextField label="Category" placeholder="e.g. Groceries" value={category} onChangeText={setCategory} />
                  <TextField label="Brand / Manufacturer" placeholder="e.g. Royal Harvest" value={brand} onChangeText={setBrand} />
                  <TextField label="Unit of Measure" placeholder="e.g. Pcs, Kg, Ltr, Box" value={unit} onChangeText={setUnit} />
                  <TextField label="Product Description" placeholder="Full product details and specifications..." value={description} onChangeText={setDescription} multiline numberOfLines={3} />
                </View>
              )}

              {/* Tab 2: Pricing */}
              {formTab === 'pricing' && (
                <View style={styles.tabContent}>
                  <TextField label="Retail Sale Price (₹) *" placeholder="e.g. 450.00" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
                  <TextField label="MRP / Strikethrough Price (₹)" placeholder="e.g. 599.00" value={mrp} onChangeText={setMrp} keyboardType="decimal-pad" />
                  <TextField label="Purchase / Cost Price (₹)" placeholder="e.g. 380.00" value={purchaseCost} onChangeText={setPurchaseCost} keyboardType="decimal-pad" />
                  <TextField label="Wholesale Price (₹)" placeholder="e.g. 410.00" value={wholesalePrice} onChangeText={setWholesalePrice} keyboardType="decimal-pad" />
                  <TextField label="GST / Tax Rate (%)" placeholder="e.g. 18" value={taxRate} onChangeText={setTaxRate} keyboardType="number-pad" />
                </View>
              )}

              {/* Tab 3: Inventory */}
              {formTab === 'inventory' && (
                <View style={styles.tabContent}>
                  <TextField label="Available Stock Quantity *" placeholder="e.g. 50" value={stock} onChangeText={setStock} keyboardType="number-pad" />
                  <TextField label="SKU (Stock Keeping Unit)" placeholder="e.g. SKU-RICE-5KG-01" value={sku} onChangeText={setSku} />
                  <View style={styles.formBarcodeRow}>
                    <View style={{ flex: 1 }}>
                      <TextField label="Barcode (EAN-13 / UPC)" placeholder="e.g. 8901234567890" value={barcode} onChangeText={setBarcode} keyboardType="number-pad" />
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setScannerTarget('form');
                        setScannerModalVisible(true);
                      }}
                      style={[styles.formBarcodeScanBtn, { backgroundColor: theme.isDark ? '#1E293B' : '#EEF2FF', borderColor: c.primary }]}
                      activeOpacity={0.7}
                    >
                      <Barcode size={18} color={c.primary} />
                      <Text style={[styles.formBarcodeScanText, { color: c.primary }]}>Scan</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Tab 4: Media */}
              {formTab === 'media' && (
                <View style={styles.tabContent}>
                  <TextField label="Primary Cover Image URL" placeholder="https://images.unsplash.com/photo-..." value={imageUrl} onChangeText={setImageUrl} />
                  <TextField label="Additional Image URLs (Comma Separated)" placeholder="https://..., https://..." value={additionalImages} onChangeText={setAdditionalImages} multiline numberOfLines={2} />
                  <TextField label="Product Demo Video URL" placeholder="https://example.com/demo.mp4" value={videoUrl} onChangeText={setVideoUrl} />
                </View>
              )}

              <View style={styles.formActionsRow}>
                <PrimaryButton
                  title={submitting ? 'Saving...' : formMode === 'add' ? 'Create & List Product' : 'Save Changes'}
                  onPress={handleSaveProduct}
                  disabled={submitting}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Barcode & QR Scanner Modal */}
      <BarcodeScannerModal
        visible={scannerModalVisible}
        onClose={() => setScannerModalVisible(false)}
        onScan={handleProductBarcodeScanned}
        title={scannerTarget === 'search' ? 'Search Catalog by Barcode' : 'Scan Product Barcode'}
        subtitle="Align barcode within frame to auto-detect"
      />
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
  kpiContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  kpiBox: {
    flex: 1,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  kpiLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    height: 46,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  scanTriggerBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  stockFilterScroll: {
    gap: 6,
  },
  stockChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  stockChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  viewModeToggle: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 2,
  },
  viewModeBtn: {
    padding: 6,
    borderRadius: 8,
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
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  detailSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    padding: 20,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  detailHeading: {
    fontSize: 17,
    fontWeight: '900',
  },
  closeBtn: {
    padding: 4,
  },
  galleryWrapper: {
    marginBottom: 14,
    alignItems: 'center',
  },
  galleryMainImg: {
    width: '100%',
    height: 180,
    borderRadius: 16,
  },
  thumbScroll: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 6,
  },
  thumbBtn: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 2,
    overflow: 'hidden',
    marginRight: 6,
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 2,
  },
  detailBrand: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 12,
  },
  priceMatrixCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginVertical: 12,
  },
  priceMatrixRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  matrixCol: {
    alignItems: 'center',
    flex: 1,
  },
  matrixLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  matrixVal: {
    fontSize: 13,
    fontWeight: '900',
  },
  matrixDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 10,
  },
  descSection: {
    marginVertical: 10,
  },
  descTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  descText: {
    fontSize: 12,
    lineHeight: 18,
  },
  detailActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  detailEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  detailEditBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  detailDeleteBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Form Sheet
  formSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    padding: 20,
    maxHeight: '90%',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 14,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  formScroll: {
    paddingBottom: 20,
  },
  tabContent: {
    gap: 4,
  },
  formBarcodeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  formBarcodeScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 6,
  },
  formBarcodeScanText: {
    fontSize: 12,
    fontWeight: '800',
  },
  formActionsRow: {
    marginTop: 16,
  },
});
