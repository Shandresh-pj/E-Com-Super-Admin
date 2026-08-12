import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, FlatList,
  Alert, TextInput, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { Header } from "../../../components/common/Header";
import { PrimaryButton } from "../../../components/buttons/PrimaryButton";
import { DashboardSkeleton } from "../../../components/skeletons/SkeletonLoader";
import { EmptyState, ErrorState } from "../../../components/common/States";
import { useTheme } from "../../../theme/theme";
import { axiosClient } from "../../../api/axiosClient";
import { ENDPOINTS } from "../../../api/endpoints";
import { normalizeApiResponse } from "../../../api/responseNormalizer";
import { useAuthStore } from "../../../store/authStore";
import { MessageSquare, Plus, X, Send, Users, Lock, ArrowLeft } from "lucide-react-native";
import { Card } from "../../../components/common/Card";

interface ChatRoom {
  id: number | string;
  name: string;
  type?: "PRIVATE" | "GROUP" | "CHANNEL" | string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  member_count?: number;
}

interface ChatMessage {
  id: number | string;
  sender_id?: number | string;
  sender_name?: string;
  content: string;
  created_at?: string;
  is_mine?: boolean;
}

export const SecureChatScreen: React.FC = () => {
  const theme = useTheme();
  const c = theme.colors;
  const userId = useAuthStore(s => s.user?.id);
  const userName = useAuthStore(s => s.user?.name || s.user?.email);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await axiosClient.get(ENDPOINTS.CHAT_ROOMS);
      const data = normalizeApiResponse<ChatRoom[]>(res.data);
      setRooms(Array.isArray(data.data) ? data.data : []);
    } catch (e: any) { setError(e.message || "Failed to load chat rooms"); }
    finally { setLoading(false); }
  }, []);

  const fetchMessages = useCallback(async (roomId: number | string) => {
    setMsgLoading(true);
    try {
      const res = await axiosClient.get(ENDPOINTS.CHAT_MESSAGES(roomId));
      const data = normalizeApiResponse<ChatMessage[]>(res.data);
      const msgs = Array.isArray(data.data) ? data.data : [];
      setMessages(msgs.map(m => ({ ...m, is_mine: String(m.sender_id) === String(userId) })));
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    } catch { setMessages([]); }
    finally { setMsgLoading(false); }
  }, [userId]);

  useEffect(() => { fetchRooms(); }, []);

  const openRoom = (room: ChatRoom) => { setActiveRoom(room); fetchMessages(room.id); };

  const sendMessage = async () => {
    if (!draft.trim() || !activeRoom) return;
    const content = draft.trim();
    setDraft("");
    const tempMsg: ChatMessage = { id: Date.now(), sender_id: userId, sender_name: userName || "You", content, is_mine: true, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    setSending(true);
    try {
      await axiosClient.post(ENDPOINTS.CHAT_MESSAGES(activeRoom.id), { content });
    } catch { /* message optimistic updated, silent error */ }
    finally { setSending(false); }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) { Alert.alert("Required", "Room name is required."); return; }
    setSubmitting(true);
    try {
      await axiosClient.post(ENDPOINTS.CHAT_ROOMS, { name: newRoomName, type: "GROUP" });
      Alert.alert("Created", `Room "${newRoomName}" created.`);
      setCreateModal(false); setNewRoomName(""); fetchRooms();
    } catch (e: any) { Alert.alert("Error", e.message || "Create failed."); }
    finally { setSubmitting(false); }
  };

  const formatTime = (ts?: string) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  if (activeRoom) {
    return (
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.isDark ? c.background : "#F8FAFC" }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
        <View style={[styles.chatHeader, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderBottomColor: c.border }]}>
          <TouchableOpacity onPress={() => { setActiveRoom(null); setMessages([]); }} style={styles.backBtn}><ArrowLeft size={20} color={c.textPrimary} /></TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.chatRoomName, { color: c.textPrimary }]}>{activeRoom.name}</Text>
            {activeRoom.member_count && <Text style={[styles.chatMemberCount, { color: c.textMuted }]}>{activeRoom.member_count} members</Text>}
          </View>
          <View style={[styles.lockBadge, { backgroundColor: c.successLight }]}><Lock size={12} color={c.success} /><Text style={[styles.lockText, { color: c.success }]}>Encrypted</Text></View>
        </View>

        {msgLoading ? (
          <View style={styles.loadingCenter}><Text style={{ color: c.textMuted }}>Loading messages...</Text></View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={styles.msgList}
            ListEmptyComponent={<EmptyState title="No Messages" description="Send the first message!" />}
            renderItem={({ item }) => (
              <View style={[styles.msgWrapper, item.is_mine && styles.msgWrapperMine]}>
                {!item.is_mine && <Text style={[styles.senderName, { color: c.primary }]}>{item.sender_name}</Text>}
                <View style={[styles.msgBubble, item.is_mine ? { backgroundColor: c.primary } : { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border, borderWidth: 1 }]}>
                  <Text style={[styles.msgText, { color: item.is_mine ? "#FFF" : c.textPrimary }]}>{item.content}</Text>
                </View>
                <Text style={[styles.msgTime, { color: c.textMuted, textAlign: item.is_mine ? "right" : "left" }]}>{formatTime(item.created_at)}</Text>
              </View>
            )}
          />
        )}

        <View style={[styles.inputBar, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderTopColor: c.border }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a message..."
            placeholderTextColor={c.textMuted}
            style={[styles.msgInput, { color: c.textPrimary, backgroundColor: theme.isDark ? c.surfaceSecondary : "#F1F5F9" }]}
            multiline
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity onPress={sendMessage} disabled={!draft.trim() || sending} style={[styles.sendBtn, { backgroundColor: draft.trim() ? c.primary : c.textMuted + "44" }]} activeOpacity={0.8}>
            <Send size={18} color={draft.trim() ? "#FFF" : c.textMuted} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.roomHeader, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderBottomColor: c.border }]}>
        <Text style={[styles.roomHeaderTitle, { color: c.textPrimary }]}>Secure Chat</Text>
        <TouchableOpacity onPress={() => setCreateModal(true)} style={[styles.addBtn, { backgroundColor: c.primary }]} activeOpacity={0.8}>
          <Plus size={15} color="#FFF" strokeWidth={2.5} /><Text style={styles.addBtnText}>Room</Text>
        </TouchableOpacity>
      </View>

      {loading ? <DashboardSkeleton /> : error && !rooms.length ? <ErrorState message={error} onRetry={fetchRooms} /> : rooms.length === 0 ? (
        <EmptyState title="No Chat Rooms" description="Create a group or private chat room." />
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ padding: 12 }}
          onRefresh={fetchRooms}
          refreshing={loading}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => openRoom(item)} activeOpacity={0.85}>
              <Card style={styles.roomCard}>
                <View style={styles.roomRow}>
                  <View style={[styles.roomAvatar, { backgroundColor: c.primaryLight }]}>
                    {item.type === "PRIVATE" ? <Lock size={18} color={c.primary} /> : <Users size={18} color={c.primary} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.roomTitleRow}>
                      <Text style={[styles.roomName, { color: c.textPrimary }]}>{item.name}</Text>
                      {item.last_message_at && <Text style={[styles.roomTime, { color: c.textMuted }]}>{formatTime(item.last_message_at)}</Text>}
                    </View>
                    {item.last_message && <Text style={[styles.roomPreview, { color: c.textMuted }]} numberOfLines={1}>{item.last_message}</Text>}
                    {item.member_count && <Text style={[styles.roomMembers, { color: c.textMuted }]}>{item.member_count} members</Text>}
                  </View>
                  {item.unread_count ? <View style={[styles.unreadBadge, { backgroundColor: c.primary }]}><Text style={styles.unreadText}>{item.unread_count}</Text></View> : null}
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={createModal} animationType="slide" transparent onRequestClose={() => setCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.isDark ? c.surface : "#FFF", borderColor: c.border }]}>
            <View style={styles.modalHeader}><Text style={{ fontSize: 17, fontWeight: "700", color: c.textPrimary }}>Create Chat Room</Text><TouchableOpacity onPress={() => setCreateModal(false)}><X size={22} color={c.textMuted} /></TouchableOpacity></View>
            <TextInput placeholder="Room name..." placeholderTextColor={c.textMuted} value={newRoomName} onChangeText={setNewRoomName} style={[styles.roomNameInput, { borderColor: c.border, color: c.textPrimary, backgroundColor: theme.isDark ? c.surfaceSecondary : "#F8FAFC" }]} />
            <View style={{ marginTop: 16 }}><PrimaryButton title="Create Room" onPress={handleCreateRoom} loading={submitting} /></View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  chatHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingTop: 52, paddingBottom: 12, borderBottomWidth: 1, gap: 10 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  chatRoomName: { fontSize: 16, fontWeight: "800" },
  chatMemberCount: { fontSize: 11, marginTop: 1 },
  lockBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  lockText: { fontSize: 10, fontWeight: "700" },
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  msgList: { padding: 12, paddingBottom: 20 },
  msgWrapper: { marginBottom: 12, maxWidth: "80%", alignSelf: "flex-start" },
  msgWrapperMine: { alignSelf: "flex-end" },
  senderName: { fontSize: 11, fontWeight: "700", marginBottom: 2 },
  msgBubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  msgText: { fontSize: 14, lineHeight: 20 },
  msgTime: { fontSize: 10, marginTop: 3 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", padding: 10, borderTopWidth: 1, gap: 8 },
  msgInput: { flex: 1, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, maxHeight: 120 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  roomHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, borderBottomWidth: 1 },
  roomHeaderTitle: { fontSize: 20, fontWeight: "800" },
  addBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, gap: 4 },
  addBtnText: { color: "#FFF", fontSize: 12, fontWeight: "800" },
  roomCard: { marginVertical: 4, padding: 12 },
  roomRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  roomAvatar: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  roomTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  roomName: { fontSize: 14, fontWeight: "700", flex: 1 },
  roomTime: { fontSize: 10 },
  roomPreview: { fontSize: 12, marginTop: 2 },
  roomMembers: { fontSize: 10, marginTop: 2 },
  unreadBadge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  unreadText: { color: "#FFF", fontSize: 10, fontWeight: "800" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, padding: 22, maxHeight: "50%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  roomNameInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
});