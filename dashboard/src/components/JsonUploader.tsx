'use client';

import { useState, useRef } from 'react';
import { Job } from '@/lib/types';

interface JsonUploaderProps {
  onUpload: (jobs: Job[]) => void;
}

export default function JsonUploader({ onUpload }: JsonUploaderProps) {
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError('');
    if (!file.name.endsWith('.json')) {
      setError('Please upload a valid .json file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        if (!Array.isArray(parsed)) {
          throw new Error('JSON must contain an array of jobs');
        }
        
        const mappedJobs = parsed.map((item: any, idx: number) => ({
          id: item.id || `temp-${idx}`,
          role: item.role || item.title || 'Unknown Role',
          company: item.company || 'Unknown Company',
          source: item.source || 'Other',
          location: item.location || null,
          applied_on: item.applied_on || item.appliedOn || item.date || new Date().toISOString().split('T')[0],
          job_url: item.job_url || item.jobUrl || item.url || null,
          status: item.status || 'Applied',
          notes: item.notes || null,
          created_at: item.created_at || item.createdAt || new Date().toISOString(),
          updated_at: item.updated_at || item.updatedAt || new Date().toISOString(),
        })) as Job[];
        
        onUpload(mappedJobs);
      } catch (err: any) {
        setError(err.message || 'Error parsing JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full">
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 hover:border-blue-400 dark:border-slate-700'
        }`}
      >
        <div className="text-4xl mb-4">📁</div>
        <h3 className="text-lg font-medium mb-1">Click or drag JSON file here</h3>
        <p className="text-sm text-slate-500">Upload the backup exported from the JobWizz extension</p>
        <input 
          type="file" 
          accept=".json" 
          className="hidden" 
          ref={fileInputRef}
          onChange={(e) => e.target.files && processFile(e.target.files[0])}
        />
      </div>
    </div>
  );
}
