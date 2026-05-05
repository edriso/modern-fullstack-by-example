import { createFileRoute } from "@tanstack/react-router";
import { Callout } from "../components/Callout";
import { CodeBlock } from "../components/CodeBlock";
import { Compare } from "../components/Compare";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/errors")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/errors"
			group="Backend"
			title="Error handling"
			tagline="A domain error taxonomy that maps cleanly to gRPC and HTTP, and the catch-and-swallow anti-pattern that hides production bugs."
		>
			<p>
				Error handling is one of those topics where messy code starts off "fine" and
				ends up costing you sleep. The fix is small: define a short list of error
				types, throw them where appropriate, and have one place that turns them into
				the right wire response.
			</p>

			<h2>Three patterns you'll see in legacy code</h2>
			<table>
				<thead>
					<tr>
						<th>Pattern</th>
						<th>What's wrong</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><code>try/catch → res.json("&#123;ok:false, error&#125;")</code></td>
						<td>HTTP status is always 200. Auth failures look like success.</td>
					</tr>
					<tr>
						<td>Raw <code>throw new Error("...")</code></td>
						<td>Becomes a 500 INTERNAL with no useful status, no taxonomy.</td>
					</tr>
					<tr>
						<td><code>try/catch → return []</code></td>
						<td>Failure is invisible. Empty result looks like "no data".</td>
					</tr>
				</tbody>
			</table>
			<p>The fix is to give errors types and centralise the mapping.</p>

			<h2>A small domain error taxonomy</h2>
			<p>
				Six classes cover almost every situation. They map one-to-one to gRPC status
				codes (and HTTP if you ever need it).
			</p>
			<CodeBlock lang="ts" filename="src/observability/errors.ts">{`export type DomainErrorCode =
  | "NOT_FOUND"
  | "INVALID_ARGUMENT"
  | "UNAUTHENTICATED"
  | "PERMISSION_DENIED"
  | "ALREADY_EXISTS"
  | "FAILED_PRECONDITION";

export class DomainError extends Error {
  constructor(public readonly code: DomainErrorCode, message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string) { super("NOT_FOUND", message); }
}
export class ValidationError extends DomainError {
  constructor(message: string) { super("INVALID_ARGUMENT", message); }
}
export class UnauthenticatedError extends DomainError {
  constructor(message = "Authentication required") { super("UNAUTHENTICATED", message); }
}
export class ForbiddenError extends DomainError {
  constructor(message = "Permission denied") { super("PERMISSION_DENIED", message); }
}
export class ConflictError extends DomainError {
  constructor(message: string) { super("ALREADY_EXISTS", message); }
}
export class PreconditionError extends DomainError {
  constructor(message: string) { super("FAILED_PRECONDITION", message); }
}`}</CodeBlock>

			<Callout kind="tip" title="Why classes, not strings">
				<p>
					You can <code>instanceof NotFoundError</code> in a wrapper without parsing
					strings. Classes also let TypeScript narrow the type in a catch.
				</p>
			</Callout>

			<h2>Throwing them in the service layer</h2>
			<Compare
				left={{
					title: "Before",
					body: (
						<CodeBlock lang="ts">{`const post = await db.select()
  .from(posts).where(eq(posts.id, postId)).get();
if (!post) throw new Error("Post not found");

if (post.authorId !== userId) {
  throw new Error("You can only edit your own posts");
}`}</CodeBlock>
					),
				}}
				right={{
					title: "After",
					body: (
						<CodeBlock lang="ts">{`const post = await db.select()
  .from(posts).where(eq(posts.id, postId)).get();
if (!post) throw new NotFoundError("Post not found");

if (post.authorId !== userId) {
  throw new ForbiddenError("You can only edit your own posts");
}`}</CodeBlock>
					),
				}}
			/>
			<p>
				Messages stay the same, so existing tests still match. The class adds the
				typed code that the wrapper uses.
			</p>

			<h2>Mapping at the boundary</h2>
			<p>
				One function maps a thrown value into a wire-level error. For gRPC, that's an
				{" "}
				<code>RpcError</code> with a status string the framework recognises:
			</p>
			<CodeBlock lang="ts">{`import { RpcError } from "@protobuf-ts/runtime-rpc";

export function toRpcError(err: unknown, traceId: string): RpcError {
  const meta = { "x-trace-id": traceId };

  if (err instanceof RpcError) {
    err.meta = { ...err.meta, ...meta };
    return err;
  }
  if (err instanceof DomainError) {
    return new RpcError(err.message, err.code, meta);
  }
  // Anything else: a real bug. Don't leak the message; log it.
  return new RpcError("Internal error", "INTERNAL", meta);
}`}</CodeBlock>
			<Callout kind="warn" title="Don't leak random error messages">
				<p>
					When the thrown value isn't a domain error, treat it as a bug and return a
					generic <code>Internal error</code> string. The original message and stack go
					to your logs (with the trace ID), not to the client. Returning a raw stack
					to the wire is how token leaks happen.
				</p>
			</Callout>

			<h2>The handler wrapper</h2>
			<p>
				The handler function shouldn't have to repeat <code>try/catch</code> in every
				method. Wrap once, apply everywhere:
			</p>
			<CodeBlock lang="ts">{`export function withHandler<Req, Res>(
  service: string,
  method: string,
  fn: (req: Req) => Promise<Res>,
) {
  return async (req: Req, ctx?: ServerCallContext) => {
    const traceId = ctx?.headers?.["x-trace-id"] ?? randomUUID();
    if (ctx) ctx.trailers = { ...ctx.trailers, "x-trace-id": traceId };

    try {
      return await fn(req);
    } catch (err) {
      log.warn({ event: "request.fail", service, method, traceId, err });
      throw toRpcError(err, traceId);
    }
  };
}`}</CodeBlock>

			<h2>Status code cheat sheet</h2>
			<table>
				<thead>
					<tr><th>Domain</th><th>gRPC</th><th>HTTP</th><th>When</th></tr>
				</thead>
				<tbody>
					<tr><td>NotFoundError</td><td>NOT_FOUND</td><td>404</td><td>Resource doesn't exist</td></tr>
					<tr><td>ValidationError</td><td>INVALID_ARGUMENT</td><td>400</td><td>Bad client input</td></tr>
					<tr><td>UnauthenticatedError</td><td>UNAUTHENTICATED</td><td>401</td><td>No / bad credentials</td></tr>
					<tr><td>ForbiddenError</td><td>PERMISSION_DENIED</td><td>403</td><td>Authenticated but not allowed</td></tr>
					<tr><td>ConflictError</td><td>ALREADY_EXISTS</td><td>409</td><td>Duplicate / race</td></tr>
					<tr><td>PreconditionError</td><td>FAILED_PRECONDITION</td><td>412</td><td>Wrong state for the action</td></tr>
				</tbody>
			</table>

			<h2>Common interview questions</h2>
			<ul>
				<li>
					<strong>Why not just throw <code>Error</code>?</strong> The wrapper can't
					decide what status code to send without knowing what kind of error this is.
					Domain classes carry that information.
				</li>
				<li>
					<strong>Why centralise the mapping?</strong> So the rule "NotFoundError →
					404 / NOT_FOUND" exists in exactly one place. New endpoints don't have to
					reinvent it.
				</li>
				<li>
					<strong>Why is "catch and return empty" so bad?</strong> It hides the
					failure from the client and from observability. Bookmarks page returning an
					empty list because the auth token expired looks identical to "you have no
					bookmarks".
				</li>
				<li>
					<strong>Should error messages contain user input?</strong> Be careful.
					Echoing user-provided strings can leak them into logs and attack vectors
					(log forging, unsafe HTML in admin panels). Sanitise or omit.
				</li>
			</ul>
		</TopicLayout>
	);
}
