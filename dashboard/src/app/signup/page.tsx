'use client';

import AuthForm from '@/components/AuthForm';
import { signupUser } from '@/app/actions';
import Link from 'next/link';
import { Suspense } from 'react';

function SignupContent() {
  const handleSignup = async (email: string, password: string) => {
    const res = await signupUser({
      email,
      password,
      origin: window.location.origin,
    });
    
    if (res?.error) {
      throw new Error(res.error);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <AuthForm mode="signup" onSubmit={handleSignup} />
      <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
        Already have an account? <Link href="/login" className="text-blue-600 hover:underline font-medium">Log in</Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignupContent />
    </Suspense>
  );
}


