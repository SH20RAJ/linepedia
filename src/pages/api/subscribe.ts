import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json() as { email: string };
        const { email } = body;

        if (!email) {
            return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
        }

        // Using standard fetch for Resend to keep dependencies light
        const RESEND_API_KEY = (import.meta as any).env.RESEND_API_KEY || (process as any).env.RESEND_API_KEY;

        if (!RESEND_API_KEY) {
            console.error('RESEND_API_KEY is not configured');
            // Silent fail for user experience, but log for dev
            return new Response(JSON.stringify({ message: 'Success (Mock)' }), { status: 200 });
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Linespedia Sanctuary <newsletter@linespedia.com>',
                to: email,
                subject: 'Welcome to the Linespedia Sanctuary 🥀',
                html: `
                    <div style="font-family: serif; max-width: 600px; margin: auto; padding: 40px; background: #fdfcf7; border: 1px solid #e5e7eb; border-radius: 20px;">
                        <h1 style="color: #4f46e5; text-align: center;">Welcome, Seekers of Verse.</h1>
                        <p style="font-size: 18px; color: #374151; line-height: 1.6;">
                            You have just joined the most inspiring newsletter on the web. We don't just send emails; we send moments of reflection.
                        </p>
                        <p style="font-size: 18px; color: #374151; line-height: 1.6;">
                            Every Sunday, you'll receive:
                            <ul>
                                <li>1 Rare Shayari with deep meaning</li>
                                <li>A curated "Line of the Week" for your bio</li>
                                <li>Exclusive poetic analysis</li>
                            </ul>
                        </p>
                        <div style="text-align: center; margin-top: 40px;">
                            <a href="https://linespedia.com/explore" style="background: #4f46e5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold;">Explore the Sanctuary</a>
                        </div>
                        <hr style="margin-top: 40px; border: 0; border-top: 1px solid #e5e7eb;" />
                        <p style="font-size: 12px; color: #9ca3af; text-align: center;">Linespedia — Where every line tells a story.</p>
                    </div>
                `
            })
        });

        if (res.ok) {
            return new Response(JSON.stringify({ message: 'Subscribed successfully' }), { status: 200 });
        } else {
            const err = await res.json();
            console.error('Resend Error:', err);
            return new Response(JSON.stringify({ error: 'Subscription failed' }), { status: 500 });
        }
    } catch (e) {
        console.error('Subscription Endpoint Error:', e);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
};
