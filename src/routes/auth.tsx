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
			group="Backend"
			title="Auth: hashing, JWT, sessions"
			tagline="bcrypt, JWT pinning, and iron-session cookies done right."
		>
			<Stub what="Auth" />
		</TopicLayout>
	);
}
