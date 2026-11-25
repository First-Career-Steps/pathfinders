import { createAdminClient } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase-server";
import type { Progress } from "./lessons";

export async function studentSession() {
  const db = await createServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  return { db, user };
}
export async function readProgress(
  db: Awaited<ReturnType<typeof createServerClient>>,
  userId: string,
  slug: string,
) {
  const { data, error } = await db
    .from("student_class_progress")
    .select("last_slide_key,completed_at,end_quiz_score,worksheet_completed_at")
    .eq("user_id", userId)
    .eq("course_slug", slug)
    .maybeSingle();
  if (error) throw new Error("Class progress is temporarily unavailable.");
  return data as Progress | null;
}
export async function saveEvent(
  userId: string,
  course: string,
  event: "start" | "slide" | "worksheet" | "quiz",
  slideKey?: string,
  score?: number,
) {
  const { data, error } = await createAdminClient().rpc(
    "fcs_save_class_progress",
    {
      learner: userId,
      course,
      event,
      slide_key: slideKey ?? null,
      score: score ?? null,
    },
  );
  if (error || !data)
    throw new Error("Could not save your progress. Try again.");
  const row = Array.isArray(data) ? data[0] : data;
  return {
    last_slide_key: row.last_slide_key,
    completed_at: row.completed_at,
    end_quiz_score: row.end_quiz_score,
    worksheet_completed_at: row.worksheet_completed_at,
  } as Progress;
}
