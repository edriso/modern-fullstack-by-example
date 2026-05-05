import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "../components/Stub";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/typescript")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/typescript"
			group="Language"
			title="TypeScript fundamentals"
			tagline="Strict mode, generics, and the type tricks you keep seeing."
		>
			<Stub what="TypeScript fundamentals" />
		</TopicLayout>
	);
}
