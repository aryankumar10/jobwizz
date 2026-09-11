'use server';

import { createClient } from '@/lib/supabase/server';
import { Job, JobStatus } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function loginUser(formData: { email: string; password: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true, user: data.user };
}

export async function signupUser(formData: { email: string; password: string; origin: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      emailRedirectTo: `${formData.origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, user: data.user };
}

export async function logoutUser() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
}

export async function updateJobStatus(jobId: string, status: JobStatus) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('jobs')
    .update({ status })
    .eq('id', jobId);
    
  if (error) {
    throw new Error(error.message);
  }
  
  revalidatePath('/dashboard');
}

export async function deleteJob(jobId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', jobId);
    
  if (error) {
    throw new Error(error.message);
  }
  
  revalidatePath('/dashboard');
}

export async function addJob(job: Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('jobs')
    .insert({
      ...job,
      user_id: user.id
    });
    
  if (error) {
    throw new Error(error.message);
  }
  
  revalidatePath('/dashboard');
}

export async function updateJob(jobId: string, data: Partial<Job>) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('jobs')
    .update(data)
    .eq('id', jobId);
    
  if (error) {
    throw new Error(error.message);
  }
  
  revalidatePath('/dashboard');
}

