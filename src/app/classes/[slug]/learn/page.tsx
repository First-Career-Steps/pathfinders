import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { bookClasses, currentSlideKey } from "@/lib/classes/leadership";
import { series } from "@/lib/classes/series";
import StudentPlayer from "@/components/classes/StudentPlayer";
import { classBySlug, classOpen, retiredTitle } from "@/lib/classes/catalog";
import { quizzesFor, slidesFor, walkthroughs } from "@/lib/classes/lessons";
import { readProgress, studentSession } from "@/lib/classes/progress";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "My class | First Career Steps",
  robots: { index: false, follow: false },
};
export default async function Learn({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = classBySlug(slug);
  if (retiredTitle(slug)) redirect("/classes/" + slug);
  if (!course) notFound();
  if (!course.published) redirect("/classes/" + slug);
  const { db, user } = await studentSession();
  if (!user)
    redirect(
      "/login?redirect=" + encodeURIComponent("/classes/" + slug + "/learn"),
    );
  let progress;
  try {
    progress = await readProgress(db, user.id, slug);
  } catch {
    return (
      <div className="sc-wrap">
        <h1>We couldn’t open your progress.</h1>
        <p>Please try again in a moment.</p>
        <Link href={"/classes/" + slug}>Return to the class</Link>
      </div>
    );
  }
  if (!classOpen(!!progress)) redirect("/classes/" + slug);
  const tests = quizzesFor(slug);
  const show = ({
    prompt,
    options,
  }: {
    prompt: string;
    options: string[];
  }) => ({ prompt, options });
  return (
    <StudentPlayer
      key={user.id + "-" + slug}
      course={course}
      slides={slidesFor(slug)}
      initial={
        progress && {
          ...progress,
          last_slide_key: currentSlideKey(slug, progress.last_slide_key),
        }
      }
      userId={user.id}
      mid={tests.mid.map(show)}
      final={tests.final.map(show)}
      materials={series[slug]?.materials}
      walkthroughs={bookClasses[slug]?.walkthroughs ?? [walkthroughs[slug]]}
      worksheetFields={bookClasses[slug]?.fields}
    />
  );
}
