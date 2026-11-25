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
  bookPart?: string;
  worksheet: string;
  worksheetFields: string[];
  skills: string[];
}
export const classes: ClassInfo[] = [
  {
    slug: "lead-yourself",
    title: "Lead Yourself First",
    track: "Leadership",
    bookPart: "Part I · You · Chapters 1–9",
    published: true,
    minutes: 50,
    count: 50,
    promise: "Set a standard people can count on, even on a busy day.",
    outcome:
      "Write two or three standards, practice owning a mistake and plan a consistent week and help someone else learn a skill.",
    audience:
      "Students in clubs, sports, group projects, volunteering or a first job. No leadership title needed.",
    worksheet: "My Standards and First Week Plan",
    worksheetFields: [
      "Two or three standards",
      "Ownership rewrite",
      "Seven-day consistency grid",
      "Three-question after-action and one way I’ll help a teammate",
    ],
    skills: [
      "Planning and follow-through",
      "After-action review",
      "Teaching a teammate a skill",
    ],
  },
  {
    slug: "see-and-develop-people",
    title: "See and Develop People",
    track: "Leadership",
    bookPart: "Part II · Your People · Chapters 10–12",
    published: true,
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
    skills: ["Giving specific feedback", "Planning a development check-in"],
  },
  {
    slug: "set-the-stage",
    title: "Set the Stage: The Environment You Create",
    track: "Leadership",
    bookPart: "Part III · Environment · Chapters 13–16",
    published: true,
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
    skills: [
      "Auditing a shared workspace",
      "Giving clear directions under pressure",
      "Planning and reviewing a process change",
    ],
  },
  {
    slug: "everyday-techniques",
    title: "Everyday Leadership Techniques",
    track: "Leadership",
    bookPart: "Part IV · Techniques of Leadership · Chapters 17–20",
    published: true,
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
    skills: [
      "Planning a team huddle",
      "Giving specific feedback",
      "Following up on agreements",
    ],
  },
  {
    slug: "culture-overhaul",
    title: "When the Team Is Off Track",
    track: "Leadership",
    bookPart: "Part V · Culture Overhaul · Chapters 21–23",
    published: true,
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
    skills: [
      "Diagnosing a team process",
      "Planning a team handoff",
      "Writing a 30-day follow-up plan",
    ],
  },
  {
    slug: "ai-basics",
    title: "Basics of AI",
    track: "AI",
    published: true,
    minutes: 45,
    count: 44,
    promise: "Know the tool before you lean on it.",
    outcome:
      "Write a five-part prompt, recognize common AI errors and verify a claim while keeping private information out.",
    audience:
      "Anyone learning how a chat-based AI works, including students under 18 and adults.",
    preparation: "No prerequisites. An AI account is optional.",
    worksheet: "Basics of AI — Prompt Cheat Sheet",
    worksheetFields: [
      "My prompt this week",
      "What I verified, where I checked and what remains uncertain",
    ],
    skills: ["Writing clear prompts", "Verifying AI-generated claims"],
  },
  {
    slug: "ai-brainstorming",
    title: "Brainstorming with AI",
    track: "AI",
    published: true,
    minutes: 45,
    count: 42,
    promise: "Generate more options, then make a choice you can explain.",
    outcome:
      "Write a brief, generate and critique options, and rewrite a one-paragraph plan in your own words.",
    audience:
      "Learners planning a club activity, a service event, an allowed school project or a personal project.",
    preparation:
      "Basics of AI is recommended. Check facts, protect private details and follow school rules and each tool’s current age terms.",
    worksheet: "Brainstorming with AI — Prompt Cheat Sheet",
    worksheetFields: [
      "My brief",
      "My shortlist of three",
      "My plan in my own words",
      "What I still need to verify or get approved",
    ],
    skills: ["Writing project briefs", "Comparing options against constraints"],
  },
  {
    slug: "ai-multiple",
    title: "Leveraging Multiple AIs",
    track: "AI",
    published: false,
    minutes: 50,
    count: 46,
    promise:
      "Work an idea out in ChatGPT, then brief Grok with a tight prompt.",
    outcome:
      "Freeze decisions, write a handoff prompt and review a second answer for inventions, uncertainty and facts to verify.",
    audience:
      "Learners ready to move a project from a messy conversation into a clear brief. No programming experience needed.",
    preparation:
      "Basics of AI and Brainstorming with AI are helpful. Follow school and age rules, protect private information and verify claims in both tools. A fresh pass in one allowed tool also works.",
    worksheet: "Leveraging Multiple AIs — Handoff Cheat Sheet",
    worksheetFields: [
      "My frozen decision list",
      "My tight Grok prompt",
      "Kept / cut / still verifying",
    ],
    skills: ["Writing handoff prompts", "Reviewing project requirements"],
  },
  {
    slug: "ai-building",
    title: "Building with AI",
    track: "AI",
    published: false,
    minutes: 55,
    count: 48,
    promise: "Write a spec first, then build in small steps.",
    outcome:
      "Turn a small idea into seven sections of requirements, write a testable user story and plan a first build step.",
    audience:
      "First-time builders planning a small tool, checklist or project board, including learners who have never written code.",
    preparation:
      "Leveraging Multiple AIs is strongly recommended. Explore in ChatGPT, freeze decisions, write a prompt for Grok and verify its output. One permitted tool works too. Keep data private and follow school and account rules.",
    worksheet: "Building with AI — Prompt Cheat Sheet",
    worksheetFields: [
      "My [PRODUCT IDEA] paragraph",
      "Three build steps in my own words",
      "What I still must verify or decide",
    ],
    skills: ["Writing acceptance criteria", "Planning testable build steps"],
  },
];
export const retiredClasses: Record<string, string> = {
  "ai-honestly": "Use AI Honestly — School, Resumes, and Job Search",
  "ai-prompting": "Prompting That Gets Useful Answers",
  "ai-spot-errors": "Catch Bad AI Answers",
  "ai-privacy-safety": "AI Privacy and Safety for Students",
};
export const retiredTitle = (slug: string) =>
  Object.hasOwn(retiredClasses, slug) ? retiredClasses[slug] : undefined;
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
