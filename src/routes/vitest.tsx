import { createFileRoute } from "@tanstack/react-router";
import { Callout } from "../components/Callout";
import { CodeBlock } from "../components/CodeBlock";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/vitest")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/vitest"
			group="Testing"
			title="Unit testing with Vitest"
			tagline="Vitest is a Vite-native test runner. Same syntax as Jest, much faster startup, and built-in TypeScript support."
		>
			<p>
				If you have used Jest, you already know 90% of Vitest. The remaining 10% is
				about the tooling fit: Vitest reads your <code>vite.config.ts</code>, runs
				ESM-native, supports TypeScript without transform setup, and starts in a
				fraction of the time.
			</p>

			<h2>The basics</h2>
			<CodeBlock lang="ts" filename="src/services/posts.test.ts">{`import { describe, expect, it, vi, beforeEach } from "vitest";
import { createPost } from "./posts.service";

describe("createPost", () => {
  beforeEach(() => {
    // Reset mocks etc.
  });

  it("rejects empty content", async () => {
    await expect(
      createPost({ content: "", authorId: "u_1" }),
    ).rejects.toThrow("Post content is required");
  });

  it("returns the new post id", async () => {
    const result = await createPost({ content: "Hi", authorId: "u_1" });
    expect(result.postId).toMatch(/^[\\w-]+$/);
  });
});`}</CodeBlock>

			<h2>Mocks</h2>
			<p>
				<code>vi.mock(modulePath, factory)</code> replaces a module for the test file.
				Calls to the real module become calls to the factory's exports.
			</p>
			<CodeBlock lang="ts">{`vi.mock("../db", async () => {
  const { drizzle } = await import("drizzle-orm/libsql");
  const { createClient } = await import("@libsql/client");
  const schema = await import("@chirp/db-schema");

  const client = createClient({ url: ":memory:" });
  const db = drizzle(client, { schema });

  // Create the tables once per file.
  await client.execute(\`CREATE TABLE users (...);\`);
  return { db, schema, client };
});`}</CodeBlock>
			<Callout kind="note" title="vi.mock is hoisted">
				<p>
					Vitest moves <code>vi.mock()</code> calls to the top of the file at compile
					time. That's why mocks "see" imports that come below them in source order.
				</p>
			</Callout>

			<h3>Mocking a single function</h3>
			<CodeBlock lang="ts">{`vi.mock("../services/auth.service", () => ({
  registerUser: vi.fn(),
  loginUser: vi.fn(),
}));

import { registerUser } from "../services/auth.service";

it("returns the user id on success", async () => {
  vi.mocked(registerUser).mockResolvedValue({ userId: "u_1", sessionToken: "tok" });

  const result = await authHandler.register({ email: "a@b.c", password: "x", ... });
  expect(result.userId).toBe("u_1");
});`}</CodeBlock>

			<h2>In-memory database for service tests</h2>
			<p>
				The fastest, most realistic way to test database logic: replace the file-based
				SQLite with an in-memory one per test file. No mocks of the ORM, real SQL,
				real isolation.
			</p>
			<CodeBlock lang="ts" filename="apps/api/tests/setup.ts">{`import { beforeEach, vi } from "vitest";

vi.mock("../src/db", async () => {
  const { drizzle } = await import("drizzle-orm/libsql");
  const { createClient } = await import("@libsql/client");
  const schema = await import("@chirp/db-schema");

  const client = createClient({ url: ":memory:" });
  const db = drizzle(client, { schema });

  // Create tables. Best to keep the SQL in step with the migration files.
  await client.execute(\`CREATE TABLE users (...);\`);
  // ... more tables ...

  return { db, schema, client };
});

// Truncate before each test. Enumerate tables from sqlite_master so a new
// table doesn't silently leak rows to the next test.
beforeEach(async () => {
  const { client } = await import("../src/db");
  const result = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
  );
  for (const row of result.rows) {
    await client.execute(\`DELETE FROM "\${row.name}"\`);
  }
});`}</CodeBlock>
			<Callout kind="tip" title="Per-file, not per-test">
				<p>
					<code>vi.mock</code> runs once per test file. The DB is shared across tests
					in the file but truncated between them. That's the right speed/safety
					tradeoff: real schema, real queries, no cross-test bleed.
				</p>
			</Callout>

			<h2>Async assertions</h2>
			<CodeBlock lang="ts">{`// expect a promise to reject:
await expect(loadPost("missing")).rejects.toThrow("Post not found");

// expect a promise to resolve to a value:
await expect(getCount()).resolves.toBe(7);

// custom matchers
expect(result).toMatchObject({ ok: true, data: expect.any(Array) });
expect(result.posts).toHaveLength(10);`}</CodeBlock>

			<h2>Spies and timer mocks</h2>
			<CodeBlock lang="ts">{`// Spy on an existing function.
const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
doThing();
expect(spy).toHaveBeenCalledWith("expected message");
spy.mockRestore();

// Fake timers.
vi.useFakeTimers();
const fn = vi.fn();
setTimeout(fn, 5000);
vi.advanceTimersByTime(5000);
expect(fn).toHaveBeenCalled();
vi.useRealTimers();`}</CodeBlock>

			<h2>Speeding tests up</h2>
			<ul>
				<li>
					<strong>Hash work goes to test cost factor.</strong> If you use bcrypt with
					cost 12 in tests, the suite spends most of its time hashing. Drop to cost 4
					under <code>VITEST=true</code>.
				</li>
				<li>
					<strong>Use in-memory SQLite</strong>, not the on-disk file. Saves disk I/O
					and gives you trivial isolation.
				</li>
				<li>
					<strong>Run tests in parallel by file</strong> (Vitest does by default), but
					not multi-threaded inside a single file. Tests in one file should share the
					mocked DB.
				</li>
			</ul>

			<h2>Common interview questions</h2>
			<ul>
				<li>
					<strong>How is Vitest different from Jest?</strong> Vitest reads the same
					Vite config the app uses, so TypeScript and path aliases just work. Faster
					startup. Same API for the most part.
				</li>
				<li>
					<strong>What does <code>vi.mock()</code> do?</strong> Replaces an entire
					module for the test file with a factory's return value. Hoisted to the top
					so imports below see the mock.
				</li>
				<li>
					<strong>How do you avoid cross-test contamination?</strong> Reset state
					before each test. For DB tests, truncate tables. For module-level state,
					reset variables in <code>beforeEach</code>.
				</li>
				<li>
					<strong>When do you mock vs use a real dependency?</strong> Use real for
					anything cheap and deterministic (in-memory DB, pure functions). Mock for
					anything slow or non-deterministic (network calls, time-based logic, third
					-party APIs).
				</li>
			</ul>
		</TopicLayout>
	);
}
