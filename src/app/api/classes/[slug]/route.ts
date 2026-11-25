import { sameOriginWrite } from "@/lib/student-privacy";
import { classBySlug, classOpen } from "@/lib/classes/catalog";
import { grade, quizzesFor, slidesFor } from "@/lib/classes/lessons";
import {
  readProgress,
  saveEvent,
  studentSession,
} from "@/lib/classes/progress";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ slug: string }> };
const headers = { "Cache-Control": "private, no-store" };
const reply = (body: unknown, status = 200) =>
  Response.json(body, { status, headers });
export async function POST(request: Request, { params }: Context) {
  if (!sameOriginWrite(request.headers.get("origin"), request.url))
    return reply({ error: "Use the class page to save progress." }, 403);
  const { slug } = await params;
  if (!classBySlug(slug)?.published)
    return reply({ error: "Class unavailable." }, 404);
  try {
    const { db, user } = await studentSession();
    if (!user) return reply({ error: "Sign in to continue." }, 401);
    if (user.app_metadata?.deletion_in_progress)
      return reply({ error: "Account deletion in progress." }, 409);
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object")
      return reply({ error: "Choose a class action." }, 400);
    const progress = await readProgress(db, user.id, slug);
    if (!classOpen(!!progress))
      return reply({ error: "New enrollment is closed." }, 403);
    if (body.event === "start")
      return reply({ progress: await saveEvent(user.id, slug, "start") });
    if (!progress)
      return reply({ error: "Start this class before saving progress." }, 409);
    if (body.event === "worksheet")
      return reply({ progress: await saveEvent(user.id, slug, "worksheet") });
    if (
      body.event === "slide" &&
      slidesFor(slug).some((s) => s.key === body.key)
    )
      return reply({
        progress: await saveEvent(user.id, slug, "slide", body.key),
      });
    if (body.event === "quiz" && ["mid", "final"].includes(body.check)) {
      const result = grade(
        quizzesFor(slug)[body.check as "mid" | "final"],
        body.answers,
      );
      if (!result)
        return reply(
          { error: "Answer each question before checking your work." },
          400,
        );
      return reply({
        ...result,
        progress:
          body.check === "final"
            ? await saveEvent(user.id, slug, "quiz", undefined, result.score)
            : progress,
      });
    }
    return reply({ error: "Unknown class action." }, 400);
  } catch {
    return reply(
      { error: "Progress could not be saved. Please try again." },
      503,
    );
  }
}
