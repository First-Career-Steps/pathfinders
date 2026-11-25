import ArchivedClass from "@/components/classes/ArchivedClass";
import ClassConfirmation from "@/components/classes/ClassConfirmation";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  retiredTitle,
  classBySlug,
  classOpen,
  paidClassesEnabled,
} from "@/lib/classes/catalog";
import { readProgress, studentSession } from "@/lib/classes/progress";
import type { Progress } from "@/lib/classes/lessons";
type Context = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: Context) {
  return {
    title:
      (classBySlug((await params).slug)?.title ||
        retiredTitle((await params).slug) ||
        "Class") + " | First Career Steps",
  };
}
export default async function Landing({ params }: Context) {
  const { slug } = await params;
  const c = classBySlug(slug);
  const archive = retiredTitle(slug);
  if (archive) return <ArchivedClass slug={slug} title={archive} />;
  if (!c) notFound();
  const { db, user } = await studentSession();
  let progress: Progress | null = null,
    unavailable = false;
  if (c.published && user) {
    try {
      progress = await readProgress(db, user.id, slug);
    } catch {
      unavailable = true;
    }
  }
  const path = "/classes/" + slug + "/learn";
  return (
    <div className="sc-wrap">
      {c.published && <ClassConfirmation lesson={path} />}
      <Link className="sc-back" href="/classes">
        All student classes
      </Link>
      <section className={"sc-cover " + (c.track === "AI" ? "ai" : "lead")}>
        <div>
          <p className="sc-label">
            {c.track} ·{" "}
            {c.published
              ? paidClassesEnabled()
                ? "Enrolled learners"
                : "Free class"
              : "Coming soon"}
          </p>
          <h1>{c.title}</h1>
          <p>{c.promise}</p>
          {c.bookPart && (
            <p className="sc-bookpart">
              {c.bookPart} of <cite>The Little Black Book on Leadership</cite>{" "}
              by Brenen Morse.
            </p>
          )}
          {c.published &&
            (unavailable ? (
              <p role="alert">
                We couldn’t load your progress. Refresh to try again.
              </p>
            ) : classOpen(!!progress) ? (
              <Link
                prefetch={false}
                className="sc-primary"
                href={
                  user ? path : "/login?redirect=" + encodeURIComponent(path)
                }
              >
                {user
                  ? progress?.completed_at
                    ? "Review class"
                    : progress
                      ? "Continue class"
                      : "Start class"
                  : "Sign in to start"}
              </Link>
            ) : (
              <p>New enrollment is closed.</p>
            ))}
          {!user && c.published && !paidClassesEnabled() && (
            <Link
              className="sc-secondary-link"
              href={"/signup?redirect=" + encodeURIComponent(path)}
            >
              Create an account
            </Link>
          )}
        </div>
        <div className="sc-program">
          <p>{c.published ? "Inside this class" : "Planned class outline"}</p>
          <dl>
            <div>
              <dt>Presentation</dt>
              <dd>{c.count} slides</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>
                About {c.slug === "ai-building" ? "50–55" : c.minutes} minutes
              </dd>
            </div>
            <div>
              <dt>Quizzes</dt>
              <dd>3 practice + 5 final questions</dd>
            </div>
            <div>
              <dt>Recording</dt>
              <dd>
                {c.published
                  ? "Written walkthrough available · video coming soon"
                  : "Planned"}
              </dd>
            </div>
          </dl>
        </div>
      </section>
      <div className="sc-info">
        <section>
          <h2>Who it’s for</h2>
          <p>{c.audience}</p>
          {c.preparation && <p>{c.preparation}</p>}
          <h2>What you’ll be able to do</h2>
          <p>{c.outcome}</p>
          {c.track === "AI" && (
            <p>AI can be wrong. Check its claims before using them.</p>
          )}
        </section>
        <section>
          <p className="sc-label">Takeaway worksheet</p>
          <h2>{c.worksheet}</h2>
          <ul>
            {c.worksheetFields.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
