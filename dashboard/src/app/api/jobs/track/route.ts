import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerCookieClient } from '@/lib/supabase/server';

// CORS response helper
function corsResponse(body: any, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      jobUrl = '',
      pageText = '',
      pageTitle = '',
      appliedOn = new Date().toISOString().split('T')[0],
      status = 'Applied',
      notes = '',
      manualData = {},
    } = body;

    console.log('JobWizz Track API received:', {
      jobUrl,
      pageTextLength: pageText?.length || 0,
      pageTitle,
      manualDataKeys: Object.keys(manualData),
    });

    // 1. Authenticate user via Bearer token or cookies
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    let user: { id: string; email?: string } | null = null;
    let supabaseClient;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (token) {
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: { user: authUser }, error: userError } = await supabaseClient.auth.getUser(token);
      if (!userError && authUser) {
        user = authUser;
      }
    }

    if (!user) {
      try {
        const cookieClient = await createServerCookieClient();
        const { data: { user: cookieUser } } = await cookieClient.auth.getUser();
        if (cookieUser) {
          user = cookieUser;
          supabaseClient = cookieClient;
        }
      } catch (e) {
        // No cookie session
      }
    }

    if (!user || !supabaseClient) {
      return corsResponse({ error: 'Unauthorized. Please log in to track applications.' }, 401);
    }

    // 2. Check for duplicate URL
    const normalizedUrl = normalizeJobUrl(jobUrl);
    if (normalizedUrl) {
      const { data: existing } = await supabaseClient
        .from('jobs')
        .select('id, role, company')
        .eq('user_id', user.id)
        .eq('job_url', normalizedUrl)
        .limit(1);

      if (existing && existing.length > 0) {
        return corsResponse({
          error: `You've already tracked this job: "${existing[0].role}" at "${existing[0].company}".`,
          duplicate: true,
          existingJob: existing[0],
        }, 409);
      }
    }

    // 3. Build the best possible text context for Gemini
    // 3. Build text context for Gemini
    //    PRIMARY: server fetches the page HTML directly from the URL
    //    SUPPLEMENT: content script rawText (already rendered DOM, includes dynamic content)
    //    BONUS: page title (most reliable single line of data)

    let serverFetchedText = '';
    if (jobUrl) {
      console.log('JobWizz: Fetching page server-side from URL...');
      try {
        serverFetchedText = await fetchPageText(jobUrl);
        console.log('JobWizz: Server fetch got', serverFetchedText.length, 'chars');
      } catch (fetchErr) {
        console.warn('JobWizz: Server-side page fetch failed:', fetchErr);
      }
    }

    // Combine: extension text (from authenticated session) takes priority
    let textForAI = '';
    if (pageTitle) {
      textForAI += `Page Title: ${pageTitle}\n\n`;
    }
    if (pageText && pageText.length > 200) {
      // Extension's text is from the user's authenticated session — richest source
      textForAI += pageText;
    } else if (serverFetchedText.length > 200) {
      // Fallback to server-fetched text (public view, may be limited)
      textForAI += serverFetchedText;
    } else if (pageText) {
      textForAI += pageText;
    }

    console.log('JobWizz: Final text for AI:', textForAI.length, 'chars. First 300:', textForAI.slice(0, 300));

    // 4. Extract with Gemini AI
    let aiExtracted: Record<string, string> = {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && textForAI.length > 10) {
      try {
        const prompt = `Based on the provided job URL and the scraped text from the page, provide me the job title, company name, salary, and location.

Respond with ONLY a valid JSON object:
{
  "role": "Job title",
  "company": "Company name",
  "location": "Location (City, State or Remote)",
  "salary": "Salary or empty string if not found",
  "source": "Platform name (e.g. LinkedIn, Handshake, Indeed, Other)"
}

Job URL: ${jobUrl}

Scraped Text:
"""
${textForAI.slice(0, 16000)}
"""`;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
        const aiRes = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        });

        if (aiRes.ok) {
          const aiJson = await aiRes.json();
          const text = aiJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
            aiExtracted = JSON.parse(clean);
            console.log('JobWizz: Gemini extracted:', JSON.stringify(aiExtracted));
          }
        } else {
          const errBody = await aiRes.text().catch(() => '');
          console.warn('JobWizz: Gemini API error', aiRes.status, errBody.slice(0, 500));
        }
      } catch (aiErr) {
        console.warn('JobWizz: Gemini extraction failed:', aiErr);
      }
    } else {
      console.warn('JobWizz: Skipping Gemini — no API key or text too short');
    }

    // 5. If Gemini failed, try parsing the page title directly (very reliable for LinkedIn/Handshake)
    if ((!aiExtracted.role || !aiExtracted.company) && pageTitle) {
      const titleParsed = parseTitlePattern(pageTitle);
      if (titleParsed.role) aiExtracted.role = aiExtracted.role || titleParsed.role;
      if (titleParsed.company) aiExtracted.company = aiExtracted.company || titleParsed.company;
      if (titleParsed.location) aiExtracted.location = aiExtracted.location || titleParsed.location;
      console.log('JobWizz: Title fallback parsed:', JSON.stringify(titleParsed));
    }

    // 6. Merge: Gemini AI > DOM manualData > heuristics
    const merged = {
      role: aiExtracted.role || manualData.role || '',
      company: aiExtracted.company || manualData.company || '',
      location: aiExtracted.location || manualData.location || '',
      salary: aiExtracted.salary || manualData.salary || '',
      source: manualData.source || aiExtracted.source || detectSourceFromUrl(jobUrl),
    };

    // 7. Last-resort heuristics
    if (!merged.role || !merged.company) {
      const heuristic = applyServerHeuristics(textForAI, jobUrl, merged);
      merged.role = merged.role || heuristic.role;
      merged.company = merged.company || heuristic.company;
      merged.location = merged.location || heuristic.location;
      merged.salary = merged.salary || heuristic.salary;
    }

    if (!merged.role) merged.role = 'Job Application';
    if (!merged.company) merged.company = 'Unknown Company';
    if (!merged.source) merged.source = detectSourceFromUrl(jobUrl);

    console.log('JobWizz: Final merged result:', JSON.stringify(merged));

    // 8. Insert into Supabase
    const newRecord = {
      user_id: user.id,
      role: merged.role,
      company: merged.company,
      location: merged.location || null,
      salary: merged.salary || null,
      source: merged.source,
      applied_on: appliedOn,
      job_url: normalizedUrl || jobUrl || null,
      status: status,
      notes: notes || null,
    };

    const { data: insertedData, error: insertError } = await supabaseClient
      .from('jobs')
      .insert([newRecord])
      .select()
      .single();

    if (insertError) {
      console.error('JobWizz: Supabase insert error', insertError);
      return corsResponse({ error: insertError.message }, 500);
    }

    return corsResponse({
      success: true,
      job: insertedData,
      aiUsed: Object.keys(aiExtracted).length > 0,
    });
  } catch (err: any) {
    console.error('JobWizz: Track API error', err);
    return corsResponse({ error: err.message || 'Internal server error' }, 500);
  }
}

/**
 * Fetch page text server-side as fallback when the content script didn't provide text.
 * Works well for public job listings (Indeed, Greenhouse, Lever).
 * LinkedIn/Handshake may redirect to login, in which case we get minimal text — still better than nothing.
 */
async function fetchPageText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    if (!res.ok) return '';

    const html = await res.text();

    // Strip HTML tags to get plain text
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#\d+;/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return text.slice(0, 6000);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Parse common page title patterns for LinkedIn and Handshake.
 * LinkedIn formats:
 *   "Company hiring Job Title in Location | LinkedIn"
 *   "Job Title at Company | LinkedIn"
 *   "Job Title | Company | LinkedIn"
 *   "Job Title - Company | LinkedIn"
 * Handshake: "Job Title at Company | Handshake"
 */
function parseTitlePattern(title: string): { role: string; company: string; location: string } {
  const result = { role: '', company: '', location: '' };
  if (!title) return result;

  // Strip trailing "| LinkedIn", "| Handshake", etc.
  const cleaned = title.replace(/\s*\|\s*(LinkedIn|Handshake|Indeed|Glassdoor)\s*$/i, '').trim();

  // "Company hiring Role in Location"
  if (cleaned.includes(' hiring ')) {
    const [compPart, rest] = cleaned.split(' hiring ');
    result.company = compPart.trim();
    if (rest) {
      if (rest.includes(' in ')) {
        const [rolePart, locPart] = rest.split(' in ');
        result.role = rolePart.trim();
        result.location = (locPart || '').trim();
      } else {
        result.role = rest.trim();
      }
    }
    return result;
  }

  // "Role at Company"
  if (cleaned.includes(' at ')) {
    const [rolePart, compPart] = cleaned.split(' at ');
    result.role = rolePart.trim();
    result.company = (compPart || '').trim();
    return result;
  }

  // "Role | Company" (pipe separated — common LinkedIn direct view)
  if (cleaned.includes(' | ')) {
    const parts = cleaned.split(' | ').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      result.role = parts[0];
      result.company = parts[1];
    }
    return result;
  }

  // "Role - Company"
  if (cleaned.includes(' - ')) {
    const parts = cleaned.split(' - ');
    if (parts.length >= 2) {
      result.role = parts[0].trim();
      result.company = parts[1].trim();
    }
    return result;
  }

  return result;
}

function normalizeJobUrl(url: string): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    const linkedinMatch = u.pathname.match(/\/jobs\/view\/(\d+)/);
    if (linkedinMatch) {
      return `https://www.linkedin.com/jobs/view/${linkedinMatch[1]}/`;
    }
    const handshakeMatch = u.pathname.match(/\/(?:stu\/)?jobs\/(\d+)/);
    if (u.hostname.includes('joinhandshake.com') && handshakeMatch) {
      return `https://app.joinhandshake.com/stu/jobs/${handshakeMatch[1]}`;
    }
    return `${u.origin}${u.pathname}`;
  } catch {
    return url;
  }
}

function detectSourceFromUrl(url: string): 'LinkedIn' | 'Handshake' | 'Indeed' | 'Other' {
  const lower = url.toLowerCase();
  if (lower.includes('linkedin.com')) return 'LinkedIn';
  if (lower.includes('joinhandshake.com')) return 'Handshake';
  if (lower.includes('indeed.com')) return 'Indeed';
  return 'Other';
}

function applyServerHeuristics(text: string, url: string, current: any) {
  const res = { ...current };
  if (!text) return res;

  const salaryRegex = /\$[\d,]+(?:\.\d+)?\s*[kK]?(?:\s*(?:[–—\-]|to)\s*\$?[\d,]+(?:\.\d+)?\s*[kK]?)?(?:\s*(?:\/|\bper\b|\ba\b|\ban\b)\s*(?:hr|hour|yr|year|mo|month|annually)(?:\s+or\s+more)?|\s*(?:or more|\+))?/i;
  const match = text.match(salaryRegex);
  if (match && !res.salary) {
    res.salary = match[0].trim();
  }

  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 2 && l.length < 100 && !/apply|posted|share|save|ago|sign in|log in|navigation/i.test(l));
  if (!res.role && lines[0]) res.role = lines[0];
  if (!res.company && lines[1]) res.company = lines[1];

  return res;
}
