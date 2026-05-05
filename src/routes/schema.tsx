import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "../components/Stub";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/schema")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/schema"
			group="Data"
			title="Schema and relations"
			tagline="Designing tables, indexes, foreign keys, and timestamps."
		>
			<Stub what="Schema and relations" />
		</TopicLayout>
	);
}
