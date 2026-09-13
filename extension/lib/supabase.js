import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export { SUPABASE_URL, SUPABASE_ANON_KEY };

/**
 * Helper to make API requests to Supabase REST endpoints
 */
export async function supabaseFetch(endpoint, options = {}) {
  const { session } = await chrome.storage.session.get('session');

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    ...(options.headers || {})
  };

  if (session && session.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  } else if (!headers['Authorization']) {
    headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
  }

  const response = await fetch(`${SUPABASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(data.message || data.error_description || data.error || 'Supabase request failed');
  }

  return data;
}

export async function insertJobToCloud(job) {
  const { session } = await chrome.storage.session.get('session');
  if (!session || !session.user) {
    throw new Error('Not logged in');
  }

  // Map form fields to database columns
  const dbJob = {
    user_id: session.user.id,
    role: job.role,
    company: job.company,
    source: job.source || 'Other',
    location: job.location || null,
    salary: job.salary || null,
    applied_on: job.appliedOn || new Date().toISOString().split('T')[0],
    job_url: job.jobUrl || null,
    status: job.status || 'Applied',
    notes: job.notes || null
  };

  return supabaseFetch('/rest/v1/jobs', {
    method: 'POST',
    headers: {
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(dbJob)
  });
}
