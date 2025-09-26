// Defines TypeScript-only types for core library contracts. No runtime parsing.

export interface AiContextEnvelope {
	primaryContent: string // Primary source (Perseus JSON or HTML)
	supplementaryContent: string[] // SVG texts and other supplementary content
	rasterImageUrls: string[] // http/https URLs for raster images (png/jpeg/gif)
}
