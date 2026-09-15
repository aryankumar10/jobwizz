import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../contexts/AuthContext';

export const SettingsScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://jobwizz.vercel.app';
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://hzeousrrnyrezysasnie.supabase.co';

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  const handleOpenWebDashboard = async () => {
    try {
      await WebBrowser.openBrowserAsync(apiUrl);
    } catch (e) {
      console.warn('Could not open web dashboard:', e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Account and synchronization</Text>
      </View>

      {/* Account Card */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>User Account</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Email</Text>
          <Text style={styles.rowValue} numberOfLines={1}>{user?.email || 'N/A'}</Text>
        </View>
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <Text style={styles.rowLabel}>User ID</Text>
          <Text style={styles.rowValueSmall} numberOfLines={1}>{user?.id || 'N/A'}</Text>
        </View>
      </View>

      {/* Sync / Endpoints Card */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>Cloud Sync</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Backend API</Text>
          <Text style={styles.rowValueSmall} numberOfLines={1}>{apiUrl}</Text>
        </View>
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <Text style={styles.rowLabel}>Database</Text>
          <Text style={styles.rowValueSmall} numberOfLines={1}>{supabaseUrl}</Text>
        </View>
      </View>

      {/* Quick Action Links */}
      <TouchableOpacity style={styles.actionCard} onPress={handleOpenWebDashboard}>
        <Text style={styles.actionCardTitle}>🌐 Open Web Dashboard</Text>
        <Text style={styles.actionCardDesc}>View full analytics and table on the web</Text>
      </TouchableOpacity>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>🚪 Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f293d',
    marginBottom: 16,
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#818cf8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  rowLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  rowValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '65%',
  },
  rowValueSmall: {
    color: '#cbd5e1',
    fontSize: 12,
    maxWidth: '65%',
  },
  actionCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f293d',
    marginBottom: 24,
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f8fafc',
  },
  actionCardDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  signOutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#f87171',
    fontSize: 15,
    fontWeight: '700',
  },
});
