import { saveJobLocally, exportJobsAsJSON } from '../lib/storage.js';
import { signUp, signIn, signOut, getSession } from '../lib/auth.js';
import { insertJobToCloud } from '../lib/supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const jobForm = document.getElementById('jobForm');
  const btnSaveLocal = document.getElementById('btnSaveLocal');
  const btnSaveCloud = document.getElementById('btnSaveCloud');
  const btnExport = document.getElementById('btnExport');
  const toast = document.getElementById('toast');

  const authSection = document.getElementById('authSection');
  const loggedOutView = document.getElementById('loggedOutView');
  const loggedInView = document.getElementById('loggedInView');
  const userEmailSpan = document.getElementById('userEmail');
  const btnLogin = document.getElementById('btnLogin');
  const btnSignup = document.getElementById('btnSignup');
  const btnLogout = document.getElementById('btnLogout');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  // Initialize date to today
  document.getElementById('appliedOn').value = new Date().toISOString().split('T')[0];

  function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast-${type}`;
    setTimeout(() => { toast.className = 'hidden'; }, 3000);
  }

  // Auth State
  async function updateAuthState() {
    const session = await getSession();
    if (session && session.user) {
      loggedOutView.classList.add('hidden');
      loggedInView.classList.remove('hidden');
      userEmailSpan.textContent = session.user.email;
      btnSaveCloud.classList.remove('hidden');
    } else {
      loggedOutView.classList.remove('hidden');
      loggedInView.classList.add('hidden');
      btnSaveCloud.classList.add('hidden');
    }
  }

  await updateAuthState();

  // Get data from content script
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    try {
      const data = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_JOB' });
      if (data) populateForm(data);
    } catch (e) {
      // Content script not loaded or not matching
      console.log('Manual entry mode');
    }
  }

  function populateForm(data) {
    if (data.role) document.getElementById('role').value = data.role;
    if (data.company) document.getElementById('company').value = data.company;
    if (data.location) document.getElementById('location').value = data.location;
    if (data.jobUrl) document.getElementById('jobUrl').value = data.jobUrl;
    if (data.source) document.getElementById('source').value = data.source;
  }

  function getFormData() {
    return {
      role: document.getElementById('role').value,
      company: document.getElementById('company').value,
      source: document.getElementById('source').value,
      location: document.getElementById('location').value,
      appliedOn: document.getElementById('appliedOn').value,
      jobUrl: document.getElementById('jobUrl').value,
      status: document.getElementById('status').value,
      notes: document.getElementById('notes').value
    };
  }

  // Job Actions
  btnSaveLocal.addEventListener('click', async () => {
    try {
      if (!jobForm.checkValidity()) {
        jobForm.reportValidity();
        return;
      }
      btnSaveLocal.disabled = true;
      await saveJobLocally(getFormData());
      showToast('Saved locally!');
    } catch (e) {
      showToast('Error saving locally', 'error');
    } finally {
      btnSaveLocal.disabled = false;
    }
  });

  btnSaveCloud.addEventListener('click', async () => {
    try {
      if (!jobForm.checkValidity()) {
        jobForm.reportValidity();
        return;
      }
      btnSaveCloud.disabled = true;
      await insertJobToCloud(getFormData());
      showToast('Saved to cloud!');
    } catch (e) {
      showToast(e.message || 'Error saving to cloud', 'error');
    } finally {
      btnSaveCloud.disabled = false;
    }
  });

  btnExport.addEventListener('click', async () => {
    await exportJobsAsJSON();
  });

  // Auth Actions
  btnLogin.addEventListener('click', async () => {
    try {
      btnLogin.disabled = true;
      await signIn(emailInput.value, passwordInput.value);
      await updateAuthState();
      showToast('Logged in successfully');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      btnLogin.disabled = false;
    }
  });

  btnSignup.addEventListener('click', async () => {
    try {
      btnSignup.disabled = true;
      await signUp(emailInput.value, passwordInput.value);
      showToast('Check email to confirm signup');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      btnSignup.disabled = false;
    }
  });

  btnLogout.addEventListener('click', async () => {
    try {
      btnLogout.disabled = true;
      await signOut();
      await updateAuthState();
      showToast('Logged out');
    } catch (e) {
      showToast('Error logging out', 'error');
    } finally {
      btnLogout.disabled = false;
    }
  });
});
