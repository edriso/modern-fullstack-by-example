import { Link, Outlet, createRootRoute, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { groupedTopics } from "../topics";

export const Route = createRootRoute({
	component: RootLayout,
});

function RootLayout() {
	const [menuOpen, setMenuOpen] = useState(false);
	const { location } = useRouterState();

	// Close the mobile menu whenever the user navigates to a new page.
	useEffect(() => {
		setMenuOpen(false);
	}, [location.pathname]);

	const groups = groupedTopics();

	return (
		<div className={`app${menuOpen ? " app--menu-open" : ""}`}>
			<button
				type="button"
				className="app__sidebar-overlay"
				aria-hidden="true"
				onClick={() => setMenuOpen(false)}
			/>

			<header className="app__menu-toggle">
				<button type="button" onClick={() => setMenuOpen((v) => !v)}>
					{menuOpen ? "Close" : "Menu"}
				</button>
				<span className="app__brand">Modern Full-Stack by Example</span>
			</header>

			<aside className="app__sidebar" aria-label="Topics">
				<h1 className="sidebar__brand">Modern Full-Stack</h1>
				<p className="sidebar__tagline">A junior-friendly handbook for the TanStack stack.</p>
				{groups.map((g) => (
					<nav key={g.group} className="sidebar__group">
						<p className="sidebar__group-title">{g.group}</p>
						{g.items.map((t) => (
							<Link
								key={t.slug}
								to={t.slug}
								className="sidebar__link"
								activeProps={{ className: "sidebar__link is-active" }}
								activeOptions={{ exact: true }}
							>
								{t.title}
							</Link>
						))}
					</nav>
				))}
			</aside>

			<main className="app__main">
				<Outlet />
			</main>
		</div>
	);
}
