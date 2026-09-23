import assert from 'node:assert/strict';
import { test } from 'node:test';
import { linkedInFromProfile, parseLinkedInContent } from '../src/lib/linkedin-content';
import { campaignFromSearch, parseCampaign } from '../src/lib/acquisition';
import './setup-conversion';
import { ownedLinkedInResume } from '../src/lib/linkedin-server';

const OWN_ID = '10000000-0000-4000-8000-000000000001';
const OTHER_ID = '10000000-0000-4000-8000-000000000002';

function accessClients(userId: string | null) {
    let adminCalls = 0;
    const rows = [{ id: OWN_ID, user_id: 'owner', status: 'paid', linkedin_content: null }, { id: OTHER_ID, user_id: 'someone-else', status: 'paid', linkedin_content: null }];
    const filters: Array<[string, unknown]> = [];
    const query = {
        select() { return query; },
        eq(key: string, value: unknown) { filters.push([key, value]); return query; },
        async maybeSingle() { return { data: rows.find(row => filters.every(([key, value]) => row[key as keyof typeof row] === value)) || null, error: null }; },
    };
    const clients = {
        async createServerClient() { return { auth: { async getUser() { return { data: { user: userId ? { id: userId } : null }, error: null }; } } }; },
        createAdminClient() { adminCalls++; return { from() { return query; } }; },
    } as unknown as NonNullable<Parameters<typeof ownedLinkedInResume>[1]>;
    return { clients, adminCalls: () => adminCalls };
}

test('signed-out visitors cannot read any resume through the privileged client', async () => {
    const fake = accessClients(null);
    const result = await ownedLinkedInResume(OWN_ID, fake.clients);
    assert.equal(result.error?.status, 401);
    assert.equal(fake.adminCalls(), 0);
});

test('a signed-in user cannot read or write another student’s LinkedIn content', async () => {
    const fake = accessClients('owner');
    const result = await ownedLinkedInResume(OTHER_ID, fake.clients);
    assert.equal(result.error?.status, 404);
});

test('the verified owner can access their own saved LinkedIn content', async () => {
    const fake = accessClients('owner');
    const result = await ownedLinkedInResume(OWN_ID, fake.clients);
    assert.equal(result.error, undefined);
    assert.equal(result.resume?.id, OWN_ID);
});

test('LinkedIn keeps reviewed achievements, dates, school and skills without inventing facts', () => {
    const content = linkedInFromProfile({ headline: 'Student interested in hospitality', about_text: 'I helped with our school food drive.', skills: ['Teamwork'], high_school: 'Example High School', graduation_year: '2027' }, [
        { title: 'Volunteer', organization: 'School food drive', bullets: ['Sorted donated food.', 'Organized collection boxes.'], start_date: '2025-09', is_current: true },
    ]);
    assert.equal(content.about, 'I helped with our school food drive.');
    assert.equal(content.experiences[0].description, 'Sorted donated food.\nOrganized collection boxes.');
    assert.equal(content.experiences[0].endDate, 'Present');
    assert.equal(content.education, 'Example High School\nGraduation year: 2027');
    assert.match(content.copyableText, /School food drive/);
    assert.deepEqual(parseLinkedInContent(JSON.stringify(content)), content);
});

test('malformed saved LinkedIn content is handled safely', () => {
    for (const value of ['{bad json', null, {}, { headline: '', about: '', experiences: [null], skills: [] }]) assert.equal(parseLinkedInContent(value), null);
});

test('campaign tracking excludes contact details and rejects oversized labels', () => {
    const campaign = campaignFromSearch('?utm_source=brenz&utm_medium=qr&utm_campaign=first_resume&email=private@example.com');
    assert.deepEqual(campaign, { utm_source: 'brenz', utm_medium: 'qr', utm_campaign: 'first_resume' });
    assert.deepEqual(parseCampaign(encodeURIComponent(JSON.stringify(campaign))), campaign);
    assert.deepEqual(parseCampaign('broken'), {});
    assert.deepEqual(campaignFromSearch('?utm_content=' + 'x'.repeat(101)), {});
});
