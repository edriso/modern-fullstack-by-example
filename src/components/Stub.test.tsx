import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Stub } from "./Stub";

describe("Stub", () => {
	it("renders the placeholder with the topic name woven into the message", () => {
		render(<Stub what="Drizzle ORM" />);
		expect(screen.getByText(/Coming next/i)).toBeInTheDocument();
		expect(screen.getByText(/Drizzle ORM/)).toBeInTheDocument();
	});
});
