export const WORKSHOP = '/workshops/resume-bullet';
export const WORKSHOP_KEY = 'resume_bullet_pilot_v1';
export const WORKSHOP_NAME = 'Write a resume bullet you can defend';
export const workshopLogin = '/login?redirect=' + encodeURIComponent(WORKSHOP);
export const workshopSignup = '/signup?product=resume-workshop';

export function hasWorkshop(metadata?: Record<string, unknown>) {
    return typeof metadata?.[WORKSHOP_KEY] === 'string' &&
        String(metadata[WORKSHOP_KEY]).startsWith('cs_');
}

export type WorkshopDraft = { facts: string; bullet: string; answer: string };
export const emptyDraft: WorkshopDraft = { facts: '', bullet: '', answer: '' };
export function draftKey(userId: string) { return 'fcs.resume-bullet.' + userId; }

// These checks point learners to discrepancies they can verify themselves.
export function checkWriting({ facts, bullet, answer }: WorkshopDraft) {
    const numbers = (text: string) => text.toLowerCase().match(/\d+(?:[,.]\d+)*(?:%|\b)/g) || [];
    const recorded = new Set(numbers(facts));
    const extra = [...new Set(numbers(bullet).filter(n => !recorded.has(n)))];
    const concerns: string[] = [];
    if (extra.length) concerns.push('Check these numbers against your notes: ' + extra.join(', ') + '. Add the supporting fact or remove the number.');
    if (/\b(led|managed|directed|supervised)\b/i.test(bullet) &&
        !/\b(led|managed|directed|supervised|in charge|responsible for|assigned|oversaw)\b/i.test(facts)) {
        concerns.push('Your bullet claims leadership. Add what you personally directed to your notes, or choose a verb that fits your part.');
    }
    if (!/\bI\b/i.test(answer)) concerns.push('Practice the answer in the first person. What did you personally do?');
    return concerns;
}
