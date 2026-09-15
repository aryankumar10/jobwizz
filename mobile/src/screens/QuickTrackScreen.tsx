import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { useAuth } from '../contexts/AuthContext';
import { trackJobFromUrl } from '../lib/api';
import { Job, JobStatus } from '../lib/types';

interface QuickTrackScreenProps {
  onJobTracked?: () => void;
  onNavigateToDashboard?: () => void;
}

const STATUSES: JobStatus[] = ['Applied', 'Interview', 'Offer', 'Rejected'];

export const QuickTrackScreen: React.FC<QuickTrackScreenProps> = ({
  onJobTracked,
  onNavigateToDashboard,
}) => {
  const { session } = useAuth();
  const [jobUrl, setJobUrl] = useState('');
  const [status, setStatus] = useState<JobStatus>('Applied');
  const [notes, setNotes] = useState('');
  const [appliedOn, setAppliedOn] = useState(new Date().toISOString().split('T')[0]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [trackedJob, setTrackedJob] = useState<Job | null>(null);

  // 1. Listen for incoming shared URLs from Android Share Sheet
  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return;
      const parsed = Linking.parse(url);
      // In Android Share intents or deep links, url can come as query param or path
      if (parsed.queryParams?.url) {
        setJobUrl(String(parsed.queryParams.url));
      } else if (parsed.queryParams?.text) {
        // Shared text often contains URLs from LinkedIn or Chrome
        const text = String(parsed.queryParams.text);
        const match = text.match(/https?:\/\/[^\s]+/);
        if (match) setJobUrl(match[0]);
      }
    };

    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', (event) => handleUrl(event.url));
    return () => sub.remove();
  }, []);

  // 2. One-tap Paste from Clipboard
  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        // Extract URL if clipboard contains text with a URL
        const match = text.match(/https?:\/\/[^\s]+/);
        if (match) {
          setJobUrl(match[0]);
        } else {
          setJobUrl(text.trim());
        }
        setErrorMsg(null);
        setDuplicateWarning(null);
      } else {
        Alert.alert('Clipboard Empty', 'No text found in clipboard.');
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  };

  // 3. Submit URL to backend AI extraction pipeline
  const handleTrack = async () => {
    if (!jobUrl.trim()) {
      setErrorMsg('Please paste a valid job URL first.');
      return;
    }

    if (!session?.access_token) {
      setErrorMsg('Session expired. Please sign in again.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setDuplicateWarning(null);
    setTrackedJob(null);

    const res = await trackJobFromUrl(
      {
        jobUrl: jobUrl.trim(),
        status,
        notes: notes.trim(),
        appliedOn,
      },
      session.access_token
    );

    setLoading(false);

    if (res.duplicate) {
      setDuplicateWarning(res.error || 'This job is already tracked in your dashboard.');
      if (res.existingJob) {
        setTrackedJob(res.existingJob);
      }
    } else if (res.success && res.job) {
      setTrackedJob(res.job);
      if (onJobTracked) onJobTracked();
    } else {
      setErrorMsg(res.error || 'Failed to track application. Please check the URL.');
    }
  };

  const handleReset = () => {
    setJobUrl('');
    setNotes('');
    setTrackedJob(null);
    setErrorMsg(null);
    setDuplicateWarning(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚡ Quick Track</Text>
        <Text style={styles.headerDesc}>
          Paste any job link. Gemini AI extracts the role, company, salary, and syncs to your dashboard.
        </Text>
      </View>

      {/* URL Input Box */}
      <View style={styles.card}>
        <View style={styles.inputLabelRow}>
          <Text style={styles.label}>Job Posting URL</Text>
          <TouchableOpacity style={styles.pasteBadge} onPress={handlePaste}>
            <Text style={styles.pasteBadgeText}>📋 Paste Clipboard</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.urlInput}
          placeholder="https://linkedin.com/jobs/view/... or Indeed, Handshake"
          placeholderTextColor="#64748b"
          value={jobUrl}
          onChangeText={(val) => {
            setJobUrl(val);
            if (errorMsg) setErrorMsg(null);
            if (duplicateWarning) setDuplicateWarning(null);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          multiline={false}
        />

        {/* Status Pills */}
        <Text style={[styles.label, { marginTop: 16 }]}>Initial Status</Text>
        <View style={styles.statusRow}>
          {STATUSES.map((s) => {
            const isSelected = status === s;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.statusChip, isSelected && styles.statusChipActive]}
                onPress={() => setStatus(s)}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    isSelected && styles.statusChipTextActive,
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Optional Notes */}
        <Text style={[styles.label, { marginTop: 16 }]}>Notes (Optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="e.g. Applied via referral, follow up next Monday..."
          placeholderTextColor="#64748b"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.trackButton, loading && styles.buttonDisabled]}
          onPress={handleTrack}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#ffffff" size="small" />
              <Text style={styles.trackButtonText}>  ✨ Gemini AI Extracting...</Text>
            </View>
          ) : (
            <Text style={styles.trackButtonText}>🚀 Track Application</Text>
          )}
        </TouchableOpacity>

        {/* Error Feedback */}
        {errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>❌ {errorMsg}</Text>
          </View>
        )}

        {/* Duplicate Warning */}
        {duplicateWarning && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>⚠️ {duplicateWarning}</Text>
          </View>
        )}
      </View>

      {/* Tracked Job Success Card */}
      {trackedJob && (
        <View style={styles.successCard}>
          <View style={styles.successHeader}>
            <Text style={styles.successBadge}>
              {duplicateWarning ? 'ℹ️ Already in Dashboard' : '✅ Successfully Tracked!'}
            </Text>
            {onNavigateToDashboard && (
              <TouchableOpacity onPress={onNavigateToDashboard}>
                <Text style={styles.viewLink}>View Dashboard →</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.jobRole}>{trackedJob.role || 'Job Application'}</Text>
          <Text style={styles.jobCompany}>🏢 {trackedJob.company || 'Unknown Company'}</Text>

          <View style={styles.jobDetailsRow}>
            {trackedJob.location ? (
              <View style={styles.detailBadge}>
                <Text style={styles.detailBadgeText}>📍 {trackedJob.location}</Text>
              </View>
            ) : null}
            {trackedJob.salary ? (
              <View style={styles.detailBadge}>
                <Text style={styles.detailBadgeText}>💰 {trackedJob.salary}</Text>
              </View>
            ) : null}
            <View style={styles.detailBadge}>
              <Text style={styles.detailBadgeText}>🏷️ {trackedJob.source || 'Other'}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>+ Track Another Application</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  headerDesc: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 6,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f293d',
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  pasteBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  pasteBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#818cf8',
  },
  urlInput: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#f8fafc',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  statusChipText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  statusChipTextActive: {
    color: '#ffffff',
  },
  notesInput: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#f8fafc',
    textAlignVertical: 'top',
    minHeight: 70,
    marginTop: 8,
  },
  trackButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
  },
  warningBox: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: '#eab308',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  warningText: {
    color: '#fef08a',
    fontSize: 13,
  },
  successCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#10b981',
    marginTop: 20,
  },
  successHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  successBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: '#34d399',
  },
  viewLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#818cf8',
  },
  jobRole: {
    fontSize: 19,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  jobCompany: {
    fontSize: 15,
    color: '#94a3b8',
    marginBottom: 12,
  },
  jobDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  detailBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  detailBadgeText: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  resetButton: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  resetButtonText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
});
