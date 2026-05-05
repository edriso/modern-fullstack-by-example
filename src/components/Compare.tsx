import type { ReactNode } from "react";

interface CompareProps {
	left: { title: string; body: ReactNode };
	right: { title: string; body: ReactNode };
}

/**
 * Two-column "old way / new way" block. Stacks on narrow screens.
 * The left column should usually be the pattern the reader already knows
 * (Express, MySQL, CRA), the right column is the modern stack equivalent.
 */
export function Compare({ left, right }: CompareProps) {
	return (
		<div className="compare">
			<div className="compare__col">
				<div className="compare__head">{left.title}</div>
				<div className="compare__body">{left.body}</div>
			</div>
			<div className="compare__col">
				<div className="compare__head">{right.title}</div>
				<div className="compare__body">{right.body}</div>
			</div>
		</div>
	);
}
