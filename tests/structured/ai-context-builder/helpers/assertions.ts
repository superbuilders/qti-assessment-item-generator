import { expect } from "bun:test"

export function expectSortedUrls(envelope: { rasterImageUrls: string[] }): void {
	expect([...envelope.rasterImageUrls]).toEqual([...envelope.rasterImageUrls].sort())
}

export function expectSupplementaryContentCount(envelope: { supplementaryContent: string[] }, count: number): void {
	expect(envelope.supplementaryContent).toHaveLength(count)
}
