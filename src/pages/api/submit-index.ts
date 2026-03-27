import { submitToIndexNow } from '../../../scripts/submit-indexnow';

export async function GET() {
  try {
    const urlCount = await submitToIndexNow();
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Submitted ${urlCount} URLs to IndexNow successfully.`,
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
