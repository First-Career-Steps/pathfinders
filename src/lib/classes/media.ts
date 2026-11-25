export interface Recording {
  src: string;
  captions: string;
  transcript: string;
}
export interface Walkthrough {
  minutes: string;
  steps: [string, string][];
  recording?: Recording;
  narration?: string[];
}
export const narration: Record<string, string[]> = {
  "ai-honestly": [
    "0–2 minutes. In the experience step, read this fictional volunteer note aloud. I sorted books by age group, labeled boxes and showed families the pickup table. Write down the three verbs. Notice what we do not know: attendance, time saved and how many people worked there.",
    "2–4 minutes. Start an experience draft for the demonstration. Use a fictional organization and role. Place the notes in the description and ask for wording help. On your worksheet you can follow the same steps using the sample suggestion shown here.",
    "4–7 minutes. Read the sample suggestion slowly. It says I led a team of ten. Where did that number come from? Check the notes. Who says I supervised anyone? Cross out both claims. Streamlined distribution sounds impressive, but the notes never say the process got faster. Pause to mark the exact words you would remove.",
    "7–9 minutes. Replace the draft with your own sentence. Try starting with sorted and ending with what the labels helped visitors find. Read it to yourself. Compare each phrase with the original note. Would you describe it that way to someone who asked what you did last Saturday?",
    "9–12 minutes. Try the interview question: how did you decide which box a book belonged in? Your answer has to come from your experience. Keep the sample on the worksheet and save a resume entry only for work you actually did. Pause to finish one before-and-after bullet of your own.",
  ],
};
