/**
 * Generic Universal Extractor for JobWizz
 * Runs on company career pages (Greenhouse, Lever, Indeed, Workday, etc.)
 */

function extractGenericJob() {
  const data = {
    role: '',
    company: '',
    location: '',
    salary: '',
    jobUrl: window.location.href,
    source: 'Other',
    rawText: ''
  };

  try {
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.includes('indeed')) data.source = 'Indeed';
    else if (hostname.includes('greenhouse')) data.source = 'Other';
    else if (hostname.includes('lever.co')) data.source = 'Other';

    // 1. Title Heuristics
    const titleEl = document.querySelector('h1, [class*="job-title" i], [class*="posting-title" i], [class*="position-title" i]');
    if (titleEl) {
      data.role = titleEl.textContent.trim();
    }

    // 2. Company Heuristics
    const companyEl = document.querySelector('[class*="company-name" i], [class*="employer" i], [data-company]');
    if (companyEl) {
      data.company = companyEl.textContent.trim();
    } else if (document.title.includes(' - ') || document.title.includes(' | ')) {
      const parts = document.title.split(/[-|]/);
      if (parts.length > 1) {
        data.company = parts[parts.length - 1].trim();
      }
    }

    // 3. Location Heuristics
    const locationEl = document.querySelector('[class*="location" i], [data-location]');
    if (locationEl) {
      data.location = locationEl.textContent.trim();
    }

    // 4. Salary Heuristics
    const salaryRegex = /\$[\d,]+(?:\.\d+)?\s*[kK]?(?:\s*(?:[–—\-]|to)\s*\$?[\d,]+(?:\.\d+)?\s*[kK]?)?(?:\s*(?:\/|\bper\b|\ba\b|\ban\b)\s*(?:hr|hour|yr|year|mo|month|annually)(?:\s+or\s+more)?|\s*(?:or more|\+))?/i;
    const salaryEl = document.querySelector('[class*="salary" i], [class*="compensation" i], [class*="pay" i]');
    if (salaryEl) {
      const match = salaryEl.textContent.match(salaryRegex);
      if (match) data.salary = match[0].trim();
    }
    if (!data.salary) {
      const match = document.body.innerText.slice(0, 3000).match(salaryRegex);
      if (match) data.salary = match[0].trim();
    }

    // 5. Raw Text for AI
    const mainContent = document.querySelector('main, article, [role="main"]') || document.body;
    data.rawText = mainContent.innerText.slice(0, 10000);

  } catch (error) {
    console.error('JobWizz: Generic extraction error', error);
  }

  return data;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'EXTRACT_JOB') {
    sendResponse(extractGenericJob());
  }
  return true;
});
