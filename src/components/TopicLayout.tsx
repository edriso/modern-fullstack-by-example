import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { getNeighbors } from "../topics";

interface TopicLayoutProps {
	slug: string;
	title: string;
	tagline?: string;
	group?: string;
	children: ReactNode;
}

/**
 * Wraps every topic page so they all share the same shape:
 *   - breadcrumb + heading + lede
 *   - the page body
 *   - prev/next pager generated from src/topics.ts
 */
export function TopicLayout({ slug, title, tagline, group, children }: TopicLayoutProps) {
	const { prev, next } = getNeighbors(slug);

	return (
		<article>
			{group ? <div className="topic__breadcrumb">{group}</div> : null}
			<h1>{title}</h1>
			{tagline ? <p className="topic__lede">{tagline}</p> : null}
			{children}

			<nav className="topic__pager">
				{prev ? (
					<Link to={prev.slug} className="topic__pager--prev">
						<div className="topic__pager-label">Previous</div>
						<div className="topic__pager-title">{prev.title}</div>
					</Link>
				) : (
					<span />
				)}
				{next ? (
					<Link to={next.slug} className="topic__pager--next">
						<div className="topic__pager-label">Next</div>
						<div className="topic__pager-title">{next.title}</div>
					</Link>
				) : (
					<span />
				)}
			</nav>
		</article>
	);
}
