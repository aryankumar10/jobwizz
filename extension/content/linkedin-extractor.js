/**
 * LinkedIn Job Extractor for JobWizz
 * Uses resilient multi-tier extraction:
 * 1. Title format parser: "Company hiring Role in Location | LinkedIn"
 * 2. Modern LinkedIn DOM selectors (.job-details-jobs-unified-top-card, h1, bullets)
 * 3. JSON-LD Structured Data
 * 4. Raw text snapshot for Gemini AI
 */

function extractLinkedInJob() {
  const data = {
    role: '',
    company: '',
    location: '',
    salary: '',
    jobUrl: window.location.href,
    source: 'LinkedIn',
    rawText: ''
  };

  try {
    // 1. Clean Canonical Job URL
    const urlMatch = window.location.pathname.match(/\/jobs\/view\/(\d+)/);
    if (urlMatch) {
      data.jobUrl = `https://www.linkedin.com/jobs/view/${urlMatch[1]}/`;
    } else {
      const jobIdParam = new URLSearchParams(window.location.search).get('currentJobId');
      if (jobIdParam) {
        data.jobUrl = `https://www.linkedin.com/jobs/view/${jobIdParam}/`;
      }
    }

    // 2. High-Reliability Document Title Parser
    // Common formats:
    // "Beacon AI hiring Software Engineer, Backend in San Carlos, CA | LinkedIn"
    // "Software Engineer, Backend at Beacon AI | LinkedIn"
    const docTitle = document.title || '';
    if (docTitle.includes(' hiring ')) {
      const [compPart, rest] = docTitle.split(' hiring ');
      if (compPart) data.company = compPart.trim();
      if (rest) {
        if (rest.includes(' in ')) {
          const [rolePart, locPart] = rest.split(' in ');
          data.role = rolePart.trim();
          if (locPart) {
            data.location = locPart.split('|')[0].split('-')[0].trim();
          }
        } else {
          data.role = rest.split('|')[0].split('-')[0].trim();
        }
      }
    } else if (docTitle.includes(' at ')) {
      const [rolePart, rest] = docTitle.split(' at ');
      data.role = rolePart.trim();
      if (rest) {
        data.company = rest.split('|')[0].split('-')[0].trim();
      }
    }

    // 3. DOM Primary Extraction
    // Role
    if (!data.role) {
      const titleEl = document.querySelector(
        'h1.job-details-jobs-unified-top-card__job-title, .job-details-jobs-unified-top-card__job-title h1, h1.t-24, main h1, h1'
      );
      if (titleEl && titleEl.textContent.trim()) {
        data.role = titleEl.textContent.trim();
      }
    }

    // Company
    if (!data.company) {
      const companyEl = document.querySelector(
        'a[href*="/company/"], .job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name'
      );
      if (companyEl && companyEl.textContent.trim()) {
        data.company = companyEl.textContent.trim();
      }
    }

    // Location
    if (!data.location) {
      // Look for the metadata line containing "San Carlos, CA · 2 weeks ago"
      const metaContainer = document.querySelector(
        '.job-details-jobs-unified-top-card__primary-description-container, .job-details-jobs-unified-top-card__tertiary-description-container'
      );

      if (metaContainer) {
        const text = metaContainer.textContent.trim();
        // Split by middle dot '·' or bullet
        const parts = text.split(/[·•]/);
        if (parts.length > 0) {
          data.location = parts[0].trim();
        }
      }

      if (!data.location) {
        const locationSpan = document.querySelector(
          '.jobs-unified-top-card__bullet, .job-details-jobs-unified-top-card__bullet, span.tvm__text'
        );
        if (locationSpan) {
          data.location = locationSpan.textContent.replace(/[·•]/g, '').trim();
        }
      }
    }

    // Workplace type (Hybrid, Remote, On-site) append to location if available
    const workplaceBadge = Array.from(document.querySelectorAll('span, button, div'))
      .find(el => /^(hybrid|remote|on-site)$/i.test(el.textContent.trim()));
    if (workplaceBadge && data.location && !data.location.toLowerCase().includes(workplaceBadge.textContent.trim().toLowerCase())) {
      data.location = `${data.location} (${workplaceBadge.textContent.trim()})`;
    }

    // Salary
    if (!data.salary) {
      const salaryEl = document.querySelector(
        '.job-details-jobs-unified-top-card__job-insight:has(span:contains("$")), [class*="salary" i], [class*="compensation" i]'
      );
      const textToSearch = salaryEl ? salaryEl.textContent : document.body.innerText.slice(0, 2000);
      const salaryRegex = /\$[\d,]+(?:\.\d+)?\s*[kK]?(?:\s*(?:[–—\-]|to)\s*\$?[\d,]+(?:\.\d+)?\s*[kK]?)?(?:\s*(?:\/|\bper\b|\ba\b|\ban\b)\s*(?:hr|hour|yr|year|mo|month|annually)(?:\s+or\s+more)?|\s*(?:or more|\+))?/i;
      const match = textToSearch.match(salaryRegex);
      if (match) {
        data.salary = match[0].trim();
      }
    }

    // 4. Raw Text for AI
    data.rawText = document.body.innerText.slice(0, 15000);

  } catch (error) {
    console.error('JobWizz: LinkedIn extraction error', error);
  }

  return data;
}

function notifyExtraction() {
  try {
    if (!chrome.runtime?.id) return;
    const data = extractLinkedInJob();
    chrome.runtime.sendMessage({ type: 'JOB_DATA_EXTRACTED', data }).catch(() => {});
  } catch (e) {}
}

// Observe DOM for SPA navigation
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
    sendResponse(extractLinkedInJob());
  }
  return true;
});
