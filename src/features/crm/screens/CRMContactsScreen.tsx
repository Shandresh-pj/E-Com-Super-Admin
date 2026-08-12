import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, TextInput } from "react-native";
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
import { Users, Plus, X, Search, Phone, Mail, Building, User } from "lucide-react-native";

interface CRMContact {
  id: number | string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  status?: string;
  notes?: string;
  created_at?: string;
}

export const CRMContactsScreen: React.FC = () => {
  const theme = useTheme();
  const c = theme.colors;
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<CRMContact | null>(null);
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState(""); const [company, setCompany] = useState(""); const [notes, setNotes] = useState(""); const [submitting, setSubmitting] = useState(false);

  const fetchContacts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.CRM_CONTACTS);
      const data = normalizeApiResponse<CRMContact[]>(res.data);
      setContacts(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) { setError(e.message || "Failed to load contacts"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchContacts(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) { Alert.alert("Required", "Contact name is required."); return; }
    setSubmitting(true);
    try {
      await axiosClient.post(ENDPOINTS.CRM_CONTACTS, { name, email, phone, company, notes });
      Alert.alert("Created", `Contact "${name}" added.`);
      setAddModal(false); setName(""); setEmail(""); setPhone(""); setCompany(""); setNotes("");
      fetchContacts(true);
    } catch (e: any) { Alert.alert("Error", e.message || "Create failed."); }
    finally { setSubmitting(false); }
  };

  const handleDelete = (contact: CRMContact) => {
    Alert.alert("Delete Contact", `Delete "${contact.name}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await axiosClient.delete(ENDPOINTS.CRM_CONTACT_BY_ID(contact.id)); fetchContacts(true); setSelectedContact(null); }
        catch (e: any) { Alert.alert("Error", e.message || "Delete failed."); }
      }},
    ]);
  };

  const filtered = contacts.filter(ct => !search.trim() || String(ct.name || "").toLowerCase().includes(search.toLowerCase()) || String(ct.company || "").toLowerCase().includes(search.toLowerCase()) || String(ct.email || "").toLowerCase().includes(search.toLowerCase()));

  if (loading && !refreshing) return <ScreenContainer scrollable={false}><Header title="CRM Contacts" subtitle="Contact Management" /><DashboardSkeleton /></ScreenContainer>;
  if (error && !contacts.length) return <ScreenContainer scrollable={false}><Header title="CRM Contacts" subtitle="Contact Management" /><ErrorState message={error} onRetry={fetchContacts} /></ScreenContainer>;

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchContacts(true)}>
        <Header title="CRM Contacts" subtitle="Customer Relationship Management" rightAction={
          <TouchableOpacity onPress={() => setAddModal(true)} style={[styles.addBtn, { backgroundColor: c.primary }]} activeOpacity={0.8}>
            <Plus size={15} color="#FFF" strokeWidth={2.5} /><Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        } />
        <Card style={[styles.kpiCard, { backgroundColor: c.primaryLight }]}>
          <Users size={14} color={c.primary} />
          <Text style={[styles.kpiLabel, { color: c.primary }]}>Total Contacts: <Text style={styles.kpiValue}>{contacts.length}</Text></Text>
        </Card>
        <View style={[styles.searchBox, { backgroundColor: theme.isDark ? c.surfaceSecondary : "#F1F5F9", borderColor: c.border }]}>
          <Search size={16} color={c.textMuted} /><TextInput placeholder="Search contacts..." placeholderTextColor={c.textMuted} value={search} onChangeText={setSearch} style={[styles.searchInput, { color: c.textPrimary }]} />
          {search ? <TouchableOpacity onPress={() => setSearch("")}><X size={14} color={c.textMuted} /></TouchableOpacity> : null}
        </View>
        {filtered.length === 0 ? <EmptyState title="No Contacts" description="Add your first CRM contact." /> : filtered.map(ct => (
          <TouchableOpacity key={String(ct.id)} onPress={() => setSelectedContact(ct)} activeOpacity={0.8}>
            <Card style={styles.contactCard}>
              <View style={styles.contactRow}>
                <View style={[styles.avatar, { backgroundColor: c.primaryLight }]}><User size={18} color={c.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: c.textPrimary }]}>{ct.name}</Text>
                  {ct.company && <View style={styles.infoRow}><Building size={11} color={c.textMuted} /><Text style={[styles.infoText, { color: c.textMuted }]}>{ct.company}</Text></View>}
                  {ct.email && <View style={styles.infoRow}><Mail size={11} color={c.textMuted} /><Text style={[styles.infoText, { color: c.textMuted }]}>{ct.email}</Text></View>}
                </View>
                {ct.phone && (
                  <TouchableOpacity style={[styles.callBtn, { backgroundColor: c.successLight }]}>
                    <Phone size={14} color={c.success} />
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScreenContainer>
      <Modal visible={addModal} animationType="slide" transparent onRequestClose={() => setAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
            <View style={styles.modalHeader}><Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>Add Contact</Text><TouchableOpacity onPress={() => setAddModal(false)}><X size={22} color={c.textMuted} /></TouchableOpacity></View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 120 }}>
              <TextField label="Name *" placeholder="Full name" value={name} onChangeText={setName} />
              <TextField label="Email" placeholder="email@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
              <TextField label="Phone" placeholder="+91 XXXXX XXXXX" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <TextField label="Company" placeholder="Company name" value={company} onChangeText={setCompany} />
              <TextField label="Notes" placeholder="Additional notes..." value={notes} onChangeText={setNotes} multiline />
            </ScrollView>
            <PrimaryButton title="Add Contact" onPress={handleCreate} loading={submitting} />
          </View>
        </View>
      </Modal>
      <Modal visible={!!selectedContact} animationType="slide" transparent onRequestClose={() => setSelectedContact(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
            {selectedContact && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}><Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>{selectedContact.name}</Text><TouchableOpacity onPress={() => setSelectedContact(null)}><X size={22} color={c.textMuted} /></TouchableOpacity></View>
                {[{ label: "Email", value: selectedContact.email }, { label: "Phone", value: selectedContact.phone }, { label: "Company", value: selectedContact.company }, { label: "Notes", value: selectedContact.notes }].filter(r => r.value).map(row => (
                  <View key={row.label} style={styles.detailRow}><Text style={[styles.detailLabel, { color: c.textMuted }]}>{row.label}:</Text><Text style={[styles.detailVal, { color: c.textPrimary }]}>{row.value}</Text></View>
                ))}
                <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: "rgba(239,68,68,0.1)", borderColor: c.error + "40" }]} onPress={() => handleDelete(selectedContact)} activeOpacity={0.8}>
                  <Text style={[styles.deleteBtnText, { color: c.error }]}>Delete Contact</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  addBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, gap: 4 },
  addBtnText: { color: "#FFF", fontSize: 12, fontWeight: "800" },
  kpiCard: { flexDirection: "row", alignItems: "center", padding: 12, gap: 8, marginBottom: 8 },
  kpiLabel: { fontSize: 13, fontWeight: "600" },
  kpiValue: { fontWeight: "800" },
  searchBox: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, height: 44, marginBottom: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 13 },
  contactCard: { marginVertical: 4, padding: 12 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 14, fontWeight: "700" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  infoText: { fontSize: 11 },
  callBtn: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, padding: 22, maxHeight: "85%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(148,163,184,0.15)" },
  detailLabel: { fontSize: 13, fontWeight: "500" },
  detailVal: { fontSize: 13, fontWeight: "700", maxWidth: "55%", textAlign: "right" },
  deleteBtn: { marginTop: 16, alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  deleteBtnText: { fontSize: 13, fontWeight: "700" },
});