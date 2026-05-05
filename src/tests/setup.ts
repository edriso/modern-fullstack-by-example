import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Unmount and clean DOM between tests so a stale render from one test
// doesn't leak into the next.
afterEach(() => {
	cleanup();
});
