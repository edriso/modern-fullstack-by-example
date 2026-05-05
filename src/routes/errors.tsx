import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "../components/Stub";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/errors")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/errors"
			group="Backend"
			title="Error handling"
			tagline="A domain error taxonomy that maps cleanly to gRPC and HTTP."
		>
			<Stub what="Error handling" />
		</TopicLayout>
	);
}
