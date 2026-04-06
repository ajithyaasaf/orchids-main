import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { idToken } = body;

        if (!idToken) {
            return NextResponse.json({ success: false, error: 'ID token is required' }, { status: 400 });
        }

        // Proxy to Node.js backend to securely generate the 14-day Session Cookie
        const response = await fetch(`${API_BASE}/api/auth/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });

        let data: any = null;
        let rawText = '';
        try {
            rawText = await response.text();
            data = JSON.parse(rawText);
        } catch (e) {
            console.error('[Session Route] JSON parse failed. Raw response:', rawText);
        }

        if (!response.ok || !data?.success || !data?.data?.sessionCookie) {
            const errorMsg = data?.error || `Backend returned status ${response.status}: ${rawText.slice(0, 50)}...`;
            console.error('[Session Route] Backend proxy failed:', {
                status: response.status,
                url: API_BASE,
                error: errorMsg
            });
            return NextResponse.json({ success: false, error: errorMsg }, { status: 401 });
        }

        const sessionCookie = data.data.sessionCookie;

        // Set the HttpOnly cookie in the browser
        const expiresIn = 1000 * 60 * 60 * 24 * 14; // 14 days
        cookies().set('session', sessionCookie, {
            maxAge: expiresIn / 1000, // maxAge in Next.js cookies is in seconds
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
        });

        return NextResponse.json({ success: true, message: 'Session created' });
    } catch (error) {
        console.error('Session proxy error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
