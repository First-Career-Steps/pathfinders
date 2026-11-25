import type { Walkthrough } from "./media";
import { series } from "./series";
import { bookClasses } from "./leadership";
import ai from "./content/ai-honestly.json";
export type Slide = {
  key: string;
  title: string;
  body: string;
  aria: string;
  kind: string;
  field?: string;
  fieldLabel?: string;
  midIndex?: number;
  chapter?: string;
  quote?: string;
  source?: string;
  app?: boolean;
  weekGrid?: boolean;
  worksheetKeys?: string[];
  walkthroughIndex?: number;
  promptIds?: number[];
  examples?: { label: string; detail: string; text: string }[];
};
export type Question = {
  prompt: string;
  options: string[];
  answer: number;
  why: string;
};
export type Progress = {
  last_slide_key: string;
  completed_at: string | null;
  end_quiz_score: number | null;
  worksheet_completed_at: string | null;
};
export const slidesFor = (slug: string): Slide[] => {
  if (series[slug]) return series[slug].slides;
  if (bookClasses[slug]) return bookClasses[slug].slides;
  const source = slug === "ai-honestly" ? ai : [];
  // Editorial notes and unpublished excerpts stay out of the student's page payload.
  return source.map(({ key, title, body, aria, kind, ...more }) => ({
    key,
    title,
    body,
    aria,
    kind,
    field: "field" in more ? more.field : undefined,
    examples: "examples" in more ? more.examples : undefined,
  }));
};
function q(
  prompt: string,
  options: string[],
  answer: number,
  why: string,
): Question {
  return { prompt, options, answer, why };
}
const honest = {
  mid: [
    q(
      "The teacher permits practice help but requires your own written solution. Which use fits?",
      [
        "Turn in the AI solution after changing two words.",
        "Ask for a practice question, then solve the assigned problem yourself.",
        "Ask it to make an answer sound like you.",
      ],
      1,
      "A practice question supports learning while the submitted reasoning remains yours.",
    ),
    q(
      "Your notes say you stocked shelves. Which addition needs to come out?",
      [
        "Restocked shelves.",
        "Put products back on shelves.",
        "Managed a team of five stockers.",
      ],
      2,
      "The notes do not support a team or a manager role.",
    ),
    q(
      "What should you be able to do with each resume bullet?",
      [
        "Explain what you did with a real example.",
        "Repeat the suggested wording exactly.",
        "Name which AI model drafted it.",
      ],
      0,
      "An interviewer can ask about the action, your part and the result.",
    ),
  ],
  final: [
    q(
      "An assignment permits AI quizzes and requires an independently written reflection. What fits?",
      [
        "Submit an AI reflection with a few edits.",
        "Practice with a quiz, then write the reflection yourself.",
        "Let AI write the reflection and hide the chat.",
      ],
      1,
      "The permitted practice does not replace the independently written reflection.",
    ),
    q(
      "A draft says you cut wait times by 30%. You helped at pickup but never measured wait times. What do you keep?",
      [
        "The 30%, since it sounds reasonable.",
        "A smaller invented number.",
        "The pickup duty you actually performed, without a percentage.",
      ],
      2,
      "A measured result needs evidence. The real work can stand on its own.",
    ),
    q(
      "You sorted donations but did not run the drive. Which line would you be able to explain in an interview?",
      [
        "Sorted and labeled donated books for pickup.",
        "Directed fundraising strategy.",
        "Supervised all volunteers.",
      ],
      0,
      "The first line matches the work described and has specific actions to discuss.",
    ),
    q(
      "A teacher permits AI outlining and asks for a note about how you used it. What do you submit?",
      [
        "The paper without a note.",
        "Your own paper and an accurate note describing the outlining help.",
        "A note saying you used only a dictionary.",
      ],
      1,
      "Follow the teacher’s disclosure instruction and describe the help truthfully.",
    ),
    q(
      "A 15-year-old wants to practice a professional headline. What is an appropriate choice?",
      [
        "Open LinkedIn using a different birthday.",
        "Use a friend’s LinkedIn account.",
        "Draft it in the builder or a document. LinkedIn’s minimum is 16 and can be higher locally.",
      ],
      2,
      "The student can practice the skill now without opening a LinkedIn account.",
    ),
  ],
};
export const quizzesFor = (slug: string) =>
  series[slug]
    ? { mid: series[slug].mid, final: series[slug].final }
    : bookClasses[slug]
      ? { mid: bookClasses[slug].mid, final: bookClasses[slug].final }
      : slug === "ai-honestly"
        ? honest
        : { mid: [], final: [] };
export function grade(questions: Question[], answers: unknown) {
  if (
    !Array.isArray(answers) ||
    answers.length !== questions.length ||
    !answers.every(
      (a, i) =>
        Number.isInteger(a) && a >= 0 && a < questions[i].options.length,
    )
  )
    return null;
  const review = questions.map((q, i) => ({
    correct: q.answer === answers[i],
    answer: q.options[q.answer],
    why: q.why,
  }));
  return { score: review.filter((r) => r.correct).length, review };
}
export const walkthroughs: Record<string, Walkthrough> = {
  ...Object.fromEntries(
    Object.entries(series).map(([slug, value]) => [slug, value.walkthrough]),
  ),
  ...Object.fromEntries(
    Object.entries(bookClasses).map(([slug, course]) => [
      slug,
      course.walkthroughs[0],
    ]),
  ),
  "ai-honestly": {
    minutes: "10–12",
    steps: [
      [
        "Start with a source note",
        "Use this fictional experience: I sorted donated books by age group, labeled boxes and helped families find the pickup table. No counts or leadership title were recorded.",
      ],
      [
        "Open Experience in the builder",
        "At step 4, choose Add Experience. Enter the real role and organization only for your own work. In this example, use Volunteer and a fictional book drive. Enter the source note in the description.",
      ],
      [
        "Inspect a suggestion",
        "The builder can suggest experience wording. Suppose a draft says “Led a team of ten and streamlined distribution.” Underline “led,” “ten” and “streamlined.” The note supports none of those claims.",
      ],
      [
        "Make the edit yourself",
        "Select the description and replace it with “Sorted donated books by age group, labeled pickup boxes and directed families to the pickup table.” Compare each part with the source.",
      ],
      [
        "Decide whether to keep it",
        "Read it aloud. Could you explain how you sorted the books and what a label said? Save only if the work is yours. For the sample, keep your edit on the worksheet.",
      ],
    ],
  },
};
