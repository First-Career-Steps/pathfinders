import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  classes,
  classDestination,
  classOpen,
} from "../src/lib/classes/catalog";
import {
  slidesFor,
  quizzesFor,
  grade,
  walkthroughs,
} from "../src/lib/classes/lessons";
import { worksheetFile } from "../src/lib/classes/worksheets";

test("all nine authored outlines have numbered, accessible slides and a complete quiz plan", () => {
  assert.equal(classes.length, 9);
  assert.equal(classes.filter((c) => c.published).length, 2);
  for (const course of classes) {
    const outline = JSON.parse(
      readFileSync("src/lib/classes/content/" + course.slug + ".json", "utf8"),
    ) as Array<{
      key: string;
      title: string;
      body: string;
      notes: string;
      aria: string;
      kind: string;
    }>;
    assert.equal(outline.length, course.count);
    assert.equal(outline.filter((s) => s.kind === "final").length, 5);
    assert.equal(outline.filter((s) => s.kind === "mid").length, 1);
    assert.ok(
      outline.some((s) => s.kind === "worksheet") &&
        outline.some((s) => s.kind === "video"),
    );
    outline.forEach((s, i) => {
      assert.equal(s.key, "s" + String(i + 1).padStart(2, "0"));
      assert.ok(s.notes && s.aria && s.body && s.title);
    });
    if (!course.published) {
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
  assert.equal(
    classDestination("/classes/ai-honestly/learn"),
    "/classes/ai-honestly/learn",
  );
  for (const path of [
    null,
    "https://example.com",
    "//example.com",
    "/classes/ai-spot-errors/learn",
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
    const html = worksheetFile(slug, "Worksheet", {
      standards: "<script>oops</script>",
      bullet: "<script>oops</script>",
      check0: slug === "lead-yourself" ? "Held" : "Yes",
    });
    assert.ok(html.includes("&lt;script&gt;"));
    assert.doesNotMatch(html, /<script>oops|https?:\/\/|fetch\(/);
    assert.match(html, /option selected/);
  }
});
