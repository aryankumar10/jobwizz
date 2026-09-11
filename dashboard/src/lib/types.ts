export type JobStatus = 'Applied' | 'Interview' | 'Offer' | 'Rejected' | 'Withdrawn';
export type JobSource = 'LinkedIn' | 'Handshake' | 'Indeed' | 'Other';

export interface Job {
  id: string;
  user_id?: string;
  role: string;
  company: string;
  source: JobSource;
  location: string | null;
  applied_on: string; // ISO date string
  job_url: string | null;
  status: JobStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  resume_url: string | null;
  created_at: string;
  updated_at: string;
}
