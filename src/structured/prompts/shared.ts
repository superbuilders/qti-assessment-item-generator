import type { AiContextEnvelope, ImageContext } from "../types"

export function formatUnifiedContextSections(envelope: AiContextEnvelope, imageContext: ImageContext): string {
	const primary = `## Primary Source (Perseus JSON | HTML)\n\`\`\`json\n${envelope.primaryContent}\n\`\`\``

	const supplementarySectionEntries = envelope.supplementaryContent.map((content: string, i: number) => {
		return `### Supplementary Content Block ${i + 1}\n\`\`\`\n${content}\n\`\`\``
	})

	const supplementary = `## Supplementary Content\n${supplementarySectionEntries.length > 0 ? supplementarySectionEntries.join("\n\n") : "No supplementary content provided."}`

	const rasterList = imageContext.imageUrls.map((url: string) => `- ${url}`).join("\n") || "No raster images provided."
	const raster = `## Associated Raster Images (Vision Input)\nThe following URLs correspond to raster images available to your vision model:\n${rasterList}`

	return `${primary}\n\n${supplementary}\n\n${raster}`
}
