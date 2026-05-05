import { createFileRoute } from "@tanstack/react-router";
import { Callout } from "../components/Callout";
import { CodeBlock } from "../components/CodeBlock";
import { Compare } from "../components/Compare";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/tanstack-router")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/tanstack-router"
			group="Frontend"
			title="TanStack Router"
			tagline="File-based routing with end-to-end typed params, search params, and loaders."
		>
			<p>
				TanStack Router is the routing library used inside TanStack Start, but it works
				on its own with plain Vite + React too. The selling point is that every URL
				piece (path params, search params, loader data) is fully typed across your
				whole app.
			</p>

			<Compare
				left={{
					title: "React Router (what you might know)",
					body: (
						<CodeBlock lang="tsx">{`<Routes>
  <Route path="/users/:id" element={<UserPage />} />
</Routes>

function UserPage() {
  // params are typed as 'Record<string, string | undefined>'
  // so id is string | undefined.
  const { id } = useParams();
}`}</CodeBlock>
					),
				}}
				right={{
					title: "TanStack Router",
					body: (
						<CodeBlock lang="tsx" filename="src/routes/users.$id.tsx">{`import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/users/$id")({
  component: UserPage,
});

function UserPage() {
  // id is typed as string. The router knows the route exists,
  // so navigating to "/users/abc" autocompletes too.
  const { id } = Route.useParams();
}`}</CodeBlock>
					),
				}}
			/>

			<h2>How file-based routing works</h2>
			<p>
				A Vite plugin watches <code>src/routes/**</code>. Each file is a route. The
				plugin generates a <code>routeTree.gen.ts</code> that lists every route, the
				params it has, and the data it loads. The router uses that generated file to
				type every <code>Link</code>, <code>useParams</code>, and{" "}
				<code>useSearch</code> call.
			</p>
			<CodeBlock lang="text">{`src/routes/
  __root.tsx         -> the layout that wraps every page
  index.tsx          -> "/"
  about.tsx          -> "/about"
  users.tsx          -> "/users"
  users.$id.tsx      -> "/users/:id"  ($id is a path param)
  users.$id.edit.tsx -> "/users/:id/edit"
  posts/
    index.tsx        -> "/posts"
    $postId.tsx      -> "/posts/:postId"
  _authed/           -> pathless layout: groups routes that share a check
    settings.tsx     -> "/settings"`}</CodeBlock>
			<Callout kind="tip" title="Two filename conventions to remember">
				<p>
					<code>$param</code> means a path parameter (the leading <code>$</code> is the
					wildcard marker). <code>_layout</code> with a leading underscore is a
					"pathless" route: it adds a layout in the tree without showing in the URL.
				</p>
			</Callout>

			<h2>The shape of a route file</h2>
			<CodeBlock lang="tsx" filename="src/routes/posts.$postId.tsx">{`import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/posts/$postId")({
  // Run before the component. Returned data is available via Route.useLoaderData().
  loader: async ({ params }) => {
    const post = await getPost(params.postId);
    return post;
  },

  // Validate and type-narrow ?page=... and ?sort=...
  validateSearch: (raw) => ({
    page: Number(raw.page ?? 1),
    sort: raw.sort === "asc" ? "asc" : "desc",
  }),

  component: PostPage,
});

function PostPage() {
  const { postId } = Route.useParams();      // typed as string
  const { page, sort } = Route.useSearch();   // typed { page: number; sort: "asc" | "desc" }
  const post = Route.useLoaderData();         // typed as the loader's return
}`}</CodeBlock>

			<h2>Linking and navigation</h2>
			<CodeBlock lang="tsx">{`import { Link, useNavigate } from "@tanstack/react-router";

// 'to' autocompletes from the route tree. 'params' is typed against /posts/$postId.
<Link to="/posts/$postId" params={{ postId: "abc" }} search={{ page: 1, sort: "desc" }}>
  Open post
</Link>

// Imperative navigation:
const navigate = useNavigate();
navigate({ to: "/posts/$postId", params: { postId: "abc" } });`}</CodeBlock>
			<Callout kind="note" title="Why typed search params matter">
				<p>
					Without validation, <code>?page=banana</code> from someone bookmarking the
					wrong URL crashes <code>parseInt</code> at runtime. With{" "}
					<code>validateSearch</code>, the URL is rewritten to a sane default, the
					component receives a typed object, and you never write{" "}
					<code>Number(searchParams.get("page"))</code> again.
				</p>
			</Callout>

			<h2>Loaders: data before render</h2>
			<p>
				Loaders run before the component renders. The router shows the loading state,
				the loader resolves, the component renders with the data. No flash of empty
				content, no <code>useEffect</code> + <code>useState</code> + <code>fetch</code>{" "}
				dance.
			</p>
			<CodeBlock lang="tsx">{`export const Route = createFileRoute("/posts/$postId")({
  loader: async ({ params }) => {
    // The loader can throw redirect()/notFound() and the router handles it.
    const post = await getPost(params.postId);
    if (!post) throw notFound();
    return post;
  },
  // While the loader runs, the router shows this:
  pendingComponent: () => <div>Loading post...</div>,
  errorComponent: ({ error }) => <div>Could not load: {error.message}</div>,
  component: PostPage,
});`}</CodeBlock>

			<h2>Nested layouts and the <code>__root.tsx</code></h2>
			<p>
				The root file is the outermost layout. It typically renders chrome (header,
				sidebar) and an <code>&lt;Outlet /&gt;</code> where child routes appear.
			</p>
			<CodeBlock lang="tsx" filename="src/routes/__root.tsx">{`import { Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <div>
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  ),
});`}</CodeBlock>

			<h2>Pathless routes for guards</h2>
			<p>
				A route file under <code>_authed/</code> wraps its children in a layout that
				does an auth check, without affecting the URL.
			</p>
			<CodeBlock lang="tsx" filename="src/routes/_authed.tsx">{`import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed")({
  beforeLoad: ({ location }) => {
    if (!isLoggedIn()) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: () => <Outlet />,
});`}</CodeBlock>

			<h2>The generated <code>routeTree.gen.ts</code></h2>
			<p>
				The Vite plugin writes this file. It lists every route, every param shape, and
				the union of search params. Two practical points:
			</p>
			<ul>
				<li>
					Don't edit it by hand. It is regenerated on every save.
				</li>
				<li>
					In CI, if you only run <code>tsc --noEmit</code> without booting Vite, the
					file might not exist. Either commit the generated file or run a generator
					step before typecheck. Most modern projects commit it.
				</li>
			</ul>

			<h2>Common interview questions</h2>
			<ul>
				<li>
					<strong>How is TanStack Router's typing different from React Router's?</strong>{" "}
					TanStack generates types from the route tree, so params, search params, and
					loader data are typed end to end. <code>Link</code> autocompletes the path
					and rejects wrong params at compile time.
				</li>
				<li>
					<strong>What is a loader and why use one?</strong> A function that runs
					before the component, returns its data, and the component renders with the
					data already available. Replaces the
					{" "}
					<code>useEffect + useState + fetch</code> pattern, removes flashes of empty
					content, and centralises error/loading UI.
				</li>
				<li>
					<strong>What is <code>validateSearch</code> for?</strong> To turn the messy
					query string into a typed object. It also lets the router deep-link with
					typed params and prevents bad URLs from crashing your component.
				</li>
				<li>
					<strong>Why is there a generated <code>routeTree.gen.ts</code>?</strong>{" "}
					Because the file-based routes are just files at runtime; the router needs an
					index of them to type everything. The plugin generates that index.
				</li>
			</ul>
		</TopicLayout>
	);
}
