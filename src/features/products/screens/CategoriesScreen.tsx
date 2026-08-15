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
  ActivityIndicator,
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
  Tag,
  Plus,
  X,
  Search,
  Edit3,
  Trash2,
  ChevronRight,
  LayoutGrid,
  Layers,
  FolderTree,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react-native";

export interface Category {
  id: number | string;
  name: string;
  slug?: string;
  description?: string;
  parent_id?: number | string | null;
  parentId?: number | string | null;
  parent_name?: string;
  image?: string;
  image_url?: string;
  is_active: boolean;
  status?: boolean | string;
  sort_order?: number;
  product_count?: number;
  children?: Category[];
  created_at?: string;
}

export const CategoriesScreen: React.FC = () => {
  const theme = useTheme();
  const c = theme.colors;
  const { width } = useWindowDimensions();

  // Data State
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Modals
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string | number | null>(null);
  const [sortOrder, setSortOrder] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await axiosClient.get(ENDPOINTS.CATEGORIES);
      const normalized = normalizeApiResponse<Category[]>(res.data);
      const list = Array.isArray(normalized.data)
        ? normalized.data
        : Array.isArray(res.data?.categories)
        ? res.data.categories
        : Array.isArray(res.data)
        ? res.data
        : [];

      // Normalize boolean is_active
      const formatted = list.map((cat: any) => ({
        ...cat,
        id: cat.id || cat.Id || cat._id,
        name: cat.name || cat.Name || "Unnamed Category",
        is_active: cat.is_active !== undefined ? Boolean(cat.is_active) : cat.status !== false,
      }));

      setCategories(formatted);
    } catch (e: any) {
      setError(e.message || "Failed to load categories");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Executive KPI Counts
  const totalCategories = categories.length;
  const activeCount = categories.filter((cat) => cat.is_active).length;
  const parentCategories = categories.filter((cat) => !cat.parent_id && !cat.parentId);
  const subCategoryCount = categories.filter((cat) => cat.parent_id || cat.parentId).length;

  const openAdd = () => {
    setName("");
    setSlug("");
    setDescription("");
    setParentId(null);
    setSortOrder("1");
    setIsActive(true);
    setImageUrl("");
    setAddModal(true);
  };

  const openEdit = (cat: Category) => {
    setSelectedCat(cat);
    setName(cat.name);
    setSlug(cat.slug || "");
    setDescription(cat.description || "");
    setParentId(cat.parent_id || cat.parentId || null);
    setSortOrder(String(cat.sort_order || "1"));
    setIsActive(cat.is_active);
    setImageUrl(cat.image_url || cat.image || "");
    setEditModal(true);
  };

  const handleNameChange = (text: string) => {
    setName(text);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]/g, "-")) {
      setSlug(text.toLowerCase().replace(/[^a-z0-9]/g, "-"));
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Category name is required.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        description: description.trim(),
        sort_order: sortOrder ? parseInt(sortOrder, 10) : 0,
        is_active: isActive,
        status: isActive,
      };
      if (parentId) {
        payload.parentId = parentId;
        payload.parent_id = parentId;
      }
      if (imageUrl) {
        payload.image = imageUrl;
      }

      await axiosClient.post(ENDPOINTS.CATEGORY_CREATE, payload);
      Alert.alert("Created", `Category "${name}" created successfully.`);
      setAddModal(false);
      fetchCategories(true);
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || e.message || "Create failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCat || !name.trim()) {
      Alert.alert("Required", "Category name is required.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        description: description.trim(),
        sort_order: sortOrder ? parseInt(sortOrder, 10) : 0,
        is_active: isActive,
        status: isActive,
      };
      if (parentId) {
        payload.parentId = parentId;
        payload.parent_id = parentId;
      }
      if (imageUrl) {
        payload.image = imageUrl;
      }

      await axiosClient.put(ENDPOINTS.CATEGORY_BY_ID(selectedCat.id), payload);
      Alert.alert("Updated", `Category "${name}" updated.`);
      setEditModal(false);
      fetchCategories(true);
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.message || e.message || "Update failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (cat: Category) => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${cat.name}"? Products under this category may be unlinked.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await axiosClient.delete(ENDPOINTS.CATEGORY_BY_ID(cat.id));
              fetchCategories(true);
            } catch (e: any) {
              Alert.alert("Error", e.response?.data?.message || e.message || "Delete failed.");
            }
          },
        },
      ]
    );
  };

  const handleStatusToggle = async (cat: Category) => {
    try {
      const newStatus = !cat.is_active;
      // Optimistic update
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_active: newStatus } : c))
      );
      await axiosClient.put(ENDPOINTS.CATEGORY_STATUS(cat.id), {
        status: newStatus,
        is_active: newStatus,
      });
    } catch {
      fetchCategories(true);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(
      (cat) =>
        String(cat.name || "").toLowerCase().includes(q) ||
        String(cat.slug || "").toLowerCase().includes(q) ||
        String(cat.description || "").toLowerCase().includes(q)
    );
  }, [categories, search]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchCategories(true)}>
        <Header
          title="Categories & Taxonomy"
          subtitle={`${totalCategories} Product Categories Defined`}
          rightAction={
            <TouchableOpacity
              onPress={openAdd}
              style={[styles.addBtn, { backgroundColor: c.primary }]}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.addBtnText}>Add Category</Text>
            </TouchableOpacity>
          }
        />

        {/* ── 1. Executive Category KPI Strip ──────────────────────── */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiBox, { backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC", borderColor: c.border }]}>
            <FolderTree size={14} color={c.primary} style={{ marginBottom: 4 }} />
            <Text style={[styles.kpiVal, { color: c.textPrimary }]}>{totalCategories}</Text>
            <Text style={[styles.kpiSub, { color: c.textMuted }]}>TOTAL</Text>
          </View>

          <View style={[styles.kpiBox, { backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC", borderColor: c.border }]}>
            <CheckCircle2 size={14} color="#10B981" style={{ marginBottom: 4 }} />
            <Text style={[styles.kpiVal, { color: "#10B981" }]}>{activeCount}</Text>
            <Text style={[styles.kpiSub, { color: c.textMuted }]}>ACTIVE</Text>
          </View>

          <View style={[styles.kpiBox, { backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC", borderColor: c.border }]}>
            <Layers size={14} color={c.accent} style={{ marginBottom: 4 }} />
            <Text style={[styles.kpiVal, { color: c.textPrimary }]}>{parentCategories.length}</Text>
            <Text style={[styles.kpiSub, { color: c.textMuted }]}>MASTERS</Text>
          </View>

          <View style={[styles.kpiBox, { backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC", borderColor: c.border }]}>
            <Tag size={14} color="#F59E0B" style={{ marginBottom: 4 }} />
            <Text style={[styles.kpiVal, { color: c.textPrimary }]}>{subCategoryCount}</Text>
            <Text style={[styles.kpiSub, { color: c.textMuted }]}>SUB-CATS</Text>
          </View>
        </View>

        {/* ── 2. Search & Filter Bar ───────────────────────────────── */}
        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC", borderColor: c.border }]}>
          <Search size={18} color={c.textMuted} />
          <TextInput
            placeholder="Search category name, slug, or tags..."
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

        {/* ── 3. Category Cards List ───────────────────────────────── */}
        {loading && !refreshing ? (
          <DashboardSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchCategories()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No Categories Found"
            description="Create your first catalog category to organize products."
          />
        ) : (
          filtered.map((item) => {
            const isSub = Boolean(item.parent_id || item.parentId);
            return (
              <Card key={String(item.id)} style={styles.catCard}>
                <View style={styles.catRow}>
                  {/* Category Icon Badge */}
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: isSub
                          ? theme.isDark
                            ? "rgba(99, 102, 241, 0.15)"
                            : "#EEF2FF"
                          : theme.isDark
                          ? "rgba(16, 185, 129, 0.15)"
                          : "#ECFDF5",
                      },
                    ]}
                  >
                    {isSub ? (
                      <Layers size={18} color={c.primary} />
                    ) : (
                      <FolderTree size={18} color="#10B981" />
                    )}
                  </View>

                  {/* Details Column */}
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameHeaderRow}>
                      <Text style={[styles.catName, { color: c.textPrimary }]}>{item.name}</Text>
                      <Badge
                        label={item.is_active ? "ACTIVE" : "HIDDEN"}
                        variant={item.is_active ? "success" : "neutral"}
                        size="sm"
                      />
                    </View>

                    {item.slug && (
                      <Text style={[styles.catSlug, { color: c.textMuted }]}>/{item.slug}</Text>
                    )}

                    {item.description ? (
                      <Text style={[styles.catDesc, { color: c.textSecondary }]} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>

                  {/* Actions Column */}
                  <View style={styles.actionsCol}>
                    <Switch
                      value={item.is_active}
                      onValueChange={() => handleStatusToggle(item)}
                      trackColor={{ true: c.primary, false: theme.isDark ? "#334155" : "#CBD5E1" }}
                      thumbColor="#FFFFFF"
                    />

                    <View style={styles.buttonsRow}>
                      <TouchableOpacity
                        onPress={() => openEdit(item)}
                        style={[styles.miniActionBtn, { backgroundColor: theme.isDark ? "#1E293B" : "#EEF2FF" }]}
                        activeOpacity={0.7}
                      >
                        <Edit3 size={13} color={c.primary} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDelete(item)}
                        style={[styles.miniActionBtn, { backgroundColor: theme.isDark ? "#1E293B" : "#FEE2E2" }]}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={13} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ScreenContainer>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── CREATE / EDIT CATEGORY MODAL ───────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <Modal
        visible={addModal || editModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setAddModal(false);
          setEditModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? "#0B0F19" : "#FFFFFF", borderColor: c.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: c.textPrimary }]}>
                  {addModal ? "Create Category" : "Edit Category"}
                </Text>
                <Text style={[styles.modalSubtitle, { color: c.textMuted }]}>
                  Define taxonomy and catalog navigation
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setAddModal(false);
                  setEditModal(false);
                }}
                style={[styles.closeBtn, { backgroundColor: theme.isDark ? "#1E293B" : "#F1F5F9" }]}
              >
                <X size={18} color={c.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <TextField
                label="Category Name *"
                placeholder="e.g. Consumer Electronics"
                value={name}
                onChangeText={handleNameChange}
              />

              <TextField
                label="URL Slug (Auto-generated)"
                placeholder="e.g. consumer-electronics"
                value={slug}
                onChangeText={setSlug}
              />

              <TextField
                label="Description"
                placeholder="Brief summary of items in this category..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={2}
              />

              {/* Parent Category Selector */}
              <View style={styles.parentSection}>
                <Text style={[styles.parentLabel, { color: c.textSecondary }]}>Parent Category (Optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.parentPillsScroll}>
                  <TouchableOpacity
                    onPress={() => setParentId(null)}
                    style={[
                      styles.parentPill,
                      {
                        backgroundColor: parentId === null ? c.primary : theme.isDark ? "#1E293B" : "#F1F5F9",
                        borderColor: parentId === null ? c.primary : c.border,
                      },
                    ]}
                  >
                    <Text style={[styles.parentPillText, { color: parentId === null ? "#FFFFFF" : c.textSecondary }]}>
                      None (Top-Level Master)
                    </Text>
                  </TouchableOpacity>

                  {parentCategories
                    .filter((p) => selectedCat ? p.id !== selectedCat.id : true)
                    .map((p) => {
                      const isSel = parentId === p.id;
                      return (
                        <TouchableOpacity
                          key={String(p.id)}
                          onPress={() => setParentId(p.id)}
                          style={[
                            styles.parentPill,
                            {
                              backgroundColor: isSel ? c.primary : theme.isDark ? "#1E293B" : "#F1F5F9",
                              borderColor: isSel ? c.primary : c.border,
                            },
                          ]}
                        >
                          <Text style={[styles.parentPillText, { color: isSel ? "#FFFFFF" : c.textSecondary }]}>
                            {p.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>
              </View>

              <TextField
                label="Sort Display Order"
                placeholder="e.g. 1, 2, 3"
                value={sortOrder}
                onChangeText={setSortOrder}
                keyboardType="numeric"
              />

              <TextField
                label="Cover Image / Icon URL"
                placeholder="https://images.unsplash.com/photo-..."
                value={imageUrl}
                onChangeText={setImageUrl}
              />

              <View style={[styles.switchRow, { backgroundColor: theme.isDark ? "#0F172A" : "#F8FAFC", borderColor: c.border }]}>
                <View>
                  <Text style={[styles.switchTitle, { color: c.textPrimary }]}>Active Visibility</Text>
                  <Text style={[styles.switchSubtitle, { color: c.textMuted }]}>
                    Display category across mobile apps and POS
                  </Text>
                </View>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ true: c.primary, false: theme.isDark ? "#334155" : "#CBD5E1" }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={{ marginTop: 16 }}>
                <PrimaryButton
                  title={submitting ? "Saving..." : addModal ? "Create Category" : "Save Changes"}
                  onPress={addModal ? handleCreate : handleUpdate}
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
  catCard: {
    marginVertical: 4,
    padding: 14,
    borderRadius: 18,
  },
  catRow: {
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
  nameHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
    paddingRight: 4,
  },
  catName: {
    fontSize: 14,
    fontWeight: "800",
  },
  catSlug: {
    fontSize: 11,
    marginBottom: 4,
  },
  catDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  actionsCol: {
    alignItems: "flex-end",
    gap: 8,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 6,
  },
  miniActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
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
  parentSection: {
    marginVertical: 6,
  },
  parentLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  parentPillsScroll: {
    flexDirection: "row",
    gap: 6,
  },
  parentPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 6,
  },
  parentPillText: {
    fontSize: 11,
    fontWeight: "700",
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