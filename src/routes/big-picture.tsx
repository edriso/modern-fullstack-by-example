import { createFileRoute } from "@tanstack/react-router";
import { Callout } from "../components/Callout";
import { CodeBlock } from "../components/CodeBlock";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/big-picture")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/big-picture"
			group="Wrap-up"
			title="The big picture"
			tagline="One click, through every layer. The point of this page is to make the topic pages feel like one story."
		>
			<p>
				Imagine the user clicks the heart icon on a post. Here is what happens, in
				order, with each layer of the stack involved.
			</p>

			<h2>The map</h2>
			<CodeBlock lang="text">{`Browser
   │
   │ 1. Click handler in React
   ▼
TanStack Start client (in browser)
   │
   │ 2. Server function call (typed RPC over HTTP)
   ▼
TanStack Start server (the BFF, Node)
   │
   │ 3. Read iron-session cookie -> sessionToken
   │ 4. gRPC call to the API service
   ▼
API service (Node, runs gRPC server)
   │
   │ 5. withHandler wrapper (trace ID, logging, errors)
   │ 6. validateSessionToken (pinned algorithm, iss/aud)
   │ 7. likes.service.togglePostLike()
   ▼
Drizzle ORM
   │
   │ 8. Compiled SQL
   ▼
SQLite (libsql)
   │
   │ 9. Reads + writes
   ▼
   ... and back up the stack with a typed response.`}</CodeBlock>

			<h2>Layer by layer</h2>

			<h3>1. The click</h3>
			<p>
				A React component renders a button. The component lives in{" "}
				<code>src/components/posts/LikeButton.tsx</code>. The handler calls a
				typed server function:
			</p>
			<CodeBlock lang="tsx">{`async function onLike() {
  const result = await togglePostLike({ data: { postId } });
  setLiked(result.liked);
}`}</CodeBlock>

			<h3>2. Server function call</h3>
			<p>
				<code>togglePostLike</code> is declared on the server side but importable
				from the client. The framework rewrites the import into{" "}
				<code>fetch("/server/likes/toggle", &#123; method: "POST", body: ... &#125;)</code>.
				Types are shared across the boundary.
			</p>

			<h3>3 & 4. The BFF</h3>
			<p>
				The TanStack Start server runs the function body. It reads the iron-session
				cookie, pulls out the API-issued JWT (the BFF stored it at login, never
				re-mints it), and calls the API over gRPC.
			</p>
			<CodeBlock lang="ts">{`export const togglePostLike = createServerFn({ method: "POST" })
  .inputValidator((d: { postId: string }) => d)
  .handler(async ({ data }) => {
    const sessionToken = await requireGrpcSessionToken();
    const client = getGrpcClient();
    const { response } = await client.likes.togglePostLike({
      sessionToken,
      postId: data.postId,
    });
    if (!response.success) throw new Error(response.error);
    return { liked: response.liked };
  });`}</CodeBlock>

			<h3>5. The API wrapper</h3>
			<p>
				The gRPC handler is wrapped with <code>withHandler</code>: it generates a
				trace ID (or reuses an inbound one), runs the body inside an
				AsyncLocalStorage context, logs <code>request.start</code> /{" "}
				<code>request.ok</code> / <code>request.fail</code>, maps domain errors to
				gRPC status codes.
			</p>

			<h3>6. Auth verification</h3>
			<p>
				<code>validateSessionToken</code> verifies the JWT with pinned algorithm,
				issuer, and audience. If the token is invalid or expired,
				{" "}
				<code>UnauthenticatedError</code> is thrown, the wrapper maps it to gRPC{" "}
				<code>UNAUTHENTICATED</code>, and the BFF translates that to a 401 for the
				browser.
			</p>

			<h3>7. The service layer</h3>
			<p>
				<code>togglePostLike(postId, userId)</code> looks up the like row, deletes it
				if it exists or inserts one if it doesn't. Returns the new state.
			</p>

			<h3>8 & 9. The database</h3>
			<p>
				Drizzle compiles the query to SQL and sends it to the libsql client, which
				talks to SQLite (or a remote libsql server). The query is typed end-to-end:
				rename a column in the schema, the call site stops compiling.
			</p>

			<h3>Back up the stack</h3>
			<p>
				The service returns <code>&#123; liked: true &#125;</code>. The handler wraps
				it in the proto response. gRPC serialises and sends it to the BFF. The BFF
				returns shaped JSON to the browser. React updates state. The heart fills in.
				Total: one network hop browser-to-BFF, one gRPC hop BFF-to-API, one DB call.
			</p>

			<h2>What every page contributed</h2>
			<table>
				<thead><tr><th>Layer</th><th>The topic page that covers it</th></tr></thead>
				<tbody>
					<tr><td>Component code</td><td><a href="/react">Modern React</a> + <a href="/typescript">TypeScript fundamentals</a></td></tr>
					<tr><td>Routing + server functions</td><td><a href="/tanstack-router">TanStack Router</a> + <a href="/tanstack-start">TanStack Start</a></td></tr>
					<tr><td>BFF</td><td><a href="/bff">The BFF pattern</a></td></tr>
					<tr><td>Auth across the boundary</td><td><a href="/auth">Auth: hashing, JWT, sessions</a></td></tr>
					<tr><td>RPC protocol</td><td><a href="/protobuf-grpc">Protocol Buffers and gRPC</a></td></tr>
					<tr><td>Wrapper, errors, logs</td><td><a href="/errors">Error handling</a> + <a href="/observability">Observability</a></td></tr>
					<tr><td>Service queries</td><td><a href="/n-plus-one">N+1 problem</a></td></tr>
					<tr><td>ORM and schema</td><td><a href="/drizzle">Drizzle ORM</a> + <a href="/schema">Schema and relations</a></td></tr>
					<tr><td>Repo plumbing</td><td><a href="/monorepos">Monorepos</a> + <a href="/biome">Biome</a> + <a href="/ci-cd">CI</a> + <a href="/pre-commit">Pre-commit</a></td></tr>
					<tr><td>Tests</td><td><a href="/vitest">Vitest</a> + <a href="/playwright">Playwright</a></td></tr>
					<tr><td>Styling</td><td><a href="/stylex">StyleX</a></td></tr>
				</tbody>
			</table>

			<h2>The "interview short answer" cheat sheet</h2>
			<p>
				If someone asks "what stack are you using?" in a one-minute elevator pitch,
				you could answer:
			</p>
			<Callout kind="tip" title="One-paragraph version">
				<p>
					"Frontend is React 19 with TanStack Start: file-based typed routing, SSR,
					and server functions for the BFF layer. The BFF talks to a Node API over
					gRPC with protobuf-typed contracts. Data lives in SQLite via Drizzle ORM.
					Errors are domain classes that map to gRPC status codes. Every request
					gets a trace ID via AsyncLocalStorage and ends up in structured JSON
					logs. Tests are Vitest for units (mocked DB-in-memory) and Playwright for
					E2E. The repo is a pnpm + Turborepo monorepo, linted by Biome, validated
					on every PR by GitHub Actions, with a fast husky pre-commit hook."
				</p>
			</Callout>

			<h2>What to build next</h2>
			<p>
				The fastest way to internalise this stack is to ship a small project on it.
				A todo list. A note-taking app. A copy of one of these topic pages with edit
				support. Use every layer at least once. You'll discover which parts you
				understand and which parts you still want to look up.
			</p>
			<p>
				Good luck. You can do this.
			</p>
		</TopicLayout>
	);
}
