import OpenAI from 'openai';
import { NextResponse } from 'next/server';

class AIConfigurationError extends Error {}
class AIResponseError extends Error {}

// Use a low-cost text model compatible with this Chat Completions request.
// An owner can select another compatible, enabled model without editing code.
export function getResumeAIModel() {
    return process.env.OPENAI_RESUME_MODEL?.trim() || 'gpt-4o-mini';
}

// Create the client inside the request so missing credentials return a controlled
// response instead of crashing the route during module initialization.
export async function generateResumeText(options: {
    system: string;
    prompt: string;
    maxTokens: number;
}) {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) throw new AIConfigurationError('OPENAI_API_KEY is missing');

    const openai = new OpenAI({
        apiKey,
        organization: process.env.OPENAI_ORG_ID?.trim() || null,
        project: process.env.OPENAI_PROJECT_ID?.trim() || null,
        timeout: 30_000,
        // A retry cannot repair invalid credentials or exhausted billing credits.
        maxRetries: 0,
    });

    const completion = await openai.chat.completions.create({
        model: getResumeAIModel(),
        messages: [
            { role: 'system', content: options.system },
            { role: 'user', content: options.prompt },
        ],
        temperature: 0.7,
        max_tokens: options.maxTokens,
    });

    const choice = completion.choices[0];
    const text = choice?.message?.content?.trim();
    if (!text || choice.message.refusal || choice.finish_reason !== 'stop') {
        throw new AIResponseError('No complete usable text returned');
    }
    return text;
}

export function parseResumeLines(text: string, limit: number) {
    return text.split('\n')
        .map(line => line.trim().replace(/^(?:[•\-*]|\d+[.)])\s*/, '').trim())
        .filter(Boolean)
        .slice(0, limit);
}

export function resumeAIErrorResponse(error: unknown, section: string) {
    const apiError = error instanceof OpenAI.APIError ? error : undefined;
    let status = 502;
    let code = 'AI_UNAVAILABLE';
    let message = 'AI writing is temporarily unavailable. Please try again shortly. You can still edit your resume.';

    const modelAccessError = apiError && (
        ['model_not_found', 'model_not_available', 'model_access_denied'].includes(apiError.code || '') ||
        (apiError.status === 403 && /does not have access to model/i.test(apiError.message))
    );

    if (modelAccessError) {
        status = 503;
        code = 'AI_MODEL_ACCESS_ERROR';
        message = 'AI writing is unavailable while the site updates its AI service. You can still write or edit your resume.';
    } else if (error instanceof AIConfigurationError || apiError?.status === 401 || apiError?.status === 403) {
        status = 503;
        code = 'AI_CONFIGURATION_ERROR';
        message = 'AI writing is unavailable because the site needs to reconnect its AI service. You can still write or edit your resume.';
    } else if (apiError?.status === 429) {
        const billingCodes = [
            'insufficient_quota', 'billing_hard_limit_reached', 'credit_balance_exhausted',
            'organization_spend_limit_exceeded', 'project_spend_limit_exceeded',
            'organization_usage_limit_exceeded',
        ];
        if (billingCodes.includes(apiError.code || '') || apiError.type === 'insufficient_quota') {
            status = 503;
            code = 'AI_BILLING_ERROR';
            message = 'AI writing is unavailable while the site restores its AI service. You can still write or edit your resume.';
        } else {
            status = 429;
            code = 'AI_RATE_LIMITED';
            message = 'AI writing is busy right now. Please wait a moment and try again.';
        }
    } else if (error instanceof OpenAI.APIConnectionTimeoutError) {
        status = 504;
        code = 'AI_TIMEOUT';
        message = 'AI writing took too long to respond. Please try again. Your existing text has not been changed.';
    } else if (error instanceof AIResponseError) {
        code = 'AI_EMPTY_RESPONSE';
        message = 'AI writing did not return a complete result. Please try again. Your existing text has not been changed.';
    } else if (error instanceof SyntaxError) {
        status = 400;
        code = 'INVALID_REQUEST';
        message = 'Please check your entries and try again.';
    }

    // Do not log the provider's raw message: it may contain a partial API key.
    // Never include resume text or other personal data in these diagnostics.
    console.error('[resume-ai]', {
        section, code, model: getResumeAIModel(), providerStatus: apiError?.status,
        providerCode: apiError?.code, requestId: apiError?.requestID,
    });
    return NextResponse.json({ error: message, code }, { status });
}
