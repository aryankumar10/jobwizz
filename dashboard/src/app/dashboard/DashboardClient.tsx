'use client';

import { Job, JobSource, JobStatus } from '@/lib/types';
import JobTable from '@/components/JobTable';
import StatsBar from '@/components/StatsBar';
import { useState } from 'react';
import { updateJobStatus, deleteJob, updateJob, addJob } from '@/app/actions';

interface DashboardClientProps {
  initialJobs: Job[];
}

export default function DashboardClient({ initialJobs }: DashboardClientProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Job Form State
  const [newRole, setNewRole] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newSource, setNewSource] = useState<JobSource>('LinkedIn');
  const [newLocation, setNewLocation] = useState('');
  const [newSalary, setNewSalary] = useState('');
  const [newAppliedOn, setNewAppliedOn] = useState(new Date().toISOString().split('T')[0]);
  const [newJobUrl, setNewJobUrl] = useState('');
  const [newStatus, setNewStatus] = useState<JobStatus>('Applied');
  const [newNotes, setNewNotes] = useState('');

  const handleStatusChange = async (id: string, newStatusVal: JobStatus) => {
    setJobs(jobs.map(j => j.id === id ? { ...j, status: newStatusVal } : j));
    try {
      await updateJobStatus(id, newStatusVal);
    } catch (error) {
      setJobs(initialJobs);
      console.error('Failed to update status', error);
    }
  };

  const handleUpdateNotes = async (id: string, notes: string) => {
    setJobs(jobs.map(j => j.id === id ? { ...j, notes } : j));
    try {
      await updateJob(id, { notes });
    } catch (error) {
      setJobs(initialJobs);
      console.error('Failed to update notes', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job application?')) return;
    
    setJobs(jobs.filter(j => j.id !== id));
    try {
      await deleteJob(id);
    } catch (error) {
      setJobs(initialJobs);
      console.error('Failed to delete job', error);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole || !newCompany) return;

    setIsSubmitting(true);
    try {
      await addJob({
        role: newRole,
        company: newCompany,
        source: newSource,
        location: newLocation || null,
        salary: newSalary || null,
        applied_on: newAppliedOn,
        job_url: newJobUrl || null,
        status: newStatus,
        notes: newNotes || null,
      });

      // Optimistically add to list
      const createdTemp: Job = {
        id: crypto.randomUUID(),
        role: newRole,
        company: newCompany,
        source: newSource,
        location: newLocation || null,
        salary: newSalary || null,
        applied_on: newAppliedOn,
        job_url: newJobUrl || null,
        status: newStatus,
        notes: newNotes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setJobs([createdTemp, ...jobs]);
      setIsAddModalOpen(false);

      // Reset form
      setNewRole('');
      setNewCompany('');
      setNewLocation('');
      setNewSalary('');
      setNewJobUrl('');
      setNewNotes('');
    } catch (err) {
      console.error('Failed to add job', err);
      alert('Failed to add job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.role.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase()) ||
      (job.location && job.location.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || job.status === statusFilter;
    const matchesSource = sourceFilter === 'ALL' || job.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Application Tracker</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Manage, filter, and track all your job applications.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <span className="text-base">+</span> Add Application
          </button>
        </div>
      </div>

      <StatsBar jobs={jobs} />
      
      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-6">
        <div className="p-4 border-b dark:border-slate-800 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <input 
              type="text" 
              placeholder="Search by role, company, or city..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-72 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Applied">Applied</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
              <option value="Rejected">Rejected</option>
              <option value="Withdrawn">Withdrawn</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Sources</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Handshake">Handshake</option>
              <option value="Indeed">Indeed</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Showing {filteredJobs.length} of {jobs.length} applications
          </div>
        </div>

        <JobTable 
          jobs={filteredJobs} 
          editable={true} 
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onUpdateNotes={handleUpdateNotes}
        />
      </div>

      {/* Manual Add Job Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Job Application</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Role *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Software Engineer"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Company *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Google"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Source</label>
                  <select 
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value as JobSource)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-800 dark:text-white"
                  >
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Handshake">Handshake</option>
                    <option value="Indeed">Indeed</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Location</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Santa Clara, CA / Remote"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Salary</label>
                  <input 
                    type="text" 
                    placeholder="e.g. $40–50/hr or $120k"
                    value={newSalary}
                    onChange={(e) => setNewSalary(e.target.value)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Date Applied</label>
                  <input 
                    type="date" 
                    required
                    value={newAppliedOn}
                    onChange={(e) => setNewAppliedOn(e.target.value)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Initial Status</label>
                  <select 
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as JobStatus)}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Applied">Applied</option>
                    <option value="Interview">Interview</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Withdrawn">Withdrawn</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Job URL</label>
                <input 
                  type="url" 
                  placeholder="https://..."
                  value={newJobUrl}
                  onChange={(e) => setNewJobUrl(e.target.value)}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Notes (optional)</label>
                <textarea 
                  rows={3}
                  placeholder="Referral name, salary range, technical topics..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md text-sm bg-white dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

