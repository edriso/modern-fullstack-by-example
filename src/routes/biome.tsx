import { createFileRoute } from "@tanstack/react-router";
import { Callout } from "../components/Callout";
import { CodeBlock } from "../components/CodeBlock";
import { Compare } from "../components/Compare";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/biome")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/biome"
			group="Workspace"
			title="Biome"
			tagline="A linter and formatter in one binary. Replaces ESLint plus Prettier with a tool that's about 25x faster and needs almost no config."
		>
			<p>
				Biome is the modern alternative to the ESLint + Prettier combo. It is written
				in Rust, so it's fast. It does both linting and formatting from one config.
				It comes with a default rule set that is sane for most projects.
			</p>

			<Compare
				left={{
					title: "ESLint + Prettier",
					body: (
						<>
							<p>Two tools, two configs, frequent fights:</p>
							<CodeBlock lang="text">{`.eslintrc.cjs
.eslintignore
.prettierrc
.prettierignore
eslint-config-prettier
eslint-plugin-prettier
8 plugins, 200 lines of config`}</CodeBlock>
						</>
					),
				}}
				right={{
					title: "Biome",
					body: (
						<>
							<p>One tool, one config:</p>
							<CodeBlock lang="text">{`biome.json
(50 lines or fewer for most repos)`}</CodeBlock>
						</>
					),
				}}
			/>

			<h2>Installing and configuring</h2>
			<CodeBlock lang="sh">{`pnpm add -Dw @biomejs/biome
pnpm exec biome init`}</CodeBlock>

			<CodeBlock lang="json" filename="biome.json">{`{
  "$schema": "https://biomejs.dev/schemas/2.3.11/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "includes": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.json"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "error"
      },
      "suspicious": {
        "noExplicitAny": "warn"
      }
    }
  }
}`}</CodeBlock>

			<h2>Day-to-day commands</h2>
			<CodeBlock lang="sh">{`# Check everything (lint + format)
pnpm exec biome check .

# Auto-fix what's safe.
pnpm exec biome check --write .

# Apply unsafe fixes too (rule-of-thumb fixes that change semantics).
pnpm exec biome check --write --unsafe .

# Format only.
pnpm exec biome format --write .

# Lint only.
pnpm exec biome lint .

# Only check files staged for commit (great for pre-commit hooks).
pnpm exec biome check --staged`}</CodeBlock>

			<h2>The recommended preset</h2>
			<p>
				<code>"recommended": true</code> turns on a curated set of rules. The most
				important categories:
			</p>
			<ul>
				<li>
					<strong>correctness</strong>: real bugs (unused vars, used-before-declaration,
					unreachable code).
				</li>
				<li>
					<strong>suspicious</strong>: probably a bug (<code>== </code> instead of
					{" "}
					<code>===</code>, accidental <code>any</code>).
				</li>
				<li>
					<strong>style</strong>: stylistic ("use const", "prefer template strings").
				</li>
				<li>
					<strong>a11y</strong>: accessibility issues in JSX.
				</li>
				<li>
					<strong>performance</strong>: known-slow patterns.
				</li>
			</ul>

			<h2>Per-rule severity</h2>
			<p>
				Each rule can be <code>"off"</code>, <code>"warn"</code>, or <code>"error"</code>.
				Errors fail the CI step; warnings don't.
			</p>
			<CodeBlock lang="json">{`"linter": {
  "rules": {
    "recommended": true,
    "correctness": {
      "useExhaustiveDependencies": "warn",
      "noInvalidUseBeforeDeclaration": "warn"
    },
    "suspicious": {
      "noExplicitAny": "warn"
    }
  }
}`}</CodeBlock>

			<h2>Ignoring generated files</h2>
			<p>
				Generated files (<code>routeTree.gen.ts</code>, protobuf output) usually fail
				rules they shouldn't have to follow. Ignore them by adding to
				{" "}
				<code>files.includes</code> with a leading <code>!</code>:
			</p>
			<CodeBlock lang="json">{`"files": {
  "includes": [
    "**/*.ts",
    "**/*.tsx",
    "!**/routeTree.gen.ts",
    "!packages/proto/generated"
  ]
}`}</CodeBlock>

			<h2>Editor integration</h2>
			<p>
				Install the Biome extension for VS Code (or your editor). Tell the editor to
				use Biome as the default formatter. Format-on-save and lint underlines work
				like Prettier+ESLint.
			</p>

			<Callout kind="warn" title="Don't have both Prettier and Biome on save">
				<p>
					If you migrate from Prettier, uninstall the Prettier extension or your
					editor will fight itself. The Biome docs have a "migrate from Prettier"
					script that converts <code>.prettierrc</code> settings.
				</p>
			</Callout>

			<h2>Common interview questions</h2>
			<ul>
				<li>
					<strong>Why Biome over ESLint + Prettier?</strong> Speed and simplicity. One
					tool, one config, written in Rust. ESLint's plugin ecosystem is bigger, but
					most projects don't need exotic plugins.
				</li>
				<li>
					<strong>Difference between safe and unsafe fixes?</strong> Safe fixes don't
					change observable behaviour (formatting, removing unused imports). Unsafe
					fixes might (turning <code>let</code> to <code>const</code>, simplifying
					expressions). <code>--write</code> applies safe; <code>--write --unsafe</code>
					{" "}
					applies both.
				</li>
				<li>
					<strong>How do you keep it from blocking weird-but-correct code?</strong>{" "}
					Per-line ignore comments: <code>// biome-ignore lint/suspicious/noExplicitAny: reason</code>.
					Or downgrade the rule to <code>"warn"</code> in <code>biome.json</code>.
				</li>
			</ul>
		</TopicLayout>
	);
}
