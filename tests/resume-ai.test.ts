import assert from 'node:assert/strict';
import { afterEach, beforeEach, mock, test } from 'node:test';
import OpenAI from 'openai';
import { NextRequest } from 'next/server';
import { POST as about } from '../src/app/api/ai/enhance-about/route';
import { POST as headline } from '../src/app/api/ai/enhance-headline/route';
import { POST as experience } from '../src/app/api/ai/enhance-experience/route';
import { resumeAIErrorResponse } from '../src/lib/resume-ai';
import { requestResumeAI, requireAIText, requireAILines } from '../src/lib/resume-ai-client';

const originalEnv = { ...process.env };
const aboutInput = { aboutMe: 'I enjoy science.', accomplishment: 'Led a science club.', goals: 'Study biology.' };
const headlineInput = { interests: ['science'], school: 'Example School', graduationYear: '2027' };
const experienceInput = { title: 'Club leader', organization: 'Example School', description: 'Organized club meetings.' };
const request = (data: unknown) => new NextRequest('http://localhost/api/ai/test', {
    method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' },
});

beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key-not-a-real-credential';
    delete process.env.OPENAI_ORG_ID;
    delete process.env.OPENAI_PROJECT_ID;
    delete process.env.OPENAI_RESUME_MODEL;
    mock.method(console, 'error', () => {});
    mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected network call'); });
});

afterEach(() => {
    mock.restoreAll();
    for (const name of ['OPENAI_API_KEY', 'OPENAI_ORG_ID', 'OPENAI_PROJECT_ID', 'OPENAI_RESUME_MODEL']) {
        if (originalEnv[name] === undefined) delete process.env[name];
        else process.env[name] = originalEnv[name];
    }
});

function providerResult(content: string | null, finishReason = 'stop') {
    mock.method(globalThis, 'fetch', async () => Response.json({
        choices: [{ message: { role: 'assistant', content }, finish_reason: finishReason }],
    }));
}

test('About generation returns usable text through the real OpenAI SDK', async () => {
    providerResult('  I enjoy science and led my school science club.  ');
    const response = await about(request(aboutInput));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { enhancedText: 'I enjoy science and led my school science club.' });
});

test('All resume routes use GPT-4o mini by default', async () => {
    const models: string[] = [];
    mock.method(globalThis, 'fetch', async (_url: string | URL | Request, init?: RequestInit) => {
        models.push(JSON.parse(init?.body as string).model);
        return Response.json({ choices: [{ message: { content: 'A complete result.' }, finish_reason: 'stop' }] });
    });
    for (const [handler, input] of [[about, aboutInput], [headline, headlineInput], [experience, experienceInput]] as const) {
        assert.equal((await handler(request(input))).status, 200);
    }
    assert.deepEqual(models, ['gpt-4o-mini', 'gpt-4o-mini', 'gpt-4o-mini']);
});

test('The model can be configured without a code change', async () => {
    process.env.OPENAI_RESUME_MODEL = ' gpt-4.1-mini ';
    mock.method(globalThis, 'fetch', async (_url: string | URL | Request, init?: RequestInit) => {
        assert.equal(JSON.parse(init?.body as string).model, 'gpt-4.1-mini');
        return Response.json({ choices: [{ message: { content: 'A complete summary.' }, finish_reason: 'stop' }] });
    });
    assert.equal((await about(request(aboutInput))).status, 200);
});

test('Model access failures are distinguished from invalid credentials', async () => {
    for (const [status, code, message] of [
        [403, null, 'Project `proj_example` does not have access to model `gpt-4o-mini`'],
        [404, 'model_not_found', 'The requested model is not available'],
    ] as const) {
        mock.method(globalThis, 'fetch', async () => Response.json({ error: { message, code } }, { status }));
        const response = await about(request(aboutInput));
        const body = await response.json();
        assert.equal(response.status, 503);
        assert.equal(body.code, 'AI_MODEL_ACCESS_ERROR');
        assert.ok(!JSON.stringify(body).includes('proj_example'));
    }
});

test('Headline generation normalizes numbered suggestions', async () => {
    providerResult('1. Science Student | Class of 2027\n2) Aspiring Biologist | 2027 Graduate\n• Science Club Leader | Class of 2027');
    const response = await headline(request(headlineInput));
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).suggestions, [
        'Science Student | Class of 2027', 'Aspiring Biologist | 2027 Graduate', 'Science Club Leader | Class of 2027',
    ]);
});

test('Experience generation accepts bullets, hyphens and numbered lists', async () => {
    providerResult('• Organized club meetings.\n- Led planning sessions.\n3. Coordinated activities.');
    const response = await experience(request(experienceInput));
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).bullets, ['Organized club meetings.', 'Led planning sessions.', 'Coordinated activities.']);
});

test('Missing credentials return a controlled error for every resume route', async () => {
    delete process.env.OPENAI_API_KEY;
    for (const [handler, input] of [[about, aboutInput], [headline, headlineInput], [experience, experienceInput]] as const) {
        const response = await handler(request(input));
        assert.equal(response.status, 503);
        assert.equal((await response.json()).code, 'AI_CONFIGURATION_ERROR');
    }
});

test('The production organization-access 401 is handled without exposing provider secrets', async () => {
    const raw = '401 You do not have access to the organization tied to the API key. sk-test-sensitive';
    let calls = 0;
    mock.method(globalThis, 'fetch', async () => {
        calls++;
        return Response.json({ error: { message: raw, code: 'invalid_api_key', type: 'invalid_request_error' } }, {
            status: 401, headers: { 'x-request-id': 'test-request-id' },
        });
    });
    const response = await about(request(aboutInput));
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.equal(body.code, 'AI_CONFIGURATION_ERROR');
    assert.match(body.error, /reconnect/);
    assert.equal(calls, 1);
    const output = JSON.stringify(body) + JSON.stringify((console.error as unknown as ReturnType<typeof mock.fn>).mock.calls);
    assert.ok(!output.includes('sk-test-sensitive'));
});

test('Billing errors and temporary rate limits have distinct responses', async () => {
    for (const [providerCode, expectedStatus, expectedCode] of [
        ['insufficient_quota', 503, 'AI_BILLING_ERROR'],
        ['credit_balance_exhausted', 503, 'AI_BILLING_ERROR'],
        ['rate_limit_exceeded', 429, 'AI_RATE_LIMITED'],
    ] as const) {
        mock.method(globalThis, 'fetch', async () => Response.json({ error: { message: 'Unavailable', code: providerCode } }, { status: 429 }));
        const response = await about(request(aboutInput));
        assert.equal(response.status, expectedStatus);
        assert.equal((await response.json()).code, expectedCode);
    }
});

test('Empty or truncated provider output is never returned as success', async () => {
    for (const [content, reason] of [[null, 'stop'], ['   ', 'stop'], ['An incomplete sentence', 'length']] as const) {
        providerResult(content, reason);
        const response = await about(request(aboutInput));
        assert.equal(response.status, 502);
        assert.equal((await response.json()).code, 'AI_EMPTY_RESPONSE');
    }
});

test('Missing, wrongly typed and malformed inputs return 400 before using the provider', async () => {
    for (const [handler, input] of [[about, {}], [about, null], [about, { ...aboutInput, aboutMe: 42 }],
        [headline, { ...headlineInput, interests: 'science' }], [experience, { ...experienceInput, title: ' ' }]] as const) {
        assert.equal((await handler(request(input))).status, 400);
    }
    const malformed = new NextRequest('http://localhost/api/ai/test', { method: 'POST', body: '{' });
    assert.equal((await about(malformed)).status, 400);
});

test('Provider timeouts have a specific response', async () => {
    const response = resumeAIErrorResponse(new OpenAI.APIConnectionTimeoutError(), 'about');
    assert.equal(response.status, 504);
    assert.equal((await response.json()).code, 'AI_TIMEOUT');
});

test('Credentials and optional organization/project values are trimmed on the server', async () => {
    process.env.OPENAI_API_KEY = ' test-key ';
    process.env.OPENAI_ORG_ID = ' org-test ';
    process.env.OPENAI_PROJECT_ID = ' proj_test ';
    mock.method(globalThis, 'fetch', async (_url: string | URL | Request, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        assert.equal(headers.get('Authorization'), 'Bearer test-key');
        assert.equal(headers.get('OpenAI-Organization'), 'org-test');
        assert.equal(headers.get('OpenAI-Project'), 'proj_test');
        return Response.json({ choices: [{ message: { content: 'A complete summary.' }, finish_reason: 'stop' }] });
    });
    assert.equal((await about(request(aboutInput))).status, 200);
});

test('Client displays safe server errors and handles non-JSON hosting errors', async () => {
    mock.method(globalThis, 'fetch', async () => Response.json({ error: 'The site needs to reconnect its AI service.' }, { status: 503 }));
    await assert.rejects(requestResumeAI('/api/ai/enhance-about', aboutInput), /reconnect/);
    mock.method(globalThis, 'fetch', async () => new Response('<html>Gateway timeout</html>', { status: 504 }));
    await assert.rejects(requestResumeAI('/api/ai/enhance-about', aboutInput), /temporarily unavailable/);
});

test('Client accepts valid results and rejects empty results before replacing existing text', async () => {
    mock.method(globalThis, 'fetch', async () => Response.json({ enhancedText: 'New summary.' }));
    const data = await requestResumeAI('/api/ai/enhance-about', aboutInput);
    assert.equal(requireAIText(data.enhancedText), 'New summary.');
    assert.deepEqual(requireAILines(['One', 'Two']), ['One', 'Two']);
    assert.throws(() => requireAIText('   '), /existing text has not been changed/);
    assert.throws(() => requireAILines([]), /existing text has not been changed/);
    assert.throws(() => requireAILines(['Valid', null]), /existing text has not been changed/);
});
