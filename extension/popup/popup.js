import { saveJobLocally, exportJobsAsJSON } from '../lib/storage.js';
import { signUp, signIn, signOut, getSession } from '../lib/auth.js';
import { API_BASE_URL } from '../lib/config.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const btnTrack = document.getElementById('btnTrack');
  const trackBtnText = document.getElementById('trackBtnText');
  const detectedSourceBadge = document.getElementById('detectedSourceBadge');
  const urlPreview = document.getElementById('urlPreview');
  const appliedOnInput = document.getElementById('appliedOn');
  const quickStatusInput = document.getElementById('quickStatus');
  const quickNotesInput = document.getElementById('quickNotes');
  const aiIndicator = document.getElementById('aiIndicator');
  const toast = document.getElementById('toast');

  // Manual Form Elements
  const manualRole = document.getElementById('manualRole');
  const manualCompany = document.getElementById('manualCompany');
  const manualLocation = document.getElementById('manualLocation');
  const manualSalary = document.getElementById('manualSalary');
  const manualSource = document.getElementById('manualSource');
  const manualJobUrl = document.getElementById('manualJobUrl');

  // Offline Buttons
  const btnSaveLocal = document.getElementById('btnSaveLocal');
  const btnExport = document.getElementById('btnExport');

  // Auth Elements
  const loggedOutView = document.getElementById('loggedOutView');
  const loggedInView = document.getElementById('loggedInView');
  const userEmailSpan = document.getElementById('userEmail');
  const btnLogin = document.getElementById('btnLogin');
  const btnSignup = document.getElementById('btnSignup');
  const btnLogout = document.getElementById('btnLogout');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  // Set default date to today
  appliedOnInput.value = new Date().toISOString().split('T')[0];

  let activeTabUrl = '';
  let activeTabRawText = '';
  let activeTabPageTitle = '';
  let activeSource = 'Other';

  function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast-${type}`;
    setTimeout(() => { toast.className = 'hidden'; }, 4000);
  }

  // Check Auth
  async function updateAuthState() {
    try {
      const session = await getSession();
      if (session && session.user) {
        loggedOutView.classList.add('hidden');
        loggedInView.classList.remove('hidden');
        userEmailSpan.textContent = session.user.email;
        return session;
      } else {
        loggedOutView.classList.remove('hidden');
        loggedInView.classList.add('hidden');
        return null;
      }
    } catch (e) {
      console.warn('Auth check warning:', e);
      return null;
    }
  }

  await updateAuthState();

  // Detect current active tab
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      activeTabUrl = tab.url;
      activeTabPageTitle = tab.title || '';
      urlPreview.textContent = activeTabUrl.replace(/^https?:\/\//, '');
      urlPreview.title = activeTabUrl;
      manualJobUrl.value = activeTabUrl;

      // Platform detection
      if (activeTabUrl.includes('linkedin.com')) {
        activeSource = 'LinkedIn';
      } else if (activeTabUrl.includes('joinhandshake.com')) {
        activeSource = 'Handshake';
      } else if (activeTabUrl.includes('indeed.com')) {
        activeSource = 'Indeed';
      } else {
        activeSource = 'Job Site';
      }

      detectedSourceBadge.textContent = activeSource;
      manualSource.value = activeSource;

      // Request text & preliminary DOM snapshot from content script
      try {
        const domData = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_JOB' });
        if (domData) {
          if (domData.rawText) activeTabRawText = domData.rawText;
          if (domData.role) manualRole.value = domData.role;
          if (domData.company) manualCompany.value = domData.company;
          if (domData.location) manualLocation.value = domData.location;
          if (domData.salary) manualSalary.value = domData.salary;
        }
      } catch (csErr) {
        console.log('JobWizz: Content script not reachable, trying executeScript fallback...');
      }

      // FALLBACK: If content script didn't provide text, inject a script to grab it directly
      if (!activeTabRawText && tab.id) {
        try {
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              return {
                rawText: document.body.innerText.slice(0, 15000),
                title: document.title,
              };
            },
          });
          if (results && results[0] && results[0].result) {
            activeTabRawText = results[0].result.rawText || '';
            if (!activeTabPageTitle && results[0].result.title) {
              activeTabPageTitle = results[0].result.title;
            }
            console.log('JobWizz: executeScript fallback got', activeTabRawText.length, 'chars');
          }
        } catch (scriptErr) {
          console.warn('JobWizz: executeScript fallback also failed:', scriptErr);
        }
      }

      console.log('JobWizz Debug: pageText length =', activeTabRawText.length, '| pageTitle =', activeTabPageTitle);
    }
  } catch (err) {
    console.warn('Tab query error:', err);
  }



  function getManualData() {
    return {
      role: manualRole.value.trim(),
      company: manualCompany.value.trim(),
      location: manualLocation.value.trim(),
      salary: manualSalary.value.trim(),
      source: manualSource.value,
      jobUrl: manualJobUrl.value.trim() || activeTabUrl,
    };
  }

  // 1-Click Track Action (Server-Side Gemini AI Pipeline)
  btnTrack.addEventListener('click', async () => {
    const session = await updateAuthState();
    if (!session || !session.access_token) {
      showToast('Please log in below to sync applications to your dashboard', 'error');
      return;
    }

    try {
      btnTrack.disabled = true;
      trackBtnText.textContent = '✨ Analyzing with AI...';
      aiIndicator.textContent = '✨ Parsing...';
      aiIndicator.className = 'ai-badge parsing';

      const payload = {
        jobUrl: activeTabUrl,
        pageText: activeTabRawText,
        pageTitle: activeTabPageTitle,
        appliedOn: appliedOnInput.value,
        status: quickStatusInput.value,
        notes: quickNotesInput.value,
        manualData: getManualData(),
      };

      console.log('JobWizz: Sending to server:', {
        url: payload.jobUrl,
        pageTextLength: payload.pageText?.length || 0,
        pageTitle: payload.pageTitle,
        pageTextPreview: (payload.pageText || '').slice(0, 200),
      });

      const res = await fetch(`${API_BASE_URL}/api/jobs/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        trackBtnText.textContent = '✅ Added to Dashboard!';
        aiIndicator.textContent = '✨ AI Tracked';
        aiIndicator.className = 'ai-badge success';
        showToast(`🎉 Tracked: ${json.job.role || 'Job'} at ${json.job.company || 'Company'}`);

        // Update manual form with parsed values for inspection
        if (json.job) {
          manualRole.value = json.job.role || '';
          manualCompany.value = json.job.company || '';
          manualLocation.value = json.job.location || '';
          manualSalary.value = json.job.salary || '';
        }

        setTimeout(() => {
          trackBtnText.textContent = '🚀 Add to My Jobs';
          btnTrack.disabled = false;
        }, 3000);
      } else if (res.status === 409 && json.duplicate) {
        // Duplicate URL — already tracked
        trackBtnText.textContent = '⚠️ Already Tracked';
        aiIndicator.textContent = '✨ AI Ready';
        aiIndicator.className = 'ai-badge';
        showToast(json.error || 'This job is already in your dashboard', 'error');
        setTimeout(() => {
          trackBtnText.textContent = '🚀 Add to My Jobs';
          btnTrack.disabled = false;
        }, 3000);
      } else {
        throw new Error(json.error || 'Failed to track application');
      }
    } catch (err) {
      console.error('Track error:', err);
      showToast(err.message || 'Error tracking application', 'error');
      trackBtnText.textContent = '🚀 Add to My Jobs';
      aiIndicator.textContent = '✨ AI Ready';
      aiIndicator.className = 'ai-badge';
      btnTrack.disabled = false;
    }
  });

  // Offline Save
  btnSaveLocal.addEventListener('click', async () => {
    try {
      btnSaveLocal.disabled = true;
      const manual = getManualData();
      const localJob = {
        role: manual.role || 'Job Application',
        company: manual.company || 'Company',
        location: manual.location || '',
        salary: manual.salary || '',
        source: manual.source || (activeSource === 'Web Page' ? 'Other' : activeSource),
        appliedOn: appliedOnInput.value,
        jobUrl: manual.jobUrl || activeTabUrl,
        status: quickStatusInput.value,
        notes: quickNotesInput.value,
      };

      await saveJobLocally(localJob);
      showToast('Saved offline to browser storage!');
    } catch (e) {
      showToast('Error saving offline', 'error');
    } finally {
      btnSaveLocal.disabled = false;
    }
  });

  // Export JSON
  btnExport.addEventListener('click', async () => {
    await exportJobsAsJSON();
  });

  // Auth Actions
  btnLogin.addEventListener('click', async () => {
    try {
      btnLogin.disabled = true;
      await signIn(emailInput.value, passwordInput.value);
      await updateAuthState();
      showToast('Logged in successfully!');
    } catch (e) {
      showToast(e.message || 'Login failed', 'error');
    } finally {
      btnLogin.disabled = false;
    }
  });

  btnSignup.addEventListener('click', async () => {
    try {
      btnSignup.disabled = true;
      await signUp(emailInput.value, passwordInput.value);
      showToast('Confirmation email sent! Check your inbox.');
    } catch (e) {
      showToast(e.message || 'Signup failed', 'error');
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
