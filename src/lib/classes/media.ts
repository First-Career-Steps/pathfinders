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
  "lead-yourself": [
    "0–2 minutes. Put a blank after-action sheet beside the agenda. Here is a fictional missed handoff. I changed the meeting room in the chat. A volunteer who checked the agenda went to the old room. Which document would you have trusted? Pause and give your answer.",
    "2–4 minutes. Draw two columns. In the first, write what happened. In the second, write what I can still do. I can change the agenda, post the corrected link and ask someone to check it. Read that as a message a teammate could act on. Give yourself one minute to try your own.",
    "4–7 minutes. Fill in the five review lines. The greeter noticed the mix-up and redirected people. Our system put the same decision in two places. Tomorrow I will keep the meeting room on one agenda and link to it from chat. I will thank the greeter for checking. I will put the sign where a person enters. Pause after each line and write your equivalent.",
    "7–10 minutes. Look at Thursday. The check worked on Monday, but I skipped it when we were rushed. Write the cue before the action: before I post a reminder, I open the agenda and check the room. Mark three opportunities on the grid. What will count as held? Reading the agenda and checking the room before sending the reminder. Now choose one cue you will actually encounter this week.",
  ],
  "ai-honestly": [
    "0–2 minutes. In the experience step, read this fictional volunteer note aloud. I sorted books by age group, labeled boxes and showed families the pickup table. Write down the three verbs. Notice what we do not know: attendance, time saved and how many people worked there.",
    "2–4 minutes. Start an experience draft for the demonstration. Use a fictional organization and role. Place the notes in the description and ask for wording help. On your worksheet you can follow the same steps using the sample suggestion shown here.",
    "4–7 minutes. Read the sample suggestion slowly. It says I led a team of ten. Where did that number come from? Check the notes. Who says I supervised anyone? Cross out both claims. Streamlined distribution sounds impressive, but the notes never say the process got faster. Pause to mark the exact words you would remove.",
    "7–9 minutes. Replace the draft with your own sentence. Try starting with sorted and ending with what the labels helped visitors find. Read it to yourself. Compare each phrase with the original note. Would you describe it that way to someone who asked what you did last Saturday?",
    "9–12 minutes. Try the interview question: how did you decide which box a book belonged in? Your answer has to come from your experience. Keep the sample on the worksheet and save a resume entry only for work you actually did. Pause to finish one before-and-after bullet of your own.",
  ],
};
