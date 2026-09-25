import { NextResponse } from 'next/server';
// Retired: diagnostics must never expose account data or perform unauthenticated writes.
export function GET() {
  return new NextResponse('Not found', { status: 404, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}
