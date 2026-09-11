function extractHandshakeJob() {
  const data = {
    role: '',
    company: '',
    location: '',
    jobUrl: window.location.href,
    source: 'Handshake'
  };

  try {
    // Primary: DOM Selectors
    const titleEl = document.querySelector('h1');
    if (titleEl) data.role = titleEl.textContent.trim();

    const companyEl = document.querySelector('a[href*="/employers/"]');
    if (companyEl) data.company = companyEl.textContent.trim();

    const locationEl = document.querySelector('[data-hook="job-location"]');
    if (locationEl) {
      data.location = locationEl.textContent.trim();
    }

    // Fallback: Title parsing
    if (!data.role || !data.company) {
      const titleParts = document.title.split(' at ');
      if (titleParts.length >= 2) {
        if (!data.role) data.role = titleParts[0].trim();
        const companyPart = titleParts[1].split(' | ')[0];
        if (!data.company) data.company = companyPart.trim();
      }
    }

    // URL canonicalization
    const match = window.location.pathname.match(/\/stu\/jobs\/(\d+)/);
    if (match) {
      data.jobUrl = `https://app.joinhandshake.com/stu/jobs/${match[1]}`;
    }
  } catch (error) {
    console.error('JobWizz: Extraction error', error);
  }

  return data;
}

function notifyExtraction() {
  const data = extractHandshakeJob();
  chrome.runtime.sendMessage({ type: 'JOB_DATA_EXTRACTED', data }).catch(() => {
    // Ignore errors when background script is inactive
  });
}

// Observe DOM for SPA changes
let debounceTimeout;
const observer = new MutationObserver(() => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    requestAnimationFrame(() => notifyExtraction());
  }, 1000);
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial notification
notifyExtraction();

// Listen for popup requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'EXTRACT_JOB') {
    sendResponse(extractHandshakeJob());
  }
  return true;
});
