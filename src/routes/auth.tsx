import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "../components/Stub";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/auth")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/auth"
			group="bcrypt, JWT pinning, and iron-session cookies done right.:Backend"
			title="Auth\"
			tagline=" hashing, JWT, sessions"
		>
			<Stub what="Auth\" />
		</TopicLayout>
	);
}
