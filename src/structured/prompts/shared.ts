import type { AiContextEnvelope } from "../types"
import type { ImageContext } from "../ai-context-builder"

function isSvg(content: string): boolean {
	const t = content.trim()
	return t.startsWith("<svg") || t.startsWith("<?xml")
}

export function formatUnifiedContextSections(envelope: AiContextEnvelope, imageContext: ImageContext): string {
	const primary = `## Primary Source (Perseus JSON | HTML)\n\`\`\`json\n${envelope.context[0]}\n\`\`\``

	const vectorSectionEntries = envelope.context
		.slice(1)
		.filter(isSvg)
		.map((svg, i) => `### SVG ${i + 1}\n\`\`\`xml\n${svg}\n\`\`\``)

	const vector = `## Associated Vector Images (SVG Content)\n${vectorSectionEntries.length > 0 ? vectorSectionEntries.join("\n\n") : "No SVG images provided."}`

	const rasterList = imageContext.rasterImageUrls
		.map((url) => `- ${url}`)
		.join("\n") || "No raster images provided."
	const raster = `## Associated Raster Images (Vision Input)\nThe following URLs correspond to raster images available to your vision model:\n${rasterList}`

	return `${primary}\n\n${vector}\n\n${raster}`
}


