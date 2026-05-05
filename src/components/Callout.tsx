import type { ReactNode } from "react";

interface CalloutProps {
	kind?: "note" | "tip" | "warn";
	title?: string;
	children: ReactNode;
}

/**
 * Inline highlight box for "remember this" / "watch out for that".
 * Three variants tuned by colour: note (default), tip, warn.
 */
export function Callout({ kind = "note", title, children }: CalloutProps) {
	const cls = `callout callout--${kind}`;
	const defaultTitle = kind === "tip" ? "Tip" : kind === "warn" ? "Heads up" : "Note";
	return (
		<aside className={cls}>
			<p className="callout__title">{title ?? defaultTitle}</p>
			{children}
		</aside>
	);
}
