// Defines TypeScript-only types for core library contracts. No runtime parsing.

export interface AiContextEnvelope {
	primaryContent: string      // The primary source content (Perseus JSON or HTML).
	supplementaryContent: string[] // An array of supplementary content strings, like fetched SVG markup.
	rasterImageUrls: string[] // http/https URLs for raster images (png/jpeg/gif)
}
