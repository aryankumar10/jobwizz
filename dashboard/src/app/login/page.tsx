'use client';

import AuthForm from '@/components/AuthForm';
import { loginUser } from '@/app/actions';
import Link from 'next/link';
import { Suspense } from 'react';

function LoginContent() {
  const handleLogin = async (email: string, password: string) => {
    const res = await loginUser({ email, password });
    if (res?.error) {
      throw new Error(res.error);
    }
    
    // Hard redirect to dashboard
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <AuthForm mode="login" onSubmit={handleLogin} />
      <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
        Don't have an account? <Link href="/signup" className="text-blue-600 hover:underline font-medium">Sign up</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}


