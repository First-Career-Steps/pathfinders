export type ClassTransfer = {
  type: "skill" | "course" | "bullet";
  text: string;
  title: string;
  month?: string;
};
export const transferKey = (userId: string) => "fcs.class-transfer." + userId;
export function takeClassDraft(
  userId: string,
  step: 4 | 5,
): ClassTransfer | null {
  if (new URLSearchParams(location.search).get("from") !== "class") return null;
  try {
    const key = transferKey(userId);
    const draft: ClassTransfer = JSON.parse(
      sessionStorage.getItem(key) || "null",
    );
    if (
      !draft ||
      !["skill", "course", "bullet"].includes(draft.type) ||
      (draft.type === "skill") !== (step === 5) ||
      typeof draft.text !== "string" ||
      !draft.text.trim() ||
      draft.text.length > 2400 ||
      typeof draft.title !== "string"
    )
      return null;
    sessionStorage.removeItem(key);
    history.replaceState(history.state, "", "/builder/step-" + step);
    return draft;
  } catch {
    return null;
  }
}
