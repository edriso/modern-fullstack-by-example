import { Callout } from "./Callout";

/**
 * Marker placeholder used while a topic page is still being written.
 * It keeps every sidebar link clickable and gives a clear progress signal
 * instead of a 404.
 */
export function Stub({ what }: { what: string }) {
	return (
		<Callout kind="note" title="Coming next">
			<p>
				The full {what} page is still being written. The sidebar order is the planned
				reading order, so feel free to skip ahead and check back.
			</p>
		</Callout>
	);
}
