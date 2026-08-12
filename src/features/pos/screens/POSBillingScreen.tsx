import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView,
  Alert, TextInput, FlatList, KeyboardAvoidingView, Platform,
} from "react-native";
import { ScreenContainer } from "../../../components/common/ScreenContainer";
import { Header } from "../../../components/common/Header";
import { Card } from "../../../components/common/Card";
import { Badge } from "../../../components/common/Badge";
import { PrimaryButton } from "../../../components/buttons/PrimaryButton";
import { useTheme } from "../../../theme/theme";
import { axiosClient } from "../../../api/axiosClient";
import { ENDPOINTS } from "../../../api/endpoints";
import { normalizeApiResponse } from "../../../api/responseNormalizer";
import { ShoppingCart, Search, Plus, Minus, Trash2, X, Receipt, CreditCard, Smartphone, Banknote, CheckCircle } from "lucide-react-native";

interface POSProduct { id: number | string; name: string; price: number; sku?: string; stock?: number; category_name?: string; }
interface CartItem { product: POSProduct; quantity: number; }

export const POSBillingScreen: React.FC = () => {
  const theme = useTheme();
  const c = theme.colors;
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "UPI">("CASH");
  const [customerName, setCustomerName] = useState("");
  const [discountPct, setDiscountPct] = useState("");
  const [processing, setProcessing] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmt = discountPct ? (subtotal * parseFloat(discountPct)) / 100 : 0;
  const total = subtotal - discountAmt;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`${ENDPOINTS.PRODUCTS}?limit=100&status=active`);
      const data = normalizeApiResponse<POSProduct[]>(res.data);
      setProducts(Array.isArray(data.data) ? data.data : []);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProducts(); }, []);

  const addToCart = (product: POSProduct) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: number | string, delta: number) => {
    setCart(prev => {
      const updated = prev.map(i => i.product.id === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i);
      return updated.filter(i => i.quantity > 0);
    });
  };

  const removeFromCart = (productId: number | string) => setCart(prev => prev.filter(i => i.product.id !== productId));
  const clearCart = () => Alert.alert("Clear Cart", "Remove all items?", [{ text: "Cancel", style: "cancel" }, { text: "Clear", style: "destructive", onPress: () => setCart([]) }]);

  const handleCheckout = async () => {
    if (cart.length === 0) { Alert.alert("Empty Cart", "Add items before checkout."); return; }
    setProcessing(true);
    try {
      const res = await axiosClient.post(ENDPOINTS.POS_BILLING_CREATE, {
        items: cart.map(i => ({ product_id: i.product.id, quantity: i.quantity, price: i.product.price })),
        customer_name: customerName || undefined,
        payment: { method: paymentMethod, status: "PAID" },
        discount_percentage: discountPct ? parseFloat(discountPct) : 0,
      });
      const data = normalizeApiResponse<any>(res.data);
      setLastOrder(data.data || { total_amount: total, order_number: "POS-" + Date.now() });
      setCart([]); setCheckoutModal(false); setCustomerName(""); setDiscountPct("");
      setSuccessModal(true);
    } catch (e: any) { Alert.alert("Checkout Failed", e.message || "Please try again."); }
    finally { setProcessing(false); }
  };

  const filtered = products.filter(p => !search.trim() || String(p.name || "").toLowerCase().includes(search.toLowerCase()) || String(p.sku || "").toLowerCase().includes(search.toLowerCase()));

  const PAY_METHODS = [{ key: "CASH", label: "Cash", icon: <Banknote size={18} color={paymentMethod === "CASH" ? "#FFF" : c.textSecondary} /> },
    { key: "CARD", label: "Card", icon: <CreditCard size={18} color={paymentMethod === "CARD" ? "#FFF" : c.textSecondary} /> },
    { key: "UPI", label: "UPI", icon: <Smartphone size={18} color={paymentMethod === "UPI" ? "#FFF" : c.textSecondary} /> }];

  return (
    <View style={{ flex: 1, backgroundColor: theme.isDark ? c.background : "#F8FAFC" }}>
      <View style={[styles.posHeader, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderBottomColor: c.border }]}>
        <Text style={[styles.posTitle, { color: c.textPrimary }]}>POS Billing</Text>
        <TouchableOpacity onPress={() => setCheckoutModal(true)} style={[styles.cartBtn, { backgroundColor: c.primary }]} activeOpacity={0.8}>
          <ShoppingCart size={18} color="#FFF" />
          {cartCount > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartCount}</Text></View>}
          <Text style={styles.cartBtnText}>{cartCount > 0 ? `\u20B9${total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "Cart"}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBar, { backgroundColor: theme.isDark ? c.surfaceSecondary : "#FFF", borderColor: c.border }]}>
        <Search size={17} color={c.textMuted} />
        <TextInput placeholder="Search products by name or SKU..." placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} style={[styles.searchInput, { color: c.textPrimary }]} />
        {search ? <TouchableOpacity onPress={() => setSearch("")}><X size={15} color={c.textMuted} /></TouchableOpacity> : null}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}><Text style={{ color: c.textMuted }}>Loading products...</Text></View>
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.productGrid}
          renderItem={({ item }) => {
            const inCart = cart.find(i => i.product.id === item.id);
            return (
              <TouchableOpacity style={[styles.productCard, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: inCart ? c.primary : c.border }]} onPress={() => addToCart(item)} activeOpacity={0.85}>
                <Text style={[styles.productName, { color: c.textPrimary }]} numberOfLines={2}>{item.name}</Text>
                {item.category_name && <Text style={[styles.productCat, { color: c.textMuted }]}>{item.category_name}</Text>}
                <Text style={[styles.productPrice, { color: c.primary }]}>{`\u20B9${item.price.toLocaleString("en-IN")}`}</Text>
                {item.stock !== undefined && <Text style={[styles.stock, { color: item.stock < 5 ? c.error : c.textMuted }]}>Stock: {item.stock}</Text>}
                {inCart ? (
                  <View style={[styles.qtyControls, { backgroundColor: c.primaryLight }]}>
                    <TouchableOpacity onPress={() => updateQty(item.id, -1)}><Minus size={14} color={c.primary} /></TouchableOpacity>
                    <Text style={[styles.qtyText, { color: c.primary }]}>{inCart.quantity}</Text>
                    <TouchableOpacity onPress={() => updateQty(item.id, 1)}><Plus size={14} color={c.primary} /></TouchableOpacity>
                  </View>
                ) : (
                  <View style={[styles.addProductBtn, { backgroundColor: c.primaryLight }]}>
                    <Plus size={14} color={c.primary} /><Text style={[styles.addProductBtnText, { color: c.primary }]}>Add</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      <Modal visible={checkoutModal} animationType="slide" transparent onRequestClose={() => setCheckoutModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, justifyContent: "flex-end" }}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
              <View style={styles.modalHeader}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: c.textPrimary }}>Checkout</Text>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  {cart.length > 0 && <TouchableOpacity onPress={clearCart}><Trash2 size={18} color={c.error} /></TouchableOpacity>}
                  <TouchableOpacity onPress={() => setCheckoutModal(false)}><X size={22} color={c.textMuted} /></TouchableOpacity>
                </View>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 100 }}>
                {cart.map(item => (
                  <View key={String(item.product.id)} style={styles.cartItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cartItemName, { color: c.textPrimary }]}>{item.product.name}</Text>
                      <Text style={[styles.cartItemPrice, { color: c.textMuted }]}>{`\u20B9${item.product.price.toLocaleString("en-IN")} x ${item.quantity}`}</Text>
                    </View>
                    <View style={styles.qtyControls2}>
                      <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: c.primaryLight }]} onPress={() => updateQty(item.product.id, -1)}><Minus size={12} color={c.primary} /></TouchableOpacity>
                      <Text style={[styles.qtyNum, { color: c.textPrimary }]}>{item.quantity}</Text>
                      <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: c.primaryLight }]} onPress={() => updateQty(item.product.id, 1)}><Plus size={12} color={c.primary} /></TouchableOpacity>
                    </View>
                    <Text style={[styles.cartItemTotal, { color: c.primary }]}>{`\u20B9${(item.product.price * item.quantity).toLocaleString("en-IN")}`}</Text>
                  </View>
                ))}

                <View style={[styles.divider, { backgroundColor: c.border }]} />

                <TextInput placeholder="Customer name (optional)" placeholderTextColor={c.textMuted} value={customerName} onChangeText={setCustomerName} style={[styles.customerInput, { borderColor: c.border, color: c.textPrimary, backgroundColor: theme.isDark ? c.surfaceSecondary : "#F8FAFC" }]} />
                <TextInput placeholder="Discount %" placeholderTextColor={c.textMuted} value={discountPct} onChangeText={setDiscountPct} keyboardType="numeric" style={[styles.customerInput, { borderColor: c.border, color: c.textPrimary, backgroundColor: theme.isDark ? c.surfaceSecondary : "#F8FAFC" }]} />

                <Text style={[styles.payLabel, { color: c.textSecondary }]}>Payment Method:</Text>
                <View style={styles.payMethods}>
                  {PAY_METHODS.map(m => (
                    <TouchableOpacity key={m.key} onPress={() => setPaymentMethod(m.key as any)} style={[styles.payMethodBtn, { backgroundColor: paymentMethod === m.key ? c.primary : (theme.isDark ? c.surfaceSecondary : "#F1F5F9"), borderColor: paymentMethod === m.key ? c.primary : c.border }]}>
                      {m.icon}
                      <Text style={[styles.payMethodText, { color: paymentMethod === m.key ? "#FFF" : c.textSecondary }]}>{m.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={[styles.totalBox, { backgroundColor: c.primaryLight }]}>
                  <View style={styles.totalRow}><Text style={[styles.totalLabel, { color: c.primary }]}>Subtotal</Text><Text style={[styles.totalVal, { color: c.primary }]}>{`\u20B9${subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}</Text></View>
                  {discountAmt > 0 && <View style={styles.totalRow}><Text style={[styles.totalLabel, { color: c.success }]}>Discount ({discountPct}%)</Text><Text style={[styles.totalVal, { color: c.success }]}>-{`\u20B9${discountAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}</Text></View>}
                  <View style={[styles.totalRow, styles.grandTotalRow]}><Text style={[styles.grandTotalLabel, { color: c.primary }]}>TOTAL</Text><Text style={[styles.grandTotalVal, { color: c.primary }]}>{`\u20B9${total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}</Text></View>
                </View>
              </ScrollView>
              <PrimaryButton title={`Charge \u20B9${total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`} onPress={handleCheckout} loading={processing} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={successModal} animationType="fade" transparent onRequestClose={() => setSuccessModal(false)}>
        <View style={[styles.modalOverlay, { alignItems: "center", justifyContent: "center" }]}>
          <View style={[styles.successCard, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
            <View style={[styles.successIcon, { backgroundColor: c.successLight }]}><CheckCircle size={36} color={c.success} /></View>
            <Text style={[styles.successTitle, { color: c.textPrimary }]}>Order Placed!</Text>
            {lastOrder && (
              <>
                <Text style={[styles.successOrder, { color: c.textMuted }]}>Order #{lastOrder.order_number || lastOrder.id}</Text>
                <Text style={[styles.successAmount, { color: c.primary }]}>{`\u20B9${(lastOrder.total_amount || total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}</Text>
              </>
            )}
            <TouchableOpacity style={[styles.successBtn, { backgroundColor: c.primary }]} onPress={() => setSuccessModal(false)}>
              <Text style={styles.successBtnText}>New Sale</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  posHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, borderBottomWidth: 1 },
  posTitle: { fontSize: 20, fontWeight: "800" },
  cartBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, gap: 6, position: "relative" },
  cartBadge: { position: "absolute", top: -4, right: -4, backgroundColor: "#EF4444", width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  cartBadgeText: { color: "#FFF", fontSize: 9, fontWeight: "800" },
  cartBtnText: { color: "#FFF", fontSize: 13, fontWeight: "800" },
  searchBar: { flexDirection: "row", alignItems: "center", margin: 12, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, height: 46, gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  productGrid: { padding: 8 },
  productCard: { flex: 1, margin: 6, padding: 14, borderRadius: 16, borderWidth: 1.5, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  productName: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
  productCat: { fontSize: 10, marginBottom: 4 },
  productPrice: { fontSize: 15, fontWeight: "800", marginBottom: 6 },
  stock: { fontSize: 10, marginBottom: 8 },
  qtyControls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  qtyText: { fontSize: 14, fontWeight: "800" },
  addProductBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 7, borderRadius: 8, gap: 4 },
  addProductBtnText: { fontSize: 12, fontWeight: "700" },
  cartItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(148,163,184,0.2)" },
  cartItemName: { fontSize: 13, fontWeight: "600" },
  cartItemPrice: { fontSize: 11, marginTop: 2 },
  qtyControls2: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: { width: 24, height: 24, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  qtyNum: { fontSize: 13, fontWeight: "700", minWidth: 20, textAlign: "center" },
  cartItemTotal: { fontSize: 13, fontWeight: "800", minWidth: 70, textAlign: "right" },
  divider: { height: 1, marginVertical: 12 },
  customerInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, marginBottom: 8 },
  payLabel: { fontSize: 12, fontWeight: "700", marginBottom: 8 },
  payMethods: { flexDirection: "row", gap: 8, marginBottom: 12 },
  payMethodBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 6 },
  payMethodText: { fontSize: 12, fontWeight: "700" },
  totalBox: { borderRadius: 14, padding: 14, gap: 6 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 13, fontWeight: "500" },
  totalVal: { fontSize: 13, fontWeight: "700" },
  grandTotalRow: { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: "rgba(99,102,241,0.2)" },
  grandTotalLabel: { fontSize: 15, fontWeight: "800" },
  grandTotalVal: { fontSize: 20, fontWeight: "800" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, padding: 22, maxHeight: "92%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  successCard: { width: "82%", borderRadius: 24, borderWidth: 1, padding: 28, alignItems: "center" },
  successIcon: { width: 72, height: 72, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: "800", marginBottom: 4 },
  successOrder: { fontSize: 13, marginBottom: 4 },
  successAmount: { fontSize: 28, fontWeight: "800", marginBottom: 20 },
  successBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  successBtnText: { color: "#FFF", fontSize: 15, fontWeight: "800" },
});