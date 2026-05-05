import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "../components/Stub";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/bff")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/bff"
			group=" why you might want one and where auth lives.:Backend"
			title="The BFF pattern"
			tagline="Backend-for-frontend"
		>
			<Stub what="The BFF pattern" />
		</TopicLayout>
	);
}
