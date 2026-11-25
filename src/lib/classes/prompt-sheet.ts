import { escapeHTML, type Fields } from "./worksheets";

export interface CopyPrompt {
  id: number;
  title: string;
  use: string;
  text: string;
  worksheet: boolean;
  compact?: string;
}
export interface PromptSheet {
  prompts: CopyPrompt[];
  fields: { key: string; label: string }[];
  reminders: string[];
}

// The download is self-contained. A learner can edit it or print their current answers offline.
export function promptSheetFile(
  title: string,
  sheet: PromptSheet,
  values: Fields,
) {
  const esc = escapeHTML;
  const prompts = sheet.prompts.filter((p) => p.worksheet);
  const front = prompts.filter((p) => p.compact);
  const back = prompts.filter((p) => !p.compact);
  function block(p: CopyPrompt, compact = false) {
    return (
      '<section class="prompt"><h3>' +
      esc(p.title) +
      "</h3><p>" +
      esc(p.use) +
      '</p><pre tabindex="0">' +
      esc(compact ? p.compact! : p.text) +
      '</pre><button type="button" class="copy screen">Copy prompt</button></section>'
    );
  }
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>
*{box-sizing:border-box}body{margin:1.4rem auto;max-width:58rem;padding:0 1rem;color:#183448;font:16px/1.45 system-ui,sans-serif}h1,h2,h3{line-height:1.16}h1{font-size:1.95rem}h2{font-size:1.35rem}h3{font-size:1.05rem;margin-bottom:.25rem}label{display:block;margin:.75rem 0;font-weight:650}textarea,pre{width:100%;padding:.6rem;font:inherit;border:1px solid #adc0c7;border-radius:4px;white-space:pre-wrap;overflow-wrap:anywhere}textarea{min-height:4rem}pre{background:#f5f8f9;margin:.3rem 0}.prompt{margin:.8rem 0}.prompt p{margin:.15rem 0}button{padding:.5rem .8rem;min-height:44px;color:#103e52;background:white;border:1px solid #688896;border-radius:4px;cursor:pointer}.print-only,.print-value{display:none}.footer{margin-top:.8rem}.screen:focus-visible,textarea:focus-visible,pre:focus-visible{outline:3px solid #186f8d}
@page{size:letter;margin:.45in}@media print{body{max-width:none;margin:0;padding:0;font-size:9.4pt;line-height:1.17}.screen,textarea{display:none!important}.print-only,.print-value{display:block}.print-value{min-height:1.6em;white-space:pre-wrap;font-weight:400;border-bottom:1px solid #a1b1b7}.back{break-before:page}.columns{column-count:2;column-gap:.22in}.prompt{break-inside:avoid;margin:0 0 .1in}.prompt h3{font-size:10.3pt;margin:.05in 0}.prompt p{font-size:9pt}pre{font-size:9pt;line-height:1.16;padding:.04in;border:0;background:white}h1{font-size:18pt;margin:.06in 0}h2{font-size:12pt;margin:.12in 0 .04in}.footer{font-size:9pt}ul{padding-left:.18in}label{margin:.08in 0;break-inside:avoid}}
</style></head><body><h1>${esc(title)}</h1><p class="screen">Keep this file on your device. Edit it here, then use Print or save as PDF to keep your changes.</p><ul>${sheet.reminders.map((s) => "<li>" + esc(s) + "</li>").join("")}</ul>
<h2>My practice</h2>${sheet.fields.map((f) => "<label>" + esc(f.label) + "<textarea>" + esc(values[f.key] || "") + "</textarea></label>").join("")}
${front.length ? '<div class="print-only"><h2>More prompts to reuse</h2><div class="columns">' + front.map((p) => block(p, true)).join("") + "</div></div>" : ""}
<p class="footer">AI can be wrong. Completing this class is not a certificate or credential. FirstCareerSteps.com</p>
<div class="back"><h2>Copy-ready prompts</h2><div class="columns">${back.map((p) => block(p)).join("")}</div>${front.length ? '<div class="screen">' + front.map((p) => block(p)).join("") + "</div>" : ""}</div>
<p role="status" class="screen" id="message"></p><button class="screen" onclick="window.print()">Print or save as PDF</button>
<script>function prepare(){for(const el of document.querySelectorAll('textarea')){let out=el.nextElementSibling;if(!out){out=document.createElement('span');out.className='print-value';el.after(out)}out.textContent=el.value}}prepare();document.addEventListener('input',prepare);window.addEventListener('beforeprint',prepare);document.addEventListener('click',async e=>{if(!e.target.matches('button.copy'))return;const pre=e.target.previousElementSibling;try{await navigator.clipboard.writeText(pre.textContent);document.getElementById('message').textContent='Prompt copied.'}catch{const range=document.createRange();range.selectNodeContents(pre);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);pre.focus();document.getElementById('message').textContent='Prompt selected. Use your device’s Copy command.'}})</script></body></html>`;
}
