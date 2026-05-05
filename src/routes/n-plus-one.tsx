import { createFileRoute } from "@tanstack/react-router";
import { Callout } from "../components/Callout";
import { CodeBlock } from "../components/CodeBlock";
import { Compare } from "../components/Compare";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/n-plus-one")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/n-plus-one"
			group="Data"
			title="The N+1 query problem"
			tagline="The single most common reason an endpoint is fast in dev and brings prod down. Easy to spot once you know the shape."
		>
			<p>
				N+1 is the name for: <strong>1 query to load a list of things, then N more
				queries</strong> (one per thing) to load related data. With 10 posts on a feed
				page, you don't make 1 database call. You make 11. With 50 posts, 51. The
				problem grows linearly with the page size, and the page-size limit is usually
				the only thing keeping prod alive.
			</p>

			<h2>The classic shape</h2>
			<CodeBlock lang="ts">{`// 1 query: get the posts.
const list = await db.select().from(posts).limit(10);

// 10 more queries: get each author one at a time.
const enriched = await Promise.all(
  list.map(async (post) => {
    const author = await db
      .select()
      .from(users)
      .where(eq(users.id, post.authorId))
      .get();
    return { ...post, author };
  }),
);

// Total: 11 queries for 10 posts. Welcome to N+1.`}</CodeBlock>

			<Callout kind="warn" title="It hides in pretty code">
				<p>
					The shape can come from anywhere: <code>Promise.all</code> with a fetch
					inside, a helper called once per row, an ORM relation accessed inside a
					loop. The loop doesn't have to be visible. Always count the queries an
					endpoint makes for a real page size.
				</p>
			</Callout>

			<h2>Why it bites in prod and not in dev</h2>
			<ul>
				<li>
					<strong>Round-trip latency.</strong> Local Postgres on the same box: 0.5 ms
					per query. Managed Postgres in another availability zone: 5-20 ms per
					query. 50 posts at 20 ms each is a full second of pure database wait.
				</li>
				<li>
					<strong>Connection pool starvation.</strong> Many concurrent requests, each
					running 50 queries. The pool runs out of connections, requests queue, and
					everything slows together.
				</li>
				<li>
					<strong>Tiny dev datasets.</strong> Five seeded users and ten posts. Of
					course the page loads instantly. Production has 100k posts and a feed page
					of 20.
				</li>
			</ul>

			<h2>How to detect it</h2>
			<ol>
				<li>
					<strong>Count queries in tests.</strong> Wrap the database client and count
					calls to <code>execute</code>. Assert that loading a page of 10 issues a
					small constant number, not 11+.
				</li>
				<li>
					<strong>Read your ORM's query log in dev.</strong> Most ORMs can log every
					query with a flag. If you see a stream of <code>SELECT ... WHERE id = ?</code>
					{" "}
					calls per page, you know.
				</li>
				<li>
					<strong>Use <code>EXPLAIN ANALYZE</code> on slow endpoints.</strong> Postgres
					and MySQL both have it. If the planner runs the same query 10 times, that's
					also N+1, just at the planner level.
				</li>
			</ol>

			<CodeBlock lang="ts" filename="tests/post-stats.test.ts">{`async function startQueryCounter() {
  const original = client.execute.bind(client);
  let count = 0;
  client.execute = (stmt) => {
    count += 1;
    return original(stmt);
  };
  return {
    get count() { return count; },
    restore: () => { client.execute = original; },
  };
}

it("home feed loads 10 posts in a constant number of queries", async () => {
  await seed(10);
  const counter = await startQueryCounter();
  const result = await getHomeFeed(viewer.id, { limit: 10 });
  expect(result).toHaveLength(10);
  // 1 follows + 1 posts+author JOIN + 3 stat batches = 5.
  expect(counter.count).toBeLessThanOrEqual(6);
});`}</CodeBlock>

			<h2>Three fixes, in order of preference</h2>

			<h3>1. JOIN</h3>
			<p>
				The first thing to ask: can a single query do this? A join often can.
			</p>
			<Compare
				left={{
					title: "N+1",
					body: (
						<CodeBlock lang="ts">{`const list = await db.select().from(posts).limit(10);
for (const post of list) {
  post.author = await db.select()
    .from(users)
    .where(eq(users.id, post.authorId))
    .get();
}`}</CodeBlock>
					),
				}}
				right={{
					title: "JOIN",
					body: (
						<CodeBlock lang="ts">{`const list = await db
  .select({
    id: posts.id,
    content: posts.content,
    author: {
      id: users.id,
      username: users.username,
    },
  })
  .from(posts)
  .leftJoin(users, eq(posts.authorId, users.id))
  .limit(10);`}</CodeBlock>
					),
				}}
			/>

			<h3>2. Batch with <code>IN(...)</code></h3>
			<p>
				When the related data needs aggregation (counts, sums) or comes from a
				different table that doesn't fit a clean join, batch it. Two queries instead
				of N+1: one for the parents, one for all the children at once.
			</p>
			<CodeBlock lang="ts">{`const list = await db.select().from(posts).limit(10);
const ids = list.map((p) => p.id);

// One query for ALL the like counts, grouped.
const likeCounts = await db
  .select({ postId: likes.postId, count: sql<number>\`count(*)\` })
  .from(likes)
  .where(inArray(likes.postId, ids))
  .groupBy(likes.postId);

// Build a Map for O(1) lookup.
const counts = new Map(likeCounts.map((r) => [r.postId, r.count]));

// Stitch back, no more queries.
const enriched = list.map((p) => ({ ...p, likeCount: counts.get(p.id) ?? 0 }));`}</CodeBlock>

			<h3>3. DataLoader (per-request batching)</h3>
			<p>
				When the loops are scattered across the codebase (different services each
				asking for one user), wrap the lookup in a request-scoped batch loader. Calls
				made within the same tick of the event loop get batched into one query.
			</p>
			<CodeBlock lang="ts">{`import DataLoader from "dataloader";

const userLoader = new DataLoader<string, User>(async (ids) => {
  const rows = await db.select().from(users).where(inArray(users.id, [...ids]));
  const byId = new Map(rows.map((u) => [u.id, u]));
  return ids.map((id) => byId.get(id)!);
});

// Anywhere in the request, even from different files:
const author = await userLoader.load(post.authorId);
// Multiple .load() calls in the same tick collapse into one IN(?) query.`}</CodeBlock>
			<Callout kind="note" title="DataLoader is per-request">
				<p>
					Create a fresh DataLoader at the start of each request and discard it after.
					Sharing one across requests would mean stale data and cross-user leakage.
				</p>
			</Callout>

			<h2>The reusable helper pattern</h2>
			<p>
				If multiple endpoints need the same shape (post + likes + comments + isLiked),
				put the batched lookup in one place. The example codebase calls it
				{" "}
				<code>loadPostStats</code>:
			</p>
			<CodeBlock lang="ts" filename="apps/api/src/services/post-stats.ts">{`export async function loadPostStats(
  postIds: readonly string[],
  viewerId?: string,
): Promise<Map<string, PostStats>> {
  if (postIds.length === 0) return new Map();
  const ids = [...postIds];

  const [likeRows, commentRows, viewerLikeRows] = await Promise.all([
    db.select({ postId: likes.postId, count: sql<number>\`count(*)\` })
      .from(likes).where(inArray(likes.postId, ids)).groupBy(likes.postId),
    db.select({ postId: comments.postId, count: sql<number>\`count(*)\` })
      .from(comments).where(inArray(comments.postId, ids)).groupBy(comments.postId),
    viewerId
      ? db.select({ postId: likes.postId })
          .from(likes)
          .where(and(eq(likes.userId, viewerId), inArray(likes.postId, ids)))
      : Promise.resolve([]),
  ]);

  // Build the map and return.
}`}</CodeBlock>
			<p>
				Now every endpoint that needs the stats calls one function. New endpoints can't
				accidentally reintroduce the loop.
			</p>

			<h2>Common interview questions</h2>
			<ul>
				<li>
					<strong>What is the N+1 query problem?</strong> When loading N items needs
					one query for the list and N more queries to fill in related data, for a
					total of N+1. Linear in page size, very expensive over a network.
				</li>
				<li>
					<strong>How do you fix it?</strong> JOIN if the data fits, batch with
					{" "}
					<code>IN(?)</code> + <code>GROUP BY</code> for aggregations, or use a
					DataLoader for scattered lookups.
				</li>
				<li>
					<strong>How do you stop it from coming back?</strong> Write a test that
					counts queries and asserts an upper bound. Centralise the batched lookup so
					there's no per-row helper for new code to reach for.
				</li>
				<li>
					<strong>Is N+1 only an ORM problem?</strong> No. It happens any time you have
					a list and load related data per item. ORMs make it easier to fall into
					because relations look like attribute access. Raw SQL with a loop is also
					N+1.
				</li>
			</ul>
		</TopicLayout>
	);
}
