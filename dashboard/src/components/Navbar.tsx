'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogout = async () => {
    const { logoutUser } = await import('@/app/actions');
    await logoutUser();
    window.location.href = '/';
  };

  return (
    <nav className="border-b bg-white dark:bg-slate-950 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-xl font-bold text-blue-600">
          JobWizz
        </Link>
        <div className="hidden md:flex items-center gap-4 text-sm font-medium">
          {user && (
            <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
              Dashboard
            </Link>
          )}
          <Link href="/upload" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
            Upload
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-slate-500 hidden sm:inline-block">{user.email}</span>
            <button 
              onClick={handleLogout}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
              Log In
            </Link>
            <Link href="/signup" className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
