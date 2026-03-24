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

        // Call our Node.js Backend to securely generate the 14-day Session Cookie
        const response = await fetch(`${API_BASE}/api/auth/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });

        const data = await response.json();

        if (!response.ok || !data.success || !data.data?.sessionCookie) {
            return NextResponse.json({ success: false, error: data.error || 'Failed to create session' }, { status: 401 });
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
