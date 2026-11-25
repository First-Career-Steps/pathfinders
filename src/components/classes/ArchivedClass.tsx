import Link from "next/link";
import { readProgress, studentSession } from "@/lib/classes/progress";
import { slidesFor, type Progress } from "@/lib/classes/lessons";

export default async function ArchivedClass({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const { db, user } = await studentSession();
  let row: Progress | null = null;
  let unavailable = false;
  if (user) {
    try {
      row = await readProgress(db, user.id, slug);
    } catch {
      unavailable = true;
    }
  }
  const slides = row ? slidesFor(slug) : [];
  return (
    <div className="sc-wrap">
      <Link className="sc-back" href="/classes">
        Student classes
      </Link>
      <header className="sc-intro">
        <p className="sc-label">Retired AI class</p>
        <h1>{title}</h1>
        <p>
          The practical AI series has replaced this class. You can start the new
          series with <Link href="/classes/ai-basics">Basics of AI</Link>.
        </p>
      </header>
      {unavailable && (
        <p role="alert">
          Your saved record could not be loaded. Refresh to try again.
        </p>
      )}
      {row && (
        <section className="sc-work">
          <h2>Your archived record</h2>
          <p>
            {row.completed_at ? "Completed (retired)" : "Started (retired)"} ·
            Last viewed slide {Number(row.last_slide_key.slice(1))}
            {row.end_quiz_score != null
              ? " · Best final score " + row.end_quiz_score + "/5"
              : ""}
            .
          </p>
          {row.completed_at && (
            <p>
              Completed{" "}
              {new Intl.DateTimeFormat("en-US", {
                timeZone: "America/New_York",
                dateStyle: "long",
              }).format(new Date(row.completed_at))}
              .
            </p>
          )}
          {slides.length > 0 && (
            <details>
              <summary>Read archived lesson text</summary>
              {slides.map((slide, i) => (
                <section key={slide.key}>
                  <h3>
                    {i + 1}. {slide.title}
                  </h3>
                  <p>{slide.body}</p>
                  {slide.examples?.map((example) => (
                    <p key={example.label}>
                      <strong>{example.label}</strong> {example.detail}{" "}
                      {example.text}
                    </p>
                  ))}
                </section>
              ))}
            </details>
          )}
          <Link href="/dashboard">Back to my dashboard</Link>
        </section>
      )}
    </div>
  );
}
