import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Callout } from "./Callout";

describe("Callout", () => {
	it('renders a default "Note" title', () => {
		render(
			<Callout>
				<p>some body text</p>
			</Callout>,
		);
		expect(screen.getByText("Note")).toBeInTheDocument();
		expect(screen.getByText("some body text")).toBeInTheDocument();
	});

	it('renders "Tip" by default for kind=tip', () => {
		render(
			<Callout kind="tip">
				<p>tip body</p>
			</Callout>,
		);
		expect(screen.getByText("Tip")).toBeInTheDocument();
	});

	it('renders "Heads up" by default for kind=warn', () => {
		render(
			<Callout kind="warn">
				<p>warn body</p>
			</Callout>,
		);
		expect(screen.getByText("Heads up")).toBeInTheDocument();
	});

	it("uses an explicit title when provided, regardless of kind", () => {
		render(
			<Callout kind="tip" title="Pro tip">
				<p>body</p>
			</Callout>,
		);
		expect(screen.getByText("Pro tip")).toBeInTheDocument();
		// And the default "Tip" is not present.
		expect(screen.queryByText("Tip")).not.toBeInTheDocument();
	});

	it("applies the kind-specific CSS modifier class", () => {
		const { container } = render(
			<Callout kind="warn">
				<p>x</p>
			</Callout>,
		);
		const aside = container.querySelector("aside");
		expect(aside).toHaveClass("callout", "callout--warn");
	});
});
