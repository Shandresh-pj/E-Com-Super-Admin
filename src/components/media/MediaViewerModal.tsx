import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { X, Play, Image as ImageIcon, Video, ExternalLink, RefreshCw } from 'lucide-react-native';
import { NormalizedMediaItem } from '../../api/mediaService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MediaViewerModalProps {
  visible: boolean;
  mediaItem: NormalizedMediaItem | null;
  onClose: () => void;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({ visible, mediaItem, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!mediaItem) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Text style={styles.mediaTitle} numberOfLines={1}>
            {mediaItem.title || (mediaItem.type === 'video' ? 'Product Video' : 'Product Photo')}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
            <X size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Media Preview Stage */}
        <View style={styles.stage}>
          {mediaItem.type === 'image' ? (
            <>
              <Image
                source={{ uri: mediaItem.url }}
                style={styles.fullImage}
                resizeMode="contain"
                onLoadStart={() => {
                  setLoading(true);
                  setError(false);
                }}
                onLoadEnd={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError(true);
                }}
              />
              {loading && (
                <View style={styles.loaderBox}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                </View>
              )}
              {error && (
                <View style={styles.errorBox}>
                  <ImageIcon size={38} color="#94A3B8" />
                  <Text style={styles.errorText}>Unable to render image</Text>
                  <TouchableOpacity
                    onPress={() => setError(false)}
                    style={styles.retryBtn}
                  >
                    <RefreshCw size={14} color="#FFFFFF" />
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <View style={styles.videoStage}>
              <View style={styles.videoIconBox}>
                <Video size={48} color="#38BDF8" />
              </View>
              <Text style={styles.videoNoticeTitle}>Enterprise Video Stream</Text>
              <Text style={styles.videoNoticeSub}>
                Tap below to play video in external high-definition media player.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Linking.openURL(mediaItem.url).catch(() => {
                    Alert.alert('Playback Error', 'Could not open video URL.');
                  });
                }}
                style={styles.playBtn}
                activeOpacity={0.8}
              >
                <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.playBtnText}>Launch Video Stream</Text>
                <ExternalLink size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <Text style={styles.urlText} numberOfLines={1}>
            {mediaItem.url}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  mediaTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  loaderBox: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  errorText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    marginTop: 6,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  videoStage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  videoIconBox: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  videoNoticeTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  videoNoticeSub: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  playBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  urlText: {
    color: '#64748B',
    fontSize: 11,
  },
});
