'use client';

import { Job, JobStatus, JobSource } from '@/lib/types';
import { useState } from 'react';

interface JobTableProps {
  jobs: Job[];
  onStatusChange?: (id: string, newStatus: Job['status']) => void;
  onDelete?: (id: string) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
  onUpdateJob?: (id: string, updatedData: Partial<Job>) => void;
  onEdit?: (job: Job) => void;
  editable?: boolean;
}

const statusColors: Record<JobStatus, string> = {
  Applied: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800',
  Interview: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
  Offer: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
  Rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800',
  Withdrawn: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700',
};

const sourceColors: Record<string, string> = {
  LinkedIn: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  Handshake: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800',
  Indeed: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  Other: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
};

const statuses: JobStatus[] = ['Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];
const sources: JobSource[] = ['LinkedIn', 'Handshake', 'Indeed', 'Other'];

export default function JobTable({ 
  jobs, 
  onStatusChange, 
  onDelete, 
  onUpdateNotes, 
  onUpdateJob,
  onEdit,
  editable = false 
}: JobTableProps) {
  const [selectedJobForNotes, setSelectedJobForNotes] = useState<Job | null>(null);
  const [editingNotesText, setEditingNotesText] = useState('');

  // Full Edit Modal State
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editRole, setEditRole] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editSource, setEditSource] = useState<JobSource>('Other');
  const [editLocation, setEditLocation] = useState('');
  const [editSalary, setEditSalary] = useState('');
  const [editAppliedOn, setEditAppliedOn] = useState('');
  const [editStatus, setEditStatus] = useState<JobStatus>('Applied');
  const [editJobUrl, setEditJobUrl] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Delete Confirmation Modal State
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

  const handleConfirmDelete = () => {
    if (jobToDelete && onDelete) {
      onDelete(jobToDelete.id);
    }
    setJobToDelete(null);
  };

  const handleOpenEditModal = (job: Job) => {
    setEditingJob(job);
    setEditRole(job.role);
    setEditCompany(job.company);
    setEditSource(job.source || 'Other');
    setEditLocation(job.location || '');
    setEditSalary(job.salary || '');
    setEditAppliedOn(job.applied_on ? job.applied_on.split('T')[0] : '');
    setEditStatus(job.status);
    setEditJobUrl(job.job_url || '');
    setEditNotes(job.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    if (onUpdateJob) {
      onUpdateJob(editingJob.id, {
        role: editRole.trim(),
        company: editCompany.trim(),
        source: editSource,
        location: editLocation.trim() || null,
        salary: editSalary.trim() || null,
        applied_on: editAppliedOn || new Date().toISOString().split('T')[0],
        status: editStatus,
        job_url: editJobUrl.trim() || null,
        notes: editNotes.trim() || null,
      });
    }

    setEditingJob(null);
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center p-12 border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="text-4xl mb-4">📭</div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">No jobs tracked yet</h3>
        <p className="text-slate-500 text-sm mt-1">Use the Chrome extension on LinkedIn / Handshake or add applications to start tracking.</p>
      </div>
    );
  }

  const openNotesModal = (job: Job) => {
    setSelectedJobForNotes(job);
    setEditingNotesText(job.notes || '');
  };

  const handleSaveNotes = () => {
    if (selectedJobForNotes && onUpdateNotes) {
      onUpdateNotes(selectedJobForNotes.id, editingNotesText);
    }
    setSelectedJobForNotes(null);
  };

  return (
    <>
      <div className="overflow-x-auto border rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800/60 dark:text-slate-400 border-b dark:border-slate-800">
            <tr>
              <th className="px-6 py-4">Role & Job Link</th>
              <th className="px-6 py-4">Company</th>
              <th className="px-6 py-4">Source</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Salary</th>
              <th className="px-6 py-4">Date Applied</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Notes</th>
              {editable && <th className="px-6 py-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                  {job.job_url ? (
                    <a 
                      href={job.job_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline font-semibold"
                    >
                      {job.role}
                      <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ) : (
                    <span>{job.role}</span>
                  )}
                </td>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                  {job.company}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-medium border ${sourceColors[job.source] || sourceColors.Other}`}>
                    {job.source || 'Other'}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                  {job.location || '—'}
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                  {job.salary ? (
                    <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                      {job.salary}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                  {job.applied_on ? new Date(job.applied_on).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                </td>
                <td className="px-6 py-4">
                  {editable && onStatusChange ? (
                    <select
                      value={job.status}
                      onChange={(e) => onStatusChange(job.id, e.target.value as JobStatus)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${statusColors[job.status] || statusColors.Applied}`}
                    >
                      {statuses.map(s => (
                        <option key={s} value={s} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[job.status] || statusColors.Applied}`}>
                      {job.status}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => openNotesModal(job)}
                    className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded hover:bg-slate-200 transition-colors"
                  >
                    📝 {job.notes ? 'View Notes' : 'Add Note'}
                  </button>
                </td>
                {editable && (
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        type="button"
                        onClick={() => {
                          if (onEdit) {
                            onEdit(job);
                          } else {
                            handleOpenEditModal(job);
                          }
                        }}
                        title="Edit Application"
                        aria-label="Edit Application"
                        className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setJobToDelete(job)}
                        title="Delete Application"
                        aria-label="Delete Application"
                        className="p-1.5 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notes Modal */}
      {selectedJobForNotes && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-lg w-full shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Notes for {selectedJobForNotes.role}
              </h3>
              <p className="text-xs text-slate-500">{selectedJobForNotes.company}</p>
            </div>

            <textarea
              rows={5}
              value={editingNotesText}
              onChange={(e) => setEditingNotesText(e.target.value)}
              placeholder="Add interview stages, salary expectations, recruiter details..."
              className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedJobForNotes(null)}
                className="px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              {editable && onUpdateNotes ? (
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm"
                >
                  Save Notes
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Edit Job Modal */}
      {editingJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Job Application</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Update details for this tracked application</p>
              </div>
              <button 
                type="button"
                onClick={() => setEditingJob(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg leading-none p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Role *</label>
                  <input 
                    type="text" 
                    required 
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Company *</label>
                  <input 
                    type="text" 
                    required 
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Source</label>
                  <select 
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value as JobSource)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {sources.map(src => (
                      <option key={src} value={src}>{src}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Location</label>
                  <input 
                    type="text" 
                    placeholder="e.g. San Jose, CA / Remote"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Salary</label>
                  <input 
                    type="text" 
                    placeholder="e.g. $45/hr or $130k"
                    value={editSalary}
                    onChange={(e) => setEditSalary(e.target.value)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Date Applied</label>
                  <input 
                    type="date" 
                    required
                    value={editAppliedOn}
                    onChange={(e) => setEditAppliedOn(e.target.value)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Status</label>
                  <select 
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as JobStatus)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {statuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Job URL</label>
                <input 
                  type="url" 
                  placeholder="https://..."
                  value={editJobUrl}
                  onChange={(e) => setEditJobUrl(e.target.value)}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Notes</label>
                <textarea 
                  rows={3} 
                  placeholder="Interview stages, recruiter contact, referral notes..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingJob(null)}
                  className="px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {jobToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Application</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Are you sure you want to delete <span className="font-semibold text-slate-900 dark:text-white">"{jobToDelete.role}"</span> at <span className="font-semibold text-slate-900 dark:text-white">"{jobToDelete.company}"</span>? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t dark:border-slate-800">
              <button
                type="button"
                onClick={() => setJobToDelete(null)}
                className="px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:bg-red-700 shadow-sm transition-colors"
              >
                Delete Application
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

