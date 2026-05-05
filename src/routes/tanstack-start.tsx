import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "../components/Stub";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/tanstack-start")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/tanstack-start"
			group="Frontend"
			title="TanStack Start"
			tagline="SSR, server functions, and how the BFF pattern fits in."
		>
			<Stub what="TanStack Start" />
		</TopicLayout>
	);
}
