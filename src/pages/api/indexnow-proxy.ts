const DEFAULT_INDEXNOW_KEY = '2f3a29d127b84110a911375a73d97702';
const DEFAULT_HOST = 'linespedia.com';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS_PER_BATCH = 10000;
const MAX_REQUESTS_PER_MINUTE = 8;

const requestWindowByIp = new Map<string, number[]>();

function getClientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for') ||
    'unknown'
  ).split(',')[0].trim();
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const cutoff = now - 60_000;
  const existing = requestWindowByIp.get(ip) || [];
  const recent = existing.filter((ts) => ts >= cutoff);

  if (recent.length >= MAX_REQUESTS_PER_MINUTE) {
    requestWindowByIp.set(ip, recent);
    return true;
  }

  recent.push(now);
  requestWindowByIp.set(ip, recent);
  return false;
}

function validateAndNormalizeUrls(rawUrls: unknown): string[] {
  if (!Array.isArray(rawUrls)) {
    throw new Error('urlList must be an array.');
  }

  const normalized = rawUrls
    .map((item) => String(item || '').trim())
    .filter(Boolean);

  if (normalized.length === 0) {
    throw new Error('urlList is empty.');
  }

  if (normalized.length > MAX_URLS_PER_BATCH) {
    throw new Error(`urlList exceeds ${MAX_URLS_PER_BATCH} URLs.`);
  }

  for (const rawUrl of normalized) {
    let parsed: URL;

    try {
      parsed = new URL(rawUrl);
    } catch {
      throw new Error(`Invalid URL: ${rawUrl}`);
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error(`Unsupported protocol: ${rawUrl}`);
    }

    if (parsed.hostname !== DEFAULT_HOST) {
      throw new Error(`URL host must be ${DEFAULT_HOST}: ${rawUrl}`);
    }
  }

  return normalized;
}

export async function POST({ request }: { request: Request }) {
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Rate limit exceeded. Please wait a minute and try again.'
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = (await request.json()) as { urlList?: unknown };
    const urlList = validateAndNormalizeUrls(body?.urlList);

    const indexNowKey = String(import.meta.env.INDEXNOW_KEY || DEFAULT_INDEXNOW_KEY).trim();
    const host = String(import.meta.env.INDEXNOW_HOST || DEFAULT_HOST).trim();

    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host,
        key: indexNowKey,
        keyLocation: `https://${host}/${indexNowKey}.txt`,
        urlList,
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: `IndexNow returned ${response.status}`,
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      submitted: urlList.length,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error?.message || 'Unexpected error while submitting to IndexNow.',
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
