import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  Vibration,
  Platform,
  Linking,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '../../theme/theme';
import { PermissionService } from '../../security/permissionService';
import { ProductService, Product } from '../../features/products/services/productService';
import {
  Camera,
  X,
  Zap,
  ZapOff,
  RefreshCw,
  Search,
  Check,
  AlertCircle,
  Barcode,
  QrCode,
  Sparkles,
  Settings,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react-native';

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScan: (barcode: string, product?: Product | null) => void;
  title?: string;
  subtitle?: string;
  autoLookupProduct?: boolean;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  visible,
  onClose,
  onScan,
  title = 'Barcode & QR Scanner',
  subtitle = 'Align the barcode within the frame to scan',
  autoLookupProduct = true,
}) => {
  const theme = useTheme();
  const c = theme.colors;
  const { width, height } = useWindowDimensions();

  // State
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [cameraType, setCameraType] = useState<'back' | 'front'>('back');
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [scannedResult, setScannedResult] = useState<{
    code: string;
    product: Product | null;
  } | null>(null);

  // Animations
  const laserAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const resultCardAnim = useRef(new Animated.Value(0)).current;

  // Last scanned barcode timestamp to prevent duplicates
  const lastScannedTime = useRef<number>(0);

  // Check & request camera permission on open
  useEffect(() => {
    if (visible) {
      checkCameraPermission();
      startLaserSweep();
      setScannedResult(null);
      setManualCode('');
      setIsScanning(true);
    }
  }, [visible]);

  const checkCameraPermission = async () => {
    const status = await PermissionService.checkAllPermissions();
    if (status.camera) {
      setHasPermission(true);
    } else {
      const granted = await PermissionService.requestCamera();
      setHasPermission(granted);
    }
  };

  const startLaserSweep = () => {
    laserAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(laserAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(laserAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleBarcodeDetected = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    // Throttle duplicates within 2.5s
    const now = Date.now();
    if (now - lastScannedTime.current < 2500) return;
    lastScannedTime.current = now;

    // Vibration haptic feedback
    try {
      Vibration.vibrate(80);
    } catch {
      // ignore
    }

    setIsScanning(false);

    let product: Product | null = null;
    if (autoLookupProduct) {
      setIsLookingUp(true);
      try {
        product = await ProductService.scanBarcode(trimmed);
      } catch {
        product = null;
      } finally {
        setIsLookingUp(false);
      }
    }

    setScannedResult({ code: trimmed, product });

    // Animate result card entry
    Animated.spring(resultCardAnim, {
      toValue: 1,
      tension: 70,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleConfirmResult = () => {
    if (scannedResult) {
      onScan(scannedResult.code, scannedResult.product);
      onClose();
    }
  };

  const handleRescan = () => {
    setScannedResult(null);
    resultCardAnim.setValue(0);
    setIsScanning(true);
  };

  const handleManualSubmit = () => {
    if (manualCode.trim().length >= 3) {
      handleBarcodeDetected(manualCode.trim());
      setShowManualInput(false);
    }
  };

  const frameSize = Math.min(width * 0.72, 280);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { backgroundColor: '#0B0F19' }]}>
        {/* ── 1. Top Navigation & Controls Bar ──────────────────────── */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.iconCircleBtn} activeOpacity={0.8}>
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.titleWrap}>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          </View>

          <View style={styles.topActionsRow}>
            {/* Flashlight Toggle */}
            <TouchableOpacity
              onPress={() => setIsFlashOn((prev) => !prev)}
              style={[
                styles.iconCircleBtn,
                { backgroundColor: isFlashOn ? '#F59E0B' : 'rgba(255, 255, 255, 0.15)' },
              ]}
              activeOpacity={0.8}
            >
              {isFlashOn ? <Zap size={18} color="#0B0F19" /> : <ZapOff size={18} color="#FFFFFF" />}
            </TouchableOpacity>

            {/* Camera Switch */}
            <TouchableOpacity
              onPress={() => setCameraType((prev) => (prev === 'back' ? 'front' : 'back'))}
              style={[styles.iconCircleBtn, { backgroundColor: 'rgba(255, 255, 255, 0.15)', marginLeft: 8 }]}
              activeOpacity={0.8}
            >
              <RefreshCw size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 2. Camera Viewfinder Area ────────────────────────────── */}
        {hasPermission === false ? (
          /* Permission Denied Recovery View */
          <View style={styles.permissionDeniedBox}>
            <View style={styles.permissionIconCircle}>
              <AlertCircle size={44} color="#EF4444" />
            </View>
            <Text style={styles.deniedTitle}>Camera Access Required</Text>
            <Text style={styles.deniedMessage}>
              To scan physical product barcodes, invoices, and QR codes in real-time, please grant camera access in system settings.
            </Text>
            <TouchableOpacity
              onPress={() => Linking.openSettings()}
              style={styles.openSettingsBtn}
              activeOpacity={0.85}
            >
              <Settings size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.openSettingsText}>Open System Settings</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Live Scanner Viewfinder */
          <View style={styles.viewfinderContainer}>
            {/* Holographic Aiming Frame */}
            <Animated.View
              style={[
                styles.scannerFrame,
                {
                  width: frameSize,
                  height: frameSize,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              {/* 4 Corner Brackets */}
              <View style={[styles.cornerBracket, styles.topLeft]} />
              <View style={[styles.cornerBracket, styles.topRight]} />
              <View style={[styles.cornerBracket, styles.bottomLeft]} />
              <View style={[styles.cornerBracket, styles.bottomRight]} />

              {/* Animated Laser Scanning Line */}
              {isScanning && (
                <Animated.View
                  style={[
                    styles.laserLine,
                    {
                      transform: [
                        {
                          translateY: laserAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, frameSize - 4],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              )}

              {/* Center Target Indicator */}
              <View style={styles.centerTarget}>
                <Barcode size={32} color="rgba(255,255,255,0.4)" strokeWidth={1.5} />
              </View>
            </Animated.View>

            {/* Hint Chip below scanner */}
            <View style={styles.scannerHintPill}>
              <Sparkles size={12} color="#10B981" style={{ marginRight: 6 }} />
              <Text style={styles.scannerHintText}>Auto-Detecting EAN-13, UPC, Code-128 & QR</Text>
            </View>
          </View>
        )}

        {/* ── 3. Scanned Result Preview Card ────────────────────────── */}
        {scannedResult && (
          <Animated.View
            style={[
              styles.resultCard,
              {
                opacity: resultCardAnim,
                transform: [
                  {
                    translateY: resultCardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [60, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.resultHeaderRow}>
              <View style={styles.scannedTag}>
                <Check size={12} color="#10B981" strokeWidth={3} style={{ marginRight: 4 }} />
                <Text style={styles.scannedTagText}>CODE CAPTURED</Text>
              </View>
              <Text style={styles.barcodeNum}>{scannedResult.code}</Text>
            </View>

            {isLookingUp ? (
              <View style={styles.lookingUpRow}>
                <ActivityIndicator size="small" color="#6366F1" />
                <Text style={styles.lookingUpText}>Querying enterprise product catalog...</Text>
              </View>
            ) : scannedResult.product ? (
              <View style={styles.productMatchRow}>
                <View style={styles.productIconBox}>
                  <ShoppingBag size={20} color="#6366F1" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.productTitle} numberOfLines={1}>
                    {scannedResult.product.name}
                  </Text>
                  <Text style={styles.productPrice}>
                    ₹{parseFloat(String(scannedResult.product.price || 0)).toFixed(2)} · Stock: {scannedResult.product.stock || 0}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.noMatchText}>
                No existing product matched in database. Ready to link or search.
              </Text>
            )}

            <View style={styles.resultActionsRow}>
              <TouchableOpacity
                onPress={handleRescan}
                style={styles.rescanBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.rescanBtnText}>Scan Another</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmResult}
                style={styles.confirmBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmBtnText}>Apply Barcode</Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* ── 4. Manual Barcode Keypad Entry Fallback ───────────────── */}
        <View style={styles.bottomControls}>
          {showManualInput ? (
            <View style={styles.manualInputCard}>
              <View style={styles.manualInputHeader}>
                <Text style={styles.manualInputTitle}>Manual Barcode Entry</Text>
                <TouchableOpacity onPress={() => setShowManualInput(false)}>
                  <X size={16} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              <View style={styles.manualInputRow}>
                <TextInput
                  value={manualCode}
                  onChangeText={setManualCode}
                  placeholder="e.g. 8901234567890"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  style={styles.manualInputField}
                  autoFocus
                />
                <TouchableOpacity
                  onPress={handleManualSubmit}
                  style={styles.manualSubmitBtn}
                  activeOpacity={0.8}
                >
                  <Text style={styles.manualSubmitText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowManualInput(true)}
              style={styles.manualEntryTrigger}
              activeOpacity={0.8}
            >
              <Search size={14} color="#94A3B8" style={{ marginRight: 6 }} />
              <Text style={styles.manualEntryTriggerText}>
                Having trouble scanning? Enter barcode manually
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 36,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 10,
  },
  iconCircleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewfinderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  cornerBracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#6366F1',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 18,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 18,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 18,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 18,
  },
  laserLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  centerTarget: {
    opacity: 0.6,
  },
  scannerHintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scannerHintText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  permissionDeniedBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  permissionIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  deniedTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
  },
  deniedMessage: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  openSettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  openSettingsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  resultCard: {
    backgroundColor: '#1E293B',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#6366F1',
    marginBottom: 16,
  },
  resultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scannedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  scannedTagText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  barcodeNum: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  lookingUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  lookingUpText: {
    color: '#94A3B8',
    fontSize: 12,
    marginLeft: 8,
  },
  productMatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
  },
  productIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  productPrice: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  noMatchText: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 12,
  },
  resultActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rescanBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
    alignItems: 'center',
  },
  rescanBtnText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  bottomControls: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  manualEntryTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  manualEntryTriggerText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  manualInputCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  manualInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  manualInputTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  manualInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  manualInputField: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  manualSubmitBtn: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualSubmitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
