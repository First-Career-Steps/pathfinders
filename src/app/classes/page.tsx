import Link from "next/link";
import { classes, paidClassesEnabled } from "@/lib/classes/catalog";
export const metadata = {
  title: "Student classes | First Career Steps",
  description:
    "Student leadership and practical AI classes for school, work and personal projects.",
};
export const dynamic = "force-dynamic";
export default function Library() {
  const paid = paidClassesEnabled();
  return (
    <div className="sc-wrap">
      <header className="sc-intro">
        <p className="sc-label">Student classes</p>
        <h1>Skills for your first job.</h1>
        <p>
          Practice what to say, what to check and how to follow through. Start
          with either track. Each class gives you a worksheet to use at school
          or work.
        </p>
        <nav className="sc-start" aria-label="Available classes">
          {classes
            .filter((c) => c.published)
            .map((c) => (
              <Link key={c.slug} href={"/classes/" + c.slug}>
                {c.title}
              </Link>
            ))}
        </nav>
      </header>
      {(["Leadership", "AI"] as const).map((track) => (
        <section
          className="sc-track"
          key={track}
          aria-label={track + " classes"}
        >
          <div className="sc-track-head">
            <h2>{track === "AI" ? "Working with AI" : "Leadership"}</h2>
            <p>
              {track === "AI"
                ? "Start with Basics, then practice brainstorming, handing off ideas and planning a small build."
                : "From The Little Black Book on Leadership by Brenen Morse"}
            </p>
          </div>
          <div className="sc-grid">
            {classes
              .filter((c) => c.track === track)
              .map((c) => (
                <article
                  className={
                    "sc-card " +
                    (c.published ? "open " : "") +
                    (track === "AI" ? "ai" : "lead")
                  }
                  key={c.slug}
                >
                  <div className="sc-card-meta">
                    <span>{track}</span>
                    <span>
                      {c.published
                        ? paid
                          ? "Enrolled learners"
                          : "Free"
                        : "Coming soon"}
                    </span>
                  </div>
                  <h3>
                    <Link href={"/classes/" + c.slug}>{c.title}</Link>
                  </h3>
                  <p>{c.promise}</p>
                  <p className="sc-outcome">
                    <strong>You’ll be able to</strong>{" "}
                    {c.outcome.charAt(0).toLowerCase() + c.outcome.slice(1)}
                  </p>
                  <div className="sc-card-foot">
                    <span>About {c.minutes} min</span>
                    <Link href={"/classes/" + c.slug}>
                      {c.published ? "View class" : "Class details"}
                    </Link>
                  </div>
                </article>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
