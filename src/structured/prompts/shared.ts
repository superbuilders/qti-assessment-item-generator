import type { AiContextEnvelope } from "../types"
import type { ImageContext } from "../ai-context-builder"

function isSvgOrXml(content: string): boolean {
	const trimmed = content.trim()
	return trimmed.startsWith("<") && trimmed.endsWith(">")
}

export function formatUnifiedContextSections(envelope: AiContextEnvelope, imageContext: ImageContext): string {
	const primary = `## Primary Source (Perseus JSON | HTML)\n\`\`\`json\n${envelope.primaryContent}\n\`\`\``

	const supplementarySectionEntries = envelope.supplementaryContent.map((content, i) => {
		const language = isSvgOrXml(content) ? "xml" : "text"
		return `### Supplementary Content Block ${i + 1}\n\`\`\`${language}\n${content}\n\`\`\``
	})

	const supplementary = `## Supplementary Content\n${supplementarySectionEntries.length > 0 ? supplementarySectionEntries.join("\n\n") : "No supplementary content provided."}`

	const rasterList = imageContext.rasterImageUrls
		.map((url) => `- ${url}`)
		.join("\n") || "No raster images provided."
	const raster = `## Associated Raster Images (Vision Input)\nThe following URLs correspond to raster images available to your vision model:\n${rasterList}`

	return `${primary}\n\n${supplementary}\n\n${raster}`
}


