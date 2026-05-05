import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "../components/Stub";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/observability")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/observability"
			group="Backend"
			title="Observability"
			tagline="Trace IDs, AsyncLocalStorage, and structured JSON logs."
		>
			<Stub what="Observability" />
		</TopicLayout>
	);
}
