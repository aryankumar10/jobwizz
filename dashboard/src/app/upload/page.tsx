'use client';

import { useState } from 'react';
import JsonUploader from '@/components/JsonUploader';
import JobTable from '@/components/JobTable';
import { Job } from '@/lib/types';
import Link from 'next/link';

export default function UploadPage() {
  const [jobs, setJobs] = useState<Job[]>([]);

  const handleDownloadCSV = () => {
    if (jobs.length === 0) return;
    
    const headers = ['Role', 'Company', 'Location', 'Status', 'Applied On', 'Source', 'URL'];
    const csvContent = [
      headers.join(','),
      ...jobs.map(job => 
        [
          `"${job.role}"`,
          `"${job.company}"`,
          `"${job.location || ''}"`,
          job.status,
          job.applied_on,
          job.source,
          `"${job.job_url || ''}"`
        ].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'jobwizz_export.csv';
    link.click();
  };

  return (
    <div className="max-w-5xl mx-auto p-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Upload Your Job Data</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Upload JSON data exported from the JobWizz browser extension. 
          This data is stored temporarily in your browser.
        </p>
      </div>

      {!jobs.length ? (
        <JsonUploader onUpload={setJobs} />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Imported Jobs ({jobs.length})</h2>
            <div className="flex gap-3">
              <button 
                onClick={handleDownloadCSV}
                className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Download CSV
              </button>
              <button 
                onClick={() => setJobs([])}
                className="px-4 py-2 text-sm font-medium border border-red-200 text-red-600 rounded-md hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20"
              >
                Clear Data
              </button>
            </div>
          </div>
          
          <JobTable jobs={jobs} editable={false} />
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800 text-center">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Want to save your data permanently?</h3>
            <p className="text-blue-700 dark:text-blue-300 mb-4 max-w-xl mx-auto">
              Create an account to sync your jobs across devices, track interview stages, and access analytics.
            </p>
            <Link 
              href="/signup"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
            >
              Create Free Account
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
