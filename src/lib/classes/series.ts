import canonical from "./content/requirements-prompts.json";
import basics from "./content/ai-basics.json";
import brainstorming from "./content/ai-brainstorming.json";
import multiple from "./content/ai-multiple.json";
import building from "./content/ai-building.json";
import type { Question, Slide } from "./lessons";
import type { Walkthrough } from "./media";
import type { PromptSheet } from "./prompt-sheet";

type SeriesContent = {
  slides: Slide[];
  mid: Question[];
  final: Question[];
  walkthrough: Walkthrough;
  materials: PromptSheet;
};
function course(
  source:
    typeof basics | typeof brainstorming | typeof multiple | typeof building,
): SeriesContent {
  const steps = source.walkthrough.steps.map(
    ([heading, text]): [string, string] => [heading, text],
  );
  const prompts = source.materials.prompts.map((p) => {
    if ("canonical" in p) {
      if (p.canonical !== "meta" && p.canonical !== "requirements")
        throw new Error("Unknown requirements prompt");
      return { ...p, text: canonical[p.canonical] };
    }
    return p;
  });
  return {
    ...source,
    materials: { ...source.materials, prompts },
    walkthrough: { ...source.walkthrough, steps },
  };
}
export const series: Record<string, SeriesContent> = {
  "ai-basics": course(basics),
  "ai-brainstorming": course(brainstorming),
  "ai-multiple": course(multiple),
  "ai-building": course(building),
};
