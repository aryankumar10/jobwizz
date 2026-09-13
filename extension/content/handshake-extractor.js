/**
 * Handshake Job Extractor for JobWizz
 * Specially tuned for Handshake's modern job details layout & "At a glance" card.
 */

function extractHandshakeJob() {
  const data = {
    role: '',
    company: '',
    location: '',
    salary: '',
    jobUrl: window.location.href,
    source: 'Handshake',
    rawText: ''
  };

  try {
    // 1. Clean Canonical Job URL
    const match = window.location.pathname.match(/\/jobs\/(\d+)/);
    if (match) {
      data.jobUrl = `${window.location.origin}/jobs/${match[1]}`;
    }

    // 2. Role Title (Primary H1)
    const titleEl = document.querySelector('h1[data-hook="job-title"], main h1, h1');
    if (titleEl) {
      data.role = titleEl.textContent.trim();
    }

    // 3. Company Name Extraction
    // Strategy A: Standard Handshake hooks and links
    const companySelectors = [
      '[data-hook="employer-name"]',
      '[data-hook="employer-title"]',
      'a[href*="/employers/"]',
      'a[href*="/stu/employers/"]',
      'a[href*="/employers"] h2',
      'a[href*="/employers"] span',
      '[class*="employerName" i]',
      '[class*="companyName" i]'
    ];

    for (const sel of companySelectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim() && el.textContent.trim() !== data.role) {
        data.company = el.textContent.trim();
        break;
      }
    }

    // Strategy B: Inspect elements immediately preceding the H1 title in the DOM
    if (!data.company && titleEl) {
      const parentCard = titleEl.closest('div, section, main');
      if (parentCard) {
        const logoImg = parentCard.querySelector('img[alt]:not([alt=""]):not([alt*="avatar" i])');
        if (logoImg && logoImg.alt) {
          data.company = logoImg.alt.replace(/logo/i, '').trim();
        }

        if (!data.company) {
          // Look for text before the H1 in the header container
          const headerContainer = titleEl.parentElement;
          if (headerContainer) {
            const candidateNodes = Array.from(headerContainer.querySelectorAll('a, div, p, span, h2, h3'))
              .map(el => el.textContent.trim())
              .filter(t => t && t !== data.role && !/apply|posted|share|save|ago/i.test(t) && t.length < 60);
            if (candidateNodes.length > 0) {
              data.company = candidateNodes[0];
            }
          }
        }
      }
    }

    // Strategy C: Document title fallback (Format: "Title at Company | Handshake")
    if (!data.company) {
      const docTitle = document.title;
      if (docTitle.includes(' at ')) {
        const parts = docTitle.split(' at ');
        if (parts[1]) {
          data.company = parts[1].split('|')[0].split('-')[0].trim();
        }
      }
    }

    // 4. "At a glance" Section (Location & Salary)
    // Find the "At a glance" section container
    const atAGlanceHeader = Array.from(document.querySelectorAll('h2, h3, h4, div, p'))
      .find(el => el.textContent.trim().toLowerCase() === 'at a glance');

    const searchScope = atAGlanceHeader ? atAGlanceHeader.closest('section, div.style__card, div') || document.body : document.body;
    const infoItems = Array.from(searchScope.querySelectorAll('div, p, span, li'))
      .map(el => el.textContent.trim())
      .filter(t => t.length > 0 && t.length < 150);

    for (const text of infoItems) {
      // Ignore date/posting metadata
      if (/posted|apply by|ago|\b(?:am|pm)\b/i.test(text)) {
        continue;
      }

      // Salary: Find strings with $ and /hr, /yr, K, or range
      if (!data.salary && text.includes('$')) {
        const salaryRegex = /\$[\d,]+(?:\.\d+)?\s*[kK]?(?:\s*(?:[–—\-]|to)\s*\$?[\d,]+(?:\.\d+)?\s*[kK]?)?(?:\s*(?:\/|\bper\b|\ba\b|\ban\b)\s*(?:hr|hour|yr|year|mo|month|annually)(?:\s+or\s+more)?|\s*(?:or more|\+))?/i;
        const match = text.match(salaryRegex);
        if (match) {
          data.salary = match[0].trim();
        }
      }

      // Location: Look for "Onsite", "Remote", "Hybrid", or "City, State"
      if (!data.location) {
        if (/^(onsite|remote|hybrid|in-person)/i.test(text)) {
          // e.g. "Onsite, based in Santa Clara, CA, Folsom, CA, +3"
          let loc = text
            .replace(/^Onsite,\s*based in\s*/i, '')
            .replace(/^Remote,\s*based in\s*/i, '')
            .replace(/^Hybrid,\s*based in\s*/i, '')
            .replace(/\+\d+$/, '')
            .trim();
          data.location = loc;
        } else if (text.includes(',') && /\b[A-Z]{2}\b/.test(text) && !text.includes('$') && !/jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(text)) {
          data.location = text;
        }
      }

      if (data.salary && data.location) break;
    }

    // 5. Raw Text Snapshot for AI
    data.rawText = document.body.innerText.slice(0, 15000);

  } catch (error) {
    console.error('JobWizz: Handshake extraction error', error);
  }

  return data;
}

function notifyExtraction() {
  try {
    if (!chrome.runtime?.id) return;
    const data = extractHandshakeJob();
    chrome.runtime.sendMessage({ type: 'JOB_DATA_EXTRACTED', data }).catch(() => {});
  } catch (e) {}
}

// Observe DOM for SPA changes
let debounceTimeout;
const observer = new MutationObserver(() => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    requestAnimationFrame(() => notifyExtraction());
  }, 800);
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
