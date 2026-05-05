import { createFileRoute } from "@tanstack/react-router";
import { Callout } from "../components/Callout";
import { CodeBlock } from "../components/CodeBlock";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/monorepos")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/monorepos"
			group="Workspace"
			title="Monorepos with pnpm workspaces and Turborepo"
			tagline="One repo, many packages, shared types. The plumbing that lets a frontend, a backend, and shared libraries live together without going insane."
		>
			<p>
				A monorepo is a single Git repository that contains many related packages.
				Instead of <code>chirp-frontend</code>, <code>chirp-backend</code>, and
				{" "}
				<code>chirp-shared-types</code> in three repos, you put them all under one and
				let the tooling stitch them together.
			</p>

			<h2>Why bother</h2>
			<ul>
				<li>
					<strong>Shared types end-to-end.</strong> Define a <code>User</code> type once
					in a shared package; the API and the client both import the same definition.
					No copy-paste drift.
				</li>
				<li>
					<strong>Atomic changes.</strong> A breaking schema change can update the API,
					the client, and the shared types in the same PR.
				</li>
				<li>
					<strong>One install, one lockfile.</strong> One node_modules story for the
					whole repo means consistent versions of React, TypeScript, etc.
				</li>
				<li>
					<strong>Cheap new packages.</strong> Spinning up a new package is a folder, a
					{" "}
					<code>package.json</code>, and a sidebar entry; not a new repo with new CI.
				</li>
			</ul>

			<h2>pnpm workspaces: the package manager piece</h2>
			<p>
				pnpm is the npm/yarn alternative most modern stacks use. Its{" "}
				<code>workspaces</code> feature lets you treat sub-folders as installable
				packages.
			</p>

			<CodeBlock lang="yaml" filename="pnpm-workspace.yaml">{`packages:
  - "apps/*"
  - "packages/*"
  - "tooling/*"`}</CodeBlock>

			<CodeBlock lang="text">{`my-monorepo/
├── apps/
│   ├── api/                 (@chirp/api)
│   ├── client-user/         (@chirp/client-user)
│   └── client-admin/        (@chirp/client-admin)
├── packages/
│   ├── db-schema/           (@chirp/db-schema)
│   ├── proto/               (@chirp/proto)
│   └── shared-types/        (@chirp/shared-types)
├── pnpm-workspace.yaml
└── package.json`}</CodeBlock>

			<p>
				Inside <code>apps/api/package.json</code>, you can depend on a sibling package
				with the <code>workspace:</code> protocol:
			</p>
			<CodeBlock lang="json" filename="apps/api/package.json">{`{
  "name": "@chirp/api",
  "dependencies": {
    "@chirp/db-schema": "workspace:*",
    "@chirp/proto": "workspace:*"
  }
}`}</CodeBlock>

			<Callout kind="note" title="What workspace:* really does">
				<p>
					On install, pnpm symlinks <code>node_modules/@chirp/db-schema</code> to
					{" "}
					<code>../packages/db-schema</code>. Code in <code>apps/api</code> imports
					from <code>@chirp/db-schema</code> the same way it imports any npm package.
					When you publish the API, pnpm rewrites <code>workspace:*</code> to a real
					version range.
				</p>
			</Callout>

			<h3>Common pnpm workspace commands</h3>
			<CodeBlock lang="sh">{`# Run a script in every workspace package that has it
pnpm -r run build

# Run a script only in one package
pnpm --filter @chirp/api run dev

# Add a dependency to one package
pnpm --filter @chirp/api add zod

# Add a dev dependency at the root (used by every package)
pnpm add -Dw biome typescript

# Filter "this package and everything that depends on it"
pnpm --filter "...@chirp/db-schema" run typecheck`}</CodeBlock>

			<h2>Turborepo: the task runner piece</h2>
			<p>
				pnpm installs the packages. Turborepo decides what order to build them in,
				caches successful builds, and parallelises tasks that don't depend on each
				other.
			</p>

			<CodeBlock lang="json" filename="turbo.json">{`{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".output/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "lint": {
      "dependsOn": ["^proto:generate"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "dev": {
      "dependsOn": ["^proto:generate"],
      "cache": false,
      "persistent": true
    }
  }
}`}</CodeBlock>

			<p>The two key concepts:</p>
			<ul>
				<li>
					<strong><code>dependsOn: ["^build"]</code></strong>: build this package's
					{" "}
					<em>dependencies</em> first. The caret means "upstream packages".
				</li>
				<li>
					<strong><code>outputs</code></strong>: tell Turborepo where the build output
					lives so it knows what to cache.
				</li>
			</ul>

			<h3>Caching makes monorepos worth it</h3>
			<p>
				The first time you run <code>turbo run build</code>, every package builds. The
				second time, with no source changes, every package's task is "cache hit" and
				the whole thing finishes in milliseconds. Turborepo hashes inputs (source
				files, dependencies, environment variables) and looks up a cached output by
				hash.
			</p>

			<CodeBlock lang="sh">{`$ pnpm exec turbo run build
@chirp/proto:build: cache hit, replaying logs
@chirp/api:build: cache hit, replaying logs
@chirp/client-user:build: cache hit, replaying logs

 Tasks: 3 successful, 3 total
 Cached: 3 cached, 3 total
 Time: 90ms >>> FULL TURBO`}</CodeBlock>

			<h3>Filtering by what changed</h3>
			<p>
				In CI on a PR, you usually only want to validate packages that changed (and
				their dependents). Turborepo supports git-aware filters:
			</p>
			<CodeBlock lang="sh">{`# Build only packages whose source changed since main, plus packages
# that depend on them.
turbo run build --filter=...[origin/main]`}</CodeBlock>

			<h2>Shared TypeScript config</h2>
			<p>
				A common pattern: a <code>tooling/typescript</code> package exporting base
				tsconfig files, every other package extends one of them.
			</p>
			<CodeBlock lang="json" filename="tooling/typescript/tsconfig.base.json">{`{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true
  }
}`}</CodeBlock>

			<CodeBlock lang="json" filename="apps/api/tsconfig.json">{`{
  "extends": "@chirp/typescript-config/tsconfig.base.json",
  "compilerOptions": { "outDir": "dist" },
  "include": ["src"]
}`}</CodeBlock>

			<h2>Common interview questions</h2>
			<ul>
				<li>
					<strong>What problem does a monorepo solve?</strong> Sharing code between
					services without publishing private packages. Atomic, cross-service changes.
					One install, one lockfile.
				</li>
				<li>
					<strong>What does <code>dependsOn: ["^build"]</code> mean?</strong> Build the
					{" "}
					<em>upstream</em> packages first. The caret means "any package this one
					depends on". Without it, Turborepo would try to build A and B in parallel
					even if A imports B.
				</li>
				<li>
					<strong>Why use <code>workspace:*</code> instead of a real version?</strong>{" "}
					So your code always imports the in-repo source, not a published copy. On
					publish, pnpm rewrites the protocol to a real version range.
				</li>
				<li>
					<strong>What does Turborepo cache?</strong> The output of a task, keyed by
					inputs. If inputs (files, env vars, deps) match a previous run, it replays
					the logs and copies the cached output back into place.
				</li>
			</ul>
		</TopicLayout>
	);
}
