import { describe, expect, test } from "bun:test"
import * as errors from "@superbuilders/errors"
import * as logger from "@superbuilders/slog"
import { createDocument } from "@/stimulus/dom"
import { extractYouTubeVideos } from "@/stimulus/video-extractor"

function requireElement(element: Element | null, context: string): Element {
	if (!element) {
		logger.error("video extractor test missing element", { context })
		throw errors.new("video extractor test missing element")
	}
	return element
}

describe("extractYouTubeVideos", () => {
	test("removes instructional callouts and extracts embeds", () => {
		const document = createDocument(`
			<div id="content">
				<h5>Watch the following videos to learn more:</h5>
				<div><iframe src="https://www.youtube.com/embed/AAAAAAAAAAA?rel=0"></iframe></div>
				<div><iframe src="https://www.youtube.com/embed/BBBBBBBBBBB"></iframe></div>
			</div>
		`)
		const content = requireElement(
			document.getElementById("content"),
			"content"
		)
		const videos = extractYouTubeVideos(content)
		expect(videos.length).toBe(2)
		expect(videos[0].youtubeId).toBe("AAAAAAAAAAA")
		expect(videos[0].order).toBe(1)
		expect(videos[1].youtubeId).toBe("BBBBBBBBBBB")
		expect(videos[1].order).toBe(2)
		const remainingCallout = content.textContent
		if (typeof remainingCallout !== "string") {
			logger.error("video extractor test missing text content", {
				stage: "callout removal"
			})
			throw errors.new("video extractor test missing text content")
		}
		expect(remainingCallout.includes("Watch the following")).toBeFalse()
		expect(content.querySelector("iframe")).toBeNull()
	})

	test("retains instructions when no embeds follow", () => {
		const document = createDocument(`
			<div id="content">
				<h5>Watch the following videos to learn more:</h5>
				<p>No videos available.</p>
			</div>
		`)
		const content = requireElement(
			document.getElementById("content"),
			"content"
		)
		const videos = extractYouTubeVideos(content)
		expect(videos.length).toBe(0)
		const remainingCallout = content.textContent
		if (typeof remainingCallout !== "string") {
			logger.error("video extractor test missing text content", {
				stage: "no-video"
			})
			throw errors.new("video extractor test missing text content")
		}
		expect(remainingCallout.includes("Watch the following videos")).toBeTrue()
	})

	test("removes variant instructional phrases", () => {
		const document = createDocument(`
			<div id="content">
				<h5>Watch the following videos as you read the story:</h5>
				<div><iframe src="https://www.youtube.com/embed/CCCCCCCCCCC"></iframe></div>
				<h5><span>Watch the following videos before you read the graphic novel:</span></h5>
				<div><iframe src="https://www.youtube.com/embed/DDDDDDDDDDD"></iframe></div>
			</div>
		`)
		const content = requireElement(
			document.getElementById("content"),
			"content"
		)
		const videos = extractYouTubeVideos(content)
		expect(videos.length).toBe(2)
		expect(
			content.textContent?.toLowerCase().includes("watch the following")
		).toBeFalse()
	})
})
