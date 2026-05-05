import { createFileRoute } from "@tanstack/react-router";
import { Callout } from "../components/Callout";
import { CodeBlock } from "../components/CodeBlock";
import { Compare } from "../components/Compare";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/drizzle")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/drizzle"
			group="Data"
			title="Drizzle ORM"
			tagline="Type-safe SQL without the heavyweight feel of an ORM. The best parts of raw SQL plus the best parts of Prisma, with neither's downsides."
		>
			<p>
				Drizzle is a TypeScript SQL builder. You define your schema in TypeScript, and
				you write queries that look like SQL (because they basically are), but every
				column, every join, and every result is typed end-to-end.
			</p>

			<Callout kind="tip" title="The category, not just the tool">
				<p>
					Drizzle is in the same family as Prisma, Sequelize, and Kysely. The selling
					point is that it doesn't hide SQL from you. If you can read the query in
					Drizzle, you can read it in MySQL Workbench. Generated SQL is what you'd
					expect, no hidden N+1 magic.
				</p>
			</Callout>

			<Compare
				left={{
					title: "Raw mysql2 (what you might know)",
					body: (
						<CodeBlock lang="ts">{`const [rows] = await pool.query(
  "SELECT id, email FROM users WHERE id = ?",
  [userId],
);
// rows is RowDataPacket[]. Hope you typed it right.
const user = rows[0] as { id: string; email: string };`}</CodeBlock>
					),
				}}
				right={{
					title: "Drizzle",
					body: (
						<CodeBlock lang="ts">{`const user = await db
  .select({ id: users.id, email: users.email })
  .from(users)
  .where(eq(users.id, userId))
  .get();
// user is { id: string; email: string } | undefined.
// Rename a column? The query stops compiling.`}</CodeBlock>
					),
				}}
			/>

			<h2>Defining a schema</h2>
			<p>
				The schema is TypeScript, not a separate DSL. The same code you import in your
				queries also drives migrations.
			</p>
			<CodeBlock lang="ts" filename="packages/db-schema/src/schema.ts">{`import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["user", "admin", "moderator"] })
    .notNull()
    .default("user"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql\`(unixepoch())\`),
});

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql\`(unixepoch())\`),
});

// Inferred types you can use anywhere:
export type User = typeof users.$inferSelect;       // shape of a row read out
export type InsertUser = typeof users.$inferInsert; // shape of a row inserted`}</CodeBlock>

			<h2>Reading rows</h2>
			<CodeBlock lang="ts">{`import { eq, desc, and, inArray } from "drizzle-orm";

// Single row. Returns T | undefined.
const user = await db
  .select()
  .from(users)
  .where(eq(users.email, "alice@example.com"))
  .get();

// Many rows.
const recent = await db
  .select()
  .from(posts)
  .where(eq(posts.authorId, userId))
  .orderBy(desc(posts.createdAt))
  .limit(20);

// Combined predicates.
const liked = await db
  .select()
  .from(likes)
  .where(and(eq(likes.userId, userId), eq(likes.postId, postId)))
  .get();

// IN clause from an array.
const many = await db
  .select()
  .from(posts)
  .where(inArray(posts.id, ["p_1", "p_2", "p_3"]));`}</CodeBlock>

			<h2>Joins</h2>
			<CodeBlock lang="ts">{`// Each post with its author.
const feed = await db
  .select({
    id: posts.id,
    content: posts.content,
    author: {
      id: users.id,
      username: users.username,
      displayName: users.displayName,
    },
  })
  .from(posts)
  .leftJoin(users, eq(posts.authorId, users.id))
  .orderBy(desc(posts.createdAt))
  .limit(20);

// feed is typed as the shape you projected, including the nested author.`}</CodeBlock>
			<Callout kind="note" title="Projection is your friend">
				<p>
					Always project the columns you need rather than <code>select()</code> with no
					argument. Smaller payload, less data crossing the network, and the resulting
					type matches what you actually use.
				</p>
			</Callout>

			<h2>Aggregations</h2>
			<CodeBlock lang="ts">{`import { sql, count } from "drizzle-orm";

// Count posts per user.
const counts = await db
  .select({
    authorId: posts.authorId,
    total: count(),
  })
  .from(posts)
  .groupBy(posts.authorId);

// Conditional count via raw SQL fragment.
const stats = await db
  .select({
    total: sql<number>\`count(*)\`,
  })
  .from(likes)
  .where(eq(likes.postId, postId))
  .get();`}</CodeBlock>

			<h2>Inserts, updates, deletes</h2>
			<CodeBlock lang="ts">{`// Insert.
await db.insert(users).values({
  id: generateId(),
  email: "alice@example.com",
  username: "alice",
  displayName: "Alice",
  passwordHash,
});

// Update with where clause.
await db
  .update(posts)
  .set({ content: newContent, updatedAt: new Date() })
  .where(eq(posts.id, postId));

// Delete.
await db.delete(comments).where(eq(comments.id, commentId));`}</CodeBlock>

			<h2>Transactions</h2>
			<p>
				When two writes have to succeed or fail together (e.g. transferring credits
				between users), wrap them in a transaction.
			</p>
			<CodeBlock lang="ts">{`await db.transaction(async (tx) => {
  await tx.update(users).set({ credits: sql\`credits - 10\` }).where(eq(users.id, fromId));
  await tx.update(users).set({ credits: sql\`credits + 10\` }).where(eq(users.id, toId));
});`}</CodeBlock>
			<p>
				If the function throws, the whole transaction rolls back. If it returns, the
				transaction commits.
			</p>

			<h2>Migrations with drizzle-kit</h2>
			<p>
				<code>drizzle-kit</code> compares your schema TypeScript against the database
				and emits SQL migration files.
			</p>
			<CodeBlock lang="sh">{`# Generate a migration based on schema changes.
pnpm exec drizzle-kit generate

# Apply pending migrations.
pnpm exec drizzle-kit migrate`}</CodeBlock>
			<CodeBlock lang="ts" filename="drizzle.config.ts">{`import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./packages/db-schema/src/schema.ts",
  out: "./db/migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:./chirp.db",
  },
});`}</CodeBlock>

			<h2>The libsql / SQLite story</h2>
			<p>
				The example codebase uses <code>@libsql/client</code> talking to a local SQLite
				file. libsql is an SQLite fork that adds remote replication; for local
				development, treat it as plain SQLite. Drizzle has dialects for Postgres,
				MySQL, SQLite, and others. Schema syntax differs slightly between them;
				queries look the same.
			</p>

			<h2>Common interview questions</h2>
			<ul>
				<li>
					<strong>How is Drizzle different from Prisma?</strong> Prisma is a runtime
					that translates a separate schema language to a query client. It's farther
					from SQL. Drizzle is a thin TypeScript layer over SQL: queries look like SQL,
					and the schema is plain TypeScript.
				</li>
				<li>
					<strong>How do you keep types in sync with the database?</strong> The schema
					is the source of truth; everything (types, queries, migrations) is generated
					or derived from it. Use <code>$inferSelect</code> for read shapes and
					{" "}
					<code>$inferInsert</code> for write shapes.
				</li>
				<li>
					<strong>What does <code>onDelete: "cascade"</code> do?</strong> When the
					referenced row is deleted, every row that references it is also deleted by
					the database. Useful for "delete the post and its comments at once" without
					application logic.
				</li>
				<li>
					<strong>When do you need a transaction?</strong> Whenever two or more writes
					must succeed or fail together. Without one, a partial failure leaves the
					database in an inconsistent state (debited but not credited, etc.).
				</li>
			</ul>
		</TopicLayout>
	);
}
