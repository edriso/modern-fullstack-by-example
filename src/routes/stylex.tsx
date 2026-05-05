import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "../components/Stub";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/stylex")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/stylex"
			group="Frontend"
			title="StyleX"
			tagline="Atomic CSS-in-JS by Meta, compared with CSS Modules and Tailwind."
		>
			<Stub what="StyleX" />
		</TopicLayout>
	);
}
