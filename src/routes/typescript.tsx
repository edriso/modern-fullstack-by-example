import { createFileRoute } from "@tanstack/react-router";
import { Callout } from "../components/Callout";
import { CodeBlock } from "../components/CodeBlock";
import { Compare } from "../components/Compare";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/typescript")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/typescript"
			group="Language"
			title="TypeScript fundamentals"
			tagline="Strict mode, generics, utility types, and the patterns the modern stack uses everywhere."
		>
			<p>
				TypeScript is JavaScript with type annotations. The compiler reads your code,
				checks the types line up, and then strips the types so the browser or Node runs
				plain JavaScript. You get the safety of a typed language at edit time and the
				speed of JavaScript at runtime.
			</p>

			<Callout kind="tip" title="One mental model that helps">
				<p>
					Types describe the shape of data. They are not runtime objects. If you have a
					value at runtime, you have JavaScript. If you have a description of what shape
					a value has, you have TypeScript.
				</p>
			</Callout>

			<h2>Strict mode</h2>
			<p>
				Almost every modern codebase turns on <code>"strict": true</code> in
				{" "}
				<code>tsconfig.json</code>. That switch enables a bundle of safety rules. The most
				useful ones to know by name:
			</p>
			<ul>
				<li>
					<code>strictNullChecks</code> stops <code>null</code> and <code>undefined</code>
					{" "}
					sneaking into types where they don't belong. <code>string</code> means a real
					string, never <code>null</code>.
				</li>
				<li>
					<code>noImplicitAny</code> forces you to declare types instead of letting them
					silently fall back to <code>any</code>.
				</li>
				<li>
					<code>strictFunctionTypes</code> checks that function parameters are compared
					correctly when one function is assigned to another.
				</li>
			</ul>
			<p>Two more flags worth turning on by hand:</p>
			<ul>
				<li>
					<code>noUncheckedIndexedAccess</code>: <code>arr[0]</code> becomes
					{" "}
					<code>T | undefined</code>. The first time it bites is annoying. After that
					you stop assuming arrays have content.
				</li>
				<li>
					<code>noUnusedLocals</code> / <code>noUnusedParameters</code>: catches dead
					code at compile time instead of in code review.
				</li>
			</ul>

			<h2>The five type shapes you keep seeing</h2>
			<p>Every TypeScript codebase leans on a small core vocabulary. Learn these by name.</p>

			<h3>1. Object types and interfaces</h3>
			<CodeBlock lang="ts">{`// Both forms describe the same shape. Use 'type' by default; 'interface'
// is mostly useful when you want to extend the same name across files
// (declaration merging).
type User = {
  id: string;
  email: string;
  bannedAt?: Date;          // ? marks the field as optional
};

interface UserI {
  id: string;
  email: string;
  bannedAt?: Date;
}

const alice: User = { id: "u_1", email: "alice@example.com" };`}</CodeBlock>

			<h3>2. Unions and discriminated unions</h3>
			<p>
				A union is "this type or that type". A discriminated union adds a tag field so
				the compiler can tell which variant it is by checking the tag.
			</p>
			<CodeBlock lang="ts">{`type LoadResult =
  | { status: "loading" }
  | { status: "ok"; data: User }
  | { status: "error"; message: string };

function describe(r: LoadResult): string {
  // Inside each branch, TS knows which fields are present.
  if (r.status === "loading") return "Loading...";
  if (r.status === "ok") return r.data.email;
  return r.message;
}`}</CodeBlock>
			<Callout kind="tip" title="Why this matters in this stack">
				<p>
					gRPC responses, server function results, and React Query states are all
					modelled as discriminated unions. Reading them comfortably is the single
					biggest TypeScript skill for day-to-day work.
				</p>
			</Callout>

			<h3>3. Generics</h3>
			<p>
				A generic is a placeholder for a type. The function or type accepts the
				placeholder as a parameter the same way a function accepts a value.
			</p>
			<CodeBlock lang="ts">{`// Without generics: 'identity' would have to be written once per type.
// With generics: one function works for any T, and the return type is
// the same T the caller passed in.
function identity<T>(value: T): T {
  return value;
}

const n = identity(42);          // T inferred as number
const s = identity("hello");      // T inferred as string

// Generics on objects:
type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const r: ApiResult<User> = { ok: true, data: alice };`}</CodeBlock>

			<h3>4. Utility types</h3>
			<p>
				Built-in helpers that re-shape an existing type. The common ones to recognise
				on sight:
			</p>
			<CodeBlock lang="ts">{`type User = { id: string; email: string; bannedAt?: Date };

// All fields optional.
type UserPatch = Partial<User>;
// { id?: string; email?: string; bannedAt?: Date }

// All fields required.
type UserComplete = Required<User>;

// Pick a subset.
type UserPublic = Pick<User, "id" | "email">;

// Drop a subset.
type UserWithoutBan = Omit<User, "bannedAt">;

// Map every value type. Often used for forms.
type FormStrings = Record<keyof User, string>;`}</CodeBlock>

			<h3>5. Literal types and as const</h3>
			<CodeBlock lang="ts">{`// Without 'as const', TS widens "user" to string.
const role1 = "user";              // type: string

// With 'as const', the literal "user" sticks.
const role2 = "user" as const;     // type: "user"

const ROLES = ["user", "admin", "moderator"] as const;
type Role = typeof ROLES[number];  // "user" | "admin" | "moderator"`}</CodeBlock>

			<h2>Inference is not magic</h2>
			<p>
				TypeScript infers types from the right-hand side. The trick is knowing when
				inference picks something narrower than you wanted.
			</p>
			<Compare
				left={{
					title: "Inference too wide",
					body: (
						<CodeBlock lang="ts">{`// arr is string[], so push("anything") works.
const arr = ["a", "b"];
arr.push("c");`}</CodeBlock>
					),
				}}
				right={{
					title: "Inference pinned with as const",
					body: (
						<CodeBlock lang="ts">{`// arr is readonly ["a", "b"], push is forbidden.
const arr = ["a", "b"] as const;
// arr.push("c"); // type error
type Item = typeof arr[number]; // "a" | "b"`}</CodeBlock>
					),
				}}
			/>

			<h2>Type vs interface, and when it matters</h2>
			<p>
				For most cases they are interchangeable. Pick one and stay consistent. Two
				edge cases:
			</p>
			<ul>
				<li>
					<code>interface</code> supports declaration merging: two declarations of the
					same interface get merged. Useful when you augment a library's types from a
					{" "}
					<code>.d.ts</code>.
				</li>
				<li>
					<code>type</code> can express things <code>interface</code> cannot, like
					unions and mapped types.
				</li>
			</ul>

			<h2>Narrowing</h2>
			<p>
				TypeScript narrows a union type as you check it. The compiler reads
				{" "}
				<code>if</code> statements, <code>typeof</code>, <code>in</code>, equality
				checks, and class checks, and tightens the type inside each branch.
			</p>
			<CodeBlock lang="ts">{`function describe(value: string | number | null) {
  if (value === null) return "nothing";
  if (typeof value === "string") return value.toUpperCase(); // narrowed to string
  return value.toFixed(2);                                   // narrowed to number
}

// 'in' operator works on object unions:
type Cat = { meow(): void };
type Dog = { bark(): void };
function speak(pet: Cat | Dog) {
  if ("meow" in pet) return pet.meow();
  return pet.bark();
}`}</CodeBlock>

			<h2>satisfies</h2>
			<p>
				<code>satisfies</code> is the modern way to say "this value matches a type, but
				keep its narrow inferred type". It is strictly better than the older
				{" "}
				<code>: T</code> annotation when you also want autocomplete on the original
				keys.
			</p>
			<CodeBlock lang="ts">{`type RouteConfig = Record<string, { path: string; auth: boolean }>;

// With ':' the keys are widened to string, so config.home is fine but
// config.somethingElse is also "fine".
const a: RouteConfig = {
  home: { path: "/", auth: false },
};

// With 'satisfies' the keys remain "home", and config.home is still typed
// correctly. config.somethingElse is a type error.
const b = {
  home: { path: "/", auth: false },
} satisfies RouteConfig;`}</CodeBlock>

			<h2>any vs unknown vs never</h2>
			<table>
				<thead>
					<tr>
						<th>Type</th>
						<th>Means</th>
						<th>When to use</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>
							<code>any</code>
						</td>
						<td>"Skip type checking on this value."</td>
						<td>Never on purpose. Almost always a bug.</td>
					</tr>
					<tr>
						<td>
							<code>unknown</code>
						</td>
						<td>"This is some value. You must check before using it."</td>
						<td>Untrusted input: JSON parses, error catches.</td>
					</tr>
					<tr>
						<td>
							<code>never</code>
						</td>
						<td>"This value cannot exist."</td>
						<td>Exhaustiveness checks, functions that throw.</td>
					</tr>
				</tbody>
			</table>

			<CodeBlock lang="ts">{`// Exhaustiveness check: the never branch fails the build if a new
// variant is added to LoadResult and you forget to handle it.
function describe(r: LoadResult): string {
  switch (r.status) {
    case "loading": return "Loading...";
    case "ok": return r.data.email;
    case "error": return r.message;
    default: {
      const _check: never = r;
      return _check;
    }
  }
}`}</CodeBlock>

			<h2>The catch-clause variable is unknown</h2>
			<p>
				Under strict mode the variable in <code>catch (err)</code> is typed
				{" "}
				<code>unknown</code>. You cannot read <code>err.message</code> without proving
				it is an Error first.
			</p>
			<CodeBlock lang="ts">{`try {
  await doThing();
} catch (err) {
  // Wrong: err is unknown, this is a compile error.
  // console.log(err.message);

  // Right:
  if (err instanceof Error) {
    console.log(err.message);
  } else {
    console.log("Unknown error", err);
  }
}`}</CodeBlock>

			<h2>Common interview questions</h2>
			<ul>
				<li>
					<strong>What is the difference between <code>any</code> and <code>unknown</code>?</strong>
					{" "}
					<code>any</code> opts out of checks. <code>unknown</code> forces you to check
					before using. Use <code>unknown</code> for untrusted input, never
					{" "}
					<code>any</code> on purpose.
				</li>
				<li>
					<strong>What does a generic give you that <code>any</code> does not?</strong>
					{" "}
					Generics keep the relationship between input and output. With <code>any</code>
					{" "}
					you lose that connection. <code>identity&lt;T&gt;(v: T): T</code> tells the
					caller they get back the same type they passed in;
					{" "}
					<code>identity(v: any): any</code> tells them nothing.
				</li>
				<li>
					<strong>What does <code>satisfies</code> do that <code>:</code> does not?</strong>
					{" "}
					<code>satisfies</code> checks the value against the type without widening the
					value's inferred type. You keep the narrow keys and literal values.
				</li>
				<li>
					<strong>What is a discriminated union?</strong>
					{" "}
					A union of object types where each variant has a unique literal field (the
					tag). The compiler narrows the union by checking the tag.
				</li>
			</ul>

			<h2>Where to read more</h2>
			<p>
				The{" "}
				<a href="https://www.typescriptlang.org/docs/handbook/2/basic-types.html">
					official handbook
				</a>{" "}
				is excellent and short. The{" "}
				<a href="https://www.typescriptlang.org/play">TS playground</a> is the fastest
				way to test what a type looks like.
			</p>
		</TopicLayout>
	);
}
