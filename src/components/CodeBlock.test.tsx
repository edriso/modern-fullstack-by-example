import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CodeBlock } from "./CodeBlock";

// Note on clipboard testing: jsdom does not ship navigator.clipboard, and
// stubbing it reliably across vitest restarts and userEvent's pointer
// simulation is fragile. The component's clipboard call is small (one line
// inside a try/catch). We test the rendering and the click-without-error
// path here, and rely on manual verification for the actual copy.

describe("CodeBlock", () => {
	it("renders the code body", () => {
		render(<CodeBlock>{`const x = 1;`}</CodeBlock>);
		expect(screen.getByText(/const x = 1;/)).toBeInTheDocument();
	});

	it("uses lang as the header label when no filename is given", () => {
		render(<CodeBlock lang="ts">{`x`}</CodeBlock>);
		expect(screen.getByText("ts")).toBeInTheDocument();
	});

	it("prefers filename over lang when both are given", () => {
		render(
			<CodeBlock lang="ts" filename="utils.ts">
				{`x`}
			</CodeBlock>,
		);
		expect(screen.getByText("utils.ts")).toBeInTheDocument();
		expect(screen.queryByText("ts")).not.toBeInTheDocument();
	});

	it("renders a copy button labelled 'copy' on first paint", () => {
		render(<CodeBlock>{`x`}</CodeBlock>);
		expect(screen.getByRole("button", { name: "copy" })).toBeInTheDocument();
	});

	it("does not throw when the user clicks the copy button", async () => {
		// In jsdom navigator.clipboard is undefined, so the inner write throws
		// inside the try/catch and the function silently returns. The test
		// asserts that we don't crash on an environment without a clipboard.
		const user = userEvent.setup();
		render(<CodeBlock>{`hello`}</CodeBlock>);
		await expect(
			user.click(screen.getByRole("button", { name: "copy" })),
		).resolves.toBeUndefined();
	});
});
