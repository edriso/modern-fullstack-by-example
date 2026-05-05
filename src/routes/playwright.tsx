import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "../components/Stub";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/playwright")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/playwright"
			group="Testing"
			title="End-to-end with Playwright"
			tagline="Real browser tests, fixtures, and avoiding flake."
		>
			<Stub what="End-to-end with Playwright" />
		</TopicLayout>
	);
}
