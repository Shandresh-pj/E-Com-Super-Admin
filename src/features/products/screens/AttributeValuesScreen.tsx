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
import { axiosClient } from "../../../api/axiosClient";
import { ENDPOINTS } from "../../../api/endpoints";
import { normalizeApiResponse } from "../../../api/responseNormalizer";
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
} from "lucide-react-native";
import { ProductAttribute } from "./ProductAttributesScreen";

export interface AttributeValue {
  id: number | string;
  Id?: number | string;
  attribute_id?: number | string;
  ProductAttributeId?: number | string;
  attribute_name?: string;
  value: string;
  Value?: string;
  Name?: string;
  code?: string;
  ColorHexCode?: string;
  sort_order?: number;
}

export const AttributeValuesScreen: React.FC = () => {
  const theme = useTheme();
  const c = theme.colors;
  const { width } = useWindowDimensions();

  // State
  const [values, setValues] = useState<AttributeValue[]>([]);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [selectedAttributeFilter, setSelectedAttributeFilter] = useState<string | number>("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedVal, setSelectedVal] = useState<AttributeValue | null>(null);

  // Form Fields
  const [attrId, setAttrId] = useState<string | number | null>(null);
  const [valText, setValText] = useState("");
  const [valCode, setValCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchValuesAndAttributes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [valRes, attrRes] = await Promise.all([
        axiosClient.get(ENDPOINTS.ATTRIBUTE_VALUES).catch(() => ({ data: [] })),
        axiosClient.get(ENDPOINTS.PRODUCT_ATTRIBUTES).catch(() => ({ data: [] })),
      ]);

      const normVals = normalizeApiResponse<AttributeValue[]>(valRes.data);
      const valList = Array.isArray(normVals.data)
        ? normVals.data
        : Array.isArray(valRes.data?.data?.data)
        ? valRes.data.data.data
        : Array.isArray(valRes.data?.data)
        ? valRes.data.data
        : Array.isArray(valRes.data)
        ? valRes.data
        : [];

      const normAttrs = normalizeApiResponse<ProductAttribute[]>(attrRes.data);
      const attrList = Array.isArray(normAttrs.data)
        ? normAttrs.data
        : Array.isArray(attrRes.data?.data?.data)
        ? attrRes.data.data.data
        : Array.isArray(attrRes.data?.data)
        ? attrRes.data.data
        : Array.isArray(attrRes.data)
        ? attrRes.data
        : [];

      const formattedVals = valList.map((v: any) => ({
        ...v,
        id: v.id || v.Id,
        value: v.value || v.Value || v.Name || "Unnamed Option",
        attribute_id: v.attribute_id || v.ProductAttributeId,
        code: v.code || v.ColorHexCode,
      }));

      const formattedAttrs = attrList.map((a: any) => ({
        ...a,
        id: a.id || a.Id,
        name: a.name || a.Name || "Attribute",
      }));

      setValues(formattedVals);
      setAttributes(formattedAttrs);
      if (!attrId && formattedAttrs.length > 0) {
        setAttrId(formattedAttrs[0].id);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load attribute values");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [attrId]);

  useEffect(() => {
    fetchValuesAndAttributes();
  }, [fetchValuesAndAttributes]);

  // Executive KPI Counts
  const totalValues = values.length;
  const colorSwatchCount = values.filter((v) => v.code?.startsWith("#")).length;
  const linkedAttributesCount = attributes.length;

  const openAddModal = () => {
    setModalMode("add");
    setSelectedVal(null);
    setValText("");
    setValCode("");
    if (attributes.length > 0 && selectedAttributeFilter !== "ALL") {
      setAttrId(selectedAttributeFilter);
    } else if (attributes.length > 0) {
      setAttrId(attributes[0].id);
    }
    setModalVisible(true);
  };

  const openEditModal = (item: AttributeValue) => {
    setModalMode("edit");
    setSelectedVal(item);
    setValText(item.value);
    setValCode(item.code || "");
    setAttrId(item.attribute_id || (attributes[0]?.id ?? null));
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!valText.trim()) {
      Alert.alert("Required", "Value name is required.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        value: valText.trim(),
        Name: valText.trim(),
        Value: valText.trim(),
        code: valCode.trim(),
        ColorHexCode: valCode.trim(),
      };
      if (attrId) {
        payload.attribute_id = attrId;
        payload.ProductAttributeId = attrId;
      }

      if (modalMode === "add") {
        await axiosClient.post(ENDPOINTS.ATTRIBUTE_VALUES, payload);
        Alert.alert("Created", `Value "${valText}" added.`);
      } else if (selectedVal) {
        await axiosClient.put(`${ENDPOINTS.ATTRIBUTE_VALUES}/${selectedVal.id}`, payload);
        Alert.alert("Updated", `Value "${valText}" updated.`);
      }

      setModalVisible(false);
      fetchValuesAndAttributes(true);
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || e.message || "Operation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (item: AttributeValue) => {
    Alert.alert(
      "Delete Value",
      `Delete option value "${item.value}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await axiosClient.delete(`${ENDPOINTS.ATTRIBUTE_VALUES}/${item.id}`);
              fetchValuesAndAttributes(true);
            } catch (e: any) {
              Alert.alert("Error", e.response?.data?.message || e.message || "Delete failed.");
            }
          },
        },
      ]
    );
  };

  // Filtered list
  const filtered = useMemo(() => {
    return values.filter((v) => {
      // Attribute filter
      if (selectedAttributeFilter !== "ALL") {
        if (String(v.attribute_id) !== String(selectedAttributeFilter)) {
          return false;
        }
      }
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          String(v.value || "").toLowerCase().includes(q) ||
          String(v.code || "").toLowerCase().includes(q) ||
          String(v.attribute_name || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [values, selectedAttributeFilter, search]);

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

        {/* ── 2. Search Box ────────────────────────────────────────── */}
        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC", borderColor: c.border }]}>
          <Search size={18} color={c.textMuted} />
          <TextInput
            placeholder="Search option values (e.g. XL, Crimson, 256GB)..."
            placeholderTextColor={c.textMuted}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: c.textPrimary }]}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <X size={16} color={c.textMuted} />
            </TouchableOpacity>
          ) : null}
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
            const isSelected = String(selectedAttributeFilter) === String(attr.id);
            const count = values.filter((v) => String(v.attribute_id) === String(attr.id)).length;
            return (
              <TouchableOpacity
                key={String(attr.id)}
                onPress={() => setSelectedAttributeFilter(attr.id)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? c.primary : theme.isDark ? "#0F172A" : "#F8FAFC",
                    borderColor: isSelected ? c.primary : c.border,
                  },
                ]}
              >
                <Text style={[styles.filterPillText, { color: isSelected ? "#FFFFFF" : c.textSecondary }]}>
                  {attr.name} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── 4. Attribute Value Cards List ─────────────────────────── */}
        {loading && !refreshing ? (
          <DashboardSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchValuesAndAttributes()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No Option Values Found"
            description="Add discrete values like Medium, Large, Navy Blue to configure variants."
          />
        ) : (
          filtered.map((item) => {
            const isHex = item.code?.startsWith("#");
            const parentAttr = attributes.find((a) => String(a.id) === String(item.attribute_id));
            return (
              <Card key={String(item.id)} style={styles.card}>
                <View style={styles.cardRow}>
                  {/* Swatch or Icon */}
                  {isHex ? (
                    <View style={[styles.colorBox, { backgroundColor: item.code }]} />
                  ) : (
                    <View style={[styles.iconBox, { backgroundColor: theme.isDark ? "#1E293B" : "#EEF2FF" }]}>
                      <List size={18} color={c.primary} />
                    </View>
                  )}

                  {/* Details Column */}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.valName, { color: c.textPrimary }]}>{item.value}</Text>
                    {parentAttr && (
                      <Text style={[styles.parentName, { color: c.textMuted }]}>
                        Attribute: {parentAttr.name}
                      </Text>
                    )}
                  </View>

                  {/* Code Badge */}
                  {item.code ? (
                    <View style={[styles.codeBadge, { backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9", borderColor: c.border }]}>
                      <Text style={[styles.codeText, { color: c.textSecondary }]}>{item.code}</Text>
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
                  {modalMode === "add" ? "Add Option Value" : "Edit Option Value"}
                </Text>
                <Text style={[styles.modalSubtitle, { color: c.textMuted }]}>
                  Define discrete choice for product attributes
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
                <Text style={[styles.pickerLabel, { color: c.textSecondary }]}>Target Product Attribute *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerPillsScroll}>
                  {attributes.map((a) => {
                    const isSel = String(attrId) === String(a.id);
                    return (
                      <TouchableOpacity
                        key={String(a.id)}
                        onPress={() => setAttrId(a.id)}
                        style={[
                          styles.pickerPill,
                          {
                            backgroundColor: isSel ? c.primary : theme.isDark ? "#1E293B" : "#F1F5F9",
                            borderColor: isSel ? c.primary : c.border,
                          },
                        ]}
                      >
                        <Text style={[styles.pickerPillText, { color: isSel ? "#FFFFFF" : c.textSecondary }]}>
                          {a.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <TextField
                label="Option Value *"
                placeholder="e.g. Extra Large, Midnight Navy, 512GB"
                value={valText}
                onChangeText={setValText}
              />

              <TextField
                label="Code / Color Hex (Optional)"
                placeholder="e.g. XL, 512G, or #1E3A8A"
                value={valCode}
                onChangeText={setValCode}
              />

              {valCode.startsWith("#") && (
                <View style={styles.hexPreviewRow}>
                  <View style={[styles.hexPreviewBox, { backgroundColor: valCode }]} />
                  <Text style={[styles.hexPreviewText, { color: c.textSecondary }]}>
                    Color preview swatch
                  </Text>
                </View>
              )}

              <View style={{ marginTop: 16 }}>
                <PrimaryButton
                  title={submitting ? "Saving..." : modalMode === "add" ? "Add Option Value" : "Save Changes"}
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
  parentName: {
    fontSize: 11,
    marginTop: 2,
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
  hexPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
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
  },
});