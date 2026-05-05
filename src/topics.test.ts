import { describe, expect, it } from "vitest";
import { TOPICS, getNeighbors, getTopicIndex, groupedTopics } from "./topics";

describe("topics registry", () => {
	it("starts with the welcome page at slug /", () => {
		expect(TOPICS[0]?.slug).toBe("/");
	});

	it("has unique slugs", () => {
		const slugs = TOPICS.map((t) => t.slug);
		expect(new Set(slugs).size).toBe(slugs.length);
	});

	it("has a non-empty title and tagline for every topic", () => {
		for (const topic of TOPICS) {
			expect(topic.title.length).toBeGreaterThan(0);
			expect(topic.tagline.length).toBeGreaterThan(0);
			expect(topic.group.length).toBeGreaterThan(0);
		}
	});
});

describe("getTopicIndex", () => {
	it("returns the index of a known slug", () => {
		expect(getTopicIndex("/")).toBe(0);
		expect(getTopicIndex(TOPICS[1]!.slug)).toBe(1);
	});

	it("returns -1 for an unknown slug", () => {
		expect(getTopicIndex("/does-not-exist")).toBe(-1);
	});
});

describe("getNeighbors", () => {
	it("returns no prev for the first topic", () => {
		const { prev, next } = getNeighbors("/");
		expect(prev).toBeUndefined();
		expect(next).toBeDefined();
		expect(next?.slug).toBe(TOPICS[1]?.slug);
	});

	it("returns no next for the last topic", () => {
		const last = TOPICS[TOPICS.length - 1]!;
		const { prev, next } = getNeighbors(last.slug);
		expect(next).toBeUndefined();
		expect(prev?.slug).toBe(TOPICS[TOPICS.length - 2]?.slug);
	});

	it("returns both neighbors for a middle topic", () => {
		const middleSlug = TOPICS[3]!.slug;
		const { prev, next } = getNeighbors(middleSlug);
		expect(prev?.slug).toBe(TOPICS[2]?.slug);
		expect(next?.slug).toBe(TOPICS[4]?.slug);
	});

	it("returns no neighbors for an unknown slug", () => {
		const { prev, next } = getNeighbors("/nope");
		expect(prev).toBeUndefined();
		expect(next).toBeUndefined();
	});
});

describe("groupedTopics", () => {
	it("preserves the order topics appear in TOPICS", () => {
		const groups = groupedTopics();
		const flat = groups.flatMap((g) => g.items);
		expect(flat.map((t) => t.slug)).toEqual(TOPICS.map((t) => t.slug));
	});

	it("collapses adjacent topics with the same group label into one section", () => {
		const groups = groupedTopics();
		// Each group label should only ever appear once in this array of section
		// names — the function is built so that same-named groups merge.
		const names = groups.map((g) => g.group);
		expect(new Set(names).size).toBe(names.length);
	});

	it("keeps every topic in exactly one group", () => {
		const groups = groupedTopics();
		const allItems = groups.flatMap((g) => g.items);
		expect(allItems).toHaveLength(TOPICS.length);
	});
});
