export type Fields = Record<string, string>;
export type WorksheetField = { key: string; label: string; hint?: string };
type Field = [key: string, label: string];
export const worksheetFields: Record<string, Field[]> = {
  "ai-honestly": [
    ["rule", "My schoolwork rule and any disclosure required"],
    ["facts", "My real role, actions and source facts"],
    ["before", "Before: the draft I want to check"],
    ["bullet", "After: a bullet I can explain"],
    ["reason", "One phrase I changed and the reason"],
  ],
};
export const checklist = [
  "I checked the assignment or application rules.",
  "I can explain which parts I did myself.",
  "My title, dates, duties and numbers are true.",
  "I checked each AI suggestion against my facts.",
  "I can give an interview example for each claim.",
  "I included disclosure wherever it was required.",
];
export const week = [
  "Day 1",
  "Day 2",
  "Day 3",
  "Day 4",
  "Day 5",
  "Day 6",
  "Day 7",
];
export function escapeHTML(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
export function worksheetFile(
  slug: string,
  title: string,
  values: Fields,
  bookFields?: WorksheetField[],
) {
  const fields: WorksheetField[] =
    bookFields ?? worksheetFields[slug].map(([key, label]) => ({ key, label }));
  const lines = fields
    .map(
      ({ key: k, label, hint }) =>
        "<label>" +
        escapeHTML(label) +
        (hint ? "<small>" + escapeHTML(hint) + "</small>" : "") +
        "<textarea>" +
        escapeHTML(values[k] || "") +
        "</textarea></label>",
    )
    .join("");
  const choices = (key: string, opts: string[]) =>
    opts
      .map(
        (o) =>
          "<option" +
          ((values[key] || "") === o ? " selected" : "") +
          ">" +
          escapeHTML(o) +
          "</option>",
      )
      .join("");
  const rows = (
    slug === "lead-yourself" ? week : slug === "ai-honestly" ? checklist : []
  )
    .map(
      (s, i) =>
        '<label class="row">' +
        escapeHTML(s) +
        "<select>" +
        choices(
          "check" + i,
          slug === "lead-yourself"
            ? ["", "Held", "Slipped", "No opportunity", "Planned"]
            : ["", "Yes", "Needs work", "Not applicable"],
        ) +
        "</select></label>",
    )
    .join("");
  return (
    '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' +
    escapeHTML(title) +
    "</title><style>*{box-sizing:border-box}body{max-width:48rem;margin:2rem auto;padding:0 1rem;font:16px/1.4 system-ui;color:#183245}label{display:block;font-weight:600;margin:.75rem 0}textarea{display:block;width:100%;min-height:3.3rem;font:inherit;padding:.4rem}select,button{font:inherit;padding:.35rem}.row{display:flex;align-items:center;justify-content:space-between;gap:1rem;border-bottom:1px solid #bbb;padding:.25rem}label small{display:block;font-size:.875rem;font-weight:400;color:#334954}.print-value{display:none}@page{size:letter;margin:.5in}@media print{body{margin:0;padding:0;max-width:none;font-size:11pt}label small{font-size:9.5pt}.fields{display:grid;grid-template-columns:1fr 1fr;gap:.1in .32in}.fields label{margin:.08in 0}.fields .print-value{min-height:.76in;border-bottom:1px solid #83949b}.rows{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}.row{display:block}.row .print-value{display:block;min-height:.25in}.print-value{font-weight:400}.actions,textarea,select{display:none!important}.print-value{display:block;white-space:pre-wrap;overflow-wrap:anywhere;min-height:1.4em;font-weight:400}label{break-inside:avoid}h1{margin:.2em 0}}</style><body><small>First Career Steps · Personal worksheet</small><h1>" +
    escapeHTML(title) +
    '</h1><p class="actions">Edit this copy on your device. Choose Print or save as PDF to keep your changes.</p>' +
    '<div class="fields">' +
    lines +
    "</div>" +
    (rows
      ? "<h2>" +
        (slug === "lead-yourself"
          ? "Seven-day consistency grid"
          : "Honesty check") +
        '</h2><div class="rows">' +
        rows +
        "</div>"
      : "") +
    '<button class="actions" onclick="print()">Print or save as PDF</button><script>function prepare(){document.querySelectorAll(".print-value").forEach(e=>e.remove());document.querySelectorAll("textarea,select").forEach(e=>{let p=document.createElement("span");p.className="print-value";p.textContent=e.value;e.after(p)})}prepare();window.addEventListener("beforeprint",prepare);document.addEventListener("input",prepare);</script></body></html>'
  );
}
