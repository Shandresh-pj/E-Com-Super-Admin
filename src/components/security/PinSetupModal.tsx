import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { KeyRound, Delete, X, ShieldCheck, Check } from 'lucide-react-native';
import { PinSecurityService, PinLength } from '../../security/pinSecurityService';
import { AppLockService } from '../../security/appLockService';
import { useTheme } from '../../theme/theme';

interface PinSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (length: PinLength) => void;
}

export const PinSetupModal: React.FC<PinSetupModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const theme = useTheme();
  const [selectedLength, setSelectedLength] = useState<PinLength>(4);
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const shakeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStep('create');
      setFirstPin('');
      setConfirmPin('');
      setErrorMsg(null);
      PinSecurityService.getConfiguredPinLength().then(setSelectedLength);
    }
  }, [visible]);

  const triggerShake = () => {
    if (Platform.OS === 'android') {
      try { Vibration.vibrate(100); } catch {}
    }
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  };

  const handleKeyPress = async (digit: string) => {
    setErrorMsg(null);

    if (step === 'create') {
      if (firstPin.length >= selectedLength) return;
      const nextPin = firstPin + digit;
      setFirstPin(nextPin);

      if (nextPin.length === selectedLength) {
        // Advance to confirm step
        setTimeout(() => {
          setStep('confirm');
        }, 150);
      }
    } else {
      if (confirmPin.length >= selectedLength) return;
      const nextConfirm = confirmPin + digit;
      setConfirmPin(nextConfirm);

      if (nextConfirm.length === selectedLength) {
        if (nextConfirm === firstPin) {
          // Success! Save salted PIN
          await PinSecurityService.setPin(nextConfirm, selectedLength);
          await AppLockService.setPinLength(selectedLength);
          if (Platform.OS === 'android') {
            try { Vibration.vibrate([0, 50, 50, 50]); } catch {}
          }
          onSuccess(selectedLength);
        } else {
          setErrorMsg('PINs do not match. Please try again.');
          triggerShake();
          setTimeout(() => {
            setConfirmPin('');
            setStep('create');
            setFirstPin('');
          }, 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setErrorMsg(null);
    if (step === 'create') {
      setFirstPin((prev) => prev.slice(0, -1));
    } else {
      if (confirmPin.length === 0) {
        setStep('create');
      } else {
        setConfirmPin((prev) => prev.slice(0, -1));
      }
    }
  };

  const handleChangeLength = (len: PinLength) => {
    setSelectedLength(len);
    setFirstPin('');
    setConfirmPin('');
    setStep('create');
    setErrorMsg(null);
  };

  const currentPin = step === 'create' ? firstPin : confirmPin;
  const c = theme.colors;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.isDark ? c.surface : '#FFFFFF', borderColor: c.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.iconBox, { backgroundColor: c.primaryLight }]}>
                <KeyRound size={20} color={c.primary} />
              </View>
              <Text style={[styles.title, { color: c.textPrimary }]}>
                {step === 'create' ? 'Set Security PIN' : 'Confirm Security PIN'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Length Selector Chips */}
          <View style={styles.lengthSection}>
            <Text style={[styles.lengthLabel, { color: c.textSecondary }]}>PIN Length:</Text>
            <View style={styles.lengthChips}>
              {([4, 6, 8] as PinLength[]).map((len) => {
                const isSelected = selectedLength === len;
                return (
                  <TouchableOpacity
                    key={len}
                    onPress={() => handleChangeLength(len)}
                    style={[
                      styles.lengthChip,
                      {
                        backgroundColor: isSelected ? c.primary : c.surfaceSecondary,
                        borderColor: isSelected ? c.primary : c.border,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.lengthChipText, { color: isSelected ? '#FFFFFF' : c.textSecondary }]}>
                      {len} Digits
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Text style={[styles.stepHint, { color: c.textMuted }]}>
            {step === 'create'
              ? `Enter a new ${selectedLength}-digit passcode`
              : `Re-enter your ${selectedLength}-digit passcode to confirm`}
          </Text>

          {/* Error Message */}
          {errorMsg ? (
            <Text style={[styles.errorText, { color: c.error }]}>{errorMsg}</Text>
          ) : null}

          {/* PIN Indicator Dots */}
          <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
            {Array.from({ length: selectedLength }).map((_, idx) => {
              const isFilled = currentPin.length > idx;
              return (
                <View
                  key={idx}
                  style={[
                    styles.dot,
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
              ['', '0', 'del'],
            ].map((row, rowIdx) => (
              <View key={rowIdx} style={styles.keypadRow}>
                {row.map((key, kIdx) => {
                  if (key === '') {
                    return <View key={kIdx} style={styles.emptyKey} />;
                  }
                  if (key === 'del') {
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[styles.keyBtn, { backgroundColor: theme.isDark ? c.surfaceSecondary : '#F1F5F9' }]}
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
                        styles.keyBtn,
                        {
                          backgroundColor: theme.isDark ? c.surfaceSecondary : '#FFFFFF',
                          borderColor: c.border,
                        },
                      ]}
                      onPress={() => handleKeyPress(key)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.keyNumber, { color: c.textPrimary }]}>{key}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
  },

  // Length Selector
  lengthSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  lengthLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  lengthChips: {
    flexDirection: 'row',
    gap: 8,
  },
  lengthChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  lengthChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepHint: {
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 24,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },

  // Keypad
  keypad: {
    width: '100%',
    maxWidth: 280,
    gap: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keyBtn: {
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
  emptyKey: {
    width: 70,
    height: 56,
  },
  keyNumber: {
    fontSize: 22,
    fontWeight: '700',
  },
});
