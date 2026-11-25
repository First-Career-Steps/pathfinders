import first from "./content/lead-yourself.json";
import people from "./content/see-and-develop-people.json";
import stage from "./content/set-the-stage.json";
import techniques from "./content/everyday-techniques.json";
import overhaul from "./content/culture-overhaul.json";
import type { Question, Slide } from "./lessons";
import type { Walkthrough } from "./media";
import type { WorksheetField } from "./worksheets";

type BookCourse = {
  slides: Slide[];
  mid: Question[];
  final: Question[];
  walkthroughs: Walkthrough[];
  fields: WorksheetField[];
};
function bookCourse(
  source:
    | typeof first
    | typeof people
    | typeof stage
    | typeof techniques
    | typeof overhaul,
): BookCourse {
  return {
    ...source,
    slides: source.slides.map((slide) => {
      const studentSlide: Slide & { notes?: string } = { ...slide };
      delete studentSlide.notes;
      return studentSlide;
    }),
    walkthroughs: source.walkthroughs.map((w) => ({
      ...w,
      steps: w.steps.map(([label, text]): [string, string] => [label, text]),
    })),
  };
}
export const bookClasses: Record<string, BookCourse> = {
  "lead-yourself": bookCourse(first),
  "see-and-develop-people": bookCourse(people),
  "set-the-stage": bookCourse(stage),
  "everyday-techniques": bookCourse(techniques),
  "culture-overhaul": bookCourse(overhaul),
};

// The original 42 slides used s01–s42. Keep old bookmarks on the corresponding
// topic when the rebuilt course is opened, without rewriting any learner record.
const firstEditionTopics = [
  1, 2, 3, 5, 7, 6, 9, 11, 10, 12, 12, 13, 32, 30, 31, 16, 22, 23, 22, 24, 14,
  33, 15, 29, 33, 32, 4, 34, 35, 36, 37, 49, 39, 41, 42, 43, 44, 45, 46, 47, 48,
  50,
];
export function currentSlideKey(slug: string, key: string) {
  if (slug === "lead-yourself" && /^s\d{2}$/.test(key)) {
    const topic = firstEditionTopics[Number(key.slice(1)) - 1];
    if (topic) return first.slides[topic - 1].key;
  }
  return key;
}
