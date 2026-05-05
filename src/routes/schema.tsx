import { createFileRoute } from "@tanstack/react-router";
import { Callout } from "../components/Callout";
import { CodeBlock } from "../components/CodeBlock";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/schema")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/schema"
			group="Data"
			title="Schema and relations"
			tagline="Designing tables, picking primary keys, choosing the right indexes, and what to do when the schema needs to change."
		>
			<p>
				The fastest path to a slow app is the wrong schema. Get the columns and
				indexes right and the queries are usually obvious. Get them wrong and you fight
				the database for the rest of the project.
			</p>

			<h2>Pick a primary key strategy and stick with it</h2>
			<table>
				<thead>
					<tr>
						<th>Strategy</th>
						<th>Pros</th>
						<th>Cons</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Auto-increment integer</td>
						<td>Compact, fast for B-tree, good cache locality</td>
						<td>Leaks count to the world; coordination across shards is hard</td>
					</tr>
					<tr>
						<td>UUID v4 (random)</td>
						<td>No coordination needed; safe to expose</td>
						<td>Random insertion order hurts B-tree caches and grows the index</td>
					</tr>
					<tr>
						<td>UUID v7 / ULID (time-prefixed)</td>
						<td>Roughly sortable, good locality, no leakage of count</td>
						<td>Slightly newer; library support varies</td>
					</tr>
					<tr>
						<td>Custom prefix like <code>user_</code> + nanoid</td>
						<td>Self-documenting in logs and URLs</td>
						<td>Slightly larger; you have to write the helper</td>
					</tr>
				</tbody>
			</table>
			<p>
				For most apps starting today, ULID or UUID v7 is the safe default. If you have
				a fixed set of trusted services, auto-increment is fine and faster.
			</p>

			<h2>Required vs optional, default vs computed</h2>
			<CodeBlock lang="ts">{`export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),

  // Required, no default. Caller must supply.
  content: text("content").notNull(),

  // Required, defaulted by the database (good: one source of truth).
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql\`(unixepoch())\`),

  // Optional. Stored as NULL when absent.
  editedAt: integer("edited_at", { mode: "timestamp" }),

  // Foreign key with cascade so deleting the user removes their posts.
  authorId: text("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});`}</CodeBlock>
			<Callout kind="tip" title="Database-side defaults beat application-side ones">
				<p>
					If two services both insert into <code>posts</code> and one forgets to set
					{" "}
					<code>createdAt</code>, you get rows with <code>NULL</code> timestamps. Make
					the database fill it in: <code>DEFAULT (unixepoch())</code> or
					{" "}
					<code>DEFAULT CURRENT_TIMESTAMP</code>. Then no caller can forget.
				</p>
			</Callout>

			<h2>Foreign keys and cascade behaviour</h2>
			<table>
				<thead>
					<tr>
						<th>onDelete</th>
						<th>Effect</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><code>cascade</code></td>
						<td>Delete the referencing rows automatically.</td>
					</tr>
					<tr>
						<td><code>set null</code></td>
						<td>Set the referencing column to NULL (column must allow it).</td>
					</tr>
					<tr>
						<td><code>restrict</code></td>
						<td>Refuse the delete if any row still references it.</td>
					</tr>
					<tr>
						<td><code>no action</code> (default)</td>
						<td>Same as restrict in most engines.</td>
					</tr>
				</tbody>
			</table>
			<p>
				Pick by intent. "Delete the user, keep their posts but mark them anonymous"
				means <code>set null</code> on <code>posts.authorId</code>. "Delete the user,
				take all their posts with them" means <code>cascade</code>.
			</p>

			<h2>Indexes</h2>
			<p>
				An index is a separate data structure that lets the database find rows by a
				column value without scanning the whole table. It is the single biggest
				performance lever you have.
			</p>

			<h3>The index rule of thumb</h3>
			<p>
				Add an index on every column you frequently filter by, sort by, or join on. The
				cost is one B-tree write per insert/update. The win is going from O(N) to
				O(log N) on reads. Almost always worth it.
			</p>

			<CodeBlock lang="ts">{`import { index, sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable(
  "posts",
  {
    id: text("id").primaryKey(),
    authorId: text("author_id").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => ({
    // We constantly query "posts by this author, newest first".
    // A composite index on (authorId, createdAt DESC) handles both
    // the filter and the sort with a single index scan.
    authorRecent: index("posts_author_recent_idx").on(
      table.authorId,
      table.createdAt,
    ),
  }),
);`}</CodeBlock>

			<h3>Unique constraints</h3>
			<p>
				A unique constraint is also an index that enforces no two rows share a value
				(or set of values).
			</p>
			<CodeBlock lang="ts">{`export const likes = sqliteTable(
  "likes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    postId: text("post_id"),
    commentId: text("comment_id"),
  },
  (table) => ({
    // A user can like a given post once. Enforced by the database,
    // not by application logic that might race.
    uniquePostLike: unique().on(table.userId, table.postId),
    uniqueCommentLike: unique().on(table.userId, table.commentId),
  }),
);`}</CodeBlock>

			<h2>Timestamp conventions</h2>
			<p>
				Add <code>createdAt</code> and <code>updatedAt</code> to every table from day
				one. They cost nothing and they answer questions you don't yet know you'll
				have. The simplest scheme:
			</p>
			<CodeBlock lang="ts">{`createdAt: integer("created_at", { mode: "timestamp" })
  .notNull()
  .default(sql\`(unixepoch())\`),

updatedAt: integer("updated_at", { mode: "timestamp" })
  .notNull()
  .default(sql\`(unixepoch())\`)
  .$onUpdate(() => new Date()),`}</CodeBlock>

			<h2>Soft deletes vs hard deletes</h2>
			<p>
				Sometimes you want to "delete" without actually losing the row (audit, support,
				undo). Pattern: a <code>deletedAt</code> nullable timestamp, plus a query helper
				that filters out non-null rows.
			</p>
			<CodeBlock lang="ts">{`// Schema:
deletedAt: integer("deleted_at", { mode: "timestamp" }),

// Read helper:
function activePosts() {
  return db.select().from(posts).where(isNull(posts.deletedAt));
}

// "Delete":
await db
  .update(posts)
  .set({ deletedAt: new Date() })
  .where(eq(posts.id, postId));`}</CodeBlock>
			<Callout kind="warn" title="Soft deletes are a discipline">
				<p>
					Every read has to remember the <code>WHERE deleted_at IS NULL</code>, or
					users see ghosts. Centralise the helper. Don't sprinkle the check across
					every query.
				</p>
			</Callout>

			<h2>Migrations: the survival guide</h2>
			<p>
				The schema will change. The trick is making changes you can deploy without
				downtime, ideally in any order with the running code.
			</p>
			<ul>
				<li>
					<strong>Adding a nullable column</strong>: safe. Old code keeps working.
				</li>
				<li>
					<strong>Adding a NOT NULL column</strong>: do it in two steps. First add as
					nullable with a default, backfill, then enforce NOT NULL.
				</li>
				<li>
					<strong>Renaming a column</strong>: never one-shot. Add the new column, dual
					-write from the app, backfill, switch reads, drop the old column. This is
					also called <em>expand-and-contract</em>.
				</li>
				<li>
					<strong>Dropping a column</strong>: stop reading from it for a deploy cycle,
					then drop. If you drop while the old binary still queries it, you're rolling
					back the deploy.
				</li>
				<li>
					<strong>Adding an index on a big table</strong>: use the database's online
					/ concurrent index creation. In Postgres,{" "}
					<code>CREATE INDEX CONCURRENTLY</code>.
				</li>
			</ul>

			<h2>Common interview questions</h2>
			<ul>
				<li>
					<strong>What columns should you index?</strong> Anything you filter on, sort
					by, or join on. Composite indexes help when you filter + sort together.
					Don't index columns you never query by; the write cost is wasted.
				</li>
				<li>
					<strong>What's a composite index and when is order in the columns
					list significant?</strong> An index on multiple columns. Order matters: an
					index on <code>(a, b)</code> can serve queries on <code>a</code> alone or on
					{" "}
					<code>a + b</code>, but not on <code>b</code> alone. Put the most-filtered
					column first.
				</li>
				<li>
					<strong>How do you handle a non-trivial schema change in production?</strong>{" "}
					Expand-and-contract: add the new shape, write to both, backfill, switch
					reads, drop the old shape. Each step is a safe deploy.
				</li>
				<li>
					<strong>Soft delete or hard delete?</strong> Soft when you need audit / undo
					/ recovery. Hard when the data should genuinely be gone (GDPR, legal). Soft
					adds query overhead and discipline.
				</li>
			</ul>
		</TopicLayout>
	);
}
