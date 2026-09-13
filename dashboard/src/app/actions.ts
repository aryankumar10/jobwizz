'use server';

import { createClient } from '@/lib/supabase/server';
import { Job, JobStatus } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { createLogger } from '@/lib/logger';

const log = createLogger('ServerActions');

export async function loginUser(formData: { email: string; password: string }) {
  const supabase = await createClient();
  log.info('User attempting login', { email: formData.email });

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    log.warn('User login failed', { email: formData.email, error: error.message });
    return { error: error.message };
  }

  log.info('User logged in successfully', { userId: data.user?.id });
  revalidatePath('/', 'layout');
  return { success: true, user: data.user };
}

export async function signupUser(formData: { email: string; password: string; origin: string }) {
  const supabase = await createClient();
  log.info('User attempting signup', { email: formData.email });

  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      emailRedirectTo: `${formData.origin}/auth/callback`,
    },
  });

  if (error) {
    log.warn('User signup failed', { email: formData.email, error: error.message });
    return { error: error.message };
  }

  log.info('User signed up successfully', { userId: data.user?.id });
  return { success: true, user: data.user };
}

export async function logoutUser() {
  const supabase = await createClient();
  log.info('User logging out');
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
}

export async function updateJobStatus(jobId: string, status: JobStatus) {
  const supabase = await createClient();
  log.info('Updating job status', { jobId, status });
  
  const { error } = await supabase
    .from('jobs')
    .update({ status })
    .eq('id', jobId);
    
  if (error) {
    log.error('Failed to update job status', { jobId, error: error.message });
    throw new Error(error.message);
  }
  
  revalidatePath('/dashboard');
}

export async function deleteJob(jobId: string) {
  const supabase = await createClient();
  log.info('Deleting job', { jobId });
  
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', jobId);
    
  if (error) {
    log.error('Failed to delete job', { jobId, error: error.message });
    throw new Error(error.message);
  }
  
  revalidatePath('/dashboard');
}

export async function addJob(job: Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    log.warn('addJob rejected: user unauthenticated');
    throw new Error('Not authenticated');
  }

  log.info('Adding new job application', { role: job.role, company: job.company, userId: user.id });

  const { error } = await supabase
    .from('jobs')
    .insert({
      ...job,
      user_id: user.id
    });
    
  if (error) {
    log.error('Failed to add job', { error: error.message });
    throw new Error(error.message);
  }
  
  revalidatePath('/dashboard');
}

export async function updateJob(jobId: string, data: Partial<Job>) {
  const supabase = await createClient();
  log.info('Updating job application details', { jobId, fields: Object.keys(data) });
  
  const { error } = await supabase
    .from('jobs')
    .update(data)
    .eq('id', jobId);
    
  if (error) {
    log.error('Failed to update job application', { jobId, error: error.message });
    throw new Error(error.message);
  }
  
  revalidatePath('/dashboard');
}


