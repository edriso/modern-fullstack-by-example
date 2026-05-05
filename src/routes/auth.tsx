import { createFileRoute } from "@tanstack/react-router";
import { Callout } from "../components/Callout";
import { CodeBlock } from "../components/CodeBlock";
import { Compare } from "../components/Compare";
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
			tagline="bcrypt, JWT signing and verification, and session cookies done right. Three pieces, three jobs, easy to mix up."
		>
			<p>
				Authentication is the area where small mistakes turn into headlines. Three
				separate pieces work together: how passwords are stored, how the server proves
				who you are, and how the browser remembers it across requests. We'll do them
				one at a time.
			</p>

			<h2>1. Password hashing</h2>
			<p>
				A password should never be stored in plain text. It should not even be
				reversible from what's stored. The standard tool is a slow, salted hash
				function. The two you should know by name:
			</p>
			<ul>
				<li>
					<strong>bcrypt</strong>: the workhorse since the 90s. Tunable cost factor.
					Battle-tested.
				</li>
				<li>
					<strong>argon2id</strong>: the modern winner of the password-hashing
					competition. Better resistance to GPU and side-channel attacks. Slightly
					more setup.
				</li>
			</ul>
			<p>
				Either is fine for almost every project. <strong>What you must not do</strong>:
				use SHA-256, MD5, or any plain hash function. Those are designed to be fast.
				Speed is exactly what you don't want here.
			</p>

			<Compare
				left={{
					title: "Wrong: SHA-256 with a fixed salt",
					body: (
						<CodeBlock lang="ts">{`function hash(password: string) {
  return createHash("sha256")
    .update(password + "salt")
    .digest("hex");
}`}</CodeBlock>
					),
				}}
				right={{
					title: "Right: bcrypt with a cost factor",
					body: (
						<CodeBlock lang="ts">{`import bcrypt from "bcryptjs";

function hash(password: string) {
  // Cost 12 is the typical production target.
  // Each step doubles the time. Tune for ~250 ms.
  return bcrypt.hash(password, 12);
}

function verify(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}`}</CodeBlock>
					),
				}}
			/>

			<Callout kind="tip" title="Why slow is the point">
				<p>
					If your hash takes 250 ms, a legitimate user pays 250 ms once at login. An
					attacker with a stolen DB has to spend 250 ms <em>per password guess</em>.
					Multiply by a billion-entry wordlist and you have turned an instant break
					into a multi-decade brute force.
				</p>
			</Callout>

			<h3>Salts, automatically</h3>
			<p>
				bcrypt and argon2 generate a random salt per password and store it inside the
				hash string. Same password, different users, completely different stored
				values. You don't manage salts yourself; that is the library's job.
			</p>
			<CodeBlock lang="text">{`bcrypt hash format:
$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW
   |  | |---salt----||---------hash---------|
   |  └── cost (2^12 rounds)
   └──── algorithm (2b is the modern bcrypt variant)`}</CodeBlock>

			<h3>Migrating off a weak hash</h3>
			<p>
				What if you inherit a database with SHA-256 hashes? You don't have plaintext
				passwords, so you can't just bulk-rehash. The pattern: detect the legacy format
				on login, verify the old way, then immediately re-hash with bcrypt and update
				the row. Users get migrated automatically as they log in.
			</p>
			<CodeBlock lang="ts">{`async function login(email: string, password: string) {
  const user = await db.users.findByEmail(email);
  if (!user) throw new UnauthenticatedError("Invalid email or password");

  // Legacy format: 64 hex chars (SHA-256 output).
  // bcrypt output starts with $2 and is 60 chars. Unambiguous.
  if (/^[a-f0-9]{64}$/.test(user.passwordHash)) {
    const candidate = createHash("sha256").update(password + "salt").digest("hex");
    if (candidate !== user.passwordHash) {
      throw new UnauthenticatedError("Invalid email or password");
    }
    // Plaintext is in scope right now. Take advantage and rehash.
    const upgraded = await bcrypt.hash(password, 12);
    await db.users.update(user.id, { passwordHash: upgraded });
    return signSessionToken(user);
  }

  // Modern format: bcrypt compare.
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new UnauthenticatedError("Invalid email or password");
  return signSessionToken(user);
}`}</CodeBlock>

			<h2>2. JWT: how the server proves who you are</h2>
			<p>
				A JWT (JSON Web Token) is three base64-encoded parts joined by dots:
				{" "}
				<code>header.payload.signature</code>. The header says which algorithm. The
				payload is your data ("userId is u_1, role is admin, expires in 7 days"). The
				signature is the result of signing <code>header.payload</code> with a secret
				only the server knows.
			</p>
			<CodeBlock lang="text">{`eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ1XzEifQ.WuCk...
└──── header ────┘└──── payload ────┘└── signature ──┘

decoded header:  { "alg": "HS256", "typ": "JWT" }
decoded payload: { "userId": "u_1", "exp": 1741234567 }`}</CodeBlock>
			<p>
				Anyone can read the payload. Only someone with the secret can produce a valid
				signature. The server verifies the signature on every request before trusting
				the payload.
			</p>

			<h3>Five rules to follow</h3>
			<ol>
				<li>
					<strong>Pin the algorithm.</strong> Always pass{" "}
					<code>algorithms: ["HS256"]</code> (or the algorithm you actually use) to
					{" "}
					<code>jwt.verify</code>. Without it, older library versions accepted{" "}
					<code>alg: none</code>: a token with no signature.
				</li>
				<li>
					<strong>Set <code>iss</code> (issuer) and <code>aud</code> (audience)</strong>{" "}
					claims, and verify them. They prevent a token issued for one service from
					being accepted by another.
				</li>
				<li>
					<strong>Expire tokens.</strong> Set <code>exp</code>. A leaked token without
					expiry is forever.
				</li>
				<li>
					<strong>Don't put secrets in the payload.</strong> Anyone can decode it.
				</li>
				<li>
					<strong>One issuer.</strong> Only the API service signs tokens. The BFF and
					the client treat tokens as opaque.
				</li>
			</ol>

			<CodeBlock lang="ts" filename="middleware/auth.ts">{`import jwt from "jsonwebtoken";

const JWT_ISSUER = "chirp-api";
const JWT_AUDIENCE = "chirp-clients";

function loadJwtSecret(): string {
  const secret = process.env.GRPC_JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("GRPC_JWT_SECRET must be set in production");
    }
    // Stable dev secret. Different from any value the BFF could share.
    return "dev-only-jwt-secret-not-for-production";
  }
  return secret;
}

const JWT_SECRET = loadJwtSecret();

export function signSessionToken(ctx: { userId: string; role: string }) {
  return jwt.sign(
    { userId: ctx.userId, role: ctx.role },
    JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "7d",
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    },
  );
}

export function validateSessionToken(token: string) {
  // Without 'algorithms' the verifier might accept alg:none. Always pin.
  return jwt.verify(token, JWT_SECRET, {
    algorithms: ["HS256"],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  }) as { userId: string; role: string };
}`}</CodeBlock>

			<h2>3. Sessions: how the browser remembers</h2>
			<p>
				The JWT alone doesn't help: how does the browser send it on every request? Two
				common answers:
			</p>
			<ol>
				<li>
					<strong>Bearer header</strong>: client stores the token in memory or
					localStorage and sends <code>Authorization: Bearer ...</code> with each
					request. Used by many SPAs and mobile apps. Vulnerable to XSS leaks.
				</li>
				<li>
					<strong>HTTP-only cookie</strong>: server sets a cookie marked{" "}
					<code>httpOnly</code> + <code>secure</code> + <code>sameSite=lax</code>.
					Browser sends it automatically on same-origin requests. JavaScript can't
					read it. Vulnerable to CSRF if not protected.
				</li>
			</ol>
			<p>
				Modern web apps usually go with the cookie approach because it survives XSS
				better. The BFF reads the cookie, finds the token inside, and forwards it on
				the call to the API.
			</p>

			<h3>iron-session: encrypted cookie sessions</h3>
			<p>
				<code>iron-session</code> (used by TanStack Start and Next.js) lets you store
				a small object in a cookie. The cookie is encrypted with a server-side secret
				so the browser can't read or tamper with it. You get a normal-looking object
				on the server.
			</p>
			<CodeBlock lang="ts" filename="src/lib/session.server.ts">{`import { useSession } from "@tanstack/react-start/server";

export interface SessionData {
  userId: string;
  username: string;
  // The API-issued JWT, opaque to the BFF. Forwarded on every gRPC call.
  sessionToken: string;
}

export function useAppSession() {
  return useSession<SessionData>({
    password: process.env.SESSION_SECRET!,
    name: "chirp-session",
    cookie: {
      httpOnly: true,                                  // not readable by JS
      secure: process.env.NODE_ENV === "production",   // HTTPS only in prod
      sameSite: "lax",                                 // CSRF mitigation
      maxAge: 60 * 60 * 24 * 7,                        // 7 days
    },
  });
}`}</CodeBlock>

			<h2>Putting it all together</h2>
			<CodeBlock lang="text">{`Login flow:
1. Browser POST /login { email, password }
2. BFF receives, calls API.login over gRPC
3. API: bcrypt.compare(password, user.passwordHash)
4. API: jwt.sign({ userId, role }, secret) -> sessionToken
5. API returns { userId, sessionToken }
6. BFF stores sessionToken in iron-session cookie
7. BFF responds, browser stores cookie

Subsequent request:
1. Browser GET /feed (cookie sent automatically)
2. BFF reads cookie, gets sessionToken
3. BFF calls API.getFeed({ sessionToken })
4. API: jwt.verify(sessionToken)  ->  { userId, role }
5. API queries DB on behalf of userId, returns feed
6. BFF shapes response, sends to browser`}</CodeBlock>

			<h2>Attacks to know about</h2>
			<table>
				<thead>
					<tr>
						<th>Attack</th>
						<th>What it is</th>
						<th>Defence</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Credential stuffing</td>
						<td>Reuse of leaked password lists</td>
						<td>Rate limiting on login, MFA</td>
					</tr>
					<tr>
						<td>Brute force</td>
						<td>Guessing one user's password</td>
						<td>Rate limiting, slow hash (bcrypt cost)</td>
					</tr>
					<tr>
						<td>Rainbow tables</td>
						<td>Precomputed hash lookups</td>
						<td>Per-password salt (free with bcrypt/argon2)</td>
					</tr>
					<tr>
						<td>JWT alg:none</td>
						<td>Token with no signature accepted</td>
						<td>Pin <code>algorithms</code> on verify</td>
					</tr>
					<tr>
						<td>Token theft via XSS</td>
						<td>Script reads localStorage</td>
						<td>HTTP-only cookies + Content Security Policy</td>
					</tr>
					<tr>
						<td>CSRF</td>
						<td>Other site triggers a state-changing request</td>
						<td>SameSite cookie + CSRF tokens for forms</td>
					</tr>
					<tr>
						<td>Session fixation</td>
						<td>Attacker pre-creates a session, tricks user into it</td>
						<td>Regenerate session id on login</td>
					</tr>
				</tbody>
			</table>

			<h2>Common interview questions</h2>
			<ul>
				<li>
					<strong>Why bcrypt instead of SHA-256?</strong> Speed. SHA-256 is fast on
					purpose; bcrypt is slow on purpose. A slow hash makes brute-forcing a stolen
					DB infeasible. Bcrypt also salts per password automatically.
				</li>
				<li>
					<strong>What's in a JWT and what isn't safe to put in one?</strong> Header,
					payload, signature. Header and payload are base64-encoded, not encrypted.
					Anyone can read the payload. Don't put secrets, password hashes, or PII you
					wouldn't put in a URL.
				</li>
				<li>
					<strong>Why pin <code>algorithms</code> on <code>jwt.verify</code>?</strong>{" "}
					Without pinning, a token signed with <code>alg: none</code> (no signature)
					used to be accepted by some libraries. Pinning makes the verifier reject
					anything that is not your real algorithm.
				</li>
				<li>
					<strong>Cookies vs localStorage for tokens?</strong> HTTP-only cookies
					survive XSS (script can't read them) but need CSRF protection. localStorage
					tokens survive CSRF (no automatic sending) but are stolen by any XSS. Most
					modern apps prefer HTTP-only cookies + SameSite=lax + a CSRF check on
					mutating endpoints.
				</li>
				<li>
					<strong>Should the BFF mint its own JWTs?</strong> No. One issuer. The BFF
					stores the token the API issued and forwards it. If the BFF could mint, it
					can stamp any role on any user, and the boundary is gone.
				</li>
			</ul>
		</TopicLayout>
	);
}
