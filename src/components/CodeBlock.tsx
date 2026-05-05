import { useState } from "react";

interface CodeBlockProps {
	lang?: string;
	filename?: string;
	children: string;
}

/**
 * A small wrapper that shows a header (language/filename + copy button) and
 * a <pre><code> block. We don't pull in a heavy syntax-highlighter dependency
 * because the goal of this site is content, not chrome. If you want true
 * highlighting later, swap the inner <code> with shiki/prism.
 */
export function CodeBlock({ lang = "ts", filename, children }: CodeBlockProps) {
	const [copied, setCopied] = useState(false);

	async function copy() {
		try {
			await navigator.clipboard.writeText(children);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			// Clipboard might be unavailable in the browser context (e.g., insecure
			// origin). Silently ignore; the user can still select-and-copy.
		}
	}

	return (
		<div className="codeblock">
			<div className="codeblock__header">
				<span className="codeblock__lang">{filename ?? lang}</span>
				<button type="button" onClick={copy} className="codeblock__copy">
					{copied ? "copied" : "copy"}
				</button>
			</div>
			<pre>
				<code>{children}</code>
			</pre>
		</div>
	);
}
