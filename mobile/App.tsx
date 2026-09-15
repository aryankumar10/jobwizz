import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { AuthScreen } from './src/screens/AuthScreen';
import { QuickTrackScreen } from './src/screens/QuickTrackScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

type Tab = 'track' | 'dashboard' | 'settings';

function MainApp() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('track');

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.splashBadge}>
          <Text style={styles.splashEmoji}>🚀</Text>
        </View>
        <Text style={styles.splashTitle}>JobWizz</Text>
        <ActivityIndicator color="#6366f1" size="small" style={{ marginTop: 20 }} />
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="light" backgroundColor="#090d16" />

      {/* Top Navbar */}
      <View style={styles.navbar}>
        <View style={styles.brandRow}>
          <Text style={styles.brandEmoji}>🚀</Text>
          <Text style={styles.brandTitle}>JobWizz</Text>
        </View>
        <View style={styles.userBadge}>
          <Text style={styles.userBadgeText} numberOfLines={1}>
            {user.email?.split('@')[0]}
          </Text>
        </View>
      </View>

      {/* Main Tab Screen */}
      <View style={styles.screenContainer}>
        {activeTab === 'track' && (
          <QuickTrackScreen
            onNavigateToDashboard={() => setActiveTab('dashboard')}
          />
        )}
        {activeTab === 'dashboard' && (
          <DashboardScreen
            onNavigateToTrack={() => setActiveTab('track')}
          />
        )}
        {activeTab === 'settings' && <SettingsScreen />}
      </View>

      {/* Bottom Tab Bar */}
      <SafeAreaView style={styles.tabBar} edges={['bottom']}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'track' && styles.tabButtonActive]}
          onPress={() => setActiveTab('track')}
        >
          <Text style={[styles.tabIcon, activeTab === 'track' && styles.tabIconActive]}>
            ⚡
          </Text>
          <Text style={[styles.tabLabel, activeTab === 'track' && styles.tabLabelActive]}>
            Quick Track
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'dashboard' && styles.tabButtonActive]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={[styles.tabIcon, activeTab === 'dashboard' && styles.tabIconActive]}>
            📊
          </Text>
          <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.tabLabelActive]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'settings' && styles.tabButtonActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabIcon, activeTab === 'settings' && styles.tabIconActive]}>
            ⚙️
          </Text>
          <Text style={[styles.tabLabel, activeTab === 'settings' && styles.tabLabelActive]}>
            Settings
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashBadge: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  splashEmoji: {
    fontSize: 36,
  },
  splashTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#090d16',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandEmoji: {
    fontSize: 22,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  userBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  userBadgeText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: '#1f293d',
    paddingTop: 8,
    paddingBottom: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#818cf8',
    fontWeight: '700',
  },
});
