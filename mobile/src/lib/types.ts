export type JobStatus = 'Applied' | 'Interview' | 'Offer' | 'Rejected' | 'Withdrawn';
export type JobSource = 'LinkedIn' | 'Handshake' | 'Indeed' | 'Job Site' | 'Other';

export interface Job {
  id: string;
  user_id?: string;
  role: string;
  company: string;
  source: JobSource;
  location: string | null;
  salary?: string | null;
  applied_on: string; // YYYY-MM-DD
  job_url: string | null;
  status: JobStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrackJobPayload {
  jobUrl: string;
  source?: JobSource;
  status?: JobStatus;
  notes?: string;
  appliedOn?: string;
  pageText?: string;
  pageTitle?: string;
}

export interface TrackJobResponse {
  success?: boolean;
  job?: Job;
  duplicate?: boolean;
  existingJob?: Job;
  error?: string;
  aiUsed?: boolean;
}
