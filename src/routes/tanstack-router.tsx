import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "../components/Stub";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/tanstack-router")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/tanstack-router"
			group="Frontend"
			title="TanStack Router"
			tagline="File-based routing, params, search params, and loaders."
		>
			<Stub what="TanStack Router" />
		</TopicLayout>
	);
}
