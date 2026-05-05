import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Compare } from "./Compare";

describe("Compare", () => {
	it("renders both column titles and bodies", () => {
		render(
			<Compare
				left={{ title: "Old way", body: <p>express handler</p> }}
				right={{ title: "New way", body: <p>gRPC handler</p> }}
			/>,
		);
		expect(screen.getByText("Old way")).toBeInTheDocument();
		expect(screen.getByText("New way")).toBeInTheDocument();
		expect(screen.getByText("express handler")).toBeInTheDocument();
		expect(screen.getByText("gRPC handler")).toBeInTheDocument();
	});
});
