import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { ScreenContainer } from "../../../components/common/ScreenContainer";
import { Header } from "../../../components/common/Header";
import { Card } from "../../../components/common/Card";
import { Badge } from "../../../components/common/Badge";
import { TextField } from "../../../components/inputs/TextField";
import { PrimaryButton } from "../../../components/buttons/PrimaryButton";
import { DashboardSkeleton } from "../../../components/skeletons/SkeletonLoader";
import { EmptyState, ErrorState } from "../../../components/common/States";
import { useTheme } from "../../../theme/theme";
import { useAuthStore } from "../../../store/authStore";
import { axiosClient } from "../../../api/axiosClient";
import { ENDPOINTS } from "../../../api/endpoints";
import {
  List,
  Plus,
  X,
  Search,
  Trash2,
  Edit3,
  Palette,
  CheckCircle2,
  Layers,
  Sparkles,
  ArrowUpDown,
  Tag,
  Code2,
  Building2,
  Lock,
} from "lucide-react-native";
import { ProductAttribute } from "./ProductAttributesScreen";

export interface ProductAttributeValue {
  Id: number | string;
  id?: number | string;
  CompanyId?: number;
  ProductAttributeId: number | string;
  attribute_id?: number | string;
  AttributeValueCode: string;
  code?: string;
  Name: string;
  name?: string;
  attribute_name?: string;
  product_ids?: number[];
  CreatedAt?: string;
  UpdatedAt?: string;
  ProductAttributeValueTranslations?: Array<{ LanguagesId: number | null; Name: string }>;
}

const COLOR_PRESETS = [
  { name: "Navy Blue", hex: "#1E3A8A" },
  { name: "Royal Blue", hex: "#2563EB" },
  { name: "Emerald Green", hex: "#059669" },
  { name: "Crimson Red", hex: "#DC2626" },
  { name: "Amber Gold", hex: "#D97706" },
  { name: "Amethyst Purple", hex: "#7C3AED" },
  { name: "Rose Pink", hex: "#E11D48" },
  { name: "Teal Cyan", hex: "#0D9488" },
  { name: "Charcoal Black", hex: "#111827" },
  { name: "Slate Grey", hex: "#64748B" },
  { name: "Pure White", hex: "#FFFFFF" },
];

export const AttributeValuesScreen: React.FC<{ route?: any; navigation?: any }> = ({ route, navigation }) => {
  const theme = useTheme();
  const c = theme.colors;
  const { width } = useWindowDimensions();
  const user = useAuthStore((state) => state.user);

  const companyName = user?.officeBranch || "Main Enterprise Corp";
  const defaultCompanyId = 1;

  const initialAttributeId = route?.params?.attributeId || "ALL";

  // State
  const [values, setValues] = useState<ProductAttributeValue[]>([]);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [selectedAttributeFilter, setSelectedAttributeFilter] = useState<string | number>(initialAttributeId);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Sorting
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"Id" | "AttributeValueCode" | "Name" | "CreatedAt">("Id");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedVal, setSelectedVal] = useState<ProductAttributeValue | null>(null);

  // Specific API Required Fields
  const [productAttributeId, setProductAttributeId] = useState<string | number | null>(null);
  const [name, setName] = useState("");
  const [attributeValueCode, setAttributeValueCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchValuesAndAttributes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [valRes, attrRes] = await Promise.all([
        axiosClient.get(ENDPOINTS.PRODUCT_ATTRIBUTE_VALUES, {
          params: {
            page: 1,
            limit: 100,
            ProductAttributeId: selectedAttributeFilter !== "ALL" ? selectedAttributeFilter : undefined,
            search: search.trim() || undefined,
            sortBy,
            sortOrder,
          },
        }).catch(() => ({ data: { data: { data: [] } } })),
        axiosClient.get(ENDPOINTS.PRODUCT_ATTRIBUTES, {
          params: { page: 1, limit: 100 },
        }).catch(() => ({ data: { data: { data: [] } } })),
      ]);

      const valRaw = Array.isArray(valRes.data?.data?.data)
        ? valRes.data.data.data
        : Array.isArray(valRes.data?.data)
        ? valRes.data.data
        : Array.isArray(valRes.data)
        ? valRes.data
        : [];

      setTotalItems(valRes.data?.data?.totalItems || valRaw.length);

      const attrRaw = Array.isArray(attrRes.data?.data?.data)
        ? attrRes.data.data.data
        : Array.isArray(attrRes.data?.data)
        ? attrRes.data.data
        : Array.isArray(attrRes.data)
        ? attrRes.data
        : [];

      const formattedAttrs: ProductAttribute[] = attrRaw.map((a: any) => ({
        Id: a.Id || a.id,
        id: a.Id || a.id,
        Name: a.Name || a.name || "Attribute",
        name: a.Name || a.name || "Attribute",
        AttributeNameCode: a.AttributeNameCode || a.code || "",
      }));

      const formattedVals: ProductAttributeValue[] = valRaw.map((v: any) => {
        const pAttr = formattedAttrs.find((a) => String(a.Id) === String(v.ProductAttributeId || v.attribute_id));
        return {
          Id: v.Id || v.id,
          id: v.Id || v.id,
          CompanyId: v.CompanyId ?? defaultCompanyId,
          ProductAttributeId: v.ProductAttributeId || v.attribute_id,
          attribute_id: v.ProductAttributeId || v.attribute_id,
          AttributeValueCode: v.AttributeValueCode || v.code || v.ColorHexCode || "",
          code: v.AttributeValueCode || v.code || v.ColorHexCode || "",
          Name: v.Name || v.name || v.value || "Unnamed Value",
          name: v.Name || v.name || v.value || "Unnamed Value",
          attribute_name: v.attribute_name || pAttr?.Name || "",
          product_ids: Array.isArray(v.product_ids) ? v.product_ids : [],
          CreatedAt: v.CreatedAt || v.created_at,
          UpdatedAt: v.UpdatedAt || v.updated_at,
          ProductAttributeValueTranslations: v.ProductAttributeValueTranslations || [
            { LanguagesId: null, Name: v.Name || v.name || v.value },
          ],
        };
      });

      setValues(formattedVals);
      setAttributes(formattedAttrs);

      if (!productAttributeId && formattedAttrs.length > 0) {
        setProductAttributeId(formattedAttrs[0].Id);
      }
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Failed to load attribute values");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedAttributeFilter, search, sortBy, sortOrder, productAttributeId]);

  useEffect(() => {
    fetchValuesAndAttributes();
  }, [fetchValuesAndAttributes]);

  // Executive KPI Counts
  const totalValues = totalItems || values.length;
  const colorSwatchCount = values.filter((v) => v.AttributeValueCode?.startsWith("#")).length;
  const linkedAttributesCount = attributes.length;

  const openAddModal = () => {
    setModalMode("add");
    setSelectedVal(null);
    setName("");
    setAttributeValueCode("");
    if (attributes.length > 0 && selectedAttributeFilter !== "ALL") {
      setProductAttributeId(selectedAttributeFilter);
    } else if (attributes.length > 0) {
      setProductAttributeId(attributes[0].Id);
    }
    setModalVisible(true);
  };

  const openEditModal = (item: ProductAttributeValue) => {
    setModalMode("edit");
    setSelectedVal(item);
    setName(item.Name);
    setAttributeValueCode(item.AttributeValueCode || "");
    setProductAttributeId(item.ProductAttributeId || (attributes[0]?.Id ?? null));
    setModalVisible(true);
  };

  const handleSelectColorPreset = (preset: { name: string; hex: string }) => {
    setAttributeValueCode(preset.hex);
    if (!name || COLOR_PRESETS.some((p) => p.name === name)) {
      setName(preset.name);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Required Field", "Please enter the Option Value Name.");
      return;
    }
    if (!productAttributeId) {
      Alert.alert("Required Field", "Please select a target Product Attribute.");
      return;
    }

    setSubmitting(true);
    try {
      const generatedCode = attributeValueCode.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");

      const payload = {
        ProductAttributeId: Number(productAttributeId),
        attribute_id: Number(productAttributeId),
        Name: name.trim(),
        name: name.trim(),
        Value: name.trim(),
        value: name.trim(),
        AttributeValueCode: generatedCode,
        code: generatedCode,
        ColorHexCode: attributeValueCode.trim(),
        CompanyId: defaultCompanyId,
        ProductAttributeValueTranslations: [
          { LanguagesId: null, Name: name.trim() },
        ],
        product_ids: selectedVal?.product_ids || [],
      };

      if (modalMode === "add") {
        await axiosClient.post(ENDPOINTS.PRODUCT_ATTRIBUTE_VALUES, payload);
        Alert.alert("Success", `Option value "${name}" added successfully.`);
      } else if (selectedVal) {
        await axiosClient.put(ENDPOINTS.PRODUCT_ATTRIBUTE_VALUE_BY_ID(selectedVal.Id), payload);
        Alert.alert("Success", `Option value "${name}" updated successfully.`);
      }

      setModalVisible(false);
      fetchValuesAndAttributes(true);
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || e.message || "Failed to save option value.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (item: ProductAttributeValue) => {
    Alert.alert(
      "Delete Option Value",
      `Delete "${item.Name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await axiosClient.delete(ENDPOINTS.PRODUCT_ATTRIBUTE_VALUE_BY_ID(item.Id));
              Alert.alert("Deleted", "Option value deleted successfully.");
              fetchValuesAndAttributes(true);
            } catch (e: any) {
              Alert.alert("Delete Failed", e.response?.data?.message || e.message || "Cannot delete value.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchValuesAndAttributes(true)}>
        <Header
          title="Attribute Values"
          subtitle={`${totalValues} Configurable Option Values`}
          rightAction={
            <TouchableOpacity
              onPress={openAddModal}
              style={[styles.addBtn, { backgroundColor: c.primary }]}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.addBtnText}>Add Value</Text>
            </TouchableOpacity>
          }
        />

        {/* ── 1. Executive Values KPI Strip ────────────────────────── */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiBox, { backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC", borderColor: c.border }]}>
            <List size={14} color={c.primary} style={{ marginBottom: 4 }} />
            <Text style={[styles.kpiVal, { color: c.textPrimary }]}>{totalValues}</Text>
            <Text style={[styles.kpiSub, { color: c.textMuted }]}>TOTAL VALUES</Text>
          </View>

          <View style={[styles.kpiBox, { backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC", borderColor: c.border }]}>
            <Palette size={14} color="#A855F7" style={{ marginBottom: 4 }} />
            <Text style={[styles.kpiVal, { color: "#A855F7" }]}>{colorSwatchCount}</Text>
            <Text style={[styles.kpiSub, { color: c.textMuted }]}>COLOR HEX</Text>
          </View>

          <View style={[styles.kpiBox, { backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC", borderColor: c.border }]}>
            <Layers size={14} color={c.accent} style={{ marginBottom: 4 }} />
            <Text style={[styles.kpiVal, { color: c.textPrimary }]}>{linkedAttributesCount}</Text>
            <Text style={[styles.kpiSub, { color: c.textMuted }]}>ATTRIBUTES</Text>
          </View>
        </View>

        {/* ── 2. Search & Sort Bar ─────────────────────────────────── */}
        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC", borderColor: c.border }]}>
          <Search size={18} color={c.textMuted} />
          <TextInput
            placeholder="Search values (e.g. XL, Crimson, 256GB)..."
            placeholderTextColor={c.textMuted}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: c.textPrimary }]}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")} style={{ padding: 4 }}>
              <X size={16} color={c.textMuted} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={() => setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC")}
            style={[styles.sortBtn, { backgroundColor: theme.isDark ? "#1E293B" : "#EEF2FF", borderColor: c.primary }]}
            activeOpacity={0.7}
          >
            <ArrowUpDown size={14} color={c.primary} />
          </TouchableOpacity>
        </View>

        {/* ── 3. Attribute Filter Selector Pills ─────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.attrFilterScroll}
          contentContainerStyle={styles.attrFilterContent}
        >
          <TouchableOpacity
            onPress={() => setSelectedAttributeFilter("ALL")}
            style={[
              styles.filterPill,
              {
                backgroundColor: selectedAttributeFilter === "ALL" ? c.primary : theme.isDark ? "#0F172A" : "#F8FAFC",
                borderColor: selectedAttributeFilter === "ALL" ? c.primary : c.border,
              },
            ]}
          >
            <Text style={[styles.filterPillText, { color: selectedAttributeFilter === "ALL" ? "#FFFFFF" : c.textSecondary }]}>
              All ({values.length})
            </Text>
          </TouchableOpacity>

          {attributes.map((attr) => {
            const isSelected = String(selectedAttributeFilter) === String(attr.Id);
            const count = values.filter((v) => String(v.ProductAttributeId) === String(attr.Id)).length;
            return (
              <TouchableOpacity
                key={String(attr.Id)}
                onPress={() => setSelectedAttributeFilter(attr.Id)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? c.primary : theme.isDark ? "#0F172A" : "#F8FAFC",
                    borderColor: isSelected ? c.primary : c.border,
                  },
                ]}
              >
                <Text style={[styles.filterPillText, { color: isSelected ? "#FFFFFF" : c.textSecondary }]}>
                  {attr.Name} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── 4. Attribute Value Cards List ─────────────────────────── */}
        {loading && !refreshing ? (
          <DashboardSkeleton />
        ) : error && values.length === 0 ? (
          <ErrorState message={error} onRetry={() => fetchValuesAndAttributes()} />
        ) : values.length === 0 ? (
          <EmptyState
            title="No Option Values Found"
            description="Click '+ Add Value' to define choices under this product attribute."
          />
        ) : (
          values.map((item) => {
            const isHex = item.AttributeValueCode?.startsWith("#");
            return (
              <Card key={String(item.Id)} style={styles.card}>
                <View style={styles.cardRow}>
                  {/* Swatch or Icon */}
                  {isHex ? (
                    <View style={[styles.colorBox, { backgroundColor: item.AttributeValueCode }]} />
                  ) : (
                    <View style={[styles.iconBox, { backgroundColor: theme.isDark ? "#1E293B" : "#EEF2FF" }]}>
                      <List size={18} color={c.primary} />
                    </View>
                  )}

                  {/* Details Column */}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.valName, { color: c.textPrimary }]}>{item.Name}</Text>
                    <View style={styles.attrMetaRow}>
                      <Tag size={11} color={c.primary} />
                      <Text style={[styles.parentName, { color: c.primary }]}>
                        {item.attribute_name || "Attribute Option"}
                      </Text>
                    </View>
                  </View>

                  {/* Code Badge */}
                  {item.AttributeValueCode ? (
                    <View style={[styles.codeBadge, { backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9", borderColor: c.border }]}>
                      <Text style={[styles.codeText, { color: c.textSecondary }]}>{item.AttributeValueCode}</Text>
                    </View>
                  ) : null}

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      onPress={() => openEditModal(item)}
                      style={[styles.actionBtn, { backgroundColor: theme.isDark ? "#1E293B" : "#EEF2FF" }]}
                      activeOpacity={0.7}
                    >
                      <Edit3 size={13} color={c.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDelete(item)}
                      style={[styles.actionBtn, { backgroundColor: theme.isDark ? "#1E293B" : "#FEE2E2" }]}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={13} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ScreenContainer>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── ADD / EDIT VALUE MODAL ─────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? "#0B0F19" : "#FFFFFF", borderColor: c.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: c.textPrimary }]}>
                  {modalMode === "add" ? "Create Option Value" : "Edit Option Value"}
                </Text>
                <Text style={[styles.modalSubtitle, { color: c.textMuted }]}>
                  REST API: POST /product-attribute-values
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.closeBtn, { backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9" }]}
              >
                <X size={18} color={c.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Parent Attribute Picker */}
              <View style={styles.pickerSection}>
                <Text style={[styles.pickerLabel, { color: c.textSecondary }]}>
                  Target Product Attribute (ProductAttributeId) *
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerPillsScroll}>
                  {attributes.map((a) => {
                    const isSel = String(productAttributeId) === String(a.Id);
                    return (
                      <TouchableOpacity
                        key={String(a.Id)}
                        onPress={() => setProductAttributeId(a.Id)}
                        style={[
                          styles.pickerPill,
                          {
                            backgroundColor: isSel ? c.primary : theme.isDark ? "#1E293B" : "#F1F5F9",
                            borderColor: isSel ? c.primary : c.border,
                          },
                        ]}
                      >
                        <Text style={[styles.pickerPillText, { color: isSel ? "#FFFFFF" : c.textSecondary }]}>
                          {a.Name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Color Presets Palette Strip */}
              <View style={styles.presetSection}>
                <Text style={[styles.presetLabel, { color: c.textSecondary }]}>Quick Color Presets</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsScroll}>
                  {COLOR_PRESETS.map((preset) => (
                    <TouchableOpacity
                      key={preset.hex}
                      onPress={() => handleSelectColorPreset(preset)}
                      style={[
                        styles.presetChip,
                        {
                          borderColor: attributeValueCode === preset.hex ? c.primary : c.border,
                          backgroundColor: theme.isDark ? "#1E293B" : "#F8FAFC",
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.presetDot, { backgroundColor: preset.hex }]} />
                      <Text style={[styles.presetText, { color: c.textPrimary }]}>{preset.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <TextField
                label="Option Value Display Name (Name) *"
                placeholder="e.g. Extra Large, Midnight Navy, 512GB"
                value={name}
                onChangeText={setName}
              />

              <TextField
                label="Value Identifier Code or Color Hex (AttributeValueCode)"
                placeholder="e.g. size_xl, storage_512gb, or #1E3A8A"
                value={attributeValueCode}
                onChangeText={setAttributeValueCode}
              />

              {/* ── Disabled Company Input with Company Name ────────── */}
              <View style={styles.disabledInputContainer}>
                <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Company (CompanyId)</Text>
                <View
                  style={[
                    styles.disabledInputBox,
                    {
                      backgroundColor: theme.isDark ? "#0F172A" : "#F1F5F9",
                      borderColor: c.border,
                    },
                  ]}
                >
                  <View style={styles.companyRow}>
                    <Building2 size={16} color={c.primary} />
                    <Text style={[styles.companyText, { color: c.textPrimary }]}>
                      {companyName}
                    </Text>
                  </View>
                  <View style={[styles.lockBadge, { backgroundColor: theme.isDark ? "#1E293B" : "#E2E8F0" }]}>
                    <Lock size={12} color={c.textMuted} />
                    <Text style={[styles.lockBadgeText, { color: c.textMuted }]}>Auto-Assigned (ID: #{defaultCompanyId})</Text>
                  </View>
                </View>
                <Text style={[styles.helperText, { color: c.textMuted }]}>
                  Company context is fixed based on your organization account.
                </Text>
              </View>

              {attributeValueCode.startsWith("#") && (
                <View style={styles.hexPreviewRow}>
                  <View style={[styles.hexPreviewBox, { backgroundColor: attributeValueCode }]} />
                  <Text style={[styles.hexPreviewText, { color: c.textSecondary }]}>
                    Active Color Preview Swatch ({attributeValueCode})
                  </Text>
                </View>
              )}

              <View style={{ marginTop: 16 }}>
                <PrimaryButton
                  title={submitting ? "Saving..." : modalMode === "add" ? "Create Option Value" : "Save Changes"}
                  onPress={handleSave}
                  disabled={submitting}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  kpiRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },
  kpiBox: {
    flex: 1,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  kpiVal: {
    fontSize: 14,
    fontWeight: "900",
  },
  kpiSub: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
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
  },
  sortBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  attrFilterScroll: {
    flexGrow: 0,
    height: 38,
    marginBottom: 12,
  },
  attrFilterContent: {
    gap: 8,
    alignItems: "center",
    paddingVertical: 2,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  card: {
    marginVertical: 4,
    padding: 14,
    borderRadius: 18,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  colorBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  valName: {
    fontSize: 14,
    fontWeight: "800",
  },
  attrMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  parentName: {
    fontSize: 11,
    fontWeight: "700",
  },
  codeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  codeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 6,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1.5,
    padding: 20,
    maxHeight: "88%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "900",
  },
  modalSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerSection: {
    marginVertical: 6,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  pickerPillsScroll: {
    flexDirection: "row",
    gap: 6,
  },
  pickerPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 6,
  },
  pickerPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  presetSection: {
    marginVertical: 6,
  },
  presetLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  presetsScroll: {
    flexDirection: "row",
  },
  presetChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    marginRight: 6,
    gap: 6,
  },
  presetDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
  },
  presetText: {
    fontSize: 11,
    fontWeight: "700",
  },
  disabledInputContainer: {
    marginVertical: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  disabledInputBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  companyText: {
    fontSize: 13,
    fontWeight: "800",
  },
  lockBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  lockBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  helperText: {
    fontSize: 10,
    marginTop: 4,
    marginLeft: 2,
  },
  hexPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  hexPreviewBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  hexPreviewText: {
    fontSize: 11,
    fontWeight: "600",
  },
});