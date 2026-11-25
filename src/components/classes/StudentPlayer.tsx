"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ClassInfo } from "@/lib/classes/catalog";
import type { Progress, Slide } from "@/lib/classes/lessons";
import { narration, type Walkthrough } from "@/lib/classes/media";
import { ResumeOffer, Worksheet } from "./ClassMaterials";
import type { Fields } from "@/lib/classes/worksheets";

type Question = { prompt: string; options: string[] };
type Result = {
  score: number;
  review: { correct: boolean; why: string; answer: string }[];
};
type Reply = Partial<Result> & { progress: Progress };
type Props = {
  course: ClassInfo;
  slides: Slide[];
  initial: Progress | null;
  userId: string;
  mid: Question[];
  final: Question[];
  walkthrough: Walkthrough;
};
const kindNames: Record<string, string> = {
  lesson: "Lesson",
  activity: "Practice",
  mid: "Mid-class quiz",
  final: "End quiz",
  worksheet: "Worksheet",
  video: "Walkthrough",
  review: "Answer review",
  resume: "Resume connection",
  close: "Next steps",
};
const activityLabels: Record<string, string> = {
  setting: "Where people count on me",
  standards: "My values and visible standards",
  ownership: "My ownership rewrite",
  past: "My last seven days",
  review: "My five review answers",
  bullet: "My own resume bullet",
  plan: "My seven-day plan",
  rule: "My rule for schoolwork",
  sort: "My verdict on each of the five claims",
  voice: "My revised About paragraph",
  lab: "My lab decision",
  cashier: "My revised cashier line",
  application: "My plan for the application",
};
function Choice({
  item,
  value,
  change,
  name,
}: {
  item: Question;
  value: number | undefined;
  change: (n: number) => void;
  name: string;
}) {
  return (
    <fieldset className="sc-options">
      <legend>{item.prompt}</legend>
      {item.options.map((opt, i) => (
        <label key={opt}>
          <input
            type="radio"
            name={name}
            checked={value === i}
            onChange={() => change(i)}
          />
          {opt}
        </label>
      ))}
    </fieldset>
  );
}
function Feedback({ result }: { result: Result["review"][number] }) {
  return (
    <div className="sc-feedback">
      <strong>{result.correct ? "Correct" : "Review this answer"}</strong>
      <p>{result.why}</p>
      {!result.correct && <p>Best answer: {result.answer}</p>}
    </div>
  );
}
const practiceCases: Record<
  string,
  { choices: string[]; best: number; why: string }
> = {
  s34: {
    choices: [
      "Ask AI for practice questions and write the analysis yourself.",
      "Submit the AI analysis after changing its wording.",
    ],
    best: 0,
    why: "The teacher allowed practice questions and reserved the analysis for you.",
  },
  s36: {
    choices: [
      "Claim the shift supervisor title.",
      "Describe how you rang orders and showed a coworker the register.",
    ],
    best: 1,
    why: "Helping one person learn a task is real experience. It does not establish a supervisor title.",
  },
  s37: {
    choices: [
      "Choose your own example and write the response unaided.",
      "Ask AI for a finished response using a volunteer story.",
    ],
    best: 0,
    why: "The application explicitly calls for an unaided response.",
  },
};
export default function StudentPlayer({
  course,
  slides,
  initial,
  userId,
  mid,
  final,
  walkthrough,
}: Props) {
  const first = Math.max(
    0,
    slides.findIndex((s) => s.key === initial?.last_slide_key),
  );
  const [index, setIndex] = useState(first),
    [progress, setProgress] = useState(initial),
    [values, setValues] = useState<Fields>({}),
    [error, setError] = useState(""),
    [working, setWorking] = useState(false);
  const [answers, setAnswers] = useState<{ mid: number[]; final: number[] }>({
      mid: [],
      final: [],
    }),
    [results, setResults] = useState<{ mid?: Result; final?: Result }>({});
  const [practice, setPractice] = useState<Record<string, number>>({}),
    [menu, setMenu] = useState(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve()),
    enrolled = useRef(!!initial),
    began = useRef(false),
    heading = useRef<HTMLHeadingElement>(null);
  const retry = useRef<null | (() => void)>(null);
  const slide = slides[index],
    total = slides.length,
    finalStart = slides.findIndex((s) => s.kind === "final"),
    reviewIndex = slides.findIndex((s) => s.kind === "review"),
    fi = index - finalStart;
  const passed = !!progress?.completed_at;
  const endpoint = "/api/classes/" + course.slug;
  function send(body: Record<string, unknown>) {
    async function post(payload: Record<string, unknown>): Promise<Reply> {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok)
        throw Error(
          res.status === 401
            ? "Your session ended. Sign in again to save."
            : "Could not save to your account. Your work is still on this page.",
        );
      return res.json();
    }
    const task = queue.current.then(async () => {
      if (!enrolled.current) {
        const start = await post({ event: "start" });
        enrolled.current = true;
        setProgress(start.progress);
        if (body.event === "start") return start;
      }
      const data = await post(body);
      setProgress(data.progress);
      return data;
    });
    queue.current = task.catch(() => {});
    return task;
  }
  function persist(body: Record<string, unknown>) {
    setError("");
    retry.current = null;
    void send(body).catch((e) => {
      setError(e.message);
      retry.current = () => persist(body);
    });
  }
  useEffect(() => {
    if (!began.current) {
      began.current = true;
      if (!initial) persist({ event: "start" });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  function go(n: number) {
    if (n < 0 || n >= total || working) return;
    setIndex(n);
    setMenu(false);
    persist({ event: "slide", key: slides[n].key });
    requestAnimationFrame(() => heading.current?.focus());
  }
  function edit(k: string, v: string) {
    setValues((prev) => ({ ...prev, [k]: v }));
  }
  function choose(check: "mid" | "final", i: number, value: number) {
    setAnswers((prev) => {
      const a = prev[check].slice();
      a[i] = value;
      return { ...prev, [check]: a };
    });
    setResults((prev) => ({ ...prev, [check]: undefined }));
  }
  async function submit(check: "mid" | "final") {
    const qs = check === "mid" ? mid : final;
    const missing = qs.findIndex((_, i) => answers[check][i] === undefined);
    if (missing >= 0) {
      if (check === "final") go(finalStart + missing);
      setError("Choose an answer for each question before checking your work.");
      return;
    }
    setWorking(true);
    setError("");
    retry.current = null;
    try {
      const r = await send({ event: "quiz", check, answers: answers[check] });
      setResults((prev) => ({
        ...prev,
        [check]: { score: r.score!, review: r.review! },
      }));
      if (check === "final") {
        setIndex(reviewIndex);
        persist({ event: "slide", key: slides[reviewIndex].key });
        requestAnimationFrame(() => heading.current?.focus());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setWorking(false);
    }
  }
  const example = course.slug === "ai-honestly" && practiceCases[slide.key];
  const nextWorksheet = () =>
    go(slides.findIndex((s) => s.kind === "worksheet"));
  return (
    <div
      className="sc-wrap sc-learning"
      onKeyDown={(e) => {
        if (
          e.altKey ||
          e.ctrlKey ||
          e.metaKey ||
          e.shiftKey ||
          (e.target as HTMLElement).closest(
            "input,textarea,select,button,a,summary,[contenteditable]",
          )
        )
          return;
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          go(index + (e.key === "ArrowRight" ? 1 : -1));
        }
      }}
    >
      <a
        className="sc-skip"
        href="#class-outline"
        onClick={() => setMenu(true)}
      >
        Skip to lesson outline
      </a>
      <Link className="sc-back" href={"/classes/" + course.slug}>
        Class overview
      </Link>
      <header className="sc-player-title">
        <p className="sc-label">
          {course.track} · {passed ? "Completed" : "My class"}
        </p>
        <h1>{course.title}</h1>
      </header>
      <div className="sc-layout">
        <div className="sc-maincol">
          <article className="sc-slide" aria-label={slide.aria}>
            <div className="sc-slidebar">
              <span>{kindNames[slide.kind]}</span>
              <span>
                Slide {index + 1} of {total}
              </span>
            </div>
            <progress
              aria-label="Position in presentation"
              value={index + 1}
              max={total}
            />
            <div className="sc-slidebody">
              <h2 ref={heading} tabIndex={-1}>
                {slide.title}
              </h2>
              <p className="sc-teaching">{slide.body}</p>
              {slide.examples && (
                <dl className="sc-examples">
                  {slide.examples.map((part) => (
                    <div key={part.label}>
                      <dt>{part.label}</dt>
                      <dd>
                        {part.detail && <p>{part.detail}</p>}
                        {part.text}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              {course.slug === "ai-honestly" && slide.key === "s23" && (
                <div className="sc-actions">
                  <button onClick={nextWorksheet}>
                    Review my bullets for honesty
                  </button>
                </div>
              )}
              {example && (
                <>
                  <Choice
                    item={{
                      prompt: "Which action fits?",
                      options: example.choices,
                    }}
                    name={slide.key}
                    value={practice[slide.key]}
                    change={(n) => setPractice({ ...practice, [slide.key]: n })}
                  />
                  {practice[slide.key] !== undefined && (
                    <p className="sc-feedback">
                      {practice[slide.key] === example.best
                        ? "Correct. "
                        : "Consider this. "}
                      {example.why}
                    </p>
                  )}
                </>
              )}
              {slide.field && (
                <label className="sc-field">
                  {activityLabels[slide.field]}
                  <textarea
                    rows={3}
                    maxLength={2400}
                    value={values[slide.field] || ""}
                    onChange={(e) => edit(slide.field!, e.target.value)}
                  />
                  <small>
                    Optional practice. Copy anything you want to keep before
                    leaving this page.
                  </small>
                </label>
              )}
              {slide.field === "sort" && (
                <details>
                  <summary>Compare your five decisions</summary>
                  <p>
                    Sorting and labeling are supported. Managing other
                    volunteers invents a responsibility. The number of boxes and
                    how visitors were helped each need confirmation.
                  </p>
                </details>
              )}
              {slide.kind === "video" && (
                <section className="sc-work">
                  {" "}
                  {walkthrough.recording ? (
                    <>
                      <video
                        controls
                        playsInline
                        preload="metadata"
                        aria-label={slide.title}
                        src={walkthrough.recording.src}
                      >
                        <track
                          default
                          kind="captions"
                          srcLang="en"
                          label="English"
                          src={walkthrough.recording.captions}
                        />
                      </video>
                      <details>
                        <summary>Video transcript</summary>
                        <p style={{ whiteSpace: "pre-line" }}>
                          {walkthrough.recording.transcript}
                        </p>
                      </details>
                    </>
                  ) : (
                    <p className="sc-label">
                      Recording coming soon · Planned {walkthrough.minutes} min
                    </p>
                  )}
                  <h3>Annotated walkthrough</h3>
                  <ol className="sc-script">
                    {walkthrough.steps.map(([t, b]) => (
                      <li key={t}>
                        <strong>{t}</strong>
                        <p>{b}</p>
                      </li>
                    ))}
                  </ol>
                  <details>
                    <summary>Read the narration script</summary>
                    {narration[course.slug].map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </details>
                </section>
              )}
              {slide.kind === "worksheet" && (
                <Worksheet
                  course={course}
                  values={values}
                  edit={edit}
                  onDownload={() => persist({ event: "worksheet" })}
                />
              )}
              {slide.kind === "mid" && (
                <div>
                  {mid.map((q, i) => (
                    <div key={q.prompt}>
                      <Choice
                        item={q}
                        name={"mid-" + i}
                        value={answers.mid[i]}
                        change={(n) => choose("mid", i, n)}
                      />
                      {results.mid && (
                        <Feedback result={results.mid.review[i]} />
                      )}
                    </div>
                  ))}
                  <button
                    className="sc-btn"
                    disabled={working}
                    onClick={() => submit("mid")}
                  >
                    Check practice answers
                  </button>
                  {results.mid && (
                    <p role="status">
                      {results.mid.score} of 3 correct. You can keep practicing.
                    </p>
                  )}
                </div>
              )}
              {slide.kind === "final" && (
                <>
                  <Choice
                    item={final[fi]}
                    name={"final-" + fi}
                    value={answers.final[fi]}
                    change={(n) => choose("final", fi, n)}
                  />
                  {fi === 4 && (
                    <button
                      className="sc-btn"
                      disabled={working}
                      onClick={() => submit("final")}
                    >
                      {working ? "Checking…" : "Check my five answers"}
                    </button>
                  )}
                </>
              )}
              {slide.kind === "review" && (
                <div className="sc-work">
                  {results.final ? (
                    <>
                      <h3>{results.final.score} of 5 correct</h3>
                      <p>
                        {passed
                          ? "Class complete. Your completion is saved."
                          : "Review the reasons below and try again when ready."}
                      </p>
                      {results.final.review.map((r, i) => (
                        <div key={final[i].prompt}>
                          <h4>{final[i].prompt}</h4>
                          <Feedback result={r} />
                        </div>
                      ))}
                    </>
                  ) : (
                    <p>
                      {progress?.end_quiz_score != null
                        ? "Your best saved score is " +
                          progress.end_quiz_score +
                          " of 5."
                        : "Your answers will appear here after you submit the five questions."}
                    </p>
                  )}
                  <button
                    onClick={() => {
                      setAnswers((a) => ({ ...a, final: [] }));
                      setResults((r) => ({ ...r, final: undefined }));
                      go(finalStart);
                    }}
                  >
                    {progress?.end_quiz_score != null
                      ? "Retry end quiz"
                      : "Open end quiz"}
                  </button>
                </div>
              )}
              {(slide.kind === "resume" ||
                slide.kind === "close" ||
                slide.kind === "review") &&
                passed && (
                  <ResumeOffer
                    course={course}
                    userId={userId}
                    bullet={values.bullet || ""}
                    completed={progress!.completed_at!}
                  />
                )}
              {slide.kind === "close" && (
                <div className="sc-actions">
                  <button onClick={nextWorksheet}>Open my worksheet</button>
                  {!passed && (
                    <button onClick={() => go(finalStart)}>
                      Take the end quiz
                    </button>
                  )}
                  <Link href="/classes">Back to classes</Link>
                </div>
              )}
            </div>
            <div className="sc-controls">
              <button
                disabled={!index || working}
                onClick={() => go(index - 1)}
              >
                Previous
              </button>
              <span>
                {index + 1} / {total}
              </span>
              {index < total - 1 && (
                <button
                  className="sc-btn"
                  disabled={working}
                  onClick={() => go(index + 1)}
                >
                  Next slide
                </button>
              )}
            </div>
          </article>
          {error && (
            <p className="sc-error" role="alert">
              {error}{" "}
              {retry.current && (
                <button onClick={() => retry.current?.()}>Retry save</button>
              )}
            </p>
          )}
        </div>
        <aside className="sc-outline" id="class-outline" tabIndex={-1}>
          <button
            className="sc-menu"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            Lesson outline
          </button>
          <h2>Lesson outline</h2>
          <nav aria-label="Lesson outline" className={menu ? "expanded" : ""}>
            <ol>
              {slides.map((s, i) => (
                <li key={s.key}>
                  <button
                    disabled={working}
                    aria-current={i === index ? "step" : undefined}
                    onClick={() => go(i)}
                  >
                    {s.title}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </aside>
      </div>
    </div>
  );
}
