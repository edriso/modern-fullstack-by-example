import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "../components/Stub";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/biome")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/biome"
			group="Workspace"
			title="Biome"
			tagline="Linter and formatter in one binary, replacing ESLint and Prettier."
		>
			<Stub what="Biome" />
		</TopicLayout>
	);
}
