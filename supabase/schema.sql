-- ==============================================================================
-- JobWizz - Supabase Database Schema & Row Level Security (RLS)
-- ==============================================================================

-- 1. Create the jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  company TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'Unknown',
  location TEXT,
  salary TEXT,
  applied_on DATE NOT NULL DEFAULT CURRENT_DATE,
  job_url TEXT,
  status TEXT NOT NULL DEFAULT 'Applied',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create index for fast user querying
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);

-- Prevent duplicate job URLs per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_user_url ON public.jobs(user_id, job_url)
  WHERE job_url IS NOT NULL;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- 4. Security Policies (Each user can only access their own jobs)
CREATE POLICY "Users can view own jobs"
  ON public.jobs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs"
  ON public.jobs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs"
  ON public.jobs FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs"
  ON public.jobs FOR DELETE 
  USING (auth.uid() = user_id);

-- 5. Profiles table (For future resume upload & AI cover letter features)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  resume_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);
