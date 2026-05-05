import { createFileRoute } from "@tanstack/react-router";
import { Callout } from "../components/Callout";
import { CodeBlock } from "../components/CodeBlock";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/pre-commit")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/pre-commit"
			group="Workspace"
			title="Pre-commit hooks"
			tagline="A small script that runs every time you `git commit`. Used right, it catches the issues CI would catch, but in a second instead of three minutes."
		>
			<p>
				A pre-commit hook is just a shell script under <code>.git/hooks/</code>. The
				problem is that <code>.git/hooks/</code> is local to your machine and not
				tracked by git. <strong>husky</strong> solves that by storing the hooks under
				{" "}
				<code>.husky/</code> (in source control) and configuring git to look there.
			</p>

			<h2>Setting up husky</h2>
			<CodeBlock lang="sh">{`pnpm add -Dw husky
pnpm exec husky init`}</CodeBlock>
			<p>
				<code>husky init</code> creates <code>.husky/pre-commit</code> with a default
				script and adds a <code>"prepare": "husky"</code> entry to{" "}
				<code>package.json</code> so future installs wire up the hooks too.
			</p>

			<h2>What to actually run</h2>
			<p>The rule of thumb: anything that takes more than 5 seconds doesn't belong in pre-commit.</p>
			<table>
				<thead><tr><th>Check</th><th>Pre-commit?</th><th>Reason</th></tr></thead>
				<tbody>
					<tr><td><code>biome check --staged</code></td><td>Yes</td><td>Sub-second on small diffs.</td></tr>
					<tr><td><code>tsc --noEmit</code></td><td>No</td><td>Whole-program checks add several seconds.</td></tr>
					<tr><td><code>pnpm test</code></td><td>No</td><td>Vitest startup + test run blows the budget.</td></tr>
					<tr><td><code>pnpm run build</code></td><td>No</td><td>Way too slow.</td></tr>
				</tbody>
			</table>

			<Callout kind="tip" title="The CI/local split">
				<p>
					Pre-commit catches the cheap, common mistakes (formatting, simple lint
					rules) before you push. CI catches the expensive ones (typecheck, tests,
					build) before merge. Both together let you commit fast without breaking
					main.
				</p>
			</Callout>

			<h2>The hook itself</h2>
			<CodeBlock lang="sh" filename=".husky/pre-commit">{`#!/usr/bin/env sh
# Fast pre-commit gate. Anything heavier (typecheck, tests, build) runs in CI.
#
# We deliberately skip:
#   tsc, vitest, build  -> too slow for an interactive hook.
#
# We run:
#   biome check --staged -> formats + lint on the files in this commit only.

pnpm exec biome check --staged --no-errors-on-unmatched`}</CodeBlock>
			<p>
				Don't forget <code>chmod +x .husky/pre-commit</code> so git can execute it.
				husky's <code>init</code> does this automatically.
			</p>

			<h2>Skipping the hook on purpose</h2>
			<p>
				There are days when you want to commit broken-on-purpose code (mid-rebase,
				WIP). <code>git commit --no-verify</code> bypasses the hook. Use sparingly.
			</p>

			<h2>Common interview questions</h2>
			<ul>
				<li>
					<strong>Why have a pre-commit hook if CI runs the same checks?</strong>{" "}
					Faster feedback loop. Catching a missing semicolon at <code>git commit</code>
					{" "}
					is cheaper than waiting for the CI red X.
				</li>
				<li>
					<strong>Why not run the full test suite in pre-commit?</strong> Time. A
					3-minute hook gets bypassed immediately. Keep it under a few seconds.
				</li>
				<li>
					<strong>What does <code>biome --staged</code> do?</strong> Only check files
					currently staged for the commit. Much faster than checking the whole repo.
				</li>
			</ul>
		</TopicLayout>
	);
}
