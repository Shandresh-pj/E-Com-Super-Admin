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
  Switch,
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
  Sliders,
  Plus,
  X,
  Search,
  Edit3,
  Trash2,
  Tag,
  Palette,
  CheckCircle2,
  Layers,
  ChevronRight,
  Sparkles,
} from "lucide-react-native";

export interface ProductAttribute {
  id: number | string;
  Id?: number | string;
  name: string;
  Name?: string;
  type?: string;
  AttributeNameCode?: string;
  is_filterable?: boolean;
  values_count?: number;
  values?: Array<{ id: number | string; value: string; code?: string }>;
  created_at?: string;
}

export const ProductAttributesScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const theme = useTheme();
  const c = theme.colors;
  const { width } = useWindowDimensions();

  // State
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedAttr, setSelectedAttr] = useState<ProductAttribute | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<"SELECT" | "COLOR" | "RADIO" | "BUTTON">("SELECT");
  const [isFilterable, setIsFilterable] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchAttributes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await axiosClient.get(ENDPOINTS.PRODUCT_ATTRIBUTES);
      const normalized = normalizeApiResponse<ProductAttribute[]>(res.data);
      const list = Array.isArray(normalized.data)
        ? normalized.data
        : Array.isArray(res.data?.data?.data)
        ? res.data.data.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];

      const formatted = list.map((a: any) => ({
        ...a,
        id: a.id || a.Id,
        name: a.name || a.Name || "Unnamed Attribute",
        type: a.type || "SELECT",
        is_filterable: a.is_filterable !== undefined ? Boolean(a.is_filterable) : true,
      }));

      setAttributes(formatted);
    } catch (e: any) {
      setError(e.message || "Failed to load product attributes");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  // Executive KPI Counts
  const totalAttributes = attributes.length;
  const filterableCount = attributes.filter((a) => a.is_filterable).length;
  const colorTypeCount = attributes.filter((a) => a.type === "COLOR").length;

  const openAddModal = () => {
    setModalMode("add");
    setSelectedAttr(null);
    setName("");
    setCode("");
    setType("SELECT");
    setIsFilterable(true);
    setModalVisible(true);
  };

  const openEditModal = (attr: ProductAttribute) => {
    setModalMode("edit");
    setSelectedAttr(attr);
    setName(attr.name);
    setCode(attr.AttributeNameCode || attr.name.toLowerCase().replace(/[^a-z0-9]/g, "_"));
    setType((attr.type as any) || "SELECT");
    setIsFilterable(Boolean(attr.is_filterable));
    setModalVisible(true);
  };

  const handleNameChange = (text: string) => {
    setName(text);
    if (!code || code === name.toLowerCase().replace(/[^a-z0-9]/g, "_")) {
      setCode(text.toLowerCase().replace(/[^a-z0-9]/g, "_"));
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Attribute name is required.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        Name: name.trim(),
        AttributeNameCode: code.trim() || name.toLowerCase().replace(/[^a-z0-9]/g, "_"),
        type: type,
        is_filterable: isFilterable,
      };

      if (modalMode === "add") {
        await axiosClient.post(ENDPOINTS.PRODUCT_ATTRIBUTES, payload);
        Alert.alert("Created", `Attribute "${name}" created successfully.`);
      } else if (selectedAttr) {
        await axiosClient.put(ENDPOINTS.PRODUCT_ATTRIBUTE_BY_ID(selectedAttr.id), payload);
        Alert.alert("Updated", `Attribute "${name}" updated successfully.`);
      }

      setModalVisible(false);
      fetchAttributes(true);
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || e.message || "Failed to save attribute.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (attr: ProductAttribute) => {
    Alert.alert(
      "Delete Attribute",
      `Delete "${attr.name}" and all its assigned options?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await axiosClient.delete(ENDPOINTS.PRODUCT_ATTRIBUTE_BY_ID(attr.id));
              fetchAttributes(true);
            } catch (e: any) {
              Alert.alert("Error", e.response?.data?.message || e.message || "Delete failed.");
            }
          },
        },
      ]
    );
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return attributes;
    const q = search.toLowerCase();
    return attributes.filter(
      (a) =>
        String(a.name || "").toLowerCase().includes(q) ||
        String(a.type || "").toLowerCase().includes(q)
    );
  }, [attributes, search]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchAttributes(true)}>
        <Header
          title="Product Attributes"
          subtitle={`${totalAttributes} Master Attributes Defined`}
          rightAction={
            <TouchableOpacity
              onPress={openAddModal}
              style={[styles.addBtn, { backgroundColor: c.primary }]}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.addBtnText}>Add Attribute</Text>
            </TouchableOpacity>
          }
        />

        {/* ── 1. Executive Attribute KPI Strip ───────────────────────── */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiBox, { backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC", borderColor: c.border }]}>
            <Sliders size={14} color={c.primary} style={{ marginBottom: 4 }} />
            <Text style={[styles.kpiVal, { color: c.textPrimary }]}>{totalAttributes}</Text>
            <Text style={[styles.kpiSub, { color: c.textMuted }]}>TOTAL</Text>
          </View>

          <View style={[styles.kpiBox, { backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC", borderColor: c.border }]}>
            <CheckCircle2 size={14} color="#10B981" style={{ marginBottom: 4 }} />
            <Text style={[styles.kpiVal, { color: "#10B981" }]}>{filterableCount}</Text>
            <Text style={[styles.kpiSub, { color: c.textMuted }]}>FILTERABLE</Text>
          </View>

          <View style={[styles.kpiBox, { backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC", borderColor: c.border }]}>
            <Palette size={14} color={c.accent} style={{ marginBottom: 4 }} />
            <Text style={[styles.kpiVal, { color: c.textPrimary }]}>{colorTypeCount}</Text>
            <Text style={[styles.kpiSub, { color: c.textMuted }]}>COLOR SWATCH</Text>
          </View>
        </View>

        {/* ── 2. Search Box ────────────────────────────────────────── */}
        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC", borderColor: c.border }]}>
          <Search size={18} color={c.textMuted} />
          <TextInput
            placeholder="Search attributes (e.g. Size, Color, Memory)..."
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

        {/* ── 3. Attribute Cards List ──────────────────────────────── */}
        {loading && !refreshing ? (
          <DashboardSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchAttributes()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No Attributes Found"
            description="Create attributes like Size, Color, or Material to configure product variants."
          />
        ) : (
          filtered.map((item) => (
            <Card key={String(item.id)} style={styles.card}>
              <View style={styles.cardRow}>
                {/* Icon Box */}
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor:
                        item.type === "COLOR"
                          ? "rgba(168, 85, 247, 0.15)"
                          : theme.isDark
                          ? "rgba(99, 102, 241, 0.15)"
                          : "#EEF2FF",
                    },
                  ]}
                >
                  {item.type === "COLOR" ? (
                    <Palette size={18} color="#A855F7" />
                  ) : (
                    <Sliders size={18} color={c.primary} />
                  )}
                </View>

                {/* Details Column */}
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.attrName, { color: c.textPrimary }]}>{item.name}</Text>
                    <Badge
                      label={item.is_filterable ? "FILTERABLE" : "STANDARD"}
                      variant={item.is_filterable ? "success" : "primary"}
                      size="sm"
                    />
                  </View>

                  <View style={styles.metaRow}>
                    <Tag size={11} color={c.textMuted} />
                    <Text style={[styles.metaText, { color: c.textMuted }]}>
                      Type: {item.type || "SELECT"}
                    </Text>
                    {item.values_count !== undefined && (
                      <Text style={[styles.metaText, { color: c.textMuted }]}>
                        • {item.values_count} Values
                      </Text>
                    )}
                  </View>
                </View>

                {/* Quick Action Buttons */}
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
          ))
        )}
      </ScreenContainer>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── ADD / EDIT ATTRIBUTE MODAL ─────────────────────────────── */}
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
                  {modalMode === "add" ? "Create Product Attribute" : "Edit Attribute"}
                </Text>
                <Text style={[styles.modalSubtitle, { color: c.textMuted }]}>
                  Configure variant option attributes
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
              <TextField
                label="Attribute Name *"
                placeholder="e.g. Size, Color, Material, Storage"
                value={name}
                onChangeText={handleNameChange}
              />

              <TextField
                label="Attribute Code"
                placeholder="e.g. size, color, storage_capacity"
                value={code}
                onChangeText={setCode}
              />

              {/* Type Selector Pills */}
              <View style={styles.typeSection}>
                <Text style={[styles.typeLabel, { color: c.textSecondary }]}>Display UI Type</Text>
                <View style={styles.typePillsRow}>
                  {(["SELECT", "COLOR", "RADIO", "BUTTON"] as const).map((t) => {
                    const isSelected = type === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setType(t)}
                        style={[
                          styles.typePill,
                          {
                            backgroundColor: isSelected ? c.primary : theme.isDark ? "#1E293B" : "#F1F5F9",
                            borderColor: isSelected ? c.primary : c.border,
                          },
                        ]}
                      >
                        <Text style={[styles.typePillText, { color: isSelected ? "#FFFFFF" : c.textSecondary }]}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={[styles.switchRow, { backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC", borderColor: c.border }]}>
                <View>
                  <Text style={[styles.switchTitle, { color: c.textPrimary }]}>Filterable in Storefront</Text>
                  <Text style={[styles.switchSubtitle, { color: c.textMuted }]}>
                    Allow customers to filter products by this attribute
                  </Text>
                </View>
                <Switch
                  value={isFilterable}
                  onValueChange={setIsFilterable}
                  trackColor={{ true: c.primary, false: theme.isDark ? "#334155" : "#CBD5E1" }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={{ marginTop: 16 }}>
                <PrimaryButton
                  title={submitting ? "Saving..." : modalMode === "add" ? "Create Attribute" : "Save Changes"}
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
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
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
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3,
    paddingRight: 4,
  },
  attrName: {
    fontSize: 14,
    fontWeight: "800",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
    fontWeight: "600",
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
  typeSection: {
    marginVertical: 8,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  typePillsRow: {
    flexDirection: "row",
    gap: 6,
  },
  typePill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  typePillText: {
    fontSize: 11,
    fontWeight: "800",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 10,
  },
  switchTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  switchSubtitle: {
    fontSize: 10,
    marginTop: 2,
  },
});