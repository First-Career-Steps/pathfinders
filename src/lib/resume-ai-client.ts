// All builder steps use the same bounded request and safe response parsing.
export async function requestResumeAI(
    endpoint: string,
    input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55_000);
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
            signal: controller.signal,
        });
        // Hosting errors can be HTML rather than JSON.
        const data = await response.json().catch(() => null);
        if (!response.ok) {
            throw new Error(typeof data?.error === 'string'
                ? data.error
                : 'AI writing is temporarily unavailable. Please try again shortly.');
        }
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error('AI writing did not return a usable result. Please try again.');
        }
        return data;
    } catch (error) {
        if (controller.signal.aborted) {
            throw new Error('AI writing took too long to respond. Please try again. Your existing text has not been changed.');
        }
        if (error instanceof TypeError) {
            throw new Error('Could not connect to AI writing. Check your connection and try again.');
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

export function requireAIText(value: unknown): string {
    if (typeof value !== 'string' || !value.trim()) {
        throw new Error('AI writing did not return any text. Please try again. Your existing text has not been changed.');
    }
    return value.trim();
}

export function requireAILines(value: unknown): string[] {
    if (!Array.isArray(value) || value.length === 0) {
        throw new Error('AI writing did not return any suggestions. Please try again. Your existing text has not been changed.');
    }
    return value.map(requireAIText);
}
