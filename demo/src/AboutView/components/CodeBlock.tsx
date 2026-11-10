import { useState } from "react";

type CodeBlockProps = { title: string; code: string };

export default function CodeBlock({ title, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="code-block">
      <div className="code-header">
        <span>{title}</span>
        <button type="button" onClick={copyCode}>
          {copied ? "COPIED" : "COPY"}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </section>
  );
}
