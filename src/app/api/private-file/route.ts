import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { validAsset } from '@/lib/student-privacy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const privateHeaders = {
  'Cache-Control': 'private, no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'; sandbox",
  Vary: 'Cookie',
};

export async function GET(request: NextRequest) {
  try {
    const asset = validAsset(request.nextUrl.searchParams.get('bucket') || '', request.nextUrl.searchParams.get('path') || '');
    if (!asset) return new NextResponse('Not found', { status: 404, headers: privateHeaders });
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new NextResponse('Sign in required', { status: 401, headers: privateHeaders });
    if (user.app_metadata?.deletion_in_progress) return new NextResponse('Account deletion in progress', { status: 409, headers: privateHeaders });
    // Cookie-authenticated client: storage RLS, not a guessable filename, decides ownership.
    const { data, error } = await supabase.storage.from(asset.bucket).download(asset.path);
    if (error || !data) return new NextResponse('Not found', { status: 404, headers: privateHeaders });
    const inlineImage = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(data.type);
    const fileName = (asset.path.split('/').pop() || 'download').replace(/[^a-zA-Z0-9._-]/g, '_');
    return new NextResponse(data, { headers: {
      ...privateHeaders,
      'Content-Type': inlineImage || data.type === 'application/pdf' ? data.type : 'application/octet-stream',
      'Content-Disposition': `${inlineImage ? 'inline' : 'attachment'}; filename="${fileName}"`,
    } });
  } catch {
    return new NextResponse('File unavailable', { status: 503, headers: privateHeaders });
  }
}
