"use client";
import { useRef, useState } from "react";
import type { CopyPrompt } from "@/lib/classes/prompt-sheet";
export default function PromptBlock({
  prompt,
  expanded,
}: {
  prompt: CopyPrompt;
  expanded: boolean;
}) {
  const ref = useRef<HTMLPreElement>(null);
  const [status, setStatus] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt.text);
      setStatus("Prompt copied.");
    } catch {
      const block = ref.current;
      if (block) {
        block.focus();
        const range = document.createRange();
        range.selectNodeContents(block);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      setStatus("Use your device’s Copy command to copy the selected prompt.");
    }
  }
  return (
    <details className="sc-prompt" open={expanded}>
      <summary>{prompt.title}</summary>
      <p>{prompt.use}</p>
      <pre tabIndex={0} ref={ref}>
        {prompt.text}
      </pre>
      <button type="button" onClick={copy}>
        Copy prompt
      </button>
      <span role="status">{status}</span>
    </details>
  );
}
