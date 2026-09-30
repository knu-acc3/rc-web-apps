import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const headers = request.headers;
  const forwardedFor = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');
  const cfConnectingIp = headers.get('cf-connecting-ip');

  const ip = cfConnectingIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : realIp) || '127.0.0.1';

  return NextResponse.json({
    ip,
    userAgent: headers.get('user-agent') || 'Unknown',
    language: headers.get('accept-language') || 'Unknown',
    timestamp: new Date().toISOString(),
  });
}
