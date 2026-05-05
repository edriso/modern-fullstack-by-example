import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "../components/Stub";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/react")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/react"
			group="Language"
			title="Modern React"
			tagline="Hooks, effect dependencies, and what changed in React 19."
		>
			<Stub what="Modern React" />
		</TopicLayout>
	);
}
