function extractLinkedInJob() {
  const data = {
    role: '',
    company: '',
    location: '',
    jobUrl: window.location.href,
    source: 'LinkedIn'
  };

  try {
    // Tier 1: JSON-LD Schema
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const json = JSON.parse(script.textContent);
        if (json['@type'] === 'JobPosting') {
          data.role = json.title || data.role;
          data.company = json.hiringOrganization?.name || data.company;
          data.location = json.jobLocation?.address?.addressLocality || data.location;
          break; // Found what we need
        }
      } catch (e) {
        // Continue to next script
      }
    }

    // Tier 2: DOM Selectors
    if (!data.role) {
      const titleEl = document.querySelector('h1[class*="job-title"], h1.t-24');
      if (titleEl) data.role = titleEl.textContent.trim();
    }

    if (!data.company) {
      const companyEl = document.querySelector('a[href*="/company/"]');
      if (companyEl) data.company = companyEl.textContent.trim();
    }

    if (!data.location) {
      const locationEl = document.querySelector('span[class*="bullet"]'); // Simplified heuristic
      if (locationEl) data.location = locationEl.textContent.trim();
    }

    // Tier 3: URL parsing
    const urlMatch = window.location.pathname.match(/\/jobs\/view\/(\d+)/);
    if (urlMatch) {
      data.jobUrl = `https://www.linkedin.com/jobs/view/${urlMatch[1]}/`;
    } else {
      // It might be collections page
      const jobIdParam = new URLSearchParams(window.location.search).get('currentJobId');
      if (jobIdParam) {
        data.jobUrl = `https://www.linkedin.com/jobs/view/${jobIdParam}/`;
      }
    }
  } catch (error) {
    console.error('JobWizz: Extraction error', error);
  }

  return data;
}

function notifyExtraction() {
  const data = extractLinkedInJob();
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
  }, 1000); // 1s debounce to allow page render
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial notification
notifyExtraction();

// Listen for popup requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'EXTRACT_JOB') {
    sendResponse(extractLinkedInJob());
  }
  return true;
});
