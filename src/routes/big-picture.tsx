import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "../components/Stub";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/big-picture")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/big-picture"
			group="Wrap-up"
			title="The big picture"
			tagline="Tracing one click through every layer of the stack."
		>
			<Stub what="The big picture" />
		</TopicLayout>
	);
}
