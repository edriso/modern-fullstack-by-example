import { createFileRoute } from "@tanstack/react-router";
import { Callout } from "../components/Callout";
import { CodeBlock } from "../components/CodeBlock";
import { Compare } from "../components/Compare";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/react")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/react"
			group="Language"
			title="Modern React"
			tagline="Hooks deep dive, effect dependencies, and what React 19 changes for everyday code."
		>
			<p>
				If you have been writing React for a while, this page focuses on the parts
				people get wrong in code review: the rules of hooks, why <code>useEffect</code>{" "}
				is the source of so many bugs, when to reach for <code>useMemo</code> and
				{" "}
				<code>useCallback</code>, and what React 19 changes about all of this.
			</p>

			<h2>The rules of hooks, in plain English</h2>
			<ol>
				<li>
					<strong>Always call hooks at the top of a component or another hook.</strong>{" "}
					No <code>if</code>, no <code>for</code>, no early <code>return</code> before a
					hook.
				</li>
				<li>
					<strong>Call hooks in the same order every render.</strong> React identifies
					them by call order, not by name.
				</li>
			</ol>
			<p>
				If you break either rule, the bug is rarely the one you expect. State you set
				with <code>useState</code> ends up belonging to a different hook. Effects fire
				at unexpected moments. The lint rule <code>react-hooks/rules-of-hooks</code>{" "}
				exists to catch this at edit time.
			</p>

			<h2>useState: state that survives re-renders</h2>
			<CodeBlock lang="tsx">{`function Counter() {
  // useState returns a tuple: the current value and a setter.
  // The initial argument runs only on the first render.
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
}`}</CodeBlock>
			<p>
				Two things every junior should internalise:
			</p>
			<ul>
				<li>
					Setters are <strong>asynchronous from your code's view</strong>. After
					{" "}
					<code>setCount(count + 1)</code>, the variable <code>count</code> in the
					current render is still the old value. The new value lands on the next
					render.
				</li>
				<li>
					If the new value depends on the previous value, use the function form:
					{" "}
					<code>setCount(c =&gt; c + 1)</code>. That's safer when multiple updates can
					be batched.
				</li>
			</ul>

			<h2>useEffect, the most-misused hook</h2>
			<p>
				<code>useEffect</code> runs after the DOM updates. The dependency array tells
				React when to re-run it.
			</p>
			<CodeBlock lang="tsx">{`useEffect(() => {
  // body runs after render
  return () => {
    // cleanup runs before the next time body runs, and on unmount
  };
}, [dep1, dep2]);`}</CodeBlock>

			<h3>The three dependency-array rules</h3>
			<ol>
				<li>
					<strong>No second argument</strong>: the effect runs after every render. Almost
					never what you want.
				</li>
				<li>
					<strong>Empty array <code>[]</code></strong>: runs once after mount and cleans
					up on unmount.
				</li>
				<li>
					<strong>Array with values</strong>: runs whenever any of those values change
					(by <code>===</code>).
				</li>
			</ol>

			<Callout kind="warn" title="The bug that keeps biting juniors">
				<p>
					Putting a function or object created in the component body into the deps array
					makes the effect re-run <em>every render</em>, because the function is a new
					reference each time. Either define the function inside the effect, wrap it in
					{" "}
					<code>useCallback</code>, or list the primitive values it depends on instead.
				</p>
			</Callout>

			<Compare
				left={{
					title: "Bug: effect re-fires forever",
					body: (
						<CodeBlock lang="tsx">{`function Profile({ id }) {
  const [data, setData] = useState(null);

  // load is recreated every render,
  // so the effect's deps change every render,
  // so the effect runs every render. Loop.
  const load = async () => {
    const r = await fetch(\`/users/\${id}\`);
    setData(await r.json());
  };

  useEffect(() => {
    load();
  }, [load]);
}`}</CodeBlock>
					),
				}}
				right={{
					title: "Fixed: list the actual dependency",
					body: (
						<CodeBlock lang="tsx">{`function Profile({ id }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Define inline. Only re-runs when id changes.
    (async () => {
      const r = await fetch(\`/users/\${id}\`);
      setData(await r.json());
    })();
  }, [id]);
}`}</CodeBlock>
					),
				}}
			/>

			<h3>What useEffect is not for</h3>
			<p>The React team has been trying to retire most uses of <code>useEffect</code>:</p>
			<ul>
				<li>
					<strong>Don't fetch data in <code>useEffect</code> if you can help it.</strong>
					{" "}
					Use a query library (TanStack Query, SWR) or a server-side loader. Effects
					give you racing requests, no caching, and no built-in retry.
				</li>
				<li>
					<strong>Don't sync derived state.</strong> If state B can be computed from
					state A, just compute it during render.
				</li>
				<li>
					<strong>Don't use it for events.</strong> If something happens because the user
					clicked, put the logic in the event handler, not in an effect that watches a
					flag.
				</li>
			</ul>
			<p>
				What it <em>is</em> for: subscribing to outside systems (DOM events, websockets,
				media APIs), and cleaning up afterwards.
			</p>

			<h2>Cleanup: the rule that prevents leaks</h2>
			<CodeBlock lang="tsx">{`useEffect(() => {
  const onResize = () => setWidth(window.innerWidth);
  window.addEventListener("resize", onResize);

  // Crucial: tell React how to undo the effect when the component
  // unmounts or the deps change.
  return () => window.removeEventListener("resize", onResize);
}, []);`}</CodeBlock>
			<p>
				Forgetting cleanup is how you ship leaks. Open dev tools, navigate away from the
				page, navigate back, repeat: an effect without cleanup will keep adding
				subscribers each visit.
			</p>

			<h2>useMemo and useCallback</h2>
			<p>
				Both cache something across renders. <code>useMemo</code> caches a computed
				value, <code>useCallback</code> caches a function reference. Both have the same
				dependency-array semantics as <code>useEffect</code>.
			</p>
			<CodeBlock lang="tsx">{`// Cache a derived value: rebuilds the array only when items changes.
const sorted = useMemo(() => items.slice().sort(), [items]);

// Cache a function reference: a child memoised with React.memo can
// then skip re-rendering when this callback is part of its props.
const onPick = useCallback((id: string) => {
  setSelected(id);
}, []);`}</CodeBlock>
			<Callout kind="warn" title="Don't reach for these by default">
				<p>
					Wrapping every value in <code>useMemo</code> makes code slower and harder to
					read. The right time is when you've measured a real cost, or when an effect
					or memoised child depends on the value.
				</p>
			</Callout>

			<h2>Lifting state up vs context vs server state</h2>
			<table>
				<thead>
					<tr>
						<th>Where the state lives</th>
						<th>Use when</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Local <code>useState</code></td>
						<td>Only this component cares about the value.</td>
					</tr>
					<tr>
						<td>Lifted to a parent</td>
						<td>Two siblings need the same value.</td>
					</tr>
					<tr>
						<td>Context (<code>useContext</code>)</td>
						<td>Many components across the tree need it (theme, current user).</td>
					</tr>
					<tr>
						<td>Server state library</td>
						<td>It originated from the server (lists, profiles, anything you fetch).</td>
					</tr>
				</tbody>
			</table>
			<p>
				A common mistake is reaching for context for server state. Server state has
				caching, refetching, mutations, and stale handling. A query library handles all
				that; context cannot.
			</p>

			<h2>Keys in lists</h2>
			<CodeBlock lang="tsx">{`// Bad: index as key. Reordering or filtering causes React to re-use the
// wrong DOM nodes, which breaks input focus and animations.
items.map((item, i) => <Row key={i} item={item} />);

// Good: stable id from the data.
items.map((item) => <Row key={item.id} item={item} />);`}</CodeBlock>

			<h2>What changed in React 19</h2>
			<ul>
				<li>
					<strong>The new <code>use()</code> hook</strong>: lets a component await a
					promise or read context. With the React Compiler, this replaces a lot of
					{" "}
					<code>useEffect</code> + state pairs.
				</li>
				<li>
					<strong>Actions and form support</strong>: <code>&lt;form action=&#123;fn&#125;&gt;</code>{" "}
					now plays nicely with React, including <code>useFormStatus</code> and
					{" "}
					<code>useActionState</code> for pending UI.
				</li>
				<li>
					<strong>The React Compiler (still rolling out)</strong>: an opt-in compiler
					that auto-memoises components and values, removing most need for
					{" "}
					<code>useMemo</code> and <code>useCallback</code> by hand.
				</li>
				<li>
					<strong><code>ref</code> is a regular prop</strong>: <code>forwardRef</code> is
					no longer required for most cases.
				</li>
				<li>
					<strong>Better hydration errors</strong>: real diffs instead of the
					"hydration failed because the server-rendered tree did not match" message.
				</li>
			</ul>

			<h2>Common interview questions</h2>
			<ul>
				<li>
					<strong>Why does <code>setState</code> not update immediately?</strong>{" "}
					React batches updates. Within the same event handler, multiple
					{" "}
					<code>setX</code> calls produce one re-render. Use the functional setter when
					the next value depends on the previous value.
				</li>
				<li>
					<strong>What is a stale closure?</strong> A function created in an earlier
					render captures the variables that existed then. If you call it later, it
					still sees those old values. Common cause: passing a callback into an event
					listener inside a <code>useEffect</code> with empty deps. Fix by listing the
					real deps or using a ref.
				</li>
				<li>
					<strong>When would you use <code>useReducer</code> over <code>useState</code>?</strong>{" "}
					When several related state fields change together, when next state is a
					function of previous state plus an action, or when you want to centralise
					logic outside the component.
				</li>
				<li>
					<strong>What's wrong with using array index as a list key?</strong> Indexes
					change when the list is reordered or filtered, so React reuses the wrong DOM
					node. Use a stable id from the data instead.
				</li>
			</ul>
		</TopicLayout>
	);
}
