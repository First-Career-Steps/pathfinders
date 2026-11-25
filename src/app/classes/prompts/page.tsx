import type { Metadata } from "next";
import Link from "next/link";
import PromptBlock from "@/components/classes/PromptBlock";
import { classes } from "@/lib/classes/catalog";
import { series } from "@/lib/classes/series";

export const metadata: Metadata = {
  title: "AI prompt library | First Career Steps",
  description: "Copy the reusable prompts from each practical AI class.",
  alternates: { canonical: "/classes/prompts" },
};

export default function PromptLibrary() {
  const courses = classes.filter((course) => course.track === "AI");
  return (
    <div className="sc-wrap">
      <Link className="sc-back" href="/classes#ai">Student AI classes</Link>
      <header className="sc-intro">
        <h1>AI prompt library</h1>
        <p>Choose a prompt and replace the bracketed details with your own. Leave out private information.</p>
        <nav className="sc-start" aria-label="Jump to class prompts">
          {courses.map(({ slug, title }) => <a key={slug} href={"#" + slug}>{title}</a>)}
        </nav>
      </header>
      {courses.map(({ slug, title, published }) => (
        <section className="sc-track" key={slug} id={slug} aria-labelledby={slug + "-title"}>
          <div className="sc-track-head">
            <h2 id={slug + "-title"}>{title}</h2>
            <Link className="sc-tool-link" href={"/classes/" + slug}>
              {published ? "View class" : "Class details · Coming soon"}
            </Link>
          </div>
          {series[slug].materials.prompts.filter((prompt) => prompt.worksheet).map((prompt) => (
            <PromptBlock key={prompt.id} prompt={prompt} expanded={false} />
          ))}
        </section>
      ))}
    </div>
  );
}
