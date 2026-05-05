import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "../components/Stub";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/n-plus-one")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/n-plus-one"
			group="Data"
			title="The N+1 query problem"
			tagline="Why your endpoint that looks fine in dev brings prod down."
		>
			<Stub what="The N+1 query problem" />
		</TopicLayout>
	);
}
