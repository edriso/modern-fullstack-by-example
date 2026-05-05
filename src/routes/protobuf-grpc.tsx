import { createFileRoute } from "@tanstack/react-router";
import { Stub } from "../components/Stub";
import { TopicLayout } from "../components/TopicLayout";

export const Route = createFileRoute("/protobuf-grpc")({
	component: Page,
});

function Page() {
	return (
		<TopicLayout
			slug="/protobuf-grpc"
			group="Backend"
			title="Protocol Buffers and gRPC"
			tagline="What protobuf is and why a typed RPC protocol beats hand-rolled REST."
		>
			<Stub what="Protocol Buffers and gRPC" />
		</TopicLayout>
	);
}
