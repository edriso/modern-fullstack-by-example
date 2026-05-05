import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "../components/Stub";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/drizzle")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/drizzle"
			group="Data"
			title="Drizzle ORM"
			tagline="Type-safe SQL without the heavyweight feel of an ORM."
		>
			<Stub what="Drizzle ORM" />
		</TopicLayout>
	);
}
