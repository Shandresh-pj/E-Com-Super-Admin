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
  Sliders,
  Plus,
  X,
  Search,
  Edit3,
  Trash2,
  Tag,
  CheckCircle2,
  Layers,
  ChevronRight,
  Sparkles,
  ArrowRight,
  List,
  Code2,
  ArrowUpDown,
  Building2,
  Lock,
} from "lucide-react-native";

export interface ProductAttribute {
  Id: number | string;
  id?: number | string;
  CompanyId?: number;
  AttributeNameCode: string;
  Name: string;
  name?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
  ProductAttributeTranslations?: Array<{ LanguagesId: number | null; Name: string }>;
}

export const ProductAttributesScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const theme = useTheme();
  const c = theme.colors;
  const { width } = useWindowDimensions();
  const user = useAuthStore((state) => state.user);

  const companyName = user?.officeBranch || "Main Enterprise Corp";
  const defaultCompanyId = 1;

  // State
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Sorting
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"Id" | "Name" | "AttributeNameCode" | "CreatedAt">("Id");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedAttr, setSelectedAttr] = useState<ProductAttribute | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [attributeNameCode, setAttributeNameCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchAttributes = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await axiosClient.get(ENDPOINTS.PRODUCT_ATTRIBUTES, {
        params: {
          page: 1,
          limit: 100,
          search: search.trim() || undefined,
          sortBy,
          sortOrder,
        },
      });

      const responseData = res.data;
      const rawList = Array.isArray(responseData?.data?.data)
        ? responseData.data.data
        : Array.isArray(responseData?.data)
        ? responseData.data
        : Array.isArray(responseData)
        ? responseData
        : [];

      const total = responseData?.data?.totalItems || rawList.length;
      setTotalItems(total);

      const formatted: ProductAttribute[] = rawList.map((a: any) => ({
        Id: a.Id || a.id,
        id: a.Id || a.id,
        CompanyId: a.CompanyId ?? defaultCompanyId,
        AttributeNameCode: a.AttributeNameCode || a.code || (a.Name || a.name || "").toLowerCase().replace(/[^a-z0-9]/g, "_"),
        Name: a.Name || a.name || "Unnamed Attribute",
        name: a.Name || a.name || "Unnamed Attribute",
        CreatedAt: a.CreatedAt || a.created_at,
        UpdatedAt: a.UpdatedAt || a.updated_at,
        ProductAttributeTranslations: a.ProductAttributeTranslations || [{ LanguagesId: null, Name: a.Name || a.name }],
      }));

      setAttributes(formatted);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || "Failed to load product attributes");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, sortBy, sortOrder]);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  const openAddModal = () => {
    setModalMode("add");
    setSelectedAttr(null);
    setName("");
    setAttributeNameCode("");
    setModalVisible(true);
  };

  const openEditModal = (attr: ProductAttribute) => {
    setModalMode("edit");
    setSelectedAttr(attr);
    setName(attr.Name || attr.name || "");
    setAttributeNameCode(attr.AttributeNameCode || "");
    setModalVisible(true);
  };

  const openDetailModal = (attr: ProductAttribute) => {
    setSelectedAttr(attr);
    setDetailModalVisible(true);
  };

  const handleNameChange = (text: string) => {
    setName(text);
    if (!attributeNameCode || attributeNameCode === name.toLowerCase().replace(/[^a-z0-9]/g, "_")) {
      setAttributeNameCode(text.toLowerCase().replace(/[^a-z0-9]/g, "_"));
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Required Field", "Please enter the Product Attribute Name.");
      return;
    }
    setSubmitting(true);
    try {
      const generatedCode = attributeNameCode.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");

      const payload = {
        Name: name.trim(),
        name: name.trim(),
        AttributeNameCode: generatedCode,
        code: generatedCode,
        CompanyId: defaultCompanyId,
        ProductAttributeTranslations: [
          { LanguagesId: null, Name: name.trim() },
        ],
      };

      if (modalMode === "add") {
        await axiosClient.post(ENDPOINTS.PRODUCT_ATTRIBUTES, payload);
        Alert.alert("Success", `Product attribute "${name}" created successfully.`);
      } else if (selectedAttr) {
        await axiosClient.put(ENDPOINTS.PRODUCT_ATTRIBUTE_BY_ID(selectedAttr.Id), payload);
        Alert.alert("Success", `Product attribute "${name}" updated successfully.`);
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
      `Are you sure you want to delete "${attr.Name}"? All linked attribute values will be removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await axiosClient.delete(ENDPOINTS.PRODUCT_ATTRIBUTE_BY_ID(attr.Id));
              Alert.alert("Deleted", "Product attribute deleted successfully.");
              fetchAttributes(true);
            } catch (e: any) {
              Alert.alert("Delete Failed", e.response?.data?.message || e.message || "Cannot delete attribute.");
            }
          },
        },
      ]
    );
  };

  const handleNavigateToValues = (attr: ProductAttribute) => {
    if (navigation?.navigate) {
      navigation.navigate("AttributeValues", {
        attributeId: attr.Id,
        attributeName: attr.Name,
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchAttributes(true)}>
        <Header
          title="Product Attributes"
          subtitle={`${totalItems || attributes.length} Defined Master Attributes`}
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

        {/* ── 1. KPI Metric Strip ──────────────────────────────────── */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiBox, { backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC", borderColor: c.border }]}>
            <Sliders size={15} color={c.primary} style={{ marginBottom: 4 }} />
            <Text style={[styles.kpiVal, { color: c.textPrimary }]}>{totalItems || attributes.length}</Text>
            <Text style={[styles.kpiSub, { color: c.textMuted }]}>TOTAL ATTRIBUTES</Text>
          </View>

          <View style={[styles.kpiBox, { backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC", borderColor: c.border }]}>
            <Code2 size={15} color="#10B981" style={{ marginBottom: 4 }} />
            <Text style={[styles.kpiVal, { color: "#10B981" }]}>{attributes.length}</Text>
            <Text style={[styles.kpiSub, { color: c.textMuted }]}>ACTIVE CODES</Text>
          </View>

          <View style={[styles.kpiBox, { backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC", borderColor: c.border }]}>
            <Building2 size={15} color={c.accent} style={{ marginBottom: 4 }} />
            <Text style={[styles.kpiVal, { color: c.textPrimary }]} numberOfLines={1}>{companyName}</Text>
            <Text style={[styles.kpiSub, { color: c.textMuted }]}>COMPANY CONTEXT</Text>
          </View>
        </View>

        {/* ── 2. Search & Sort Bar ─────────────────────────────────── */}
        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC", borderColor: c.border }]}>
          <Search size={18} color={c.textMuted} />
          <TextInput
            placeholder="Search attributes by Name or AttributeNameCode..."
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

        {/* ── 3. Attribute Cards List ──────────────────────────────── */}
        {loading && !refreshing ? (
          <DashboardSkeleton />
        ) : error && attributes.length === 0 ? (
          <ErrorState message={error} onRetry={() => fetchAttributes()} />
        ) : attributes.length === 0 ? (
          <EmptyState
            title="No Attributes Found"
            description="Add product attributes such as Size, Color, or Material."
          />
        ) : (
          attributes.map((item) => (
            <Card key={String(item.Id)} style={styles.card}>
              <TouchableOpacity activeOpacity={0.9} onPress={() => openDetailModal(item)}>
                <View style={styles.cardRow}>
                  {/* Icon Box */}
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: theme.isDark ? "rgba(99, 102, 241, 0.15)" : "#EEF2FF",
                      },
                    ]}
                  >
                    <Sliders size={18} color={c.primary} />
                  </View>

                  {/* Details Column */}
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.attrName, { color: c.textPrimary }]}>{item.Name}</Text>
                      <Badge label={`ID: #${item.Id}`} variant="primary" size="sm" />
                    </View>

                    <View style={styles.metaRow}>
                      <Code2 size={11} color={c.textMuted} />
                      <Text style={[styles.metaText, { color: c.textMuted }]}>
                        Code: {item.AttributeNameCode}
                      </Text>
                      <Text style={[styles.metaText, { color: c.textMuted }]}>
                        • {companyName}
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
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
              </TouchableOpacity>

              {/* Bottom Card Footer: Navigate to Discrete Values */}
              <TouchableOpacity
                onPress={() => handleNavigateToValues(item)}
                style={[styles.cardFooterBar, { backgroundColor: theme.isDark ? "#131E33" : "#F8FAFC", borderColor: c.border }]}
                activeOpacity={0.75}
              >
                <View style={styles.footerLeft}>
                  <List size={13} color={c.primary} />
                  <Text style={[styles.footerText, { color: c.textPrimary }]}>
                    Manage Discrete Option Values
                  </Text>
                </View>
                <ChevronRight size={14} color={c.textMuted} />
              </TouchableOpacity>
            </Card>
          ))
        )}
      </ScreenContainer>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── ATTRIBUTE SPECIFICATION DETAIL MODAL ───────────────────── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? "#0B0F19" : "#FFFFFF", borderColor: c.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: c.textPrimary }]}>Product Attribute Details</Text>
                <Text style={[styles.modalSubtitle, { color: c.textMuted }]}>
                  API Resource: /product-attributes/{selectedAttr?.Id}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setDetailModalVisible(false)}
                style={[styles.closeBtn, { backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9" }]}
              >
                <X size={18} color={c.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedAttr && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <View style={[styles.specGrid, { backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC", borderColor: c.border }]}>
                  <View style={styles.specRow}>
                    <Text style={[styles.specLabel, { color: c.textMuted }]}>Attribute ID (Id)</Text>
                    <Text style={[styles.specValue, { color: c.textPrimary }]}>#{selectedAttr.Id}</Text>
                  </View>
                  <View style={styles.specRow}>
                    <Text style={[styles.specLabel, { color: c.textMuted }]}>Attribute Name (Name)</Text>
                    <Text style={[styles.specValue, { color: c.textPrimary }]}>{selectedAttr.Name}</Text>
                  </View>
                  <View style={styles.specRow}>
                    <Text style={[styles.specLabel, { color: c.textMuted }]}>Identifier Code (AttributeNameCode)</Text>
                    <Text style={[styles.specValue, { color: c.primary }]}>{selectedAttr.AttributeNameCode}</Text>
                  </View>
                  <View style={styles.specRow}>
                    <Text style={[styles.specLabel, { color: c.textMuted }]}>Assigned Company</Text>
                    <Text style={[styles.specValue, { color: c.textPrimary }]}>{companyName} (ID: #{selectedAttr.CompanyId || defaultCompanyId})</Text>
                  </View>
                  {selectedAttr.CreatedAt && (
                    <View style={styles.specRow}>
                      <Text style={[styles.specLabel, { color: c.textMuted }]}>Created At</Text>
                      <Text style={[styles.specValue, { color: c.textSecondary }]}>
                        {new Date(selectedAttr.CreatedAt).toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={{ marginTop: 16 }}>
                  <PrimaryButton
                    title="View & Configure Option Values"
                    onPress={() => {
                      setDetailModalVisible(false);
                      handleNavigateToValues(selectedAttr);
                    }}
                  />
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

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
                  {modalMode === "add" ? "Create Product Attribute" : "Edit Product Attribute"}
                </Text>
                <Text style={[styles.modalSubtitle, { color: c.textMuted }]}>
                  REST API: POST /product-attributes
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
                label="Product Attribute Name (Name) *"
                placeholder="e.g. Color, Size, Storage, Material"
                value={name}
                onChangeText={handleNameChange}
              />

              <TextField
                label="Attribute Identifier Code (AttributeNameCode)"
                placeholder="e.g. color, size, storage_capacity"
                value={attributeNameCode}
                onChangeText={setAttributeNameCode}
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

              <View style={{ marginTop: 16 }}>
                <PrimaryButton
                  title={submitting ? "Saving..." : modalMode === "add" ? "Create Product Attribute" : "Save Changes"}
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
  sortBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
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
  cardFooterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    fontWeight: "700",
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
  specGrid: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginVertical: 8,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  specLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  specValue: {
    fontSize: 13,
    fontWeight: "800",
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
});