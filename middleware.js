import { NextResponse } from 'next/server';

const SECRET_KEY = 'vensync2025';
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20;
const ipMap = new Map();

export function middleware(request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();

  // Rate limiting
  if (!ipMap.has(ip)) {
    ipMap.set(ip, { count: 1, start: now });
  } else {
    const record = ipMap.get(ip);
    if (now - record.start > RATE_LIMIT_WINDOW) {
      ipMap.set(ip, { count: 1, start: now });
    } else {
      record.count++;
      if (record.count > MAX_REQUESTS) {
        return NextResponse.redirect('https://www.google.com');
      }
    }
  }

  // Secret key check
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('k');
  const session = request.cookies.get('vs_session');

  if (key !== SECRET_KEY && !session) {
    return NextResponse.redirect('https://www.google.com');
  }

  // Set session cookie if key was valid
  if (key === SECRET_KEY) {
    const response = NextResponse.next();
    response.cookies.set('vs_session', 'true', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 365 // 1 year
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|manifest.json|sw.js).*)'],
};
