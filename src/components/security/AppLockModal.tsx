import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Vibration,
  Platform,
} from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect, Circle } from 'react-native-svg';
import {
  ShieldCheck,
  Fingerprint,
  Delete,
  KeyRound,
  Lock,
  AlertCircle,
  Smartphone,
  Clock,
} from 'lucide-react-native';
import { AppLockService, AuthMethod } from '../../security/appLockService';
import { BiometricService } from '../../security/biometricService';
import { DeviceCredentialService } from '../../security/deviceCredentialService';
import { PinSecurityService, PinLength, PinLockoutStatus } from '../../security/pinSecurityService';
import { useTheme } from '../../theme/theme';
import { useAuthStore } from '../../store/authStore';

const { width, height } = Dimensions.get('window');

interface AppLockModalProps {
  visible: boolean;
  onUnlockSuccess: () => void;
}

export const AppLockModal: React.FC<AppLockModalProps> = ({
  visible,
  onUnlockSuccess,
}) => {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);

  const [activeMethod, setActiveMethod] = useState<AuthMethod>('biometrics');
  const [pinLength, setPinLength] = useState<PinLength>(4);
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lockout, setLockout] = useState<PinLockoutStatus>({
    isLockedOut: false,
    remainingSeconds: 0,
    failedAttempts: 0,
  });

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const lockoutTimerRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      setPin('');
      setErrorMsg(null);

      // Load settings
      AppLockService.getSettings().then((s) => {
        setActiveMethod(s.authMethod || 'biometrics');
        setPinLength(s.pinLength || 4);
      });

      // Check lockout status
      checkLockout();

      // Start pulse loop
      pulseLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      pulseLoopRef.current.start();
    } else {
      pulseLoopRef.current?.stop();
      if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
    }
  }, [visible]);

  const checkLockout = async () => {
    const status = await PinSecurityService.getLockoutStatus();
    setLockout(status);

    if (status.isLockedOut) {
      if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
      lockoutTimerRef.current = setInterval(async () => {
        const updated = await PinSecurityService.getLockoutStatus();
        setLockout(updated);
        if (!updated.isLockedOut) {
          clearInterval(lockoutTimerRef.current);
        }
      }, 1000);
    }
  };

  const triggerShake = () => {
    if (Platform.OS === 'android') {
      try { Vibration.vibrate(120); } catch {}
    }
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  };

  // 1. Biometric Unlock
  const handleBiometricUnlock = async () => {
    setIsScanning(true);
    setErrorMsg(null);
    if (Platform.OS === 'android') {
      try { Vibration.vibrate(30); } catch {}
    }

    try {
      const res = await BiometricService.authenticate('Scan fingerprint or face to unlock SVK E-Com Pro');
      if (res.success) {
        if (Platform.OS === 'android') {
          try { Vibration.vibrate([0, 40, 40, 40]); } catch {}
        }
        await AppLockService.updateLastActiveTimestamp();
        onUnlockSuccess();
      } else {
        setErrorMsg(res.error || 'Biometric authentication failed');
      }
    } catch {
      setErrorMsg('Biometric verification failed');
    } finally {
      setIsScanning(false);
    }
  };

  // 2. Device Credential Unlock
  const handleDeviceCredentialUnlock = async () => {
    setIsScanning(true);
    setErrorMsg(null);
    try {
      const res = await DeviceCredentialService.authenticateWithDeviceCredential();
      if (res.success) {
        await AppLockService.updateLastActiveTimestamp();
        onUnlockSuccess();
      } else {
        setErrorMsg(res.error || 'Device passcode verification failed');
      }
    } catch {
      setErrorMsg('Device credential verification failed');
    } finally {
      setIsScanning(false);
    }
  };

  // 3. Custom App PIN Keypad Press
  const handlePinKey = async (num: string) => {
    if (lockout.isLockedOut) return;
    if (pin.length >= pinLength) return;

    const newPin = pin + num;
    setPin(newPin);
    setErrorMsg(null);

    if (newPin.length === pinLength) {
      const verifyRes = await PinSecurityService.verifyPin(newPin);
      if (verifyRes.success) {
        if (Platform.OS === 'android') {
          try { Vibration.vibrate([0, 40, 40, 40]); } catch {}
        }
        await AppLockService.updateLastActiveTimestamp();
        onUnlockSuccess();
      } else {
        triggerShake();
        if (verifyRes.lockoutStatus?.isLockedOut) {
          setErrorMsg(`Too many failed attempts. Locked for ${verifyRes.lockoutStatus.remainingSeconds}s.`);
          checkLockout();
        } else {
          setErrorMsg('Incorrect PIN. Please try again.');
        }
        setTimeout(() => {
          setPin('');
        }, 400);
      }
    }
  };

  const handleDelete = () => {
    if (lockout.isLockedOut) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const c = theme.colors;

  return (
    <Modal visible={visible} animationType="fade" transparent={false} statusBarTranslucent>
      <View style={[styles.container, { backgroundColor: c.background }]}>
        {/* SVG Ambient Glow */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="lock_glow" cx="50%" cy="28%" r="55%">
                <Stop offset="0%" stopColor={c.primary} stopOpacity={theme.isDark ? '0.24' : '0.12'} />
                <Stop offset="100%" stopColor={c.primary} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect width={width} height={height} fill="url(#lock_glow)" />
            <Circle cx={width * 0.5} cy={height * 0.26} r={130} stroke={c.primary} strokeOpacity="0.08" strokeWidth="1" fill="none" />
            <Circle cx={width * 0.5} cy={height * 0.26} r={170} stroke={c.primary} strokeOpacity="0.04" strokeWidth="1" fill="none" />
          </Svg>
        </View>

        {/* ── Brand & Security Header ───────────────────────────────── */}
        <View style={styles.topHeader}>
          <View style={[styles.shieldIconBox, { backgroundColor: c.primaryLight }]}>
            <ShieldCheck size={38} color={c.primary} strokeWidth={2.2} />
          </View>
          <Text style={[styles.appTitle, { color: c.textPrimary }]}>SVK Security Lock</Text>
          <Text style={[styles.subText, { color: c.textMuted }]}>
            Authenticated session protected for {user?.name || user?.email || 'Administrator'}
          </Text>
        </View>

        {/* ── Method Selector Chips ─────────────────────────────────── */}
        <View style={[styles.methodBar, { backgroundColor: theme.isDark ? c.surfaceSecondary : '#EEF2FF' }]}>
          <TouchableOpacity
            style={[styles.methodChip, activeMethod === 'biometrics' && [styles.activeChip, { backgroundColor: c.primary }]]}
            onPress={() => { setActiveMethod('biometrics'); setErrorMsg(null); }}
            activeOpacity={0.8}
          >
            <Fingerprint size={14} color={activeMethod === 'biometrics' ? '#FFFFFF' : c.textMuted} />
            <Text style={[styles.methodChipText, { color: activeMethod === 'biometrics' ? '#FFFFFF' : c.textMuted }]}>
              Biometric
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodChip, activeMethod === 'device_credential' && [styles.activeChip, { backgroundColor: c.primary }]]}
            onPress={() => { setActiveMethod('device_credential'); setErrorMsg(null); }}
            activeOpacity={0.8}
          >
            <Smartphone size={14} color={activeMethod === 'device_credential' ? '#FFFFFF' : c.textMuted} />
            <Text style={[styles.methodChipText, { color: activeMethod === 'device_credential' ? '#FFFFFF' : c.textMuted }]}>
              Device Lock
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodChip, activeMethod === 'pin' && [styles.activeChip, { backgroundColor: c.primary }]]}
            onPress={() => { setActiveMethod('pin'); setErrorMsg(null); }}
            activeOpacity={0.8}
          >
            <KeyRound size={14} color={activeMethod === 'pin' ? '#FFFFFF' : c.textMuted} />
            <Text style={[styles.methodChipText, { color: activeMethod === 'pin' ? '#FFFFFF' : c.textMuted }]}>
              App PIN
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Error / Lockout Banner ────────────────────────────────── */}
        {lockout.isLockedOut ? (
          <View style={[styles.lockoutBanner, { backgroundColor: c.errorLight, borderColor: c.error }]}>
            <Clock size={16} color={c.error} />
            <Text style={[styles.lockoutText, { color: c.error }]}>
              Temporary Lockout: Wait {lockout.remainingSeconds}s
            </Text>
          </View>
        ) : errorMsg ? (
          <View style={[styles.errorBanner, { backgroundColor: c.errorLight, borderColor: c.error }]}>
            <AlertCircle size={14} color={c.error} />
            <Text style={[styles.errorText, { color: c.error }]}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* ── Method 1: Biometric Scanner ───────────────────────────── */}
        {activeMethod === 'biometrics' && (
          <View style={styles.methodContent}>
            <Text style={[styles.instruction, { color: c.textSecondary }]}>
              Touch the fingerprint sensor to unlock
            </Text>

            <TouchableOpacity activeOpacity={0.7} onPress={handleBiometricUnlock} style={styles.touchArea}>
              <Animated.View
                style={[
                  styles.scannerRing,
                  { borderColor: isScanning ? c.accent : c.primary, transform: [{ scale: pulseAnim }] },
                ]}
              >
                <View style={[styles.scannerInner, { backgroundColor: isScanning ? c.accentLight : c.primaryLight }]}>
                  <Fingerprint size={58} color={isScanning ? c.accent : c.primary} strokeWidth={1.8} />
                </View>
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setActiveMethod('pin')} style={styles.switchBtn}>
              <Text style={[styles.switchBtnText, { color: c.primary }]}>
                Use {pinLength}-Digit App PIN instead
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Method 2: Device Credential ───────────────────────────── */}
        {activeMethod === 'device_credential' && (
          <View style={styles.methodContent}>
            <Text style={[styles.instruction, { color: c.textSecondary }]}>
              Unlock with your Android Device PIN / Passcode
            </Text>

            <TouchableOpacity activeOpacity={0.8} onPress={handleDeviceCredentialUnlock} style={styles.deviceUnlockBtn}>
              <View style={[styles.deviceIconBox, { backgroundColor: c.primaryLight }]}>
                <Smartphone size={48} color={c.primary} />
              </View>
              <Text style={[styles.deviceBtnTitle, { color: c.primary }]}>Prompt Device Lock</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setActiveMethod('pin')} style={styles.switchBtn}>
              <Text style={[styles.switchBtnText, { color: c.primary }]}>
                Use {pinLength}-Digit App PIN instead
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Method 3: Custom App PIN ──────────────────────────────── */}
        {activeMethod === 'pin' && (
          <View style={styles.pinContent}>
            <Text style={[styles.pinInstruction, { color: c.textSecondary }]}>
              Enter your {pinLength}-digit security PIN
            </Text>

            {/* Dynamic PIN Dots */}
            <Animated.View style={[styles.pinDotsRow, { transform: [{ translateX: shakeAnim }] }]}>
              {Array.from({ length: pinLength }).map((_, idx) => {
                const isFilled = pin.length > idx;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.pinDot,
                      {
                        backgroundColor: isFilled ? c.primary : 'transparent',
                        borderColor: isFilled ? c.primary : c.border,
                      },
                    ]}
                  />
                );
              })}
            </Animated.View>

            {/* Numeric Keypad */}
            <View style={styles.keypad}>
              {[
                ['1', '2', '3'],
                ['4', '5', '6'],
                ['7', '8', '9'],
                ['bio', '0', 'del'],
              ].map((row, rowIdx) => (
                <View key={rowIdx} style={styles.keypadRow}>
                  {row.map((key) => {
                    if (key === 'bio') {
                      return (
                        <TouchableOpacity
                          key={key}
                          style={[styles.keypadBtn, { backgroundColor: c.primaryLight }]}
                          onPress={() => setActiveMethod('biometrics')}
                          activeOpacity={0.7}
                        >
                          <Fingerprint size={22} color={c.primary} />
                        </TouchableOpacity>
                      );
                    }
                    if (key === 'del') {
                      return (
                        <TouchableOpacity
                          key={key}
                          style={[styles.keypadBtn, { backgroundColor: theme.isDark ? c.surfaceSecondary : '#F1F5F9' }]}
                          onPress={handleDelete}
                          activeOpacity={0.7}
                        >
                          <Delete size={20} color={c.textPrimary} />
                        </TouchableOpacity>
                      );
                    }
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.keypadBtn,
                          {
                            backgroundColor: theme.isDark ? c.surface : '#FFFFFF',
                            borderColor: c.border,
                            opacity: lockout.isLockedOut ? 0.4 : 1,
                          },
                        ]}
                        onPress={() => handlePinKey(key)}
                        disabled={lockout.isLockedOut}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.keypadNumber, { color: c.textPrimary }]}>{key}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Footer Security Badge ─────────────────────────────────── */}
        <View style={styles.lockFooter}>
          <Lock size={12} color={c.textMuted} />
          <Text style={[styles.lockFooterText, { color: c.textMuted }]}>
            {' '}Hardware Keystore · Salted SHA-256 Protected
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 26,
    paddingTop: 60,
    paddingBottom: 32,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topHeader: {
    alignItems: 'center',
  },
  shieldIconBox: {
    width: 76,
    height: 76,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 6,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },

  // Method Selector Bar
  methodBar: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    width: '100%',
    maxWidth: 320,
    marginTop: 8,
  },
  methodChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  activeChip: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  methodChipText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Banners
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lockoutBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  lockoutText: {
    fontSize: 13,
    fontWeight: '800',
  },

  // Method Content
  methodContent: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  instruction: {
    fontSize: 13,
    marginBottom: 24,
    fontWeight: '500',
  },
  touchArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
  },
  deviceUnlockBtn: {
    alignItems: 'center',
    gap: 12,
  },
  deviceIconBox: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceBtnTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  switchBtn: {
    marginTop: 28,
    paddingVertical: 8,
  },
  switchBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // PIN Content
  pinContent: {
    alignItems: 'center',
    width: '100%',
  },
  pinInstruction: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
  },
  pinDotsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 22,
  },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  keypad: {
    width: '100%',
    maxWidth: 280,
    gap: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keypadBtn: {
    width: 70,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  keypadNumber: {
    fontSize: 22,
    fontWeight: '700',
  },

  // Footer
  lockFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockFooterText: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
