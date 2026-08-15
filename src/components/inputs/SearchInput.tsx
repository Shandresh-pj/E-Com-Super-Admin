import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, X, Barcode, Camera } from 'lucide-react-native';
import { useTheme } from '../../theme/theme';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  onScanBarcode?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search...',
  value,
  onChangeText,
  onClear,
  onScanBarcode,
}) => {
  const theme = useTheme();
  const c = theme.colors;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.isDark ? c.surfaceSecondary : '#F8FAFC',
          borderColor: c.border,
          borderRadius: theme.radius.lg || 14,
        },
      ]}
    >
      <Search size={18} color={c.textMuted} style={styles.searchIcon} />
      <TextInput
        style={[styles.input, { color: c.textPrimary }]}
        placeholder={placeholder}
        placeholderTextColor={c.textMuted}
        value={value}
        onChangeText={onChangeText}
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            onChangeText('');
            if (onClear) onClear();
          }}
          style={styles.clearBtn}
        >
          <X size={16} color={c.textMuted} />
        </TouchableOpacity>
      )}

      {onScanBarcode && (
        <TouchableOpacity
          onPress={onScanBarcode}
          style={[styles.barcodeBtn, { backgroundColor: theme.isDark ? '#1E293B' : '#EEF2FF', borderColor: c.primary }]}
          activeOpacity={0.7}
        >
          <Barcode size={16} color={c.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  clearBtn: {
    padding: 6,
  },
  barcodeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
});
