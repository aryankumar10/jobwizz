'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onSubmit: (email: string, password: string) => Promise<void>;
}

export default function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const validateEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address (e.g., name@example.com).');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      await onSubmit(email, password);
      if (mode === 'signup') {
        setSuccess('Account created! Please check your email inbox to confirm your account.');
      }
    } catch (err: any) {
      console.error('Auth submit error:', err);
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-xl shadow-md border border-slate-200 dark:border-slate-800">
      <h2 className="text-2xl font-bold text-center mb-6">
        {mode === 'login' ? 'Log in to JobWizz' : 'Create an Account'}
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-md text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-md text-sm">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Email Address</label>
          <input 
            type="email" 
            required 
            placeholder="you@example.com"
            value={email}
            onChange={e => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Password</label>
          <input 
            type="password" 
            required 
            placeholder="••••••••"
            value={password}
            onChange={e => {
              setPassword(e.target.value);
              if (error) setError('');
            }}
            className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {mode === 'signup' && (
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Confirm Password</label>
            <input 
              type="password" 
              required 
              placeholder="••••••••"
              value={confirmPassword}
              onChange={e => {
                setConfirmPassword(e.target.value);
                if (error) setError('');
              }}
              className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2.5 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm shadow-sm"
        >
          {loading ? 'Processing...' : mode === 'login' ? 'Log In' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
}

