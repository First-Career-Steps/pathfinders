import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validAsset, privateAssetPath, privateAssetUrl, recentSignIn, sameOriginWrite } from '../src/lib/student-privacy';
import { runAccountDeletion, type DeletionSteps, type DeletionAsset } from '../src/lib/account-deletion';

const user = '11111111-1111-4111-8111-111111111111';
const file = (path: string) => readFileSync(path, 'utf8');
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-only-key';

for (const bucket of ['photos', 'resume-assets', 'resumes', 'roadmaps']) {
  test(`validation: accepts private ${bucket} owner path`, () => {
    assert.deepEqual(validAsset(bucket, `${user}/file.pdf`), { bucket, path: `${user}/file.pdf` });
  });
}
for (const path of ['../other.pdf', `${user}/../other.pdf`, `${user}/%2e%2e/other.pdf`, `${user}//other.pdf`, `/other.pdf`, `${user}/file\\x`, `${user}/x\0y`]) {
  test(`validation: rejects unsafe path ${JSON.stringify(path)}`, () => assert.equal(validAsset('resumes', path), null));
}
test('validation: rejects non-student bucket', () => assert.equal(validAsset('admin', 'file'), null));
test('validation: constructs an encoded authenticated URL', () => {
  const url = new URL(privateAssetPath('resumes', `${user}/my resume.pdf`), 'https://firstcareersteps.com');
  assert.equal(url.pathname, '/api/private-file');
  assert.equal(url.searchParams.get('path'), `${user}/my resume.pdf`);
});
for (const kind of ['public', 'sign', 'authenticated']) {
  test(`validation: converts legacy ${kind} URLs without retaining a token`, () => {
    assert.equal(privateAssetUrl(`https://example.supabase.co/storage/v1/object/${kind}/resumes/${user}/x.pdf?token=do-not-retain`), privateAssetPath('resumes', `${user}/x.pdf`));
  });
}
test('validation: never treats another host as an authorized storage bucket', () => {
  const url = `https://attacker.example/storage/v1/object/public/resumes/${user}/x.pdf`;
  assert.equal(privateAssetUrl(url), url);
});
test('validation: null input is safe and existing proxy links are stable', () => {
  assert.equal(privateAssetUrl(null), '');
  const url=privateAssetPath('resumes', `${user}/x.pdf`);
  assert.equal(privateAssetUrl(url), url);
});
test('validation: recent authentication requires a genuine, recent timestamp', () => {
  const now = Date.parse('2026-09-25T02:00:00Z');
  assert.equal(recentSignIn('2026-09-25T01:50:00Z', now), true);
  assert.equal(recentSignIn('2026-09-25T01:49:59Z', now), false);
  assert.equal(recentSignIn('2026-09-25T02:01:00Z', now), false);
  assert.equal(recentSignIn('invalid', now), false);
  assert.equal(recentSignIn(undefined, now), false);
});
test('validation: cross-origin, missing-origin and null-origin deletion fail closed', () => {
  assert.equal(sameOriginWrite('https://www.firstcareersteps.com', 'https://www.firstcareersteps.com/api/account'), true);
  for (const origin of [null, 'null', 'https://evil.example', 'http://www.firstcareersteps.com']) assert.equal(sameOriginWrite(origin, 'https://www.firstcareersteps.com/api/account'), false);
});

function fakeSteps(override: Partial<DeletionSteps> = {}) {
  const calls: string[] = [];
  let assets: DeletionAsset[] = [{ bucket_id: 'resumes', name: `${user}/resume.pdf` }, { bucket_id: 'photos', name: `${user}/photo.png` }];
  const steps: DeletionSteps = {
    restrictAccount: async () => { calls.push('restrict'); },
    cancelBilling: async () => { calls.push('billing'); },
    listAssets: async () => { calls.push('list'); return assets.slice(0, 1); },
    removeAssets: async (bucket, names) => { calls.push(`remove:${bucket}`); assets = assets.filter(a => !(a.bucket_id === bucket && names.includes(a.name))); },
    purgeLinkedLogs: async () => { calls.push('logs'); },
    deleteIdentity: async () => { calls.push('identity'); },
    ...override,
  };
  return { steps, calls };
}
test('cleanup: processes all storage pages before deleting the identity', async () => {
  const { steps, calls } = fakeSteps(); await runAccountDeletion(steps);
  assert.deepEqual(calls, ['restrict','billing','list','remove:resumes','list','remove:photos','list','logs','identity']);
});
for (const step of ['restrictAccount', 'cancelBilling', 'listAssets', 'removeAssets', 'purgeLinkedLogs'] as const) {
  test(`cleanup: ${step} failure never reports a completed identity deletion`, async () => {
    const { steps, calls } = fakeSteps({ [step]: async () => { throw new Error('temporary failure'); } });
    await assert.rejects(runAccountDeletion(steps));
    assert.equal(calls.includes('identity'), false);
  });
}
test('cleanup: an interrupted request can safely retry completed cleanup', async () => {
  let failed = false;
  const { steps, calls } = fakeSteps({ purgeLinkedLogs: async () => { if (!failed) { failed=true; throw new Error('retry'); } } });
  await assert.rejects(runAccountDeletion(steps));
  await runAccountDeletion(steps);
  assert.equal(calls.filter(c => c === 'identity').length, 1);
  assert.equal(calls.filter(c => c.startsWith('remove:')).length, 2);
});
test('cleanup: identity-provider error is not swallowed', async () => {
  const { steps } = fakeSteps({ deleteIdentity: async () => { throw new Error('auth unavailable'); } });
  await assert.rejects(runAccountDeletion(steps), /auth unavailable/);
});
test('cleanup: repeated unremovable files stop instead of deleting the identity', async () => {
  const { steps, calls } = fakeSteps({ removeAssets: async () => {} });
  await assert.rejects(runAccountDeletion(steps), /another attempt/);
  assert.equal(calls.includes('identity'), false);
});

test('routes: no public resume lookup or personal metadata remains', () => {
  const route = file('src/app/resume/[id]/page.tsx');
  assert.doesNotMatch(route, /createAdminClient|generateMetadata|eq\('shareable_link'/);
  assert.match(route, /auth\.getUser\(\)/);
  assert.match(route, /\.eq\('user_id', user\.id\)/);
  assert.match(route, /index: false/);
});
test('routes: file downloads use the owner session, not an admin bypass or public redirect', () => {
  const route = file('src/app/api/private-file/route.ts');
  assert.doesNotMatch(route, /createAdminClient|getPublicUrl|redirect\(/);
  assert.match(route, /auth\.getUser\(\)/);
  assert.match(route, /private, no-store/);
});
test('routes: destructive target always comes from the authenticated user', () => {
  const route = file('src/app/api/account/route.ts');
  assert.doesNotMatch(route, /body\.(userId|user_id|target_user|customer|path)/);
  assert.match(route, /deleteUser\(user\.id, false\)/);
  assert.match(route, /recentSignIn\(user\.last_sign_in_at\)/);
  assert.match(route, /confirmation !== 'DELETE'/);
});
test('database: migration removes public access and protects administrative privileges', () => {
  const sql = file('sql/20260924-student-privacy.sql');
  assert.match(sql, /SET public = false/);
  assert.match(sql, /DROP POLICY IF EXISTS "Public can view shared resumes"/);
  assert.match(sql, /NEW\.shareable_link := NULL/);
  assert.match(sql, /REVOKE INSERT, UPDATE ON public\.users FROM PUBLIC, anon, authenticated/);
  assert.match(sql, /fcs_account_storage\(uuid\) FROM PUBLIC, anon, authenticated/);
  assert.doesNotMatch(sql, /DELETE FROM (?:auth\.users|storage\.objects)/i);
});
test('legal: provider named on both pages; signup, settings and both footers link policies', () => {
  for (const path of ['src/app/privacy/page.tsx','src/app/terms/page.tsx']) assert.match(file(path), /OpenAI/);
  for (const path of ['src/components/Footer.tsx','src/app/page.tsx','src/app/signup/page.tsx','src/app/dashboard/settings/page.tsx']) {
    assert.match(file(path), /href="\/privacy"/); assert.match(file(path), /href="\/terms"/);
  }
  assert.doesNotMatch(file('src/app/dashboard/settings/page.tsx'), /Account deletion will be implemented/);
  assert.match(file('src/lib/resume-ai.ts'), /store: false/);
});
test('routes: owner downloads no longer depend on revoked public links', () => {
  const page = file('src/app/dashboard/resumes/page.tsx');
  assert.match(page, /\$\{resume\.id\}\?download=true/);
  assert.doesNotMatch(page, /Shareable link not found|Copy Link/);
  assert.match(file('src/app/resume/[id]/page.tsx'), /\.eq\('status', 'paid'\)/);
});
