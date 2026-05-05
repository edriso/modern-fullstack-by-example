import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "../components/Stub";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/vitest")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/vitest"
			group="Testing"
			title="Unit testing with Vitest"
			tagline="Mocking modules, in-memory DBs, and isolation per test."
		>
			<Stub what="Unit testing with Vitest" />
		</TopicLayout>
	);
}
