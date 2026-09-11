import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="max-w-4xl mx-auto p-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-8 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-500">Email Address</label>
            <p className="font-medium">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm opacity-60">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            📄 Resume Upload <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-auto">Coming Soon</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
            Store your base resume to auto-fill applications and generate cover letters.
          </p>
          <button disabled className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md font-medium cursor-not-allowed">
            Upload PDF
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm opacity-60">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            ✨ Cover Letter Generator <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full ml-auto">Coming Soon</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
            AI-powered cover letters tailored to each job description based on your resume.
          </p>
          <button disabled className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md font-medium cursor-not-allowed">
            Try Beta
          </button>
        </div>
      </div>
    </div>
  );
}
