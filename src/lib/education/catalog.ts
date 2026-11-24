export const courseFiles = {
    ai: 'ai',
    'ai/basics': 'ai-basics',
    'ai/prompting': 'ai-prompting',
    'ai/brainstorming': 'ai-brainstorming',
    'ai/multiple-ais': 'ai-multiple-ais',
    'ai/building': 'ai-building',
    'ai/prompts': 'ai-prompts',
    leadership: 'leadership',
    'leadership/restaurant': 'restaurant',
    'leadership/team-training': 'team-training',
    'leadership/cpa': 'cpa',
    'leadership/cpa/leading-the-close': 'cpa-leading-the-close',
    'leadership/cpa/coaching-accounting-teams': 'cpa-coaching-accounting-teams',
    'leadership/cpa/changing-finance-operations': 'cpa-changing-finance-operations',
    'leadership/cpa/fieldbook': 'accounting-player',
} as const;

export type Course = keyof typeof courseFiles;

export function isCourse(value: string): value is Course {
    return Object.hasOwn(courseFiles, value);
}

export function learnerCourse(path: string | null): Course {
    const course = path?.replace(/^\/learn\//, '') || '';
    return isCourse(course) && course.startsWith('leadership') ? course : 'leadership';
}

export function fileFor(course: Course, signed: boolean) {
    if (!signed) return courseFiles[course];
    if (course.startsWith('leadership/cpa/')) return 'accounting-player';
    if (['leadership', 'leadership/cpa', 'leadership/restaurant'].includes(course)) return courseFiles[course] + '-signed';
    return courseFiles[course];
}
