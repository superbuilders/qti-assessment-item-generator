import { expect } from "bun:test"

export function expectSortedUrls(envelope: { rasterImageUrls: string[]; vectorImageUrls: string[] }): void {
	expect([...envelope.rasterImageUrls]).toEqual([...envelope.rasterImageUrls].sort())
	expect([...envelope.vectorImageUrls]).toEqual([...envelope.vectorImageUrls].sort())
}

export function expectContextBlocks(envelope: { context: string[] }, count: number): void {
	expect(envelope.context).toHaveLength(count)
}


