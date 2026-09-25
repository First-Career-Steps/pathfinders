from pathlib import Path
import re

def edit(path, old, new):
    p=Path(path); s=p.read_text()
    if new in s: return
    assert s.count(old)==1, (path,old[:70],s.count(old))
    p.write_text(s.replace(old,new))

p=Path('src/middleware.ts');s=p.read_text()
s,n=re.subn(r'const protectedRoutes = \[[\s\S]*?\];', "const protectedRoutes = ['/dashboard', '/resume', '/career-roadmap', '/builder', '/success'];",s)
assert n==1;p.write_text(s)

p=Path('src/app/api/diag/webhook-check/route.ts')
p.write_text("""import { NextResponse } from 'next/server';
// Retired: diagnostics must never expose account data or perform unauthenticated writes.
export function GET() {
  return new NextResponse('Not found', { status: 404, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}
""")
f='src/app/api/ai/generate-roadmap/route.tsx'
edit(f,"import { createClient } from '@supabase/supabase-js';", "import type { SupabaseClient } from '@supabase/supabase-js';\nimport { createServerClient } from '@/lib/supabase-server';")
edit(f,"const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;\nconst supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;\n\nconst supabase = createClient(supabaseUrl, supabaseServiceKey);", "// Requests and storage writes use the student's session and database ownership policies.")
edit(f,"        const { careerGoal, userId } = await request.json();\n\n        if (!careerGoal || !userId) {\n            return NextResponse.json(\n                { error: 'Career goal and user ID are required' },\n                { status: 400 }\n            );\n        }", """        const supabase = await createServerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
        if (user.app_metadata?.deletion_in_progress) return NextResponse.json({ error: 'Account deletion in progress' }, { status: 409 });
        const body = await request.json().catch(() => null);
        if (!body || typeof body.careerGoal !== 'string' || !body.careerGoal.trim() || body.careerGoal.length > 2000) {
            return NextResponse.json({ error: 'Enter a career goal of up to 2,000 characters.' }, { status: 400 });
        }
        if (body.userId && body.userId !== user.id) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        const careerGoal = body.careerGoal.trim();
        const userId = user.id;
""")
edit(f,"            model: 'gpt-4o',", "            model: 'gpt-4o',\n            store: false,")
edit(f,"            'infographic'\n        );", "            'infographic',\n            supabase\n        );")
edit(f,"            'milestone'\n        );", "            'milestone',\n            supabase\n        );")
edit(f,"    type: 'infographic' | 'milestone'\n): Promise<string>", "    type: 'infographic' | 'milestone',\n    supabase: SupabaseClient\n): Promise<string>")
edit(f,"{ error: error.message || 'Failed to generate career roadmap' }", "{ error: 'Unable to generate the roadmap. Please try again.' }")
edit('src/lib/admin-auth.ts', 'if (authError || !user) return null;', 'if (authError || !user || user.app_metadata?.deletion_in_progress) return null;')
edit('src/components/AccountDeletionPanel.tsx', "      for (const key of ['payment_completed', 'resume_created', 'currentResumeId']) sessionStorage.removeItem(key);", "      try {\n        for (const key of ['payment_completed', 'resume_created', 'currentResumeId']) sessionStorage.removeItem(key);\n      } catch { /* A browser storage restriction must not hide successful deletion. */ }")
print('Closed anonymous diagnostics and enforced owner-only roadmap writes.')
