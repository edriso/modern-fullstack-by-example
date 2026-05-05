import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "../components/Stub";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/ci-cd")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/ci-cd"
			group="Workspace"
			title="CI with GitHub Actions"
			tagline="Run typecheck, lint, tests, and builds on every PR."
		>
			<Stub what="CI with GitHub Actions" />
		</TopicLayout>
	);
}
