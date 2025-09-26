import { expect } from "bun:test"

export function expectSortedUrls(envelope: { multimodalImageUrls: string[] }): void {
	expect([...envelope.multimodalImageUrls]).toEqual([...envelope.multimodalImageUrls].sort())
}

export function expectSupplementaryContentCount(envelope: { supplementaryContent: string[] }, count: number): void {
	expect(envelope.supplementaryContent).toHaveLength(count)
}

export function expectEmptyPayloads(envelope: { multimodalImagePayloads: unknown[] }): void {
	expect(envelope.multimodalImagePayloads).toEqual([])
}
