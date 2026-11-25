import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  classes,
  classDestination,
  classOpen,
  retiredClasses,
} from "../src/lib/classes/catalog";
import {
  slidesFor,
  quizzesFor,
  grade,
  walkthroughs,
} from "../src/lib/classes/lessons";
import { bookClasses, currentSlideKey } from "../src/lib/classes/leadership";
import { series } from "../src/lib/classes/series";
import { promptSheetFile } from "../src/lib/classes/prompt-sheet";
import sitemap from "../src/app/sitemap";
import config from "../next.config";
import { WORKSHOP } from "../src/lib/workshop";
import { worksheetFile } from "../src/lib/classes/worksheets";

test("all nine authored outlines have numbered, accessible slides and a complete quiz plan", () => {
  assert.equal(classes.length, 9);
  assert.equal(classes.filter((c) => c.published).length, 9);
  for (const course of classes) {
    const raw = JSON.parse(
      readFileSync("src/lib/classes/content/" + course.slug + ".json", "utf8"),
    );
    const outline = (Array.isArray(raw) ? raw : raw.slides) as Array<{
      key: string;
      title: string;
      body: string;
      notes: string;
      aria: string;
      kind: string;
    }>;
    assert.equal(outline.length, course.count);
    assert.equal(outline.filter((s) => s.kind === "final").length, 5);
    assert.equal(
      outline.filter((s) => ["mid", "midIntro"].includes(s.kind)).length,
      1,
    );
    assert.ok(
      outline.some((s) => s.kind === "worksheet") &&
        outline.some((s) => s.kind === "video"),
    );
    outline.forEach((s, i) => {
      assert.equal(
        s.key,
        "s" +
          String(
            course.slug === "lead-yourself" && i > 0 ? i + 50 : i + 1,
          ).padStart(2, "0"),
      );
      assert.ok(s.aria && s.body && s.title);
      const { notes, ...studentFields } = s;
      if (course.track === "Leadership") assert.ok(notes);
      assert.doesNotMatch(
        JSON.stringify(studentFields),
        /\[BRENEN (?:MAP|EXCERPT)\b/i,
      );
    });
    if (!course.published && !series[course.slug]) {
      assert.equal(slidesFor(course.slug).length, 0);
      continue;
    }
    assert.doesNotMatch(
      JSON.stringify(slidesFor(course.slug)),
      /BRENEN MAP|BRENEN EXCERPT|"notes"/,
    );
    assert.ok(walkthroughs[course.slug].steps.length >= 4);
    const { mid, final } = quizzesFor(course.slug);
    assert.equal(mid.length, 3);
    assert.equal(final.length, 5);
    const a = final.map((q) => q.answer);
    assert.equal(grade(final, a)?.score, 5);
    a[0] = (a[0] + 1) % final[0].options.length;
    assert.equal(grade(final, a)?.score, 4);
    a[1] = (a[1] + 1) % final[1].options.length;
    assert.equal(grade(final, a)?.score, 3);
    assert.equal(grade(final, [99]), null);
    assert.equal(grade(final, [-1, 0, 0, 0, 0]), null);
  }
});
test("only known published class paths are accepted for an account return", () => {
  for (const course of classes.filter((c) => c.published)) {
    const path = "/classes/" + course.slug + "/learn";
    assert.equal(classDestination(path), path);
  }
  for (const path of [
    null,
    "https://example.com",
    "//example.com",
    "/classes/ai-spot-errors/learn",
    "/classes/ai-honestly/learn",
    "/classes/unknown/learn",
    "/classes/../admin/learn",
    "/classes/ai-honestly/learn?redirect=//example.com",
  ])
    assert.equal(classDestination(path), null);
});
test("free enrollment is the default and existing learners retain access under the future flag", () => {
  const value = process.env.CLASSES_PAID_ENABLED;
  try {
    delete process.env.CLASSES_PAID_ENABLED;
    assert.ok(classOpen(false));
    process.env.CLASSES_PAID_ENABLED = "true";
    assert.ok(!classOpen(false));
    assert.ok(classOpen(true));
  } finally {
    if (value === undefined) delete process.env.CLASSES_PAID_ENABLED;
    else process.env.CLASSES_PAID_ENABLED = value;
  }
});
test("offline worksheet escapes learner text and contains no network destination", () => {
  for (const slug of ["lead-yourself", "ai-honestly"]) {
    const html = worksheetFile(
      slug,
      "Worksheet",
      {
        standards: "<script>oops</script>",
        bullet: "<script>oops</script>",
        check0: slug === "lead-yourself" ? "Held" : "Yes",
      },
      bookClasses[slug]?.fields,
    );
    assert.ok(html.includes("&lt;script&gt;"));
    assert.doesNotMatch(html, /<script>oops|https?:\/\/|fetch\(/);
    assert.match(html, /option selected/);
  }
});

test("the sitemap contains every public class landing and both policies", () => {
  const base = "https://www.firstcareersteps.com";
  const urls = sitemap().map((entry) => entry.url);
  const expected = [
    "/classes",
    "/classes/prompts",
    "/privacy",
    "/terms",
    WORKSHOP,
    ...classes.map((c) => "/classes/" + c.slug),
  ];
  for (const path of expected) assert.ok(urls.includes(base + path), path);
  assert.equal(urls.length, new Set(urls).size);
  assert.ok(!urls.some((url) => /\/classes\/[^/]+\/learn(?:\/|$)/.test(url)));
});

test("short AI workshop bookmarks redirect permanently and only their destinations are indexed", async () => {
  const redirects = await config.redirects!();
  const paths = new Set(sitemap().map((entry) => new URL(entry.url).pathname));
  for (const [source, destination] of [
    ["/learn/ai", "/classes"],
    ["/learn/ai/basics", "/classes/ai-basics"],
    ["/learn/ai/prompting", "/classes/ai-basics"],
    ["/learn/ai/brainstorming", "/classes/ai-brainstorming"],
    ["/learn/ai/multiple-ais", "/classes/ai-multiple"],
    ["/learn/ai/building", "/classes/ai-building"],
    ["/learn/ai/prompts", "/classes/prompts"],
  ]) {
    assert.ok(redirects.some((r) => r.source === source && r.destination === destination && r.permanent), source);
    assert.ok(!paths.has(source) && paths.has(destination), destination);
  }
  assert.ok(paths.has("/learn/leadership/team-training"));
});

test("the workspace workshop address forwards to the existing one-time product", async () => {
  const redirects = await config.redirects!();
  assert.ok(
    redirects.some(
      (r) =>
        r.source === "/workspace/resume-bullet" &&
        r.destination === WORKSHOP &&
        r.permanent,
    ),
  );
});

test("coming-soon lessons always resolve to the public class overview before progress or checkout", async () => {
  const { middleware } = await import("../src/middleware");
  const { NextRequest } = await import("next/server");
  const course = { ...classes[0], slug: "test-upcoming-course", published: false };
  classes.push(course);
  try {
    const landing = "https://www.firstcareersteps.com/classes/" + course.slug;
    for (const headers of [
      new Headers(),
      new Headers({ cookie: "session=test" }),
    ]) {
      const response = await middleware(
        new NextRequest(landing + "/learn", { headers }),
      );
      assert.equal(response.status, 307);
      assert.equal(response.headers.get("location"), landing);
    }
  } finally {
    classes.splice(classes.indexOf(course), 1);
  }
});

test("the four practical courses carry full materials and retired classes cannot start new progress", () => {
  const ai = classes.filter((c) => c.track === "AI");
  assert.deepEqual(
    ai.map((c) => [c.slug, c.published, c.count]),
    [
      ["ai-basics", true, 44],
      ["ai-brainstorming", true, 42],
      ["ai-multiple", true, 46],
      ["ai-building", true, 48],
    ],
  );
  for (const name of Object.keys(retiredClasses)) {
    assert.ok(!classes.some((c) => c.slug === name));
    assert.equal(classDestination("/classes/" + name + "/learn"), null);
  }
  const canonical = JSON.parse(
    readFileSync("src/lib/classes/content/requirements-prompts.json", "utf8"),
  );
  const expected = [
    [2, 2, 1, 1, 2],
    [1, 2, 1, 0, 1],
    [1, 1, 1, 1, 2],
    [0, 1, 1, 1, 1],
  ];
  ai.forEach((c, i) => {
    const { slides, materials, walkthrough, mid, final } = series[c.slug];
    assert.deepEqual(
      final.map((q) => q.answer),
      expected[i],
    );
    assert.equal(grade(final, expected[i])?.score, 5);
    assert.equal(mid.length, 3);
    assert.deepEqual(
      slides.filter((s) => s.kind === "midQuestion").map((s) => s.midIndex),
      [0, 1, 2],
    );
    assert.ok(walkthrough.narration && walkthrough.narration.length >= 4);
    const links = new Set(slides.flatMap((s) => s.promptIds || []));
    assert.equal(
      materials.prompts.filter((p) => p.worksheet).length,
      [6, 7, 8, 8][i],
    );
    materials.prompts.forEach((p) => {
      assert.ok(links.has(p.id));
      assert.ok(p.use && p.text);
    });
    assert.ok(slides.some((s) => s.field));
    const offline = promptSheetFile(c.worksheet, materials, {
      [materials.fields[0].key]: "a <private> draft",
    });
    assert.ok(offline.includes("a &lt;private&gt; draft"));
    assert.doesNotMatch(offline, /fetch\(|https?:\/\//);
    if (i >= 2)
      for (const text of Object.values(canonical))
        assert.ok(materials.prompts.some((p) => p.text === text));
  });
});

test("leadership release maps every chapter and grades one final per book part", () => {
  const expected = [
    ["lead-yourself", 1, 9, [1, 2, 2, 2, 1]],
    ["see-and-develop-people", 10, 12, [2, 1, 1, 1, 2]],
    ["set-the-stage", 13, 16, [1, 2, 1, 1, 1]],
    ["everyday-techniques", 17, 20, [1, 2, 1, 1, 1]],
    ["culture-overhaul", 21, 23, [1, 2, 1, 2, 2]],
  ] as const;
  for (const [slug, lo, hi, answers] of expected) {
    const course = bookClasses[slug];
    const chapters = course.slides.flatMap((s) =>
      s.quote && s.chapter
        ? [Number(s.chapter.match(/^Chapter (\d+): /)?.[1])]
        : [],
    );
    for (let n = lo; n <= hi; n++)
      assert.ok(chapters.includes(n), slug + " lacks a cited excerpt for " + n);
    assert.deepEqual(
      course.final.map((q) => q.answer),
      [...answers],
    );
    assert.equal(course.slides.filter((s) => s.kind === "final").length, 5);
    assert.equal(course.slides.filter((s) => s.app).length, 1);
    const videos = course.slides.filter((s) => s.kind === "video");
    assert.equal(videos.length, slug === "everyday-techniques" ? 2 : 1);
    for (const s of videos)
      assert.ok(
        course.walkthroughs[s.walkthroughIndex ?? 0].narration?.join(" ")
          .length,
      );
    assert.ok(course.slides.some((s) => s.field === "bullet"));
    assert.doesNotMatch(
      readFileSync("src/lib/classes/content/" + slug + ".json", "utf8"),
      /\[BRENEN (?:MAP|EXCERPT)/,
    );
    const html = worksheetFile(
      slug,
      slug,
      { [course.fields[0].key]: "<private>" },
      course.fields,
    );
    assert.ok(html.includes("&lt;private&gt;"));
    assert.doesNotMatch(html, /fetch\(|https?:\/\//);
  }
  assert.match(
    bookClasses["lead-yourself"].slides[9].quote!,
    /Your immovable rock may look different than mine/,
  );
  for (const [old, ordinal] of [
    ["s12", 13],
    ["s31", 37],
    ["s41", 48],
    ["s42", 50],
  ] as const) {
    const key = bookClasses["lead-yourself"].slides[ordinal - 1].key;
    assert.equal(currentSlideKey("lead-yourself", old), key);
    assert.equal(currentSlideKey("lead-yourself", key), key);
  }
});
