import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "../components/Stub";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/monorepos")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/monorepos"
			group=" one repo, many packages.:Workspace"
			title="Monorepos"
			tagline="pnpm workspaces and Turborepo"
		>
			<Stub what="Monorepos" />
		</TopicLayout>
	);
}
