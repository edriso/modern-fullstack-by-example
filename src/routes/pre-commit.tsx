import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "../components/Stub";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/pre-commit")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/pre-commit"
			group="Workspace"
			title="Pre-commit hooks"
			tagline="husky and biome --staged for sub-second local checks."
		>
			<Stub what="Pre-commit hooks" />
		</TopicLayout>
	);
}
