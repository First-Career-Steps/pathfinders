from pathlib import Path
import re, json

def change(path, old, new, count=1):
    p=Path(path); s=p.read_text()
    if new in s: return
    if old not in s:
        raise RuntimeError(f'Missing expected source in {path}: {old[:80]!r}')
    if s.count(old) != count: raise RuntimeError(f'Ambiguous source in {path}: {old[:80]!r}')
    p.write_text(s.replace(old,new))

def add_import(path, statement):
    p=Path(path); s=p.read_text()
    if statement in s: return
    matches=list(re.finditer(r'^(?:\x27use client\x27|"use client");\s*',s,re.M))
    pos=matches[0].end() if matches else 0
    p.write_text(s[:pos]+statement+'\n'+s[pos:])

# Preserve the website structure; add legal links to both existing footers.
f='src/components/Footer.tsx'
change(f,'<nav className="flex flex-wrap gap-6 text-sm" aria-label="Footer">','<nav className="flex flex-wrap gap-6 text-sm" aria-label="Footer">\n                    <Link href="/privacy" className="hover:underline">Privacy Policy</Link>\n                    <Link href="/terms" className="hover:underline">Terms of Service</Link>')
change(f,'FirstCareerSteps. Built for your first career steps.','Pathfinders Ventures LLC. FirstCareerSteps is made in Columbus, Ohio.')
change('src/app/page.tsx','{/* Footer Navigation */}','{/* Footer Navigation */}\n          <nav aria-label="Legal" className="flex flex-wrap justify-center gap-6 text-sm">\n            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>\n            <Link href="/terms" className="hover:underline">Terms of Service</Link>\n          </nav>')

change('src/app/signup/page.tsx','{/* Submit Button */}', '''<label className="flex items-start gap-3 text-sm leading-relaxed text-gray-600">
                    <input type="checkbox" required name="acceptTerms" className="mt-1" disabled={loading} />
                    <span>I am at least 13 (or the higher minimum age where I live), and have a parent or guardian&apos;s permission if under 18. I agree to the <Link href="/terms" className="text-career-blue underline" target="_blank">Terms</Link> and have read the <Link href="/privacy" className="text-career-blue underline" target="_blank">Privacy Policy</Link>, including how OpenAI processes AI requests.</span>
                  </label>
                  {/* Submit Button */}''')
f='src/contexts/AuthContext.tsx'; p=Path(f); s=p.read_text()
needle='''                        full_name: fullName,
                        linkedin_link: linkedinLink || null,
'''
if 'privacy_version:' not in s:
    assert needle in s
    s=s.replace(needle,needle+'''                        privacy_version: '2026-09-24',
                        terms_version: '2026-09-24',
                        terms_accepted_at: new Date().toISOString(),
''',1);p.write_text(s)

f='src/app/dashboard/settings/page.tsx'; p=Path(f);s=p.read_text()
if 'AccountDeletionPanel' not in s:
    s=s.replace("import { useState } from 'react';", "import AccountDeletionPanel from '@/components/AccountDeletionPanel';")
    s=s.replace('    const [loading, setLoading] = useState(false);','')
    s,n=re.subn(r'    const handleDeleteAccount = async \(\) => \{.*?\n    \};\n','',s,flags=re.S);assert n==1
    start=s.index('                {/* Danger Zone */}');end=s.index('                {/* Back Link */}',start)
    s=s[:start]+'''                <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="text-xl font-bold text-charcoal">Your profile is private</h2>
                    <p className="mt-3 text-gray-600">Only your signed-in account can view your saved profile and download stored files. We do not publish a student directory or public resume links. Authorized staff and providers may process data to operate the service. You choose who receives a downloaded resume.</p>
                    <p className="mt-3 text-sm"><Link href="/privacy" className="text-career-blue underline">Privacy Policy</Link> · <Link href="/terms" className="text-career-blue underline">Terms of Service</Link></p>
                </section>
                <AccountDeletionPanel />

'''+s[end:];p.write_text(s)

f='src/components/layout/BuilderLayout.tsx'
add_import(f,"import AIPrivacyNotice from '@/components/AIPrivacyNotice';")
change(f,'{children}','<AIPrivacyNotice />\n          {children}')

# Owner downloads continue to work after revoking public links and public storage.
f='src/contexts/ProfileContext.tsx';add_import(f,"import { privateAssetUrl } from '@/lib/student-privacy';")
change(f,'photoUrl: profileData?.photo_url || null,','photoUrl: privateAssetUrl(profileData?.photo_url) || null,')
change(f,'photoEnhancedUrl: profileData?.photo_enhanced_url || null,','photoEnhancedUrl: privateAssetUrl(profileData?.photo_enhanced_url) || null,')
f='src/app/dashboard/resumes/page.tsx';add_import(f,"import { privateAssetUrl } from '@/lib/student-privacy';")
change(f,'setResumes(data || []);','setResumes((data || []).map(row => ({ ...row, pdf_url: privateAssetUrl(row.pdf_url) || null })));')
change(f,'Download your resume, then prepare your LinkedIn guide from your current profile.','Your saved resumes are private. Download a copy when you are ready to share it, or prepare your LinkedIn guide.')
p=Path(f);s=p.read_text()
if 'Shareable link not found.' in s:
    s,n=re.subn(r"if \(resume\.shareable_link\) \{\s*window\.open\(`/resume/\$\{resume\.shareable_link\}\?download=true`, '_blank'\);\s*\} else \{\s*alert\('Shareable link not found\.'\);\s*\}", "window.open(`/resume/${resume.id}?download=true`, '_blank', 'noopener,noreferrer');", s)
    assert n == 1, 'Expected paid download control'
    s,n=re.subn(r'\{resume\.shareable_link && \(\s*<button[\s\S]*?Copy Link\s*</button>\s*\)\}', '<Link href={`/resume/${resume.id}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 border-2 border-career-blue text-career-blue font-medium rounded-lg text-center">Private preview</Link>', s)
    assert n == 1, 'Expected public link control'
    p.write_text(s)
change('src/app/resume/[id]/page.tsx', ".eq('id', id).eq('user_id', user.id).maybeSingle()", ".eq('id', id).eq('user_id', user.id).eq('status', 'paid').maybeSingle()")
f='src/app/dashboard/roadmaps/page.tsx';add_import(f,"import { privateAssetUrl } from '@/lib/student-privacy';")
change(f,'setRoadmaps(data || []);','setRoadmaps((data || []).map(row => ({ ...row, infographic_url: privateAssetUrl(row.infographic_url) || null, milestone_roadmap_url: privateAssetUrl(row.milestone_roadmap_url) || null })));')

# Authenticated images cannot use a public optimization cache or a cookie-less proxy.
for p in Path('src').rglob('*.tsx'):
    s=p.read_text()
    def private_image(match):
        tag=match.group(0)
        if 'unoptimized' not in tag and re.search(r'photo|infographic|milestone',tag,re.I):
            return tag.replace('<Image','<Image unoptimized',1)
        return tag
    out=re.sub(r'<Image\b[\s\S]*?/\s*>',private_image,s)
    if out!=s:p.write_text(out)

f='src/lib/pdf/generator.ts';add_import(f,"import { privateAssetPath } from '@/lib/student-privacy';")
change(f,'const fileName = `resume_${userId}_${Date.now()}.pdf`;','const fileName = `${userId}/resume_${Date.now()}.pdf`;')
p=Path(f);s=p.read_text()
s,n=re.subn(r'''        // Get public URL\n        const \{ data: urlData \} = supabase\.storage\n            \.from\('resumes'\)\n            \.getPublicUrl\(fileName\);\n\n        return \{ url: urlData\.publicUrl, error: null \};''',"        return { url: privateAssetPath('resumes', fileName), error: null };",s)
assert n==1 or "privateAssetPath('resumes', fileName)" in s;p.write_text(s)
f='src/app/api/ai/generate-roadmap/route.tsx';add_import(f,"import { privateAssetPath } from '@/lib/student-privacy';")
p=Path(f);s=p.read_text()
s,n=re.subn(r'''        // Get public URL\n        const \{ data: \{ publicUrl \} \} = supabase\.storage\n            \.from\('roadmaps'\)\n            \.getPublicUrl\(filePath\);\n\n        return publicUrl;''',"        return privateAssetPath('roadmaps', filePath);",s)
assert n==1 or "privateAssetPath('roadmaps', filePath)" in s;p.write_text(s)
change('src/lib/resume-ai.ts',"        model: getResumeAIModel(),","        model: getResumeAIModel(),\n        store: false,")

f='src/middleware.ts';p=Path(f);s=p.read_text()
if "'/dashboard'," not in s:
    s=s.replace("const protectedRoutes = [", "const protectedRoutes = [\n    '/dashboard',\n    '/resume',\n    '/career-roadmap',")
old="        const isAuthenticated = !!user;"
new=old+'''
        const isProtectedApi = pathname.startsWith('/api/ai/') || pathname.startsWith('/api/resumes/') || ['/api/create-checkout', '/api/check-subscription'].includes(pathname);
        if (isProtectedApi && !user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
        if (user?.app_metadata?.deletion_in_progress && !['/', '/privacy', '/terms', '/dashboard/settings', '/login', '/signup', '/blocked'].includes(pathname)) {
            if (isProtectedApi) return NextResponse.json({ error: 'Account deletion in progress' }, { status: 409 });
            return NextResponse.redirect(new URL('/dashboard/settings', request.url));
        }
        if (isProtectedApi || protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
            response.headers.set('Cache-Control', 'private, no-store');
            response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
        }
'''
if 'const isProtectedApi' not in s:s=s.replace(old,new)
s=s.replace("pathname !== '/blocked' && pathname !== '/'", "!['/blocked', '/', '/privacy', '/terms', '/dashboard/settings'].includes(pathname)")
s=s.replace('''        // Allow the request to continue even if middleware fails
        return NextResponse.next();''','''        // Fail closed on account pages; public information remains available.
        if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Authentication unavailable' }, { status: 503 });
        if (protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/')) || pathname.startsWith('/admin')) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.next();''')
s=s.replace("            pathname.startsWith(route)", "            pathname === route || pathname.startsWith(route + '/')")
if "'/api/ai/:path*'" not in s:s=s.replace('    matcher: [',"    matcher: [\n        '/api/ai/:path*',\n        '/api/resumes/:path*',\n        '/api/create-checkout',\n        '/api/check-subscription',")
p.write_text(s)

p=Path('src/app/robots.ts')
p.write_text('''import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/dashboard/', '/builder/', '/resume/', '/checkout/', '/career-roadmap'] }, sitemap: 'https://www.firstcareersteps.com/sitemap.xml' };
}
''')
p=Path('package.json');d=json.loads(p.read_text());d['scripts']['test:privacy']='node --import tsx --test tests/student-privacy.test.ts';p.write_text(json.dumps(d,indent=2)+'\n')
print('Existing source transformations applied.')
