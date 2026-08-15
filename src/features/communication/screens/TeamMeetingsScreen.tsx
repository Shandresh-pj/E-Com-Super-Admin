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
import { Video, Plus, X, Calendar, Clock, Users, ExternalLink, Trash2 } from "lucide-react-native";

interface TeamMeeting {
  id: number | string;
  title: string;
  description?: string;
  meeting_url?: string;
  scheduled_at?: string;
  duration_minutes?: number;
  host_name?: string;
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED" | string;
  participant_count?: number;
}

export const TeamMeetingsScreen: React.FC = () => {
  const theme = useTheme();
  const c = theme.colors;
  const [meetings, setMeetings] = useState<TeamMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [duration, setDuration] = useState("30");
  const [submitting, setSubmitting] = useState(false);

  const fetchMeetings = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.TEAM_MEETINGS);
      const data = normalizeApiResponse<TeamMeeting[]>(res.data);
      setMeetings(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) { setError(e.message || "Failed to load meetings"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchMeetings(); }, []);

  const handleCreate = async () => {
    if (!title.trim()) { Alert.alert("Required", "Meeting title is required."); return; }
    setSubmitting(true);
    try {
      await axiosClient.post(ENDPOINTS.TEAM_MEETINGS, {
        title, description, meeting_url: meetingUrl, duration_minutes: parseInt(duration, 10) || 30
      });
      Alert.alert("Created", `Meeting "${title}" scheduled.`);
      setAddModal(false); setTitle(""); setDescription(""); setMeetingUrl(""); fetchMeetings(true);
    } catch (e: any) { Alert.alert("Error", e.message || "Schedule failed."); }
    finally { setSubmitting(false); }
  };

  const handleDelete = (m: TeamMeeting) => {
    Alert.alert("Cancel Meeting", `Cancel "${m.title}"?`, [
      { text: "No", style: "cancel" },
      { text: "Cancel Meeting", style: "destructive", onPress: async () => {
        try {
          await axiosClient.post(ENDPOINTS.TEAM_MEETING_END(m.id));
          fetchMeetings(true);
        } catch {
          try {
            await axiosClient.delete(ENDPOINTS.TEAM_MEETING_BY_ID(m.id));
            fetchMeetings(true);
          } catch (e: any) {
            Alert.alert("Error", e.message || "Action failed.");
          }
        }
      }},
    ]);
  };

  const getStatusVariant = (s: string): "success" | "warning" | "error" | "primary" => {
    if (s === "LIVE") return "success";
    if (s === "SCHEDULED") return "primary";
    if (s === "COMPLETED") return "warning";
    return "error";
  };

  if (loading && !refreshing) return <ScreenContainer scrollable={false}><Header title="Team Meetings" subtitle="Video Conferences" /><DashboardSkeleton /></ScreenContainer>;
  if (error && !meetings.length) return <ScreenContainer scrollable={false}><Header title="Team Meetings" subtitle="Video Conferences" /><ErrorState message={error} onRetry={fetchMeetings} /></ScreenContainer>;

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer scrollable refreshing={refreshing} onRefresh={() => fetchMeetings(true)}>
        <Header title="Team Meetings" subtitle="Scheduled Video & Audio Meetings" rightAction={
          <TouchableOpacity onPress={() => setAddModal(true)} style={[styles.addBtn, { backgroundColor: c.primary }]} activeOpacity={0.8}>
            <Plus size={15} color="#FFF" strokeWidth={2.5} /><Text style={styles.addBtnText}>Schedule</Text>
          </TouchableOpacity>
        } />

        {meetings.length === 0 ? <EmptyState title="No Meetings" description="Schedule a video meeting with your team." /> : meetings.map(m => (
          <Card key={String(m.id)} style={styles.meetingCard}>
            <View style={styles.meetingRow}>
              <View style={[styles.iconBox, { backgroundColor: m.status === "LIVE" ? c.successLight : c.primaryLight }]}>
                <Video size={18} color={m.status === "LIVE" ? c.success : c.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: c.textPrimary }]}>{m.title}</Text>
                {m.description && <Text style={[styles.desc, { color: c.textMuted }]} numberOfLines={2}>{m.description}</Text>}
                <View style={styles.metaRow}>
                  {m.scheduled_at && <View style={styles.metaItem}><Calendar size={10} color={c.textMuted} /><Text style={[styles.metaText, { color: c.textMuted }]}>{new Date(m.scheduled_at).toLocaleString("en-IN")}</Text></View>}
                  {m.duration_minutes && <View style={styles.metaItem}><Clock size={10} color={c.textMuted} /><Text style={[styles.metaText, { color: c.textMuted }]}>{m.duration_minutes}m</Text></View>}
                </View>
              </View>
              <Badge label={m.status} variant={getStatusVariant(m.status)} size="sm" />
            </View>
            <View style={styles.actionRow}>
              {m.meeting_url ? (
                <TouchableOpacity style={[styles.joinBtn, { backgroundColor: c.primary }]} activeOpacity={0.8}>
                  <ExternalLink size={13} color="#FFF" /><Text style={styles.joinBtnText}>Join Meeting</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: "rgba(239,68,68,0.1)" }]} onPress={() => handleDelete(m)} activeOpacity={0.8}>
                <Trash2 size={13} color={c.error} />
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScreenContainer>

      <Modal visible={addModal} animationType="slide" transparent onRequestClose={() => setAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
            <View style={styles.modalHeader}><Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>Schedule Meeting</Text><TouchableOpacity onPress={() => setAddModal(false)}><X size={22} color={c.textMuted} /></TouchableOpacity></View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 100 }}>
              <TextField label="Meeting Title *" placeholder="e.g. Weekly Operations Sync" value={title} onChangeText={setTitle} />
              <TextField label="Description" placeholder="Agenda / Notes..." value={description} onChangeText={setDescription} multiline />
              <TextField label="Meeting URL" placeholder="https://meet.google.com/..." value={meetingUrl} onChangeText={setMeetingUrl} />
              <TextField label="Duration (minutes)" placeholder="30" value={duration} onChangeText={setDuration} keyboardType="numeric" />
            </ScrollView>
            <PrimaryButton title="Schedule Meeting" onPress={handleCreate} loading={submitting} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  addBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, gap: 4 },
  addBtnText: { color: "#FFF", fontSize: 12, fontWeight: "800" },
  meetingCard: { marginVertical: 5, padding: 14 },
  meetingRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 14, fontWeight: "700" },
  desc: { fontSize: 11, marginTop: 2 },
  metaRow: { flexDirection: "row", gap: 8, marginTop: 6, flexWrap: "wrap" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 10 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  joinBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 9, borderRadius: 10, gap: 5 },
  joinBtnText: { color: "#FFF", fontSize: 12, fontWeight: "800" },
  cancelBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, padding: 22, maxHeight: "88%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
});