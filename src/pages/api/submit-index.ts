import { submitToIndexNow } from '../../../scripts/submit-indexnow';

function toPositiveNumber(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getTokenFromRequest(request: Request): string {
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  const url = new URL(request.url);
  return (url.searchParams.get('token') || '').trim();
}

async function handleSubmit(request: Request) {
  const endpointToken = String(import.meta.env.INDEXNOW_SUBMIT_TOKEN || '').trim();
  if (!endpointToken) {
    return new Response(JSON.stringify({
      success: false,
      error: 'INDEXNOW_SUBMIT_TOKEN is not configured on the server.'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const requestToken = getTokenFromRequest(request);
  if (!requestToken || requestToken !== endpointToken) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Unauthorized request.'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const requestUrl = new URL(request.url);
  const changedOnly = requestUrl.searchParams.get('changedOnly') === '1' || requestUrl.searchParams.get('mode') === 'changed';
  const dryRun = requestUrl.searchParams.get('dryRun') === '1';
  const changedSinceHours = toPositiveNumber(requestUrl.searchParams.get('changedSinceHours'), 72);
  const maxUrls = toPositiveNumber(requestUrl.searchParams.get('maxUrls'), 0);

  try {
    const urlCount = await submitToIndexNow({
      changedOnly,
      dryRun,
      changedSinceHours,
      maxUrls,
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Submitted ${urlCount} URLs to IndexNow successfully.`,
      mode: changedOnly ? 'changed' : 'full',
      dryRun,
      changedSinceHours,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET({ request }: { request: Request }) {
  return handleSubmit(request);
}

export async function POST({ request }: { request: Request }) {
  return handleSubmit(request);
}
