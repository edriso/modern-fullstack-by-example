import { createFileRoute } from "@tanstack/react-router";
import { Callout } from "../components/Callout";
import { CodeBlock } from "../components/CodeBlock";
import { Compare } from "../components/Compare";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/observability")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/observability"
			group="Backend"
			title="Observability"
			tagline="Trace IDs, AsyncLocalStorage, and structured logs. The minimum viable plumbing for debugging production."
		>
			<p>
				Observability is the umbrella term for logs, metrics, and traces: the things
				that let you understand what your service is doing without attaching a
				debugger. The minimum every service should have:
			</p>
			<ol>
				<li><strong>A trace ID per request</strong> that flows through every log line.</li>
				<li><strong>Structured (JSON) logs</strong> so you can grep by field.</li>
				<li><strong>Latency per endpoint</strong> so you can spot slow paths.</li>
			</ol>

			<h2>Trace IDs: the cheapest debugging trick</h2>
			<p>
				A trace ID is a random string (UUID is fine) generated at the start of a
				request and attached to every log line that request emits. When prod is
				broken, you grab the trace ID from the user (or from the response) and grep
				the logs.
			</p>

			<Compare
				left={{
					title: "Without trace IDs",
					body: (
						<CodeBlock lang="text">{`[ERROR] User not found
[INFO]  Loaded posts
[ERROR] Database timeout
[INFO]  Sent response
[ERROR] User not found`}</CodeBlock>
					),
				}}
				right={{
					title: "With trace IDs",
					body: (
						<CodeBlock lang="text">{`{"traceId":"abc-123","level":"error","msg":"User not found","user":"alice"}
{"traceId":"abc-123","level":"info","msg":"Sent response","durationMs":312}
{"traceId":"def-456","level":"error","msg":"Database timeout"}
{"traceId":"def-456","level":"info","msg":"Sent response","durationMs":3010}`}</CodeBlock>
					),
				}}
			/>

			<h2>AsyncLocalStorage: how the trace ID travels</h2>
			<p>
				The trace ID is generated in the request handler. By the time you're three
				function calls deep in a service, you've forgotten you have it. Passing it as
				an argument everywhere is noisy. Node has a built-in solution:{" "}
				<code>AsyncLocalStorage</code>. Think of it as a per-async-task variable.
			</p>
			<CodeBlock lang="ts" filename="src/observability/context.ts">{`import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContext {
  traceId: string;
  service: string;
  method: string;
  userId?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithContext<T>(
  ctx: RequestContext,
  fn: () => Promise<T>,
): Promise<T> {
  return storage.run(ctx, fn);
}

export function currentContext(): RequestContext | undefined {
  return storage.getStore();
}`}</CodeBlock>
			<p>
				At the entry point, wrap the handler in <code>runWithContext</code>. Anywhere
				deeper in the call stack, <code>currentContext()</code> returns the right
				context, even across <code>await</code> boundaries.
			</p>
			<CodeBlock lang="ts">{`return runWithContext(
  { traceId, service: "PostsService", method: "createPost" },
  () => actualHandler(req),
);`}</CodeBlock>

			<Callout kind="tip" title="Why this is magic">
				<p>
					AsyncLocalStorage hooks into Node's async runtime to propagate context
					through Promises, timers, and event handlers. Two requests handled in
					parallel each see their own context, with no risk of mixing.
				</p>
			</Callout>

			<h2>A structured logger</h2>
			<p>
				Instead of <code>console.log("user not found", userId)</code>, log JSON. Logs
				become greppable, searchable in tools like Loki / Datadog, and you can pull
				fields out without parsing.
			</p>
			<CodeBlock lang="ts" filename="src/observability/logger.ts">{`import { currentContext } from "./context";

type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, fields: Record<string, unknown>) {
  const ctx = currentContext();
  const line = {
    level,
    ts: new Date().toISOString(),
    traceId: ctx?.traceId,
    service: ctx?.service,
    method: ctx?.method,
    userId: ctx?.userId,
    ...fields,
  };
  // Pipe to stdout. The log shipper picks it up.
  console.log(JSON.stringify(line));
}

export const log = {
  info:  (f: Record<string, unknown>) => emit("info",  f),
  warn:  (f: Record<string, unknown>) => emit("warn",  f),
  error: (f: Record<string, unknown>) => emit("error", f),
};`}</CodeBlock>

			<p>The call site stays small:</p>
			<CodeBlock lang="ts">{`log.info({ event: "user.created", userId });
log.warn({ event: "request.fail", durationMs, errCode: "NOT_FOUND" });`}</CodeBlock>

			<h2>Returning the trace ID to the client</h2>
			<p>
				If the user reports a bug, you want the trace ID in their request. Two ways:
			</p>
			<ul>
				<li>
					<strong>Response trailer / header</strong>: gRPC trailers, HTTP
					{" "}
					<code>x-trace-id</code> header. The client logs them with the request.
				</li>
				<li>
					<strong>Inside error responses</strong>: when the request fails, the trace
					ID goes in the error metadata.
				</li>
			</ul>
			<p>
				Pair this with <em>inbound</em> trace IDs: if the request already carries an
				{" "}
				<code>x-trace-id</code> header (e.g. from a BFF that started it), reuse it
				instead of generating a new one. Now one ID covers BFF + API + database, and
				you can correlate the whole chain.
			</p>

			<h2>The handler wrapper, fully assembled</h2>
			<CodeBlock lang="ts">{`export function withHandler<Req, Res>(
  service: string,
  method: string,
  fn: (req: Req) => Promise<Res>,
) {
  return async (req: Req, ctx?: ServerCallContext) => {
    const inbound = ctx?.headers?.["x-trace-id"];
    const traceId = (typeof inbound === "string" && inbound) || randomUUID();

    if (ctx) {
      ctx.trailers = { ...ctx.trailers, "x-trace-id": traceId };
    }

    return runWithContext({ traceId, service, method }, async () => {
      const start = Date.now();
      log.info({ event: "request.start" });
      try {
        const result = await fn(req);
        log.info({ event: "request.ok", durationMs: Date.now() - start });
        return result;
      } catch (err) {
        log.warn({
          event: "request.fail",
          durationMs: Date.now() - start,
          errCode: err instanceof DomainError ? err.code : "INTERNAL",
          errMessage: err instanceof Error ? err.message : String(err),
        });
        throw toRpcError(err, traceId);
      }
    });
  };
}`}</CodeBlock>

			<h2>What about metrics?</h2>
			<p>
				Once your logs include <code>durationMs</code> and <code>errCode</code>, you
				already have the building blocks for metrics. Tools like Prometheus pull
				numbers from a <code>/metrics</code> endpoint. The simplest "real" metric to
				add: a histogram of <code>durationMs</code> per <code>(service, method)</code>.
				That gives you p50/p95/p99 dashboards almost for free.
			</p>

			<h2>Common interview questions</h2>
			<ul>
				<li>
					<strong>Why a structured logger over <code>console.log</code>?</strong>{" "}
					Greppable JSON, machine-parseable, easy to ship to a backend. Pulling
					{" "}
					<code>userId</code> or <code>errCode</code> across millions of lines becomes
					a query, not a regex.
				</li>
				<li>
					<strong>What is <code>AsyncLocalStorage</code> for?</strong> Carrying
					per-request context (trace ID, user ID) through async calls without passing
					it as a parameter at every level. Hooked into Node's async runtime so it
					works across <code>await</code> boundaries.
				</li>
				<li>
					<strong>Why echo the trace ID in the response?</strong> So the client can
					log it. When a user reports a problem, you ask for the trace ID and grep
					the logs. Without it, you're guessing.
				</li>
				<li>
					<strong>What's a span vs a trace?</strong> A trace is the whole story of one
					request across all services. A span is one segment of it (one service, one
					database call). Real distributed tracing tools (OpenTelemetry, Jaeger,
					Honeycomb) build on these terms.
				</li>
			</ul>
		</TopicLayout>
	);
}
