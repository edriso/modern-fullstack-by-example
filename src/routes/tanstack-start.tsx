import { createFileRoute } from "@tanstack/react-router";
import { Callout } from "../components/Callout";
import { CodeBlock } from "../components/CodeBlock";
import { Compare } from "../components/Compare";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/tanstack-start")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/tanstack-start"
			group="Frontend"
			title="TanStack Start"
			tagline="A full-stack React framework built around TanStack Router, with SSR and server functions."
		>
			<p>
				TanStack Start is a full-stack framework. Think of it as TanStack Router with
				batteries: a Node server, server-side rendering (SSR), server functions you can
				call from the client, and the build pipeline that ties them together. If you
				are coming from Next.js, the closest comparison is the App Router; if you are
				coming from Remix, this is what Remix-on-Vite ended up looking like.
			</p>

			<Callout kind="tip" title="One sentence summary">
				<p>
					TanStack Router gives you typed routes. TanStack Start gives you a server to
					run those routes on, server-side data loading, and a way to call typed server
					code from the client.
				</p>
			</Callout>

			<h2>What server-side rendering means here</h2>
			<p>
				When the user navigates to a page, the server runs the route's loader, renders
				the React tree to HTML, and sends that HTML in the first response. The browser
				shows content immediately. JavaScript hydrates the page so it becomes interactive.
				Subsequent navigations use the client router (no full page reload).
			</p>
			<Compare
				left={{
					title: "CRA / Vite SPA",
					body: (
						<>
							<p>Browser receives an empty shell:</p>
							<CodeBlock lang="html">{`<div id="root"></div>
<script src="/main.js"></script>`}</CodeBlock>
							<p>JS loads, calls APIs, fills the page.</p>
						</>
					),
				}}
				right={{
					title: "TanStack Start (SSR)",
					body: (
						<>
							<p>Browser receives a full page:</p>
							<CodeBlock lang="html">{`<div id="root">
  <h1>Welcome, Alice</h1>
  <ul>...</ul>
</div>
<script src="/main.js"></script>`}</CodeBlock>
							<p>JS hydrates and takes over.</p>
						</>
					),
				}}
			/>

			<h2>Server functions: the killer feature</h2>
			<p>
				A server function is a function you write once and can call from a client
				component as if it were a normal function. Behind the scenes, the framework
				generates an HTTP endpoint and the call becomes a fetch.
			</p>
			<CodeBlock lang="tsx" filename="src/server/functions/posts.ts">{`import { createServerFn } from "@tanstack/react-start";

export const getPosts = createServerFn({ method: "GET" })
  .handler(async () => {
    // This code runs only on the server. You can use a database
    // client, secrets, anything Node has access to.
    return await db.select().from(posts).all();
  });

export const createPost = createServerFn({ method: "POST" })
  .inputValidator((d: { content: string }) => d) // runtime validation
  .handler(async ({ data }) => {
    return await db.insert(posts).values({ id: crypto.randomUUID(), ...data });
  });`}</CodeBlock>

			<CodeBlock lang="tsx" filename="src/routes/feed.tsx">{`import { getPosts, createPost } from "../server/functions/posts";

function Feed() {
  // Calling getPosts() from a client component still works:
  // the framework rewrites it into a fetch to the generated endpoint.
  const posts = useServerFn(getPosts);

  async function add() {
    await createPost({ data: { content: "Hello" } });
    posts.refetch();
  }
}`}</CodeBlock>
			<Callout kind="warn" title="Where does each line run?">
				<p>
					Anything inside <code>handler()</code> runs only on the server. Anything in a
					component file runs on both server (during SSR) and client. Don't import a
					database driver into a route component file: the bundler will try to ship it
					to the browser. Keep server-only modules in <code>src/server/**</code> and
					import them only from server functions.
				</p>
			</Callout>

			<h2>SSR pitfalls juniors hit</h2>
			<ul>
				<li>
					<strong><code>window</code> and <code>document</code> don't exist on the
					server.</strong> If you read them at module scope or during render, SSR
					crashes. Fix: read them inside <code>useEffect</code>, or guard with
					{" "}
					<code>typeof window !== "undefined"</code>.
				</li>
				<li>
					<strong>Hydration mismatch.</strong> If the server-rendered HTML doesn't
					exactly match what the client renders, React 19 logs a useful diff and the
					tree is re-mounted client-side. The usual culprit is rendering{" "}
					<code>new Date()</code> or <code>Math.random()</code> directly: server and
					client see different values. Pin the value or render it after hydration.
				</li>
				<li>
					<strong>Cookies and headers.</strong> On the server, you read the request
					context to access cookies. On the client, the same code reads
					{" "}
					<code>document.cookie</code>. The framework gives you a single helper
					(<code>useSession</code> in Start) that knows where it is running.
				</li>
			</ul>

			<h2>Where the BFF pattern shows up</h2>
			<p>
				Many apps put authentication on the server side of TanStack Start (cookies,
				sessions) and forward the call to a separate backend over HTTP or gRPC. The
				server function is the BFF: a thin layer that knows the user's identity, talks
				to the real backend on their behalf, and returns shaped data to the client. See
				the <a href="/bff">BFF page</a> for the full story.
			</p>

			<h2>Comparing with Next.js, briefly</h2>
			<table>
				<thead>
					<tr>
						<th></th>
						<th>Next.js App Router</th>
						<th>TanStack Start</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Routing</td>
						<td>Folder-based, server components by default</td>
						<td>File-based via TanStack Router, client components by default</td>
					</tr>
					<tr>
						<td>Server code in components</td>
						<td>Yes, RSC</td>
						<td>No (yet). Server-only code goes in server functions.</td>
					</tr>
					<tr>
						<td>Type safety of params</td>
						<td>Mostly hand-written</td>
						<td>Generated by the router plugin</td>
					</tr>
					<tr>
						<td>Build tool</td>
						<td>Turbopack/webpack</td>
						<td>Vite</td>
					</tr>
				</tbody>
			</table>

			<h2>Common interview questions</h2>
			<ul>
				<li>
					<strong>What does SSR get you that an SPA doesn't?</strong> Faster first
					paint with real content, better SEO, and the ability to set HTTP status
					codes (404, 401) per route. The cost is server CPU per request and a more
					complex deploy.
				</li>
				<li>
					<strong>What is a server function?</strong> A typed function declared on the
					server, importable from the client. The framework rewrites the import into
					an HTTP endpoint plus a fetch. Argument and return types are shared, so the
					call site has full type information.
				</li>
				<li>
					<strong>Why is hydration tricky?</strong> The client React tree must match
					the server-rendered HTML on the first render. Anything that depends on
					real-time values (Date, Math.random, browser-only APIs) needs to be rendered
					after the first paint or pinned to a stable value.
				</li>
			</ul>
		</TopicLayout>
	);
}
