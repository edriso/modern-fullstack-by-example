/**
 * The single source of truth for the curriculum.
 *
 * Adding a topic is two steps:
 *   1. Add an entry to TOPICS below.
 *   2. Create the matching route file at src/routes/<slug>.tsx.
 *
 * The sidebar, the welcome page, and the prev/next pager all derive from this
 * list, so the order here is also the reading order.
 */

export interface Topic {
	slug: string;
	title: string;
	tagline: string;
	group: string;
}

export const TOPICS: Topic[] = [
	{
		slug: "/",
		title: "Welcome",
		tagline: "How to use this handbook and how the topics fit together.",
		group: "Start here",
	},

	{
		slug: "/typescript",
		title: "TypeScript fundamentals",
		tagline: "Strict mode, generics, and the type tricks you keep seeing.",
		group: "Language",
	},
	{
		slug: "/react",
		title: "Modern React",
		tagline: "Hooks, effect dependencies, and what changed in React 19.",
		group: "Language",
	},

	{
		slug: "/tanstack-router",
		title: "TanStack Router",
		tagline: "File-based routing, params, search params, and loaders.",
		group: "Frontend",
	},
	{
		slug: "/tanstack-start",
		title: "TanStack Start",
		tagline: "SSR, server functions, and how the BFF pattern fits in.",
		group: "Frontend",
	},
	{
		slug: "/stylex",
		title: "StyleX",
		tagline: "Atomic CSS-in-JS by Meta, compared with CSS Modules and Tailwind.",
		group: "Frontend",
	},

	{
		slug: "/monorepos",
		title: "Monorepos",
		tagline: "pnpm workspaces and Turborepo: one repo, many packages.",
		group: "Workspace",
	},
	{
		slug: "/biome",
		title: "Biome",
		tagline: "Linter and formatter in one binary, replacing ESLint and Prettier.",
		group: "Workspace",
	},
	{
		slug: "/ci-cd",
		title: "CI with GitHub Actions",
		tagline: "Run typecheck, lint, tests, and builds on every PR.",
		group: "Workspace",
	},
	{
		slug: "/pre-commit",
		title: "Pre-commit hooks",
		tagline: "husky and biome --staged for sub-second local checks.",
		group: "Workspace",
	},

	{
		slug: "/protobuf-grpc",
		title: "Protocol Buffers and gRPC",
		tagline: "What protobuf is and why a typed RPC protocol beats hand-rolled REST.",
		group: "Backend",
	},
	{
		slug: "/bff",
		title: "The BFF pattern",
		tagline: "Backend-for-frontend: why you might want one and where auth lives.",
		group: "Backend",
	},
	{
		slug: "/auth",
		title: "Auth: hashing, JWT, sessions",
		tagline: "bcrypt, JWT pinning, and iron-session cookies done right.",
		group: "Backend",
	},
	{
		slug: "/errors",
		title: "Error handling",
		tagline: "A domain error taxonomy that maps cleanly to gRPC and HTTP.",
		group: "Backend",
	},
	{
		slug: "/observability",
		title: "Observability",
		tagline: "Trace IDs, AsyncLocalStorage, and structured JSON logs.",
		group: "Backend",
	},

	{
		slug: "/drizzle",
		title: "Drizzle ORM",
		tagline: "Type-safe SQL without the heavyweight feel of an ORM.",
		group: "Data",
	},
	{
		slug: "/schema",
		title: "Schema and relations",
		tagline: "Designing tables, indexes, foreign keys, and timestamps.",
		group: "Data",
	},
	{
		slug: "/n-plus-one",
		title: "The N+1 query problem",
		tagline: "Why your endpoint that looks fine in dev brings prod down.",
		group: "Data",
	},

	{
		slug: "/vitest",
		title: "Unit testing with Vitest",
		tagline: "Mocking modules, in-memory DBs, and isolation per test.",
		group: "Testing",
	},
	{
		slug: "/playwright",
		title: "End-to-end with Playwright",
		tagline: "Real browser tests, fixtures, and avoiding flake.",
		group: "Testing",
	},

	{
		slug: "/big-picture",
		title: "The big picture",
		tagline: "Tracing one click through every layer of the stack.",
		group: "Wrap-up",
	},
];

export function getTopicIndex(slug: string): number {
	return TOPICS.findIndex((t) => t.slug === slug);
}

export function getNeighbors(slug: string): { prev?: Topic; next?: Topic } {
	const i = getTopicIndex(slug);
	if (i === -1) return {};
	return {
		prev: i > 0 ? TOPICS[i - 1] : undefined,
		next: i < TOPICS.length - 1 ? TOPICS[i + 1] : undefined,
	};
}

export function groupedTopics(): { group: string; items: Topic[] }[] {
	const groups: { group: string; items: Topic[] }[] = [];
	for (const topic of TOPICS) {
		const last = groups[groups.length - 1];
		if (last && last.group === topic.group) {
			last.items.push(topic);
		} else {
			groups.push({ group: topic.group, items: [topic] });
		}
	}
	return groups;
}
