import { createFileRoute } from "@tanstack/react-router";
import { Callout } from "../components/Callout";
import { CodeBlock } from "../components/CodeBlock";
import { Compare } from "../components/Compare";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/stylex")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/stylex"
			group="Frontend"
			title="StyleX"
			tagline="Atomic CSS-in-JS by Meta. Type-safe styles, compiled to atomic CSS classes at build time, with zero runtime cost."
		>
			<p>
				StyleX is the styling library Meta open-sourced from inside Facebook. The
				headline ideas are:
			</p>
			<ul>
				<li>Styles are written in TypeScript, with full IDE autocomplete and type checking.</li>
				<li>At build time, the compiler turns them into atomic CSS classes (one class per property/value pair, like Tailwind).</li>
				<li>The runtime is tiny: it just merges class names. No CSS parsing in the browser.</li>
				<li>Conflicts resolve last-write-wins, predictably.</li>
			</ul>

			<h2>The basic shape</h2>
			<CodeBlock lang="tsx" filename="Button.tsx">{`import * as stylex from "@stylexjs/stylex";

const styles = stylex.create({
  base: {
    padding: "8px 16px",
    borderRadius: 8,
    fontWeight: 600,
    cursor: "pointer",
  },
  primary: {
    backgroundColor: "#0a6cab",
    color: "white",
  },
  secondary: {
    backgroundColor: "transparent",
    color: "#0a6cab",
    border: "1px solid #0a6cab",
  },
});

export function Button({ variant = "primary", children }: Props) {
  return (
    <button
      type="button"
      {...stylex.props(styles.base, styles[variant])}
    >
      {children}
    </button>
  );
}`}</CodeBlock>

			<Callout kind="note" title="What stylex.props returns">
				<p>
					It returns a <code>className</code> + <code>style</code> object you spread on
					the element. The compiler turns each style key into a CSS class; the
					runtime concatenates them with last-write-wins so a later style overrides
					an earlier one for the same property.
				</p>
			</Callout>

			<h2>Conditional and merged styles</h2>
			<p>
				Combining styles is just an array. The compiler handles the merge.
			</p>
			<CodeBlock lang="tsx">{`<button
  {...stylex.props(
    styles.base,
    isPrimary && styles.primary,
    isDisabled && styles.disabled,
  )}
>
  Save
</button>`}</CodeBlock>

			<h2>Design tokens</h2>
			<p>
				StyleX has a first-class concept of design tokens (themed variables). You
				declare them once and reference them everywhere. Themes can swap entire token
				sets at runtime without re-rendering.
			</p>
			<CodeBlock lang="ts" filename="tokens.stylex.ts">{`import * as stylex from "@stylexjs/stylex";

export const tokens = stylex.defineVars({
  bg: "#ffffff",
  text: "#1f1d1a",
  accent: "#0a6cab",
  radius: "8px",
});`}</CodeBlock>
			<CodeBlock lang="tsx">{`import { tokens } from "./tokens.stylex";

const styles = stylex.create({
  card: {
    backgroundColor: tokens.bg,
    color: tokens.text,
    borderRadius: tokens.radius,
  },
});`}</CodeBlock>

			<h2>How it compares</h2>
			<Compare
				left={{
					title: "Tailwind",
					body: (
						<>
							<p>Strings of utility classes. Fast to type, small for a small app:</p>
							<CodeBlock lang="tsx">{`<button className="px-4 py-2 rounded-lg bg-blue-600 text-white">
  Save
</button>`}</CodeBlock>
						</>
					),
				}}
				right={{
					title: "StyleX",
					body: (
						<>
							<p>Typed objects. Refactor-safe, scales to a huge codebase:</p>
							<CodeBlock lang="tsx">{`<button {...stylex.props(styles.base, styles.primary)}>
  Save
</button>`}</CodeBlock>
						</>
					),
				}}
			/>

			<h2>Trade-offs</h2>
			<table>
				<thead><tr><th>StyleX wins</th><th>StyleX struggles</th></tr></thead>
				<tbody>
					<tr><td>Type safety on every property</td><td>Smaller community than Tailwind / CSS Modules</td></tr>
					<tr><td>Atomic CSS deduplicates across files</td><td>More setup (build plugin, plus runtime)</td></tr>
					<tr><td>No naming collisions</td><td>Editor tooling (autocomplete) is not as polished as Tailwind</td></tr>
					<tr><td>Themes built in</td><td>Some CSS features need the escape hatch <code>&#123; ":hover": &#123;...&#125; &#125;</code></td></tr>
				</tbody>
			</table>

			<h2>Common interview questions</h2>
			<ul>
				<li>
					<strong>What's atomic CSS?</strong> One class per property/value pair (e.g.
					{" "}
					<code>.p-4</code> for <code>padding: 16px</code>). The total CSS size grows
					with the number of unique values, not with the number of components.
				</li>
				<li>
					<strong>Why not just CSS Modules?</strong> CSS Modules are scoped, but
					still produce one class per component. Atomic CSS deduplicates across
					files. StyleX also gives you typed style keys.
				</li>
				<li>
					<strong>Is StyleX runtime or build-time?</strong> Mostly build-time. The
					compiler turns your <code>stylex.create</code> calls into a static atomic
					CSS file. The runtime just concatenates class names.
				</li>
				<li>
					<strong>How do you handle themes?</strong> <code>defineVars</code> creates
					CSS custom properties. Swap themes by toggling a class on the root and
					redefining the vars; no re-render needed.
				</li>
			</ul>
		</TopicLayout>
	);
}
