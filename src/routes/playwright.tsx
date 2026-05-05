import { createFileRoute } from "@tanstack/react-router";
import { Callout } from "../components/Callout";
import { CodeBlock } from "../components/CodeBlock";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/playwright")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/playwright"
			group="Testing"
			title="End-to-end with Playwright"
			tagline="Real browser tests against your real app, plus the patterns that keep them from going flaky."
		>
			<p>
				Playwright drives a real browser (Chromium, Firefox, or WebKit) through real
				user actions and verifies real DOM. It is the gold standard for end-to-end
				(E2E) testing of web apps. The trade-off is that E2E tests are slower and
				flakier than unit tests, so you reach for them only for the flows you
				actually need to protect.
			</p>

			<h2>The shape of a test</h2>
			<CodeBlock lang="ts" filename="tests/e2e/auth.spec.ts">{`import { test, expect } from "@playwright/test";

test.describe("Login", () => {
  test("logs in with valid credentials", async ({ page }) => {
    await page.goto("/auth/login");
    await page.fill('input[name="email"]', "alice@test.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Auto-waiting: this assertion retries until the URL changes or times out.
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: /welcome/i })).toBeVisible();
  });

  test("rejects bad password", async ({ page }) => {
    await page.goto("/auth/login");
    await page.fill('input[name="email"]', "alice@test.com");
    await page.fill('input[name="password"]', "wrong");
    await page.click('button[type="submit"]');
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });
});`}</CodeBlock>

			<h2>Selectors: prefer roles over CSS</h2>
			<table>
				<thead><tr><th>What it is</th><th>Use when</th></tr></thead>
				<tbody>
					<tr><td><code>getByRole("button", &#123; name: "Save" &#125;)</code></td><td>Default. Mirrors how a screen reader sees the page.</td></tr>
					<tr><td><code>getByLabel("Email")</code></td><td>Form fields.</td></tr>
					<tr><td><code>getByText(/welcome/i)</code></td><td>Reading visible content.</td></tr>
					<tr><td><code>getByTestId("post-card")</code></td><td>Last resort. Add <code>data-testid</code> when nothing else fits.</td></tr>
					<tr><td><code>page.locator(".my-class")</code></td><td>Don't, except for one-off cases. Class names break under refactors.</td></tr>
				</tbody>
			</table>

			<h2>Auto-waiting beats <code>sleep</code></h2>
			<p>
				Playwright assertions and actions auto-wait for the page to be ready. If a
				button isn't there yet, <code>click</code> waits for it (up to a timeout).
				This means you almost never need <code>page.waitForTimeout(N)</code>.
			</p>
			<CodeBlock lang="ts">{`// Bad: arbitrary wait. Slow on fast machines, flaky on slow ones.
await page.waitForTimeout(2000);
await page.click("button");

// Good: wait for the thing to be ready, then act.
await page.click("button");

// Good: assert the result, retrying until it appears.
await expect(page.getByText("Saved")).toBeVisible();`}</CodeBlock>

			<h2>The two flake sources to know about</h2>
			<ol>
				<li>
					<strong>Shared state across tests.</strong> If every test logs in as
					{" "}
					<code>alice</code> and creates a post, two tests running in parallel will
					see each other's posts. Either give each test a fresh user (registering on
					the fly) or run serially.
				</li>
				<li>
					<strong>Race between server-rendered HTML and client hydration.</strong>{" "}
					Click too early and you click a server-rendered button that the client
					hasn't attached a handler to yet. Wait for a known post-hydration signal:
					{" "}
					<code>networkidle</code>, a specific element appearing, or a
					<code>data-hydrated</code> attribute.
				</li>
			</ol>

			<h2>Fixtures: shared setup</h2>
			<p>
				Playwright fixtures are values created per test and torn down after. Useful
				for "log in once at the start of every test in this file":
			</p>
			<CodeBlock lang="ts" filename="tests/e2e/fixtures.ts">{`import { test as base } from "@playwright/test";

export const test = base.extend<{ authedPage: typeof base.Page }>({
  authedPage: async ({ page }, use) => {
    await page.goto("/auth/login");
    await page.fill('input[name="email"]', "alice@test.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/");
    await use(page);
  },
});`}</CodeBlock>
			<CodeBlock lang="ts">{`import { test, expect } from "./fixtures";

test("authed page", async ({ authedPage }) => {
  await authedPage.goto("/profile");
  await expect(authedPage.getByText("alice")).toBeVisible();
});`}</CodeBlock>

			<h2>Configuration knobs that matter</h2>
			<CodeBlock lang="ts" filename="playwright.config.ts">{`import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "html" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",        // record once on retry; helps debug flakes
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
});`}</CodeBlock>

			<Callout kind="tip" title="Run a tracing-enabled test once when something breaks">
				<p>
					<code>trace: "on-first-retry"</code> records a full Playwright trace on the
					second attempt. Open the trace in <code>playwright show-trace</code> and you
					see every action, screenshot, and network call. The single best debugging
					tool for flake.
				</p>
			</Callout>

			<h2>Speed tips</h2>
			<ul>
				<li>
					<strong>Reuse the dev server.</strong> Configure <code>webServer</code> in
					{" "}
					<code>playwright.config.ts</code> so Playwright starts your app once and
					tears it down at the end.
				</li>
				<li>
					<strong>Don't test what unit tests already cover.</strong> E2E tests are
					expensive. Test the critical user paths (sign up, log in, primary action).
					Unit-test everything else.
				</li>
				<li>
					<strong>Avoid logging in for every test.</strong> Use storage state: log in
					once in a setup project, save the cookies, every test loads them.
				</li>
			</ul>

			<h2>Common interview questions</h2>
			<ul>
				<li>
					<strong>When would you write an E2E test instead of a unit test?</strong>{" "}
					When you need to verify the integration: real browser, real network, real
					DB. The most-protected paths usually have one E2E happy-path plus many unit
					tests for branches.
				</li>
				<li>
					<strong>How do you avoid flaky E2E tests?</strong> Use auto-waiting, never
					{" "}
					<code>sleep</code>. Don't share data between tests. Use stable selectors
					(roles, labels). Run with retries on CI. Capture traces to debug what
					happened.
				</li>
				<li>
					<strong>What's <code>trace: "on-first-retry"</code> for?</strong> Records
					the second attempt of a failing test in detail. Trace files are
					interactive; you scrub through every action.
				</li>
				<li>
					<strong>How do you handle authentication in tests?</strong> A fixture that
					logs in via the UI, or storage-state files: log in once at setup, save the
					cookies, every test starts already authenticated.
				</li>
			</ul>
		</TopicLayout>
	);
}
