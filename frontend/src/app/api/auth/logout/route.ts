import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        // Remove the secure session cookie
        cookies().delete('session');

        return NextResponse.json({ success: true, message: 'Session cleared' });
    } catch (error) {
        console.error('Logout proxy error:', error);
        return NextResponse.json({ success: false, error: 'Failed to clear session' }, { status: 500 });
    }
}
