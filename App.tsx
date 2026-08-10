import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';

// ─── Root Error Boundary ─────────────────────────────────────────────────────

interface EBState { hasError: boolean; error: Error | null }

class RootErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[SVK E-Com Pro] Uncaught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={eb.wrap}>
          <View style={eb.box}>
            <Text style={eb.title}>SVK E-Com Pro</Text>
            <Text style={eb.sub}>
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </Text>
            <TouchableOpacity
              style={eb.btn}
              onPress={() => this.setState({ hasError: false, error: null })}
              activeOpacity={0.8}
            >
              <Text style={eb.btnTxt}>Reload App</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

import { SocketProvider } from './src/api/SocketProvider';

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider style={styles.root}>
        <RootErrorBoundary>
          <SocketProvider>
            <RootNavigator />
          </SocketProvider>
        </RootErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
});

const eb = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#07090E',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  box: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  sub: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  btn: {
    backgroundColor: '#4338CA',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btnTxt: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
