import { createFileRoute } from "@tanstack/react-router";
import { Callout } from "../components/Callout";
import { CodeBlock } from "../components/CodeBlock";
import { Compare } from "../components/Compare";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/bff")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/bff"
			group="Backend"
			title="The BFF pattern"
			tagline="Backend-for-frontend: a small server that sits between your client and your real backend, shaped for the UI you actually have."
		>
			<p>
				BFF stands for <strong>backend-for-frontend</strong>. It's a server whose only
				customer is one specific client. If you have a web app and a mobile app, each
				gets its own BFF. The BFF talks to the "real" backend services on the user's
				behalf and returns data in exactly the shape the UI wants.
			</p>

			<Compare
				left={{
					title: "Without a BFF",
					body: (
						<CodeBlock lang="text">{`Browser  ──HTTP/JSON──>  Express API  ──>  MySQL
                                  └──>  Stripe
                                  └──>  S3`}</CodeBlock>
					),
				}}
				right={{
					title: "With a BFF",
					body: (
						<CodeBlock lang="text">{`Browser  ──HTTP/JSON──>  BFF  ──gRPC──>  API service ──>  MySQL
                          │                  └──> Stripe
                          │                  └──> S3
                          └──cookies, sessions, CSRF`}</CodeBlock>
					),
				}}
			/>

			<h2>Why have one</h2>
			<ul>
				<li>
					<strong>The browser cannot speak everything.</strong> gRPC, message queues,
					internal protocols. The BFF is the translator.
				</li>
				<li>
					<strong>Sessions and cookies live there.</strong> The browser keeps a session
					cookie. The BFF reads it and forwards an auth token to the API. The API
					never sees raw cookies.
				</li>
				<li>
					<strong>UI-shaped responses.</strong> The home feed page needs posts + author
					+ like counts in one call. The API exposes them as separate primitives. The
					BFF combines them.
				</li>
				<li>
					<strong>Less coupling between the API and any one client.</strong> Two
					different clients (mobile + web) can each evolve their BFF without changing
					the API.
				</li>
				<li>
					<strong>Security boundary.</strong> The BFF holds long-lived secrets (JWT
					verification key, third-party API keys). The browser holds only a session
					cookie.
				</li>
			</ul>

			<h2>What lives where</h2>
			<table>
				<thead>
					<tr>
						<th>Concern</th>
						<th>BFF</th>
						<th>API service</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Session cookie</td>
						<td>Reads / writes the cookie</td>
						<td>Never sees the cookie</td>
					</tr>
					<tr>
						<td>Auth token</td>
						<td>Stores it in the session</td>
						<td>Verifies tokens on every call</td>
					</tr>
					<tr>
						<td>CSRF protection</td>
						<td>Yes (cookies are vulnerable)</td>
						<td>Not needed (no cookies)</td>
					</tr>
					<tr>
						<td>SSR</td>
						<td>Yes (renders the UI)</td>
						<td>No</td>
					</tr>
					<tr>
						<td>Business rules</td>
						<td>No (would duplicate logic)</td>
						<td>Yes (the source of truth)</td>
					</tr>
					<tr>
						<td>Database</td>
						<td>No (talks to the API)</td>
						<td>Yes</td>
					</tr>
				</tbody>
			</table>

			<Callout kind="warn" title="The trap to avoid">
				<p>
					The BFF should be a thin translator. The moment you start putting business
					rules in it (authorization checks, validation, computed fields beyond simple
					shaping), you have two services that can disagree. Keep rules in the API.
					Keep shape and session in the BFF.
				</p>
			</Callout>

			<h2>How TanStack Start expresses it</h2>
			<p>
				A server function is a BFF endpoint. It runs in the BFF process, reads the
				session cookie, and calls the real backend.
			</p>
			<CodeBlock lang="ts" filename="src/server/functions/feed.ts">{`export const getHomeFeed = createServerFn({ method: "GET" })
  .handler(async () => {
    // 1) Read the session cookie. The BFF is authoritative for sessions.
    const sessionToken = await requireGrpcSessionToken();

    // 2) Forward to the real API over gRPC.
    const client = getGrpcClient();
    const { response } = await client.feed.getHomeFeed({ sessionToken });

    // 3) Shape for the UI: convert proto Timestamps to JS Dates, strip
    //    fields the UI doesn't need.
    return response.posts.map((p) => ({
      id: p.id,
      content: p.content,
      createdAt: fromProtoTimestamp(p.createdAt),
      author: { username: p.author!.username, displayName: p.author!.displayName },
      likeCount: p.likeCount,
      isLiked: p.isLiked,
    }));
  });`}</CodeBlock>

			<h2>The trust-boundary anti-pattern to know about</h2>
			<p>
				A common mistake: the BFF shares the JWT signing secret with the API and{" "}
				<em>mints its own tokens</em>. That collapses the trust boundary. Anyone with
				access to the BFF environment can forge any token, including admin tokens. The
				right approach: the API is the sole token issuer; the BFF stores the
				API-issued token in the session cookie and forwards it verbatim.
			</p>
			<Compare
				left={{
					title: "Wrong: BFF mints tokens",
					body: (
						<CodeBlock lang="ts">{`// BFF re-mints a JWT for every request,
// stamping role from a cookie value.
const token = jwt.sign(
  { userId, role: cookie.role },
  SHARED_SECRET,
);
return client.api.getUser({ sessionToken: token });`}</CodeBlock>
					),
				}}
				right={{
					title: "Right: BFF forwards the API's token",
					body: (
						<CodeBlock lang="ts">{`// Login: API issued the token. BFF stored it.
// Every request: forward verbatim.
const sessionToken = await getStoredApiToken();
return client.api.getUser({ sessionToken });`}</CodeBlock>
					),
				}}
			/>
			<p>
				The full version of this story is on the <a href="/auth">auth page</a>.
			</p>

			<h2>Common interview questions</h2>
			<ul>
				<li>
					<strong>Why a BFF instead of just calling the API directly from the
					browser?</strong> The browser cannot speak many internal protocols (gRPC),
					can't safely store long-lived secrets, and doesn't compose multiple backends
					well. The BFF handles all of that.
				</li>
				<li>
					<strong>Where does authorization live?</strong> The API decides. The BFF
					forwards the user's token. If you let the BFF decide, you have two services
					that can disagree, and a privilege-escalation surface in the BFF.
				</li>
				<li>
					<strong>What's the cost of a BFF?</strong> Another service to deploy, more
					hops per request, and a place where logic can leak out of the API. Worth it
					when you have multiple clients or non-HTTP backends.
				</li>
				<li>
					<strong>Can the BFF be the same process as the SSR server?</strong> Yes.
					That's exactly what TanStack Start's server functions are: SSR + BFF in one.
				</li>
			</ul>
		</TopicLayout>
	);
}
