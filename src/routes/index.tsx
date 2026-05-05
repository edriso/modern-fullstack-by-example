import { Link, createFileRoute } from "@tanstack/react-router";
import { Callout } from "../components/Callout";
import { TopicLayout } from "../components/TopicLayout";
import { TOPICS } from "../topics";

export const Route = createFileRoute("/")({
	component: WelcomePage,
});

function WelcomePage() {
	const items = TOPICS.filter((t) => t.slug !== "/");

	return (
		<TopicLayout
			slug="/"
			group="Start here"
			title="Welcome"
			tagline="A junior-friendly handbook for the modern TanStack + gRPC + Drizzle stack. Everything in one place, in plain English."
		>
			<p>
				This site exists because most modern stack tutorials assume you already know the
				modern stack. If your day job has been React on the frontend and Express plus
				MySQL on the backend, the jump to TanStack Start, gRPC, Drizzle, and a Turborepo
				monorepo is a lot at once. Here we walk through every piece, one page at a time,
				and tie each one back to a habit you already have.
			</p>

			<h2>How this is structured</h2>
			<p>Each topic page follows the same shape:</p>
			<ul>
				<li>
					<strong>What it is</strong> in two sentences.
				</li>
				<li>
					<strong>Why it exists</strong>, including the older approach it replaces.
				</li>
				<li>
					<strong>The smallest working example</strong> you can copy and run.
				</li>
				<li>
					<strong>Compared to what you know</strong>: a side-by-side with Express, MySQL,
					or a CRA-style React app where it helps.
				</li>
				<li>
					<strong>Common mistakes</strong> and the questions an interviewer might ask.
				</li>
			</ul>

			<Callout kind="tip" title="Read in order, but jump if you need to">
				<p>
					The order in the sidebar is the order I'd read in: language first, then frontend,
					then the backend, then the cross-cutting workspace tools, then testing, then a
					big-picture wrap-up. Topics are mostly self-contained, so if you only need
					"what's an N+1?" today, jump straight there.
				</p>
			</Callout>

			<h2>Who this is for</h2>
			<p>
				You write React. You can build a CRUD app with Express and MySQL. You've heard
				of TypeScript but haven't used generics in anger. Names like "BFF",
				"protobuf", "AsyncLocalStorage", and "trace ID" feel like buzzwords you'd
				rather not be quizzed on. After working through this handbook you should be
				able to:
			</p>
			<ul>
				<li>Read a real TanStack Start codebase and know what each file does.</li>
				<li>
					Explain in an interview why someone would pick gRPC over REST, and what they
					give up.
				</li>
				<li>Write a Drizzle schema with the right indexes the first time.</li>
				<li>Spot an N+1 query in code review without running it.</li>
				<li>
					Add a domain error class that maps to the right gRPC status code, and explain
					why a swallowed try/catch hurts more than a noisy 500.
				</li>
			</ul>

			<h2>Curriculum</h2>
			<p>Every page is linked from here. Same content as the sidebar, just easier to scan.</p>
			<div className="hub">
				{items.map((t, i) => (
					<Link key={t.slug} to={t.slug} className="hub__card">
						<div className="hub__card-num">{String(i + 1).padStart(2, "0")}</div>
						<div className="hub__card-title">{t.title}</div>
						<p className="hub__card-desc">{t.tagline}</p>
					</Link>
				))}
			</div>

			<h2>One assumption worth stating</h2>
			<p>
				This handbook is written so that you do not need a second tab open. Every page
				covers the topic deep enough to handle interview questions and code review
				comments. Where there's a primary doc you should bookmark anyway, the topic
				page links to it.
			</p>
		</TopicLayout>
	);
}
