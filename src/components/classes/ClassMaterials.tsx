"use client";
import {
  transferKey,
  type ClassTransfer as Transfer,
} from "@/lib/classes/transfer";
import { useState } from "react";
import { promptSheetFile, type PromptSheet } from "@/lib/classes/prompt-sheet";
import type { ClassInfo } from "@/lib/classes/catalog";
import {
  worksheetFile,
  worksheetFields,
  week,
  checklist,
  type Fields,
  type WorksheetField,
} from "@/lib/classes/worksheets";
type Editable = { values: Fields; edit: (key: string, value: string) => void };
export function ResponseFields({
  fields,
  values,
  edit,
}: Editable & { fields: WorksheetField[] }) {
  return (
    <>
      {fields.map(({ key, label, hint }) => (
        <label className="sc-field" key={key}>
          {label}
          {hint && <small>{hint}</small>}
          <textarea
            rows={2}
            maxLength={2400}
            value={values[key] || ""}
            onChange={(e) => edit(key, e.target.value)}
          />
        </label>
      ))}
    </>
  );
}
export function WeekGrid({
  values,
  edit,
  past = false,
}: Editable & { past?: boolean }) {
  return (
    <fieldset>
      <legend>
        {past
          ? "Look back at the past seven days"
          : "Seven-day consistency grid"}
      </legend>
      {week.map((day, i) => (
        <label className="sc-checkrow" key={day}>
          {day}
          <select
            value={values[(past ? "past" : "check") + i] || ""}
            onChange={(e) =>
              edit((past ? "past" : "check") + i, e.target.value)
            }
          >
            <option value="">Choose</option>
            {(past
              ? ["Held", "Slipped", "No opportunity"]
              : ["Held", "Slipped", "No opportunity", "Planned"]
            ).map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
      ))}
    </fieldset>
  );
}
export function Worksheet({
  course,
  values,
  edit,
  onDownload,
  materials,
  bookFields,
}: {
  course: ClassInfo;
  values: Fields;
  edit: (k: string, v: string) => void;
  onDownload: () => void;
  materials?: PromptSheet;
  bookFields?: WorksheetField[];
}) {
  const grid = course.slug === "lead-yourself";
  function download() {
    const url = URL.createObjectURL(
      new Blob(
        [
          materials
            ? promptSheetFile(course.worksheet, materials, values)
            : worksheetFile(course.slug, course.worksheet, values, bookFields),
        ],
        {
          type: "text/html;charset=utf-8",
        },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = course.slug + "-worksheet.html";
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    onDownload();
  }
  return (
    <section className="sc-work">
      <h3>{course.worksheet}</h3>
      <p>
        Your writing stays on this page until you leave. Download a copy to keep
        it, edit it offline or print it as a PDF.
      </p>
      {materials && (
        <ul>
          {materials.reminders.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      <ResponseFields
        fields={
          bookFields ??
          materials?.fields ??
          worksheetFields[course.slug].map(([key, label]) => ({ key, label }))
        }
        values={values}
        edit={edit}
      />
      {grid && <WeekGrid values={values} edit={edit} />}
      {course.slug === "ai-honestly" && (
        <fieldset>
          <legend>Check your draft</legend>
          {checklist.map((s, i) => (
            <label className="sc-checkrow" key={s}>
              {s}
              <select
                value={values["check" + i] || ""}
                onChange={(e) => edit("check" + i, e.target.value)}
              >
                <option value="">Choose</option>
                {["Yes", "Needs work", "Not applicable"].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          ))}
        </fieldset>
      )}
      <button type="button" className="sc-btn" onClick={download}>
        Download my worksheet
      </button>
    </section>
  );
}
export function ResumeOffer({
  course,
  userId,
  bullet,
  completed,
}: {
  course: ClassInfo;
  userId: string;
  bullet: string;
  completed: string;
}) {
  const [type, setType] = useState<Transfer["type"]>("course"),
    [skill, setSkill] = useState(""),
    [draft, setDraft] = useState(bullet),
    [preview, setPreview] = useState<Transfer | null>(null),
    [error, setError] = useState("");
  const value =
    type === "course"
      ? "Completed " + course.title + " on FirstCareerSteps."
      : type === "skill"
        ? skill.trim()
        : draft.trim();
  function confirm() {
    if (!preview) return;
    try {
      sessionStorage.setItem(
        transferKey(userId),
        JSON.stringify({
          ...preview,
          month: new Date(completed)
            .toLocaleDateString("sv-SE", { timeZone: "America/New_York" })
            .slice(0, 7),
        }),
      );
      window.location.assign(
        "/builder/" +
          (preview.type === "skill" ? "step-5" : "step-4") +
          "?from=class",
      );
    } catch {
      setError(
        "Your browser could not open a draft. Copy the preview into your builder instead.",
      );
    }
  }
  return (
    <section className="sc-work">
      <h3>Add to resume</h3>
      <p>
        This is a FirstCareerSteps completion record. It carries no school
        credit, license or accreditation.
      </p>
      {preview ? (
        <>
          <p className="sc-proof">
            <strong>Preview</strong>
            {preview.text}
          </p>
          <p>
            The builder will open an editable draft. You can change or remove it
            there.
          </p>
          <div className="sc-actions">
            <button className="sc-btn" onClick={confirm}>
              Confirm and open builder
            </button>
            <button onClick={() => setPreview(null)}>Back to editing</button>
          </div>
        </>
      ) : (
        <>
          <label>
            What would you like to add?
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Transfer["type"])}
            >
              <option value="course">Completion record</option>
              <option value="skill">A skill I practiced</option>
              <option value="bullet">My own experience bullet</option>
            </select>
          </label>
          {type === "course" ? (
            <p>{value}</p>
          ) : type === "skill" ? (
            <>
              <label>
                Suggested skill
                <select
                  value={course.skills.includes(skill) ? skill : ""}
                  onChange={(e) => setSkill(e.target.value)}
                >
                  <option value="">Choose or enter your own below</option>
                  {course.skills.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Skill to add
                <input
                  maxLength={80}
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                />
              </label>
            </>
          ) : (
            <label>
              A bullet about work I actually did
              <textarea
                rows={3}
                maxLength={1200}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </label>
          )}
          <button
            className="sc-btn"
            disabled={!value}
            onClick={() =>
              setPreview({ type, text: value, title: course.title })
            }
          >
            Preview addition
          </button>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
