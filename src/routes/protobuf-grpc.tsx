import { createFileRoute } from "@tanstack/react-router";
import { Callout } from "../components/Callout";
import { CodeBlock } from "../components/CodeBlock";
import { Compare } from "../components/Compare";
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
			tagline="A typed contract between client and server, plus the protocol that carries it. The biggest mental shift coming from Express + JSON."
		>
			<p>
				If you have only built REST APIs with Express, gRPC feels alien at first. The
				good news: under the hood it's still HTTP, still request and response, still
				code calling code. The differences come from making the contract <em>strict</em>.
			</p>

			<h2>Protocol Buffers (protobuf)</h2>
			<p>
				Protobuf is a way to describe data shapes and service interfaces in a small
				schema language. You write a <code>.proto</code> file, run a code generator,
				and you get typed code in every language that needs to use the data.
			</p>

			<CodeBlock lang="proto" filename="protos/users.proto">{`syntax = "proto3";

package chirp;

// A message is a struct: ordered, typed fields.
message User {
  string id = 1;
  string email = 2;
  string display_name = 3;
  optional string avatar_url = 4;
}

// A service is a set of RPC methods.
service UsersService {
  rpc GetUser(GetUserRequest) returns (User);
  rpc UpdateProfile(UpdateProfileRequest) returns (UpdateProfileResponse);
}

message GetUserRequest {
  string username = 1;
  string session_token = 2;
}

message UpdateProfileRequest {
  string session_token = 1;
  optional string display_name = 2;
  optional string bio = 3;
}

message UpdateProfileResponse {
  bool success = 1;
  optional string error = 2;
}`}</CodeBlock>

			<Callout kind="note" title="What those numbers next to fields are">
				<p>
					Each field has a tag number (<code>= 1</code>, <code>= 2</code>, etc.). On the
					wire, those numbers identify the field instead of the field name. You can
					rename a field freely; just don't reuse a tag number for a new meaning, and
					never delete a tag without marking it reserved.
				</p>
			</Callout>

			<h3>Why protobuf instead of JSON</h3>
			<table>
				<thead>
					<tr>
						<th></th>
						<th>JSON</th>
						<th>Protobuf</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Schema</td>
						<td>None by default; OpenAPI bolted on</td>
						<td>The <code>.proto</code> file is the schema</td>
					</tr>
					<tr>
						<td>Wire format</td>
						<td>Text. Field names repeated on every payload.</td>
						<td>Binary. Field tags only.</td>
					</tr>
					<tr>
						<td>Size</td>
						<td>Larger</td>
						<td>~30-70% smaller for the same data</td>
					</tr>
					<tr>
						<td>Generated code</td>
						<td>Hand-written, often drifts</td>
						<td>Generated from the proto file in every language</td>
					</tr>
					<tr>
						<td>Backwards compatibility</td>
						<td>Up to you</td>
						<td>Strict rules baked into the format</td>
					</tr>
				</tbody>
			</table>

			<h3>The codegen step</h3>
			<p>
				One thing you have to budget for: protobuf needs a build step. A tool reads the
				<code>.proto</code> files and emits TypeScript (and Go, Python, etc.). For
				TypeScript the popular generator is <code>@protobuf-ts/plugin</code>. The
				output goes into a <code>generated/</code> folder that's typically gitignored
				or committed depending on the team.
			</p>
			<CodeBlock lang="sh">{`pnpm exec protoc \\
  --ts_out ./generated \\
  --proto_path ./protos \\
  ./protos/*.proto`}</CodeBlock>
			<p>The generator emits types and clients:</p>
			<CodeBlock lang="ts" filename="generated/users.ts">{`export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

export interface IUsersService {
  getUser(req: GetUserRequest, ctx?: ServerCallContext): Promise<User>;
  updateProfile(req: UpdateProfileRequest, ctx?: ServerCallContext): Promise<UpdateProfileResponse>;
}`}</CodeBlock>

			<h2>gRPC: the protocol</h2>
			<p>
				gRPC ("gRPC Remote Procedure Calls", recursive acronym) is a transport built on
				HTTP/2. It carries protobuf-encoded messages between client and server.
			</p>

			<Compare
				left={{
					title: "REST with Express",
					body: (
						<CodeBlock lang="ts">{`// Server
app.get("/users/:username", async (req, res) => {
  const user = await getUser(req.params.username);
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(user);
});

// Client
const r = await fetch("/users/alice");
if (!r.ok) throw new Error("Failed");
const user = await r.json(); // any. Hope the shape is right.`}</CodeBlock>
					),
				}}
				right={{
					title: "gRPC",
					body: (
						<CodeBlock lang="ts">{`// Server (typed against IUsersService)
const usersHandler: IUsersService = {
  async getUser(req) {
    const user = await getUser(req.username);
    if (!user) throw new RpcError("User not found", "NOT_FOUND");
    return user;
  },
};

// Client (typed against UsersServiceClient)
const { response } = await client.users.getUser({
  username: "alice",
  sessionToken,
});
// 'response' is typed as User. No JSON cast.`}</CodeBlock>
					),
				}}
			/>

			<h3>Status codes</h3>
			<p>
				gRPC has its own status code enum, separate from HTTP. The codes are more
				expressive than HTTP for application-level outcomes:
			</p>
			<table>
				<thead>
					<tr>
						<th>gRPC</th>
						<th>HTTP analogue</th>
						<th>Means</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>OK</td><td>200</td><td>Success</td>
					</tr>
					<tr>
						<td>INVALID_ARGUMENT</td><td>400</td><td>Bad client input</td>
					</tr>
					<tr>
						<td>UNAUTHENTICATED</td><td>401</td><td>No or bad credentials</td>
					</tr>
					<tr>
						<td>PERMISSION_DENIED</td><td>403</td><td>Authenticated but not allowed</td>
					</tr>
					<tr>
						<td>NOT_FOUND</td><td>404</td><td>Resource not found</td>
					</tr>
					<tr>
						<td>ALREADY_EXISTS</td><td>409</td><td>Conflict (duplicate key, etc.)</td>
					</tr>
					<tr>
						<td>FAILED_PRECONDITION</td><td>412 / 422</td><td>State doesn't allow this</td>
					</tr>
					<tr>
						<td>UNAVAILABLE</td><td>503</td><td>Try again later</td>
					</tr>
					<tr>
						<td>INTERNAL</td><td>500</td><td>Server bug</td>
					</tr>
				</tbody>
			</table>

			<h2>Four kinds of RPC method</h2>
			<ol>
				<li>
					<strong>Unary</strong>: one request, one response. The default and most
					common.
				</li>
				<li>
					<strong>Server streaming</strong>: one request, many responses. Useful for
					feeds, log tails.
				</li>
				<li>
					<strong>Client streaming</strong>: many requests, one response. File uploads.
				</li>
				<li>
					<strong>Bidirectional streaming</strong>: both ends stream at once. Chat,
					real-time updates.
				</li>
			</ol>
			<p>
				Most everyday work is unary. Streaming is powerful but more complex; reach for
				it only when you actually need it.
			</p>

			<h2>What gRPC gives up</h2>
			<ul>
				<li>
					<strong>Browser-native support</strong>: browsers can't speak gRPC over
					HTTP/2 directly. You need a proxy (gRPC-Web, Connect) or a Node BFF that
					speaks gRPC and exposes HTTP/JSON to the browser. The BFF approach is what
					this stack uses.
				</li>
				<li>
					<strong>Curl-friendliness</strong>: you can't <code>curl</code> a gRPC
					endpoint without tools like <code>grpcurl</code>.
				</li>
				<li>
					<strong>Familiarity</strong>: most developers know REST. gRPC is a learning
					curve.
				</li>
			</ul>

			<h2>What you get in return</h2>
			<ul>
				<li>
					<strong>Type-safe contracts</strong>: rename a field, the codegen catches
					every caller in every language.
				</li>
				<li>
					<strong>Smaller payloads</strong>: binary protobuf vs verbose JSON.
				</li>
				<li>
					<strong>Predictable status semantics</strong>: every team uses the same code
					enum.
				</li>
				<li>
					<strong>Streaming</strong> as a first-class concept, not a SSE / WebSocket
					bolt-on.
				</li>
			</ul>

			<h2>Common interview questions</h2>
			<ul>
				<li>
					<strong>What's the relationship between gRPC and protobuf?</strong> Protobuf
					is the schema and serialisation format; gRPC is the transport that carries
					protobuf messages over HTTP/2.
				</li>
				<li>
					<strong>Why does protobuf use field tag numbers?</strong> So the wire format
					stays compact and stable. You can rename fields without breaking the wire
					format. Reusing or removing tags breaks compatibility, so don't.
				</li>
				<li>
					<strong>Why can't a browser call gRPC directly?</strong> gRPC uses HTTP/2
					trailers and binary framing that browsers don't expose to JavaScript. The
					workaround is gRPC-Web (proxy) or a BFF that speaks gRPC server-side and
					normal HTTP/JSON to the browser.
				</li>
				<li>
					<strong>How do you handle backwards-incompatible API changes in protobuf?</strong>{" "}
					Add new fields with new tag numbers. Mark removed tags as
					<code>reserved</code>. Deprecate methods rather than rename. Old clients
					ignore unknown fields, so additive change is safe.
				</li>
			</ul>
		</TopicLayout>
	);
}
