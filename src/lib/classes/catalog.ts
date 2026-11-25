export interface ClassInfo {
  slug: string;
  title: string;
  track: "Leadership" | "AI";
  published: boolean;
  minutes: number;
  count: number;
  promise: string;
  outcome: string;
  audience: string;
  preparation?: string;
  worksheet: string;
  worksheetFields: string[];
  skills: string[];
}
export const classes: ClassInfo[] = [
  {
    slug: "lead-yourself",
    title: "Lead Yourself First",
    track: "Leadership",
    published: true,
    minutes: 45,
    count: 42,
    promise: "Set a standard people can count on, even on a busy day.",
    outcome:
      "Write two or three standards, practice owning a mistake and make a seven-day consistency plan.",
    audience:
      "Students in clubs, sports, group projects, volunteering or a first job. No leadership title needed.",
    worksheet: "My Standards and First Week Plan",
    worksheetFields: [
      "Two or three standards",
      "Ownership rewrite",
      "Seven-day consistency grid",
      "Five-part after-action",
    ],
    skills: [
      "Planning and follow-through",
      "After-action review",
      "Setting team standards",
    ],
  },
  {
    slug: "see-and-develop-people",
    title: "See and Develop People",
    track: "Leadership",
    published: false,
    minutes: 45,
    count: 40,
    promise: "Help a teammate practice a skill they want to learn.",
    outcome:
      "Use observations, a goal question and one practical next step to plan a development conversation.",
    audience: "Students who help new teammates, volunteers or coworkers.",
    worksheet: "One Person I Will Help This Month",
    worksheetFields: [
      "Humility, effort, coachability",
      "Goal questions",
      "Stated motive",
      "My next action",
    ],
    skills: [],
  },
  {
    slug: "set-the-stage",
    title: "Set the Stage: The Environment You Create",
    track: "Leadership",
    published: false,
    minutes: 40,
    count: 38,
    promise: "See the cues a newcomer picks up in a room, shift or group chat.",
    outcome:
      "Audit the environment and change one tolerated behavior and one language habit.",
    audience: "Students sharing a workspace, practice, meeting or group chat.",
    worksheet: "Environment Audit and One-Week Change",
    worksheetFields: [
      "Ten-minute newcomer list",
      "Four environment scores",
      "Tolerated behavior",
      "Language habit",
    ],
    skills: [],
  },
  {
    slug: "everyday-techniques",
    title: "Everyday Leadership Techniques",
    track: "Leadership",
    published: false,
    minutes: 50,
    count: 44,
    promise: "Run a huddle and follow up privately when a standard slips.",
    outcome:
      "Draft a huddle, a specific affirmation, a five-step conversation and a follow-up note.",
    audience: "Students leading part of a practice, event, project or shift.",
    preparation:
      "Lead Yourself First and See and Develop People are helpful background.",
    worksheet: "My Techniques Card",
    worksheetFields: [
      "Four-part huddle",
      "80/20 observation log",
      "Five-step conversation",
      "Follow-up note",
    ],
    skills: [],
  },
  {
    slug: "culture-overhaul",
    title: "When the Team Is Off Track",
    track: "Leadership",
    published: false,
    minutes: 50,
    count: 40,
    promise:
      "Find out why a routine keeps breaking and give the team a month to rebuild it.",
    outcome:
      "Identify a system problem, a Culture Carrier and one routine to repeat for 30 days.",
    audience:
      "Club officers, captains, shift leads and project teammates working through a recurring problem.",
    preparation: "The first four leadership classes offer helpful background.",
    worksheet: "30-Day Overhaul Plan",
    worksheetFields: [
      "System problem",
      "Culture Carrier role",
      "Four-week repetition plan",
      "When to involve an adult or manager",
    ],
    skills: [],
  },
  {
    slug: "ai-honestly",
    title: "Use AI Honestly — School, Resumes, and Job Search",
    track: "AI",
    published: true,
    minutes: 45,
    count: 40,
    promise:
      "Turn rough notes into a resume bullet you can explain in an interview.",
    outcome:
      "Recognize when AI can coach, check a draft against the facts and edit it into your own voice.",
    audience:
      "High school and college students trying AI for school, a resume or a first job application.",
    worksheet: "Honesty Checklist",
    worksheetFields: [
      "School, resume and job-search checks",
      "Facts about my work",
      "Before and after bullet",
    ],
    skills: [
      "Checking AI-generated text",
      "Resume editing",
      "Interview preparation",
    ],
  },
  {
    slug: "ai-prompting",
    title: "Prompting That Gets Useful Answers",
    track: "AI",
    published: false,
    minutes: 40,
    count: 36,
    promise: "Turn a vague request into a prompt grounded in real facts.",
    outcome:
      "Use role, facts, audience, constraints and uncertainty to improve one earned resume bullet.",
    audience: "Students who get vague or inflated AI drafts.",
    worksheet: "My Prompt Patterns",
    worksheetFields: [
      "Five-part resume template",
      "Five-part school template",
      "Five-part interview template",
    ],
    skills: [],
  },
  {
    slug: "ai-spot-errors",
    title: "Catch Bad AI Answers",
    track: "AI",
    published: false,
    minutes: 40,
    count: 36,
    promise:
      "Find invented details before they reach a teacher or hiring manager.",
    outcome:
      "Run a six-point check and repair an unsupported claim in a resume or school draft.",
    audience: "Students who use AI to help draft or edit.",
    worksheet: "6-Point Check",
    worksheetFields: [
      "Six verification questions",
      "Source facts",
      "My corrected draft",
    ],
    skills: [],
  },
  {
    slug: "ai-privacy-safety",
    title: "AI Privacy and Safety for Students",
    track: "AI",
    published: false,
    minutes: 35,
    count: 34,
    promise: "Get useful help while sharing less personal information.",
    outcome:
      "Sort prompt inputs and rewrite an oversharing request using only the facts it needs.",
    audience:
      "Students, including ages 13–17, and parents learning alongside them.",
    worksheet: "What I Will and Won’t Share",
    worksheetFields: [
      "My sharing rules",
      "Details I will remove",
      "One rewritten prompt",
    ],
    skills: [],
  },
];
export const classBySlug = (slug: string) =>
  classes.find((item) => item.slug === slug);
export const paidClassesEnabled = () =>
  process.env.CLASSES_PAID_ENABLED === "true";
export const classOpen = (enrolled: boolean) =>
  !paidClassesEnabled() || enrolled;
export function classDestination(value: string | null) {
  return value &&
    /^\/classes\/[a-z0-9-]+\/learn$/.test(value) &&
    classBySlug(value.split("/")[2])?.published
    ? value
    : null;
}
