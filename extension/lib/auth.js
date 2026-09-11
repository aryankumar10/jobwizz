import { supabaseFetch } from './supabase.js';

export async function signUp(email, password) {
  const data = await supabaseFetch('/auth/v1/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  
  if (data.session) {
    await chrome.storage.session.set({ session: data.session });
  }
  return data;
}

export async function signIn(email, password) {
  const data = await supabaseFetch('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  
  if (data.access_token) {
    // Supabase token response contains user + tokens at the top level
    const session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      expires_at: data.expires_at,
      user: data.user || { id: data.user?.id, email: email }
    };
    await chrome.storage.session.set({ session });
  }
  return data;
}

export async function signOut() {
  try {
    await supabaseFetch('/auth/v1/logout', { method: 'POST' });
  } catch (error) {
    console.error('Logout failed remotely:', error);
  } finally {
    await chrome.storage.session.remove('session');
  }
}

export async function getSession() {
  const { session } = await chrome.storage.session.get('session');
  return session || null;
}

