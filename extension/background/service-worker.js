import { getLocalJobs } from '../lib/storage.js';
import { getSession } from '../lib/auth.js';

// Setup alarms on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('sync-jobs', { periodInMinutes: 30 });
});

// Alarm listener
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'sync-jobs') {
    await syncJobsToCloud();
  }
});

// Relay messages and store latest data
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'JOB_DATA_EXTRACTED' && sender.tab) {
    chrome.storage.session.set({
      latestExtraction: {
        tabId: sender.tab.id,
        data: message.data
      }
    });
  }
  // Return true if we were to send async response, but here we don't
});

// Clear ephemeral extraction when tab updates to avoid stale data
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    chrome.storage.session.get('latestExtraction').then((result) => {
      if (result.latestExtraction && result.latestExtraction.tabId === tabId) {
        chrome.storage.session.remove('latestExtraction');
      }
    });
  }
});

async function syncJobsToCloud() {
  try {
    const { session } = await chrome.storage.session.get('session');
    if (!session) return; // Not logged in

    // For a real implementation, you'd track which ones are synced.
    // Here we just outline the framework logic.
    console.log('Background sync logic executed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}
