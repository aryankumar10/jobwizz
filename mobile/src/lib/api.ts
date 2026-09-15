import { TrackJobPayload, TrackJobResponse } from './types';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://jobwizz.vercel.app').replace(/\/+$/, '');

export async function trackJobFromUrl(
  payload: TrackJobPayload,
  token: string
): Promise<TrackJobResponse> {
  const url = `${API_BASE_URL}/api/jobs/track`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        jobUrl: payload.jobUrl.trim(),
        source: payload.source,
        status: payload.status || 'Applied',
        notes: payload.notes || '',
        appliedOn: payload.appliedOn || new Date().toISOString().split('T')[0],
        pageText: payload.pageText || '',
        pageTitle: payload.pageTitle || '',
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 409 && data.duplicate) {
        return {
          duplicate: true,
          error: data.error || 'This job has already been tracked in your dashboard.',
          existingJob: data.existingJob,
        };
      }
      return {
        success: false,
        error: data.error || `Server responded with status ${res.status}`,
      };
    }

    return {
      success: true,
      job: data.job,
      aiUsed: data.aiUsed ?? true,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network request failed. Please check your connection.',
    };
  }
}
