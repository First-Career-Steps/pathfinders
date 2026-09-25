import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const file = (path: string) => readFileSync(path, 'utf8');
test('retired diagnostics never queries users, resumes, billing, logs or credentials', () => {
  const route = file('src/app/api/diag/webhook-check/route.ts');
  assert.match(route, /status: 404/);
  assert.doesNotMatch(route, /createAdminClient|process\.env|\.from\(|\.insert\(/);
});
test('roadmap generation derives ownership from the verified session and uses storage RLS', () => {
  const route = file('src/app/api/ai/generate-roadmap/route.tsx');
  assert.match(route, /const userId = user\.id/);
  assert.match(route, /body\.userId !== user\.id/);
  assert.match(route, /supabase: SupabaseClient/);
  assert.match(route, /createServerClient\(\)/);
  assert.doesNotMatch(route, /SUPABASE_SERVICE_ROLE_KEY|createAdminClient/);
  assert.match(route, /store: false/);
});
test('all account, preview and builder pages are protected by middleware', () => {
  const routes=file('src/middleware.ts').match(/const protectedRoutes = \[([\s\S]*?)\];/)?.[1] || '';
  for (const path of ['/dashboard','/resume','/career-roadmap','/builder','/success']) assert.ok(routes.includes(`'${path}'`));
});
test('administrative access is unavailable once account deletion starts', () => {
  assert.match(file('src/lib/admin-auth.ts'), /user\.app_metadata\?\.deletion_in_progress/);
});
