import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Job, JobStatus } from '../lib/types';

interface DashboardScreenProps {
  onNavigateToTrack?: () => void;
}

const ALL_STATUSES: (JobStatus | 'ALL')[] = ['ALL', 'Applied', 'Interview', 'Offer', 'Rejected'];

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigateToTrack }) => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'ALL'>('ALL');

  // Status Change Modal State
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  // Notes Edit Modal State
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [editingNotes, setEditingNotes] = useState('');

  // Fetch jobs from Supabase
  const fetchJobs = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching jobs:', error);
      } else if (data) {
        setJobs(data as Job[]);
      }
    } catch (err) {
      console.error('Unexpected fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  // Update status
  const handleUpdateStatus = async (newStatus: JobStatus) => {
    if (!selectedJob) return;
    const jobId = selectedJob.id;
    setStatusModalVisible(false);

    // Optimistic update
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
    );

    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', jobId);

      if (error) {
        console.error('Status update failed:', error);
        fetchJobs(); // Rollback
      }
    } catch (e) {
      console.error('Status update error:', e);
      fetchJobs();
    }
  };

  // Update notes
  const handleSaveNotes = async () => {
    if (!selectedJob) return;
    const jobId = selectedJob.id;
    const newNotes = editingNotes.trim();
    setNotesModalVisible(false);

    // Optimistic update
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, notes: newNotes } : j))
    );

    try {
      const { error } = await supabase
        .from('jobs')
        .update({ notes: newNotes, updated_at: new Date().toISOString() })
        .eq('id', jobId);

      if (error) {
        console.error('Notes update failed:', error);
        fetchJobs();
      }
    } catch (e) {
      console.error('Notes update error:', e);
      fetchJobs();
    }
  };

  // Delete Job
  const handleDeleteJob = (job: Job) => {
    Alert.alert(
      'Delete Application',
      `Are you sure you want to delete ${job.role} at ${job.company}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setJobs((prev) => prev.filter((j) => j.id !== job.id));
            try {
              const { error } = await supabase.from('jobs').delete().eq('id', job.id);
              if (error) {
                console.error('Delete failed:', error);
                fetchJobs();
              }
            } catch (e) {
              console.error('Delete error:', e);
              fetchJobs();
            }
          },
        },
      ]
    );
  };

  // Open external job link
  const handleOpenLink = async (url: string | null) => {
    if (!url) return;
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      console.warn('Could not open browser:', e);
    }
  };

  // Filtered jobs
  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.role.toLowerCase().includes(search.toLowerCase()) ||
      j.company.toLowerCase().includes(search.toLowerCase()) ||
      (j.location && j.location.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      j.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Calculate Metrics
  const stats = {
    total: jobs.length,
    applied: jobs.filter((j) => j.status === 'Applied').length,
    interview: jobs.filter((j) => j.status === 'Interview').length,
    offer: jobs.filter((j) => j.status === 'Offer').length,
    rejected: jobs.filter((j) => j.status === 'Rejected').length,
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'Offer':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: '#10b981' };
      case 'Interview':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: '#3b82f6' };
      case 'Rejected':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: '#ef4444' };
      default:
        return { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8', border: '#6366f1' };
    }
  };

  const renderJobItem = ({ item }: { item: Job }) => {
    const statusColors = getStatusColor(item.status);

    return (
      <View style={styles.jobCard}>
        {/* Card Header: Role & Status Chip */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.roleText} numberOfLines={1}>
              {item.role}
            </Text>
            <Text style={styles.companyText} numberOfLines={1}>
              🏢 {item.company}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.statusBadge,
              { backgroundColor: statusColors.bg, borderColor: statusColors.border },
            ]}
            onPress={() => {
              setSelectedJob(item);
              setStatusModalVisible(true);
            }}
          >
            <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
              {item.status} ▾
            </Text>
          </TouchableOpacity>
        </View>

        {/* Badges: Location, Salary, Source */}
        <View style={styles.badgeRow}>
          {item.location ? (
            <View style={styles.pill}>
              <Text style={styles.pillText}>📍 {item.location}</Text>
            </View>
          ) : null}
          {item.salary ? (
            <View style={styles.pill}>
              <Text style={styles.pillText}>💰 {item.salary}</Text>
            </View>
          ) : null}
          <View style={styles.pill}>
            <Text style={styles.pillText}>🏷️ {item.source}</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>📅 {item.applied_on}</Text>
          </View>
        </View>

        {/* Notes preview if any */}
        {item.notes ? (
          <TouchableOpacity
            style={styles.notesPreview}
            onPress={() => {
              setSelectedJob(item);
              setEditingNotes(item.notes || '');
              setNotesModalVisible(true);
            }}
          >
            <Text style={styles.notesPreviewText} numberOfLines={2}>
              📝 {item.notes}
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Action Buttons: Open URL, Add/Edit Notes, Delete */}
        <View style={styles.cardFooter}>
          {item.job_url ? (
            <TouchableOpacity
              style={styles.footerButton}
              onPress={() => handleOpenLink(item.job_url)}
            >
              <Text style={styles.footerButtonText}>🌐 View Posting</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.footerButton}
            onPress={() => {
              setSelectedJob(item);
              setEditingNotes(item.notes || '');
              setNotesModalVisible(true);
            }}
          >
            <Text style={styles.footerButtonText}>
              {item.notes ? '✏️ Edit Notes' : '+ Add Note'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.footerButton, styles.deleteButton]}
            onPress={() => handleDeleteJob(item)}
          >
            <Text style={styles.deleteButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search role, company, location..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricBox}>
          <Text style={styles.metricVal}>{stats.total}</Text>
          <Text style={styles.metricLbl}>Total</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={[styles.metricVal, { color: '#818cf8' }]}>{stats.applied}</Text>
          <Text style={styles.metricLbl}>Applied</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={[styles.metricVal, { color: '#60a5fa' }]}>{stats.interview}</Text>
          <Text style={styles.metricLbl}>Interview</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={[styles.metricVal, { color: '#34d399' }]}>{stats.offer}</Text>
          <Text style={styles.metricLbl}>Offer</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={[styles.metricVal, { color: '#f87171' }]}>{stats.rejected}</Text>
          <Text style={styles.metricLbl}>Rejected</Text>
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {ALL_STATUSES.map((status) => {
          const isSelected = statusFilter === status;
          return (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
              onPress={() => setStatusFilter(status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextActive,
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Job List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading applications...</Text>
        </View>
      ) : filteredJobs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>No Applications Found</Text>
          <Text style={styles.emptySubtitle}>
            {search || statusFilter !== 'ALL'
              ? 'Try changing your search filters'
              : 'Start tracking jobs by pasting a link!'}
          </Text>
          {onNavigateToTrack && (
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={onNavigateToTrack}
            >
              <Text style={styles.emptyButtonText}>+ Track New Application</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => item.id}
          renderItem={renderJobItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6366f1"
            />
          }
        />
      )}

      {/* Status Picker Modal */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setStatusModalVisible(false)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Update Application Status</Text>
            {(['Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn'] as JobStatus[]).map(
              (status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusModalOption,
                    selectedJob?.status === status && styles.statusModalOptionSelected,
                  ]}
                  onPress={() => handleUpdateStatus(status)}
                >
                  <Text
                    style={[
                      styles.statusModalOptionText,
                      selectedJob?.status === status && { color: '#818cf8', fontWeight: '700' },
                    ]}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Notes Modal */}
      <Modal
        visible={notesModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNotesModalVisible(false)}
      >
        <KeyboardAvoidingComponent>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setNotesModalVisible(false)}
          >
            <View style={styles.notesModalCard} onStartShouldSetResponder={() => true}>
              <Text style={styles.modalTitle}>Edit Notes</Text>
              <Text style={styles.modalSubtitle}>
                {selectedJob?.role} at {selectedJob?.company}
              </Text>
              <TextInput
                style={styles.notesModalInput}
                placeholder="Add salary details, interview dates, referral name..."
                placeholderTextColor="#64748b"
                value={editingNotes}
                onChangeText={setEditingNotes}
                multiline
                numberOfLines={4}
              />
              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setNotesModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={handleSaveNotes}
                >
                  <Text style={styles.modalSaveText}>Save Notes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingComponent>
      </Modal>
    </View>
  );
};

// Simple helper for modal keyboard avoiding
const KeyboardAvoidingComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <View style={{ flex: 1 }}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f293d',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#f8fafc',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#111827',
    marginHorizontal: 3,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f293d',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  metricLbl: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f293d',
  },
  filterChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  jobCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f293d',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  roleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  companyText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  pill: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pillText: {
    color: '#cbd5e1',
    fontSize: 11,
  },
  notesPreview: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
    marginTop: 6,
  },
  notesPreviewText: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    gap: 8,
  },
  footerButton: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  footerButtonText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  deleteButtonText: {
    fontSize: 13,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f293d',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 14,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 12,
  },
  statusModalOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  statusModalOptionSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  statusModalOptionText: {
    color: '#cbd5e1',
    fontSize: 15,
    fontWeight: '500',
  },
  notesModalCard: {
    width: '100%',
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f293d',
  },
  notesModalInput: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#f8fafc',
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 90,
    marginVertical: 12,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalCancelText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  modalSaveButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalSaveText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
